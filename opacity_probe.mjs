import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await page.goto(URL, { waitUntil:'domcontentloaded' }).catch(()=>{});
await page.waitForTimeout(4000);
// tap hamburger + movies via JS click (same go() path)
await page.evaluate(()=>{document.getElementById('mtoggle').click();});
await page.waitForTimeout(800);
await page.evaluate(()=>{document.querySelector('[data-nav="movies"]').click();});
console.log('t+0s:', await page.evaluate(()=>{const a=document.querySelector('section.page.active'); return a?getComputedStyle(a).opacity:'none';}));
for (let i=0;i<10;i++){
  await page.waitForTimeout(500);
  const o = await page.evaluate(()=>{const a=document.querySelector('section.page.active'); const cs=a?getComputedStyle(a):null; return cs?{op:cs.opacity,anim:cs.animationName,animState:cs.animationPlayState,disp:cs.display}:'none';});
  console.log('t+'+(i+1)*0.5+'s:', JSON.stringify(o));
  if (parseFloat(o.op) > 0.9) break;
}
console.log('screenshot...');
await page.screenshot({ path:'OPACITY_probe_movies.png' });
await browser.close();
