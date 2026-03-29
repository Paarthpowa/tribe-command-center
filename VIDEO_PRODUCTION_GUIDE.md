# Automated Demo Video & Trailer Production Pipeline — LLM Guide

> **Purpose**: This document teaches an LLM agent how to create high-quality, automated demo video recordings of a web application, assemble them into a polished trailer with voiceover narration and background music. It covers the full pipeline: recording, post-processing, trailer building, and music mixing.
>
> **Context**: Built for the Tribe Command Center project (React 19 + Vite 8 + TypeScript), but the techniques are generic and work with any SPA.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites & Dependencies](#2-prerequisites--dependencies)
3. [Directory Structure](#3-directory-structure)
4. [Step 1: Recording the Application Demo](#4-step-1-recording-the-application-demo)
5. [Step 2: Building the Trailer](#5-step-2-building-the-trailer)
6. [Step 3: Music Variants & Fine-Tuning](#6-step-3-music-variants--fine-tuning)
7. [Key ffmpeg Patterns (Reference)](#7-key-ffmpeg-patterns-reference)
8. [Troubleshooting](#8-troubleshooting)
9. [Full Orchestration Commands](#9-full-orchestration-commands)

---

## 1. Architecture Overview

The pipeline has 4 stages, each a standalone TypeScript script run via `npx tsx`:

```
┌────────────────────────────────┐
│  STAGE 1: record-voiceover-sync│  Playwright records the app as video
│  ├─ Start dev server           │  ffmpeg generates title slides
│  ├─ Record scenes (headless)   │  Split webm → per-scene mp4
│  └─ Merge voiceover audio      │  Output: XX-name-voiced.mp4
└──────────────┬─────────────────┘
               ▼
┌────────────────────────────────┐
│  STAGE 2: build-trailer        │  Title card + segments + outro card
│  ├─ Add chapter labels & zoom  │  Boundary fades (dark, no white flash)
│  ├─ Mix background music       │  Global polish (color grade + fades)
│  └─ Output: trailer-v2.mp4    │
└──────────────┬─────────────────┘
               ▼
┌────────────────────────────────┐
│  STAGE 3: build-music-variants │  Test N music tracks at configured
│  └─ Output: trailer-{name}.mp4│  volume levels against the trailer
└──────────────┬─────────────────┘
               ▼
┌────────────────────────────────┐
│  STAGE 4: build-music-finetune │  For selected tracks, generate:
│  ├─ A: overall quieter         │  A) Globally reduced volume
│  ├─ B: gentle sidechain duck   │  B) Auto-duck when voice speaks
│  └─ C: strong sidechain duck   │  C) Aggressive auto-duck
└────────────────────────────────┘
```

**Core technologies:**
- **Playwright** (headless Chromium) — records the browser as a `.webm` video
- **ffmpeg** — all video/audio processing (cutting, fading, text overlays, music mixing, color grading)
- **TypeScript + tsx** — script runner (no build step needed)

---

## 2. Prerequisites & Dependencies

### System Requirements
- **Node.js** 20+ (for tsx and modern ES module support)
- **ffmpeg** 6+ on PATH (with `ffprobe`). Verify: `ffmpeg -version`
- **Playwright browsers**: Install via `npx playwright install chromium`

### npm Dependencies
```json
{
  "devDependencies": {
    "playwright": "^1.58.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Pre-recorded Assets Needed
Before running the pipeline, you need:
1. **Voiceover audio files** (MP3) — one per scene, pre-recorded (AI voice or human)
2. **Background music** (MP3) — royalty-free, roughly matching trailer duration
3. **A running web application** that can be served on localhost

---

## 3. Directory Structure

```
project-root/
├── recordings/
│   ├── voiceovers/            # Pre-recorded voiceover MP3s (one per scene)
│   ├── segments/              # Output: split video segments + voiced versions
│   ├── screenshots/           # Debug: checkpoint screenshots during recording
│   ├── music/                 # Background music tracks to test
│   ├── bg-ambient.mp3         # Default background music for main trailer
│   ├── *.webm                 # Raw Playwright recordings (auto-named by hash)
│   └── *.mp4                  # Final trailer outputs
├── scripts/
│   ├── record-voiceover-sync.ts
│   ├── build-trailer.ts
│   ├── build-music-variants.ts
│   └── build-music-finetune.ts
└── src/                       # Your web application source
```

---

## 4. Step 1: Recording the Application Demo

### 4.1 Core Concept

The recording script does everything in one run:
1. Starts a local dev server
2. Launches headless Chromium with Playwright's built-in video recording
3. Executes scripted interactions (clicks, scrolls, navigation) timed to match voiceover durations
4. Records all scenes as a **single continuous `.webm`** file
5. Post-processes: splits the webm by scene timestamps, merges each with its voiceover audio

### 4.2 Scene Planning

Define scenes with durations that match your voiceover audio:

```typescript
interface VoiceoverScene {
  id: string;              // e.g., '02-dashboard'
  voiceoverFile: string;   // filename in voiceovers/ directory
  durationSec: number;     // MUST match the voiceover MP3 duration exactly
}

const SCENES: VoiceoverScene[] = [
  { id: '01-intro', voiceoverFile: 'intro-narration.mp3', durationSec: 32.08 },
  { id: '02-dashboard', voiceoverFile: 'dashboard-narration.mp3', durationSec: 16.01 },
  // ... more scenes
];
```

**Critical**: The `durationSec` must exactly match the voiceover MP3 length. Use ffprobe to get it:
```bash
ffprobe -v quiet -show_entries format=duration -of csv=p=0 "voiceover.mp3"
```

### 4.3 Dev Server Management

Start your app's dev server programmatically:

```typescript
import { spawn } from 'child_process';

const PORT = 4321;

function startDevServer(): ChildProcess {
  const proc = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    cwd: PROJECT_DIR,
    stdio: 'pipe',
    shell: true,
  });

  // Poll until server responds
  await pollUntilReady(`http://localhost:${PORT}`, 30000);
  return proc;
}

async function pollUntilReady(url: string, timeoutMs: number) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 400) return;
    } catch {}
    await sleep(500);
  }
  throw new Error(`Server not ready after ${timeoutMs}ms`);
}
```

Use `--strictPort` to fail fast if the port is occupied rather than silently picking another.

### 4.4 Browser & Recording Setup

```typescript
import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: ['--window-size=1920,1080', '--disable-gpu'],
});

