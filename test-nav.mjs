import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
mkdirSync('/tmp/njstream-tests', { recursive: true });

const SITE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 }
];

const navPages = [
  { nav: 'home', label: 'Home', check: ['NJStream', 'Live TV'] },
  { nav: 'tv', label: 'Live TV', check: ['channels', 'category', 'Channel'] },
  { nav: 'tg', label: 'Telegram', check: ['Messages', 'Videos'] },
  { nav: 'movies', label: 'Movies', check: ['movie', 'popular'] },
  { nav: 'books', label: 'Books', check: ['book', 'pdf', 'ebook'] },
  { nav: 'search', label: 'Search', check: ['search'] },
  { nav: 'ai', label: 'AI Chat', check: ['chat', 'AI', 'agent'] },
  { nav: 'family', label: 'Family Room', check: ['Family', 'chat'] }
];

async function run() {
  let totalPass = 0, totalFail = 0;
  const allResults = {};
  
  for (const vp of viewports) {
    console.log(`\n=== ${vp.name.toUpperCase()} ${vp.width}x${vp.height} ===`);
    const browser = await chromium.launch({
      executablePath: EXE,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    
    await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    for (const pg of navPages) {
      try {
        // Click nav button
        await page.evaluate((n) => { if (window.go) go(n); else { var b = document.querySelector(`[data-nav="${n}"]`); if (b) b.click(); } }, pg.nav);
        await page.waitForTimeout(3000);
        
        // Check page is active
        const isActive = await page.evaluate((pgId) => {
          const el = document.getElementById('pg-' + pgId);
          return el ? el.classList.contains('active') : false;
        }, pg.nav);
        
        // Get visible text
        const bodyText = await page.evaluate(() => {
          const activePage = document.querySelector('.page.active');
          return activePage ? activePage.innerText.substring(0, 500) : '';
        });
        
        // Check for loader
        const loaderVisible = await page.evaluate(() => {
          const l = document.getElementById('appLoader');
          return l && l.style.display !== 'none' && getComputedStyle(l).display !== 'none';
        });
        
        // Screenshot
        const ss = `/tmp/njstream-tests/${vp.name}_${pg.nav}.png`;
        await page.screenshot({ path: ss, fullPage: false });
        
        const hasContent = bodyText.trim().length > 50;
        const pass = isActive && hasContent && !loaderVisible;
        
        if (pass) totalPass++; else totalFail++;
        const emoji = pass ? '✅' : '❌';
        console.log(`${emoji} ${pg.label}: active=${isActive} loader=${loaderVisible} text=${bodyText.length} "${bodyText.substring(0, 100).replace(/\n/g,' ')}..."`);
        
        // Special checks for telegram page
        if (pg.nav === 'tg' && pass) {
          await page.waitForTimeout(2000);
          const vidStats = await page.evaluate(() => ({
            videos: document.querySelectorAll('video').length,
            iframes: document.querySelectorAll('iframe').length,
            tmeIframes: document.querySelectorAll('iframe[src*="t.me"]').length,
            bigCards: document.querySelectorAll('.video-big-notice').length,
            tgMsgs: document.querySelectorAll('.tg-msg').length,
            tmeSrcs: Array.from(document.querySelectorAll('iframe[src*="t.me"]')).map(f => f.src.substring(0, 120))
          }));
          console.log(`  📹 Videos:${vidStats.videos} Iframes:${vidStats.iframes} TME:${vidStats.tmeIframes} BigCards:${vidStats.bigCards} TGMsgs:${vidStats.tgMsgs}`);
          if (vidStats.tmeSrcs.length > 0) console.log(`  🔗 TME URLs: ${vidStats.tmeSrcs[0]}`);
        }
      } catch (e) {
        totalFail++;
        console.log(`❌ ${pg.label}: ERROR ${e.message.substring(0, 100)}`);
      }
    }
    
    // Check animations on home page
    await page.evaluate(() => { if (window.go) go('home'); else { var b = document.querySelector('[data-nav="home"]'); if (b) b.click(); } });
    await page.waitForTimeout(2000);
    const animInfo = await page.evaluate(() => {
      let anims = 0, transitions = 0;
      document.querySelectorAll('*').forEach(el => {
        const s = getComputedStyle(el);
        if (s.animationName && s.animationName !== 'none') anims++;
        if (s.transitionProperty && s.transitionProperty !== 'all' && s.transitionProperty !== 'none') transitions++;
      });
      return { anims, transitions, pages: document.querySelectorAll('.page').length, activePage: document.querySelector('.page.active')?.id };
    });
    console.log(`🎨 Animations: ${animInfo.anims} Transitions: ${animInfo.transitions} Pages: ${animInfo.pages} Active: ${animInfo.activePage}`);
    
    if (errors.length > 0) {
      console.log(`⚠️ Console errors (${errors.length}):`);
      errors.slice(0, 5).forEach(e => console.log(`  - ${e.substring(0, 200)}`));
    }
    
    allResults[vp.name] = { pass: totalPass, fail: totalFail, errors: errors.length };
    await ctx.close();
    await browser.close();
  }
  
  console.log(`\n=== FINAL SUMMARY ===`);
  for (const [k, v] of Object.entries(allResults)) {
    console.log(`${k}: ${v.pass} passed, ${v.fail} failed, ${v.errors} console errors`);
  }
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
