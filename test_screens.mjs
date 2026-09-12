import { chromium } from 'playwright';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] });

// Mobile viewport
const mp = await browser.newPage({ viewport: { width: 375, height: 812 } });
const errs = [];
mp.on('console', m => { if(m.type()==='error') errs.push(m.text()); });
mp.on('pageerror', e => errs.push('PE:'+e.message));
await mp.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 25000 });
await mp.waitForTimeout(4500);
await mp.screenshot({ path: '/tmp/nj_home_mobile.png' });

// Home nav items
const navInfo = await mp.evaluate(() => {
  const nav = document.querySelectorAll('.nav-btn');
  return Array.from(nav).map(n => ({ text: n.textContent.trim(), active: n.classList.contains('active') }));
});
console.log('NAV:', JSON.stringify(navInfo));
console.log('MOBILE ERRORS:', JSON.stringify(errs.slice(0,5)));

// Go to family
await mp.click('[data-nav="family"]').catch(e => console.log('click family fail:', e.message));
await mp.waitForTimeout(2500);
await mp.screenshot({ path: '/tmp/nj_family_mobile.png' });
const famInfo = await mp.evaluate(() => {
  const inp = document.getElementById('familyChatIn');
  const feed = document.getElementById('familyFeed');
  const members = document.getElementById('familyMembers');
  const btn = document.getElementById('familyStart');
  return {
    inputVisible: inp ? inp.offsetParent !== null : false,
    feedChildren: feed ? feed.children.length : 0,
    membersChildren: members ? members.children.length : 0,
    startBtn: btn ? btn.textContent : null,
  };
});
console.log('FAMILY MOBILE:', JSON.stringify(famInfo));

// Go to TV
await mp.click('[data-nav="tv"]').catch(e => console.log('click tv fail:', e.message));
await mp.waitForTimeout(2500);
await mp.screenshot({ path: '/tmp/nj_tv_mobile.png' });
const tvInfo = await mp.evaluate(() => {
  const grid = document.getElementById('tvGrid');
  return { cards: grid ? grid.querySelectorAll('.tv-card').length : -1, chips: document.querySelectorAll('#tvFilters .chip').length };
});
console.log('TV MOBILE:', JSON.stringify(tvInfo));

await browser.close();
