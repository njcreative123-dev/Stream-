import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));

// 1. Load site
await page.goto('https://njsoft-stream.njcreative123.workers.dev/#home', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'audit_home.png', fullPage: false });
console.log('Home loaded, loader visible?', await page.locator('#loader').isVisible().catch(() => 'err'));

// 2. Navigate to AI Chat
await page.click('[data-nav="ai"]');
await page.waitForTimeout(2000);
const aiChatVisible = await page.locator('#chatIn').isVisible().catch(() => false);
const chatBoxVisible = await page.locator('.chat-box').isVisible().catch(() => false);
const familyModalVisible = await page.locator('.family-modal, [data-family-chat], #familyChatBtn').count().catch(() => 0);
await page.screenshot({ path: 'audit_ai_chat.png', fullPage: false });
console.log('AI Chat - chatIn visible:', aiChatVisible, 'chatBox visible:', chatBoxVisible, 'familyUI count:', familyModalVisible);

// 3. Check if chat input works
if (aiChatVisible) {
  await page.fill('#chatIn', 'Hello NJ');
  await page.click('[data-send]');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'audit_ai_chat_sent.png', fullPage: false });
}

// 4. Check all pages for console errors
for (const pg of ['tv', 'tg', 'movies', 'books', 'search', 'nj']) {
  await page.click(`[data-nav="${pg}"]`);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `audit_${pg}.png`, fullPage: false });
}

console.log('Console errors:', JSON.stringify(errors.filter(e => !e.includes('favicon') && !e.includes('401'))));
await browser.close();
