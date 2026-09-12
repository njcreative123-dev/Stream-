import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: EXE, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage();
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(6000);
await page.evaluate(() => { const b = document.querySelector('.nav-btn[data-nav="tv"]'); if (b) b.click(); });
await page.waitForTimeout(3500);
const info = await page.evaluate(async () => {
  const out = {};
  // existing scene renderer state
  const av = window.njAvatars;
  const sc = av.scenes.find(s => s.id === 'telly');
  const gl1 = sc.renderer.getContext();
  out.existing = { buf: [gl1.drawingBufferWidth, gl1.drawingBufferHeight], lost: gl1.isContextLost(), err: gl1.getError(), w: sc.renderer.domElement.width, h: sc.renderer.domElement.height };
  // fresh renderer with own canvas
  const cv = document.createElement('canvas');
  cv.width = 110; cv.height = 110;
  const r2 = new THREE.WebGLRenderer({ canvas: cv, alpha: true });
  r2.setSize(110, 110);
  const gl2 = r2.getContext();
  out.fresh = { buf: [gl2.drawingBufferWidth, gl2.drawingBufferHeight], lost: gl2.isContextLost(), err: gl2.getError(), w: cv.width, h: cv.height };
  // fresh renderer without canvas (like original)
  const r3 = new THREE.WebGLRenderer({ alpha: true });
  r3.setSize(110, 110);
  const gl3 = r3.getContext();
  out.fresh3 = { buf: [gl3.drawingBufferWidth, gl3.drawingBufferHeight], lost: gl3.isContextLost(), err: gl3.getError(), w: r3.domElement.width, h: r3.domElement.height };
  return out;
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
