/**
 * Trailer Builder — Tribe Command Center
 *
 * Takes the voiced segments and produces a polished trailer:
 *   1. Title card (3s fade-in with text)
 *   2. All 6 voiced scenes with crossfades
 *   3. "Thank You" outro card (5s)
 *   4. Background ambient music mixed under voiceover
 *   5. Global fade-in / fade-out
 *
 * Usage: npx tsx scripts/build-trailer.ts
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_DIR = path.resolve(__dirname, '..');
const SEGMENTS_DIR = path.resolve(PROJECT_DIR, 'recordings', 'segments');
const RECORDINGS_DIR = path.resolve(PROJECT_DIR, 'recordings');
const BG_MUSIC = path.resolve(RECORDINGS_DIR, 'bg-ambient.mp3');

// Output files
const TITLE_CARD = path.join(SEGMENTS_DIR, '_title-card.mp4');
const OUTRO_CARD = path.join(SEGMENTS_DIR, '_outro-card.mp4');
const TRAILER_OUTPUT = path.join(RECORDINGS_DIR, 'tribe-command-center-trailer-v5.mp4');

// Voiced segments in order
const SEGMENTS = [
  '01-intro-voiced.mp4',
  '02-dashboard-voiced.mp4',
  '03-intel-map-voiced.mp4',
  '04-goals-voiced.mp4',
  '05-fleets-reputation-voiced.mp4',
  '06-outro-voiced.mp4',
];

function exec(cmd: string, label?: string): string {
  if (label) console.log(`  ⚙️  ${label}`);
  try {
    return execSync(cmd, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e: any) {
    // ffmpeg writes progress to stderr, so check if output file exists
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
// Step 1: Create Title Card
// ═══════════════════════════════════════════
function createTitleCard() {
  console.log('\n🎬 Creating title card...');

  // 4 seconds: dark background, white text fading in
  // Title: "TRIBE COMMAND CENTER"
  // Subtitle: "A Strategic Coordination Platform for EVE Frontier"
  // Bottom: "EVE Frontier × Sui Hackathon 2026"
  exec(
    `ffmpeg -y -f lavfi -i "color=c=0x0a0e17:s=1920x1080:d=4:r=25" ` +
    `-f lavfi -i "anullsrc=channel_layout=mono:sample_rate=44100" ` +
    `-vf "` +
    `drawtext=text='TRIBE COMMAND CENTER':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-60:alpha='if(lt(t,0.5),0,if(lt(t,1.5),min(1,(t-0.5)),1))',` +
    `drawtext=text='Strategic Coordination for EVE Frontier Tribes':fontsize=28:fontcolor=0xaaaaff:x=(w-text_w)/2:y=(h/2)+20:alpha='if(lt(t,1),0,if(lt(t,2),min(1,(t-1)),1))',` +
    `drawtext=text='EVE Frontier x Sui Hackathon 2026':fontsize=22:fontcolor=0x888888:x=(w-text_w)/2:y=h-80:alpha='if(lt(t,1.5),0,if(lt(t,2.5),min(1,(t-1.5)),1))',` +
    `fade=t=in:st=0:d=1` +
    `" ` +
    `-t 4 -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${TITLE_CARD}"`,
    'Title card (4s)'
  );

  console.log(`  ✅ Title card: ${(fs.statSync(TITLE_CARD).size / 1024).toFixed(0)} KB`);
}

// ═══════════════════════════════════════════
// Step 2: Create Outro / Thank You Card
// ═══════════════════════════════════════════
function createOutroCard() {
  console.log('\n🙏 Creating outro card...');

  // 6 seconds: dark bg, big title + hackathon theme + thank you
  exec(
    `ffmpeg -y -f lavfi -i "color=c=0x0a0e17:s=1920x1080:d=6:r=25" ` +
    `-f lavfi -i "anullsrc=channel_layout=mono:sample_rate=44100" ` +
    `-vf "` +
    `drawtext=text='TRIBE COMMAND CENTER':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=180:alpha='if(lt(t,0.3),0,if(lt(t,1),min(1,(t-0.3)/0.7),1))',` +
    `drawtext=text='TOOLKIT FOR CIVILIZATION':fontsize=36:fontcolor=0x6366f1:x=(w-text_w)/2:y=280:alpha='if(lt(t,0.5),0,if(lt(t,1.2),min(1,(t-0.5)/0.7),1))',` +
    `drawtext=text='Thank You':fontsize=44:fontcolor=0x22d3ee:x=(w-text_w)/2:y=400:alpha='if(lt(t,1),0,if(lt(t,1.8),min(1,(t-1)/0.8),1))',` +
    `drawtext=text='tribe-command-center.pages.dev':fontsize=24:fontcolor=0xaaaaaa:x=(w-text_w)/2:y=480:alpha='if(lt(t,1.3),0,if(lt(t,2),min(1,(t-1.3)/0.7),1))',` +
    `drawtext=text='React 19  |  TypeScript  |  Sui Move  |  Zustand  |  Vite 8':fontsize=18:fontcolor=0x666666:x=(w-text_w)/2:y=540:alpha='if(lt(t,1.5),0,if(lt(t,2.2),min(1,(t-1.5)/0.7),1))',` +
    `drawtext=text='Built for EVE Frontier x Sui Hackathon 2026':fontsize=20:fontcolor=0x888888:x=(w-text_w)/2:y=580:alpha='if(lt(t,1.7),0,if(lt(t,2.4),min(1,(t-1.7)/0.7),1))',` +
    `fade=t=out:st=4.5:d=1.5` +
    `" ` +
    `-t 6 -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${OUTRO_CARD}"`,
    'Outro card (6s)'
  );

  console.log(`  ✅ Outro card: ${(fs.statSync(OUTRO_CARD).size / 1024).toFixed(0)} KB`);
}

// ═══════════════════════════════════════════
// Dynamic zoom: crop-based zoom in/out per segment
// ═══════════════════════════════════════════

/**
 * Zoom state: 'in' = cropped center (1600×900 → 1920×1080),
 *             'out' = full frame (1920×1080 → 1920×1080, no crop).
 *
 * Each segment defines time-based zoom transitions:
 *   { at: seconds, state: 'in'|'out' }
 * Transitions ramp smoothly over RAMP_SEC seconds.
 *
 * Cropped values (zoom in):  w=1600, h=900, x=160, y=50
 * Full values (zoom out):    w=1920, h=1080, x=0, y=0
 */
