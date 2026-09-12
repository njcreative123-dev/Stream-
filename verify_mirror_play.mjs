import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon') && !m.text().includes('net::ERR_')) errs.push('[err] ' + m.text().slice(0, 140)); });
  page.on('pageerror', e => errs.push('[pageerr] ' + String(e).slice(0, 140)));
  
  await page.goto(BASE + '/videos', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  // Find the mirrored video card (243902) by searching
  const mirrored = await page.$('#tgvGrid [data-libplay][data-libt*="sample_30s"]');
  const playSel = mirrored || await page.$('#tgvGrid [data-libplay]');
  console.log('using card:', await playSel.getAttribute('data-libt'));
  await playSel.click();
  await page.waitForTimeout(2500);
  await page.$eval('#vmPlayBtn', b => b.click());
  await page.waitForTimeout(7000);
  const st = await page.evaluate(() => {
    const v = document.getElementById('vmVideo');
    return { ready: v.readyState, paused: v.paused, t: Math.round(v.currentTime * 10) / 10, dur: Math.round(v.duration), err: v.error ? v.error.message : null, src: (v.currentSrc || '').slice(-70) };
  });
  console.log('PLAYBACK:', JSON.stringify(st));
  await page.screenshot({ path: 'PROOF_mirror_playing.png', fullPage: false });
  
  // Range request proof
  const r = await page.request.get(BASE + '/api/media/243902', { headers: { Range: 'bytes=0-1023', 'User-Agent': 'Mozilla/5.0' } });
  console.log('range:', r.status(), '| content-range:', r.headers()['content-range'], '| bytes:', r.headers()['content-length']);
  const dl = await page.request.get(BASE + '/api/media/243902?download=1', { headers: { 'User-Agent': 'Mozilla/5.0' } });
  console.log('download:', dl.status(), '| disposition:', dl.headers()['content-disposition']);
  await r.dispose().catch(()=>{}); await dl.dispose().catch(()=>{});
  
  await browser.close();
  console.log('ERRORS:', errs.slice(0, 6));
  console.log('=== DONE ===');
})();