const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: {
    dir: RECORDINGS_DIR,           // webm files saved here
    size: { width: 1920, height: 1080 },
  },
  colorScheme: 'dark',             // match your app's theme
});

const page = await context.newPage();
```

**Key points:**
- Resolution: always 1920×1080 for both viewport AND video recording
- `headless: true` — no visible browser window (works on servers/CI too)
- The video is saved as a `.webm` file in the specified directory
- One continuous recording captures ALL scenes — you split later

### 4.5 Timing Controller

Each scene has a fixed duration. Use a clock to pace interactions:

```typescript
function createSceneClock(durationSec: number) {
  const startMs = Date.now();
  const durationMs = durationSec * 1000;

  return {
    /** Wait until a fraction (0.0–1.0) of the scene has elapsed */
    async at(fraction: number) {
      const targetMs = fraction * durationMs;
      const elapsed = Date.now() - startMs;
      if (elapsed < targetMs) {
        await sleep(targetMs - elapsed);
      }
    },
    /** Wait until the scene ends */
    async finish() {
      const remaining = durationMs - (Date.now() - startMs);
      if (remaining > 0) await sleep(remaining);
    },
    /** Milliseconds remaining */
    remaining(): number {
      return Math.max(0, durationMs - (Date.now() - startMs));
    },
  };
}
```

Usage in a scene runner:
```typescript
async function runDashboardScene(page: Page, durationSec: number) {
  const clock = createSceneClock(durationSec);

  // Navigate
  await page.goto('http://localhost:4321/dashboard');
  await clock.at(0.1);  // 10% through the scene

  // Interact
  await clickWithCursor(page, page.locator('button:has-text("Login")'));
  await clock.at(0.3);  // 30%

  await slowScroll(page, 400, 2000);  // scroll 400px over 2s
  await clock.at(0.7);  // 70%

  // More interactions...
  await clock.finish();  // pad remaining time
}
```

### 4.6 Smooth Scrolling

Browsers in headless mode don't animate scroll smoothly by default. Use stepped scrolling:

```typescript
async function slowScroll(page: Page, pixels: number, durationMs: number) {
  const intervalMs = 50;  // ~20fps for smooth motion
  const steps = Math.max(5, Math.round(durationMs / intervalMs));
  const perStep = pixels / steps;

  for (let i = 0; i < steps; i++) {
    await page.evaluate((px) => window.scrollBy({ top: px, behavior: 'smooth' }), perStep);
    await sleep(intervalMs);
  }
}
```

**Why 50ms intervals?** At 300ms+ intervals, scrolling looks jerky in the recording. 50ms (~20fps) is smooth enough for video.

### 4.7 Visible Cursor & Click Indicator

Playwright headless doesn't render a system cursor. Inject a fake one via DOM:

```typescript
async function injectCursorOverlay(page: Page) {
  await page.evaluate(() => {
    // Cursor dot — follows mouse
    const dot = document.createElement('div');
    dot.id = '__cursor_dot';
    Object.assign(dot.style, {
      position: 'fixed',
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(99,102,241,0.95) 0%, rgba(99,102,241,0.4) 100%)',
      boxShadow: '0 0 12px 4px rgba(99,102,241,0.35)',
      pointerEvents: 'none',
      zIndex: '999999',
      transition: 'left 0.08s ease-out, top 0.08s ease-out',
      left: '-50px',
      top: '-50px',
    });
    document.body.appendChild(dot);

    // Click ripple ring
    const ring = document.createElement('div');
    ring.id = '__cursor_ring';
    Object.assign(ring.style, {
      position: 'fixed',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      border: '2px solid rgba(99,102,241,0.6)',
      pointerEvents: 'none',
      zIndex: '999998',
      opacity: '0',
      transform: 'scale(0.5)',
    });
    document.body.appendChild(ring);

    // Track mouse
    document.addEventListener('mousemove', (e) => {
      dot.style.left = `${e.clientX - 9}px`;
      dot.style.top = `${e.clientY - 9}px`;
    });
  });
}
```

And the click function with visual feedback:

```typescript
async function clickWithCursor(page: Page, locator: Locator, opts?: { preDelay?: number; postDelay?: number }) {
  const { preDelay = 250, postDelay = 400 } = opts ?? {};
  await locator.scrollIntoViewIfNeeded();
  await sleep(preDelay);

  const box = await locator.boundingBox();
  if (!box) { await locator.click(); return; }
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  // Smooth cursor movement (12 steps)
  await page.mouse.move(cx, cy, { steps: 12 });

  // Trigger click ripple animation
  await page.evaluate(({ x, y }) => {
    const ring = document.getElementById('__cursor_ring');
    if (ring) {
      ring.style.left = `${x - 18}px`;
      ring.style.top = `${y - 18}px`;
      ring.style.opacity = '1';
      ring.style.transform = 'scale(0.5)';
      ring.style.transition = 'none';
      requestAnimationFrame(() => {
        ring.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
        ring.style.transform = 'scale(2.5)';
        ring.style.opacity = '0';
      });
    }
  }, { x: cx, y: cy });

  await locator.click();
  await sleep(postDelay);
}
```

**Important**: Call `injectCursorOverlay(page)` once after app login/load, not before — or it gets wiped on navigation.

### 4.8 Cinematic Title Slides (ffmpeg drawtext, no browser)

For intro slides that are pure text on dark backgrounds, generate them directly with ffmpeg — faster than rendering in a browser:

```typescript
interface TeaserSlide {
  lines: Array<{
    text: string;
    size: number;        // font size in px
    color: string;       // hex e.g. 'white' or '0x22d3ee'
    yOffset: number;     // offset from vertical center
  }>;
  durationSec: number;
  fadeInSec: number;
  fadeOutSec: number;
}

