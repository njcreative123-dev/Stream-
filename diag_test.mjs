import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('/tmp/njdiag', { recursive: true });
const SITE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
const page = await ctx.newPage();
const logs = [];
page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', r => logs.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`));

console.log('Loading...');
await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(e=>console.log('goto err', e.message));
await page.waitForTimeout(1500);
// Check loader state
const st1 = await page.evaluate(() => ({
  loader: document.getElementById('loader')?.className,
  appVis: document.getElementById('app')?.className,
  activePage: document.querySelector('.page.active')?.id || 'NONE',
  bodyText: document.body.innerText.substring(0, 200),
  hlsLoaded: !!window.Hls,
}));
console.log('After 1.5s:', JSON.stringify(st1, null, 2));
await page.waitForTimeout(4000);
const st2 = await page.evaluate(() => ({
  loader: document.getElementById('loader')?.className,
  appVis: document.getElementById('app')?.className,
  activePage: document.querySelector('.page.active')?.id || 'NONE',
  bodyText: document.body.innerText.substring(0, 300),
}));
console.log('After 5.5s:', JSON.stringify(st2, null, 2));
await page.screenshot({ path: '/tmp/njdiag/home.png' });
console.log('\nLOGS:');
logs.slice(0, 30).forEach(l => console.log(' ', l));
await browser.close();
