import { chromium } from 'playwright';
const base = 'https://njsoft-stream.njcreative123.workers.dev';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 250)); });
page.on('pageerror', e => errs.push('PAGEERR: ' + String(e).slice(0, 250)));
await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);

// TG with longer wait
await page.evaluate(() => document.querySelector('[data-nav="tg"]')?.click());
await page.waitForTimeout(12000);
const tg = await page.evaluate(() => {
  const msgs = document.getElementById('tgMessages');
  return {
    children: msgs ? msgs.children.length : -1,
    html: msgs ? msgs.innerHTML.slice(0, 300) : 'NOT FOUND',
    hasVideo: !!(msgs && msgs.querySelector('.tg-msg-video')),
    hasMovieCard: !!(msgs && msgs.querySelector('.movie-card')),
    text: (msgs ? msgs.innerText : '').slice(0, 200)
  };
});
console.log('TG(12s):', JSON.stringify(tg));
await page.screenshot({ path: '/tmp/ss_tg12.png', fullPage: false });

// AF page
await page.evaluate(() => document.querySelector('[data-nav="af"]')?.click());
await page.waitForTimeout(5000);
const af = await page.evaluate(() => {
  const chatIn = document.getElementById('chatIn');
  const famIn = document.getElementById('famIn');
  const famBtn = document.getElementById('famStartBtn');
  const vis = (el) => { if (!el) return 'MISSING'; const r = el.getBoundingClientRect(); return r.width + 'x' + r.height + ' disp=' + getComputedStyle(el).display; };
  return {
    aiSection: !!document.getElementById('pg-ai'),
    familySection: !!document.getElementById('pg-family'),
    njSection: !!document.getElementById('pg-nj'),
    activePages: Array.from(document.querySelectorAll('.page.active')).map(p => p.id),
    chatIn: vis(chatIn),
    famIn: vis(famIn),
    famBtn: vis(famBtn),
  };
});
console.log('AF:', JSON.stringify(af, null, 1));
await page.screenshot({ path: '/tmp/ss_af2.png', fullPage: false });

// Type in chat
try {
  await page.fill('#chatIn', 'hello test message');
  await page.click('[data-send]');
  await page.waitForTimeout(6000);
  const after = await page.evaluate(() => {
    const msgs = document.getElementById('chatMsgs');
    return { count: msgs ? msgs.children.length : -1, last: msgs ? msgs.lastElementChild.innerText.slice(0, 150) : '' };
  });
  console.log('CHAT after send:', JSON.stringify(after));
  await page.screenshot({ path: '/tmp/ss_chat_after.png', fullPage: false });
} catch(e) { console.log('CHAT TEST ERR:', e.message.slice(0, 200)); }

console.log('ERRORS:', errs.length);
errs.slice(0, 10).forEach(e => console.log('  ' + e));
await browser.close();
