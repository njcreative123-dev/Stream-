import { chromium } from 'playwright';
const CHROME = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const URL = 'https://njsoft-stream.njcreative123.workers.dev/';
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0,150)));
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(5000);
await page.click('#mtoggle', { timeout: 4000 }).catch(()=>{});
await page.waitForTimeout(500);
await page.click('.nav-btn[data-nav="tg"]', { timeout: 4000 });
await page.waitForTimeout(7000);

// Click the first small video to open modal
const clickRes = await page.evaluate(async () => {
  const v = document.querySelector('video.tg-msg-video');
  if (!v) return { error: 'no video' };
  window.openVideoModal(v);
  await new Promise(r => setTimeout(r, 500));
  const modal = document.getElementById('videoModal');
  const visible = modal ? getComputedStyle(modal).display !== 'none' : false;
  const playBtn = document.getElementById('vmPlayBtn');
  const playVisible = playBtn ? getComputedStyle(playBtn).display !== 'none' : false;
  // click play
  if (playBtn) playBtn.click();
  await new Promise(r => setTimeout(r, 4000));
  const vid = document.getElementById('vmVideo');
  return {
    modalVisible: visible,
    playVisible,
    vidSrc: vid ? (vid.currentSrc || vid.src || '').slice(0, 80) : '',
    vidPlaying: vid ? (!vid.paused && vid.currentTime > 0.3) : false,
    vidTime: vid ? Math.round(vid.currentTime*100)/100 : null,
    vidW: vid ? vid.videoWidth : null,
    vidH: vid ? vid.videoHeight : null,
  };
});
console.log('MODAL:', JSON.stringify(clickRes));
console.log('errors:', errors.length ? errors : 'NONE');
await page.screenshot({ path: 'shot_modal_playing.png' });
await browser.close();
