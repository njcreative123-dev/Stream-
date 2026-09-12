import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: EXE, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(6000);
await page.evaluate(() => { const b = document.querySelector('.nav-btn[data-nav="tv"]'); if (b) b.click(); });
await page.waitForTimeout(4000);
// inView check + render count + toDataURL immediately after a forced render
const info = await page.evaluate(() => {
  const av = window.njAvatars;
  const sc = av.scenes.find(s => s.id === 'telly');
  sc.renderer.render(sc.scene, sc.camera);
  let dataUrl = '';
  try { dataUrl = sc.renderer.domElement.toDataURL('image/png'); } catch(e) { dataUrl = 'ERR:' + e.message; }
  return { inView: sc.inView, dataUrlLen: dataUrl.length, dataUrlHead: dataUrl.slice(0, 30) };
});
// Element screenshot scaled
const box = await page.evaluate(() => {
  const s = document.querySelector('.agent3d[data-avatar="telly"]');
  const b = s.getBoundingClientRect();
  return { x: b.x, y: b.y, w: b.width, h: b.height };
});
await page.screenshot({ path: '/root/johnny.heliohost./cont10_telly_zoom.png', clip: { x: box.x - 30, y: box.y - 30, width: box.w + 60, height: box.h + 60 } });
console.log(JSON.stringify({ info, box }, null, 1));
await browser.close();
