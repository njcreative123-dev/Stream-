import { chromium } from 'playwright';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
await page.goto('https://njsoft-stream.njcreative123.workers.dev', { waitUntil: 'domcontentloaded', timeout: 25000 });
await page.waitForTimeout(4500);
await page.screenshot({ path: '/tmp/nj_home_375.png', fullPage: false });
await page.screenshot({ path: '/tmp/nj_home_375_full.png', fullPage: true });
await browser.close();
