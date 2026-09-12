import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0,150)); });
page.on('pageerror', e => errors.push('pageerror: '+e.message.slice(0,150)));

function nav(name) { return page.locator('.side .nav-btn[data-nav="'+name+'"]'); }

await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);

console.log('=== HOME ===');
console.log(JSON.stringify(await page.evaluate(() => ({
  page: document.querySelector('.page.active')?.id,
  loaderHidden: document.getElementById('loader')?.style.display === 'none',
  agents: document.querySelectorAll('[data-avatar]').length
}))));
await page.screenshot({ path: '/tmp/v9_home.png' });

// === VIDEOS ===
console.log('\n=== VIDEOS ===');
await nav('tgv').click();
await page.waitForTimeout(4000);
const vidCount = await page.locator('.lib-card').count();
console.log('Cards:', vidCount);
await page.screenshot({ path: '/tmp/v9_videos.png' });

// Test mirror fallback
console.log('Clicking first play...');
await page.locator('[data-libplay]').first().click();
await page.waitForTimeout(2000);
console.log('Clicking vmPlayBtn...');
await page.locator('#vmPlayBtn').click().catch(()=>{});
await page.waitForTimeout(6000);
const mf = await page.evaluate(() => {
  const m = document.getElementById('vmMirror');
  return { visible: m && !m.classList.contains('hide'), text: m?.textContent?.slice(0,150) };
});
console.log('Mirror fallback:', JSON.stringify(mf));
await page.screenshot({ path: '/tmp/v9_mirror.png' });
// Close via Escape
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
const closed = await page.evaluate(() => document.getElementById('videoModal')?.classList.contains('hide'));
console.log('Modal closed:', closed);

// === AI CHAT ===
console.log('\n=== AI CHAT ===');
await nav('ai').click();
await page.waitForTimeout(3000);
console.log('Page:', await page.evaluate(() => document.querySelector('.page.active')?.id));
await page.screenshot({ path: '/tmp/v9_ai.png' });

if (await page.locator('#chatIn').count()) {
  await page.locator('#chatIn').fill('Hello, what can you do?');
  await page.locator('[data-send]').click();
  console.log('Sent message, waiting for reply...');
  await page.waitForTimeout(10000);
  const chatState = await page.evaluate(() => {
    const msgs = document.querySelectorAll('#chatMsgs .msg');
    const userMsgs = document.querySelectorAll('#chatMsgs .msg.user');
    const aiMsgs = document.querySelectorAll('#chatMsgs .msg.ai');
    return {
      total: msgs.length,
      user: userMsgs.length,
      ai: aiMsgs.length,
      lastAiText: aiMsgs.length ? aiMsgs[aiMsgs.length-1].textContent.slice(0,200) : 'none'
    };
  });
  console.log('Chat state:', JSON.stringify(chatState));
}
await page.screenshot({ path: '/tmp/v9_ai_reply.png' });

// === FAMILY ROOM ===
console.log('\n=== FAMILY ROOM ===');
await nav('family').click();
await page.waitForTimeout(2000);
const famState = await page.evaluate(() => ({
  input: !!document.getElementById('famIn'),
  msgs: document.querySelectorAll('#famMsgs .msg').length
}));
console.log('Family:', JSON.stringify(famState));
await page.screenshot({ path: '/tmp/v9_family.png' });

// === TV ===
console.log('\n=== TV ===');
await nav('tv').click();
await page.waitForTimeout(3000);
console.log('TV cards:', await page.locator('.tv-card').count());
await page.screenshot({ path: '/tmp/v9_tv.png' });

// === MOBILE ===
console.log('\n=== MOBILE 390x844 ===');
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
const mobOverflow = await page.evaluate(() => ({
  sw: document.documentElement.scrollWidth,
  cw: document.documentElement.clientWidth,
  noOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
}));
console.log('Overflow:', JSON.stringify(mobOverflow));
// Open hamburger
await page.locator('#mtoggle').click();
await page.waitForTimeout(500);
const sideOpen = await page.evaluate(() => document.getElementById('side')?.classList.contains('open'));
console.log('Sidebar open:', sideOpen);
await page.screenshot({ path: '/tmp/v9_mobile_nav.png' });
// Close sidebar and go home
await page.evaluate(() => {
  document.getElementById('side').classList.remove('open');
  document.querySelector('[data-nav="home"]').click();
});
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/v9_mobile_home.png' });

// Click a nav
await page.locator('#mtoggle').click();
await page.waitForTimeout(500);
await page.evaluate(() => {
  const btns = document.querySelectorAll('.side .nav-btn');
  for (const b of btns) { if (b.dataset.nav === 'ai') { b.click(); break; } }
});
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/v9_mobile_ai.png' });

console.log('\n=== ERRORS ===');
console.log(errors.length ? errors.slice(0,10).join('\n') : 'NONE');
await browser.close();
console.log('\nALL DONE');
