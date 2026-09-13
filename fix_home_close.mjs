// Patch: close pg-home section before pg-tv
import { readFileSync, writeFileSync } from 'fs';
const f = 'src/workers/index.js';
let s = readFileSync(f, 'utf8');
const needle = `        <div class="tg-preview" id="homeTG"><div class="loading">Loading…</div></div>
      </div>

    <!-- LIVE TV -->
    <section class="page" id="pg-tv">`;
const replacement = `        <div class="tg-preview" id="homeTG"><div class="loading">Loading…</div></div>
      </div>
    </section>

    <!-- LIVE TV -->
    <section class="page" id="pg-tv">`;
if (s.includes(needle)) {
  s = s.replace(needle, replacement);
  writeFileSync(f, s);
  console.log('PATCHED: pg-home now closed before pg-tv');
} else {
  console.log('NEEDLE NOT FOUND — checking exact whitespace');
  const i = s.indexOf('id="pg-tv"');
  console.log('pg-tv index:', i);
  console.log(JSON.stringify(s.slice(i-260, i+20)));
}
