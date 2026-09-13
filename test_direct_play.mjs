import { chromium } from 'playwright';
const url = 'https://njsoft-stream.njcreative123.workers.dev/';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('ERR: ' + m.text()); });

// Test 1: Direct proxy URL in browser
await page.goto('https://njsoft-stream.njcreative123.workers.dev/api/media/243915?proxy=1', { timeout: 15000 }).catch(()=>{});
const h = await page.evaluate(() => document.title + ' ' + document.body?.innerText?.slice(0, 50));
console.log('Direct load:', h);

// Test 2: Use page.evaluate to call openVideoURL directly
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.evaluate(() => { location.hash = '#tg'; });
await page.waitForTimeout(12000);

// Call openVideoURL directly with the proxy URL
const result = await page.evaluate(() => {
  return new Promise(resolve => {
    // Open the video modal directly
    window.openVideoURL('/api/media/243915?proxy=1', 'GTA6 Test', '106 MB', 'video/webm', '243915');
    // After 8 seconds, check state
    setTimeout(() => {
      var vid = document.getElementById('vmVideo');
      var title = document.getElementById('vmTitle');
      resolve({
        title: title?.textContent,
        src: vid?.src,
        readyState: vid?.readyState,
        networkState: vid?.networkState,
        paused: vid?.paused,
        currentTime: vid?.currentTime,
        duration: vid?.duration,
        error: vid?.error ? vid.error.code + ': ' + vid.error.message : null,
        videoWidth: vid?.videoWidth
      });
    }, 8000);
  });
});
console.log('RESULT:', JSON.stringify(result, null, 2));
await page.screenshot({ path: 'proof_direct_play.png' });
console.log('ERRORS:', JSON.stringify(errs.slice(0, 10), null, 2));
await browser.close();
