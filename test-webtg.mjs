import { chromium } from 'playwright';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';

async function run() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  
  const reqs = [];
  page.on('request', req => {
    const u = req.url();
    if (u.includes('telesco') || u.includes('telegram-cdn') || u.includes('video')) {
      reqs.push({ method: req.method(), url: u.substring(0, 140) });
    }
  });
  
  // Try Telegram Web K for public channel
  console.log('=== web.telegram.org/k public channel ===');
  try {
    await page.goto('https://web.telegram.org/k/#!/im?p=@hindidubbedfilmmovie', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(15000);
    const text = await page.evaluate(() => (document.body.innerText || '').substring(0, 500));
    console.log('Body:', text);
    await page.screenshot({ path: '/tmp/njstream-tests/webtg_k.png' });
  } catch(e) { console.log('Error K:', e.message.substring(0, 100)); }
  
  // Try Telegram Web A
  console.log('\n=== web.telegram.org/a public channel ===');
  try {
    await page.goto('https://web.telegram.org/a/#!/im?p=@hindidubbedfilmmovie', { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(15000);
    const text = await page.evaluate(() => (document.body.innerText || '').substring(0, 500));
    console.log('Body:', text);
    await page.screenshot({ path: '/tmp/njstream-tests/webtg_a.png' });
    console.log('CDN/video requests:', reqs.length);
    reqs.slice(0, 10).forEach(r => console.log(` ${r.method} ${r.url}`));
  } catch(e) { console.log('Error A:', e.message.substring(0, 100)); }
  
  await browser.close();
}
run().catch(e => { console.error('FATAL:', e); process.exit(1); });
