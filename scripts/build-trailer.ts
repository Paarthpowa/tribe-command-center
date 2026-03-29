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
const TRAILER_OUTPUT = path.join(RECORDINGS_DIR, 'tribe-command-center-trailer-v2.mp4');

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
// Chapter labels + zoom-in moments per segment
// ═══════════════════════════════════════════
interface ChapterConfig {
  /** Text shown as a popup label (top-left corner) */
  label: string;
  /** When the label appears (seconds into the segment) */
  labelStart: number;
  /** How long the label stays visible (seconds) */
  labelDur: number;
  /** Zoom-in moments: { start, dur, zoomFactor, focusX%, focusY% } */
  zooms: Array<{ start: number; dur: number; zoom: number; fx: number; fy: number }>;
}

const CHAPTER_CONFIG: Record<string, ChapterConfig> = {
  '02-dashboard-voiced': {
    label: 'IDENTITY & DASHBOARD',
    labelStart: 1.0,
    labelDur: 4.0,
    zooms: [
      // Zoom into the resource coverage area
      { start: 8.0, dur: 3.0, zoom: 1.3, fx: 0.5, fy: 0.55 },
    ],
  },
  '03-intel-map-voiced': {
    label: 'INTEL & TERRITORY',
    labelStart: 0.5,
    labelDur: 4.0,
    zooms: [
      // Zoom when filling the rift report form
      { start: 16.0, dur: 5.0, zoom: 1.4, fx: 0.72, fy: 0.5 },
    ],
  },
  '04-goals-voiced': {
    label: 'GOALS & PLEDGE SYSTEM',
    labelStart: 0.5,
    labelDur: 4.0,
    zooms: [
      // Zoom on the pledge modal
      { start: 10.0, dur: 4.5, zoom: 1.35, fx: 0.5, fy: 0.45 },
    ],
  },
  '05-fleets-reputation-voiced': {
    label: 'FLEETS & REPUTATION',
    labelStart: 0.5,
    labelDur: 4.0,
    zooms: [
      // Zoom on the leaderboard member expand
      { start: 18.0, dur: 5.0, zoom: 1.35, fx: 0.5, fy: 0.45 },
    ],
  },
  '06-outro-voiced': {
    label: 'THE FOUNDATION',
    labelStart: 0.5,
    labelDur: 3.5,
    zooms: [],
  },
};

/**
 * Build crop+scale filters for smooth zoom-in/out at specified moments.
 * Uses crop with animated expressions (per-frame) + scale back to 1920x1080.
 * Much more reliable than zoompan on Windows.
 */
function buildZoomFilters(zooms: ChapterConfig['zooms']): string {
  if (zooms.length === 0) return '';

  // For each zoom moment, build crop expressions that animate:
  // ramp in (0.6s) → hold → ramp out (0.6s)
  // crop width/height shrinks (to zoom in), then scale back to 1920x1080
  const ramp = 0.6;
  const filters: string[] = [];

  for (const z of zooms) {
    const s = z.start;
    const e = s + z.dur;
    const rampEnd = s + ramp;
    const rampOutStart = e - ramp;
    const invZ = 1.0 / z.zoom; // crop fraction (e.g. 1/1.35 ≈ 0.74)

    // Width expression: smoothly goes from iw to iw*invZ and back
    const wExpr =
      `if(between(t\\,${s.toFixed(1)}\\,${rampEnd.toFixed(1)})\\,` +
        `iw*(1-(1-${invZ.toFixed(4)})*(t-${s.toFixed(1)})/${ramp.toFixed(1)})\\,` +
      `if(between(t\\,${rampEnd.toFixed(1)}\\,${rampOutStart.toFixed(1)})\\,` +
        `iw*${invZ.toFixed(4)}\\,` +
      `if(between(t\\,${rampOutStart.toFixed(1)}\\,${e.toFixed(1)})\\,` +
        `iw*(${invZ.toFixed(4)}+(1-${invZ.toFixed(4)})*(t-${rampOutStart.toFixed(1)})/${ramp.toFixed(1)})\\,` +
      `iw)))`;

    // Height: same logic
    const hExpr = wExpr.replace(/iw/g, 'ih');

    // X position: center the crop around focus point
    const xExpr =
      `if(between(t\\,${s.toFixed(1)}\\,${e.toFixed(1)})\\,` +
        `(iw-out_w)*${z.fx.toFixed(2)}\\,0)`;

    // Y position
    const yExpr =
      `if(between(t\\,${s.toFixed(1)}\\,${e.toFixed(1)})\\,` +
        `(ih-out_h)*${z.fy.toFixed(2)}\\,0)`;

    filters.push(`crop=${wExpr}:${hExpr}:${xExpr}:${yExpr}`);
  }

  // After crop, scale back to 1920x1080
  return filters.join(',') + ',scale=1920:1080:flags=lanczos';
}

