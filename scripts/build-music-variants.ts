/**
 * Music Variant Builder — Tribe Command Center
 *
 * Takes the existing trailer (pre-music) and generates 4 versions,
 * each with a different background music track from recordings/music/.
 *
 * Usage: npx tsx scripts/build-music-variants.ts
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

// ═══════════════════════════════════════════
// Music track configs — each has a short name, filename,
// volume/delay settings tuned per track character
// ═══════════════════════════════════════════
interface MusicConfig {
  /** Short name for the output file */
  name: string;
  /** Filename in recordings/music/ */
  file: string;
  /** Base music volume (0.0 – 1.0). Cinematic tracks need lower, ambient higher */
  volume: number;
  /** Delay before music starts (seconds). Use to skip a loud intro or sync a drop */
  musicOffset: number;
  /** Trim from start of the music file (skip intro silence/noise) */
  trimStart: number;
  /** Fade-in duration */
  fadeIn: number;
  /** Fade-out duration */
  fadeOut: number;
  /** Notes about the track character */
  notes: string;
}

const MUSIC_TRACKS: MusicConfig[] = [
  {
    name: 'tunetank-epic',
    file: 'tunetank-cinematic-epic-sci-fi-trailer-music-348470.mp3',
    volume: 0.10,       // Epic trailer music — needs to stay well below voice
    musicOffset: 0,     // Start right away with the title card
    trimStart: 0,
    fadeIn: 3.0,
    fadeOut: 6.0,
    notes: 'Cinematic sci-fi epic — big swells, perfect for trailer energy',
  },
  {
    name: 'oblivion',
    file: 'emmraan-oblivion-273975.mp3',
    volume: 0.13,       // Ambient/chill — can be a touch louder
    musicOffset: 0,
    trimStart: 0,
    fadeIn: 3.5,
    fadeOut: 5.0,
    notes: 'Dark ambient — atmospheric, more subtle and moody',
  },
  {
    name: 'in-flight',
    file: 'jeremusic70-in-flight-301195.mp3',
    volume: 0.11,
    musicOffset: 0,
    trimStart: 0,
    fadeIn: 3.0,
    fadeOut: 5.0,
    notes: 'In Flight — uplifting, forward momentum feel',
  },
  {
    name: 'corporate-suspense',
    file: 'vasilyatsevich-corporate-power-suspense-sci-fi-background-145902.mp3',
    volume: 0.12,
    musicOffset: 0,
    trimStart: 0,
    fadeIn: 2.5,
    fadeOut: 5.0,
    notes: 'Corporate power/suspense — professional, sci-fi undertone',
  },
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
  const out = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`, { encoding: 'utf-8' });
  return parseFloat(out.trim());
}

// ═══════════════════════════════════════════
// Step 1: Build the base video (concat with zoom/labels/fades) WITHOUT music
// We reuse the existing concat from build-trailer if available, otherwise rebuild
// ═══════════════════════════════════════════

function getOrBuildBaseVideo(): string {
  const basePath = path.join(SEGMENTS_DIR, '_trailer_concat.mp4');

  // If the concat file already exists from the last build, use it
  if (fs.existsSync(basePath)) {
    console.log(`📦 Reusing existing base video: ${(fs.statSync(basePath).size / 1024 / 1024).toFixed(1)} MB`);
    return basePath;
  }

  // Otherwise we need to rebuild it — run the full build-trailer first
  console.log('⚠️  No base concat video found. Run build-trailer.ts first!');
  process.exit(1);
}

// ═══════════════════════════════════════════
// Step 2: Mix music into base video for each variant
// ═══════════════════════════════════════════

function buildVariant(baseVideo: string, cfg: MusicConfig, videoDur: number): string {
  const musicPath = path.join(MUSIC_DIR, cfg.file);
  if (!fs.existsSync(musicPath)) {
    console.error(`  ❌ Missing music: ${cfg.file}`);
    process.exit(1);
  }

  const musicDur = getDuration(musicPath);
  console.log(`\n🎵 [${cfg.name}] ${cfg.notes}`);
  console.log(`   Music: ${musicDur.toFixed(1)}s, Video: ${videoDur.toFixed(1)}s, Vol: ${cfg.volume}, FadeIn: ${cfg.fadeIn}s, FadeOut: ${cfg.fadeOut}s`);

  // Calculate how much music we need
  const musicNeeded = videoDur - cfg.musicOffset;
  const musicAvailable = musicDur - cfg.trimStart;

  let musicTrimEnd: number;
  if (musicAvailable >= musicNeeded) {
    // Trim to fit
    musicTrimEnd = cfg.trimStart + musicNeeded;
    console.log(`   ✂️  Trimming music at ${musicTrimEnd.toFixed(1)}s (${(musicAvailable - musicNeeded).toFixed(1)}s excess)`);
  } else {
    // Music is shorter — we'll let it fade out naturally
    musicTrimEnd = musicDur;
    console.log(`   ⚠️  Music is ${(musicNeeded - musicAvailable).toFixed(1)}s shorter — will fade out before video ends`);
  }

  // Build the audio filter:
  // 1. Extract voiceover (stream 0 audio)
  // 2. Process music: trim, adjust volume, fade in/out
  // 3. If music doesn't start at 0, add silence pad (adelay)
  // 4. Mix with amix (voice dominant)

  const fadeOutStart = Math.max(0, (musicTrimEnd - cfg.trimStart) - cfg.fadeOut);

  let musicFilter =
    `[1:a]atrim=${cfg.trimStart.toFixed(1)}:${musicTrimEnd.toFixed(1)},asetpts=PTS-STARTPTS,` +
    `volume=${cfg.volume},` +
    `afade=t=in:st=0:d=${cfg.fadeIn.toFixed(1)},` +
    `afade=t=out:st=${fadeOutStart.toFixed(1)}:d=${cfg.fadeOut.toFixed(1)},` +
    `aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo`;

  // Add delay if music should start later (e.g., skip title card silence)
  if (cfg.musicOffset > 0) {
    const delayMs = Math.round(cfg.musicOffset * 1000);
    musicFilter += `,adelay=${delayMs}|${delayMs}`;
  }

  musicFilter += '[music]';

  const output = path.join(RECORDINGS_DIR, `trailer-${cfg.name}.mp4`);

  // Mix: voice stays at 1.0, music is ducked via volume + amix weights
  // Using amix with weights and normalize=0 to prevent auto-leveling
  exec(
    `ffmpeg -y -i "${baseVideo}" -i "${musicPath}" ` +
    `-filter_complex "` +
    `[0:a]volume=1.0,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[voice];` +
    `${musicFilter};` +
    `[voice][music]amix=inputs=2:duration=first:dropout_transition=3:normalize=0[mixed];` +
    `[mixed]afade=t=in:st=0:d=1.5,afade=t=out:st=${(videoDur - 2.5).toFixed(1)}:d=2.5[aout]` +
    `" ` +
    `-map 0:v -map "[aout]" ` +
    `-c:v copy -c:a aac -b:a 192k -movflags +faststart "${output}"`,
    `Mixing ${cfg.name} (vol=${cfg.volume})`
  );

  // Final polish: slight color grade (same as build-trailer)
  const polishedOutput = path.join(RECORDINGS_DIR, `tribe-command-center-trailer-${cfg.name}.mp4`);
  const dur = getDuration(output);

  exec(
    `ffmpeg -y -i "${output}" ` +
    `-vf "fade=t=in:st=0:d=1.5,fade=t=out:st=${(dur - 2).toFixed(1)}:d=2,eq=contrast=1.05:saturation=1.1" ` +
    `-af "afade=t=in:st=0:d=1,afade=t=out:st=${(dur - 2.5).toFixed(1)}:d=2.5" ` +
    `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart ` +
    `-c:a aac -b:a 192k "${polishedOutput}"`,
    `Final polish ${cfg.name}`
  );

  // Clean intermediate
  fs.unlinkSync(output);

  const finalDur = getDuration(polishedOutput);
  const finalSize = (fs.statSync(polishedOutput).size / (1024 * 1024)).toFixed(2);
  console.log(`  ✅ ${cfg.name}: ${finalDur.toFixed(1)}s, ${finalSize} MB`);

  return polishedOutput;
}

