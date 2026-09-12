import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const cases = [
  { name: 'default', args: [] },
  { name: 'swiftshader', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] },
  { name: 'angle', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }
];
for (const c of cases) {
  try {
    const browser = await chromium.launch({ headless: true, executablePath: EXE, args: c.args });
    const page = await browser.newPage();
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('#app .page.active', { timeout: 15000 }).catch(()=>{});
    await page.waitForTimeout(4000);
    const info = await page.evaluate(() => {
      const cv = document.createElement('canvas');
      cv.width = 220; cv.height = 220; cv.style.width = '110px'; cv.style.height = '110px';
      document.body.appendChild(cv);
      let rr = null;
      try { rr = new THREE.WebGLRenderer({ canvas: cv, alpha: true, preserveDrawingBuffer: true }); } catch(e) { return { createErr: e.message.slice(0, 80) }; }
      const sc2 = new THREE.Scene();
      const cam2 = new THREE.PerspectiveCamera(42, 1, 0.1, 30);
      cam2.position.set(0, 0, 4);
      sc2.add(new THREE.AmbientLight('#ffffff', 1.2));
      const dl = new THREE.DirectionalLight('#ffffff', 1.2);
      dl.position.set(2, 2, 2);
      sc2.add(dl);
      sc2.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshPhongMaterial({ color: '#ff0000' })));
      rr.render(sc2, cam2);
      const g2 = rr.getContext();
      const px = new Uint8Array(g2.drawingBufferWidth * g2.drawingBufferHeight * 4);
      g2.readPixels(0, 0, g2.drawingBufferWidth, g2.drawingBufferHeight, g2.RGBA, g2.UNSIGNED_BYTE, px);
      let red = 0, opaque = 0;
      for (let i = 0; i < px.length; i += 16) {
        if (px[i] > 120) red++;
        if (px[i+3] > 25) opaque++;
      }
      return { buf: [g2.drawingBufferWidth, g2.drawingBufferHeight], red, opaque, lost: g2.isContextLost(), tris: rr.info.render.triangles };
    });
    console.log(c.name, JSON.stringify(info));
    await browser.close();
  } catch(e) { console.log(c.name, 'LAUNCH-FAIL:', e.message.slice(0, 90)); }
}
