import { chromium } from 'playwright';
const URL = 'https://njsoft-stream.njcreative123.workers.dev';
const exe = process.env.PWCHROME;
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });

// DESKTOP
const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const dp = await desktop.newPage();
const derrs = [];
dp.on('pageerror', e => derrs.push('PAGEERR:' + e.message.slice(0,120)));
await dp.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await dp.waitForTimeout(3000);
await dp.screenshot({ path: 'V9_desk_home.png' });
// Check home sections
const homeInfo = await dp.evaluate(() => {
  return {
    trendingMovies: !!document.getElementById('homeTrendingMovies'),
    continueWatching: !!document.getElementById('homeContinueSection'),
    bottomNav: !!document.getElementById('mobileBnav'),
    bottomNavDisplay: getComputedStyle(document.getElementById('mobileBnav')).display,
    hero: !!document.querySelector('.stream-hero'),
    channelRow: !!document.getElementById('homeChannels'),
    tgPreview: !!document.getElementById('homeTG'),
    readyMovies: !!document.getElementById('homeReady'),
  };
});
console.log('DESKTOP HOME:', JSON.stringify(homeInfo));

// Movies page with SVG poster
await dp.evaluate(() => document.querySelector('[data-nav="movies"]').click());
await dp.waitForTimeout(8000);
await dp.screenshot({ path: 'V9_desk_movies.png' });
const movieCards = await dp.evaluate(() => {
  const cards = document.querySelectorAll('#moviesGrid .media-card');
  const imgs = document.querySelectorAll('#moviesGrid .media-card img, #moviesGrid .media-card div[style*="linear-gradient"]');
  return { count: cards.length, hasImages: imgs.length };
});
console.log('DESKTOP MOVIES:', JSON.stringify(movieCards));

// All other pages
for (const page of ['tv','books','tg','af','search']) {
  await dp.evaluate(p => document.querySelector(`[data-nav="${p}"]`).click(), page);
  await dp.waitForTimeout(page==='tv'?6000:4000);
  await dp.screenshot({ path: `V9_desk_${page}.png` });
  const st = await dp.evaluate(p => {
    const el = document.getElementById('pg-'+p);
    const r = el?.getBoundingClientRect();
    return { display: el?getComputedStyle(el).display:'MISS', w: r?Math.round(r.width):0, h: r?Math.round(r.height):0 };
  }, page);
  console.log(`DESKTOP ${page.toUpperCase()}:`, JSON.stringify(st));
}
console.log('DESKTOP ERRORS:', derrs.length, derrs.slice(0,5));

// MOBILE
const mobile = await browser.newContext({ viewport: { width: 375, height: 812 } });
const mp = await mobile.newPage();
const merrs = [];
mp.on('pageerror', e => merrs.push('PAGEERR:' + e.message.slice(0,120)));
await mp.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(()=>{});
await mp.waitForTimeout(3000);
await mp.screenshot({ path: 'V9_mob_home.png' });
const mobileHome = await mp.evaluate(() => {
  const bnav = document.getElementById('mobileBnav');
  const side = document.querySelector('.side');
  return {
    bottomNavVisible: bnav ? getComputedStyle(bnav).display : 'MISS',
    sidebarHidden: side ? getComputedStyle(side).transform : 'MISS',
    hero: !!document.querySelector('.stream-hero'),
    trendingMovies: !!document.getElementById('homeTrendingMovies'),
  };
});
console.log('MOBILE HOME:', JSON.stringify(mobileHome));
// Navigate to movies on mobile
await mp.evaluate(() => document.querySelector('[data-nav="movies"]').click());
await mp.waitForTimeout(8000);
await mp.screenshot({ path: 'V9_mob_movies.png' });
console.log('MOBILE ERRORS:', merrs.length, merrs.slice(0,5));
await browser.close();
console.log('DONE');
