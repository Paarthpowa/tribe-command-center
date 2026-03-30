/**
 * Music Fine-Tuning — Tribe Command Center
 *
 * For tunetank-epic and oblivion, generates 3 variants each:
 *   A) Lower overall volume
 *   B) Sidechain duck (gentle) — auto-lower music when voice is detected
 *   C) Sidechain duck (aggressive) — stronger ducking for clear voice priority
 *
 * Usage: npx tsx scripts/build-music-finetune.ts
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_DIR = path.resolve(__dirname, '..');
const RECORDINGS_DIR = path.resolve(PROJECT_DIR, 'recordings');
const SEGMENTS_DIR = path.resolve(RECORDINGS_DIR, 'segments');
const MUSIC_DIR = path.resolve(RECORDINGS_DIR, 'music');

const SEGMENTS = [
  '01-intro-voiced.mp4',
  '02-dashboard-voiced.mp4',
  '03-intel-map-voiced.mp4',
  '04-goals-voiced.mp4',
  '05-fleets-reputation-voiced.mp4',
  '06-outro-voiced.mp4',
];

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function exec(cmd: string, label?: string): string {
  if (label) console.log(`  ⚙️  ${label}`);
  try {
    return execSync(cmd, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e: any) {
    if (e.stderr) {
      const lastLines = e.stderr.split('\n').slice(-10).join('\n');
      if (lastLines.includes('muxing overhead') || lastLines.includes('speed=')) {
        return e.stdout || '';
      }
      console.error(`  ❌ STDERR: ${lastLines}`);
    }
    throw e;
  }
}

function getDuration(filePath: string): number {
  const out = execSync(
    `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`,
    { encoding: 'utf-8' },
  );
  return parseFloat(out.trim());
}

// ═══════════════════════════════════════════
// Build base: video track + clean voiceover (no music)
// ═══════════════════════════════════════════

function buildBase(): { baseVideo: string; voiceTrack: string; videoDur: number } {
  const existingTrailer = path.join(RECORDINGS_DIR, 'tribe-command-center-trailer-v3.mp4');
  if (!fs.existsSync(existingTrailer)) {
    console.error('❌ No existing trailer-v2. Run build-trailer.ts first!');
    process.exit(1);
  }

  // Extract video only
  const videoOnly = path.join(SEGMENTS_DIR, '_ft_video.mp4');
  exec(`ffmpeg -y -i "${existingTrailer}" -c:v copy -an "${videoOnly}"`, 'Extracting video track');

  // Build clean voiceover: silence + segment audio + silence
  const titleSilence = path.join(SEGMENTS_DIR, '_ft_title_s.wav');
  const outroSilence = path.join(SEGMENTS_DIR, '_ft_outro_s.wav');
  exec(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 4 "${titleSilence}"`, 'Title silence (4s)');
  exec(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 6 "${outroSilence}"`, 'Outro silence (6s)');

  const audioFiles: string[] = [titleSilence];
  for (const s of SEGMENTS) {
    const segPath = path.join(SEGMENTS_DIR, s);
    if (!fs.existsSync(segPath)) { console.error(`❌ Missing: ${s}`); process.exit(1); }
    const out = path.join(SEGMENTS_DIR, `_ft_a_${s.replace('.mp4', '.wav')}`);
    exec(`ffmpeg -y -i "${segPath}" -vn -acodec pcm_s16le -ar 44100 -ac 2 "${out}"`, `Audio: ${s}`);
    audioFiles.push(out);
  }
  audioFiles.push(outroSilence);

  const concatTxt = path.join(SEGMENTS_DIR, '_ft_audio_concat.txt');
  fs.writeFileSync(concatTxt, audioFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n'));

  const voiceTrack = path.join(SEGMENTS_DIR, '_ft_voiceover.wav');
  exec(`ffmpeg -y -f concat -safe 0 -i "${concatTxt}" -c:a pcm_s16le "${voiceTrack}"`, 'Concat voiceover');

  // Mux for base
  const baseVideo = path.join(SEGMENTS_DIR, '_ft_base.mp4');
  exec(
    `ffmpeg -y -i "${videoOnly}" -i "${voiceTrack}" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "${baseVideo}"`,
    'Mux base video + voiceover',
  );

  const videoDur = getDuration(baseVideo);
  console.log(`  📦 Base: ${videoDur.toFixed(1)}s, ${(fs.statSync(baseVideo).size / 1024 / 1024).toFixed(1)} MB\n`);

  // Cleanup intermediates (keep voiceTrack and videoOnly for later)
  fs.unlinkSync(titleSilence);
  fs.unlinkSync(outroSilence);
  fs.unlinkSync(concatTxt);
  for (const f of audioFiles) { if (f.includes('_ft_a_')) try { fs.unlinkSync(f); } catch {} }

  return { baseVideo, voiceTrack, videoDur };
}

// ═══════════════════════════════════════════
// Variant builders
// ═══════════════════════════════════════════

interface TrackDef {
  name: string;
  file: string;
  /** Original volume from previous round */
  origVol: number;
  /** Lowered volume for variant A */
  quietVol: number;
  fadeIn: number;
  fadeOut: number;
}

