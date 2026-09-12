import { chromium } from 'playwright';
const BASE='https://njsoft-stream.njcreative123.workers.dev/';
const CHROME='/data/user/0/gptos.intelligence.assistant/files/rootfs/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome';
const b=await chromium.launch({executablePath:CHROME,args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(e.message.slice(0,120)));
p.on('console',m=>{ if(m.type()==='error') errs.push('C:'+m.text().slice(0,120)); });
await p.goto(BASE,{waitUntil:'domcontentloaded',timeout:60000}).catch(e=>errs.push('NAV:'+e.message.slice(0,80)));
await p.waitForTimeout(9000);
// 1. Home rooms strip
const rooms=await p.locator('.room-card').count();
const roomTexts=await p.locator('.room-card h3').allTextContents().catch(()=>[]);
console.log('HOME room cards:', rooms, '|', roomTexts.join(', '));
await p.screenshot({path:'/root/johnny.heliohost./final2_home_rooms.png'});
// 2. Deep link #tv
await p.goto(BASE+'#tv',{waitUntil:'domcontentloaded',timeout:60000}).catch(()=>{});
await p.waitForTimeout(8000);
const tvActive=await p.locator('#pg-tv.active').count();
const tvChips=await p.locator('#tvFilters .chip').count();
const tvCards=await p.locator('.tv-card').count();
console.log('DEEPLINK #tv active:',tvActive,'| chips:',tvChips,'| cards:',tvCards);
await p.screenshot({path:'/root/johnny.heliohost./final2_tv_deeplink.png'});
// 3. Deep link #books + reader button
await p.goto(BASE+'#books',{waitUntil:'domcontentloaded',timeout:60000}).catch(()=>{});
await p.waitForTimeout(9000);
const booksActive=await p.locator('#pg-books.active').count();
const readBtns=await p.locator('[data-read]').count();
console.log('DEEPLINK #books active:',booksActive,'| read buttons:',readBtns);
await p.screenshot({path:'/root/johnny.heliohost./final2_books_deeplink.png'});
// 4. Open reader
if(readBtns>0){
  await p.locator('[data-read]').first().click();
  await p.waitForTimeout(6000);
  const modal=await p.locator('#bookModal').count();
  const visible=await p.locator('#bookModal').isVisible().catch(()=>false);
  const paras=await p.locator('.reader-para').count();
  console.log('READER modal:',modal,'| visible:',visible,'| paras:',paras);
  await p.screenshot({path:'/root/johnny.heliohost./final2_reader.png'});
}
// 5. AI room entry + typing input
await p.goto(BASE+'#ai',{waitUntil:'domcontentloaded',timeout:60000}).catch(()=>{});
await p.waitForTimeout(7000);
const aiActive=await p.locator('#pg-ai.active').count();
const chatInput=await p.locator('#chatIn').count();
console.log('DEEPLINK #ai active:',aiActive,'| chat input:',chatInput);
if(chatInput){ await p.locator('#chatIn').fill('hello'); await p.waitForTimeout(300); }
const filled=await p.locator('#chatIn').inputValue().catch(()=>'');
console.log('AI input fill test:', JSON.stringify(filled));
await p.screenshot({path:'/root/johnny.heliohost./final2_ai.png'});
// 6. NJ room tool
await p.goto(BASE+'#nj',{waitUntil:'domcontentloaded',timeout:60000}).catch(()=>{});
await p.waitForTimeout(7000);
const njTools=await p.locator('[data-njtool]').count();
console.log('DEEPLINK #nj tools:',njTools);
await p.screenshot({path:'/root/johnny.heliohost./final2_nj.png'});
console.log('ERRORS:', JSON.stringify([...new Set(errs)].slice(0,10)));
await b.close();