interface ZoomTransition { at: number; state: 'in' | 'out' }

const RAMP_SEC = 0.8; // smooth transition duration

/**
 * Per-segment zoom schedule. Segments not listed here get no crop.
 * Initial state is the state of the first transition at t≤0 (or first entry).
 */
const ZOOM_SCHEDULE: Record<string, ZoomTransition[]> = {
  '02-dashboard-voiced': [
    // Zoomed in the entire time — login happens at ~2.9s, dashboard content is center-framed
    { at: 0, state: 'in' },
  ],
  '03-intel-map-voiced': [
    // Zoomed in for star map exploration (0-15s)
    { at: 0, state: 'in' },
    // Zoom OUT before system detail panel opens (~16s) — rift form needs full width
    { at: 15.0, state: 'out' },
    // Stay out for the rest (rift form, rift sightings, panel stays open)
  ],
  '04-goals-voiced': [
    // Zoom OUT at start — navClick to Dashboard needs to show nav bar
    { at: 0, state: 'out' },
    // Zoom IN after landing on dashboard, before scrolling to goals
    { at: 1.5, state: 'in' },
    // Zoom OUT when scrollToTop + showing existing contributions (nav bar visible)
    { at: 20.5, state: 'out' },
    // Stay out for remaining
  ],
  '05-fleets-reputation-voiced': [
    // Zoom OUT at start — navClick to Fleets shows where we click
    { at: 0, state: 'out' },
    // Zoom IN after landing on Fleets page
    { at: 1.5, state: 'in' },
    // Zoom OUT before navClick to Members (~15s)
    { at: 14.0, state: 'out' },
    // Stay out for Members → Leaderboard nav transitions
  ],
  '06-outro-voiced': [
    // Zoom OUT at start — Alliance→News→Dashboard nav clicks
    { at: 0, state: 'out' },
    // Zoom IN after landing on Dashboard for cinematic end scroll
    { at: 7.0, state: 'in' },
  ],
};

