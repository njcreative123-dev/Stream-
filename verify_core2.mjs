import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', m => { if (['error','warning'].includes(m.type())) errors.push(m.type()+': '+m.text().slice(0,200)); });
page.on('pageerror', e => errors.push(e.message));

await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);

// 1. TEST FAMILY ROOM
console.log('=== FAMILY ROOM ===');
await page.locator('[data-nav="family"]').click();
await page.waitForTimeout(2500);
const famState = await page.evaluate(() => {
  const input = document.getElementById('famIn');
  const box = document.querySelector('.fam-chat, .chat-box, #famChat');
  const msgs = document.querySelectorAll('.fam-msg, .msg-item, .chat-msg');
  return {
    activePage: document.querySelector('.page.active')?.id,
    inputExists: !!input,
    inputDisabled: input ? input.disabled : null,
    inputPlaceholder: input ? input.placeholder : null,
    boxExists: !!box,
    boxText: box ? box.textContent.slice(0, 150) : null,
    msgsCount: msgs.length
  };
});
console.log(JSON.stringify(famState, null, 1));
await page.screenshot({ path: '/tmp/family_room.png' });

// Try typing
if (famState.inputExists) {
  await page.locator('#famIn').fill('namaste family');
  const typedVal = await page.locator('#famIn').inputValue();
  console.log('Typed value:', JSON.stringify(typedVal));
  await page.screenshot({ path: '/tmp/family_typed.png' });
}

// 2. TEST AI CHAT
console.log('\n=== AI CHAT ===');
await page.locator('[data-nav="ai"]').click();
await page.waitForTimeout(2500);
const aiState = await page.evaluate(() => {
  const input = document.getElementById('chatIn');
  const box = document.querySelector('.chat-box');
  return {
    activePage: document.querySelector('.page.active')?.id,
    inputExists: !!input,
    inputPlaceholder: input ? input.placeholder : null,
    boxExists: !!box,
    boxText: box ? box.textContent.slice(0, 120) : null
  };
});
console.log(JSON.stringify(aiState, null, 1));
await page.screenshot({ path: '/tmp/ai_chat.png' });

if (aiState.inputExists) {
  await page.locator('#chatIn').fill('hello');
  const typed = await page.locator('#chatIn').inputValue();
  console.log('AI typed:', JSON.stringify(typed));
}

// 3. TEST TV
console.log('\n=== TV ===');
await page.locator('[data-nav="tv"]').click();
await page.waitForTimeout(3000);
const tvState = await page.evaluate(() => {
  const cards = document.querySelectorAll('.tv-card');
  const total = document.getElementById('tvTotal');
  const working = document.getElementById('tvWorking');
  return {
    cards: cards.length,
    total: total ? total.textContent : null,
    working: working ? working.textContent : null,
    gridSample: cards.length ? cards[0].textContent.trim().slice(0,60) : 'none'
  };
});
console.log(JSON.stringify(tvState, null, 1));
await page.screenshot({ path: '/tmp/tv_page.png' });

console.log('\nErrors:', errors.length ? errors.join('\n') : 'NONE');
await browser.close();
