/**
 * Voiceover-Synced Video Recording Script — Tribe Command Center
 *
 * Records video segments timed precisely to voiceover audio durations.
 * Then splits, merges with audio, and concatenates into final videos.
 *
 * Outputs:
 *   recordings/segments/01-intro-voiced.mp4          (NEW plan, 6 files)
 *   recordings/segments/new-plan-final.mp4           (all 6 concatenated)
 *   recordings/segments/old-01-...-voiced.mp4        (OLD plan, 5 files)
 *   recordings/segments/old-plan-final.mp4           (all 5 concatenated)
 *
 * Usage: npx tsx scripts/record-voiceover-sync.ts
 */

import { chromium, Page, BrowserContext, Browser } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess, execSync } from 'child_process';
import http from 'http';
import net from 'net';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4321;
const BASE_URL = `http://localhost:${PORT}`;
const PROJECT_DIR = path.resolve(__dirname, '..');
const RECORDINGS_DIR = path.resolve(PROJECT_DIR, 'recordings');
const SEGMENTS_DIR = path.resolve(RECORDINGS_DIR, 'segments');
const SCREENSHOTS_DIR = path.resolve(RECORDINGS_DIR, 'screenshots');
const VOICEOVERS_DIR = path.resolve(RECORDINGS_DIR, 'voiceovers');

[RECORDINGS_DIR, SEGMENTS_DIR, SCREENSHOTS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ═══════════════════════════════════════════════════════
// Voiceover Scene Definitions
// ═══════════════════════════════════════════════════════

interface VoiceoverScene {
  id: string;
  voiceoverFile: string;
  durationSec: number;
}

/** NEW PLAN — 6 consolidated scenes (from bottom of VIDEO_PLAN.md) */
const NEW_SCENES: VoiceoverScene[] = [
  { id: '01-intro',             voiceoverFile: '_Surviving_the_frontier_is_har (1).mp3', durationSec: 32.08 },
  { id: '02-dashboard',         voiceoverFile: '_It_starts_with_identity__Conn.mp3',     durationSec: 16.01 },
  { id: '03-intel-map',         voiceoverFile: '_Information_is_survival__The_ (1).mp3', durationSec: 34.35 },
  { id: '04-goals',             voiceoverFile: '_We_are_builders__and_goals_tr.mp3',     durationSec: 28.84 },
  { id: '05-fleets-reputation', voiceoverFile: '_Out_in_the_void__Fleet_Ops_co.mp3',     durationSec: 24.97 },
  { id: '06-outro',             voiceoverFile: '___Tribe_Command_Center__Built.mp3',     durationSec: 17.68 },
];

/** OLD PLAN — 5 detailed dashboard scenes (original script) */
const OLD_SCENES: VoiceoverScene[] = [
  { id: 'old-01-intro-title',        voiceoverFile: 'Tribe_Command_Center___a_strat.mp3',  durationSec: 11.23 },
  { id: 'old-02-dashboard-overview',  voiceoverFile: 'The_dashboard_is_every_member_.mp3',  durationSec: 11.52 },
  { id: 'old-03-resource-coverage',   voiceoverFile: 'Resource_Coverage_shows_how_ma.mp3',  durationSec: 16.20 },
  { id: 'old-04-goals-priority',      voiceoverFile: 'Goals_are_sorted_by_priority_a.mp3',  durationSec: 15.23 },
  { id: 'old-05-timeline',            voiceoverFile: 'The_project_timeline_gives_a_v.mp3',  durationSec: 12.07 },
];

// ═══════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createSceneClock(durationSec: number) {
  const startMs = Date.now();
  const durationMs = durationSec * 1000;
  const endMs = startMs + durationMs;

  return {
    /** Wait until at least this fraction (0-1) of the scene has elapsed */
    async at(fraction: number) {
      const targetMs = startMs + durationMs * fraction;
      const waitMs = targetMs - Date.now();
      if (waitMs > 0) await sleep(waitMs);
    },
    /** Wait until the end of the scene */
    async finish() {
      const waitMs = endMs - Date.now();
      if (waitMs > 0) await sleep(waitMs);
    },
    /** Remaining time in ms */
    remaining(): number {
      return Math.max(0, endMs - Date.now());
    },
    /** Elapsed time in seconds */
    elapsedSec(): number {
      return (Date.now() - startMs) / 1000;
    },
  };
}

async function slowScroll(page: Page, pixels: number, durationMs: number) {
  if (durationMs <= 0) return;
  // Smoother: 50ms intervals for ~20fps scrolling, each step uses smooth behavior
  const interval = 50;
  const steps = Math.max(5, Math.round(durationMs / interval));
  const perStep = pixels / steps;
  const delay = durationMs / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((px) => window.scrollBy({ top: px, behavior: 'smooth' }), perStep);
    await sleep(delay);
  }
}

async function scrollToTop(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(400);
}

async function checkpoint(page: Page, name: string) {
  const p = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: p });
  console.log(`  📸 ${name}`);
}

/** Move mouse to element center and hover briefly before clicking */
async function clickWithCursor(page: Page, locator: ReturnType<Page['locator']>, opts?: { preDelay?: number; postDelay?: number }) {
  await locator.scrollIntoViewIfNeeded();
  await sleep(150);
  const box = await locator.boundingBox();
  if (box) {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy, { steps: 12 });
    await sleep(opts?.preDelay ?? 250);
    // Show click ripple effect
    await page.evaluate(({ x, y }) => {
      const el = document.getElementById('__cursor_dot');
      if (el) {
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.opacity = '1';
        el.style.transform = 'translate(-50%,-50%) scale(1)';
        // Ripple ring
        const ring = document.getElementById('__cursor_ring');
        if (ring) {
          ring.style.left = `${x}px`;
          ring.style.top = `${y}px`;
          ring.style.opacity = '1';
          ring.style.transform = 'translate(-50%,-50%) scale(0.5)';
          ring.animate([
            { transform: 'translate(-50%,-50%) scale(0.5)', opacity: '1' },
            { transform: 'translate(-50%,-50%) scale(2.5)', opacity: '0' },
          ], { duration: 500, easing: 'ease-out' });
        }
      }
    }, { x: cx, y: cy });
  }
  await locator.click();
  await sleep(opts?.postDelay ?? 400);
  // Fade cursor dot
  await page.evaluate(() => {
    const el = document.getElementById('__cursor_dot');
    if (el) el.style.opacity = '0.6';
  });
}