/**
 * Build drawtext filter for chapter label popup (top-left, glass-style background)
 */
function buildChapterLabel(cfg: ChapterConfig): string {
  const fadeIn = 0.4;
  const fadeOut = 0.4;
  const end = cfg.labelStart + cfg.labelDur;

  // Alpha: fade in over 0.4s, hold, fade out over 0.4s
  // All commas inside the expression must be escaped with \, for ffmpeg filter parsing
  const alpha = `if(lt(t\\,${cfg.labelStart.toFixed(1)})\\,0\\,` +
    `if(lt(t\\,${(cfg.labelStart + fadeIn).toFixed(1)})\\,min(1\\,(t-${cfg.labelStart.toFixed(1)})/${fadeIn.toFixed(1)})\\,` +
    `if(lt(t\\,${(end - fadeOut).toFixed(1)})\\,1\\,` +
    `if(lt(t\\,${end.toFixed(1)})\\,max(0\\,1-(t-${(end - fadeOut).toFixed(1)})/${fadeOut.toFixed(1)})\\,0))))`;

  // Background box + text (fixed width based on label length)
  const boxW = cfg.label.length * 12 + 30;
  return `drawbox=x=30:y=28:w=${boxW}:h=38:color=0x0a0e17@0.7:t=fill:enable='between(t\\,${cfg.labelStart.toFixed(1)}\\,${end.toFixed(1)})',` +
    `drawtext=text='${cfg.label}':fontsize=20:fontcolor=0x6366f1:x=45:y=34:alpha='${alpha}'`;
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

  // Pre-process each segment: add fades, chapter labels, and zoom effects
  const processedParts: string[] = [];
  for (const p of allParts) {
    const basename = path.basename(p, path.extname(p));
    const isVoicedSegment = basename.match(/^\d+-.*-voiced$/);

    if (isVoicedSegment) {
      const dur = getDuration(p);
      const fadeDur = 0.4;
      const cfg = CHAPTER_CONFIG[basename];

      // Build video filter chain
      const vfParts: string[] = [];

      // 1. Boundary fades (dark, no white flash)
      vfParts.push(`fade=t=in:st=0:d=${fadeDur}:color=0x0a0e17`);
      vfParts.push(`fade=t=out:st=${(dur - fadeDur).toFixed(2)}:d=${fadeDur}:color=0x0a0e17`);

      // 2. Chapter label popup
      if (cfg) {
        vfParts.push(buildChapterLabel(cfg));
      }

      const vf = vfParts.join(',');
      const processedOut = path.join(SEGMENTS_DIR, `_proc_${path.basename(p)}`);

      // Single pass: zoom (crop+scale) + fades + labels all at once
      if (cfg && cfg.zooms.length > 0) {
        const zoomFilter = buildZoomFilters(cfg.zooms);
        // Zoom first, then fades + labels
        exec(
          `ffmpeg -y -i "${p}" ` +
          `-vf "${zoomFilter},${vf}" ` +
          `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a copy "${processedOut}"`,
          `Zoom+Labels ${basename}`
        );
      } else {
        // Just fades + labels
        exec(
          `ffmpeg -y -i "${p}" ` +
          `-vf "${vf}" ` +
          `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a copy "${processedOut}"`,
          `Process ${basename}`
        );
      }

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
