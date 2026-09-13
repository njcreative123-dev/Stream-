#!/usr/bin/env node
// NJStream gofile streaming uploader (low-memory, multipart streaming)
// Usage: node gofile_upload.mjs <file> [--name=...] [--token=...] [--server=...]
import { createReadStream, statSync } from 'fs';
import { basename } from 'path';

const args = process.argv.slice(2);
const opt = {};
const files = [];
for (const a of args) {
  if (a.startsWith('--name=')) opt.name = a.slice(7);
  else if (a.startsWith('--token=')) opt.token = a.slice(8);
  else if (a.startsWith('--server=')) opt.server = a.slice(9);
  else files.push(a);
}
if (files.length !== 1) { console.error('usage: node gofile_upload.mjs <file> [--name=...]'); process.exit(1); }
const file = files[0];
const size = statSync(file).size;
const name = opt.name || basename(file);
const token = opt.token || 'YZrvuMZzSY8j7yKzYzCQbcaDwYagNtps';
const server = opt.server || 'store5';
const mime = /\.(mp4|webm)$/i.test(name) ? 'video/mp4' : 'application/octet-stream';

const boundary = '----NJStream' + Date.now() + Math.floor(Math.random() * 1e6);
const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${name}"\r\nContent-Type: ${mime}\r\n\r\n`);
const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
const total = head.length + size + tail.length;

let sent = 0;
const stream = new ReadableStream({
  async start(controller) {
    controller.enqueue(head);
    const src = createReadStream(file, { highWaterMark: 1024 * 1024 });
    for await (const chunk of src) { sent += chunk.length; controller.enqueue(chunk); }
    controller.enqueue(tail);
    controller.close();
  },
  cancel() {}
});
const url = `https://${server}.gofile.io/contents/uploadfile`;
console.log(`Uploading ${name} (${(size/1048576).toFixed(1)} MB) -> ${url}`);
const t0 = Date.now();
const resp = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': String(total),
    'User-Agent': 'NJStream-Mirror',
  },
  body: stream,
  duplex: 'half',
});
const txt = await resp.text();
console.log('HTTP', resp.status);
try { console.log(txt.slice(0, 1200)); } catch {}
console.log(`elapsed ${((Date.now() - t0) / 1000).toFixed(1)}s`);
