import { chromium } from 'playwright';

const SITE = 'https://njsoft-stream.njcreative123.workers.dev';

// Create test screenshots directory
import { mkdirSync } from 'fs';
mkdirSync('/tmp/njstream-tests', { recursive: true });

const viewports = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 }
];

const pages_to_test = [
  { name: 'home', path: '/', wait: 5000 },
  { name: 'livetv', path: '/?page=live-tv', wait: 4000 },
  { name: 'telegram', path: '/?page=telegram', wait: 4000 },
  { name: 'movies', path: '/?page=movies', wait: 4000 },
  { name: 'books', path: '/?page=books', wait: 3000 },
  { name: 'ai-chat', path: '/?page=ai-chat', wait: 3000 },
  { name: 'family-room', path: '/?page=family-room', wait: 3000 },
  { name: 'search', path: '/?page=search', wait: 3000 },
  { name: 'login', path: '/?page=login', wait: 2000 }
];

async function runTests() {
  const browser = await chromium.launch({
    executablePath: "/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome",
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const allErrors = {};
  let totalTests = 0;
  let passedTests = 0;

  for (const vp of viewports) {
    console.log(`\n=== Testing ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) ===`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0'
    });
    const page = await context.newPage();

    // Collect console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    for (const pg of pages_to_test) {
      totalTests++;
      try {
        const url = SITE + pg.path;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(pg.wait);

        // Screenshot
        const ssPath = `/tmp/njstream-tests/${vp.name}_${pg.name}.png`;
        await page.screenshot({ path: ssPath, fullPage: true });

        // Check page loaded
        const title = await page.title();
        const bodyText = await page.textContent('body');
        const hasContent = bodyText && bodyText.trim().length > 100;

        // Check if loader is visible (should NOT be)
        const loaderVisible = await page.evaluate(() => {
          const loader = document.getElementById('appLoader');
          if (!loader) return false;
          return loader.style.display !== 'none' && loader.style.display !== '';
        });

        // Check if main content is visible
        const contentVisible = await page.evaluate(() => {
          const app = document.getElementById('app');
          if (!app) return false;
          return app.offsetHeight > 0;
        });

        const status = hasContent && !loaderVisible ? '✅ PASS' : '❌ FAIL';
        if (hasContent && !loaderVisible) passedTests++;
        console.log(`${status} ${pg.name}: loader=${loaderVisible}, content=${contentVisible}, text=${(bodyText||'').length} chars`);

        // Check for specific elements on telegram page
        if (pg.name === 'telegram') {
          const videoCount = await page.evaluate(() => {
            return document.querySelectorAll('video, iframe[src*="t.me"], .video-big-notice').length;
          });
          console.log(`  📹 Video/iframe elements: ${videoCount}`);
        }

        // Check iframes on page
        const iframes = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('iframe')).map(f => f.src).slice(0, 5);
        });
        if (iframes.length > 0) {
          console.log(`  🔗 Iframes: ${iframes.length} (${iframes.join(', ').substring(0, 200)})`);
        }

        allErrors[`${vp.name}_${pg.name}`] = errors;
      } catch (e) {
        console.log(`❌ ERROR ${pg.name}: ${e.message.substring(0, 150)}`);
        allErrors[`${vp.name}_${pg.name}`] = [...errors, e.message];
      }
    }

    // Check animations on home page
    try {
      await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
      const animCount = await page.evaluate(() => {
        const all = document.querySelectorAll('*');
        let anims = 0;
        for (const el of all) {
          const s = getComputedStyle(el);
          if (s.animationName && s.animationName !== 'none') anims++;
        }
        return anims;
      });
      console.log(`🎨 Active CSS animations: ${animCount}`);
    } catch(e) {}

    await context.close();
  }

  // Now test long video page specifically
  console.log('\n=== Testing Long Video Playback ===');
  const videoCtx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0'
  });
  const videoPage = await videoCtx.newPage();

  await videoPage.goto(SITE + '/?page=telegram', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await videoPage.waitForTimeout(5000);

  // Count video elements
  const videoStats = await videoPage.evaluate(() => {
    const videos = document.querySelectorAll('video');
    const iframes = document.querySelectorAll('iframe');
    const bigVideo = document.querySelectorAll('.video-big-notice, .vbn-player');
    const tmeIframes = document.querySelectorAll('iframe[src*="t.me"]');
    return {
      videoTags: videos.length,
      allIframes: iframes.length,
      tmeIframes: tmeIframes.length,
      bigVideoCards: bigVideo.length,
      tmeSrcs: Array.from(tmeIframes).map(f => f.src).slice(0, 5),
      videoSrcs: Array.from(videos).map(v => v.src).slice(0, 5)
    };
  });
  console.log('Video stats:', JSON.stringify(videoStats, null, 2));

  // Test video modal
  const hasModal = await videoPage.evaluate(() => !!document.getElementById('videoModal'));
  console.log(`Video modal exists: ${hasModal}`);

  await videoPage.screenshot({ path: '/tmp/njstream-tests/telegram_long_videos.png', fullPage: true });

  await videoCtx.close();
  await browser.close();

  console.log(`\n=== SUMMARY ===`);
  console.log(`Tests: ${passedTests}/${totalTests} passed`);

  // Print errors
  for (const [key, errs] of Object.entries(allErrors)) {
    if (errs.length > 0) {
      console.log(`\n⚠️ Errors on ${key}:`);
      errs.forEach(e => console.log(`  - ${e.substring(0, 200)}`));
    }
  }
}

runTests().catch(e => { console.error('FATAL:', e); process.exit(1); });
