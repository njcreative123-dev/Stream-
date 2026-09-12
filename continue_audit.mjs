import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const results = {}; const errors = [];
const browser = await chromium.launch({ headless: true, executablePath: EXE });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
const J = (ms) => page.waitForTimeout(ms);
async function clickNav(nav) {
  try { await page.click(`.nav-btn[data-nav="${nav}"]`, { timeout: 8000 }); }
  catch { await page.evaluate((n) => { const b = document.querySelector(`.nav-btn[data-nav="${n}"]`); if (b) b.click(); }, nav); }
  await J(3000);
}
async function step(name, fn) {
  try { results[name] = await fn(); } catch (e) { results[name] = { stepError: e.message.slice(0, 120) }; errors.push(name + ': ' + e.message.slice(0, 120)); }
}

await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await J(5000);

await step('home', async () => {
  const btns = await page.$$eval('.nav-btn', els => els.map(e => e.textContent.trim()));
  const active = await page.$eval('.page.active', e => e.id).catch(() => 'none');
  return { btns, active };
});

await clickNav('tv');
await step('tv', async () => {
  const chips = await page.$$eval('#tvChips button', els => els.length).catch(() => -1);
  const cards = await page.$$eval('#tvGrid .card, #tvGrid [class*=card]', els => els.length).catch(() => -1);
  const health = await page.$eval('#tvHealthMsg', e => e.textContent.trim()).catch(() => 'no-health');
  const hindi = await page.$$eval('#tvChips button', els => els.filter(e => /hindi/i.test(e.textContent)).length);
  return { chips, cards, health, hindiChip: hindi };
});

await step('hindi-playback', async () => {
  await page.evaluate(() => {
    const chips = [...document.querySelectorAll('#tvChips button')];
    const h = chips.find(c => /hindi/i.test(c.textContent));
    if (h) h.click();
  });
  await J(2500);
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#tvGrid .card, #tvGrid [class*=card]')];
    if (cards.length) cards[0].click();
  });
  await J(7000);
  return await page.evaluate(() => {
    const v = document.querySelector('video');
    if (!v) return { error: 'no video el' };
    return { ready: v.readyState, paused: v.paused, time: Math.round(v.currentTime * 10) / 10, err: v.error ? v.error.message : null, src: (v.currentSrc || v.src || '').slice(0, 70) };
  });
});
await page.keyboard.press('Escape').catch(()=>{}); await J(600);

await clickNav('tg');
await step('tg', async () => {
  const msgs = await page.$$eval('#tgFeed [class*=msg], #tgFeed .item', els => els.length).catch(() => -1);
  const movies = await page.$$eval('#movieGrid [class*=card]', els => els.length).catch(() => -1);
  return { msgs, movies };
});

await clickNav('books');
await step('books', async () => {
  const cards = await page.$$eval('#bookGrid [class*=card]', els => els.length).catch(() => -1);
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(e => /read/i.test(e.textContent)); if (b) b.click(); });
  await J(2500);
  const paras = await page.$$eval('#readerContent p, .reader-content p', els => els.length).catch(() => -1);
  const dl = await page.$$eval('#readerModal a, .reader-modal a', els => els.map(a => a.textContent.trim()).filter(t => /download|archive/i.test(t))).catch(() => []);
  return { cards, readerParas: paras, dl };
});
await page.keyboard.press('Escape').catch(()=>{}); await J(600);

await clickNav('ai');
await step('ai', async () => {
  const hasInput = await page.$eval('#aiChatInput, #aiInput, textarea, input[placeholder]', e => !!e).catch(() => false);
  await page.evaluate(() => {
    const inp = document.querySelector('#aiChatInput, #aiInput, textarea, input[placeholder]');
    const btn = [...document.querySelectorAll('button')].find(b => /send|➤|राज|Send/i.test(b.textContent));
    if (inp && btn) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(inp, 'hello');
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      btn.click();
    }
  });
  await J(10000);
  const replies = await page.$$eval('[class*=msg]', els => els.map(e => e.textContent.trim()).filter(t => t).slice(-3)).catch(() => []);
  return { hasInput, replies };
});

await clickNav('search');
await step('search', async () => {
  await page.evaluate(() => {
    const inp = document.querySelector('#searchInput, input[type="search"], input[placeholder*="search" i]');
    if (inp) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(inp, 'jawan');
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await J(3000);
  const val = await page.$eval('#searchInput, input[type="search"], input[placeholder*="search" i]', e => e.value).catch(() => '');
  const res = await page.$$eval('#searchResults [class*=result], #searchResults [class*=card]', els => els.length).catch(() => -1);
  return { typed: val, results: res };
});

await step('login', async () => {
  await page.evaluate(() => { const b = document.querySelector('#loginBtn, .login-btn'); if (b) b.click(); });
  await J(1500);
  await page.evaluate(() => {
    const u = document.querySelector('#loginUser'); const p = document.querySelector('#loginPass');
    if (u) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(u, 'ptest1'); u.dispatchEvent(new Event('input', { bubbles: true })); }
    if (p) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(p, 'ptest123'); p.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  return await page.evaluate(() => ({
    loginVisible: !!document.querySelector('#loginForm'),
    u: (document.querySelector('#loginUser') || {}).value || '',
    p: (document.querySelector('#loginPass') || {}).value || '',
    registerTab: !!document.querySelector('[data-auth-tab="register"]')
  }));
});

await page.screenshot({ path: '/root/johnny.heliohost./continue_audit_final.png' });
console.log(JSON.stringify({ results, errors: errors.slice(0, 8), errorCount: errors.length }, null, 1));
await browser.close();