/**
 * Build a dynamic crop+scale filter expression for a segment.
 *
 * Smoothly transitions between:
 *   zoom-in:  crop(1600, 900, 160, 50) + scale(1920, 1080)
 *   zoom-out: crop(1920, 1080, 0, 0)   (no-op crop)
 *
 * Uses ffmpeg crop expression variables: iw, ih, t
 */
function buildDynamicCropFilter(schedule: ZoomTransition[]): string {
  if (schedule.length === 0) return '';

  // Crop deltas (zoom-in minus zoom-out)
  // zoom-in:  w=1600 h=900 x=160 y=50
  // zoom-out: w=1920 h=1080 x=0  y=0
  // delta_w = -320, delta_h = -180, delta_x = 160, delta_y = 50
  //
  // We define "zoom_factor" 0→1 where 0=full-frame, 1=zoomed-in
  // w = iw - 320 * zf
  // h = ih - 180 * zf
  // x = 160 * zf
  // y = 50 * zf

  // Build a piecewise expression for zf (zoom factor) over time
  // Each transition: ramp from current zf to target zf over RAMP_SEC
  const parts: string[] = [];

  for (let i = 0; i < schedule.length; i++) {
    const cur = schedule[i];
    const next = schedule[i + 1];
    const targetZf = cur.state === 'in' ? 1 : 0;
    const prevZf = i === 0 ? targetZf : (schedule[i - 1].state === 'in' ? 1 : 0);
    const rampStart = cur.at;
    const rampEnd = rampStart + RAMP_SEC;

    if (i === 0 && prevZf === targetZf) {
      // Initial state, no ramp needed — handle in "else" of next transition
    } else {
      // Ramp from prevZf to targetZf between rampStart and rampEnd
      // zf = prevZf + (targetZf - prevZf) * clamp((t - rampStart) / RAMP_SEC, 0, 1)
    }
  }

  // Simpler approach: build zf as a chain of if/else conditions
  // Starting from the last transition and working backward
  let zfExpr = schedule[schedule.length - 1].state === 'in' ? '1' : '0';

  for (let i = schedule.length - 1; i >= 0; i--) {
    const cur = schedule[i];
    const targetZf = cur.state === 'in' ? 1 : 0;
    const prevZf = i === 0 ? targetZf : (schedule[i - 1].state === 'in' ? 1 : 0);

    if (prevZf === targetZf) {
      // No transition needed at this point
      continue;
    }

    const rampStart = cur.at;
    const rampEnd = cur.at + RAMP_SEC;

    // During ramp: linear interpolation
    const rampExpr = prevZf < targetZf
      ? `${prevZf}+(${targetZf}-${prevZf})*(t-${rampStart.toFixed(1)})/${RAMP_SEC.toFixed(1)}`
      : `${prevZf}-(${prevZf}-${targetZf})*(t-${rampStart.toFixed(1)})/${RAMP_SEC.toFixed(1)}`;

    // if t < rampStart: prevZf, elif t < rampEnd: ramp, else: nextExpr
    zfExpr = `if(lt(t\\,${rampStart.toFixed(1)})\\,${prevZf}\\,if(lt(t\\,${rampEnd.toFixed(1)})\\,${rampExpr}\\,${zfExpr}))`;
  }

  // Build crop expressions using zf
  const wExpr = `iw-320*${zfExpr}`;
  const hExpr = `ih-180*${zfExpr}`;
  const xExpr = `160*${zfExpr}`;
  const yExpr = `50*${zfExpr}`;

  // Crop is applied to 1920×1080 input, then scale ensures output is always 1920×1080
  return `crop='${wExpr}':'${hExpr}':'${xExpr}':'${yExpr}',scale=1920:1080:flags=lanczos`;
}

