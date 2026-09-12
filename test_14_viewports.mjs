import { chromium } from 'playwright';

const URL = 'https://njsoft-stream.njcreative123.workers.dev/';
const CHROME = process.env.CHROME || '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';

const viewports = [
  { name: 'iPhoneSE-320x568', w: 320, h: 568, mobile: true, dpr: 2 },
  { name: 'Android-360x640', w: 360, h: 640, mobile: true, dpr: 2.5 },
  { name: 'iPhone8-375x667', w: 375, h: 667, mobile: true, dpr: 2 },
  { name: 'iPhoneX-375x812', w: 375, h: 812, mobile: true, dpr: 3 },
  { name: 'iPhone12-390x844', w: 390, h: 844, mobile: true, dpr: 3 },
  { name: 'Pixel7-412x915', w: 412, h: 915, mobile: true, dpr: 2.625 },
  { name: 'Galaxy-412x915', w: 412, h: 915, mobile: true, dpr: 3.5 },
  { name: 'iPadMini-768x1024', w: 768, h: 1024, mobile: true, dpr: 2 },
  { name: 'iPadAir-820x1180', w: 820, h: 1180, mobile: true, dpr: 2 },
  { name: 'Netbook-1024x600', w: 1024, h: 600, mobile: false, dpr: 1 },
  { name: 'Laptop-1280x800', w: 1280, h: 800, mobile: false, dpr: 1 },
  { name: 'Desktop-1366x768', w: 1366, h: 768, mobile: false, dpr: 1 },
  { name: 'Desktop-1440x900', w: 1440, h: 900, mobile: false, dpr: 1 },
  { name: 'DesktopHD-1920x1080', w: 1920, h: 1080, mobile: false, dpr: 1 },
];

const results = [];
let pass = 0, fail = 0;
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

for (const vp of viewports) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: vp.dpr,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    userAgent: vp.mobile
      ? 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 120)); });
  page.on('pageerror', e => pageErrors.push(String(e).slice(0, 120)));

  const t0 = Date.now();
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(6000);
    const loadTime = ((Date.now() - t0) / 1000).toFixed(1);

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollW: doc.scrollWidth,
        clientW: doc.clientWidth,
        overflowX: doc.scrollWidth > doc.clientWidth + 2,
        loaderVisible: !!(document.getElementById('loader') && getComputedStyle(document.getElementById('loader')).display !== 'none'),
        sidebarVisible: typeof window.showNav === 'function' || !!document.querySelector('#mtoggle'),
        heroPresent: !!document.querySelector('.hero, [class*="hero"], h1, .brand'),
        bodyTextLen: (document.body.innerText || '').length,
      };
    });

    // Try hamburger on mobile
    let menuWorks = 'n/a';
    if (vp.mobile) {
      try {
        await page.click('#mtoggle', { timeout: 3000 });
        await page.waitForTimeout(500);
        menuWorks = await page.evaluate(() => !!document.querySelector('#sidebar, .sidebar, .nav-panel:not([style*="display: none"]), #navwrap') || document.body.innerText.includes('Home'));
      } catch (e) { menuWorks = 'click-fail'; }
    }

    const name = vp.name;
    const ok = !metrics.overflowX && consoleErrors.length === 0 && pageErrors.length === 0;
    if (ok) pass++; else fail++;
    results.push({ name, w: vp.w, h: vp.h, loadTime, overflowX: metrics.overflowX, scrollW: metrics.scrollW, clientW: metrics.clientW,
      cErr: consoleErrors.length, pErr: pageErrors.length, menuWorks, loader: metrics.loaderVisible, hero: metrics.heroPresent });
    await page.screenshot({ path: `shots_${name.replace(/[^a-zA-Z0-9]/g, '_')}.png`, fullPage: false });
  } catch (e) {
    fail++;
    results.push({ name: vp.name, w: vp.w, h: vp.h, error: String(e).slice(0, 150), loadTime: 'FAIL' });
  }
  await ctx.close();
}
await browser.close();

console.log('\n================ VIEWPORT TEST RESULTS ================');
for (const r of results) {
  console.log(JSON.stringify(r));
}
console.log(`\nPASS: ${pass}/${results.length}  FAIL: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
