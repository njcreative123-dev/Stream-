import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 120)));

  // HOME
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(12000);
  const fam = await page.evaluate(() => ({
    members: document.querySelectorAll('.fam-member').length,
    avs: document.querySelectorAll('#famWall .av-char').length,
    genders: Array.from(document.querySelectorAll('#famWall .av-char')).map(c => c.dataset.av + ':' + (c.classList.contains('av-female') ? 'F' : 'M')),
    floats: document.querySelectorAll('.walk-agent, .roam-orb, .roam-agent').length,
  }));
  console.log('HOME:', JSON.stringify(fam));
  await page.screenshot({ path: 'V85_home.png' });

  // click telly in family wall → speak + navigate to tv
  await page.evaluate(() => document.querySelector('#famWall [data-avatar="telly"] .av-char')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await page.waitForTimeout(8000);
  console.log('after click hash:', await page.evaluate(() => location.hash));

  // TV room (female avatar + strip)
  await page.goto(BASE + '/tv', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(9000);
  const tv = await page.evaluate(() => ({
    char: (() => { const c = document.querySelector('#pg-tv .av-char'); return c ? c.dataset.av + ':' + (c.classList.contains('av-female') ? 'F' : 'M') : 'none'; })(),
    strip: document.querySelectorAll('#pg-tv .fs-btn').length,
    dead: document.querySelectorAll('.tv-card.dead').length,
    cards: document.querySelectorAll('.tv-card').length,
  }));
  console.log('TV ROOM:', JSON.stringify(tv));
  await page.screenshot({ path: 'V85_tv.png' });

  // NJ memory
  await page.goto(BASE + '/nj', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(10000);
  const nj = await page.evaluate(() => ({ mem: document.querySelectorAll('#njMemory .mem-card').length, char: (document.querySelector('#pg-nj .av-char')?.dataset.av) || 'none' }));
  console.log('NJ ROOM:', JSON.stringify(nj));
  await page.screenshot({ path: 'V85_nj.png' });

  // BOOKS (kitabi female)
  await page.goto(BASE + '/books', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(9000);
  const bk = await page.evaluate(() => { const c = document.querySelector('#pg-books .av-char'); return c ? c.dataset.av + ':' + (c.classList.contains('av-female') ? 'F' : 'M') : 'none'; });
  console.log('BOOKS:', bk);
  await page.screenshot({ path: 'V85_books.png' });

  await browser.close();
  console.log('ERRORS:', errs.slice(0, 6));
  console.log('=== DONE ===');
})();
