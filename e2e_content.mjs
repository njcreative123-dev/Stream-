import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(2000);

// Movies
await page.evaluate(() => { const b = document.querySelector('[data-nav="movies"]'); if (b) b.click(); });
await page.waitForTimeout(5000);
const moviesInfo = await page.evaluate(() => {
  const pg = document.getElementById('pg-movies');
  return {
    gridIds: [...pg.querySelectorAll('[id]')].map(e => e.id).filter(i => i.includes('Movie') || i.includes('movie') || i.includes('Grid') || i.includes('grid')).slice(0,10),
    cards: pg.querySelectorAll('.card').length,
    movieCards: pg.querySelectorAll('.movie-card, [class*="movie"]').length,
    htmlHead: pg.innerHTML.slice(0, 400).replace(/\s+/g, ' ').slice(0, 300),
  };
});
console.log('MOVIES:', JSON.stringify(moviesInfo));
await page.screenshot({ path: 'FINAL_V2_movies_content.png' });

// Books
await page.evaluate(() => { const b = document.querySelector('[data-nav="books"]'); if (b) b.click(); });
await page.waitForTimeout(5000);
const booksInfo = await page.evaluate(() => {
  const pg = document.getElementById('pg-books');
  const cards = pg.querySelectorAll('.card, [class*="book"], [class*="book-card"]').length;
  return { cards, grid: !!pg.querySelector('[id*="ook" i], [id*="ookGrid" i]'), htmlHead: pg.innerHTML.slice(0, 300).replace(/\s+/g,' ').slice(0,200) };
});
console.log('BOOKS:', JSON.stringify(booksInfo));
await page.screenshot({ path: 'FINAL_V2_books_content.png' });
await browser.close();
