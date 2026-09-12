import { chromium } from 'playwright';
const CHROME='/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const BASE='https://njsoft-stream.njcreative123.workers.dev/';
const b=await chromium.launch({executablePath:CHROME,args:['--no-sandbox']});
async function shot(name, viewport, page, navigate, wait){
  const ctx=await b.newContext({viewport});
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,80)));
  await p.goto(BASE,{waitUntil:'domcontentloaded',timeout:40000}).catch(()=>{});
  await p.waitForTimeout(wait||6000);
  await p.evaluate((nav)=>{ if(nav){ document.querySelector('[data-nav="'+nav+'"]')?.click(); } }, navigate||null).catch(()=>{});
  await p.waitForTimeout((navigate? wait||6000 : 3000));
  await p.screenshot({path:'/root/johnny.heliohost./'+name, fullPage:false});
  await ctx.close();
  return errs;
}
const e1=await shot('final_rooms_home_desktop.png',{width:1440,height:900},'','',9000);
const e2=await shot('final_rooms_home_mobile.png',{width:390,height:844},'','',9000);
const e3=await shot('final_rooms_nj_desktop.png',{width:1440,height:900},'nj','nj',8000);
const e4=await shot('final_rooms_tv_desktop.png',{width:1440,height:900},'tv','tv',7000);
const e5=await shot('final_rooms_tv_mobile.png',{width:390,height:844},'tv','tv',7000);
const e6=await shot('final_rooms_tg_desktop.png',{width:1440,height:900},'tg','tg',7000);
const e7=await shot('final_rooms_books_desktop.png',{width:1440,height:900},'books','books',8000);
const e8=await shot('final_rooms_search_desktop.png',{width:1440,height:900},'search','search',6000);
const e9=await shot('final_rooms_ai_desktop.png',{width:1440,height:900},'ai','ai',6000);
console.log('errors per shot:', JSON.stringify({home:e1,nj:e3,tv:e4,tg:e6,books:e7,search:e8,ai:e9}));
await b.close();
