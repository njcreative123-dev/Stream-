import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERR:', e.message.slice(0,200)));
page.on('console', m => { if (m.type()==='error') console.log('CONERR:', m.text().slice(0,200)); });

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(2000);
await page.evaluate(() => { const b = document.querySelector('[data-nav="tv"]'); if (b) b.click(); });
await page.waitForTimeout(6000);

// Find the Hindi channel card with name Aaj Tak or pick index that contains 'Hindi' channels
// Try several channels to find one that plays
const testIndices = [3, 4, 5, 10, 20, 30]; // Aaj Tak HD is index 3 based on earlier API data
for (const idx of testIndices) {
  const card = page.locator(`.tv-card[data-tvplay="${idx}"]`);
  if (await card.count() === 0) continue;
  const name = await card.locator('.tv-card-name').textContent().catch(()=>'');
  console.log(`Trying channel ${idx}: ${name}`);
  await card.click();
  await page.waitForTimeout(6000);
  const vid = await page.evaluate(() => {
    const v = document.querySelector('video');
    if (!v) return { found: false };
    return {
      found: true,
      src: (v.currentSrc || v.src || '').slice(0, 150),
      paused: v.paused,
      readyState: v.readyState,
      currentTime: v.currentTime.toFixed(1),
      duration: v.duration.toFixed(1),
      error: v.error ? v.error.message : '',
      networkState: v.networkState,
    };
  });
  console.log(`  RESULT:`, JSON.stringify(vid));
  if (vid.found && !vid.paused && vid.currentTime > 0.3) {
    await page.screenshot({ path: `E2E_channel_${idx}_PLAYING.png` });
    console.log(`  ✅ PLAYING!`);
    break;
  }
}

await browser.close();
