/**
 * Playwright Video Recording Script — Tribe Command Center Demo
 * 
 * Records a ~2.5min walkthrough of the app following the VIDEO_PLAN.md scenes.
 * Outputs a .webm video file to ./recordings/
 * 
 * Usage: npx tsx scripts/record-demo.ts
 */

import { chromium, Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 4321;
const BASE_URL = `http://localhost:${PORT}`;
const PROJECT_DIR = path.resolve(__dirname, '..');
const RECORDINGS_DIR = path.resolve(PROJECT_DIR, 'recordings');
const SCREENSHOTS_DIR = path.resolve(PROJECT_DIR, 'recordings', 'screenshots');

// Ensure output directories exist
fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

/** Spawn vite dev server and wait until it responds */
function startViteServer(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
      cwd: PROJECT_DIR,
      stdio: 'pipe',
      shell: true,
    });

    child.stderr?.on('data', (d: Buffer) => process.stderr.write(d));

    const timeout = setTimeout(() => {
      reject(new Error('Vite server did not start within 30s'));
    }, 30_000);

    const poll = setInterval(() => {
      const req = http.get(BASE_URL, (res) => {
        if (res.statusCode && res.statusCode < 400) {
          clearInterval(poll);
          clearTimeout(timeout);
          resolve(child);
        }
        res.resume();
      });
      req.on('error', () => { /* not ready yet */ });
      req.end();
    }, 500);

    child.on('error', (err) => { clearInterval(poll); clearTimeout(timeout); reject(err); });
    child.on('exit', (code) => { clearInterval(poll); clearTimeout(timeout); reject(new Error(`Vite exited with ${code}`)); });
  });
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function slowScroll(page: Page, pixels: number, durationMs: number) {
  const steps = Math.max(5, Math.round(durationMs / 300));
  const perStep = pixels / steps;
  const delay = durationMs / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate((px) => window.scrollBy({ top: px, behavior: 'smooth' }), perStep);
    await sleep(delay);
  }
}

async function scrollToTop(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(600);
}

/** Take a debug screenshot and log page title */
async function checkpoint(page: Page, name: string) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath });
  const title = await page.title();
  const url = page.url();
  console.log(`  📸 ${name} — url: ${url}, title: "${title}"`);
  // Check for login page indicators
  const hasLoginText = await page.locator('text=Connect EVE Vault').isVisible().catch(() => false);
  const hasDemoAccess = await page.locator('text=Demo Access').isVisible().catch(() => false);
  if (hasLoginText || hasDemoAccess) {
    console.log(`  ⚠️  WARNING: Still on login screen at checkpoint "${name}"!`);
  }
}

