import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  const mediaReqs = [];
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon') && !m.text().includes('net::ERR_')) errs.push('[err] ' + m.text().slice(0, 160)); });
  page.on('pageerror', e => errs.push('[pageerr] ' + String(e).slice(0, 160)));
  page.on('request', r => { if (r.url().includes('/api/media/')) mediaReqs.push(r.url().slice(0, 160)); });

  await page.goto(BASE + '/videos', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  const first = await page.$('#tgvGrid [data-libplay]');
  const id = await first.getAttribute('data-libplay');
  console.log('play id:', id);
  await first.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'PLAY_modal_thumb.png', fullPage: false });
  // click modal play
  const pb = await page.$('#vmPlayBtn');
  await pb.click();
  await page.waitForTimeout(8000);
  const state = await page.evaluate(() => {
    const v = document.getElementById('vmVideo');
    return { readyState: v.readyState, paused: v.paused, currentTime: v.currentTime, duration: v.duration, err: v.error ? v.error.message : null, wait: v.waiting };
  });
  console.log('video state:', JSON.stringify(state));
  console.log('media requests:', mediaReqs.slice(0, 3));
  await page.screenshot({ path: 'PLAY_modal_streaming.png', fullPage: false });

  // Download check
  const dl = await page.request.get(BASE + '/api/media/' + id + '?download=1', { maxRedirects: 0 });
  console.log('download status:', dl.status(), '| content-disposition:', dl.headers()['content-disposition'] || '', '| type:', dl.headers()['content-type']);
  await dl.dispose().catch(()=>{});

  await browser.close();
  console.log('ERRORS:', errs.slice(0, 6));
  console.log('=== DONE ===');
})();
