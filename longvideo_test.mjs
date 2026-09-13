import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => console.log('goto warn', e.message));
await page.waitForTimeout(3000);
console.log('title:', await page.title());
// go to Videos library
const nav = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button,nav a,[data-nav],[data-page]')].find(x => /video/i.test(x.textContent || ''));
  if (b) { b.click(); return b.textContent; }
  return null;
});
console.log('clicked nav:', nav);
await page.waitForTimeout(5000);
// find Dhamaal card
const found = await page.evaluate(() => {
  const els = [...document.querySelectorAll('[data-libplay],[data-id],[data-msg-id]')];
  const f = els.find(x => /dhamaal/i.test(x.textContent || '') || /dhamaal/i.test((x.closest('div')?.textContent) || ''));
  return f ? (f.textContent || 'found').slice(0, 80) : null;
});
console.log('dhamaal found:', found);
await page.screenshot({ path: 'PROOF_library.png' });
// try direct player probe test instead: fetch probe via page
const probe = await page.evaluate(() => fetch('https://njsoft-stream.njcreative123.workers.dev/api/media/243885?probe=1').then(r => r.json()));
console.log('probe parts:', (probe.parts || []).length, 'size', probe.sizeLabel);
// Play part 1 directly in a video element on the page to prove streamability
const played = await page.evaluate(async () => {
  const v = document.createElement('video');
  v.muted = true; v.preload = 'auto';
  v.src = 'https://njsoft-stream.njcreative123.workers.dev/api/media/243885.p1?proxy=1';
  document.body.appendChild(v);
  try { await v.play(); } catch (e) { return 'play-error: ' + e.message; }
  await new Promise(r => setTimeout(r, 8000));
  return JSON.stringify({ currentTime: v.currentTime, readyState: v.readyState, duration: v.duration, error: v.error ? v.error.message : null });
});
console.log('PLAY RESULT:', played);
await page.screenshot({ path: 'PROOF_playing.png' });
console.log('console errors:', errors.length ? errors : 'NONE');
await browser.close();
