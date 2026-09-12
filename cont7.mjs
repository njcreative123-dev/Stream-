import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const EXE = '/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const out = {}; const errors = [];
const browser = await chromium.launch({
  headless: true,
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl']
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
const J = ms => page.waitForTimeout(ms);
const clickNav = async nav => {
  try { await page.click(`.nav-btn[data-nav="${nav}"]`, { timeout: 8000 }); } catch { await page.evaluate(n => { const b = document.querySelector(`.nav-btn[data-nav="${n}"]`); if (b) b.click(); }, nav); }
  await J(2000);
};
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('#app .page.active', { timeout: 20000 }).catch(()=>{});
await J(6000);

out.webgl = await page.evaluate(() => {
  const c = document.createElement('canvas');
  return { webgl: !!c.getContext('webgl'), webgl2: !!c.getContext('webgl2') };
});

// Build check: each slot should have attached canvas after initAgent3D completes
await J(4000);
out.avatars = await page.evaluate(() => {
  const slots = [...document.querySelectorAll('.agent3d[data-avatar]')];
  return slots.map(s => ({
    id: s.getAttribute('data-avatar'),
    built: !!s._njsc,
    canvas: !!s.querySelector('canvas'),
    fallback: s.textContent.includes('📺') || s.textContent.includes('📱') || s.textContent.includes('🎬') || s.textContent.includes('📚') || s.textContent.includes('🔍') || s.textContent.includes('🧠') && !s.querySelector('canvas')
  }));
});

// Visit each room and screenshot
const rooms = [['tv','telly'],['tg','sathi'],['movies','filmy'],['books','kitabi'],['search','khojo'],['nj','nj']];
for (const [nav, id] of rooms) {
  await clickNav(nav);
  await J(2500);
  const st = await page.evaluate((pid) => {
    const s = document.querySelector('.agent3d[data-avatar="'+pid+'"]');
    return s ? { hasCanvas: !!s.querySelector('canvas'), built: !!s._njsc, vis: !!s._njsc && !!s._njsc.inView, w: s.clientWidth } : null;
  }, id);
  out['room_' + nav] = st;
  await page.screenshot({ path: `/root/johnny.heliohost./cont7_${nav}_3d.png` });
}

// AI room + speak animation
await clickNav('ai');
await J(2500);
await page.screenshot({ path: '/root/johnny.heliohost./cont7_ai_3d.png' });
await page.evaluate(() => { window.njAvatarSpeakAll(true); });
await J(1200);
const mouth = await page.evaluate(() => {
  const sc = window.njAvatars.scenes[0];
  return sc ? { sayT: sc.sayT, mouthY: sc.mouth.scale.y, scenes: NJAV.scenes.length } : null;
});
out.speak = mouth;

console.log(JSON.stringify({ out, errors: errors.slice(0, 8), errorCount: errors.length }, null, 1));
await browser.close();