function generateSlide(slide: TeaserSlide, outputPath: string) {
  const bg = '0x0a0e1a';  // dark background color
  const drawTexts = slide.lines.map((line, i) => {
    // Stagger each line's appearance
    const stagger = i * 0.15;
    const alpha = `if(lt(t,${slide.fadeInSec}),(t-${stagger})/${slide.fadeInSec},` +
      `if(gt(t,${slide.durationSec - slide.fadeOutSec}),` +
      `max(0,(${slide.durationSec}-t)/${slide.fadeOutSec}),1))`;

    return `drawtext=text='${line.text}':fontsize=${line.size}:` +
      `fontcolor=${line.color}:x=(w-text_w)/2:y=(h/2)+${line.yOffset}:` +
      `alpha='${alpha}'`;
  }).join(',');

  execSync(
    `ffmpeg -y -f lavfi -i "color=c=${bg}:s=1920x1080:d=${slide.durationSec}:r=25" ` +
    `-vf "${drawTexts},vignette=PI/4" ` +
    `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart ` +
    `-an "${outputPath}"`
  );
}
```

Then concatenate all slides:
```typescript
function generateAllSlides(slides: TeaserSlide[]) {
  // Generate each slide as a temp file
  const tempFiles = slides.map((s, i) => {
    const out = path.join(SEGMENTS_DIR, `_slide_${i}.mp4`);
    generateSlide(s, out);
    return out;
  });

  // Write concat file
  const concatFile = path.join(SEGMENTS_DIR, '_slides_concat.txt');
  fs.writeFileSync(concatFile, tempFiles.map(f => `file '${f}'`).join('\n'));

  // Concatenate
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c:v copy "${introOutputPath}"`);

  // Cleanup
  tempFiles.forEach(f => fs.unlinkSync(f));
  fs.unlinkSync(concatFile);
}
```

### 4.9 Scene Runner Pattern

Each scene is a function that takes a Playwright page and a duration. Inside, it uses the clock to pace interactions to match the voiceover timing:

```typescript
type SceneRunner = (page: Page, durationSec: number) => Promise<void>;

const SCENE_RUNNERS: Record<string, SceneRunner> = {
  '02-dashboard': runDashboardScene,
  '03-intel-map': runIntelMapScene,
  '04-goals': runGoalsScene,
  // ...
};
```

**Design principles:**
- Each scene should feel natural — don't rush clicks, leave breathing room
- Use `clock.at(fraction)` before each major interaction
- Take screenshots at checkpoints for debugging:
  ```typescript
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${sceneId}-checkpoint.png`) });
  ```
- End each scene with `await clock.finish()` to pad to exact duration

### 4.10 Navigation Between Scenes

For SPAs, click nav links rather than using `page.goto()` — it looks more natural in the recording:

```typescript
async function navClick(page: Page, linkText: string) {
  await clickWithCursor(page, page.locator(`a:has-text("${linkText}")`));
  await sleep(500);  // wait for route transition
}
```

### 4.11 Application State Management

If your app uses persisted state (localStorage, Zustand, etc.), clear it before recording to start fresh:

```typescript
async function resetAppState(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.removeItem('your-persist-key');  // Zustand persist key
  });
  await page.reload({ waitUntil: 'networkidle' });
}
```

This ensures every recording starts from the same clean state.

### 4.12 Post-Processing Pipeline

After recording, the webm needs to be split and merged with audio:

```typescript
// 1. SPLIT: Extract each scene by timestamp
function splitVideo(inputWebm: string, scenes: VoiceoverScene[]) {
  let startSec = 0;
  for (const scene of scenes) {
    const output = path.join(SEGMENTS_DIR, `${scene.id}.mp4`);
    execSync(
      `ffmpeg -y -ss ${startSec.toFixed(3)} -i "${inputWebm}" ` +
      `-t ${scene.durationSec} ` +
      `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart ` +
      `-an "${output}"`
    );
    startSec += scene.durationSec;
  }
}

