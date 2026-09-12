import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

// Home page
console.log('=== HOME PAGE ===');
await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/root/johnny.heliohost./verify_home.png', fullPage: false });
const title = await page.title();
const famWall = await page.$('#famWall');
const agents = await page.$$('.agent3d');
const loading = await page.$('.loader');
console.log(`Title: ${title}`);
console.log(`Family Wall: ${famWall ? 'YES' : 'NO'}`);
console.log(`Agents: ${agents.length}`);
console.log(`Loader visible: ${loading ? 'YES' : 'NO'}`);

// TV room
console.log('=== TV ROOM ===');
await page.goto('https://njsoft-stream.njcreative123.workers.dev/#tv', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(5000);
await page.screenshot({ path: '/root/johnny.heliohost./verify_tv.png', fullPage: false });
const tvCards = await page.$$('[data-chan]');
const tvCatButtons = await page.$$('.tv-cat-btn, .cat-btn, [data-cat]');
console.log(`TV channel cards: ${tvCards.length}`);
console.log(`Category buttons: ${tvCatButtons.length}`);

// AI Family
console.log('=== AI FAMILY ===');
await page.goto('https://njsoft-stream.njcreative123.workers.dev/#ai', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(4000);
await page.screenshot({ path: '/root/johnny.heliohost./verify_ai.png', fullPage: false });
const chatInput = await page.$('#chatInput, #aiInput, textarea, input[type="text"]');
console.log(`Chat input found: ${chatInput ? 'YES' : 'NO'}`);

// Telegram library
console.log('=== TELEGRAM LIBRARY ===');
await page.goto('https://njsoft-stream.njcreative123.workers.dev/#videos', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(5000);
await page.screenshot({ path: '/root/johnny.heliohost./verify_tglib.png', fullPage: false });
const libCards = await page.$$('.lib-card, .libCard, .tg-card, [data-mtype]');
console.log(`Library cards: ${libCards.length}`);

// API checks
console.log('=== API CHECKS ===');
const healthResp = await page.goto('https://njsoft-stream.njcreative123.workers.dev/api/tv/channels?limit=5');
const tvJson = await healthResp.json();
console.log(`TV API: total=${tvJson.total || 0}, working=${tvJson.working || 0}`);

await browser.close();
console.log('=== DONE ===');
