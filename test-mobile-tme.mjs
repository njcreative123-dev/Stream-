import { chromium } from 'playwright';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';

async function run() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--autoplay-policy=no-user-gesture-required'] });
  
  // Test with Android mobile UA
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    isMobile: true,
    hasTouch: true
  });
  const page = await ctx.newPage();
  
  const reqs = [];
  page.on('request', req => {
    if (req.url().includes('telesco') || req.url().includes('video') || req.url().includes('file')) {
      reqs.push({ method: req.method(), url: req.url().substring(0, 120) });
    }
  });
  
  console.log('=== Mobile UA t.me page ===');
  await page.goto('https://t.me/hindidubbedfilmmovie/243691', { waitUntil: 'commit', timeout: 30000 });
  await page.waitForTimeout(12000);
  
  const stats = await page.evaluate(() => {
    const videos = document.querySelectorAll('video');
    return {
      title: document.title,
      videos: videos.length,
      videoSrcs: Array.from(videos).map(v => (v.src || v.currentSrc || '').substring(0, 150)),
      bodyText: (document.body.innerText || '').substring(0, 400),
      buttons: Array.from(document.querySelectorAll('a,button')).map(a => a.textContent.trim().substring(0, 30)).filter(Boolean).slice(0, 10)
    };
  });
  console.log(JSON.stringify(stats, null, 2));
  await page.screenshot({ path: '/tmp/njstream-tests/tme_mobile.png' });
  console.log('\nNetwork requests:', reqs.length);
  reqs.forEach(r => console.log(` ${r.method} ${r.url}`));
  
  await browser.close();
}
run().catch(e => { console.error('FATAL:', e); process.exit(1); });