/** Inject a visible cursor overlay into the page (CSS dot + ring that follows mouse) */
async function injectCursorOverlay(page: Page) {
  await page.evaluate(() => {
    // Cursor dot
    const dot = document.createElement('div');
    dot.id = '__cursor_dot';
    Object.assign(dot.style, {
      position: 'fixed', width: '18px', height: '18px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(99,102,241,0.9) 0%, rgba(99,102,241,0.4) 70%, transparent 100%)',
      pointerEvents: 'none', zIndex: '999999', opacity: '0',
      transform: 'translate(-50%,-50%) scale(1)',
      transition: 'left 0.08s ease-out, top 0.08s ease-out, opacity 0.3s',
      boxShadow: '0 0 12px 4px rgba(99,102,241,0.3)',
    });
    document.body.appendChild(dot);

    // Click ripple ring
    const ring = document.createElement('div');
    ring.id = '__cursor_ring';
    Object.assign(ring.style, {
      position: 'fixed', width: '36px', height: '36px', borderRadius: '50%',
      border: '2px solid rgba(99,102,241,0.6)',
      pointerEvents: 'none', zIndex: '999998', opacity: '0',
      transform: 'translate(-50%,-50%) scale(0.5)',
    });
    document.body.appendChild(ring);

    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
      dot.style.left = `${e.clientX}px`;
      dot.style.top = `${e.clientY}px`;
      dot.style.opacity = '0.8';
    });
  });
}

/** Type text with visible per-character delay */
async function typeVisible(page: Page, selector: string, text: string, charDelay = 60) {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await el.click();
  await sleep(100);
  await el.pressSequentially(text, { delay: charDelay });
}

/** Safe click — only clicks if element is visible, returns true if clicked */
async function safeClick(page: Page, locator: ReturnType<Page['locator']>, timeoutMs = 2000): Promise<boolean> {
  try {
    await locator.waitFor({ state: 'visible', timeout: timeoutMs });
    await clickWithCursor(page, locator);
    return true;
  } catch {
    return false;
  }
}

/** Navigate via navbar link click (more visual than page.goto) */
async function navClick(page: Page, label: string) {
  const link = page.locator(`a:has-text("${label}")`).first();
  await clickWithCursor(page, link, { preDelay: 150, postDelay: 800 });
}

async function startViteServer(): Promise<ChildProcess | null> {
  // Check if server is already running via raw TCP connect
  const alreadyUp = await new Promise<boolean>((resolve) => {
    const sock = net.createConnection({ port: PORT, host: '127.0.0.1' }, () => {
      sock.destroy();
      resolve(true);
    });
    sock.on('error', () => resolve(false));
    sock.setTimeout(2000, () => { sock.destroy(); resolve(false); });
  });
  if (alreadyUp) {
    console.log('  ✅ Vite already running on port ' + PORT);
    return null;
  }

  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
      cwd: PROJECT_DIR,
      stdio: 'pipe',
      shell: true,
    });
    child.stderr?.on('data', (d: Buffer) => process.stderr.write(d));
    const timeout = setTimeout(() => reject(new Error('Vite server did not start within 30s')), 30_000);
    const poll = setInterval(() => {
      const req = http.get(BASE_URL, (res) => {
        if (res.statusCode && res.statusCode < 400) {
          clearInterval(poll);
          clearTimeout(timeout);
          resolve(child);
        }
        res.resume();
      });
      req.on('error', () => {});
      req.end();
    }, 500);
    child.on('error', (err) => { clearInterval(poll); clearTimeout(timeout); reject(err); });
    child.on('exit', (code) => { clearInterval(poll); clearTimeout(timeout); reject(new Error(`Vite exited with ${code}`)); });
  });
}

async function loginAsZara(page: Page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await sleep(800);
  await page.evaluate(() => localStorage.removeItem('tribe-command-center'));
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(500);
  const btn = page.locator('button:has-text("Commander Zara")');
  await btn.waitFor({ state: 'visible', timeout: 5000 });
  await btn.click();
  await sleep(1500);
}