const TRACKS: TrackDef[] = [
  {
    name: 'tunetank-epic',
    file: 'tunetank-cinematic-epic-sci-fi-trailer-music-348470.mp3',
    origVol: 0.10,
    quietVol: 0.065,    // ~35% quieter overall
    fadeIn: 3.0,
    fadeOut: 6.0,
  },
  {
    name: 'oblivion',
    file: 'emmraan-oblivion-273975.mp3',
    origVol: 0.13,
    quietVol: 0.085,    // ~35% quieter overall
    fadeIn: 3.5,
    fadeOut: 5.0,
  },
];

/**
 * Variant A: Simply lower overall music volume.
 * The simplest approach — reduces music everywhere equally.
 */
function buildVariantA(
  baseVideo: string, track: TrackDef, videoDur: number,
): string {
  const musicPath = path.join(MUSIC_DIR, track.file);
  const musicDur = getDuration(musicPath);
  const trimEnd = Math.min(musicDur, videoDur);
  const fadeOutSt = Math.max(0, trimEnd - track.fadeOut);

  const output = path.join(RECORDINGS_DIR, `trailer-${track.name}-A-quiet.mp4`);

  exec(
    `ffmpeg -y -i "${baseVideo}" -i "${musicPath}" ` +
    `-filter_complex "` +
      `[0:a]volume=1.0,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[voice];` +
      `[1:a]atrim=0:${trimEnd.toFixed(1)},asetpts=PTS-STARTPTS,` +
        `volume=${track.quietVol},` +
        `afade=t=in:st=0:d=${track.fadeIn},` +
        `afade=t=out:st=${fadeOutSt.toFixed(1)}:d=${track.fadeOut},` +
        `aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[music];` +
      `[voice][music]amix=inputs=2:duration=first:dropout_transition=3:normalize=0[aout]` +
    `" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -movflags +faststart "${output}"`,
    `${track.name} A: quiet (vol=${track.quietVol})`,
  );

  return applyPolish(output, track.name, 'A-quiet');
}

/**
 * Variant B: Gentle sidechain ducking.
 * Uses sidechaincompress: voice signal controls a compressor on the music.
 * When voice is loud → music dips. When voice is silent → music at full vol.
 * Gentle settings: moderate ratio, slow attack for natural feel.
 */
