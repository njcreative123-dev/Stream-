import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: EXE });
const page = await browser.newPage();
page.on('console', m => { if (m.type() === 'error') console.log('ERR:', m.text().slice(0, 130)); });
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForSelector('#app .page.active', { timeout: 15000 }).catch(()=>{});
await page.waitForTimeout(4000);
const info = await page.evaluate(() => {
  const out = {};
  function test(name, matMaker) {
    const cv = document.createElement('canvas');
    cv.width = 220; cv.height = 220; cv.style.width = '110px'; cv.style.height = '110px';
    document.body.appendChild(cv);
    try {
      const r = new THREE.WebGLRenderer({ canvas: cv, alpha: true, preserveDrawingBuffer: true });
      const sc2 = new THREE.Scene();
      const cam2 = new THREE.PerspectiveCamera(42, 1, 0.1, 30);
      cam2.position.set(0, 0, 4);
      sc2.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), matMaker()));
      r.render(sc2, cam2);
      const g2 = r.getContext();
      const px = new Uint8Array(g2.drawingBufferWidth * g2.drawingBufferHeight * 4);
      g2.readPixels(0, 0, g2.drawingBufferWidth, g2.drawingBufferHeight, g2.RGBA, g2.UNSIGNED_BYTE, px);
      let colored = 0, opaque = 0;
      for (let i = 0; i < px.length; i += 16) {
        if (px[i] + px[i+1] + px[i+2] > 60) colored++;
        if (px[i+3] > 25) opaque++;
      }
      out[name] = { colored, opaque };
    } catch(e) { out[name] = 'THROW:' + e.message.slice(0, 60); }
  }
  test('basic', () => new THREE.MeshBasicMaterial({ color: '#ff0000' }));
  test('phong', () => new THREE.MeshPhongMaterial({ color: '#ff0000' }));
  test('standard', () => new THREE.MeshStandardMaterial({ color: '#ff0000' }));
  test('normal-noalpha', () => {
    const cv = document.createElement('canvas');
    cv.width = 220; cv.height = 220; cv.style.width = '110px'; cv.style.height = '110px';
    document.body.appendChild(cv);
    const r = new THREE.WebGLRenderer({ canvas: cv, preserveDrawingBuffer: true });
    const sc2 = new THREE.Scene();
    const cam2 = new THREE.PerspectiveCamera(42, 1, 0.1, 30);
    cam2.position.set(0, 0, 4);
    sc2.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshBasicMaterial({ color: '#00ff00' })));
    r.render(sc2, cam2);
    const g2 = r.getContext();
    const px = new Uint8Array(g2.drawingBufferWidth * g2.drawingBufferHeight * 4);
    g2.readPixels(0, 0, g2.drawingBufferWidth, g2.drawingBufferHeight, g2.RGBA, g2.UNSIGNED_BYTE, px);
    let green = 0;
    for (let i = 0; i < px.length; i += 16) { if (px[i+1] > 120) green++; }
    return { green };
  });
  return out;
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
