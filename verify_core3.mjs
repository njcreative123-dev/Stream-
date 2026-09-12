import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', m => { if (['error','warning'].includes(m.type())) errors.push(m.type()+': '+m.text().slice(0,200)); });
page.on('pageerror', e => errors.push('pageerror: '+e.message.slice(0,200)));

await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(6000);

function nav(pageName) {
  return page.locator('.side .nav-btn[data-nav="'+pageName+'"]');
}

// 1. FAMILY ROOM
console.log('=== FAMILY ROOM ===');
await nav('family').click();
await page.waitForTimeout(3000);
const famState = await page.evaluate(() => {
  const input = document.getElementById('famIn');
  return {
    activePage: document.querySelector('.page.active')?.id,
    inputExists: !!input,
    inputDisabled: input?.disabled,
    inputPlaceholder: input?.placeholder
  };
});
console.log(JSON.stringify(famState));
await page.screenshot({ path: '/tmp/family_room.png' });

if (famState.inputExists) {
  await page.locator('#famIn').fill('namaste family');
  console.log('Typed:', await page.locator('#famIn').inputValue());
}

// 2. AI CHAT
console.log('\n=== AI CHAT ===');
await nav('ai').click();
await page.waitForTimeout(3000);
const aiState = await page.evaluate(() => {
  const input = document.getElementById('chatIn');
  return {
    activePage: document.querySelector('.page.active')?.id,
    inputExists: !!input,
    inputPlaceholder: input?.placeholder
  };
});
console.log(JSON.stringify(aiState));
await page.screenshot({ path: '/tmp/ai_chat.png' });

if (aiState.inputExists) {
  await page.locator('#chatIn').fill('hello');
  console.log('AI typed:', await page.locator('#chatIn').inputValue());
}

// 3. TV
console.log('\n=== TV ===');
await nav('tv').click();
await page.waitForTimeout(3000);
const tvState = await page.evaluate(() => ({
  cards: document.querySelectorAll('.tv-card').length,
  total: document.getElementById('tvTotal')?.textContent,
  working: document.getElementById('tvWorking')?.textContent
}));
console.log(JSON.stringify(tvState));
await page.screenshot({ path: '/tmp/tv_page.png' });

// 4. TG
console.log('\n=== TELEGRAM ===');
await nav('tg').click();
await page.waitForTimeout(3000);
const tgState = await page.evaluate(() => ({
  msgs: document.querySelectorAll('.tg-msg, .tg-item, [data-tgmsg]').length,
  listText: document.getElementById('tgMessages')?.textContent?.slice(0, 150)
}));
console.log(JSON.stringify(tgState));
await page.screenshot({ path: '/tmp/tg_page.png' });

// 5. Long video test - click Play on first video
console.log('\n=== LONG VIDEO ===');
await nav('tgv').click();
await page.waitForTimeout(4000);
const firstPlay = page.locator('[data-libplay]').first();
if (await firstPlay.count()) {
  const videoId = await firstPlay.getAttribute('data-libplay');
  console.log('Playing video ID:', videoId);
  await firstPlay.click();
  await page.waitForTimeout(3000);
  const modalState = await page.evaluate(() => {
    const modal = document.querySelector('.video-modal, .modal, #videoModal');
    const vid = document.querySelector('video');
    return {
      modalVisible: modal ? window.getComputedStyle(modal).display !== 'none' : false,
      videoSrc: vid?.src?.slice(0, 100) || 'none',
      videoError: vid?.error?.message || null
    };
  });
  console.log(JSON.stringify(modalState));
  await page.screenshot({ path: '/tmp/video_modal.png' });
}

// Mobile test
console.log('\n=== MOBILE VIEW ===');
await page.setViewportSize({ width: 390, height: 844 });
await nav('home').first().click();
await page.waitForTimeout(2000);
const mobileState = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  appOpacity: window.getComputedStyle(document.getElementById('app')).opacity,
  activePage: document.querySelector('.page.active')?.id
}));
console.log(JSON.stringify(mobileState));
await page.screenshot({ path: '/tmp/mobile_home.png' });

console.log('\nErrors:', errors.length ? errors.slice(0,5).join('\n') : 'NONE');
await browser.close();
console.log('DONE');