// 2. MERGE: Add voiceover audio to each segment
function mergeWithVoiceover(videoPath: string, voiceoverPath: string, outputPath: string) {
  execSync(
    `ffmpeg -y -i "${videoPath}" -i "${voiceoverPath}" ` +
    `-c:v copy -c:a aac -b:a 192k -shortest "${outputPath}"`
  );
}

// 3. CONCATENATE: Join all voiced segments
function concatenateVideos(inputPaths: string[], outputPath: string) {
  const concatFile = path.join(SEGMENTS_DIR, '_concat.txt');
  fs.writeFileSync(concatFile,
    inputPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n')
  );
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatFile}" ` +
    `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart ` +
    `-c:a aac -b:a 192k "${outputPath}"`
  );
  fs.unlinkSync(concatFile);
}
```

**Why re-encode during split?** The raw webm from Playwright uses VP8/VP9. Converting to h.264 (libx264) during split ensures all segments are in the same codec for concatenation.

### 4.13 Complete Recording Flow

```
main():
  1. Verify all voiceover MP3s exist
  2. startDevServer() on port 4321
  3. browser = chromium.launch({ headless: true })
  4. If scene 01 is a title slide:
       generateTeaserIntro() → segments/01-intro.mp4
  5. context = browser.newContext({ recordVideo: ... })
     page = context.newPage()
  6. For each scene 02-06:
       resetAppState() (only for first scene)
       SCENE_RUNNERS[sceneId](page, durationSec)
  7. page.close() → triggers video save
     webmPath = await page.video().path()
  8. browser.close()
  9. splitVideo(webmPath, scenes[1:])  // Skip scene 01 (not from browser)
  10. For each segment:
        mergeWithVoiceover(segment.mp4, voiceover.mp3, segment-voiced.mp4)
  11. concatenateVideos([all voiced segments], 'final.mp4')
  12. Kill dev server
