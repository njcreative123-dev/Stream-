import { chromium } from 'playwright';
const CHROME='/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1234/chrome-linux/chrome';
const BASE='https://njsoft-stream.njcreative123.workers.dev/';
const b=await chromium.launch({executablePath:CHROME,args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1280,height:900}});
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120))}); p.on('pageerror',e=>errs.push('PE '+e.message.slice(0,120)));
await p.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
await p.waitForTimeout(2500);
// 1) NJ room
await p.evaluate(()=>{ if(window.go) go('nj'); else document.querySelector('[data-nav=nj]').click(); });
await p.waitForTimeout(4000);
const nj=await p.evaluate(()=>({status:document.getElementById('njStatus')?.innerText.slice(0,120)||'',tools:document.querySelectorAll('#njTools button').length,note:!!document.getElementById('njNote')}));
console.log('NJ room:',JSON.stringify(nj));
// 2) Save NJ note
await p.fill('#njNote','NJ room test note via browser')
await p.click('[data-njsave]');
await p.waitForTimeout(1200);
const noteSt=await p.evaluate(()=>document.getElementById('njNoteStatus')?.textContent);
console.log('NJ note save:',noteSt);
// 3) TV room health button + hindi
await p.evaluate(()=>{ if(window.go) go('tv'); });
await p.waitForTimeout(3500);
const tv=await p.evaluate(()=>({health:!!document.querySelector('[data-health]'),hindiFirst:!!document.querySelector('[data-hindi-first]'),chips:document.querySelectorAll('#tvFilters .chip').length,cards:document.querySelectorAll('.tv-card').length}));
console.log('TV room:',JSON.stringify(tv));
// 4) Books room read button
await p.evaluate(()=>{ if(window.go) go('books'); });
await p.waitForTimeout(4500);
const bk=await p.evaluate(()=>({readBtns:document.querySelectorAll('[data-read]').length,noteBar:!!document.querySelector('.room-notes[data-room=kitabi]')}));
console.log('Books room:',JSON.stringify(bk));
// 5) Notes save on kitabi room
const noteBar=await p.$('.room-notes[data-room=kitabi] [data-note-in]');
if(noteBar){ await noteBar.fill('Kitabi note test'); await p.click('.room-notes[data-room=kitabi] [data-note-save]'); await p.waitForTimeout(1200); }
const noteSt2=await p.evaluate(()=>document.querySelector('.room-notes[data-room=kitabi] [data-note-status]')?.textContent);
console.log('Kitabi note save:',noteSt2);
console.log('PAGE ERRORS:',errs.length?errs.slice(0,5):'0');
await p.screenshot({path:'/root/johnny.heliohost./proof_rooms.png',fullPage:false});
await b.close();