function exec(cmd: string): string {
  console.log(`  ⚙️  ${cmd.slice(0, 120)}...`);
  try {
    return execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (e: any) {
    // ffmpeg writes progress to stderr, check if output was actually produced
    if (e.stderr) {
      const lastLines = e.stderr.split('\n').slice(-5).join('\n');
      if (lastLines.includes('muxing overhead') || lastLines.includes('speed=')) {
        return e.stdout || '';
      }
    }
    throw e;
  }
}

// ═══════════════════════════════════════════════════════
// Teaser Intro — Cinematic Text Slides (no app footage)
// ═══════════════════════════════════════════════════════

interface TeaserSlide {
  lines: { text: string; fontSize: number; color: string; yOffset: number }[];
  durationSec: number;
  fadeIn: number;
  fadeOut: number;
}

const TEASER_SLIDES: TeaserSlide[] = [
  // 0-3.0s: "SURVIVING THE FRONTIER IS HARD ENOUGH" (voice: 0-2.26s)
  {
    lines: [
      { text: 'SURVIVING THE FRONTIER', fontSize: 62, color: 'white', yOffset: -35 },
      { text: 'IS HARD ENOUGH', fontSize: 62, color: '0x22d3ee', yOffset: 40 },
    ],
    durationSec: 3.0, fadeIn: 0.5, fadeOut: 0.5,
  },
  // 3.0-5.5s: "MANAGING YOUR TRIBE SHOULD NOT BE" (voice: 2.71-4.74s)
  {
    lines: [
      { text: 'MANAGING YOUR TRIBE', fontSize: 58, color: 'white', yOffset: -35 },
      { text: 'SHOULD NOT BE', fontSize: 58, color: '0x22d3ee', yOffset: 40 },
    ],
    durationSec: 2.5, fadeIn: 0.4, fadeOut: 0.5,
  },
  // 5.5-21.0s: "TRIBE COMMAND CENTER" big reveal — hold until voice finishes "replace chaos" (~20s)
  {
    lines: [
      { text: 'TRIBE COMMAND CENTER', fontSize: 80, color: 'white', yOffset: -50 },
      { text: 'A Strategic Coordination Platform', fontSize: 30, color: '0x94a3b8', yOffset: 25 },
      { text: 'for EVE Frontier', fontSize: 32, color: '0x22d3ee', yOffset: 65 },
    ],
    durationSec: 15.5, fadeIn: 0.8, fadeOut: 1.0,
  },
  // 21.0-32.08s: Feature keywords + closing (fadeIn ~1s so visible at ~22s, holds to end)
  {
    lines: [
      { text: 'MAP GATE NETWORKS', fontSize: 44, color: '0x22d3ee', yOffset: -90 },
      { text: 'COORDINATE BUILDING PROJECTS', fontSize: 44, color: 'white', yOffset: -20 },
      { text: 'LEAD FLEET OPERATIONS', fontSize: 44, color: '0x22d3ee', yOffset: 50 },
      { text: 'ALL UNIFIED. ALL IN ONE PLACE.', fontSize: 36, color: '0x94a3b8', yOffset: 120 },
    ],
    durationSec: 11.08, fadeIn: 1.0, fadeOut: 1.2,
  },
];

/**
 * Generate a single teaser slide via ffmpeg drawtext.
 * Returns path to generated mp4.
 */
function generateSlide(slide: TeaserSlide, index: number): string {
  const outputPath = path.join(SEGMENTS_DIR, `_teaser-slide-${index}.mp4`);
  const d = slide.durationSec;

  // Build drawtext filter chain for all text lines
  const textFilters = slide.lines.map((line, i) => {
    // Alpha expression: fade in, hold, fade out
    const alpha = `'if(lt(t,${slide.fadeIn}),t/${slide.fadeIn},if(gt(t,${(d - slide.fadeOut).toFixed(2)}),max(0,(${d.toFixed(2)}-t)/${slide.fadeOut}),1))'`;
    // Stagger each line slightly for a cascade effect
    const stagger = i * 0.15;
    const staggerAlpha = stagger > 0
      ? `'if(lt(t,${(slide.fadeIn + stagger).toFixed(2)}),max(0,(t-${stagger.toFixed(2)})/${slide.fadeIn}),if(gt(t,${(d - slide.fadeOut).toFixed(2)}),max(0,(${d.toFixed(2)}-t)/${slide.fadeOut}),1))'`
      : alpha;
    return `drawtext=text='${line.text}':fontsize=${line.fontSize}:fontcolor=${line.color}:x=(w-text_w)/2:y=(h/2)+${line.yOffset}:alpha=${staggerAlpha}`;
  });

  // Add vignette for cinematic feel
  const filterChain = textFilters.join(',') + ',vignette=PI/4';

  exec(
    `ffmpeg -y -f lavfi -i "color=c=0x0a0e1a:s=1920x1080:d=${d}:r=25" ` +
    `-vf "${filterChain}" ` +
    `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart ` +
    `-an "${outputPath}"`
  );

  return outputPath;
}

/**
 * Generate the full 32.08s teaser intro by creating individual slides
 * and concatenating them into one seamless video.
 */
function generateTeaserIntro(): string {
  console.log('\n🎬 Generating cinematic teaser intro...');
  const totalDur = TEASER_SLIDES.reduce((s, sl) => s + sl.durationSec, 0);
  console.log(`  📊 ${TEASER_SLIDES.length} slides, ${totalDur.toFixed(2)}s total`);

  // Generate each slide
  const slidePaths: string[] = [];
  for (let i = 0; i < TEASER_SLIDES.length; i++) {
    const p = generateSlide(TEASER_SLIDES[i], i);
    const sizeMB = (fs.statSync(p).size / (1024 * 1024)).toFixed(2);
    console.log(`  ✅ Slide ${i + 1}: ${TEASER_SLIDES[i].lines[0].text.slice(0, 30)}... (${TEASER_SLIDES[i].durationSec}s, ${sizeMB} MB)`);
    slidePaths.push(p);
  }

  // Concatenate all slides
  const outputPath = path.join(SEGMENTS_DIR, '01-intro.mp4');
  const listFile = path.join(SEGMENTS_DIR, '_teaser_concat.txt');
  const content = slidePaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
  fs.writeFileSync(listFile, content);

  exec(
    `ffmpeg -y -f concat -safe 0 -i "${listFile}" ` +
    `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart ` +
    `-an "${outputPath}"`
  );

  // Cleanup
  fs.unlinkSync(listFile);
  for (const sp of slidePaths) {
    if (fs.existsSync(sp)) fs.unlinkSync(sp);
  }

  const sizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
  console.log(`  🎬 Teaser intro: ${totalDur.toFixed(2)}s, ${sizeMB} MB`);
  return outputPath;
}

// ═══════════════════════════════════════════════════════
// NEW PLAN — Scene Runners (INTERACTIVE)
// ═══════════════════════════════════════════════════════

// NOTE: runNewIntro is no longer used for screen recording.
// The intro is now a cinematic teaser generated via ffmpeg (see generateTeaserIntro).

/**
 * DASHBOARD & IDENTITY (16.01s) — Login + Dashboard Interactive
 * "It starts with identity. Connect your EVE Vault wallet, and you're in.
 *  The dashboard is our strategic home base..."
 *
 * This scene now STARTS with the login screen (previously the intro showed login).
 */
async function runNewDashboard(page: Page) {
  const c = createSceneClock(NEW_SCENES[1].durationSec);
  console.log(`📍 DASHBOARD (${NEW_SCENES[1].durationSec}s) — Login + Interactive`);

  // "It starts with identity. Connect your EVE Vault wallet..."
  // Show login screen — fresh state
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await sleep(300);
  await page.evaluate(() => localStorage.removeItem('tribe-command-center'));
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(500);
  await checkpoint(page, 'new-11-login-screen');

  // Hover over "Connect EVE Vault" button to show it exists, then click demo login
  const connectBtn = page.locator('button:has-text("Connect EVE Vault")').first();
  if (await connectBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    const box = await connectBtn.boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
    await sleep(400);
  }
  await c.at(0.18); // ~2.9s

  // Click "Commander Zara" demo login
  const zaraBtn = page.locator('button:has-text("Commander Zara")');
  await zaraBtn.waitFor({ state: 'visible', timeout: 5000 });
  await clickWithCursor(page, zaraBtn, { preDelay: 300, postDelay: 1200 });

  // Inject visible cursor overlay for the rest of the recording
  await injectCursorOverlay(page);

  await checkpoint(page, 'new-12-dashboard-land');
  await c.at(0.35); // ~5.6s

  // "The dashboard is our strategic home base" — show stats row
  // Quick scroll to resource coverage
  await slowScroll(page, 400, 2000);
  await c.at(0.50); // ~8s
  await checkpoint(page, 'new-13-resource-coverage');

  // Toggle Timeline ON — shows Gantt chart
  const timelineBtn = page.locator('button:has-text("Timeline")').first();
  if (await safeClick(page, timelineBtn, 2000)) {
    await sleep(1500);
    await checkpoint(page, 'new-14-timeline-gantt');
    await c.at(0.70); // ~11.2s

    // Toggle off
    await safeClick(page, timelineBtn, 1500);
    await sleep(600);
  }

  // Scroll through goal tiles
  await slowScroll(page, 300, c.remaining() * 0.6);
  await checkpoint(page, 'new-15-dashboard-goals');

  await c.finish();
  console.log(`  ✅ DASHBOARD done (${c.elapsedSec().toFixed(1)}s)`);
}

/**
 * MAP, INTEL & CLAIMING (34.35s) — Interactive star map + claim + system detail
 * "Information is survival. The platform visualizes our territory using the
 *  live EVE Frontier World API..."
 */
async function runNewIntelMap(page: Page) {
  const c = createSceneClock(NEW_SCENES[2].durationSec);
  console.log(`📍 INTEL & MAP (${NEW_SCENES[2].durationSec}s) — Interactive`);

  // Navigate to Intel via navbar
  await navClick(page, 'Intel');
  await sleep(2000); // let star map render

  // First scroll to make the star map fully visible in the viewport
  await scrollToTop(page);
  await sleep(500);
  
  // Gently zoom out the star map (only 2 clicks for a moderate zoom, not too far)
  const zoomOutBtn = page.locator('button:has-text("−"), button:has-text("-")').first();
  for (let i = 0; i < 2; i++) {
    await safeClick(page, zoomOutBtn, 1000);
    await sleep(600);
  }
  await sleep(800);
  await c.at(0.08); // ~2.7s
  await checkpoint(page, 'new-15-intel-starmap');

  // Hover over a system node to show the tooltip popup
  // Find the canvas and slowly move cursor across it to trigger a system hover
  const canvas = page.locator('canvas').first();
  try {
    const canvasBox = await canvas.boundingBox();
    if (canvasBox) {
      // Move towards the center of the map where systems cluster
      const cx = canvasBox.x + canvasBox.width * 0.5;
      const cy = canvasBox.y + canvasBox.height * 0.45;
      // Scan horizontally in small steps to find a system dot
      for (let dx = -80; dx <= 80; dx += 20) {
        await page.mouse.move(cx + dx, cy, { steps: 4 });
        await sleep(120);
        // Check if tooltip appeared
        const tooltip = page.locator('div >> text=Threat').first();
        if (await tooltip.isVisible().catch(() => false)) break;
      }
      await sleep(1200); // hold hover to show the popup
      await checkpoint(page, 'new-15b-system-hover');
      // Move cursor away to dismiss tooltip
      await page.mouse.move(canvasBox.x + 50, canvasBox.y + 50, { steps: 6 });
      await sleep(300);
    }
  } catch { /* hover scan failed — continue */ }

  // "The platform visualizes our territory" — admire star map
  await c.at(0.16); // ~5.5s

  // "Gated Network feature uses real-time traversal" — CLICK CLAIM SYSTEM
  const claimBtn = page.locator('button:has-text("Claim System"), button:has-text("Claim")').first();
  if (await safeClick(page, claimBtn, 2000)) {
    await sleep(1000);
    await checkpoint(page, 'new-16-claim-panel');

    // Switch to Gated Network tab
    const gatedTab = page.locator('button:has-text("Gated Network")').first();
    if (await safeClick(page, gatedTab, 2000)) {
      await sleep(1000);
      // Type in the search box to show the search functionality
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      try {
        await searchInput.waitFor({ state: 'visible', timeout: 2000 });
        await searchInput.click();
        await searchInput.pressSequentially('AM1', { delay: 120 });
        await sleep(1500);
        await checkpoint(page, 'new-17-gated-search');
      } catch { /* search input not available */ }
    }
    await c.at(0.32); // ~11s

    // Close claim panel — press Escape or click Claim System again
    await page.keyboard.press('Escape');
    await sleep(500);
    // Click claim button again to toggle off if still open
    await safeClick(page, claimBtn, 1000);
    await sleep(500);
  }
  await c.at(0.38); // ~13s

  // "Clicking any node unlocks critical intel" — CLICK EG1-FRK (has rift sightings)
  await scrollToTop(page);
  await sleep(300);
  const egSystem = page.locator('text=EG1-FRK').first();
  if (await safeClick(page, egSystem, 3000)) {
    await sleep(2000);
    await checkpoint(page, 'new-18-eg1-detail');

    // "When a scout discovers a crude fuel rift..." — DEMO: Report a new rift sighting
    // Click "Report Rift" button in the detail panel header
    const reportRiftBtn = page.locator('button:has-text("Report Rift")').first();
    if (await safeClick(page, reportRiftBtn, 2000)) {
      await sleep(800);
      await checkpoint(page, 'new-19-rift-form-open');

      // Fill the rift report form
      const reporterInput = page.locator('input[placeholder*="Your name"]').last();
      try {
        await reporterInput.waitFor({ state: 'visible', timeout: 2000 });
        await reporterInput.click();
        await reporterInput.pressSequentially('Navigator Rex', { delay: 60 });
        await sleep(300);
      } catch { /* input not found */ }

      // Select rift type
      const riftTypeSelect = page.locator('select').last();
      try {
        await riftTypeSelect.selectOption({ label: 'Old Crude (SOF)' });
        await sleep(400);
      } catch { /* select not found */ }

      // Add notes
      const notesTextarea = page.locator('textarea[placeholder*="Location"]').first();
      try {
        await notesTextarea.waitFor({ state: 'visible', timeout: 2000 });
        await notesTextarea.click();
        await notesTextarea.pressSequentially('Rift spawned near planet 3, RIFT 0633', { delay: 30 });
        await sleep(400);
      } catch { /* textarea not found */ }

      await checkpoint(page, 'new-20-rift-form-filled');
      await c.at(0.55); // ~18.9s

      // Submit the rift report
      const submitRiftBtn = page.locator('button:has-text("Report Rift")').last();
      await safeClick(page, submitRiftBtn, 2000);
      await sleep(1000);
    }

    // Now open the Rift Sightings section to show the entry we just added
    const riftSection = page.locator('text=Rift Sightings').first();
    if (await safeClick(page, riftSection, 2000)) {
      await sleep(1500);
      await checkpoint(page, 'new-21-rift-sightings-open');

      // Scroll to show rift entries
      await slowScroll(page, 300, 2000);
      await sleep(1000);
      await checkpoint(page, 'new-22-rift-data');
    }
  }
  await c.at(0.88); // ~30.2s

  // "Over time, this collective intelligence allows us to predict future spawn locations"
  await checkpoint(page, 'new-23-intel-final');
  await c.finish();
  console.log(`  ✅ INTEL & MAP done (${c.elapsedSec().toFixed(1)}s)`);
}

/**
 * GOALS & THE PLEDGE SYSTEM (28.84s) — FULL PLEDGE → DELIVER → APPROVE DEMO
 * "We are builders, and goals track our monumental projects.
 *  This is driven by our Pledge, Deliver, and Approve workflow..."
 *
 * Interactive flow:
 *  1. Navigate to goal "Gated Network for Tribe Alpha"
 *  2. Expand task-2 "Deploy Gate in U5Q-VTK" (has 0 contributions, needs 460 Building Foam)
 *  3. Click "+ Pledge Resources" → PledgeModal opens
 *  4. Fill amount (250) → Click "Pledge"
 *  5. Contribution appears → Click "Delivered"
 *  6. Status → pending_approval → Click "Approve"
 */
async function runNewGoals(page: Page) {
  const c = createSceneClock(NEW_SCENES[3].durationSec);
  console.log(`📍 GOALS (${NEW_SCENES[3].durationSec}s) — Pledge/Deliver/Approve Demo`);

  // Navigate to Goals via SPA (avoid white frame from page.goto)
  await navClick(page, 'Dashboard');
  await sleep(800);
  // Scroll down to goal tiles and click the priority goal
  await slowScroll(page, 400, 1000);
  const goalTile = page.locator('text=Gated Network for Tribe Alpha').first();
  if (await safeClick(page, goalTile, 3000)) {
    await sleep(1500);
  }
  await c.at(0.08); // ~2.3s
  await checkpoint(page, 'new-23-goal-detail');

  // Scroll down to see task cards
  await slowScroll(page, 300, 1500);
  await c.at(0.15); // ~4.3s

  // Expand task-2 "Deploy Gate in U5Q-VTK" (has no contributions yet → perfect for pledge demo)
  const task2Header = page.locator('text=Deploy Gate in U5Q-VTK').first();
  if (await safeClick(page, task2Header, 3000)) {
    await sleep(800);
    await checkpoint(page, 'new-24-task-expanded');

    // CLICK "+ Pledge Resources"
    await c.at(0.22); // ~6.3s
    const pledgeBtn = page.locator('button:has-text("Pledge Resources")').first();
    if (await safeClick(page, pledgeBtn, 2000)) {
      await sleep(1000);
      await checkpoint(page, 'new-25-pledge-modal');

      // Modal is open — resource is pre-selected to "Building Foam"
      // Fill in amount: 250
      await c.at(0.30); // ~8.7s
      const amountInput = page.locator('input[type="number"]').first();
      try {
        await amountInput.waitFor({ state: 'visible', timeout: 2000 });
        await amountInput.click();
        await amountInput.fill('');
        await amountInput.pressSequentially('250', { delay: 100 });
        await sleep(600);
        await checkpoint(page, 'new-26-pledge-filled');
      } catch { /* amount input not found */ }

      // CLICK "Pledge" submit button
      await c.at(0.38); // ~11s
      const submitPledge = page.locator('button:has-text("Pledge")').last();
      await safeClick(page, submitPledge, 2000);
      await sleep(1200);
      await checkpoint(page, 'new-27-pledge-submitted');
    }
  }

  // Now the contribution should appear in the task card
  // Scroll to see it
  await c.at(0.48); // ~13.8s
  await slowScroll(page, 200, 1000);

  // CLICK "Delivered" on our new contribution
  await c.at(0.55); // ~15.9s
  const deliveredBtn = page.locator('button:has-text("Delivered")').first();
  if (await safeClick(page, deliveredBtn, 3000)) {
    await sleep(1200);
    await checkpoint(page, 'new-28-delivered');

    // CLICK "Approve" (Commander Zara is leader, can approve)
    await c.at(0.65); // ~18.7s
    const approveBtn = page.locator('button:has-text("Approve")').first();
    if (await safeClick(page, approveBtn, 3000)) {
      await sleep(1200);
      await checkpoint(page, 'new-29-approved');
    }
  }

  // "Trust is earned: normal goals are public, classified require Veteran clearance"
  // Show the first task (task-1) which already has contributions — expand it
  await c.at(0.75); // ~21.6s
  await scrollToTop(page);
  await sleep(300);
  const task1Header = page.locator('text=Deploy Gate in AM1-9KK').first();
  if (await safeClick(page, task1Header, 2000)) {
    await sleep(800);
    // Scroll through existing contributions (Rex delivered, Kael partial)
    await slowScroll(page, 300, 2000);
    await checkpoint(page, 'new-30-existing-contribs');
  }

  await c.at(0.88); // ~25.4s
  // Brief scroll through remaining content
  await slowScroll(page, 200, c.remaining() * 0.5);
  await checkpoint(page, 'new-31-goals-final');

  await c.finish();
  console.log(`  ✅ GOALS done (${c.elapsedSec().toFixed(1)}s)`);
}

/**
 * FLEETS & REPUTATION (24.97s) — CREATE FLEET OP + RSVP LIVE
 * "Out in the void, Fleet Ops coordinate our maneuvers. Whether it's a perimeter
 *  sweep, a deep-space extraction, or an all-out offensive..."
 *
 * Interactive flow:
 *  1. Navigate to Fleets page (upcoming fleets visible)
 *  2. Expand "Past Operations" to show old fleets
 *  3. Click "New Fleet Op" → fill form live → submit (appears in upcoming)
 *  4. Expand existing fleet → click RSVP "Coming"
 *  5. Quick visit to Members + Leaderboard
 */
async function runNewFleetsReputation(page: Page) {
  const c = createSceneClock(NEW_SCENES[4].durationSec);
  console.log(`📍 FLEETS & REPUTATION (${NEW_SCENES[4].durationSec}s) — Fleet Creation + RSVP`);

  // Navigate to Fleets — upcoming fleet ops should be visible
  await navClick(page, 'Fleets');
  await sleep(1000);
  await c.at(0.06); // ~1.5s
  await checkpoint(page, 'new-32-fleets');

  // Expand "Past Operations" to show old completed fleets
  const pastOpsBtn = page.locator('button:has-text("Past Operations")').first();
  if (await safeClick(page, pastOpsBtn, 2000)) {
    await sleep(800);
    await slowScroll(page, 300, 1000);
    await checkpoint(page, 'new-32b-past-fleets');
  }

  // Scroll back up to top
  await c.at(0.16); // ~4s
  await scrollToTop(page);
  await sleep(500);

  // CLICK "New Fleet Op" → CREATE FLEET LIVE
  const newFleetBtn = page.locator('button:has-text("New Fleet Op")').first();
  if (await safeClick(page, newFleetBtn, 2000)) {
    await sleep(800);
    await checkpoint(page, 'new-33-fleet-modal');

    // Fill Title
    const titleInput = page.locator('input[placeholder*="Gate Deployment"]').first();
    try {
      await titleInput.waitFor({ state: 'visible', timeout: 2000 });
      await titleInput.click();
      await titleInput.pressSequentially('AM1-9KK Gate Defense', { delay: 50 });
      await sleep(400);
    } catch { /* title input not found by placeholder */ }

    // Fill Goal/Objective
    await c.at(0.26); // ~6.5s
    const goalTextarea = page.locator('textarea[placeholder*="plan"]').first();
    try {
      await goalTextarea.waitFor({ state: 'visible', timeout: 2000 });
      await goalTextarea.click();
      await goalTextarea.pressSequentially('Protect gate deployment team during construction. Bring combat ships.', { delay: 30 });
      await sleep(400);
    } catch { /* goal textarea not found */ }

    await checkpoint(page, 'new-34-fleet-filled');

    // CLICK "Create Fleet Op"
    await c.at(0.32); // ~8s
    const createFleetBtn = page.locator('button:has-text("Create Fleet Op")').first();
    await safeClick(page, createFleetBtn, 2000);
    await sleep(1200);
    await checkpoint(page, 'new-35-fleet-created');
  }

  // EXPAND EXISTING FLEET → RSVP
  await c.at(0.42); // ~10.5s
  // Click on the upcoming "ONG-CSK Deep Strike" fleet card
  const fleetCard = page.locator('text=ONG-CSK Deep Strike').first();
  if (await safeClick(page, fleetCard, 2000)) {
    await sleep(800);
    await checkpoint(page, 'new-36-fleet-expanded');

    // Click "Coming" RSVP button
    await c.at(0.48); // ~12s
    const comingBtn = page.locator('button:has-text("Coming")').first();
    await safeClick(page, comingBtn, 2000);
    await sleep(800);
    await checkpoint(page, 'new-37-rsvp-clicked');
  }

  // "builds your reputation score" — Visit Members page
  await c.at(0.60); // ~15s
  await navClick(page, 'Members');
  await sleep(1000);
  await checkpoint(page, 'new-38-members');
  await slowScroll(page, 200, 1500);

  // Navigate to Leaderboard
  await c.at(0.72); // ~18s
  await navClick(page, 'Leaderboard');
  await sleep(1000);
  await checkpoint(page, 'new-39-leaderboard');

  // Click on a member row to expand contribution history
  await c.at(0.80); // ~20s
  const memberRow = page.locator('text=Navigator Rex').first();
  if (await safeClick(page, memberRow, 2000)) {
    await sleep(1200);
    await checkpoint(page, 'new-40-member-expanded');

    // Scroll to show the contribution breakdown
    await slowScroll(page, 250, 1500);
    await sleep(800);
    await checkpoint(page, 'new-41-member-contributions');
  }

  // "driving the cooperation that keeps our tribe alive on the global leaderboards"
  await slowScroll(page, 200, 1500);
  await c.finish();
  console.log(`  ✅ FLEETS & REPUTATION done (${c.elapsedSec().toFixed(1)}s)`);
}

/**
 * OUTRO (17.68s) — Alliance + News + Final Dashboard
 * "Tribe Command Center. Built with React 19, TypeScript, and Sui Move smart
 *  contracts. Forged for the EVE Frontier × Sui Hackathon 2026..."
 */
async function runNewOutro(page: Page) {
  const c = createSceneClock(NEW_SCENES[5].durationSec);
  console.log(`📍 OUTRO (${NEW_SCENES[5].durationSec}s) — Final Montage`);

  // Quick look at Alliance
  await navClick(page, 'Alliance');
  await sleep(1200);
  await checkpoint(page, 'new-42-alliance');
  await c.at(0.18); // ~3.2s

  // Quick look at News
  await navClick(page, 'News');
  await sleep(1000);
  await checkpoint(page, 'new-43-news');
  await c.at(0.32); // ~5.7s

  // Navigate back to Dashboard for the cinematic final shot
  await navClick(page, 'Dashboard');
  await sleep(1200);
  await c.at(0.45); // ~8s
  await checkpoint(page, 'new-44-outro-dashboard');

  // "Replacing chaos with clarity. The foundation is set. It's time to build."
  // Slow cinematic scroll through the full dashboard — the final impression
  const scrollTime = c.remaining() * 0.7;
  await slowScroll(page, 500, scrollTime);
  await checkpoint(page, 'new-45-final');

  await c.finish();
  console.log(`  ✅ OUTRO done (${c.elapsedSec().toFixed(1)}s)`);
}

// ═══════════════════════════════════════════════════════
// OLD PLAN — Scene Runners (Dashboard Detail)
// ═══════════════════════════════════════════════════════

/**
 * OLD-01: "Tribe Command Center — a strategic coordination platform..." (11.23s)
 */
async function runOldIntro(page: Page) {
  const c = createSceneClock(OLD_SCENES[0].durationSec);
  console.log(`📍 OLD INTRO (${OLD_SCENES[0].durationSec}s)`);

  // Show login page with branding
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await sleep(500);
  await page.evaluate(() => localStorage.removeItem('tribe-command-center'));
  await page.reload({ waitUntil: 'networkidle' });
  await c.at(0.35);
  await checkpoint(page, 'old-01-login');

  // Click Commander Zara
  const btn = page.locator('button:has-text("Commander Zara")');
  await btn.waitFor({ state: 'visible', timeout: 5000 });
  await btn.click();
  await c.at(0.65);
  await checkpoint(page, 'old-02-logged-in');

  await c.finish();
  console.log(`  ✅ OLD INTRO done`);
}

/**
 * OLD-02: "The dashboard is every member's home base..." (11.52s)
 */
async function runOldDashboardOverview(page: Page) {
  const c = createSceneClock(OLD_SCENES[1].durationSec);
  console.log(`📍 OLD DASHBOARD OVERVIEW (${OLD_SCENES[1].durationSec}s)`);

  // Dashboard top section — stats and activity feed
  await scrollToTop(page);
  await sleep(500);
  await c.at(0.20);
  await checkpoint(page, 'old-03-stats');

  // Scroll through activity feed
  await slowScroll(page, 350, 4000);
  await c.at(0.60);
  await checkpoint(page, 'old-04-activity');

  await slowScroll(page, 200, 2000);
  await c.finish();
  console.log(`  ✅ OLD DASHBOARD OVERVIEW done`);
}

/**
 * OLD-03: "Resource Coverage shows how many systems have all ore types..." (16.20s)
 */
async function runOldResourceCoverage(page: Page) {
  const c = createSceneClock(OLD_SCENES[2].durationSec);
  console.log(`📍 OLD RESOURCE COVERAGE (${OLD_SCENES[2].durationSec}s)`);

  // Scroll to resource coverage from wherever we are
  await scrollToTop(page);
  await sleep(300);
  // Resource coverage is typically after stats + activity
  await page.evaluate(() => window.scrollBy({ top: 550, behavior: 'smooth' }));
  await sleep(1500);
  await c.at(0.20);
  await checkpoint(page, 'old-05-resource-panel');

  // Hold on resource coverage
  await c.at(0.55);

  // Slow scroll through the coverage bars
  await slowScroll(page, 150, 3000);
  await c.at(0.80);
  await checkpoint(page, 'old-06-resource-bars');

  await c.finish();
  console.log(`  ✅ OLD RESOURCE COVERAGE done`);
}

/**
 * OLD-04: "Goals are sorted by priority and deadline..." (15.23s)
 */
async function runOldGoalsPriority(page: Page) {
  const c = createSceneClock(OLD_SCENES[3].durationSec);
  console.log(`📍 OLD GOALS PRIORITY (${OLD_SCENES[3].durationSec}s)`);

  // Scroll to goals section
  await slowScroll(page, 300, 2000);
  await c.at(0.20);
  await checkpoint(page, 'old-07-goals-grid');

  // Hold on priority goal
  await c.at(0.50);

  // Scroll through more goals
  await slowScroll(page, 400, 3000);
  await c.at(0.80);
  await checkpoint(page, 'old-08-goals-more');

  await c.finish();
  console.log(`  ✅ OLD GOALS PRIORITY done`);
}

/**
 * OLD-05: "The project timeline gives a visual overview of all goals..." (12.07s)
 */
async function runOldTimeline(page: Page) {
  const c = createSceneClock(OLD_SCENES[4].durationSec);
  console.log(`📍 OLD TIMELINE (${OLD_SCENES[4].durationSec}s)`);

  // Scroll to where Timeline button is
  await scrollToTop(page);
  await page.evaluate(() => window.scrollBy({ top: 600, behavior: 'smooth' }));
  await sleep(1000);
  await c.at(0.15);

  // Click Timeline toggle
  const timelineBtn = page.locator('button:has-text("Timeline")').first();
  if (await timelineBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await timelineBtn.click();
    await sleep(2000);
    await checkpoint(page, 'old-09-timeline-gantt');

    // Hold on the Gantt chart
    await c.at(0.65);

    // Slow scroll across the timeline
    await slowScroll(page, 200, 2000);
    await checkpoint(page, 'old-10-timeline-scroll');
  }

  await c.finish();
  console.log(`  ✅ OLD TIMELINE done`);
}

// ═══════════════════════════════════════════════════════
// Recording Orchestration
// ═══════════════════════════════════════════════════════

async function recordVideo(
  browser: Browser,
  label: string,
  runner: (page: Page) => Promise<void>,
): Promise<string> {
  console.log(`\n🎬 Recording: ${label}`);
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: RECORDINGS_DIR, size: { width: 1920, height: 1080 } },
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  const videoPathPromise = page.video()?.path();

  await runner(page);

  await page.close();
  await context.close();

  const videoPath = await videoPathPromise;
  if (!videoPath || !fs.existsSync(videoPath)) {
    throw new Error(`Video file not found for ${label}`);
  }
  const sizeMB = (fs.statSync(videoPath).size / (1024 * 1024)).toFixed(2);
  console.log(`✅ ${label} recorded: ${path.basename(videoPath)} (${sizeMB} MB)`);
  return videoPath;
}

