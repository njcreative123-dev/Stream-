import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: EXE, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', m => console.log('CONSOLE:', m.type(), m.text().slice(0, 120)));
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await page.waitForTimeout(5000);
const info = await page.evaluate(() => {
  const out = {};
  // minimal box test with visible canvas appended to body
  const cv = document.createElement('canvas');
  cv.width = 220; cv.height = 220;
  cv.style.width = '110px'; cv.style.height = '110px';
  document.body.appendChild(cv);
  const r = new THREE.WebGLRenderer({ canvas: cv, alpha: true, preserveDrawingBuffer: true });
  const sc2 = new THREE.Scene();
  const cam2 = new THREE.PerspectiveCamera(42, 1, 0.1, 30);
  cam2.position.set(0, 0, 4);
  sc2.add(new THREE.AmbientLight('#ffffff', 1));
  sc2.add(new THREE.DirectionalLight('#ffffff', 1).position.set(2, 2, 2));
  const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshPhongMaterial({ color: '#ff0000' }));
  sc2.add(m);
  try { r.render(sc2, cam2); out.renderErr = 'ok'; } catch(e) { out.renderErr = e.message.slice(0, 80); }
  const g2 = r.getContext();
  const px = new Uint8Array(g2.drawingBufferWidth * g2.drawingBufferHeight * 4);
  g2.readPixels(0, 0, g2.drawingBufferWidth, g2.drawingBufferHeight, g2.RGBA, g2.UNSIGNED_BYTE, px);
  let red = 0, opaque = 0;
  for (let i = 0; i < px.length; i += 16) {
    if (px[i] > 120 && px[i+1] < 100 && px[i+2] < 100) red++;
    if (px[i+3] > 25) opaque++;
  }
  out.box = { buf: [g2.drawingBufferWidth, g2.drawingBufferHeight], red: red, opaque: opaque, calls: r.info.render.calls, tris: r.info.render.triangles };
  return out;
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