// ═══════════════════════════════════════════
// Step 3: Concatenate all segments + cards
// ═══════════════════════════════════════════

function concatenateAllSegments(): string {
  console.log('\n🎞️ Concatenating title + segments + outro...');

  const allParts = [
    TITLE_CARD,
    ...SEGMENTS.map(s => path.join(SEGMENTS_DIR, s)),
    OUTRO_CARD,
  ];

  // Write concat file
  const concatFile = path.join(SEGMENTS_DIR, '_trailer_concat.txt');

  // Pre-process each segment: add fades and dynamic center crop
  const processedParts: string[] = [];
  for (const p of allParts) {
    const basename = path.basename(p, path.extname(p));
    const isVoicedSegment = basename.match(/^\d+-.*-voiced$/);

    if (isVoicedSegment) {
      const dur = getDuration(p);
      const fadeDur = 0.4;
      const schedule = ZOOM_SCHEDULE[basename];

      // Build video filter chain
      const vfParts: string[] = [];

      // 1. Dynamic crop (for scenes with zoom schedule)
      if (schedule && schedule.length > 0) {
        vfParts.push(buildDynamicCropFilter(schedule));
      }

      // 2. Boundary fades (dark, no white flash)
      vfParts.push(`fade=t=in:st=0:d=${fadeDur}:color=0x0a0e17`);
      vfParts.push(`fade=t=out:st=${(dur - fadeDur).toFixed(2)}:d=${fadeDur}:color=0x0a0e17`);

      const vf = vfParts.join(',');
      const processedOut = path.join(SEGMENTS_DIR, `_proc_${path.basename(p)}`);

      exec(
        `ffmpeg -y -i "${p}" ` +
        `-vf "${vf}" ` +
        `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a copy "${processedOut}"`,
        `${schedule ? 'DynCrop ' : 'Process '}${basename}`
      );

      processedParts.push(processedOut);
    } else {
      processedParts.push(p);
    }
  }

  // Write concat file with processed segments
  const concatContent = processedParts.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
  fs.writeFileSync(concatFile, concatContent);

  // Concat all (re-encode for uniform format)
  const concatOutput = path.join(SEGMENTS_DIR, '_trailer_concat.mp4');
  exec(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" ` +
    `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart ` +
    `-c:a aac -b:a 192k "${concatOutput}"`,
    `Concatenating ${processedParts.length} segments`
  );

  const dur = getDuration(concatOutput);
  const size = (fs.statSync(concatOutput).size / (1024 * 1024)).toFixed(2);
  console.log(`  ✅ Concatenated: ${dur.toFixed(1)}s, ${size} MB`);

  // Cleanup processed temp files
  for (const p of processedParts) {
    if (path.basename(p).startsWith('_proc_')) {
      try { fs.unlinkSync(p); } catch {}
    }
  }
  fs.unlinkSync(concatFile);
  return concatOutput;
}

// ═══════════════════════════════════════════
// Step 4: Mix background music under voiceover
// ═══════════════════════════════════════════
function mixBackgroundMusic(videoPath: string): string {
  console.log('\n🎵 Mixing background music under voiceover...');

  const videoDur = getDuration(videoPath);
  const output = TRAILER_OUTPUT;

  // Mix: voiceover at full volume, bg music at ~15% volume
  // Background music fades in first 3s and fades out last 5s
  // Sidechaining: when voice is present, duck the music further
  exec(
    `ffmpeg -y -i "${videoPath}" -i "${BG_MUSIC}" ` +
    `-filter_complex "` +
    `[0:a]volume=1.0,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono[voice];` +
    `[1:a]atrim=0:${videoDur.toFixed(1)},asetpts=PTS-STARTPTS,volume=0.12,afade=t=in:st=0:d=3,afade=t=out:st=${(videoDur - 5).toFixed(1)}:d=5,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=mono[music];` +
    `[voice][music]amix=inputs=2:duration=first:dropout_transition=2:weights=1 0.3[aout]` +
    `" ` +
    `-map 0:v -map "[aout]" ` +
    `-c:v copy -c:a aac -b:a 192k -movflags +faststart "${output}"`,
    `Mixing bg music (${videoDur.toFixed(0)}s video)`
  );

  const size = (fs.statSync(output).size / (1024 * 1024)).toFixed(2);
  console.log(`  ✅ Mixed: ${size} MB`);
  return output;
}

