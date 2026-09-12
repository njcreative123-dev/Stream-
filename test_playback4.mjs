import { chromium } from 'playwright';
const CHROME = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const URL = 'https://njsoft-stream.njcreative123.workers.dev/';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0,150)));
page.on('console', m => { if (m.type()==='error') errors.push(m.text().slice(0,150)); });
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(5000);
await page.click('#mtoggle', { timeout: 4000 }).catch(()=>{});
await page.waitForTimeout(500);
await page.click('.nav-btn[data-nav="tg"]', { timeout: 4000 });
await page.waitForTimeout(7000);

const result = await page.evaluate(async () => {
  const vids = [...document.querySelectorAll('video.tg-msg-video')];
  if (!vids.length) return { error: 'no video elements' };
  const results = [];
  for (const v of vids.slice(0, 2)) {
    const info = { src: (v.currentSrc || v.src || '').slice(0, 85) };
    try {
      await v.play();
      await new Promise(r => setTimeout(r, 5000));
      info.currentTime = Math.round(v.currentTime * 100) / 100;
      info.readyState = v.readyState;
      info.duration = v.duration ? Math.round(v.duration) : null;
      info.buffered = v.buffered.length ? Math.round(v.buffered.end(v.buffered.length - 1)) : 0;
      info.videoW = v.videoWidth;
      info.videoH = v.videoHeight;
      info.playing = !v.paused;
      info.networkState = v.networkState;
    } catch (e) { info.err = String(e).slice(0, 100); }
    results.push(info);
  }
  return { results };
});
console.log('PLAYBACK:', JSON.stringify(result, null, 1));
console.log('errors:', errors.length ? errors.slice(0,5) : 'NONE');
await page.screenshot({ path: 'shot_playback4.png', fullPage: false });
await browser.close();