function buildVariantB(
  baseVideo: string, voiceTrack: string, track: TrackDef, videoDur: number,
): string {
  const musicPath = path.join(MUSIC_DIR, track.file);
  const musicDur = getDuration(musicPath);
  const trimEnd = Math.min(musicDur, videoDur);
  const fadeOutSt = Math.max(0, trimEnd - track.fadeOut);

  const output = path.join(RECORDINGS_DIR, `trailer-${track.name}-B-duck-gentle.mp4`);

  // sidechaincompress parameters (gentle):
  //   level_in=1    — input gain
  //   threshold=0.02 — voice level that triggers ducking (low = more sensitive)
  //   ratio=3       — compression ratio (3:1 = moderate)
  //   attack=200    — 200ms attack (slow, natural swell down)
  //   release=800   — 800ms release (music comes back smoothly)
  //   makeup=1      — no makeup gain
  //   knee=4        — soft knee for gradual transition

  exec(
    `ffmpeg -y -i "${baseVideo}" -i "${musicPath}" -i "${voiceTrack}" ` +
    `-filter_complex "` +
      `[0:a]volume=1.0,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[voice];` +
      `[1:a]atrim=0:${trimEnd.toFixed(1)},asetpts=PTS-STARTPTS,` +
        `volume=${track.origVol},` +
        `afade=t=in:st=0:d=${track.fadeIn},` +
        `afade=t=out:st=${fadeOutSt.toFixed(1)}:d=${track.fadeOut},` +
        `aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[music];` +
      `[2:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[sc];` +
      `[music][sc]sidechaincompress=level_in=1:threshold=0.015:ratio=3:attack=200:release=800:makeup=1:knee=4[ducked];` +
      `[voice][ducked]amix=inputs=2:duration=first:dropout_transition=3:normalize=0[aout]` +
    `" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -movflags +faststart "${output}"`,
    `${track.name} B: gentle duck (ratio=3, attack=200ms)`,
  );

  return applyPolish(output, track.name, 'B-duck-gentle');
}

/**
 * Variant C: Aggressive sidechain ducking.
 * Stronger compression: higher ratio, faster attack, lower threshold.
 * Voice clearly dominates — music almost disappears during speech.
 */
function buildVariantC(
  baseVideo: string, voiceTrack: string, track: TrackDef, videoDur: number,
): string {
  const musicPath = path.join(MUSIC_DIR, track.file);
  const musicDur = getDuration(musicPath);
  const trimEnd = Math.min(musicDur, videoDur);
  const fadeOutSt = Math.max(0, trimEnd - track.fadeOut);

  const output = path.join(RECORDINGS_DIR, `trailer-${track.name}-C-duck-strong.mp4`);

  // sidechaincompress parameters (aggressive):
  //   threshold=0.008 — very sensitive to voice
  //   ratio=6         — strong compression (6:1)
  //   attack=80       — fast attack (music ducks quickly)
  //   release=600     — 600ms release
  //   knee=6          — softer knee to still sound natural

  exec(
    `ffmpeg -y -i "${baseVideo}" -i "${musicPath}" -i "${voiceTrack}" ` +
    `-filter_complex "` +
      `[0:a]volume=1.0,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[voice];` +
      `[1:a]atrim=0:${trimEnd.toFixed(1)},asetpts=PTS-STARTPTS,` +
        `volume=${track.origVol},` +
        `afade=t=in:st=0:d=${track.fadeIn},` +
        `afade=t=out:st=${fadeOutSt.toFixed(1)}:d=${track.fadeOut},` +
        `aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[music];` +
      `[2:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[sc];` +
      `[music][sc]sidechaincompress=level_in=1:threshold=0.008:ratio=6:attack=80:release=600:makeup=1:knee=6[ducked];` +
      `[voice][ducked]amix=inputs=2:duration=first:dropout_transition=3:normalize=0[aout]` +
    `" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -movflags +faststart "${output}"`,
    `${track.name} C: strong duck (ratio=6, attack=80ms)`,
  );

  return applyPolish(output, track.name, 'C-duck-strong');
}

/**
 * Final polish: color grade + global fades (same as build-trailer)
 */
