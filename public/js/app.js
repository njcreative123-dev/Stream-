(function(){
'use strict';
const BOT_TOKEN='1389903628:AAFapVJGN4EUoGul9gvWrSkT_qM71rwZ_2k';
const CHAT_ID='-1002514429549';
const WORKER_URL='';
let tgData=[];
let startTime=Date.now();

// Loader
window.addEventListener('load',function(){
setTimeout(function(){
document.getElementById('loader').classList.add('hid');
document.getElementById('app').classList.add('vis');
startUptime();
},2500);
});

// Navigation
window.go=function(p){
document.querySelectorAll('.pg').forEach(function(e){e.classList.remove('on')});
document.querySelectorAll('.nb').forEach(function(e){e.classList.remove('on')});
var pg=document.getElementById('p-'+p);
if(pg)pg.classList.add('on');
var btn=document.querySelector('[data-p="'+p+'"]');
if(btn)btn.classList.add('on');
};

// Uptime
function startUptime(){
setInterval(function(){
var d=Date.now()-startTime;
var m=Math.floor(d/60000);
var h=Math.floor(m/60);
if(h>0)document.getElementById('sUp').textContent=h+'h'+(m%60)+'m';
else document.getElementById('sUp').textContent=m+'m';
},10000);
}

// AI Chat
function aiRoute(msg){
var l=msg.toLowerCase();
if(l.match(/search|dhundh|find|khoj|movie|film|download/)){
return{worker:'search',icon:'🔍',response:'Search Worker activated! 🔍\n\nMain Telegram group data me search kar raha hoon...\n\nAgar tumne Telegram data upload kiya hai toh wahan se results milenge. Nahi kiya toh pehle Telegram page par jaake JSON upload karo.'};
}
if(l.match(/analyz|samjh|samajh|data|trend/)){
return{worker:'analyze',icon:'📊',response:'Analyze Worker activated! 📊\n\nData analysis mode ON.\n\nMain patterns dhundh raha hoon messages me. Content type, frequency, aur trends ka analysis karunga.'};
}
if(l.match(/summary|tl;dr|short|chhota|recap/)){
return{worker:'📝',icon:'Summary',response:'Summarize Worker activated! 📝\n\nShort me samjhata hoon!\n\nTelegram group me movies aur books ka collection hai. Upload karo JSON data aur main beautifully summarize karunga.'};
}
if(l.match(/live\s*tv|tv|stream|channel/)){
return{worker:'tv',icon:'📺',response:'Live TV Worker activated! 📺\n\nStream pages ready hain. Categories available:\n• Hindi Movies 🎬\n• Hindi Dubbed 🎥\n• Web Series 📺\n• Music TV 🎵\n• News 📰\n• Sports ⚽\n\nAbhi sirf UI ready hai, live streams add honge soon!'};
}
if(l.match(/telegram|tg|group|message|chat/)){
return{worker:'tg',icon:'📱',response:'Telegram Worker activated! 📱\n\nGroup: @hindidubbedfilmmovie\nMembers: Active\n\nData browse karne ke liye Telegram page par jao aur JSON file upload karo. Uske baad movies aur books search kar sakte ho!'};
}
if(l.match(/status|kya haal|how|kaisa/)){
return{worker:'status',icon:'⚙️',response:'Status Report ⚙️\n\n✅ Main AI: Online\n✅ Search Worker: Online\n✅ Analyze Worker: Online\n✅ Summarize Worker: Online\n✅ Live TV Worker: Online\n✅ Telegram Worker: Online\n\nAll 6 workers operational! 🔥'};
}
if(l.match(/nam|kaun|who|name|tumhara/)){
return{worker:'main',icon:'⚡',response:'Hey! Main JDUB AI hoon! ⚡\n\nMujhe 6 Worker AIs milke kaam karte hain:\n🔍 Search — Content dhundhta hai\n📊 Analyze — Data samajhta hai\n📝 Summarize — Short me batata hai\n📺 Live TV — Streams handle karta hai\n📱 Telegram — Group data manage karta hai\n\nKuch bhi pooch sakte ho!'};
}
return{worker:'main',icon:'⚡',response:'Got it! 🤔\n\nMain abhi samajh raha hoon...\n\nTum yeh try kar sakte ho:\n🔍 "Search karo movie name"\n📊 "Analyze karo data"\n📝 "Summary banao"\n📺 "Live TV dikhao"\n📱 "Telegram data"\n⚙️ "Status batao"'};
}

function addMsg(container,text,isUser,workerName,workerIcon){
var d=document.createElement('div');
d.className='cm '+(isUser?'user':'ai');
var label=isUser?'👤 YOU':workerIcon+' '+workerName+' AI';
d.innerHTML='<span class="cb">'+label+'</span><p>'+text.replace(/\n/g,'<br>')+'</p>';
container.appendChild(d);
container.scrollTop=container.scrollHeight;
}

window.chat=function(msg){
if(!msg||!msg.trim())return;
var input=document.getElementById('cIn');
if(input)input.value='';
var container=document.getElementById('cMsgs');
addMsg(container,msg,true);
var result=aiRoute(msg);
setTimeout(function(){
addMsg(container,result.response,false,result.worker.toUpperCase(),result.icon);
var total=parseInt(document.getElementById('sMsg').textContent||'0')+1;
document.getElementById('sMsg').textContent=total;
},500);
};

window.qSend=function(){
var input=document.getElementById('qIn');
var msg=input.value.trim();
if(!msg)return;
input.value='';
var container=document.getElementById('qChat');
addMsg(container,msg,true);
var result=aiRoute(msg);
setTimeout(function(){
addMsg(container,result.response,false,result.worker.toUpperCase(),result.icon);
},400);
};

// Telegram
window.tgSearch=function(){
var q=document.getElementById('tgQ').value.toLowerCase();
if(!tgData.length)return;
var filtered=tgData.filter(function(m){
return(m.text||'').toLowerCase().includes(q)||(m.file_name||'').toLowerCase().includes(q);
});
renderTg(filtered);
};

window.tgF=function(type,btn){
document.querySelectorAll('.tg-bar .tb').forEach(function(b){b.classList.remove('on')});
btn.classList.add('on');
if(!tgData.length)return;
if(type==='all')renderTg(tgData);
else if(type==='photo')renderTg(tgData.filter(function(m){return m.photo}));
else if(type==='video')renderTg(tgData.filter(function(m){return m.video}));
else if(type==='doc')renderTg(tgData.filter(function(m){return m.document}));
};

window.tgUp=function(files){
if(!files.length)return;
var file=files[0];
var reader=new FileReader();
reader.onload=function(e){
try{
tgData=JSON.parse(e.target.result);
if(!Array.isArray(tgData))tgData=tgData.messages||[];
document.getElementById('sMed').textContent=tgData.length;
renderTg(tgData);
}catch(err){
alert('JSON parse error: '+err.message);
}
};
reader.readAsText(file);
};

function renderTg(msgs){
var c=document.getElementById('tgC');
if(!msgs||!msgs.length){
c.innerHTML='<div class="empty"><h2>🔍</h2><h3>Koi results nahi</h3><p>Try different search</p></div>';
return;
}
var html='<div class="tg-list">';
msgs.slice(0,50).forEach(function(m){
var icon='💬';
var type='text';
if(m.photo){icon='🖼️';type='photo';}
else if(m.video){icon='🎬';type='video';}
else if(m.document){icon='📄';type='document';}
var text=m.text||m.message||'[No text]';
if(text.length>150)text=text.substring(0,150)+'...';
var meta='';
if(m.date)meta=m.date;
if(m.file_name)meta+=' | '+m.file_name;
html+='<div class="tg-item"><div class="tg-ico">'+icon+'</div><div class="tg-info"><h4>'+type.toUpperCase()+'</h4><p>'+text+'</p><div class="tg-meta">'+meta+'</div></div></div>';
});
html+='</div>';
c.innerHTML=html;
}

// Drag and drop for Telegram upload
document.addEventListener('DOMContentLoaded',function(){
var up=document.querySelector('.up');
if(up){
up.addEventListener('dragover',function(e){e.preventDefault();up.style.borderColor='var(--accent)';});
up.addEventListener('dragleave',function(){up.style.borderColor='';});
up.addEventListener('drop',function(e){
e.preventDefault();
up.style.borderColor='';
if(e.dataTransfer.files.length)tgUp(e.dataTransfer.files);
});
}
});
})();
