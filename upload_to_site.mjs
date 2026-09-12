#!/usr/bin/env node
// NJStream Media Mirror — upload a movie/video to GitHub Releases / R2 and register it on the site.
// Usage:
//   node upload_to_site.mjs <file> --id=<tgMsgId> [--title="Golmaal 480p"] [--remux] [--r2]
// Auto-scan mode:
//   node upload_to_site.mjs --scan
import { createReadStream, statSync } from 'fs';
import { execFileSync } from 'child_process';
import { basename } from 'path';
import { readdirSync } from 'fs';

const WORKER = process.env.NJ_WORKER || 'https://njsoft-stream.njcreative123.workers.dev';
const INGEST = process.env.NJ_INGEST_KEY || '275bebaf8ea67e964cc897e3edb74f4a';
const GH_TOKEN = process.env.GH_TOKEN || '';
const GH_REPO = process.env.GH_REPO || 'njcreative123-dev/Stream-';
const GH_RELEASE = process.env.GH_RELEASE || 'njstream-media';

function usage(){ console.log(`Usage:
  node upload_to_site.mjs <file.mp4|mkv> --id=<telegram_msg_id> [--title="Movie Name"] [--remux] [--r2] [--no-gh]`);
  process.exit(1); }

async function gh(method, path, body, headers = {}){
  const r = await fetch('https://api.github.com' + path, {
    method, headers: { 'Authorization': 'Bearer ' + GH_TOKEN, 'Accept': 'application/vnd.github+json', 'User-Agent': 'NJStream-Mirror', ...headers },
    body: body ? (typeof body === 'string' ? body : body) : undefined,
  });
  const txt = await r.text();
  let j = null; try { j = JSON.parse(txt); } catch (e) {}
  if (!r.ok) throw new Error(`GitHub ${method} ${path} -> ${r.status}: ${txt.slice(0,300)}`);
  return j;
}

async function ensureRelease(){
  try { return await gh('GET', `/repos/${GH_REPO}/releases/tags/${GH_RELEASE}`); }
  catch (e) {
    const rel = await gh('POST', `/repos/${GH_REPO}/releases`, JSON.stringify({ tag_name: GH_RELEASE, name: 'NJStream Media', body: 'Auto-mirrored movies for njsoft-stream' }));
    console.log('Created release', rel.id);
    return rel;
  }
}

async function uploadAsset(releaseId, filePath, assetName){
  const size = statSync(filePath).size;
  console.log(`Uploading ${assetName} (${(size/1024/1024).toFixed(1)} MB) to GitHub release...`);
  const r = await fetch(`https://uploads.github.com/repos/${GH_REPO}/releases/${releaseId}/assets?name=${encodeURIComponent(assetName)}`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + GH_TOKEN, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/octet-stream', 'Content-Length': String(size), 'User-Agent': 'NJStream-Mirror' },
    body: createReadStream(filePath, { highWaterMark: 1024*1024 }),
    duplex: 'half',
  });
  const txt = await r.text();
  let j = null; try { j = JSON.parse(txt); } catch (e) {}
  if (!r.ok) throw new Error(`Upload -> ${r.status}: ${txt.slice(0,300)}`);
  return j;
}

