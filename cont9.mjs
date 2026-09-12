import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const out = {}; const errors = [];
const browser = await chromium.launch({ headless: true, executablePath: EXE, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
const J = ms => page.waitForTimeout(ms);
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await J(7000);
// Go to TV room
await page.evaluate(() => { const b = document.querySelector('.nav-btn[data-nav="tv"]'); if (b) b.click(); });
await J(3500);

out.tv = await page.evaluate(() => {
  const av = window.njAvatars;
  const telly = (av.scenes || []).find(s => s.domId === 'telly');
  const slot = document.querySelector('.agent3d[data-avatar="telly"]');
  const canvas = slot ? slot.querySelector('canvas') : null;
  let pixels = null;
  if (canvas) {
    try {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        const px = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, px);
        let nonTransparent = 0;
        for (let i = 3; i < px.length; i += 64) if (px[i] > 10) nonTransparent++;
        pixels = { w: gl.drawingBufferWidth, h: gl.drawingBufferHeight, alphaSamples: nonTransparent };
      }
    } catch(e) { pixels = 'err:' + e.message.slice(0, 60); }
  }
  return {
    scenes: av.scenes.length,
    ids: av.scenes.map(s => s.id),
    slotCanvas: !!canvas,
    pixels
  };
});
await page.screenshot({ path: '/root/johnny.heliohost./cont9_tv_3d.png' });

// Wait ~2s and compare avatar group position (animation motion proof)
out.motion = await page.evaluate(async () => {
  const av = window.njAvatars;
  const s = av.scenes.find(x => x.id === 'telly');
  const y1 = s.g.position.y;
  await new Promise(r => setTimeout(r, 900));
  const y2 = s.g.position.y;
  return { y1: +y1.toFixed(3), y2: +y2.toFixed(3), moved: Math.abs(y2 - y1) > 0.01, rotY: +s.g.rotation.y.toFixed(3) };
});

// Screenshot query-independent: capture element shot of telly avatar
const el = await page.$('.agent3d[data-avatar="telly"]');
if (el) await el.screenshot({ path: '/root/johnny.heliohost./cont9_telly_element.png' });

console.log(JSON.stringify({ out, errors: errors.slice(0, 5), errorCount: errors.length }, null, 1));
await browser.close();
