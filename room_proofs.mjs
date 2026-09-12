import { chromium } from 'playwright';
const CHROME='/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const BASE='https://njsoft-stream.njcreative123.workers.dev/';
const b=await chromium.launch({executablePath:CHROME,args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:1366,height:850}});
const errs=[];
p.on('console',m=>{ if(m.type()==='error') errs.push('C '+m.text().slice(0,120)); });
p.on('pageerror',e=>errs.push('PE '+e.message.slice(0,120)));
await p.goto(BASE,{waitUntil:'domcontentloaded',timeout:40000});
await p.waitForTimeout(6000);
const navTo=async (pg,w)=>{ await p.evaluate((page)=>{ document.querySelector('[data-nav="'+page+'"]')?.click(); },pg); await p.waitForTimeout(w||3500); };
const out={};
// HOME
out.home=await p.evaluate(()=>({active:document.getElementById('pg-home')?.classList.contains('active'),tickers:document.querySelectorAll('#homeTicker .ticker-item').length,trending:document.querySelectorAll('#homeChannels .ch-row-card').length,tgPreview:document.querySelectorAll('#homeTG .tg-preview-card').length,explore:document.querySelectorAll('.explore-card').length,stTV:document.getElementById('stTV')?.textContent,stTG:document.getElementById('stTG')?.textContent}));
await p.screenshot({path:'/root/johnny.heliohost./proof_r_home.png'});
// NJ ROOM
await navTo('nj',4000);
out.nj=await p.evaluate(()=>({status:(document.getElementById('njStatus')?.innerText||'').slice(0,160),tools:document.querySelectorAll('#njTools button').length,toolList:[...document.querySelectorAll('#njTools button')].slice(0,10).map(x=>x.textContent)}));
// run a room tool: channel health
await p.evaluate(()=>{ const btns=[...document.querySelectorAll('#njTools button')]; const b=btns.find(x=>/status.info/i.test(x.textContent)); if(b) b.click(); });
await p.waitForTimeout(7000);
out.njTool=await p.evaluate(()=>(document.getElementById('njToolOut')?.innerText||'').slice(0,240));
await p.screenshot({path:'/root/johnny.heliohost./proof_r_njroom.png'});
// TV ROOM
await navTo('tv',5000);
out.tv=await p.evaluate(()=>({total:document.getElementById('tvTotal')?.textContent,working:document.getElementById('tvWorking')?.textContent,health:!!document.querySelector('[data-health]'),hindiFirst:!!document.querySelector('[data-hindi-first]'),chips:[...document.querySelectorAll('#tvFilters .chip')].map(c=>c.textContent.trim()).slice(0,13),cards:document.querySelectorAll('#tvGrid .tv-card').length}));
await p.screenshot({path:'/root/johnny.heliohost./proof_r_tv.png'});
// SATHI ROOM
await navTo('tg',5000);
out.tg=await p.evaluate(()=>({stats:(document.getElementById('tgStats')?.innerText||'').slice(0,80),msgs:document.querySelectorAll('#tgMessages .tg-msg').length,movieCards:document.querySelectorAll('#tgMessages .movie-card').length,sitePlay:document.querySelectorAll('#tgMessages .nj-site-play').length,siteReady:document.querySelectorAll('#tgMessages .site-stream.ready').length,noteBar:!!document.querySelector('.room-notes[data-room=sathi]')}));
await p.screenshot({path:'/root/johnny.heliohost./proof_r_tg.png'});
// FILMY ROOM
await navTo('movies',4500);
out.movies=await p.evaluate(()=>({cards:document.querySelectorAll('.media-card').length,noteBar:!!document.querySelector('.room-notes[data-room=filmy]')}));
// KITABI ROOM
await navTo('books',9000);
out.books=await p.evaluate(()=>({cards:document.querySelectorAll('#booksGrid .media-card').length,readBtns:document.querySelectorAll('#booksGrid [data-read]').length,noteBar:!!document.querySelector('.room-notes[data-room=kitabi]')}));
await p.screenshot({path:'/root/johnny.heliohost./proof_r_books.png'});
// OPEN READER
const opened=await p.evaluate(()=>{ const bt=document.querySelector('#booksGrid [data-read]'); if(!bt) return 'NOBTN'; const t=bt.getAttribute('data-title'); bt.click(); return t||'clicked'; });
await p.waitForTimeout(12000);
out.reader=await p.evaluate((opened)=>({opened,modalVisible:!document.getElementById('bookModal')?.classList.contains('hide'),paraCount:document.querySelectorAll('#readerContent .reader-para').length,title:(document.getElementById('readerTitle')?.textContent||'').slice(0,60),dl:(document.getElementById('readerDownload')?.getAttribute('href')||'').slice(0,90),noteBtn:!!document.querySelector('[data-reader-note]')}), opened);
await p.screenshot({path:'/root/johnny.heliohost./proof_r_reader.png'});

// ROOM TOOL BUTTONS (sathi, filmy, kitabi, khojo)
await navTo('tg',4000);
out.tgTools=await p.evaluate(()=>{ const b=document.querySelector('#pg-tg [data-roomtool]'); if(!b) return 'NOBTN'; b.click(); return true; });
await p.waitForTimeout(4000);
out.tgToolOut=await p.evaluate(()=>(document.getElementById('sathiToolOut')?.innerText||'').slice(0,120));
await navTo('books',6000);
out.kitabiTools=await p.evaluate(()=>document.querySelectorAll('#pg-books [data-roomtool]').length);
await p.evaluate(()=>{ const b=document.querySelector('#pg-books [data-roomtool]'); if(b) b.click(); });
await p.waitForTimeout(5000);
out.kitabiToolOut=await p.evaluate(()=>(document.getElementById('kitabiToolOut')?.innerText||'').slice(0,120));

// KHOJO ROOM (search)
await navTo('search',5000);
out.search=await p.evaluate(()=>({noteBar:!!document.querySelector('.room-notes[data-room=khojo]'),trending:document.querySelectorAll('#searchResults .sr-card').length}));
// AI ROOM
await navTo('ai',4000);
out.ai=await p.evaluate(()=>({agents:document.querySelectorAll('#agentStrip .agent-chip').length,chatInput:!!document.getElementById('chatIn')}));
console.log(JSON.stringify(out,null,1));
console.log('ERRORS:',errs.length?errs.slice(0,6):'CLEAN');
await b.close();
