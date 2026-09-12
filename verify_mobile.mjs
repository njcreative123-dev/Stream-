import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errors = [];
page.on('console', m => { if (m.type()==='error') errors.push(m.text().slice(0,160)); });
page.on('pageerror', e => errors.push('PAGEERR: '+e.message.slice(0,160)));
await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(5000);
const st = await page.evaluate(() => {
  const l = document.getElementById('loader');
  return { loaderVisible: l ? (getComputedStyle(l).opacity !== '0' && getComputedStyle(l).display !== 'none') : 'no-el',
           bodyText: document.body.innerText.slice(0,120), scrollW: document.documentElement.scrollWidth, winW: window.innerWidth };
});
console.log('MOBILE STATE:', JSON.stringify(st));
console.log('MOBILE ERRORS:', errors.length ? errors.slice(0,8).join(' | ') : 'NONE');
await page.screenshot({ path: '/root/johnny.heliohost./M_check.png' });

// Try clicking AI Chat
try {
  await page.click('text=AI Chat');
  await page.waitForTimeout(4000);
  const chatSt = await page.evaluate(() => ({ hasInput: !!document.querySelector('#aiChat input, #chatInput, #aiIn, textarea, input[type=text]:not([type=hidden])'), text: document.body.innerText.slice(0,80) }));
  console.log('AI CHAT:', JSON.stringify(chatSt));
  await page.screenshot({ path: '/root/johnny.heliohost./M_ai.png' });
} catch (e) { console.log('AI chat click error:', e.message.slice(0,120)); }
await browser.close();