```

---

## 5. Step 2: Building the Trailer

### 5.1 Title & Outro Cards

Generate polished title/outro slides with layered text:

```typescript
function createTitleCard() {
  const dur = 4;  // seconds
  const bg = '0x0a0e17';

  // Multiple drawtext layers with staggered fade-in
  // Alpha expression: delayed start at different times per line
  const line1Alpha = "if(lt(t,0.5),0,if(lt(t,1.5),min(1,(t-0.5)),1))";
  const line2Alpha = "if(lt(t,1.0),0,if(lt(t,2.0),min(1,(t-1.0)),1))";

  execSync(
    `ffmpeg -y -f lavfi -i "color=c=${bg}:s=1920x1080:d=${dur}:r=25" ` +
    `-f lavfi -i "anullsrc=channel_layout=mono:sample_rate=44100" ` +
    `-vf "` +
      `drawtext=text='YOUR APP NAME':fontsize=72:fontcolor=white:` +
        `x=(w-text_w)/2:y=(h-text_h)/2-60:alpha='${line1Alpha}',` +
      `drawtext=text='Subtitle Line':fontsize=28:fontcolor=0xaaaaff:` +
        `x=(w-text_w)/2:y=(h/2)+20:alpha='${line2Alpha}',` +
      `fade=t=in:st=0:d=1` +
    `" -t ${dur} -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p ` +
    `-c:a aac -b:a 192k -shortest "${titleCardPath}"`
  );
}
```

Outro card follows the same pattern but with a fade-out at the end:
```
fade=t=out:st=${dur-1.5}:d=1.5
```

### 5.2 Chapter Labels (Text Overlay Popups)

Add scene-identifying labels in the top-left corner:

```typescript
interface ChapterConfig {
  label: string;         // e.g., "INTEL & TERRITORY"
  labelStart: number;    // seconds into segment when label appears
  labelDur: number;      // how long it stays
  zooms: ZoomConfig[];   // zoom-in moments (see 5.3)
}

function buildChapterLabel(cfg: ChapterConfig): string {
  const fadeIn = 0.4, fadeOut = 0.4;
  const end = cfg.labelStart + cfg.labelDur;

  // Alpha expression: fade in/out with escaped commas for ffmpeg
  const alpha =
    `if(lt(t\\,${cfg.labelStart})\\,0\\,` +
    `if(lt(t\\,${cfg.labelStart + fadeIn})\\,` +
      `min(1\\,(t-${cfg.labelStart})/${fadeIn})\\,` +
    `if(lt(t\\,${end - fadeOut})\\,1\\,` +
    `if(lt(t\\,${end})\\,` +
      `max(0\\,1-(t-${end - fadeOut})/${fadeOut})\\,0))))`;

  const boxW = cfg.label.length * 12 + 30;  // approximate px width

  return [
    // Semi-transparent background box
    `drawbox=x=30:y=28:w=${boxW}:h=38:color=0x0a0e17@0.7:t=fill:` +
      `enable='between(t\\,${cfg.labelStart}\\,${end})'`,
    // Text label
    `drawtext=text='${cfg.label}':fontsize=20:fontcolor=0x6366f1:` +
      `x=45:y=34:alpha='${alpha}'`,
  ].join(',');
}
```

**Important**: All commas inside ffmpeg filter expressions must be escaped with `\\,` (backslash-comma). This is a common source of bugs.

### 5.3 Zoom-In Attention Effects

Use `crop+scale` to smoothly zoom into a region of the screen at key moments:

```typescript
interface ZoomConfig {
  start: number;   // seconds into segment
  dur: number;     // zoom duration
  zoom: number;    // zoom factor (1.3 = 30% zoom in)
  fx: number;      // focus point X (0.0–1.0, 0.5 = center)
  fy: number;      // focus point Y (0.0–1.0, 0.5 = center)
}

