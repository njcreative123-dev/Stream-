import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', m => { if (m.type()==='error') errors.push(m.text().slice(0,150)); });
page.on('pageerror', e => errors.push('PAGEERR: '+e.message.slice(0,150)));

await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(5000);

// Click TV nav
console.log('=== CLICK TV ===');
await page.click('text=Live TV');
await page.waitForTimeout(12000);
const tvCount = await page.$$eval('[data-chan]', els => els.length).catch(() => 0);
const tvText = await page.evaluate(() => document.body.innerText.slice(0,80));
await page.screenshot({ path: '/root/johnny.heliohost./FINAL_tv_click.png' });
console.log('TV cards:', tvCount, '| text:', tvText.replace(/\n/g,' ').slice(0,60));

// Click Videos/TG
console.log('=== CLICK VIDEOS ===');
await page.click('text=Videos');
await page.waitForTimeout(10000);
const vids = await page.$$eval('.libCard, .lib-card, [data-mtype="tg"]', els => els.length).catch(() => 0);
await page.screenshot({ path: '/root/johnny.heliohost./FINAL_videos_click.png' });
console.log('Video lib items:', vids);

// Click AI Chat
console.log('=== CLICK AI CHAT ===');
await page.click('text=AI Chat');
await page.waitForTimeout(5000);
const chatBox = await page.$('#chatInput, #aiInput, textarea, input[type="text"]');
console.log('Chat input:', chatBox ? 'YES' : 'NO');

// Click Family Room
console.log('=== CLICK FAMILY ===');
await page.click('text=Family Room');
await page.waitForTimeout(5000);
const famInput = await page.$('#familyInput, #famInput, #familyChatInput, textarea, input[type="text"]');
const famAgentCards = await page.$$eval('.fam-agent, .agent-card, [data-agent]', els => els.length).catch(() => 0);
await page.screenshot({ path: '/root/johnny.heliohost./FINAL_family_click.png' });
console.log('Family chat input:', famInput ? 'YES' : 'NO', '| agent cards:', famAgentCards);

console.log('=== ERRORS ===');
console.log(errors.length ? errors.slice(0,8).join('\n') : 'NONE');
await browser.close();
