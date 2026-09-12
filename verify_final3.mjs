import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', m => { if (m.type()==='error') errors.push(m.text().slice(0,160)); });
page.on('pageerror', e => errors.push('PAGEERR: '+e.message.slice(0,160)));

await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(5000);

// Home
const loader = await page.$('.loader, #bootLoader, .boot-screen');
const famWall = await page.$('#famWall, #familyWall');
const agents = await page.$$eval('.agent3d', els => els.length).catch(()=>0);
console.log('HOME | loader:', !!loader, '| family wall:', !!famWall, '| agent3d:', agents);
await page.screenshot({ path: '/root/johnny.heliohost./V86_home.png' });

// Click TV nav
console.log('=== CLICK TV ===');
await page.click('text=Live TV');
await page.waitForTimeout(14000);
const tvCount = await page.$$eval('.tv-card', els => els.length).catch(()=>0);
const tvWorking = await page.evaluate(() => document.querySelector('#tvWorking')?.textContent || '?');
const tvText = await page.evaluate(() => document.body.innerText.slice(0,120).replace(/\n/g,' '));
console.log('TV cards:', tvCount, '| working text:', tvWorking, '|', tvText.slice(0,90));
await page.screenshot({ path: '/root/johnny.heliohost./V86_tv.png' });

// Click Videos/TG
console.log('=== CLICK VIDEOS ===');
await page.click('text=Videos');
await page.waitForTimeout(10000);
const vids = await page.$$eval('.libCard, .lib-card, [data-mtype]', els => els.length).catch(()=>0);
const vidText = await page.evaluate(() => document.body.innerText.slice(0,90).replace(/\n/g,' '));
console.log('Video lib items:', vids, '|', vidText.slice(0,80));
await page.screenshot({ path: '/root/johnny.heliohost./V86_videos.png' });

// Click AI Chat
console.log('=== CLICK AI CHAT ===');
await page.click('text=AI Chat');
await page.waitForTimeout(6000);
const chatBox = await page.$('#chatInput, #aiInput, #njiChatInput, textarea, input[type="text"]');
const chatText = await page.evaluate(() => document.body.innerText.slice(0,90).replace(/\n/g,' '));
console.log('Chat input:', chatBox ? 'YES' : 'NO', '|', chatText.slice(0,80));
await page.screenshot({ path: '/root/johnny.heliohost./V86_ai.png' });

// Click Family Room
console.log('=== CLICK FAMILY ===');
await page.click('text=Family Room');
await page.waitForTimeout(6000);
const famInput = await page.$('#familyInput, #famInput, #familyChatInput, #famMsg, textarea, input[type="text"]');
const famAgentCards = await page.$$eval('[data-agent], .fam-agent, .agent-card', els => els.length).catch(()=>0);
const famText = await page.evaluate(() => document.body.innerText.slice(0,90).replace(/\n/g,' '));
console.log('Family chat input:', famInput ? 'YES' : 'NO', '| agent cards:', famAgentCards, '|', famText.slice(0,80));
await page.screenshot({ path: '/root/johnny.heliohost./V86_family.png' });

console.log('=== ERRORS ===');
console.log(errors.length ? errors.slice(0,10).join('\n') : 'NONE');
await browser.close();