function buildZoomFilters(zooms: ZoomConfig[]): string {
  const ramp = 0.6;  // seconds to ramp in/out

  const filters = zooms.map(z => {
    const s = z.start, e = s + z.dur;
    const rampEnd = s + ramp, rampOutStart = e - ramp;
    const invZ = 1.0 / z.zoom;  // crop fraction

    // Width: animate iw → iw*invZ → iw (zoom in then out)
    const wExpr =
      `if(between(t\\,${s}\\,${rampEnd})\\,` +
        `iw*(1-(1-${invZ})*(t-${s})/${ramp})\\,` +
      `if(between(t\\,${rampEnd}\\,${rampOutStart})\\,` +
        `iw*${invZ}\\,` +
      `if(between(t\\,${rampOutStart}\\,${e})\\,` +
        `iw*(${invZ}+(1-${invZ})*(t-${rampOutStart})/${ramp})\\,` +
      `iw)))`;

    const hExpr = wExpr.replace(/iw/g, 'ih');
    const xExpr = `if(between(t\\,${s}\\,${e})\\,(iw-out_w)*${z.fx}\\,0)`;
    const yExpr = `if(between(t\\,${s}\\,${e})\\,(ih-out_h)*${z.fy}\\,0)`;

    return `crop=${wExpr}:${hExpr}:${xExpr}:${yExpr}`;
  });

  // Scale back to original resolution after crop
  return filters.join(',') + ',scale=1920:1080:flags=lanczos';
}
```

**Why crop+scale instead of zoompan?** The `zoompan` filter is unreliable on Windows and very slow. `crop+scale` with per-frame expressions achieves the same effect much faster.

### 5.4 Segment Processing (Fades + Labels + Zooms)

For each voiced segment, apply all effects in a single ffmpeg pass:

```typescript
function processSegment(inputPath: string, cfg: ChapterConfig | undefined) {
  const dur = getDuration(inputPath);
  const fadeDur = 0.4;

  // Video filter chain
  const vfParts: string[] = [];

  // 1. Boundary fades (dark color, prevents white flash between segments)
  vfParts.push(`fade=t=in:st=0:d=${fadeDur}:color=0x0a0e17`);
  vfParts.push(`fade=t=out:st=${(dur - fadeDur).toFixed(2)}:d=${fadeDur}:color=0x0a0e17`);

  // 2. Chapter label
  if (cfg) vfParts.push(buildChapterLabel(cfg));

  const vf = vfParts.join(',');
  const output = path.join(SEGMENTS_DIR, `_proc_${path.basename(inputPath)}`);

  // If zoom effects exist, prepend them (crop+scale must come first)
  if (cfg?.zooms.length) {
    const zoomFilter = buildZoomFilters(cfg.zooms);
    execSync(
      `ffmpeg -y -i "${inputPath}" -vf "${zoomFilter},${vf}" ` +
      `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a copy "${output}"`
    );
  } else {
    execSync(
      `ffmpeg -y -i "${inputPath}" -vf "${vf}" ` +
      `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a copy "${output}"`
    );
  }
  return output;
}
```

**Fade color `0x0a0e17`**: This is a very dark blue that matches the app's background. Using black (0x000000) or white creates jarring flashes at segment boundaries. Always match your app's dominant background color.

### 5.5 Concatenation

After processing all segments:
```
[Title Card (4s)] + [Scene 01] + [Scene 02] + ... + [Scene 06] + [Outro Card (6s)]
```

Use ffmpeg's concat demuxer:
```typescript
const concatFile = path.join(SEGMENTS_DIR, '_concat.txt');
fs.writeFileSync(concatFile,
  allParts.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n')
);
execSync(
  `ffmpeg -y -f concat -safe 0 -i "${concatFile}" ` +
  `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart ` +
  `-c:a aac -b:a 192k "${concatOutput}"`
);
```

**Note**: On Windows, use forward slashes in the concat file paths (replace `\\` with `/`).

### 5.6 Background Music Mixing

```typescript
function mixBackgroundMusic(videoPath: string, musicPath: string, outputPath: string) {
  const videoDur = getDuration(videoPath);

  execSync(
    `ffmpeg -y -i "${videoPath}" -i "${musicPath}" ` +
    `-filter_complex "` +
      // Voice: full volume, normalize format
      `[0:a]volume=1.0,aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[voice];` +
      // Music: trim to video length, low volume, fade in/out
      `[1:a]atrim=0:${videoDur},asetpts=PTS-STARTPTS,` +
        `volume=0.10,` +                    // 10% volume — music is SUBTLE
        `afade=t=in:st=0:d=3,` +            // 3s fade in
        `afade=t=out:st=${videoDur - 5}:d=5,` +  // 5s fade out
        `aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[music];` +
      // Mix: voice takes priority
      `[voice][music]amix=inputs=2:duration=first:dropout_transition=3:normalize=0[aout]` +
    `" -map 0:v -map "[aout]" ` +
    `-c:v copy -c:a aac -b:a 192k -movflags +faststart "${outputPath}"`
  );
}
```

**Volume guidelines:**
- `0.08–0.10` for epic/cinematic tracks (loud by nature)
- `0.10–0.13` for ambient/chill tracks
- `0.12–0.15` for subtle background textures
- **Never above 0.15** — voiceover clarity is paramount

**`normalize=0`**: Prevents ffmpeg from auto-leveling the mix. Without this, quiet passages get boosted and loud passages get crushed.

### 5.7 Final Polish

Apply subtle color grading and global fade-in/out:

```typescript
function addFinalPolish(inputPath: string) {
  const dur = getDuration(inputPath);

  execSync(
    `ffmpeg -y -i "${inputPath}" ` +
    `-vf "fade=t=in:st=0:d=1.5,` +         // 1.5s video fade-in
      `fade=t=out:st=${dur - 2}:d=2,` +     // 2s video fade-out
      `eq=contrast=1.05:saturation=1.1" ` +  // slight color boost
    `-af "afade=t=in:st=0:d=1,` +           // 1s audio fade-in
      `afade=t=out:st=${dur - 2.5}:d=2.5" ` + // 2.5s audio fade-out
    `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart ` +
    `-c:a aac -b:a 192k "${outputPath}"`
  );
}
```

`eq=contrast=1.05:saturation=1.1` adds a subtle cinematic feel — slightly richer colors without looking artificial.

---

## 6. Step 3: Music Variants & Fine-Tuning

### 6.1 Testing Multiple Music Tracks

After building the base trailer, test different music tracks by:
1. Extracting the video track from the finished trailer (keeps all visual effects)
2. Rebuilding clean voiceover audio from original segments
3. Re-mixing with each music track

```typescript
// Extract video without audio
execSync(`ffmpeg -y -i "${trailer}" -c:v copy -an "${videoOnly}"`);

