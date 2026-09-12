import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));

await page.goto('https://njsoft-stream.njcreative123.workers.dev/#home', { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(2500);

// open sidebar and go to AI
await page.click('#mtoggle');
await page.waitForTimeout(400);
await page.click('[data-nav="ai"]');
await page.waitForTimeout(2000);
console.log('AI: chatIn visible:', await page.locator('#chatIn').isVisible().catch(()=>false));
console.log('AI: chatBox visible:', await page.locator('.chat-box').isVisible().catch(()=>false));
const rect = await page.evaluate(() => { const el = document.querySelector('.chat-input'); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.innerHeight }; });
console.log('chat-input rect:', JSON.stringify(rect));
try { await page.fill('#chatIn', 'Hi NJ'); console.log('typed OK'); } catch(e){ console.log('TYPING FAIL:', e.message.split('\n')[0]); }
await page.screenshot({ path: 'mob_ai.png' });

// go to telegram room
await page.click('#mtoggle');
await page.waitForTimeout(300);
await page.click('[data-nav="tg"]');
await page.waitForTimeout(2500);
console.log('TG: grid items:', await page.locator('#tgList .tg-card, #tgList .tg-msg-card').count());
await page.screenshot({ path: 'mob_tg.png' });

// go to home, wait 10s, check if home data persists
await page.click('#mtoggle');
await page.waitForTimeout(300);
await page.click('[data-nav="home"]');
await page.waitForTimeout(1000);
const homeBefore = await page.locator('.ch-row-card').count();
await page.waitForTimeout(10000);
const homeAfter = await page.locator('.ch-row-card').count();
console.log('home rows before/after 10s:', homeBefore, homeAfter);
console.log('errors:', JSON.stringify(errors.filter(e => !e.includes('favicon') && !e.includes('401'))));
await browser.close();
