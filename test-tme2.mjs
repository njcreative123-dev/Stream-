import { chromium } from 'playwright';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';

async function run() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const page = await ctx.newPage();
  
  // Test regular t.me page (desktop web)
  console.log('=== Regular t.me page (desktop) ===');
  await page.goto('https://t.me/hindidubbedfilmmovie/243691', { waitUntil: "commit", timeout: 30000 });
  await page.waitForTimeout(8000);
  
  const stats = await page.evaluate(() => {
    const videos = document.querySelectorAll('video');
    const allLinks = Array.from(document.querySelectorAll('a[href]')).map(a => a.href).filter(h => h.includes('telesco') || h.includes('cdn'));
    const imgs = Array.from(document.querySelectorAll('img')).map(i => i.src).filter(s => s.includes('telesco'));
    return {
      title: document.title,
      videos: videos.length,
      videoInfo: Array.from(videos).map(v => ({ src: (v.src||'').substring(0,120), ready: v.readyState, duration: v.duration, error: v.error ? v.error.code : null })),
      cdnLinks: allLinks.slice(0,3),
      cdnImgs: imgs.slice(0,3),
      bodyText: (document.body.innerText||'').substring(0,400)
    };
  });
  console.log(JSON.stringify(stats, null, 2));
  await page.screenshot({ path: '/tmp/njstream-tests/tme_regular_page.png' });
  
  // Check XHR/fetch requests to CDN
  const cdnRequests = [];
  page.on('request', req => {
    if (req.url().includes('telesco')) cdnRequests.push(req.url().substring(0, 150));
  });
  
  // Reload the page with network tracking
  console.log('\n=== Reload tracking CDN requests ===');
  await page.goto('https://t.me/hindidubbedfilmmovie/243691', { waitUntil: "commit", timeout: 30000 });
  await page.waitForTimeout(10000);
  console.log('CDN requests:', cdnRequests.length);
  cdnRequests.slice(0, 8).forEach(r => console.log(' -', r));
  
  await browser.close();
}
run().catch(e => { console.error('FATAL:', e); process.exit(1); });