// Create silence for title (4s) and outro (6s) cards
execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 4 "${titleSilence}"`);
execSync(`ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 6 "${outroSilence}"`);

// Extract + concatenate voiceover from segments
for (const seg of segments) {
  execSync(`ffmpeg -y -i "${seg}" -vn -acodec pcm_s16le -ar 44100 -ac 2 "${audioOut}"`);
}
// ... concat all audio ...

// Mux: clean video + clean voiceover
execSync(`ffmpeg -y -i "${videoOnly}" -i "${voiceTrack}" -c:v copy -c:a aac -b:a 192k -shortest "${base}"`);
```

Then for each music track, `mixBackgroundMusic(base, track, output)` with different volume settings.

### 6.2 Sidechain Ducking (Auto-reduce music when voice speaks)

The professional way to handle voice-vs-music conflicts. ffmpeg's `sidechaincompress` filter uses the voiceover as a control signal:

```
[music][voiceover_signal]sidechaincompress=PARAMS[ducked_music]
```

**Three levels of ducking:**

| Level | threshold | ratio | attack | release | knee | Feel |
|-------|-----------|-------|--------|---------|------|------|
| Gentle | 0.015 | 3:1 | 200ms | 800ms | 4 | Music softens naturally when voice speaks |
| Medium | 0.010 | 4:1 | 120ms | 700ms | 5 | Clear voice priority, music still present |
| Strong | 0.008 | 6:1 | 80ms | 600ms | 6 | Voice dominates, music nearly mutes during speech |

```typescript
// Gentle ducking example
execSync(
  `ffmpeg -y -i "${baseVideo}" -i "${musicFile}" -i "${voiceTrack}" ` +
  `-filter_complex "` +
    `[0:a]volume=1.0,aformat=fltp:44100:stereo[voice];` +
    `[1:a]atrim=0:${dur},asetpts=PTS-STARTPTS,volume=${vol},` +
      `afade=t=in:st=0:d=3,afade=t=out:st=${dur-5}:d=5,` +
      `aformat=fltp:44100:stereo[music];` +
    `[2:a]aformat=fltp:44100:stereo[sidechain];` +
    `[music][sidechain]sidechaincompress=` +
      `level_in=1:threshold=0.015:ratio=3:attack=200:release=800:makeup=1:knee=4[ducked];` +
    `[voice][ducked]amix=inputs=2:duration=first:dropout_transition=3:normalize=0[aout]` +
  `" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k "${output}"`
);
```

**Three-input approach**: Input 0 = base video (voice audio), Input 1 = music file, Input 2 = clean voiceover WAV (sidechain signal). The clean voiceover is used as the sidechain control because it has no music mixed in — the compressor needs a pure voice signal to work correctly.

---

## 7. Key ffmpeg Patterns (Reference)

### 7.1 Get Duration
```bash
ffprobe -v quiet -show_entries format=duration -of csv=p=0 "file.mp4"
```

### 7.2 Text Card (dark bg + text)
```bash
ffmpeg -y -f lavfi -i "color=c=0x0a0e17:s=1920x1080:d=5:r=25" \
  -vf "drawtext=text='HELLO':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -an "output.mp4"
