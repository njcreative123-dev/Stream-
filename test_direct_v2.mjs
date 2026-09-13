import { chromium } from 'playwright';
const url = 'https://njsoft-stream.njcreative123.workers.dev/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('ERR: ' + m.text()); });
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.evaluate(() => { location.hash = '#tg'; });
await page.waitForTimeout(12000);

const r = await page.evaluate(() => new Promise(resolve => {
  const btn = document.querySelector('.site-stream.ready .nj-site-play');
  if (!btn) { resolve({ error: 'no ready button' }); return; }
  console.log('BTN_SRC:', btn.getAttribute('data-src'));
  btn.click();  // real DOM click → document listener → openVideoURL
  setTimeout(() => {
    const vid = document.getElementById('vmVideo');
    const pb = document.getElementById('vmPlayBtn');
    resolve({
      modalOpen: !document.getElementById('videoModal').classList.contains('hide'),
      playBtnDisplay: pb ? getComputedStyle(pb).display : '?',
      thumbDisplay: document.getElementById('vmThumb') ? getComputedStyle(document.getElementById('vmThumb')).display : '?',
      src: vid ? vid.src : '?',
      readyState: vid ? vid.readyState : '?'
    });
  }, 2000);
}));
console.log('AFTER CLICK:', JSON.stringify(r));
await page.screenshot({ path: 'proof_modal_open.png' });

// Now click the modal play button and check playback
const r2 = await page.evaluate(() => new Promise(resolve => {
  const pb = document.getElementById('vmPlayBtn');
  pb.click();
  setTimeout(() => {
    const vid = document.getElementById('vmVideo');
    resolve({
      src: vid ? vid.src : '?',
      readyState: vid ? vid.readyState : '?',
      networkState: vid ? vid.networkState : '?',
      paused: vid ? vid.paused : '?',
      currentTime: vid ? vid.currentTime : '?',
      duration: vid ? vid.duration : '?',
      error: vid && vid.error ? vid.error.code + ' ' + vid.error.message : null,
      title: document.getElementById('vmTitle')?.textContent
    });
  }, 12000);
}));
console.log('AFTER PLAY CLICK:', JSON.stringify(r2, null, 2));
await page.screenshot({ path: 'proof_modal_playing.png' });
console.log('ERRORS:', JSON.stringify(errs.slice(0, 10), null, 2));
await browser.close();
