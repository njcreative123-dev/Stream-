import { chromium } from 'playwright';
const CHROME = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const URL = 'https://njsoft-stream.njcreative123.workers.dev/';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0,120)));
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(5000);
await page.click('#mtoggle', { timeout: 4000 }).catch(()=>{});
await page.waitForTimeout(500);
await page.click('.nav-btn[data-nav="tg"]', { timeout: 4000 });
await page.waitForTimeout(6000);

const result = await page.evaluate(async () => {
  const vids = [...document.querySelectorAll('video.tg-msg-video')];
  if (!vids.length) return { error: 'no video elements' };
  const v = vids[1] || vids[0]; // larger sample first
  const info = { src: (v.src||'').slice(0,80), count: vids.length };
  try {
    await v.play();
    await new Promise(r => setTimeout(r, 3000));
    info.currentTime = v.currentTime;
    info.readyState = v.readyState;
    info.buffered = v.buffered.length ? v.buffered.end(v.buffered.length-1) : 0;
    info.videoWidth = v.videoWidth;
    info.videoHeight = v.videoHeight;
    info.paused = v.paused;
    info.duration = v.duration;
  } catch (e) { info.playError = String(e).slice(0,120); }
  return info;
});
console.log('PLAYBACK:', JSON.stringify(result));
console.log('page errors:', errors.length ? errors : 'NONE');
await page.screenshot({ path: 'shot_playback.png' });
await browser.close();
