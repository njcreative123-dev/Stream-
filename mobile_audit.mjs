import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));

await page.goto('https://njsoft-stream.njcreative123.workers.dev/#home', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(2500);
console.log('== HOME mobile ==');
console.log('chatIn?', await page.locator('#chatIn').isVisible().catch(()=>false));
console.log('body overflow-x px:', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));

await page.click('[data-nav="ai"]');
await page.waitForTimeout(2000);
console.log('== AI CHAT mobile ==');
console.log('chatIn visible:', await page.locator('#chatIn').isVisible().catch(()=>false));
console.log('chatBox visible:', await page.locator('.chat-box').isVisible().catch(()=>false));
const aiRect = await page.evaluate(() => { const el = document.querySelector('.chat-box'); if (!el) return null; const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: r.height, vh: window.innerHeight }; });
console.log('chatBox rect:', JSON.stringify(aiRect));

// try typing
try {
  await page.fill('#chatIn', 'Test message');
  console.log('typed OK, value =', await page.inputValue('#chatIn'));
} catch (e) { console.log('TYping FAIL:', e.message.split('\n')[0]); }

// Wait 8s, check animation state / avatar talking
await page.waitForTimeout(8000);
const av = await page.evaluate(() => {
  const c = document.querySelector('.av-char');
  return c ? { cls: c.className, anim: getComputedStyle(c).animationName } : null;
});
console.log('avatar state after 10s:', JSON.stringify(av));
await page.screenshot({ path: 'mobile_ai_chat.png' });
console.log('errors:', JSON.stringify(errors.filter(e => !e.includes('favicon') && !e.includes('401'))));
await browser.close();