function applyPolish(inputPath: string, trackName: string, variant: string): string {
  const dur = getDuration(inputPath);
  const finalOutput = path.join(
    RECORDINGS_DIR,
    `tribe-command-center-trailer-v3-${trackName}-${variant}.mp4`,
  );

  exec(
    `ffmpeg -y -i "${inputPath}" ` +
    `-vf "fade=t=in:st=0:d=1.5,fade=t=out:st=${(dur - 2).toFixed(1)}:d=2,eq=contrast=1.05:saturation=1.1" ` +
    `-af "afade=t=in:st=0:d=1,afade=t=out:st=${(dur - 2.5).toFixed(1)}:d=2.5" ` +
    `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart ` +
    `-c:a aac -b:a 192k "${finalOutput}"`,
    `Polish ${trackName}-${variant}`,
  );

  fs.unlinkSync(inputPath);

  const finalSize = (fs.statSync(finalOutput).size / 1024 / 1024).toFixed(2);
  const finalDur = getDuration(finalOutput);
  console.log(`  ✅ ${trackName}-${variant}: ${finalDur.toFixed(1)}s, ${finalSize} MB`);
  return finalOutput;
}

// ═══════════════════════════════════════════
// Main
// ═══════════════════════════════════════════

async function main() {
  console.log('════════════════════════════════════════════════════');
  console.log('  Music Fine-Tuning — 3 variants × 2 tracks');
  console.log('════════════════════════════════════════════════════');
  console.log('  A) Overall quieter music');
  console.log('  B) Sidechain duck (gentle) — music dips when voice speaks');
  console.log('  C) Sidechain duck (strong) — music nearly mutes during speech\n');

  console.log('📦 Building base video with clean voiceover...');
  const { baseVideo, voiceTrack, videoDur } = buildBase();

  const results: Array<{ label: string; path: string; size: string; dur: number }> = [];

  for (const track of TRACKS) {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`  🎵 ${track.name.toUpperCase()}`);
    console.log(`${'═'.repeat(50)}`);

    // A — global quiet
    const pA = buildVariantA(baseVideo, track, videoDur);
    results.push({
      label: `${track.name} A (quiet: vol=${track.quietVol})`,
      path: pA,
      size: (fs.statSync(pA).size / 1024 / 1024).toFixed(2),
      dur: getDuration(pA),
    });

    // B — gentle duck
    const pB = buildVariantB(baseVideo, voiceTrack, track, videoDur);
    results.push({
      label: `${track.name} B (gentle duck: ratio=3)`,
      path: pB,
      size: (fs.statSync(pB).size / 1024 / 1024).toFixed(2),
      dur: getDuration(pB),
    });

    // C — strong duck
    const pC = buildVariantC(baseVideo, voiceTrack, track, videoDur);
    results.push({
      label: `${track.name} C (strong duck: ratio=6)`,
      path: pC,
      size: (fs.statSync(pC).size / 1024 / 1024).toFixed(2),
      dur: getDuration(pC),
    });
  }

  // Cleanup base files
  try { fs.unlinkSync(baseVideo); } catch {}
  try { fs.unlinkSync(voiceTrack); } catch {}
  try { fs.unlinkSync(path.join(SEGMENTS_DIR, '_ft_video.mp4')); } catch {}

  // Summary
  console.log('\n════════════════════════════════════════════════════');
  console.log('  ALL FINE-TUNED VARIANTS COMPLETE');
  console.log('════════════════════════════════════════════════════\n');

  for (const r of results) {
    const m = Math.floor(r.dur / 60);
    const s = Math.round(r.dur % 60).toString().padStart(2, '0');
    console.log(`  🎬 ${r.label}`);
    console.log(`     ${m}:${s}, ${r.size} MB — ${path.basename(r.path)}`);
  }

  console.log(`\n  A = celkovo tichsia hudba (rovnomerne vsade)`);
  console.log(`  B = gentle sidechain duck (hudba sa zjemni ked hovori hlas)`);
  console.log(`  C = strong sidechain duck (hudba sa stisi vyrazne pri hlase)\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
