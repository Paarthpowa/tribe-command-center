/**
 * Playwright Video Recording Script — Tribe Command Center Demo
 * 
 * Records a walkthrough of the app following the VIDEO_PLAN.md scenes.
 * Outputs a .webm video file to ./recordings/
 * 
 * Usage: npx tsx scripts/record-demo.ts
 */

import { chromium } from 'playwright';
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
const WALLET = '0xalpha_leader_address'; // Commander Zara (leader)

// Ensure output directory exists
fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

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

    // Poll until the server responds
    const poll = setInterval(() => {
      const req = http.get(BASE_URL, (res) => {
        if (res.statusCode && res.statusCode < 400) {
          clearInterval(poll);
          clearTimeout(timeout);
          resolve(child);
        }
        res.resume();
      });
      req.on('error', () => { /* ignore, server not ready yet */ });
      req.end();
    }, 500);

    child.on('error', (err) => {
      clearInterval(poll);
      clearTimeout(timeout);
      reject(err);
    });

    child.on('exit', (code) => {
      clearInterval(poll);
      clearTimeout(timeout);
      reject(new Error(`Vite exited early with code ${code}`));
    });
  });
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function slowScroll(page: any, durationMs: number) {
  const steps = 10;
  const delay = durationMs / steps;
  for (let i = 0; i < steps; i++) {
    await page.evaluate(() => window.scrollBy({ top: 150, behavior: 'smooth' }));
    await sleep(delay);
  }
}

async function scrollToTop(page: any) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await sleep(800);
}

