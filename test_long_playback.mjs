import { chromium } from 'playwright';
const CHROME = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const URL = 'https://njsoft-stream.njcreative123.workers.dev/api/media/990002?proxy=1';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox','--autoplay-policy=no-user-gesture-required','--use-fake-ui-for-media-stream'] });
const page = await browser.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.setContent(`<html><body><video id="v" controls autoplay muted src="${URL}"></video></body></html>`);
const res = await page.evaluate(async () => {
  const v = document.getElementById('v');
  const t0 = Date.now();
  let current = 0, ready = 0, w = 0, h = 0, err = null;
  const start = await new Promise(r => {
    const to = setTimeout(() => r(false), 15000);
    v.addEventListener('loadedmetadata', () => { clearTimeout(to); r(true); });
    v.addEventListener('error', () => { err = v.error ? v.error.message : 'error'; clearTimeout(to); r(false); });
    v.play().catch(() => {});
  });
  if (start) { await new Promise(r => setTimeout(r, 4000)); current = v.currentTime; ready = v.readyState; w = v.videoWidth; h = v.videoHeight; }
  return { start, current, ready, w, h, err, elapsed: ((Date.now()-t0)/1000).toFixed(1) };
});
console.log('PLAYBACK RESULT:', JSON.stringify(res, null, 2));
console.log('CONSOLE ERRORS:', errors.length ? errors : 'none');
await page.screenshot({ path: 'proof_long_playback.png' });
await browser.close();
if (!res.start || res.current <= 0) process.exit(1);
console.log('✅ LONG VIDEO PLAYING ON NJSTREAM (direct, no redirect)');