async function main() {
  console.log('🎬 Starting Tribe Command Center demo recording...');
  console.log(`📁 Output directory: ${RECORDINGS_DIR}`);

  console.log('🚀 Starting Vite dev server...');
  const viteProcess = await startViteServer();
  console.log(`✅ Vite ready at ${BASE_URL}`);

  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--window-size=1920,1080', '--disable-gpu'],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: RECORDINGS_DIR,
        size: { width: 1920, height: 1080 },
      },
      colorScheme: 'dark',
    });

    const page = await context.newPage();

    // ═══════════════════════════════════════════
    // LOGIN — Click demo access button (5s)
    // ═══════════════════════════════════════════
    console.log('📍 Login: Navigating to app...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await sleep(1500);
    await checkpoint(page, '01-login-screen');

    // Clear any stale localStorage and reload for clean state
    await page.evaluate(() => localStorage.removeItem('tribe-command-center'));
    await page.reload({ waitUntil: 'networkidle' });
    await sleep(1000);

    // Click "Commander Zara" demo login button
    console.log('  🔑 Clicking Commander Zara demo login...');
    const zaraBtn = page.locator('button:has-text("Commander Zara")');
    await zaraBtn.waitFor({ state: 'visible', timeout: 5000 });
    await zaraBtn.click();
    await sleep(2000);

    // Verify we're past login
    await checkpoint(page, '02-after-login');
    const stillOnLogin = await page.locator('text=Demo Access').isVisible().catch(() => false);
    if (stillOnLogin) {
      console.error('❌ FATAL: Still on login screen after clicking demo button!');
      await page.close();
      await context.close();
      await browser.close();
      process.exit(1);
    }
    console.log('  ✅ Successfully logged in as Commander Zara');

    // ═══════════════════════════════════════════
    // SCENE 1 — Dashboard Overview (~35s)
    // ═══════════════════════════════════════════
    console.log('📍 Scene 1: Dashboard Overview');
    await sleep(3000); // Let dashboard render fully
    await checkpoint(page, '03-dashboard-top');

    // Slowly scroll through stats and activity feed
    await slowScroll(page, 500, 4000);
    await sleep(2000);
    await checkpoint(page, '04-dashboard-mid');

    // Continue scrolling to resource coverage
    await slowScroll(page, 400, 3000);
    await sleep(2000);

    // Scroll to goals section
    await slowScroll(page, 400, 3000);
    await sleep(2000);
    await checkpoint(page, '05-dashboard-goals');

    // Toggle Timeline view
    const timelineBtn = page.locator('button:has-text("Timeline")').first();
    if (await timelineBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await scrollToTop(page);
      await page.evaluate(() => window.scrollBy({ top: 600, behavior: 'smooth' }));
      await sleep(1000);
      await timelineBtn.click();
      await sleep(4000); // Let timeline render and show for a while
      await checkpoint(page, '06-dashboard-timeline');
      await timelineBtn.click(); // Toggle off
      await sleep(1000);
    }

    // Continue scrolling to show remaining goals
    await slowScroll(page, 600, 4000);
    await sleep(1500);

    // ═══════════════════════════════════════════
    // SCENE 2 — Intel & Territory Map (~40s)
    // ═══════════════════════════════════════════
    console.log('📍 Scene 2: Intel & Territory Map');
    await page.goto(`${BASE_URL}/intel`, { waitUntil: 'networkidle' });
    await sleep(4000); // Let the star map fully render
    await checkpoint(page, '07-intel-starmap');

    // Click on AM1-9KK (HQ)
    const hqLabel = page.locator('text=AM1-9KK').first();
    if (await hqLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hqLabel.click();
      await sleep(3000);
      await checkpoint(page, '08-intel-am1');
      await slowScroll(page, 600, 4000);
      await sleep(2000);
    }

    await scrollToTop(page);
    await sleep(1000);

    // Click on EG1-FRK for rift sightings
    const riftLabel = page.locator('text=EG1-FRK').first();
    if (await riftLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
      await riftLabel.click();
      await sleep(3000);
      await checkpoint(page, '09-intel-rift');
      await slowScroll(page, 400, 3000);
      await sleep(2000);
    }

    // ═══════════════════════════════════════════
    // SCENE 3 — Claiming a Gated Network (~20s)
    // ═══════════════════════════════════════════
    console.log('📍 Scene 3: Claim Gated Network');
    await scrollToTop(page);
    await sleep(500);

    const claimBtn = page.locator('button:has-text("Claim System"), button:has-text("Claim")').first();
    if (await claimBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await claimBtn.click();
      await sleep(2500);
      await checkpoint(page, '10-claim-modal');

      const gatedTab = page.locator('button:has-text("Gated Network")').first();
      if (await gatedTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await gatedTab.click();
        await sleep(3000);
        await checkpoint(page, '11-gated-network');
      }

      await page.keyboard.press('Escape');
      await sleep(1000);
    }

    // ═══════════════════════════════════════════
    // SCENE 4 — Goals & Collaborative Building (~30s)
    // ═══════════════════════════════════════════
    console.log('📍 Scene 4: Goals Detail');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await sleep(2000);

    // Click on the priority/first goal
    const goalLink = page.locator('h3').first();
    if (await goalLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await goalLink.scrollIntoViewIfNeeded();
      await sleep(500);
      await goalLink.click();
      await sleep(3000);
      await checkpoint(page, '12-goal-detail');
      await slowScroll(page, 800, 5000);
      await sleep(2000);
      await checkpoint(page, '13-goal-contributions');
    }

    // Visit a second goal
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await sleep(1500);
    // Scroll down to show more goals, click the second one
    await page.evaluate(() => window.scrollBy({ top: 800, behavior: 'smooth' }));
    await sleep(1000);
    const secondGoal = page.locator('h3').nth(2);
    if (await secondGoal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await secondGoal.click();
      await sleep(3000);
      await slowScroll(page, 500, 3000);
      await sleep(1500);
    }

    // ═══════════════════════════════════════════
    // SCENE 5 — Fleet Operations (~20s)
    // ═══════════════════════════════════════════
    console.log('📍 Scene 5: Fleet Ops');
    await page.goto(`${BASE_URL}/fleets`, { waitUntil: 'networkidle' });
    await sleep(3000);
    await checkpoint(page, '14-fleets');
    await slowScroll(page, 800, 5000);
    await sleep(2000);

    // ═══════════════════════════════════════════
    // SCENE 6 — Members & Reputation (~15s)
    // ═══════════════════════════════════════════
    console.log('📍 Scene 6: Members');
    await page.goto(`${BASE_URL}/members`, { waitUntil: 'networkidle' });
    await sleep(3000);
    await checkpoint(page, '15-members');
    await slowScroll(page, 600, 4000);
    await sleep(2000);

    // ═══════════════════════════════════════════
    // SCENE 7 — Leaderboard (~10s)
    // ═══════════════════════════════════════════
    console.log('📍 Scene 7: Leaderboard');
    await page.goto(`${BASE_URL}/leaderboard`, { waitUntil: 'networkidle' });
    await sleep(3000);
    await checkpoint(page, '16-leaderboard');
    await slowScroll(page, 300, 2000);
    await sleep(1500);

    // ═══════════════════════════════════════════
    // SCENE 8 — Alliance (~15s)
    // ═══════════════════════════════════════════
    console.log('📍 Scene 8: Alliance');
    await page.goto(`${BASE_URL}/alliance`, { waitUntil: 'networkidle' });
    await sleep(3000);
    await checkpoint(page, '17-alliance');
    await slowScroll(page, 400, 3000);
    await sleep(2000);

    // ═══════════════════════════════════════════
    // SCENE 9 — News Timeline (~10s)
    // ═══════════════════════════════════════════
    console.log('📍 Scene 9: News');
    await page.goto(`${BASE_URL}/news`, { waitUntil: 'networkidle' });
    await sleep(3000);
    await checkpoint(page, '18-news');
    await slowScroll(page, 400, 3000);
    await sleep(1500);

    // ═══════════════════════════════════════════
    // SCENE 10 — Feedback (~15s)
    // ═══════════════════════════════════════════
    console.log('📍 Scene 10: Feedback');
    await page.goto(`${BASE_URL}/feedback`, { waitUntil: 'networkidle' });
    await sleep(3000);
    await checkpoint(page, '19-feedback');
    await slowScroll(page, 500, 3000);
    await sleep(2000);

    // ═══════════════════════════════════════════
    // OUTRO — Back to dashboard (5s)
    // ═══════════════════════════════════════════
    console.log('📍 Outro: Dashboard');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await sleep(4000);
    await checkpoint(page, '20-outro');

    // ═══════════════════════════════════════════
    // Finish recording
    // ═══════════════════════════════════════════
    console.log('⏹️ Stopping recording...');
    
    await page.close();
    await context.close();
    await browser.close();

    // Verify output files
    console.log('\n📊 Checking output files...');
    const files = fs.readdirSync(RECORDINGS_DIR);
    const videoFiles = files.filter(f => f.endsWith('.webm'));
    
    if (videoFiles.length === 0) {
      console.error('❌ ERROR: No video files found in recordings directory!');
      process.exit(1);
    }

    // Find the newest video
    let newest = { name: '', mtime: 0, size: 0 };
    for (const vf of videoFiles) {
      const filePath = path.join(RECORDINGS_DIR, vf);
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      const age = Date.now() - stats.mtimeMs;
      console.log(`📹 ${vf} — ${sizeMB} MB (${stats.size} bytes) — ${age < 60000 ? 'NEW' : 'old'}`);
      if (stats.mtimeMs > newest.mtime) {
        newest = { name: vf, mtime: stats.mtimeMs, size: stats.size };
      }
      if (stats.size === 0) {
        console.error(`❌ ERROR: ${vf} is 0 bytes!`);
      }
    }

    console.log(`\n🎯 Latest recording: ${newest.name} (${(newest.size / (1024 * 1024)).toFixed(2)} MB)`);
    
    if (newest.size < 500_000) {
      console.warn('⚠️  WARNING: Video is suspiciously small (<500KB). Content may be missing.');
    } else {
      console.log('✅ Video size looks healthy.');
    }

    // List screenshots for quality review
    const screenshots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
    console.log(`\n📸 ${screenshots.length} verification screenshots saved to ${SCREENSHOTS_DIR}`);

    console.log('\n✅ Demo recording complete!');
    console.log(`📂 Video: ${RECORDINGS_DIR}`);
    console.log(`📸 Screenshots: ${SCREENSHOTS_DIR}`);

  } finally {
    console.log('🛑 Shutting down Vite server...');
    viteProcess.kill();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
