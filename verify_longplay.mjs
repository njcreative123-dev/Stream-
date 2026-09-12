import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0,150)); });
page.on('pageerror', e => errors.push(e.message.slice(0,150)));

await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);
await page.locator('.side .nav-btn[data-nav="tgv"]').click();
await page.waitForTimeout(5000);

// Click first lib play
const playBtn = page.locator('[data-libplay]').first();
const videoId = await playBtn.getAttribute('data-libplay');
console.log('Video ID:', videoId);
await playBtn.click();
await page.waitForTimeout(2000);

// Check modal state
const modal = await page.evaluate(() => {
  const m = document.getElementById('videoModal');
  const play = document.getElementById('vmPlayBtn');
  const vid = document.getElementById('vmVideo');
  return {
    modalVisible: m && window.getComputedStyle(m).display !== 'none' && !m.classList.contains('hide'),
    playBtnVisible: play && window.getComputedStyle(play).display !== 'none',
    thumbVisible: (() => { const t = document.getElementById('vmThumb'); return t && window.getComputedStyle(t).display !== 'none'; })(),
    videoSrc: vid?.src || ''
  };
});
console.log('Modal state:', JSON.stringify(modal));

// Click the play button inside modal
if (modal.playBtnVisible) {
  await page.locator('#vmPlayBtn').click();
  await page.waitForTimeout(5000);
  const after = await page.evaluate(() => {
    const vid = document.getElementById('vmVideo');
    return {
      src: vid?.src?.slice(0, 120) || 'none',
      currentSrc: vid?.currentSrc?.slice(0, 120) || 'none',
      readyState: vid?.readyState,
      error: vid?.error ? vid.error.message : null,
      paused: vid?.paused,
      duration: vid?.duration || 0
    };
  });
  console.log('After play click:', JSON.stringify(after));
  await page.screenshot({ path: '/tmp/longplay_after.png' });
}

console.log('\nErrors:', errors.length ? errors.slice(0,5).join('\n') : 'NONE');
await browser.close();
console.log('DONE');
