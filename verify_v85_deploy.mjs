import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', e => errors.push(e.message));

console.log('=== Loading site ===');
const t0 = Date.now();
await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 45000 });
const loadTime = Date.now() - t0;
console.log(`Page loaded in ${loadTime}ms`);

// Check loader visibility
const loaderVisible = await page.evaluate(() => {
  const l = document.getElementById('loader');
  if (!l) return 'no-loader-element';
  const s = window.getComputedStyle(l);
  return { display: s.display, opacity: s.opacity, pointerEvents: s.pointerEvents };
});
console.log('Loader state:', JSON.stringify(loaderVisible));

// Check if app is visible
const appVisible = await page.evaluate(() => {
  const a = document.getElementById('app');
  if (!a) return 'no-app-element';
  const s = window.getComputedStyle(a);
  return { display: s.display, opacity: s.opacity, hasPages: a.querySelectorAll('.page').length };
});
console.log('App state:', JSON.stringify(appVisible));

// Wait for loader to hide
await page.waitForTimeout(5000);
const loaderAfter = await page.evaluate(() => {
  const l = document.getElementById('loader');
  if (!l) return 'removed';
  return { display: l.style.display, opacity: l.style.opacity };
});
console.log('Loader after 5s:', JSON.stringify(loaderAfter));

// Screenshot
await page.screenshot({ path: '/tmp/verify_v85_01_home.png', fullPage: false });

// Check all nav links
const navLinks = await page.evaluate(() => {
  const links = document.querySelectorAll('.side a, nav a, [data-page]');
  return Array.from(links).map(l => ({ text: l.textContent.trim(), href: l.getAttribute('href'), dataPage: l.getAttribute('data-page') }));
});
console.log('Nav links:', JSON.stringify(navLinks.slice(0, 15)));

// Check pages
const pages = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.page')).map(p => ({
    id: p.id, class: p.className, visible: window.getComputedStyle(p).display !== 'none'
  }));
});
console.log('Pages:', JSON.stringify(pages));

// Check 3D agents
const agents = await page.evaluate(() => {
  const a3d = document.querySelectorAll('.agent3d, [data-avatar]');
  return { count: a3d.length, ids: Array.from(a3d).map(a => a.getAttribute('data-avatar') || a.className) };
});
console.log('3D agents:', JSON.stringify(agents));

// Try clicking TV
console.log('\n=== Testing TV Page ===');
const tvLink = await page.$('a[href*="tv"], a[data-page*="tv"], [data-page="tv"]');
if (tvLink) {
  await tvLink.click();
  await page.waitForTimeout(2000);
  const tvCards = await page.evaluate(() => {
    const cards = document.querySelectorAll('.tv-card, .channel-card, [data-channel]');
    return { count: cards.length, sample: Array.from(cards).slice(0,3).map(c => c.textContent.trim().slice(0,60)) };
  });
  console.log('TV cards:', JSON.stringify(tvCards));
  await page.screenshot({ path: '/tmp/verify_v85_02_tv.png' });
}

// Try clicking Videos
console.log('\n=== Testing Videos Page ===');
const vidLink = await page.$('a[href*="video"], a[data-page*="video"], [data-page="videos"]');
if (vidLink) {
  await vidLink.click();
  await page.waitForTimeout(2000);
  const vidItems = await page.evaluate(() => {
    const items = document.querySelectorAll('.lib-card, .lib-item, .video-item, [data-lib]');
    return { count: items.length, sample: Array.from(items).slice(0,3).map(i => i.textContent.trim().slice(0,60)) };
  });
  console.log('Video items:', JSON.stringify(vidItems));
  await page.screenshot({ path: '/tmp/verify_v85_03_videos.png' });
}

// Try AI Chat
console.log('\n=== Testing AI Chat ===');
const aiLink = await page.$('a[href*="ai"], a[data-page*="ai"], [data-page="ai"]');
if (aiLink) {
  await aiLink.click();
  await page.waitForTimeout(2000);
  const chatInput = await page.evaluate(() => {
    const input = document.querySelector('.chat-input input, .chat-input textarea, #chatInput');
    if (!input) return 'no-input-found';
    return { tag: input.tagName, placeholder: input.placeholder, editable: input.contentEditable };
  });
  console.log('Chat input:', JSON.stringify(chatInput));
  await page.screenshot({ path: '/tmp/verify_v85_04_ai.png' });
}

console.log('\n=== Console errors ===');
console.log('Errors:', errors.length ? errors.join('\n') : 'NONE');

await browser.close();
console.log('\n=== DONE ===');
