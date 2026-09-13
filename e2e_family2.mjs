import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERR:', e.message.slice(0,200)));

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await page.waitForTimeout(2000);

// Navigate to AF then family
await page.evaluate(() => { const b = document.querySelector('[data-nav="af"]'); if (b) b.click(); });
await page.waitForTimeout(1500);

// Check what AF tabs/buttons exist
const afBtns = await page.evaluate(() => [...document.querySelectorAll('[data-af]')].map(b => b.getAttribute('data-af')));
console.log('AF buttons:', JSON.stringify(afBtns));

// Check if family page is accessible directly
await page.evaluate(() => { location.hash = '#family'; });
await page.waitForTimeout(2000);

const famState = await page.evaluate(() => {
  return {
    pgFamilyActive: document.getElementById('pg-family')?.classList.contains('active'),
    famStartBtn: !!document.getElementById('famStartBtn'),
    famIn: !!document.getElementById('famIn'),
    famMsgs: !!document.getElementById('famMsgs'),
    famMsgsCount: document.getElementById('famMsgs')?.children?.length ?? 0,
    chatBoxVisible: document.querySelector('.fam-chat')?.getBoundingClientRect()?.height || 0,
  };
});
console.log('FAMILY:', JSON.stringify(famState));
await page.screenshot({ path: 'E2E_family2_initial.png' });

// Click "Family Meeting Shuru Karo"
if (famState.famStartBtn) {
  await page.click('#famStartBtn');
  console.log('Clicked famStartBtn');
  await page.waitForTimeout(15000); // Wait for agent responses
  const msgs = await page.evaluate(() => {
    const m = document.getElementById('famMsgs');
    return { count: m?.children?.length ?? 0, lastText: m?.lastChild?.textContent?.slice(0,200) || '' };
  });
  console.log('AFTER START:', JSON.stringify(msgs));
  await page.screenshot({ path: 'E2E_family2_after_start.png' });
}

// Try typing in the input
if (famState.famIn) {
  await page.fill('#famIn', 'Hello family!');
  await page.click('[data-fam-send]');
  console.log('Typed and sent message');
  await page.waitForTimeout(12000);
  const msgs2 = await page.evaluate(() => {
    const m = document.getElementById('famMsgs');
    return { count: m?.children?.length ?? 0, lastText: m?.lastChild?.textContent?.slice(0,200) || '' };
  });
  console.log('AFTER SEND:', JSON.stringify(msgs2));
  await page.screenshot({ path: 'E2E_family2_after_send.png' });
}

await browser.close();
