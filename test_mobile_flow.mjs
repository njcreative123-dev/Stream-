import { chromium } from 'playwright';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
const errs = [];
page.on('console', m => { if(m.type()==='error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PE:'+e.message));
await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(4000);

// Check hamburger
const hamburger = await page.evaluate(() => {
  const mt = document.getElementById('mtoggle');
  return mt ? { visible: mt.offsetParent !== null, text: mt.textContent } : null;
});
console.log('Hamburger:', JSON.stringify(hamburger));

// Open sidebar via hamburger
await page.click('#mtoggle');
await page.waitForTimeout(500);
const sideOpen = await page.evaluate(() => document.getElementById('side').classList.contains('open'));
console.log('Sidebar open:', sideOpen);

// Click family nav now
await page.click('.nav-btn[data-nav="family"]');
await page.waitForTimeout(3000);
const famInfo = await page.evaluate(() => {
  const inp = document.getElementById('familyChatIn');
  const feed = document.getElementById('familyFeed');
  const members = document.getElementById('familyMembers');
  return {
    activePage: document.querySelector('.page.active')?.id,
    inputVisible: inp ? inp.offsetParent !== null : false,
    feedChildren: feed ? feed.children.length : 0,
    membersChildren: members ? members.children.length : 0,
  };
});
console.log('FAMILY:', JSON.stringify(famInfo));
await page.screenshot({ path: '/tmp/nj_family_mobile2.png' });

// Go back home, try TV
await page.click('#mtoggle');
await page.waitForTimeout(300);
await page.click('.nav-btn[data-nav="tv"]');
await page.waitForTimeout(3000);
const tvInfo = await page.evaluate(() => {
  const grid = document.getElementById('tvGrid');
  return { activePage: document.querySelector('.page.active')?.id, cards: grid ? grid.querySelectorAll('.tv-card').length : -1, chips: document.querySelectorAll('#tvFilters .chip').length };
});
console.log('TV:', JSON.stringify(tvInfo));
await page.screenshot({ path: '/tmp/nj_tv_mobile2.png' });
console.log('ERRORS:', JSON.stringify(errs.slice(0,5)));
await browser.close();
