import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: EXE, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
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
  let opaque = 0, sum = 0;
  for (let i = 0; i < px.length; i += 16) {
    if (px[i+3] > 20) opaque++;
    sum += px[i] + px[i+1] + px[i+2];
  }
  const n = Math.floor(px.length / 16) || 1;
  return { w, h, calls: sc.renderer.info.render.calls, tris: sc.renderer.info.render.triangles, opaqueSamples: opaque, avgRGB: Math.round(sum / n), geometry: sc.renderer.info.memory.geometries };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
