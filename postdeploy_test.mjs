import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('/tmp/nj_post', { recursive: true });
const SITE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 }
];
let totalPass = 0, totalFail = 0;
for (const vp of viewports) {
  console.log(`\n=== ${vp.name.toUpperCase()} ${vp.width}x${vp.height} ===`);
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERR: ' + e.message));
  await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3500);
  
  // Helper: navigate via dispatching click event
  async function nav(pg) {
    await page.evaluate((p) => {
      var el = document.querySelector(`[data-nav="${p}"]`);
      if (el) el.dispatchEvent(new MouseEvent('click', {bubbles:true}));
    }, pg);
    await page.waitForTimeout(3500);
  }
  
  // Home
  const home = await page.evaluate(() => ({
    loader: document.getElementById('loader')?.style.display === 'none',
    active: document.querySelector('.page.active')?.id,
    ticker: !!document.querySelector('.home-ticker'),
    channels: document.getElementById('homeChannels')?.children.length || 0,
    heroVisible: !!document.querySelector('.sh-title'),
  }));
  console.log(`  Home: active=${home.active} loader=${home.loader?'✅':'❌'} ticker=${home.ticker} channels=${home.channels}`);
  if (home.active === 'pg-home' && home.heroVisible) totalPass++; else totalFail++;
  await page.screenshot({ path: `/tmp/nj_post/${vp.name}_home.png` });

  // TG
  await nav('tg');
  const tg = await page.evaluate(() => ({
    active: document.querySelector('.page.active')?.id,
    msgs: document.querySelectorAll('.tg-msg').length,
    movieCards: document.querySelectorAll('.movie-card').length,
    bigCards: document.querySelectorAll('.video-big-notice').length,
    vbnBtns: document.querySelectorAll('.vbn-btn').length,
    docLinks: document.querySelectorAll('.book-link').length,
  }));
  console.log(`  TG: msgs=${tg.msgs} movieCards=${tg.movieCards} bigCards=${tg.bigCards} vbnBtns=${tg.vbnBtns} docLinks=${tg.docLinks}`);
  if (tg.active === 'pg-tg') totalPass++; else totalFail++;
  await page.screenshot({ path: `/tmp/nj_post/${vp.name}_tg.png` });

  // Family
  await nav('family');
  const fam = await page.evaluate(() => ({
    active: document.querySelector('.page.active')?.id,
    feed: document.getElementById('familyFeed')?.children.length || 0,
    input: !!document.getElementById('familyChatIn'),
    members: document.getElementById('familyMembers')?.children.length || 0,
    startBtn: !!document.getElementById('familyStart'),
    feedText: document.getElementById('familyFeed')?.innerText?.substring(0, 100),
  }));
  console.log(`  Family: feed=${fam.feed} input=${fam.input} members=${fam.members} start=${fam.startBtn}`);
  if (fam.input && fam.startBtn) totalPass++; else totalFail++;
  await page.screenshot({ path: `/tmp/nj_post/${vp.name}_family.png` });

  // TV
  await nav('tv');
  const tv = await page.evaluate(() => ({
    active: document.querySelector('.page.active')?.id,
    cards: document.querySelectorAll('.tv-card').length,
  }));
  console.log(`  TV: cards=${tv.cards}`);
  if (tv.active === 'pg-tv') totalPass++; else totalFail++;
  await page.screenshot({ path: `/tmp/nj_post/${vp.name}_tv.png` });

  // Books
  await nav('books');
  const books = await page.evaluate(() => ({
    active: document.querySelector('.page.active')?.id,
    items: document.querySelectorAll('#booksGrid .media-card').length,
  }));
  console.log(`  Books: items=${books.items}`);
  if (books.active === 'pg-books') totalPass++; else totalFail++;
  await page.screenshot({ path: `/tmp/nj_post/${vp.name}_books.png` });

  // Search
  await nav('search');
  const search = await page.evaluate(() => ({
    active: document.querySelector('.page.active')?.id,
    input: !!document.getElementById('searchInput'),
  }));
  console.log(`  Search: active=${search.active} input=${search.input}`);
  if (search.active === 'pg-search') totalPass++; else totalFail++;
  await page.screenshot({ path: `/tmp/nj_post/${vp.name}_search.png` });

  // Login
  await nav('login');
  const login = await page.evaluate(() => ({
    active: document.querySelector('.page.active')?.id,
    form: !!document.getElementById('loginForm'),
    userInput: !!document.getElementById('loginUser'),
  }));
  console.log(`  Login: form=${login.form} input=${login.userInput}`);
  if (login.form) totalPass++; else totalFail++;
  await page.screenshot({ path: `/tmp/nj_post/${vp.name}_login.png` });

  // Errors
  if (errors.length) { console.log(`  ⚠️ Errors: ${errors.length}`); errors.slice(0,3).forEach(e => console.log(`    - ${e.substring(0,120)}`)); }
  else { console.log(`  ✅ Zero errors`); }
  await ctx.close();
  await browser.close();
}
console.log(`\n=== RESULTS: ${totalPass} passed, ${totalFail} failed ===`);
