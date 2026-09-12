import { chromium } from 'playwright';
const CHROME = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto('about:blank');
const r = await page.evaluate(async () => {
  const v = document.createElement('video');
  const probes = {
    mp4: v.canPlayType('video/mp4'),
    h264: v.canPlayType('video/mp4; codecs="avc1.42E01E"'),
    h264hi: v.canPlayType('video/mp4; codecs="avc1.64001F"'),
    aac: v.canPlayType('audio/mp4; codecs="mp4a.40.2"'),
    mkv: v.canPlayType('video/x-matroska'),
    webm: v.canPlayType('video/webm; codecs="vp9"'),
  };
  v.preload = 'auto';
  const p = new Promise(res => {
    v.onerror = () => res({ err: v.error ? v.error.code + ':' + v.error.message : 'unknown err' });
    v.onloadedmetadata = () => res({ ok: true, dur: v.duration, w: v.videoWidth, h: v.videoHeight });
    v.oncanplay = () => res({ ok: true, canplay: true });
  });
  v.src = 'https://njsoft-stream.njcreative123.workers.dev/api/media/243663';
  const outcome = await Promise.race([p, new Promise(r => setTimeout(() => r({ timeout: true }), 8000))]);
  return { probes, outcome };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
