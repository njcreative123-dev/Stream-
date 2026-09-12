import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const errs = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon') && !m.text().includes('net::ERR_') && !m.text().includes('SpeechRecognition')) errs.push('[err] ' + m.text().slice(0, 150)); });
  page.on('pageerror', e => errs.push('[pageerr] ' + String(e).slice(0, 150)));

  // 1. Home — Family Wall
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  const famMembers = await page.$$eval('.fam-member', els => els.length);
  const famAvatars = await page.$$eval('#famWall .av-char', els => els.length);
  const genders = await page.evaluate(() => Array.from(document.querySelectorAll('#famWall .av-char')).map(c => ({ id: c.dataset.av, cls: c.className })));
  console.log('FAMILY WALL members:', famMembers, '| avatars built:', famAvatars);
  console.log('genders:', genders.map(g => g.id + '=' + (g.cls.includes('female') ? 'F' : 'M')).join(', '));
  const roams = await page.$$eval('.walk-agent, .roam-agent, .roam-orb', els => els.length);
  console.log('floating chars remaining:', roams);
  await page.screenshot({ path: 'V85_home_family.png' });

  // 2. Telly room (female avatar + visit strip)
  await page.goto(BASE + '/tv', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4500);
  const tvAvatar = await page.evaluate(() => {
    const c = document.querySelector('#pg-tv .av-char');
    return c ? { cls: c.className, room: c.dataset.room } : null;
  });
  const famStrip = await page.$$eval('#pg-tv .fs-btn', els => els.length);
  console.log('TV room avatar (female?):', JSON.stringify(tvAvatar), '| family strip btns:', famStrip);
  await page.screenshot({ path: 'V85_telly_room.png' });

  // 3. Kitabi room (female)
  await page.goto(BASE + '/books', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3500);
  const kbAvatar = await page.evaluate(() => {
    const c = document.querySelector('#pg-books .av-char');
    return c ? { cls: c.className, dataAv: c.dataset.av } : null;
  });
  console.log('Books room avatar:', JSON.stringify(kbAvatar));
  await page.screenshot({ path: 'V85_kitabi_room.png' });

  // 4. NJ Room memory cards
  await page.goto(BASE + '/nj', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  const memCards = await page.$$eval('#njMemory .mem-card', els => els.length);
  console.log('NJ memory cards:', memCards);
  await page.screenshot({ path: 'V85_nj_memory.png' });

  // 5. Avatar click → navigates
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  const clickable = await page.evaluate(() => {
    const c = document.querySelector('#famWall [data-avatar="kitabi"] .av-char');
    if (c) { c.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }
    return false;
  });
  await page.waitForTimeout(4500);
  console.log('kitabi click dispatched:', clickable, '| hash after:', await page.evaluate(() => location.hash));

  // 6. Mobile
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mctx.newPage();
  await mp.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await mp.waitForTimeout(4000);
  const mFam = await mp.$$eval('.fam-member', els => els.length);
  console.log('mobile family members:', mFam);
  await mp.screenshot({ path: 'V85_mobile_family.png' });
  await mctx.close();

  await ctx.close();
  await browser.close();
  console.log('\nERRORS:', errs.slice(0, 10));
  console.log('=== DONE ===');
})();