async function registerMedia(id, url, name, mime, size, source){
  const r = await fetch(`${WORKER}/api/media/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-ingest-key': INGEST },
    body: JSON.stringify({ id, url, name, mime, size, source }),
  });
  const j = await r.json();
  console.log('Register:', JSON.stringify(j));
  if (!r.ok) throw new Error('register failed');
}

async function r2Upload(id, filePath, name, mime, size){
  console.log(`Uploading to R2 (movies/${id})...`);
  const r = await fetch(`${WORKER}/api/r2/import?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}&size=${size}`, {
    method: 'POST', headers: { 'Content-Type': mime || 'video/mp4', 'x-ingest-key': INGEST },
    body: createReadStream(filePath, { highWaterMark: 1024*1024 }), duplex: 'half',
  });
  const j = await r.json();
  console.log('R2 import:', JSON.stringify(j));
  if (!r.ok) throw new Error('r2 import failed');
}

async function catboxUpload(filePath, name){
  const size = statSync(filePath).size;
  if (size > 200 * 1024 * 1024) throw new Error('Catbox anonymous limit 200MB — GitHub/R2 use karo');
  console.log(`Uploading ${name} (${(size/1024/1024).toFixed(1)} MB) to catbox...`);
  const fd = new FormData();
  fd.append('reqtype', 'fileupload');
  fd.append('fileToUpload', new Blob([await (await import('fs/promises')).readFile(filePath)]), name);
  const r = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: fd });
  const txt = await r.text();
  if (!r.ok || !/^https:\/\//.test(txt)) throw new Error('catbox upload failed: ' + txt.slice(0, 200));
  return txt.trim();
}

async function main(){
  const args = process.argv.slice(2);
  const opt = {};
  const files = [];
  for (const a of args){
    if (a.startsWith('--id=')) opt.id = a.slice(5);
    else if (a.startsWith('--title=')) opt.title = a.slice(8);
    else if (a === '--remux') opt.remux = true;
    else if (a === '--r2') opt.r2 = true;
    else if (a === '--catbox') opt.catbox = true;
    else if (a.startsWith('--register-only=')) opt.registerOnly = a.slice(15);
    else if (a.startsWith('--mime=')) opt.mime = a.slice(7);
    else if (a === '--no-gh') opt.noGh = true;
    else if (a === '--scan') opt.scan = true;
    else files.push(a);
  }
  if (opt.scan || files.length === 0){
    const dirs = ['/sdcard/Download', '/sdcard/Telegram', '/sdcard/Movies', '.'];
    const found = [];
    for (const d of dirs){
      try {
        for (const f of readdirSync(d)){
          if (/\.(mp4|mkv|avi|webm|mov|m4v)$/i.test(f)) found.push(d + '/' + f);
        }
      } catch (e) {}
    }
    if (found.length === 0){ console.log('Koi video file nahi mili. Koi movie /sdcard/Download me daalo, ya file path pass karo.'); usage(); }
    console.log('Mil gaye:', found.join('\n'));
    process.exit(0);
  }
  if (files.length !== 1 || !opt.id) usage();
  let filePath = files[0];
  const mime = /\.mp4$/i.test(filePath) ? 'video/mp4' : /\.webm$/i.test(filePath) ? 'video/webm' : /\.mkv$/i.test(filePath) ? 'video/x-matroska' : 'video/mp4';
  let finalPath = filePath;
  if (opt.remux && /\.(mkv|avi|mov|m4v)$/i.test(filePath)){
    finalPath = filePath.replace(/\.(mkv|avi|mov|m4v)$/i, '.mp4');
    console.log('Remux ->', finalPath);
    execFileSync('ffmpeg', ['-y', '-i', filePath, '-c', 'copy', '-movflags', '+faststart', finalPath], { stdio: 'inherit' });
    mime = 'video/mp4';
  }
  const size = statSync(finalPath).size;
  const name = opt.title ? (opt.title.replace(/[^\w. -]/g, '').trim() + '.mp4') : basename(finalPath);
  if (opt.r2){
    await r2Upload(opt.id, finalPath, name, mime, size);
  } else if (opt.catbox){
    const url = await catboxUpload(finalPath, `${opt.id}-${name}`);
    await registerMedia(opt.id, url, name, opt.mime || mime, size, 'catbox');
  } else if (!opt.noGh){
    const rel = await ensureRelease();
    const asset = await uploadAsset(rel.id, finalPath, `${opt.id}-${name}`);
    await registerMedia(opt.id, asset.browser_download_url, name, opt.mime || 'video/mp4', size, 'github');
  } else if (opt.registerOnly){
    const url = opt.registerOnly;
    const res = await fetch(`${WORKER}/api/media/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-ingest-key': INGEST },
      body: JSON.stringify({ id: opt.id, url, name: opt.title || 'video', mime: opt.mime || 'video/mp4', size: opt.size || 0, source: 'direct' }),
    });
    console.log('Register direct link:', await res.text());
  }
  const probe = await (await fetch(`${WORKER}/api/media/${opt.id}?probe=1`)).json();
  console.log('Probe:', JSON.stringify(probe));
  if (probe && probe.available) console.log('✅ MIRROR LIVE — Play: ' + WORKER + '/api/media/' + opt.id + '?proxy=1   Download: ' + WORKER + '/api/media/' + opt.id + '?download=1');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
