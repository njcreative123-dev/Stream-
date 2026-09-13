import { chromium } from 'playwright';
const base = 'https://njsoft-stream.njcreative123.workers.dev';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errs.push(String(e).slice(0, 200)));

await page.goto(base, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4000);

// Check home page sections
const homeState = await page.evaluate(() => {
  const visible = [];
  document.querySelectorAll('[id]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && el.id) visible.push(el.id);
  });
  return visible;
});
console.log('HOME visible sections:', homeState.join(', '));

// Screenshot home
await page.screenshot({ path: '/tmp/ss_home.png' });

// Navigate to TV
await page.evaluate(() => document.querySelector('[data-nav="tv"]')?.click());
await page.waitForTimeout(3000);
const tvState = await page.evaluate(() => {
  const grid = document.getElementById('tvGrid');
  return {
    gridExists: !!grid,
    gridChildren: grid ? grid.children.length : 0,
    gridHTML: grid ? grid.innerHTML.slice(0, 200) : 'NOT FOUND',
    visible: Array.from(document.querySelectorAll('.page')).filter(p => p.style.display !== 'none').map(p => p.id || p.className)
  };
});
console.log('TV state:', JSON.stringify(tvState));
await page.screenshot({ path: '/tmp/ss_tv.png' });

// Navigate to movies
await page.evaluate(() => document.querySelector('[data-nav="movies"]')?.click());
await page.waitForTimeout(3000);
const movState = await page.evaluate(() => {
  const grid = document.getElementById('movieGrid') || document.getElementById('moviesGrid');
  return {
    gridExists: !!grid,
    gridChildren: grid ? grid.children.length : 0,
    gridHTML: grid ? grid.innerHTML.slice(0, 200) : 'NOT FOUND'
  };
});
console.log('MOVIES state:', JSON.stringify(movState));
await page.screenshot({ path: '/tmp/ss_movies.png' });

// Navigate to books
await page.evaluate(() => document.querySelector('[data-nav="books"]')?.click());
await page.waitForTimeout(3000);
const bookState = await page.evaluate(() => {
  const grid = document.getElementById('bookGrid') || document.getElementById('booksGrid');
  return {
    gridExists: !!grid,
    gridChildren: grid ? grid.children.length : 0,
    gridHTML: grid ? grid.innerHTML.slice(0, 200) : 'NOT FOUND'
  };
});
console.log('BOOKS state:', JSON.stringify(bookState));
await page.screenshot({ path: '/tmp/ss_books.png' });

// Navigate to Telegram
await page.evaluate(() => document.querySelector('[data-nav="tg"]')?.click());
await page.waitForTimeout(3000);
const tgState = await page.evaluate(() => {
  const msgs = document.getElementById('tgMessages') || document.getElementById('tgFeed');
  return {
    msgsExists: !!msgs,
    msgsChildren: msgs ? msgs.children.length : 0,
    msgsHTML: msgs ? msgs.innerHTML.slice(0, 200) : 'NOT FOUND'
  };
});
console.log('TG state:', JSON.stringify(tgState));
await page.screenshot({ path: '/tmp/ss_tg.png' });

// AI / Family
await page.evaluate(() => {
  // try both af and ai
  const el = document.querySelector('[data-nav="af"]') || document.querySelector('[data-nav="ai"]');
  if (el) el.click();
});
await page.waitForTimeout(3000);
const aiState = await page.evaluate(() => {
  const chatBox = document.getElementById('familyChatInput') || document.getElementById('chatInput');
  const chatBoxExists = !!chatBox;
  return {
    chatBoxExists,
    chatBoxDisabled: chatBox ? chatBox.disabled : null,
    chatBoxDisplay: chatBox ? window.getComputedStyle(chatBox).display : null,
    bodySlice: document.body.innerText.slice(0, 300)
  };
});
console.log('AI state:', JSON.stringify(aiState));
await page.screenshot({ path: '/tmp/ss_ai.png' });

// Search
await page.evaluate(() => document.querySelector('[data-nav="search"]')?.click());
await page.waitForTimeout(2000);
await page.screenshot({ path: '/tmp/ss_search.png' });

console.log('\n=== ALL CONSOLE ERRORS ===');
errs.slice(0, 20).forEach(e => console.log('  ERR:', e));
await browser.close();