// ═══════════════════════════════════════════════════════
// FFmpeg Post-Processing
// ═══════════════════════════════════════════════════════

function splitVideo(
  inputWebm: string,
  scenes: VoiceoverScene[],
  outputDir: string,
): string[] {
  console.log(`\n✂️  Splitting ${path.basename(inputWebm)} into ${scenes.length} segments...`);
  const outputPaths: string[] = [];
  let startSec = 0;

  for (const scene of scenes) {
    const outputPath = path.join(outputDir, `${scene.id}.mp4`);
    exec(
      `ffmpeg -y -ss ${startSec.toFixed(3)} -i "${inputWebm}" ` +
      `-t ${scene.durationSec.toFixed(3)} ` +
      `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart ` +
      `-an "${outputPath}"`
    );
    const sizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
    console.log(`  ✅ ${scene.id}.mp4 (${sizeMB} MB, ${scene.durationSec}s)`);
    outputPaths.push(outputPath);
    startSec += scene.durationSec;
  }

  return outputPaths;
}

function mergeWithVoiceover(videoPath: string, voiceoverFile: string, outputPath: string) {
  const voiceoverPath = path.join(VOICEOVERS_DIR, voiceoverFile);
  if (!fs.existsSync(voiceoverPath)) {
    console.warn(`  ⚠️  Voiceover not found: ${voiceoverFile}, skipping merge`);
    // Just copy the video without audio
    fs.copyFileSync(videoPath, outputPath);
    return;
  }
  exec(
    `ffmpeg -y -i "${videoPath}" -i "${voiceoverPath}" ` +
    `-c:v copy -c:a aac -b:a 192k -shortest "${outputPath}"`
  );
}

