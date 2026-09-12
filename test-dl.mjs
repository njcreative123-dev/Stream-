import { chromium } from 'playwright';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';

async function run() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const page = await ctx.newPage();
  
  // Check the DOWNLOAD button's href
  const cdnReqs = [];
  page.on('request', req => { cdnReqs.push({ url: req.url().substring(0, 150), method: req.method() }); });
  
  await page.goto('https://t.me/hindidubbedfilmmovie/243691', { waitUntil: 'commit', timeout: 30000 });
  await page.waitForTimeout(10000);
  
  const dlInfo = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const dlLink = links.find(a => a.textContent.includes('DOWNLOAD') || a.href.includes('download'));
    const allLinks = links.map(a => ({ text: a.textContent.trim().substring(0, 50), href: a.href.substring(0, 150) }));
    return { dlLink: dlLink ? dlLink.href : null, allLinks };
  });
  console.log('Download link:', dlInfo.dlLink);
  console.log('All links:', JSON.stringify(dlInfo.allLinks, null, 2));
  console.log('\nAll network requests:');
  cdnReqs.filter(r => r.url.includes('telesco') || r.url.includes('download') || r.url.includes('file')).forEach(r => console.log(` ${r.method} ${r.url}`));
  
  await browser.close();
}
run().catch(e => { console.error('FATAL:', e); process.exit(1); });
