import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: EXE, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE-ERR:', m.text()); });
page.on('pageerror', e => console.log('PAGE-ERR:', e.message));
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(6000);
await page.evaluate(() => { const b = document.querySelector('.nav-btn[data-nav="tv"]'); if (b) b.click(); });
await page.waitForTimeout(4000);
const info = await page.evaluate(() => {
  const av = window.njAvatars;
  const sc = av.scenes.find(s => s.id === 'telly');
  const c = sc.renderer.domElement;
  const gl = sc.renderer.getContext();
  const v = new THREE.Vector2();
  sc.renderer.getSize(v);
  let re = null;
  try { re = sc.renderer.render(sc.scene, sc.camera); } catch(e) { re = 'THROW:' + e.message; }
  return {
    canvasW: c.width, canvasH: c.height,
    styleW: c.style.width, styleH: c.style.height,
    cssW: getComputedStyle(c).width, cssH: getComputedStyle(c).height,
    sizeW: v.width, sizeH: v.height,
    bufW: gl.drawingBufferWidth, bufH: gl.drawingBufferHeight,
    ctxType: c.getContext('webgl') ? 'webgl-ok' : 'webgl-null',
    render: re === undefined ? 'ok' : re,
    slotClientW: document.querySelector('.agent3d[data-avatar="telly"]').clientWidth
  };
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
