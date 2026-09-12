import { chromium } from 'playwright';
const CHROME='/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const BASE='https://njsoft-stream.njcreative123.workers.dev/';
const b=await chromium.launch({executablePath:CHROME,args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1280,height:900}});
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120))}); p.on('pageerror',e=>errs.push('PE '+e.message.slice(0,120)));
await p.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
await p.waitForTimeout(3500);
const navTo=async (pg)=>p.evaluate((page)=>{ const b=document.querySelector('[data-nav="'+page+'"]'); if(b){b.click();return true;} return false; },pg);
// 1) NJ room
await navTo('nj'); await p.waitForTimeout(4500);
let nj=await p.evaluate(()=>({active:document.getElementById('pg-nj')?.classList.contains('active'),status:document.getElementById('njStatus')?.innerText.slice(0,150)||'',tools:document.querySelectorAll('#njTools button').length}));
console.log('NJ room:',JSON.stringify(nj));
await p.evaluate(()=>{ const t=document.getElementById('njNote'); if(t) t.value='NJ room test note via browser'; document.querySelector('[data-njsave]').click(); });
await p.waitForTimeout(1200);
console.log('NJ note status:', await p.evaluate(()=>document.getElementById('njNoteStatus')?.textContent||''));
// 2) TV
await navTo('tv'); await p.waitForTimeout(4000);
console.log('TV room:',JSON.stringify(await p.evaluate(()=>({health:!!document.querySelector('[data-health]'),hindi:!!document.querySelector('[data-hindi-first]'),chips:document.querySelectorAll('#tvFilters .chip').length,cards:document.querySelectorAll('.tv-card').length}))));
// 3) Books + read buttons
await navTo('books'); await p.waitForTimeout(5000);
console.log('Books room:',JSON.stringify(await p.evaluate(()=>({readBtns:document.querySelectorAll('[data-read]').length,noteBar:!!document.querySelector('.room-notes[data-room=kitabi]')}))));
// 4) open first reader
const opened=await p.evaluate(()=>{ const b=document.querySelector('[data-read]'); if(!b) return false; b.click(); return true; });
await p.waitForTimeout(6000);
console.log('Reader opened:',opened,'modal:',JSON.stringify(await p.evaluate(()=>({visible:!document.getElementById('bookModal')?.classList.contains('hide'),paras:document.querySelectorAll('.reader-para').length,title:document.getElementById('readerTitle')?.textContent||''}))));
console.log('PAGE ERRORS:',errs.length?errs.slice(0,5):'0');
await p.screenshot({path:'/root/johnny.heliohost./proof_reader.png'});
await b.close();
