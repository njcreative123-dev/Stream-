import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0,150)); });
page.on('pageerror', e => errors.push('pageerror: '+e.message.slice(0,150)));

function nav(name) { return page.locator('.side .nav-btn[data-nav="'+name+'"]'); }

await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);
console.log('HOME loaded');

// 1. Home page
const homeState = await page.evaluate(() => ({
  activePage: document.querySelector('.page.active')?.id,
  loaderHidden: document.getElementById('loader')?.style.display === 'none',
  agents: document.querySelectorAll('.agent3d, [data-avatar]').length,
  heroVisible: document.querySelector('.hero-section, .hero, #hero') !== null || true
}));
console.log('HOME:', JSON.stringify(homeState));
await page.screenshot({ path: '/tmp/final_home.png' });

// 2. Videos page + mirror fallback test
console.log('\n=== VIDEOS + MIRROR FALLBACK ===');
await nav('tgv').click();
await page.waitForTimeout(4000);
const vidCards = await page.locator('.lib-card').count();
console.log('Video cards:', vidCards);
const playBtn = page.locator('[data-libplay]').first();
const vidId = await playBtn.getAttribute('data-libplay');
await playBtn.click();
await page.waitForTimeout(2000);
// Click play inside modal
await page.locator('#vmPlayBtn').click();
await page.waitForTimeout(3000);
const mirrorShown = await page.evaluate(() => {
  const mirror = document.getElementById('vmMirror');
  return { mirrorVisible: mirror && !mirror.classList.contains('hide'), mirrorText: mirror?.textContent?.slice(0, 200) };
});
console.log('Mirror dialog:', JSON.stringify(mirrorShown));
await page.screenshot({ path: '/tmp/final_mirror.png' });
// Close modal
await page.locator('#vmClose').click().catch(()=>{});
await page.waitForTimeout(500);

// 3. Family Room
console.log('\n=== FAMILY ROOM ===');
await nav('family').click();
await page.waitForTimeout(2500);
const famOk = await page.evaluate(() => {
  const input = document.getElementById('famIn');
  const startBtn = document.querySelector('[data-fam-start]');
  return { input: !!input, disabled: input?.disabled, placeholder: input?.placeholder, startBtn: !!startBtn };
});
console.log('Family:', JSON.stringify(famOk));
await page.screenshot({ path: '/tmp/final_family.png' });

// 4. AI Chat with real AI
console.log('\n=== AI CHAT ===');
await nav('ai').click();
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/final_ai.png' });
// Type and send
const chatInput = page.locator('#chatIn');
if (await chatInput.count()) {
  await chatInput.fill('Hello NJ, tell me about yourself');
  // Find send button
  const sendBtn = page.locator('[data-send]');
  if (await sendBtn.count()) {
    await sendBtn.click();
    console.log('AI: message sent, waiting for reply...');
    await page.waitForTimeout(8000);
    const aiResp = await page.evaluate(() => {
      const msgs = document.querySelectorAll('.chat-msg, .chat-bubble, .msg-row');
      const last = msgs.length ? msgs[msgs.length-1] : null;
      return { msgCount: msgs.length, lastText: last?.textContent?.slice(0,200) };
    });
    console.log('AI response:', JSON.stringify(aiResp));
  }
}
await page.screenshot({ path: '/tmp/final_ai_reply.png' });

// 5. TV + Hindi
console.log('\n=== TV ===');
await nav('tv').click();
await page.waitForTimeout(3000);
const tvCount = await page.locator('.tv-card').count();
console.log('TV cards:', tvCount);
await page.screenshot({ path: '/tmp/final_tv.png' });

// 6. TG
console.log('\n=== TELEGRAM ===');
await nav('tg').click();
await page.waitForTimeout(3000);
const tgCount = await page.evaluate(() => document.querySelectorAll('.tg-msg, .tg-item').length);
console.log('TG msgs:', tgCount);
await page.screenshot({ path: '/tmp/final_tg.png' });

// 7. Mobile responsiveness
console.log('\n=== MOBILE ===');
await page.setViewportSize({ width: 390, height: 844 });
// Open hamburger
await page.locator('#mtoggle').click();
await page.waitForTimeout(500);
const sidebarOpen = await page.evaluate(() => document.getElementById('side')?.classList.contains('open'));
console.log('Sidebar open:', sidebarOpen);
await page.screenshot({ path: '/tmp/final_mobile_nav.png' });
// Navigate to home
await page.evaluate(() => { document.getElementById('side').classList.remove('open'); });
await page.waitForTimeout(500);
const mobileOk = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  noOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  activePage: document.querySelector('.page.active')?.id
}));
console.log('Mobile:', JSON.stringify(mobileOk));
await page.screenshot({ path: '/tmp/final_mobile_home.png' });

console.log('\n=== ERRORS ===');
console.log(errors.length ? errors.slice(0,10).join('\n') : 'NONE');
await browser.close();
console.log('\nALL DONE');
