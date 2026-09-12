import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev/family';
(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // --- Desktop test ---
  console.log('--- DESKTOP (1280x800) ---');
  const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p1 = await ctx1.newPage();
  p1.on('console', msg => { if (msg.type() === 'error') console.log('  [console.error]', msg.text().slice(0, 200)); });
  p1.on('pageerror', err => console.log('  [pageerror]', String(err).slice(0, 200)));
  await p1.goto(URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await p1.waitForTimeout(3000);
  
  // Check loader gone
  const loaderVisible1 = await p1.$eval('#loader', el => !el.classList.contains('hide')).catch(() => false);
  console.log('  loader hidden:', !loaderVisible1);
  
  // Check family page is active
  const famActive1 = await p1.$eval('#pg-family', el => el.classList.contains('active')).catch(() => false);
  console.log('  pg-family active:', famActive1);
  
  // Check family heading
  const heading1 = await p1.$eval('#pg-family h1', el => el.textContent).catch(() => 'N/A');
  console.log('  heading:', heading1.trim());
  
  await p1.screenshot({ path: 'FAMILY_desktop_before.png', fullPage: false });
  console.log('  screenshot: FAMILY_desktop_before.png');
  
  // Click start button
  const startBtn1 = await p1.$('#famStartBtn');
  if (startBtn1) {
    console.log('  clicking Family Meeting start...');
    await startBtn1.click();
    await p1.waitForTimeout(12000);  // wait for agent calls
  }
  await p1.screenshot({ path: 'FAMILY_desktop_session.png', fullPage: false });
  console.log('  screenshot: FAMILY_desktop_session.png');
  
  // Count messages
  const msgCount1 = await p1.$$eval('#famMsgs .msg', els => els.length).catch(() => 0);
  console.log('  message count:', msgCount1);
  
  // Try typing a message
  const famIn1 = await p1.$('#famIn');
  if (famIn1) {
    await famIn1.fill('Hello family! Testing human entry.');
    await famIn1.press('Enter');
    await p1.waitForTimeout(8000);
  }
  await p1.screenshot({ path: 'FAMILY_desktop_sent.png', fullPage: false });
  const msgCount2 = await p1.$$eval('#famMsgs .msg', els => els.length).catch(() => 0);
  console.log('  messages after send:', msgCount2);
  console.log('  screenshot: FAMILY_desktop_sent.png');
  await ctx1.close();
  
  // --- Mobile test ---
  console.log('--- MOBILE (390x844) ---');
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p2 = await ctx2.newPage();
  await p2.goto(URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await p2.waitForTimeout(3000);
  const famActive2 = await p2.$eval('#pg-family', el => el.classList.contains('active')).catch(() => false);
  console.log('  pg-family active:', famActive2);
  await p2.screenshot({ path: 'FAMILY_mobile.png', fullPage: false });
  console.log('  screenshot: FAMILY_mobile.png');
  await ctx2.close();
  
  await browser.close();
  console.log('\n=== DONE ===');
})();
