#!/usr/bin/env node
// NJStream pixeldrain chunked/resumable uploader (low memory)
// Usage: node pixeldrain_upload.mjs <file> [--name=...] [--key=...]
import { createReadStream, statSync } from 'fs';
import { basename } from 'path';

const args = process.argv.slice(2);
const opt = {};
const files = [];
for (const a of args) {
  if (a.startsWith('--name=')) opt.name = a.slice(7);
  else if (a.startsWith('--key=')) opt.key = a.slice(6);
  else files.push(a);
}
if (files.length !== 1) { console.error('usage: node pixeldrain_upload.mjs <file> [--name=...] [--key=...]'); process.exit(1); }
const file = files[0];
const size = statSync(file).size;
const name = opt.name || basename(file);
const auth = opt.key ? { 'Authorization': 'Basic ' + Buffer.from(':' + opt.key).toString('base64') } : {};
const base = 'https://pixeldrain.com/api';
const CHUNK = 8 * 1024 * 1024;

const mime = /\.(mp4)$/i.test(name) ? 'video/mp4' : /\.(webm)$/i.test(name) ? 'video/webm' : 'video/x-matroska';
console.log(`Uploading ${name} (${(size / 1048576).toFixed(1)} MB) to pixeldrain, chunk=${CHUNK / 1048576}MB`);
const src = createReadStream(file, { highWaterMark: CHUNK });

async function req(method, url, headers, body) {
  const r = await fetch(url, { method, headers: { ...auth, ...headers }, body, duplex: 'half' });
  return r;
}
// init resumable upload
let r = await req('PUT', `${base}/file/${encodeURIComponent(name)}?resumable=true`, { 'Content-Length': '0' });
let uploadId = r.headers.get('X-Resource-Id');
console.log('init status', r.status, 'uploadId', uploadId || (await r.text()).slice(0,150));
if (r.status !== 308 || !uploadId) { console.error('init failed'); process.exit(2); }

let offset = 0;
let buf = [];
let buffered = 0;
for await (const chunk of src) {
  buf.push(chunk); buffered += chunk.length;
  if (buffered >= CHUNK) {
    const part = Buffer.concat(buf, buffered);
    buf = []; buffered = 0;
    offset += await putChunk(part, offset, size, uploadId, name);
  }
}
if (buffered > 0) {
  const part = Buffer.concat(buf, buffered);
  offset += await putChunk(part, offset, size, uploadId, name);
}
console.log('finalize...');
const fin = await req('PUT', `${base}/file/${encodeURIComponent(name)}?upload_id=${encodeURIComponent(uploadId)}`, { 'Content-Range': `bytes */${size}` });
console.log('finalize status', fin.status, await fin.text());

async function putChunk(part, start, total, id, fname) {
  const end = start + part.length - 1;
  const rr = await req('PUT', `${base}/file/${encodeURIComponent(fname)}?upload_id=${encodeURIComponent(id)}`, {
    'Content-Range': `bytes ${start}-${end}/${total}`,
    'Content-Type': 'application/octet-stream',
    'Content-Length': String(part.length),
  }, part);
  const pct = ((end + 1) * 100 / total).toFixed(1);
  const extra = rr.status === 308 ? ' (resume)' : rr.status === 201 ? ' (complete)' : '';
  console.log(`chunk ${start / 1048576 | 0}MB -> ${rr.status}${extra} [${pct}%]`);
  if (rr.status >= 400) console.error(await rr.text().catch(() => ''));
  return part.length;
}
