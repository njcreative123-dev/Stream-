import { chromium } from 'playwright';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const SITE = 'https://njsoft-stream.njcreative123.workers.dev';

async function run() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({
    viewport: { width: 900, height: 700 },
    userAgent: 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
  });
  const page = await ctx.newPage();
  
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message));
  
  // Test 1: Direct t.me embed page
  console.log('=== Test 1: Direct t.me embed ===');
  // Use a smaller video first (243691 = 452MB)
  await page.goto('https://t.me/hindidubbedfilmmovie/243691?embed=1&mode=tme', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(6000);
  
  const embedStats = await page.evaluate(() => {
    const videos = document.querySelectorAll('video');
    const iframes = document.querySelectorAll('iframe');
    const links = document.querySelectorAll('a');
    const imgs = document.querySelectorAll('img');
    return {
      title: document.title,
      videos: videos.length,
      videoSrcs: Array.from(videos).map(v => v.src || v.currentSrc).slice(0,3),
      iframes: iframes.length,
      iframeSrcs: Array.from(iframes).map(f => f.src).slice(0,3),
      links: Array.from(links).map(a => a.href).filter(h => h.includes('cdn') || h.includes('telesco')).slice(0,3),
      imgCount: imgs.length,
      bodyLen: document.body ? document.body.innerText.length : 0,
      bodyText: document.body ? document.body.innerText.substring(0, 300) : ''
    };
  });
  console.log('Embed page stats:', JSON.stringify(embedStats, null, 2));
  await page.screenshot({ path: '/tmp/njstream-tests/tme_embed_direct.png' });
  
  // Test 2: On-site iframe check
  console.log('\n=== Test 2: On-site iframe loads ===');
  await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => go('tg'));
  await page.waitForTimeout(4000);
  
  const iframeInfo = await page.evaluate(() => {
    const frames = Array.from(document.querySelectorAll('iframe[src*="embed"]'));
    return frames.map(f => ({ src: f.src, w: f.clientWidth, h: f.clientHeight, visible: f.offsetParent !== null }));
  });
  console.log('Iframe info:', JSON.stringify(iframeInfo.slice(0, 5), null, 2));
  
  // Wait for iframe content to load
  await page.waitForTimeout(5000);
  const frameContents = [];
  for (let i = 0; i < Math.min(3, iframeInfo.length); i++) {
    try {
      const frame = page.frames().find(f => f.url().includes('t.me') || f.url().includes('embed'));
      if (frame) {
        const info = await frame.evaluate(() => ({
          title: document.title,
          videos: document.querySelectorAll('video').length,
          bodyLen: document.body ? document.body.innerText.length : 0,
          hasPlayer: !!document.querySelector('.tgme_widget_message_video_player, video, .player')
        }));
        frameContents.push(info);
        console.log(`Frame ${i}:`, JSON.stringify(info));
      }
    } catch (e) {
      console.log(`Frame ${i} error: ${e.message.substring(0, 100)}`);
    }
  }
  
  await page.screenshot({ path: '/tmp/njstream-tests/tg_page_iframes.png' });
  
  console.log('\nConsole errors:', errors.length);
  errors.slice(0, 5).forEach(e => console.log(' -', e.substring(0, 200)));
  
  await browser.close();
}
run().catch(e => { console.error('FATAL:', e); process.exit(1); });