function concatenateVideos(inputPaths: string[], outputPath: string) {
  const listFile = path.join(SEGMENTS_DIR, '_concat_list.txt');
  const content = inputPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
  fs.writeFileSync(listFile, content);

  exec(
    `ffmpeg -y -f concat -safe 0 -i "${listFile}" ` +
    `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart ` +
    `-c:a aac -b:a 192k "${outputPath}"`
  );

  fs.unlinkSync(listFile);
}

// ═══════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════

async function main() {
  console.log('════════════════════════════════════════════════════');
  console.log('  Tribe Command Center — Voiceover-Synced Recording');
  console.log('════════════════════════════════════════════════════');

  const newTotal = NEW_SCENES.reduce((s, sc) => s + sc.durationSec, 0);
  const oldTotal = OLD_SCENES.reduce((s, sc) => s + sc.durationSec, 0);
  console.log(`\n📊 NEW plan: 6 scenes, ${newTotal.toFixed(1)}s total`);
  console.log(`📊 OLD plan: 5 scenes, ${oldTotal.toFixed(1)}s total`);

  // Verify voiceover files exist
  let missing = 0;
  for (const scene of [...NEW_SCENES, ...OLD_SCENES]) {
    const fp = path.join(VOICEOVERS_DIR, scene.voiceoverFile);
    if (!fs.existsSync(fp)) {
      console.warn(`⚠️  Missing voiceover: ${scene.voiceoverFile}`);
      missing++;
    }
  }
  if (missing > 0) {
    console.warn(`\n⚠️  ${missing} voiceover files missing — videos will be without audio`);
  }

  // Start Vite
  console.log('\n🚀 Starting Vite dev server...');
  const viteProcess = await startViteServer();
  console.log(`✅ Vite ready at ${BASE_URL}`);

  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--window-size=1920,1080', '--disable-gpu'],
    });

    // ═══════════════════════════════════════
    // STEP 1: Generate cinematic teaser intro (no browser needed)
    // ═══════════════════════════════════════
    const teaserIntroPath = generateTeaserIntro();

    // ═══════════════════════════════════════
    // STEP 2: Record scenes 2-6 (browser sessions)
    // ═══════════════════════════════════════
    const BROWSER_SCENES = NEW_SCENES.slice(1); // scenes 2-6 (dashboard, intel, goals, fleets, outro)
    const browserWebm = await recordVideo(browser, 'NEW PLAN (Scenes 2-6)', async (page) => {
      await runNewDashboard(page);
      await runNewIntelMap(page);
      await runNewGoals(page);
      await runNewFleetsReputation(page);
      await runNewOutro(page);
    });

    // ═══════════════════════════════════════
    // RECORDING 2: OLD PLAN (5 dashboard scenes)
    // ═══════════════════════════════════════
    const oldWebm = await recordVideo(browser, 'OLD PLAN (Dashboard Detail)', async (page) => {
      await runOldIntro(page);
      await runOldDashboardOverview(page);
      await runOldResourceCoverage(page);
      await runOldGoalsPriority(page);
      await runOldTimeline(page);
    });

    await browser.close();

    // ═══════════════════════════════════════
    // POST-PROCESSING
    // ═══════════════════════════════════════
    console.log('\n═══════════════════════════════════════');
    console.log('  POST-PROCESSING');
    console.log('═══════════════════════════════════════');

    // Split browser recording (scenes 2-6) into 5 segments
    const browserSegments = splitVideo(browserWebm, BROWSER_SCENES, SEGMENTS_DIR);

    // The intro segment is the teaser (already at 01-intro.mp4)
    const newSegments = [teaserIntroPath, ...browserSegments];

    // Split OLD plan into 5 segments
    const oldSegments = splitVideo(oldWebm, OLD_SCENES, SEGMENTS_DIR);

    // Merge each segment with its voiceover audio
    console.log('\n🔊 Merging segments with voiceover audio...');
    const newVoicedPaths: string[] = [];
    for (let i = 0; i < NEW_SCENES.length; i++) {
      const voicedPath = path.join(SEGMENTS_DIR, `${NEW_SCENES[i].id}-voiced.mp4`);
      mergeWithVoiceover(newSegments[i], NEW_SCENES[i].voiceoverFile, voicedPath);
      newVoicedPaths.push(voicedPath);
      const sizeMB = (fs.statSync(voicedPath).size / (1024 * 1024)).toFixed(2);
      console.log(`  ✅ ${NEW_SCENES[i].id}-voiced.mp4 (${sizeMB} MB)`);
    }

    const oldVoicedPaths: string[] = [];
    for (let i = 0; i < OLD_SCENES.length; i++) {
      const voicedPath = path.join(SEGMENTS_DIR, `${OLD_SCENES[i].id}-voiced.mp4`);
      mergeWithVoiceover(oldSegments[i], OLD_SCENES[i].voiceoverFile, voicedPath);
      oldVoicedPaths.push(voicedPath);
      const sizeMB = (fs.statSync(voicedPath).size / (1024 * 1024)).toFixed(2);
      console.log(`  ✅ ${OLD_SCENES[i].id}-voiced.mp4 (${sizeMB} MB)`);
    }

    // Concatenate NEW plan segments into final video
    console.log('\n🎞️  Concatenating NEW plan final video...');
    const newFinalPath = path.join(SEGMENTS_DIR, 'new-plan-final.mp4');
    concatenateVideos(newVoicedPaths, newFinalPath);
    const newFinalSize = (fs.statSync(newFinalPath).size / (1024 * 1024)).toFixed(2);
    console.log(`✅ new-plan-final.mp4 (${newFinalSize} MB)`);

    // Concatenate OLD plan segments into final video
    console.log('\n🎞️  Concatenating OLD plan final video...');
    const oldFinalPath = path.join(SEGMENTS_DIR, 'old-plan-final.mp4');
    concatenateVideos(oldVoicedPaths, oldFinalPath);
    const oldFinalSize = (fs.statSync(oldFinalPath).size / (1024 * 1024)).toFixed(2);
    console.log(`✅ old-plan-final.mp4 (${oldFinalSize} MB)`);

    // ═══════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════
    console.log('\n════════════════════════════════════════════════════');
    console.log('  RECORDING COMPLETE — OUTPUT SUMMARY');
    console.log('════════════════════════════════════════════════════');
    console.log('\n📁 NEW PLAN (voiced segments):');
    for (const vp of newVoicedPaths) {
      const size = (fs.statSync(vp).size / (1024 * 1024)).toFixed(2);
      console.log(`  ${path.basename(vp)} — ${size} MB`);
    }
    console.log(`  🎬 new-plan-final.mp4 — ${newFinalSize} MB ← SUBMIT THIS`);

    console.log('\n📁 OLD PLAN (voiced segments):');
    for (const vp of oldVoicedPaths) {
      const size = (fs.statSync(vp).size / (1024 * 1024)).toFixed(2);
      console.log(`  ${path.basename(vp)} — ${size} MB`);
    }
    console.log(`  🎬 old-plan-final.mp4 — ${oldFinalSize} MB`);

    console.log('\n📁 Video-only segments (no audio):');
    const allSegments = [...newSegments, ...oldSegments];
    for (const sp of allSegments) {
      const size = (fs.statSync(sp).size / (1024 * 1024)).toFixed(2);
      console.log(`  ${path.basename(sp)} — ${size} MB`);
    }

    console.log('\n✅ All done! Total files:', allSegments.length + newVoicedPaths.length + oldVoicedPaths.length + 2);

  } finally {
    console.log('\n🛑 Shutting down Vite server...');
    viteProcess?.kill();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