```

### 7.3 Concatenate Videos (same codec)
```bash
# concat.txt:
# file 'part1.mp4'
# file 'part2.mp4'
ffmpeg -y -f concat -safe 0 -i concat.txt -c copy "output.mp4"
```

### 7.4 Merge Video + Audio
```bash
ffmpeg -y -i video.mp4 -i audio.mp3 -c:v copy -c:a aac -b:a 192k -shortest output.mp4
```

### 7.5 Extract Video Only / Audio Only
```bash
ffmpeg -y -i input.mp4 -c:v copy -an video-only.mp4
ffmpeg -y -i input.mp4 -vn -acodec pcm_s16le -ar 44100 -ac 2 audio.wav
```

### 7.6 Fade to Dark (not black/white)
```bash
# color=0x0a0e17 = your app's dark background
ffmpeg -y -i input.mp4 \
  -vf "fade=t=in:st=0:d=0.5:color=0x0a0e17,fade=t=out:st=9.5:d=0.5:color=0x0a0e17" \
  -c:v libx264 -preset slow -crf 18 output.mp4
```

### 7.7 Generate Silence
```bash
ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=stereo -t 4.0 silence.wav
```

### 7.8 Color Grade
```bash
# Subtle cinematic: +5% contrast, +10% saturation
-vf "eq=contrast=1.05:saturation=1.1"
```

---

## 8. Troubleshooting

### Port Already In Use
The recording script starts its own dev server. Kill any existing process on that port first:
```bash
# Windows
netstat -ano | findstr :4321
taskkill /PID <pid> /F

# macOS/Linux
lsof -ti:4321 | xargs kill -9
```

### White Flash Between Segments
Use `fade` with `color=` matching your app's dark background. Never use default fade (fades to/from black by default, or white if alpha is involved).

### Jerky Scrolling in Recording
Use 50ms intervals in `slowScroll`. The default Playwright `page.mouse.wheel()` is too instantaneous.

### Cursor Not Visible
Playwright headless doesn't render system cursors. You MUST inject the DOM cursor overlay manually (see 4.7).

### Inline `<option>` Styles Ignored
Chrome on Windows ignores inline styles on native `<option>` elements within `<select>` dropdowns. Use CSS stylesheet rules instead:
```css
select { background-color: #1a1e2e !important; color: #e2e8f0 !important; }
select option { background-color: #1a1e2e; color: #e2e8f0; }
```

### zoompan Filter Fails on Windows
Use `crop+scale` approach instead (see 5.3). `zoompan` is slow and unreliable on Windows.

### ffmpeg Filter Expression Commas
Inside ffmpeg filter expressions, commas that are part of function arguments (like `between(t,1,5)`) must be escaped: `between(t\\,1\\,5)`. Unescaped commas are interpreted as filter chain separators.

### Audio Format Mismatch in amix
Ensure all audio streams have the same format before mixing:
```
aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo
```

### Recording Starts with Stale App State
Always clear localStorage/persisted state before recording:
```typescript
await page.evaluate(() => localStorage.removeItem('your-persist-key'));
await page.reload();
```

---

## 9. Full Orchestration Commands

```bash
# 1. Install dependencies
npm install
npx playwright install chromium

# 2. Ensure voiceover files are in recordings/voiceovers/

# 3. Record all scenes (starts dev server automatically)
npx tsx scripts/record-voiceover-sync.ts

# 4. Build the polished trailer (requires bg-ambient.mp3 in recordings/)
npx tsx scripts/build-trailer.ts

# 5. Optionally: test multiple music tracks
npx tsx scripts/build-music-variants.ts

# 6. Optionally: fine-tune volume/ducking for selected tracks
npx tsx scripts/build-music-finetune.ts

# 7. Deploy the app (if using Cloudflare Pages)
npm run deploy
```

Each script is independent — run them in order, but you can re-run any step without redoing previous ones (as long as the intermediate files exist in `recordings/segments/`).

---

## Summary of What Makes a Great Automated Demo Trailer

1. **Timing is everything** — Match interactions precisely to voiceover duration
2. **Smooth scrolling** — 50ms intervals, not browser-default jumpy scrolling
3. **Visible cursor** — Inject a DOM overlay with click ripple effects
4. **Dark fades** — Match your app's background color at segment boundaries
5. **Chapter labels** — Small, subtle, top-left corner, fade in/out
6. **Selective zoom** — Only at key moments (don't overdo it)
7. **Music volume ≤ 10-13%** — Voice clarity is #1 priority
8. **Sidechain ducking** — Professional auto-leveling when voice speaks
9. **Final color grade** — Subtle contrast+saturation boost for cinematic feel
10. **Clean state** — Always reset app state before recording
