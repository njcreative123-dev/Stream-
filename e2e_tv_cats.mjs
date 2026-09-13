import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(2000);
await page.evaluate(() => { const b = document.querySelector('[data-nav="tv"]'); if (b) b.click(); });
await page.waitForTimeout(6000);

// Fetch channel list from API to map names
const api = await page.evaluate(async () => (await (await fetch('/api/live-tv')).json()));
console.log('API channels:', api.total, '| hindi:', api.hindi);
const cats = api.categories?.counts || {};
console.log('Categories:', JSON.stringify(cats));

// Find specific channel indices by name keywords
const targets = [];
const keywords = ['aaj tak','colors','sony','zee','star gold','dd sports','cartoon','pogo','nick','star plus','mtv','sports','hindi news','republic','ndtv'];
for (const k of keywords) {
  const idx = api.channels.findIndex(c => c.name.toLowerCase().includes(k));
  if (idx >= 0) targets.push({ k, idx });
}
console.log('Targets:', JSON.stringify(targets.slice(0,10)));

// helper: click channel and test playback
async function testChannel(idx) {
  const card = page.locator(`.tv-card[data-tvplay="${idx}"]`);
  if (await card.count() === 0) return { idx, play: 'no-card' };
  const name = await card.locator('.tv-card-name').textContent().catch(()=>'');
  await card.click();
  await page.waitForTimeout(7000);
  return await page.evaluate((nm) => {
    const v = document.querySelector('video');
    if (!v) return { name: nm, found: false };
    return {
      name: nm,
      found: true,
      paused: v.paused,
      readyState: v.readyState,
      currentTime: v.currentTime.toFixed(1),
      error: v.error ? v.error.message : '',
    };
  }, name);
}

for (const t of targets.slice(0, 8)) {
  const r = await testChannel(t.idx);
  const ok = r.found && !r.paused && r.currentTime > 0.3;
  console.log(`${ok ? '✅' : '❌'} ${t.k}: ${JSON.stringify(r)}`);
}
await browser.close();
