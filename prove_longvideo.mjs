import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const MIRROR = `${BASE}/api/media/990001?proxy=1`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#0b0f1a;color:#e8ecf8;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;padding:20px}
h2{color:#ffcc33} video{width:100%;max-width:960px;background:#000;border-radius:14px}
#log{white-space:pre-wrap;font-family:monospace;font-size:12px;background:#11162a;border:1px solid #2a3560;padding:12px;border-radius:10px;margin-top:12px;max-width:960px;width:100%;max-height:260px;overflow:auto}
</style></head><body>
<h2>NJStream Long Video Proof — 990001 (45 MB, 120s)</h2>
<video id="v" controls preload="auto" playsinline crossorigin="anonymous" src="${MIRROR}"></video>
<div id="log"></div>
<script>
const v=document.getElementById('v'); const log=document.getElementById('log');
function L(s){log.textContent += '['+new Date().toISOString().slice(11,19)+'] '+s+'\n';}
const events=['loadedmetadata','loadeddata','canplay','playing','seeked','waiting','error','stalled'];
events.forEach(e=>v.addEventListener(e,()=>L('EVENT '+e+' time='+v.currentTime.toFixed(2)+' ready='+v.readyState)));
v.addEventListener('error',()=>L('ERROR code='+v.error?.code+' msg='+v.error?.message));
window.__started=false;
window.runTest = async () => {
  L('--- TEST START ---');
  L('duration='+v.duration+'s readyState='+v.readyState);
  L('resolution='+v.videoWidth+'x'+v.videoHeight);
  L('buffered='+(v.buffered.length? v.buffered.end(v.buffered.length-1).toFixed(1):'0')+'s');
  await v.play().catch(e=>L('play err '+e.message));
  await new Promise(r=>setTimeout(r,6000));
  L('after 6s: currentTime='+v.currentTime.toFixed(2)+' paused='+v.paused+' readyState='+v.readyState);
  L('SEEK -> 60s');
  try { const p=new Promise((res,rej)=>{v.onseeked=res; setTimeout(()=>rej(new Error('seek timeout')),15000);}); v.currentTime=60; await p; } catch(e){ L('seek err '+e.message); }
  L('after seek: currentTime='+v.currentTime.toFixed(2)+' readyState='+v.readyState);
  await new Promise(r=>setTimeout(r,5000));
  L('after 5s more: currentTime='+v.currentTime.toFixed(2)+' playing='+(!v.paused));
  L('final buffered='+(v.buffered.length? v.buffered.end(v.buffered.length-1).toFixed(1):'0')+'s');
  L('--- TEST END ---');
  window.__result = { duration: v.duration, w: v.videoWidth, h: v.videoHeight,
    t1: document.querySelector('#log').textContent.includes('after 6s') }
};
</script></body></html>`;
const run = async (viewport, tag) => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport });
  await page.setContent(html, { waitUntil: 'load' });
  const errs = [];
  page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERR '+e.message));
  await page.waitForFunction(() => typeof window.runTest === 'function', null, { timeout: 30000 });
  await page.waitForFunction(() => document.getElementById("v").readyState >= 2, null, { timeout: 90000 });
  await page.evaluate(() => window.runTest());
  await page.waitForFunction(() => window.__result, null, { timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: `LONG_${tag}.png`, fullPage: false });
  const log = await page.evaluate(() => document.getElementById('log').textContent);
  const vv = await page.evaluate(() => ({ duration: document.getElementById('v').duration, w: document.getElementById('v').videoWidth, h: document.getElementById('v').videoHeight, t: document.getElementById('v').currentTime }));
  await browser.close();
  console.log(`\n===== ${tag} ${viewport.width}x${viewport.height} =====`);
  console.log(log);
  console.log('STATUS:', JSON.stringify(vv));
  console.log('CONSOLE ERRORS:', errs.length ? errs.join(' | ') : 'none');
  return { log, vv, errs };
};
await run({ width: 1280, height: 800 }, 'desktop');
await run({ width: 390, height: 844 }, 'mobile');
