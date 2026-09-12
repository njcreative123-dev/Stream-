import { chromium } from 'playwright';
const BASE='https://njsoft-stream.njcreative123.workers.dev/';
const CHROME='/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const b=await chromium.launch({executablePath:CHROME,args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1366,height:850}});
const errs=[]; const allErrs=[];
p.on('console',m=>{ if(m.type()==='error'){ errs.push(m.text().slice(0,140)); allErrs.push('C '+m.text().slice(0,140)); } });
p.on('pageerror',e=>{ errs.push('PE '+e.message.slice(0,140)); allErrs.push('PE '+e.message.slice(0,140)); });
p.on('requestfailed',r=>{ allErrs.push('RF '+r.url().slice(0,120)); });
await p.goto(BASE,{waitUntil:'domcontentloaded',timeout:40000});
await p.waitForTimeout(4000);
const navTo=async (pg)=>{ await p.evaluate((page)=>{ const b=document.querySelector('[data-nav="'+page+'"]'); if(b){b.click();return true;} return false; },pg); await p.waitForTimeout(2500); };
const results={};
// HOME
results.home=await p.evaluate(()=>({active:document.getElementById('pg-home')?.classList.contains('active'),hero:!!document.querySelector('.hero'),trending:document.querySelectorAll('.hs-card').length,explore:document.querySelectorAll('.explore-card').length,loaderVisible:!!document.querySelector('#loader:not([style*="display: none"])')}));
// NJ ROOM
await navTo('nj');
results.nj=await p.evaluate(()=>({active:document.getElementById('pg-nj')?.classList.contains('active'),status:(document.getElementById('njStatus')?.innerText||'').slice(0,120),tools:document.querySelectorAll('#njTools .tool-btn, #njTools button').length}));
await p.evaluate(()=>{ const t=document.getElementById('njNote'); if(t) t.value='NJ Room browser-write test ✅'; document.querySelector('[data-njsave]')?.click(); });
await p.waitForTimeout(1500);
results.njNote=await p.evaluate(()=>document.getElementById('njNoteStatus')?.textContent||'');
// TV ROOM
await navTo('tv');
results.tv=await p.evaluate(()=>({total:(document.getElementById('tvTotal')?.textContent||''),working:(document.getElementById('tvWorking')?.textContent||''),healthBtn:!!document.querySelector('[data-health]'),hindiBtn:!!document.querySelector('[data-hindi-first]'),chips:document.querySelectorAll('#tvFilters .chip').length,cards:document.querySelectorAll('.tv-card').length}));
// SATHI (TG)
await navTo('tg');
results.tg=await p.evaluate(()=>({msgCount:document.querySelectorAll('.tg-msg').length,movieCards:document.querySelectorAll('.movie-card').length,smallVideos:document.querySelectorAll('.tg-msg-video').length,sitePlay:document.querySelectorAll('.nj-site-play').length,siteReady:document.querySelectorAll('.site-stream.ready').length,noteBar:!!document.querySelector('.room-notes[data-room=sathi]')}));
// FILMY (movies)
await navTo('movies');
results.movies=await p.evaluate(()=>({cards:document.querySelectorAll('.media-card, .mv-card, .movie-card').length,noteBar:!!document.querySelector('.room-notes[data-room=filmy]')}));
// KITABI (books)
await navTo('books');
results.books=await p.evaluate(()=>({readBtns:document.querySelectorAll('[data-read]').length,noteBar:!!document.querySelector('.room-notes[data-room=kitabi]'),cards:document.querySelectorAll('.book-card, .media-card').length}));
// open reader
const opened=await p.evaluate(()=>{ const b=document.querySelector('[data-read]'); if(!b) return false; b.click(); return true; });
await p.waitForTimeout(7000);
results.reader=await p.evaluate((opened)=>({opened,modalClass:document.getElementById('bookModal')?.className||'none',paras:document.querySelectorAll('.reader-para').length,title:(document.getElementById('readerTitle')?.textContent||'').slice(0,60),dl:(document.getElementById('readerDownload')?.getAttribute('href')||'').slice(0,80)}), opened);
await p.evaluate(()=>{ document.querySelector('[data-close-reader]')?.click(); }); await p.waitForTimeout(600);
// KHOJO (search)
await navTo('search');
results.search=await p.evaluate(()=>({noteBar:!!document.querySelector('.room-notes[data-room=khojo]'),input:!!document.getElementById('searchInput'),trending:document.querySelectorAll('#searchResults .sr-card').length}));
// AI CHAT
await navTo('ai');
results.ai=await p.evaluate(()=>({agentStrip:document.querySelectorAll('#agentStrip .agent-chip, #agentStrip div').length,chatInput:!!document.getElementById('chatIn'),quickAsks:document.querySelectorAll('[data-ask]').length}));
await p.evaluate(()=>{ const i=document.getElementById('chatIn'); if(i){i.value='Status batao';} document.querySelector('[data-send]')?.click(); });
await p.waitForTimeout(12000);
results.aiReply=await p.evaluate(()=>document.getElementById('chatMsgs')?.innerText.slice(-220)||'');
console.log(JSON.stringify(results,null,1));
console.log('PAGEERRORS:',JSON.stringify(errs.slice(0,8)));
await p.screenshot({path:'/root/johnny.heliohost./proof_rooms_audit.png',fullPage:false});
await b.close();
