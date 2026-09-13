#!/usr/bin/env node
// Register a multi-part movie on the site (must run after all parts uploaded).
import { statSync, readdirSync } from 'fs';
import { join } from 'path';
const id = process.argv[2];
const title = process.env.PART_TITLE || ('Media ' + id);
const REPO = 'njcreative123-dev/Stream-';
const TAG = 'njstream-media';
const WORKER = 'https://njsoft-stream.njcreative123.workers.dev';
const INGEST = '275bebaf8ea67e964cc897e3edb74f4a';
const safeTitle = title.replace(/[^\w. -]/g, '').trim();
const dir = join(process.cwd(), 'mirror_cache', 'parts_' + id);
const parts = readdirSync(dir).filter(f => /^part_\d+\.mp4$/.test(f)).sort();
const meta = parts.map((f, i) => {
  const assetName = `${id}-${safeTitle}-Part${String(i + 1).padStart(2, '0')}.mp4`;
  return { id: `${id}.p${i + 1}`, name: `${safeTitle} - Part ${i + 1}/${parts.length}`, url: `https://github.com/${REPO}/releases/download/${TAG}/${encodeURIComponent(assetName)}`, size: statSync(join(dir, f)).size };
});
const payload = { id, url: meta[0].url, name: safeTitle, mime: 'video/mp4', size: meta.reduce((a, b) => a + b.size, 0), source: 'github', parts: meta, totalParts: meta.length };
const r = await fetch(`${WORKER}/api/media/register`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-ingest-key': INGEST }, body: JSON.stringify(payload) });
console.log('register:', r.status, await r.text());
const probe = await (await fetch(`${WORKER}/api/media/${id}?probe=1`)).json();
console.log('probe:', JSON.stringify(probe).slice(0, 500));