async function main() {
  console.log('🎬 Starting Tribe Command Center demo recording...');
  console.log(`📁 Output directory: ${RECORDINGS_DIR}`);

  // Start Vite dev server
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

  // Navigate to app and inject wallet address into Zustand persisted store
  await page.goto(BASE_URL);
  await sleep(500);

  // Clear localStorage to get fresh mock data, then set wallet
  await page.evaluate((wallet) => {
    localStorage.removeItem('tribe-command-center');
  }, WALLET);
  await page.reload();
  await sleep(1000);

  // Set wallet in Zustand persisted store
  await page.evaluate((wallet) => {
    const storeKey = 'tribe-command-center';
    const stored = localStorage.getItem(storeKey);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.state) {
          data.state.walletAddress = wallet;
          data.state.isConnected = true;
          localStorage.setItem(storeKey, JSON.stringify(data));
        }
      } catch {}
    }
  }, WALLET);
  await page.reload();
  await sleep(2000);

  // ═══════════════════════════════════════════
  // SCENE 1 — Dashboard Overview (30s)
  // ═══════════════════════════════════════════
  console.log('📍 Scene 1: Dashboard');
  // Already on dashboard — pause to show stats
  await sleep(2500);
  
  // Slowly scroll through the dashboard
  await slowScroll(page, 4000);
  await sleep(1500);

  // Toggle Timeline
  const timelineBtn = page.locator('button:has-text("Timeline")').first();
  if (await timelineBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await scrollToTop(page);
    // Scroll down just enough to see the goals section
    await page.evaluate(() => window.scrollBy({ top: 600, behavior: 'smooth' }));
    await sleep(800);
    await timelineBtn.click();
    await sleep(3000);
    await timelineBtn.click();
    await sleep(500);
  }

  // Continue scrolling through goals
  await slowScroll(page, 2000);
  await sleep(1000);

  // ═══════════════════════════════════════════
  // SCENE 2 — Intel & Territory Map (60s)
  // ═══════════════════════════════════════════
  console.log('📍 Scene 2: Intel & Territory Map');
  await page.goto(`${BASE_URL}/intel`);
  await sleep(3000);

  // Let the star map render and settle
  await sleep(2000);

  // Try clicking on specific system nodes (they're rendered as circle elements or divs)
  // First try to click AM1-9KK
  const hqLabel = page.locator('text=AM1-9KK').first();
  if (await hqLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
    await hqLabel.click();
    await sleep(3000);
    await slowScroll(page, 3000);
    await sleep(1500);
  }

  await scrollToTop(page);
  await sleep(1000);

  // Click on EG1-FRK for rift sightings
  const riftLabel = page.locator('text=EG1-FRK').first();
  if (await riftLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
    await riftLabel.click();
    await sleep(3000);
    await slowScroll(page, 2000);
    await sleep(1500);
  }

  // ═══════════════════════════════════════════
  // SCENE 3 — Claiming a Gated Network (40s)
  // ═══════════════════════════════════════════
  console.log('📍 Scene 3: Claim Gated Network');
  await scrollToTop(page);
  await sleep(500);

  // Look for the claim button  
  const claimBtn = page.locator('button:has-text("Claim System"), button:has-text("Claim")').first();
  if (await claimBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await claimBtn.click();
    await sleep(2000);

    // Switch to Gated Network tab
    const gatedTab = page.locator('button:has-text("Gated Network")').first();
    if (await gatedTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gatedTab.click();
      await sleep(2500);
    }

    // Close modal
    await page.keyboard.press('Escape');
    await sleep(1000);
  }

  // ═══════════════════════════════════════════
  // SCENE 4 — Goals & Collaborative Building (50s)
  // ═══════════════════════════════════════════
  console.log('📍 Scene 4: Goals');
  await page.goto(BASE_URL);
  await sleep(2000);

  // Click on "Gated Network for Tribe Alpha" goal
  const goalLink = page.locator('h3:has-text("Gated Network for Tribe Alpha")').first();
  if (await goalLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    // Scroll into view first
    await goalLink.scrollIntoViewIfNeeded();
    await sleep(500);
    await goalLink.click();
    await sleep(3000);
    await slowScroll(page, 4000);
    await sleep(2000);
  }

  // Go to AM1-9KK Full System Survey goal
  await page.goto(BASE_URL);
  await sleep(1500);
  const surveyGoal = page.locator('h3:has-text("AM1-9KK Full System Survey")').first();
  if (await surveyGoal.isVisible({ timeout: 3000 }).catch(() => false)) {
    await surveyGoal.scrollIntoViewIfNeeded();
    await sleep(500);
    await surveyGoal.click();
    await sleep(2500);
    await slowScroll(page, 2000);
    await sleep(1000);
  }

  // ═══════════════════════════════════════════
  // SCENE 5 — Fleet Operations (40s)
  // ═══════════════════════════════════════════
  console.log('📍 Scene 5: Fleet Ops');
  await page.goto(`${BASE_URL}/fleets`);
  await sleep(2500);
  await slowScroll(page, 3500);
  await sleep(2000);

  // ═══════════════════════════════════════════
  // SCENE 6 — Members & Reputation (30s)
  // ═══════════════════════════════════════════
  console.log('📍 Scene 6: Members');
  await page.goto(`${BASE_URL}/members`);
  await sleep(2500);
  await slowScroll(page, 2500);
  await sleep(1500);

  // ═══════════════════════════════════════════
  // SCENE 7 — Alliance (20s)
  // ═══════════════════════════════════════════
  console.log('📍 Scene 7: Alliance');
  await page.goto(`${BASE_URL}/alliance`);
  await sleep(2500);
  await slowScroll(page, 1500);
  await sleep(1500);

  // ═══════════════════════════════════════════
  // SCENE 8 — Feedback (15s)
  // ═══════════════════════════════════════════
  console.log('📍 Scene 8: Feedback');
  await page.goto(`${BASE_URL}/feedback`);
  await sleep(2500);
  await slowScroll(page, 2000);
  await sleep(1500);

  // ═══════════════════════════════════════════
  // OUTRO — Back to dashboard (5s)
  // ═══════════════════════════════════════════
  console.log('📍 Outro: Dashboard');
  await page.goto(BASE_URL);
  await sleep(3000);

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

  for (const vf of videoFiles) {
    const filePath = path.join(RECORDINGS_DIR, vf);
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📹 ${vf} — ${sizeMB} MB (${stats.size} bytes)`);
    if (stats.size === 0) {
      console.error(`❌ ERROR: ${vf} is 0 bytes! Recording failed.`);
      process.exit(1);
    }
    if (stats.size < 10000) {
      console.warn(`⚠️  WARNING: ${vf} is very small (${stats.size} bytes). Recording may be corrupted.`);
    }
  }

  console.log('\n✅ Demo recording complete!');
  console.log(`📂 Output: ${RECORDINGS_DIR}`);

  } finally {
    // Always kill the vite server
    console.log('🛑 Shutting down Vite server...');
    viteProcess.kill();
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