// ═══════════════════════════════════════════
// Step 5: Add global fade-in / fade-out + minor color grading
// ═══════════════════════════════════════════
function addFinalPolish(inputPath: string) {
  console.log('\n✨ Adding final polish (fade effects, slight color grade)...');

  const dur = getDuration(inputPath);
  const tempPath = inputPath.replace('.mp4', '-temp.mp4');

  // Rename current to temp
  fs.renameSync(inputPath, tempPath);

  // Add: video fade-in at start, fade-out at end, slight contrast/saturation bump
  exec(
    `ffmpeg -y -i "${tempPath}" ` +
    `-vf "fade=t=in:st=0:d=1.5,fade=t=out:st=${(dur - 2).toFixed(1)}:d=2,eq=contrast=1.05:saturation=1.1" ` +
    `-af "afade=t=in:st=0:d=1,afade=t=out:st=${(dur - 2.5).toFixed(1)}:d=2.5" ` +
    `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart ` +
    `-c:a aac -b:a 192k "${inputPath}"`,
    `Final polish (${dur.toFixed(0)}s)`
  );

  // Clean up temp
  fs.unlinkSync(tempPath);

  const finalDur = getDuration(inputPath);
  const finalSize = (fs.statSync(inputPath).size / (1024 * 1024)).toFixed(2);
  console.log(`  ✅ Final trailer: ${finalDur.toFixed(1)}s, ${finalSize} MB`);
}

// ═══════════════════════════════════════════
// Main
// ═══════════════════════════════════════════
async function main() {
  console.log('════════════════════════════════════════════════════');
  console.log('  Tribe Command Center — Trailer Builder');
  console.log('════════════════════════════════════════════════════');

  // Verify all inputs exist
  const missing: string[] = [];
  for (const seg of SEGMENTS) {
    const p = path.join(SEGMENTS_DIR, seg);
    if (!fs.existsSync(p)) missing.push(seg);
  }
  if (!fs.existsSync(BG_MUSIC)) missing.push('bg-ambient.mp3');
  if (missing.length > 0) {
    console.error(`❌ Missing files: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Print segment info
  let totalDur = 0;
  for (const seg of SEGMENTS) {
    const p = path.join(SEGMENTS_DIR, seg);
    const dur = getDuration(p);
    totalDur += dur;
    console.log(`  ${seg} — ${dur.toFixed(1)}s`);
  }
  console.log(`  Total content: ${totalDur.toFixed(1)}s + 4s title + 6s outro = ${(totalDur + 10).toFixed(1)}s`);

  // Build
  createTitleCard();
  createOutroCard();
  const concatPath = concatenateAllSegments();
  mixBackgroundMusic(concatPath);
  addFinalPolish(TRAILER_OUTPUT);

  // Clean up intermediate files
  const intermediates = ['_title-card.mp4', '_outro-card.mp4', '_trailer_concat.mp4'];
  for (const f of intermediates) {
    const p = path.join(SEGMENTS_DIR, f);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  console.log('\n════════════════════════════════════════════════════');
  console.log('  TRAILER COMPLETE');
  console.log('════════════════════════════════════════════════════');
  console.log(`\n🎬 ${TRAILER_OUTPUT}`);
  const finalSize = (fs.statSync(TRAILER_OUTPUT).size / (1024 * 1024)).toFixed(2);
  const finalDur = getDuration(TRAILER_OUTPUT);
  console.log(`📊 Duration: ${finalDur.toFixed(1)}s (${Math.floor(finalDur / 60)}:${Math.round(finalDur % 60).toString().padStart(2, '0')})`);
  console.log(`📊 Size: ${finalSize} MB`);
  console.log(`📊 Format: h.264 + AAC, 1920×1080, 25fps`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
