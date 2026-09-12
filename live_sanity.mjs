import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const routes = ['/', '/tv', '/telegram', '/ai', '/books', '/movies', '/search'];
const errors = [];
const run = async (viewport, tag) => {
  const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport });
  const out = [];
  for (const r of routes) {
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    const res = await p.goto(BASE + r, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => ({ status: 'ERR ' + e.message }));
    await p.waitForTimeout(1500);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const title = await p.title().catch(() => '');
    out.push(`${r}:${res.status()} ov=${ov} "${title.slice(0,30)}"` + (errs.length ? ' PAGEERR:' + errs[0] : ''));
  }
  await b.close();
  console.log(`\n== ${tag} ${viewport.width}x${viewport.height} ==`);
  for (const l of out) console.log(l);
};
await run({ width: 390, height: 844 }, 'mobile');
await run({ width: 1366, height: 768 }, 'desktop');
