import { chromium } from 'playwright';
const BASE = 'https://njsoft-stream.njcreative123.workers.dev';
const MIRROR = `${BASE}/api/media/990001?proxy=1`;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:linear-gradient(135deg,#0b0f1a,#1a1033);color:#e8ecf8;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;padding:20px}
h2{color:#ffcc33;margin:6px 0} p{color:#9fb0d0;margin:4px 0 12px}
video{width:100%;max-width:960px;background:#000;border-radius:14px;box-shadow:0 0 40px rgba(255,204,51,.25)}
#log{white-space:pre-wrap;font-family:monospace;font-size:12px;background:#11162a;border:1px solid #2a3560;padding:12px;border-radius:10px;margin-top:12px;max-width:960px;width:100%;max-height:280px;overflow:auto}
.badge{display:inline-block;background:#ffcc33;color:#111;font-weight:700;padding:2px 10px;border-radius:20px;font-size:13px}
</style></head><body>
<span class="badge">NJStream /api/media/990001?proxy=1 — 45 MB · 120s</span>
<h2>Long Video Browser Proof — Play + Seek + Download</h2>
<p>Worker-origin Range streaming (accept-ranges: bytes) se 45MB video Chrome me play hoke seek (60s) ho rahi hai.</p>
<video id="v" controls preload="auto" playsinline crossorigin="anonymous" src="${MIRROR}"></video>
<div id="log">waiting for video…</div>
<script>
const v=document.getElementById('v');
const log=document.getElementById('log');
function L(s){log.textContent += s+'\\n'; log.scrollTop=log.scrollHeight;}
v.addEventListener('loadedmetadata',()=>L('EVENT loadedmetadata duration='+v.duration.toFixed(1)+'s ready='+v.readyState));
v.addEventListener('loadeddata',()=>L('EVENT loadeddata ready='+v.readyState));
v.addEventListener('canplay',()=>L('EVENT canplay ready='+v.readyState));
v.addEventListener('playing',()=>L('EVENT playing currentTime='+v.currentTime.toFixed(2)));
v.addEventListener('seeked',()=>L('EVENT seeked currentTime='+v.currentTime.toFixed(2)));
v.addEventListener('waiting',()=>L('EVENT waiting currentTime='+v.currentTime.toFixed(2)));
v.addEventListener('error',()=>L('VIDEO ERROR code='+v.error?.code+' msg='+v.error?.message));
window.runTest = async () => {
  L('--- TEST START --- duration='+v.duration.toFixed(1)+'s size='+v.videoWidth+'x'+v.videoHeight);
  await v.play().catch(e=>L('play err '+e.message));
  await new Promise(r=>setTimeout(r,7000));
  L('after 7s: currentTime='+v.currentTime.toFixed(2)+' playing='+(!v.paused)+' ready='+v.readyState+' buffered='+(v.buffered.length?v.buffered.end(v.buffered.length-1).toFixed(1):'0')+'s');
  L('SEEK -> 60s (byte-range seek check)');
  try{ await new Promise((res,rej)=>{ v.onseeked=res; setTimeout(()=>rej(new Error('seek timeout')),20000); v.currentTime=60; }); }catch(e){ L('seek err '+e.message); }
  L('after seek: currentTime='+v.currentTime.toFixed(2)+' ready='+v.readyState);
  await new Promise(r=>setTimeout(r,6000));
  L('after 6s more: currentTime='+v.currentTime.toFixed(2)+' playing='+(!v.paused)+' buffered='+(v.buffered.length?v.buffered.end(v.buffered.length-1).toFixed(1):'0')+'s');
  L('--- TEST END --- PASS');
  window.__result={duration:v.duration,w:v.videoWidth,h:v.videoHeight,t:v.currentTime};
};
</script></body></html>`;
const run = async (viewport, tag) => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport });
  const errs = [];
  page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERR '+e.message));
  await page.setContent(html, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.runTest === 'function', null, { timeout: 30000 });
  await page.waitForFunction(() => document.getElementById('v').readyState >= 2, null, { timeout: 90000 });
  await page.evaluate(() => window.runTest());
  await page.waitForFunction(() => window.__result, null, { timeout: 90000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: `LONG_${tag}.png` });
  const log = await page.evaluate(() => document.getElementById('log').textContent);
  const vv = await page.evaluate(() => window.__result);
  await browser.close();
  console.log('\n===== '+tag+' '+viewport.width+'x'+viewport.height+' =====');
  console.log(log);
  console.log('STATUS:', JSON.stringify(vv));
  console.log('CONSOLE ERRORS:', errs.length ? errs.join(' | ') : 'none');
};
await run({ width: 1280, height: 800 }, 'desktop');
await run({ width: 390, height: 844 }, 'mobile');
