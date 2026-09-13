import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('ERR:', e.message.slice(0,200)));

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(2000);

// Check home page
const homeInfo = await page.evaluate(() => {
  return {
    homeActive: document.getElementById('pg-home')?.classList.contains('active'),
    homeVisible: document.getElementById('pg-home')?.getBoundingClientRect()?.width,
    tvGridHTML: document.getElementById('tvGrid')?.innerHTML?.slice(0,300) || 'NO tvGrid',
    homeChannelsHTML: document.getElementById('homeChannels')?.innerHTML?.slice(0,300) || 'NO homeChannels',
  };
});
console.log('HOME:', JSON.stringify(homeInfo));

// Navigate to TV
await page.evaluate(() => { const b = document.querySelector('[data-nav="tv"]'); if (b) b.click(); else location.hash = '#tv'; });
await page.waitForTimeout(8000); // give more time for API calls

const tvInfo = await page.evaluate(() => {
  const grid = document.getElementById('tvGrid');
  return {
    pgTvActive: document.getElementById('pg-tv')?.classList.contains('active'),
    pgTvWidth: document.getElementById('pg-tv')?.getBoundingClientRect()?.width,
    gridHTML: grid?.innerHTML?.slice(0, 500) || 'NO grid',
    gridChildren: grid ? grid.children.length : 0,
    tvTotal: document.getElementById('tvTotal')?.textContent,
    tvWorking: document.getElementById('tvWorking')?.textContent,
    allChCards: document.querySelectorAll('.ch-card').length,
    allCards: document.querySelectorAll('.card').length,
  };
});
console.log('TV:', JSON.stringify(tvInfo));

// Check what API fetches happened
const apiCalls = await page.evaluate(async () => {
  try {
    const r = await fetch('/api/live-tv');
    const d = await r.json();
    return { ok: true, total: d.total, channelsCount: d.channels?.length, first: d.channels?.[0]?.name };
  } catch(e) { return { ok: false, error: e.message }; }
});
console.log('API test:', JSON.stringify(apiCalls));

await page.screenshot({ path: 'E2E_tv_test2.png', fullPage: false });
await browser.close();
