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
const info = await page.evaluate(() => {
  const av = window.njAvatars;
  const sc = av.scenes.find(s => s.id === 'telly');
  sc.renderer.render(sc.scene, sc.camera);
  const gl = sc.renderer.getContext();
  const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  const px = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  let opaque = 0, colored = 0, r = 0, g = 0, b = 0;
  for (let i = 0; i < px.length; i += 32) {
    if (px[i+3] > 25) opaque++;
    if (px[i] + px[i+1] + px[i+2] > 60) colored++;
    r += px[i]; g += px[i+1]; b += px[i+2];
  }
  const n = Math.floor(px.length / 32) || 1;
  let dataUrl = '';
  try { dataUrl = sc.renderer.domElement.toDataURL('image/png'); } catch(e) { dataUrl = 'ERR'; }
  return { buf: [w, h], opaqueSamples: opaque, coloredSamples: colored, avgRGB: [Math.round(r/n), Math.round(g/n), Math.round(b/n)], dataUrlLen: dataUrl === 'ERR' ? -1 : dataUrl.length };
});
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: '/root/johnny.heliohost./chk_tv_full.png' });
const box = await page.evaluate(() => { const s = document.querySelector('.agent3d[data-avatar="telly"]'); const b = s.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; });
await page.screenshot({ path: '/root/johnny.heliohost./chk_telly_zoom.png', clip: { x: box.x - 20, y: box.y - 20, width: box.w + 40, height: box.h + 40 } });
await browser.close();
