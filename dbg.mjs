import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 900, height: 700 } });
p.on('pageerror', e => console.log('PAGEERR:', e.message));
p.on('console', m => console.log('CONSOLE', m.type(), m.text().slice(0,120)));
await p.setContent('<h1>hi</h1><script>window.hello=42; console.log("inline ran");</script>', { waitUntil: 'load' });
await new Promise(r=>setTimeout(r,1000));
console.log('window.hello =', await p.evaluate(() => window.hello));
await b.close();