// ═══════════════════════════════════════════
// Main
// ═══════════════════════════════════════════

async function main() {
  console.log('════════════════════════════════════════════════════');
  console.log('  Tribe Command Center — Music Variant Builder');
  console.log('════════════════════════════════════════════════════');

  // We need the concat video (pre-music). If build-trailer was run,
  // the concat gets cleaned up. So let's rebuild it by running the
  // concatenation step only.
  // Actually, let's just use the existing TRAILER output and strip its audio,
  // replacing with source voiceover from segments... 
  // BETTER: rebuild the concat from scratch using the same logic.

  // Actually the simplest approach: use the existing trailer-v2 (which already 
  // has music mixed), but that would double-layer. Instead, let's concat segments 
  // with fades+zoom (same as build-trailer step 3) and use that as base.

  // Check if we have the voiced segments
  const SEGMENTS = [
    '01-intro-voiced.mp4',
    '02-dashboard-voiced.mp4',
    '03-intel-map-voiced.mp4',
    '04-goals-voiced.mp4',
    '05-fleets-reputation-voiced.mp4',
    '06-outro-voiced.mp4',
  ];

  for (const s of SEGMENTS) {
    const p = path.join(SEGMENTS_DIR, s);
    if (!fs.existsSync(p)) {
      console.error(`❌ Missing segment: ${s}`);
      process.exit(1);
    }
  }

  // Build base concat (with fades, zooms, chapter labels — same as build-trailer step 1-3)
  console.log('\n📦 Building base video (concat with effects, no music)...');

  // Import the heavy concat logic by just running build-trailer 
  // and stopping before music step. Simpler: inline a quick concat.
  // Actually let's just call the existing build-trailer approach:
  // We'll call the concat + title/outro creation inline here.

  // --- Inline: create title & outro cards, then concat with zoom/label effects ---
  // To avoid duplicating the full zoom/label logic, let's take a simpler approach:
  // 1. Run build-trailer.ts which outputs trailer-v2.mp4
  // 2. But we need the PRE-MUSIC version...

  // SIMPLEST: Just re-extract audio from segments and mix with new music.
  // The visual track of trailer-v2 is already perfect. We just need to re-do audio.

  // Let's extract the base video WITHOUT audio from the existing concat,
  // and separately extract all voiceover audio, then mix fresh.

  // APPROACH: Use the existing trailer-v2 but strip its audio to get the visual track,
  // then merge the original segment voiceovers back + new music.

  // Actually even simpler: just create a "no-music" base by concatenating all 
  // voiced segments WITH their original audio (fades/zooms applied on video only).
  // The existing build-trailer already does fade+zoom on video and copies audio.
  // So the _trailer_concat.mp4 intermediate has perfectly faded video + clean voiceover.

  // Let's just rebuild that intermediate:
  console.log('  Rebuilding segment concat...');

  // Read the existing build-trailer.ts CHAPTER_CONFIG and apply same processing
  // ... this is getting complex. Let's take the pragmatic approach:

  // Step 1: Temporarily modify build-trailer to keep the concat intermediate
  // Step 2: OR, just rebuild here with simple fades (no zoom/labels for speed)

  // PRAGMATIC: The zoom + labels are already baked into the segments from the 
  // last build run's _proc_ files... no, those get cleaned up.

  // FINAL APPROACH: Build a fresh concat with fades only (the zoom/labels are
  // relatively subtle — the main visual content is the same). Then mix each 
  // music track. This gives us 4 comparable trailers for A/B testing music.

  // Actually wait — let me check if the existing trailer has clean voiceover.
  // The trailer-v2 has music mixed in at 0.12 volume. If we use its video track
  // and just replace audio with segments' voiceover + new music, that's cleanest.

  // CLEANEST APPROACH:
  // 1. Extract video track from existing trailer-v2 (has all zoom/labels/fades)
  // 2. Concat voiceover audio from original segments (in order, with title/outro silence)
  // 3. Mix new music track
  // 4. Mux video + mixed audio

  const existingTrailer = path.join(RECORDINGS_DIR, 'tribe-command-center-trailer-v2.mp4');
  if (!fs.existsSync(existingTrailer)) {
    console.error('❌ No existing trailer-v2 found. Run build-trailer.ts first!');
    process.exit(1);
  }

  // Extract video-only from existing trailer
  const videoOnly = path.join(SEGMENTS_DIR, '_video-only-base.mp4');
  exec(
    `ffmpeg -y -i "${existingTrailer}" -c:v copy -an "${videoOnly}"`,
    'Extracting video track from trailer-v2'
  );

  // Build a clean voiceover audio track by concatenating segment audio
  // Title card (4s silence) + 6 segments audio + outro card (6s silence)
  const titleDur = 4.0;
  const outroDur = 6.0;

  // Create silent audio for title and outro
  const titleSilence = path.join(SEGMENTS_DIR, '_title-silence.wav');
  const outroSilence = path.join(SEGMENTS_DIR, '_outro-silence.wav');
  exec(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${titleDur} "${titleSilence}"`, 'Title silence');
  exec(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t ${outroDur} "${outroSilence}"`, 'Outro silence');

  // Extract audio from each segment
  const audioFiles: string[] = [titleSilence];
  for (const s of SEGMENTS) {
    const segPath = path.join(SEGMENTS_DIR, s);
    const audioOut = path.join(SEGMENTS_DIR, `_audio_${s.replace('.mp4', '.wav')}`);
    exec(
      `ffmpeg -y -i "${segPath}" -vn -acodec pcm_s16le -ar 44100 -ac 2 "${audioOut}"`,
      `Audio: ${s}`
    );
    audioFiles.push(audioOut);
  }
  audioFiles.push(outroSilence);

  // Concat all audio
  const audioConcatFile = path.join(SEGMENTS_DIR, '_audio_concat.txt');
  fs.writeFileSync(audioConcatFile, audioFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n'));

  const voiceTrack = path.join(SEGMENTS_DIR, '_voiceover-full.wav');
  exec(
    `ffmpeg -y -f concat -safe 0 -i "${audioConcatFile}" -c:a pcm_s16le "${voiceTrack}"`,
    'Concatenating voiceover'
  );

  // Mux video + clean voiceover = base for all variants
  const baseVideo = path.join(SEGMENTS_DIR, '_base-no-music.mp4');
  exec(
    `ffmpeg -y -i "${videoOnly}" -i "${voiceTrack}" ` +
    `-c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "${baseVideo}"`,
    'Muxing base video + clean voiceover'
  );

  const videoDur = getDuration(baseVideo);
  const baseSize = (fs.statSync(baseVideo).size / (1024 * 1024)).toFixed(1);
  console.log(`\n📦 Base video ready: ${videoDur.toFixed(1)}s, ${baseSize} MB (clean voiceover, no music)`);

  // Now build each variant
  const results: Array<{ name: string; path: string; size: string; dur: number }> = [];

  for (const cfg of MUSIC_TRACKS) {
    const outputPath = buildVariant(baseVideo, cfg, videoDur);
    const dur = getDuration(outputPath);
    const size = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
    results.push({ name: cfg.name, path: outputPath, size, dur });
  }

  // Cleanup temp files
  const tempFiles = [videoOnly, titleSilence, outroSilence, voiceTrack, audioConcatFile, baseVideo];
  for (const f of tempFiles) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  for (const f of audioFiles) {
    if (f.includes('_audio_') && fs.existsSync(f)) fs.unlinkSync(f);
  }

  // Summary
  console.log('\n════════════════════════════════════════════════════');
  console.log('  ALL MUSIC VARIANTS COMPLETE');
  console.log('════════════════════════════════════════════════════\n');

  for (const r of results) {
    const mins = Math.floor(r.dur / 60);
    const secs = Math.round(r.dur % 60).toString().padStart(2, '0');
    console.log(`  🎬 ${r.name} — ${mins}:${secs}, ${r.size} MB`);
    console.log(`     ${r.path}`);
  }

  console.log(`\n  📁 All variants in: ${RECORDINGS_DIR}`);
  console.log('  🎧 Compare and pick your favorite!\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
