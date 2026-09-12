import { chromium } from 'playwright';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const cases = [
  { name: 'flags', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] },
  { name: 'default', args: [] }
];
for (const c of cases) {
  const browser = await chromium.launch({ headless: true, executablePath: EXE, args: c.args });
  const page = await browser.newPage();
  const res = await page.evaluate(() => {
    const out = {};
    for (const type of ['webgl', 'webgl2']) {
      const cv = document.createElement('canvas');
      cv.width = 110; cv.height = 110;
      try {
        const gl = cv.getContext(type);
        if (!gl) { out[type] = 'null'; continue; }
        out[type] = JSON.stringify({ buf: [gl.drawingBufferWidth, gl.drawingBufferHeight] });
      } catch(e) { out[type] = 'throw:' + e.message.slice(0, 50); }
    }
    return out;
  });
  console.log(c.name, JSON.stringify(res));
  await browser.close();
}
