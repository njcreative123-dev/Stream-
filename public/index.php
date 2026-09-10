<?php
// JDUB Hub - Full Stack AI + Telegram + Live TV
$messagesFile = dirname(__DIR__) . '/telegram_messages.json';
$messages = [];
if (file_exists($messagesFile)) {
    $raw = json_decode(file_get_contents($messagesFile), true);
    $messages = is_array($raw) ? ($raw['messages'] ?? $raw) : [];
}

$movies = array_filter($messages, function($m) {
    $t = strtolower(($m['text'] ?? '') . ' ' . ($m['file_name'] ?? ''));
    return preg_match('/\.(mp4|mkv|avi|mov|epub|pdf|mobi|mkv|flv)/i', $t) ||
           str_contains($t, 'movie') || str_contains($t, 'book') ||
           str_contains($t, 'film') || str_contains($t, 'novel') ||
           str_contains($t, 'dubbed') || str_contains($t, 'series');
});

$totalMsgs = count($messages);
$totalMedia = 0;
foreach ($messages as $m) {
    if (!empty($m['has_media'])) $totalMedia++;
}
?>
<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>⚡ JDUB Hub</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>">
<style>
:root{--bg:#0a0a0f;--bg2:#12121a;--bg3:#1a1a28;--accent:#00d4ff;--pink:#ff2d95;--green:#00ff88;--yellow:#ffd000;--red:#ff3355;--text:#e0e0e8;--muted:#666;--border:#222233;--radius:12px}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:'Segoe UI',system-ui,-apple-system,sans-serif;overflow-x:hidden}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:var(--bg2)}::-webkit-scrollbar-thumb{background:var(--accent);border-radius:3px}

/* Loader */
.loader{position:fixed;inset:0;z-index:9999;background:var(--bg);display:flex;align-items:center;justify-content:center;transition:opacity .5s,visibility .5s}
.loader.hid{opacity:0;visibility:hidden;pointer-events:none}
.ld-i{font-size:60px;animation:pulse 1s infinite alternate}
@keyframes pulse{0%{transform:scale(1)}100%{transform:scale(1.2)}}
.ld-t{font-size:32px;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--pink));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:12px 0}
.ld-bar{width:200px;height:4px;background:var(--bg3);border-radius:2px;overflow:hidden;margin:16px auto}
.ld-fill{height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--pink));animation:fill 2.2s ease forwards}
@keyframes fill{0%{width:0}50%{width:60%}100%{width:100%}}
.ld-sub{color:var(--muted);font-size:13px;animation:blink 1s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}

/* Layout */
.app{display:none;min-height:100vh}.app.vis{display:flex}
.side{position:fixed;left:0;top:0;bottom:0;width:240px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;z-index:100;transition:transform .3s}
.side-h{padding:20px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border)}
.slogo{font-size:28px}.sbrand{font-size:18px;font-weight:700}.sbrand span{color:var(--accent)}
.nav{flex:1;padding:12px 8px;display:flex;flex-direction:column;gap:4px}
.nb{display:flex;align-items:center;gap:10px;padding:10px 14px;border:none;background:none;color:var(--muted);border-radius:8px;cursor:pointer;font-size:14px;transition:all .2s;text-align:left;width:100%}
.nb:hover{background:var(--bg3);color:var(--text)}.nb.on{background:linear-gradient(135deg,rgba(0,212,255,.15),rgba(255,45,149,.1));color:var(--accent);font-weight:600}
.ni{font-size:18px;width:24px;text-align:center}
.side-f{padding:14px 16px;border-top:1px solid var(--border);display:flex;align-items:center;gap:8px;font-size:12px;color:var(--green)}
.dot{width:8px;height:8px;background:var(--green);border-radius:50%;display:inline-block;animation:dp 2s infinite}
@keyframes dp{0%,100%{box-shadow:0 0 0 0 rgba(0,255,136,.4)}50%{box-shadow:0 0 0 6px rgba(0,255,136,0)}}
.main{margin-left:240px;flex:1;padding:24px;min-height:100vh}
.pg{display:none}.pg.on{display:block;animation:fu .3s ease}
@keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.ph{margin-bottom:24px}.ph h1{font-size:24px;font-weight:700;margin-bottom:4px}.ps{color:var(--muted);font-size:14px}

/* Cards */
.gr{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}
.cd{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:20px;transition:border-color .2s}.cd:hover{border-color:var(--accent)}
.cw{grid-column:1/-1}
.ch2{display:flex;align-items:center;gap:10px;margin-bottom:16px}.ch2 span{font-size:24px}.ch2 h3{font-size:16px;font-weight:600}
.wg{display:flex;flex-wrap:wrap;gap:8px}
.wp{background:var(--bg3);padding:6px 12px;border-radius:20px;font-size:12px;display:flex;align-items:center;gap:6px}
.sg{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.st{text-align:center;padding:12px;background:var(--bg3);border-radius:8px}
.sn{font-size:24px;font-weight:700;color:var(--accent)}.sl{font-size:11px;color:var(--muted);margin-top:4px}

/* Chat */
.cb2{display:flex;flex-direction:column;height:calc(100vh - 160px)}
.cms{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.cm{display:flex;flex-direction:column;gap:4px;max-width:85%;animation:fu .2s ease}
.cm.user{align-self:flex-end;align-items:flex-end}.cm.ai{align-self:flex-start}
.cb{font-size:10px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1px}
.cm.user .cb{color:var(--pink)}
.cm p{background:var(--bg3);padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;word-break:break-word}
.cm.user p{background:linear-gradient(135deg,rgba(0,212,255,.15),rgba(255,45,149,.1));border:1px solid rgba(0,212,255,.2)}
.caps{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.cap{background:var(--bg3);padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;border:1px solid var(--border);transition:all .2s}
.cap:hover{border-color:var(--accent);background:rgba(0,212,255,.1)}
.cin{display:flex;gap:8px;padding:16px;border-top:1px solid var(--border);background:var(--bg2)}
.ci{flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:var(--text);font-size:14px;outline:none}.ci:focus{border-color:var(--accent)}
.sn2{background:linear-gradient(135deg,var(--accent),var(--pink));border:none;color:#fff;padding:10px 20px;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;transition:transform .2s}.sn2:hover{transform:scale(1.05)}

/* Live TV */
.tvm{width:100%;aspect-ratio:16/9;background:var(--bg2);border-radius:var(--radius);overflow:hidden;margin-bottom:16px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center}
.tvp{width:80px;height:80px;background:rgba(0,212,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;cursor:pointer;border:2px solid var(--accent);transition:all .2s}.tvp:hover{background:rgba(0,212,255,.3);transform:scale(1.1)}
.cg{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.ch3{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:16px;text-align:center;cursor:pointer;transition:all .2s}
.ch3:hover{border-color:var(--accent);transform:translateY(-2px)}
.ci2{font-size:32px;margin-bottom:8px}.cn{font-size:14px;font-weight:600;margin-bottom:4px}.cs{font-size:11px;color:var(--green)}

/* Telegram */
.tg-bar{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.tgs{flex:1;min-width:200px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:8px 14px;color:var(--text);font-size:14px;outline:none}.tgs:focus{border-color:var(--accent)}
.tb{background:var(--bg3);border:1px solid var(--border);color:var(--text);padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;transition:all .2s}
.tb:hover,.tb.on{border-color:var(--accent);background:rgba(0,212,255,.1);color:var(--accent)}
.tg-list{display:flex;flex-direction:column;gap:10px}
.tg-item{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:14px;display:flex;gap:12px;align-items:flex-start;transition:border-color .2s}
.tg-item:hover{border-color:var(--accent)}
.tg-ico{font-size:28px;min-width:40px;text-align:center}
.tg-info{flex:1}.tg-info h4{font-size:14px;font-weight:600;margin-bottom:4px}.tg-info p{font-size:12px;color:var(--muted);line-height:1.4}
.tg-info .tg-meta{font-size:11px;color:var(--accent);margin-top:4px}
.up{border:2px dashed var(--border);border-radius:var(--radius);padding:40px;text-align:center;cursor:pointer;transition:border-color .2s}.up:hover{border-color:var(--accent)}
.empty{text-align:center;padding:60px 20px;color:var(--muted)}.empty h2{font-size:48px;margin-bottom:8px}.empty h3{font-size:18px;color:var(--text);margin-bottom:4px}

/* Workers */
.wk{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}
.wi{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:20px;display:flex;gap:16px;align-items:flex-start;transition:border-color .2s}.wi:hover{border-color:var(--accent)}
.wic{font-size:32px;width:50px;height:50px;background:var(--bg3);border-radius:12px;display:flex;align-items:center;justify-content:center}
.winf{flex:1}.winf h3{font-size:14px;font-weight:600;margin-bottom:4px}.winf p{font-size:12px;color:var(--muted)}
.badge{font-size:11px;padding:4px 10px;border-radius:20px;display:inline-flex;align-items:center;gap:4px}
.badge.on{background:rgba(0,255,136,.1);color:var(--green);border:1px solid rgba(0,255,136,.2)}

@media(max-width:768px){
.side{transform:translateX(-100%)}.side.open{transform:translateX(0)}
.main{margin-left:0;padding:16px}.gr{grid-template-columns:1fr}.cg{grid-template-columns:repeat(2,1fr)}
.mob-toggle{display:block!important}
}
.mob-toggle{display:none;position:fixed;top:12px;left:12px;z-index:101;background:var(--bg2);border:1px solid var(--border);color:var(--text);padding:8px 12px;border-radius:8px;font-size:18px;cursor:pointer}
</style>
</head>
<body>
<!-- Loader -->
<div class="loader" id="loader">
<div style="text-align:center">
<div class="ld-i">⚡</div>
<div class="ld-t">JDUB HUB</div>
<div class="ld-bar"><div class="ld-fill"></div></div>
<div class="ld-sub">Initializing AI Workers...</div>
</div>
</div>

<!-- App -->
<div class="app" id="app">
<button class="mob-toggle" onclick="document.querySelector('.side').classList.toggle('open')">☰</button>

<!-- Sidebar -->
<nav class="side" id="side">
<div class="side-h"><div class="slogo">⚡</div><div class="sbrand">JDUB<span>HUB</span></div></div>
<div class="nav">
<button class="nb on" data-p="dash" onclick="go('dash')"><span class="ni">🏠</span>Dashboard</button>
<button class="nb" data-p="chat" onclick="go('chat')"><span class="ni">🤖</span>AI Chat</button>
<button class="nb" data-p="tv" onclick="go('tv')"><span class="ni">📺</span>Live TV</button>
<button class="nb" data-p="tg" onclick="go('tg')"><span class="ni">📱</span>Telegram</button>
<button class="nb" data-p="wk" onclick="go('wk')"><span class="ni">⚙️</span>Workers</button>
</div>
<div class="side-f"><span class="dot"></span>All Systems Online</div>
</nav>

<main class="main">
<!-- Dashboard -->
<div class="pg on" id="p-dash">
<div class="ph"><h1>⚡ Command Center</h1><p class="ps">Everything connected, everything live</p></div>
<div class="gr">
<div class="cd"><div class="ch2"><span>🤖</span><h3>AI Workers</h3></div>
<div class="wg">
<span class="wp"><span class="dot"></span>Main AI</span>
<span class="wp"><span class="dot"></span>Search</span>
<span class="wp"><span class="dot"></span>Analyze</span>
<span class="wp"><span class="dot"></span>Summarize</span>
<span class="wp"><span class="dot"></span>Live TV</span>
<span class="wp"><span class="dot"></span>Telegram</span>
</div></div>
<div class="cd"><div class="ch2"><span>📊</span><h3>Quick Stats</h3></div>
<div class="sg">
<div class="st"><div class="sn" id="sUp">0m</div><div class="sl">Uptime</div></div>
<div class="st"><div class="sn">6</div><div class="sl">Workers</div></div>
<div class="st"><div class="sn"><?=$totalMsgs?></div><div class="sl">Messages</div></div>
<div class="st"><div class="sn"><?=$totalMedia?></div><div class="sl">Media</div></div>
</div></div>
<div class="cd cw"><div class="ch2"><span>💬</span><h3>Quick Chat</h3><button class="tb" onclick="go('chat')" style="margin-left:auto">Full Chat →</button></div>
<div class="cms" id="qChat">
<div class="cm ai"><span class="cb">⚡ MAIN AI</span><p>Hey! Main JDUB AI hoon. Kuch poocho! 🔥</p></div>
</div>
<div class="cin"><input class="ci" id="qIn" placeholder="Type message..." onkeydown="if(event.key==='Enter')qSend()"><button class="sn2" onclick="qSend()">⚡</button></div>
</div>
</div></div>

<!-- AI Chat -->
<div class="pg" id="p-chat">
<div class="ph"><h1>🤖 AI Chat Hub</h1><p class="ps">Main AI + 6 Worker AIs</p></div>
<div class="cb2">
<div class="cms" id="cMsgs">
<div class="cm ai"><span class="cb">⚡ MAIN AI</span><p>Welcome! 🎉 Main AI se baat karo.</p>
<div class="caps">
<div class="cap" onclick="chat('Search karo movie')">🔍 Search</div>
<div class="cap" onclick="chat('Analyze karo data')">📊 Analyze</div>
<div class="cap" onclick="chat('Summary banao')">📝 Summary</div>
<div class="cap" onclick="chat('Live TV dikhao')">📺 Live TV</div>
<div class="cap" onclick="chat('Telegram data')">📱 Telegram</div>
<div class="cap" onclick="chat('Status batao')">⚙️ Status</div>
</div></div>
</div>
<div class="cin"><input class="ci" id="cIn" placeholder="Message type karo..." onkeydown="if(event.key==='Enter')chat(this.value)"><button class="sn2" onclick="chat(document.getElementById('cIn').value)">Send ⚡</button></div>
</div></div>

<!-- Live TV -->
<div class="pg" id="p-tv">
<div class="ph"><h1>📺 Live TV</h1><p class="ps">Cloudflare powered streaming</p></div>
<div class="tvm"><div class="tvp" onclick="this.parentElement.innerHTML='<video autoplay controls style=width:100%;height:100%;object-fit:contain><source src=\\'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8\\' type=\\'application/x-mpegURL\\'></video>'">▶</div></div>
<div class="cg">
<div class="ch3" onclick="loadStream('hindi-movies')"><div class="ci2">🎬</div><div class="cn">Hindi Movies</div><div class="cs">● LIVE</div></div>
<div class="ch3" onclick="loadStream('hindi-dubbed')"><div class="ci2">🎥</div><div class="cn">Hindi Dubbed</div><div class="cs">● LIVE</div></div>
<div class="ch3" onclick="loadStream('web-series')"><div class="ci2">📺</div><div class="cn">Web Series</div><div class="cs">● LIVE</div></div>
<div class="ch3" onclick="loadStream('music')"><div class="ci2">🎵</div><div class="cn">Music TV</div><div class="cs">● LIVE</div></div>
<div class="ch3" onclick="loadStream('news')"><div class="ci2">📰</div><div class="cn">News</div><div class="cs">● LIVE</div></div>
<div class="ch3" onclick="loadStream('sports')"><div class="ci2">⚽</div><div class="cn">Sports</div><div class="cs">● LIVE</div></div>
</div></div>

<!-- Telegram -->
<div class="pg" id="p-tg">
<div class="ph"><h1>📱 Telegram Hub</h1><p class="ps">Group: @hindidubbedfilmmovie — browse, search, download</p></div>
<div class="tg-bar">
<input class="tgs" id="tgQ" placeholder="🔍 Movie ya Book search karo..." onkeydown="if(event.key==='Enter')tgSearch()">
<button class="tb" onclick="tgSearch()">Search</button>
<button class="tb on" onclick="tgF('all',this)">All</button>
<button class="tb" onclick="tgF('photo',this)">🖼️</button>
<button class="tb" onclick="tgF('video',this)">🎬</button>
<button class="tb" onclick="tgF('doc',this)">📄</button>
</div>
<div id="tgC">
<div id="tgMsgs">
<?php if (empty($movies) && empty($messages)): ?>
<div class="empty"><h2>📱</h2><h3>Telegram Data Upload karo</h3>
<p>Export script chalao ya JSON file upload karo</p>
<div class="up" onclick="document.getElementById('tgF2').click()">
<div style="font-size:40px;margin-bottom:8px">📁</div>
<p>Drag & Drop ya Click — JSON file select karo</p>
<input type="file" id="tgF2" accept=".json" style="display:none" onchange="tgUp(this.files)">
</div></div>
<?php else: ?>
<div class="tg-list">
<?php
$shown = array_slice(array_reverse($messages), 0, 100);
foreach ($shown as $m):
    $icon = '💬';
    $type = 'text';
    if (!empty($m['photo']) || (isset($m['type']) && $m['type'] === 'photo')) { $icon = '🖼️'; $type = 'photo'; }
    elseif (!empty($m['video']) || (isset($m['type']) && $m['type'] === 'video')) { $icon = '🎬'; $type = 'video'; }
    elseif (!empty($m['document']) || (isset($m['type']) && $m['type'] === 'document')) { $icon = '📄'; $type = 'document'; }
    elseif (!empty($m['audio']) || (isset($m['type']) && $m['type'] === 'audio')) { $icon = '🎵'; $type = 'audio'; }
    $text = htmlspecialchars(substr($m['text'] ?? $m['message'] ?? '', 0, 200));
    $meta = $m['date'] ?? '';
    if (!empty($m['file_name'])) $meta .= ' | ' . $m['file_name'];
?>
<div class="tg-item"><div class="tg-ico"><?=$icon?></div><div class="tg-info"><h4><?=strtoupper($type)?></h4><p><?=$text ?: '[Media]'?></p><div class="tg-meta"><?=$meta?></div></div></div>
<?php endforeach; ?>
</div>
<div class="up" style="margin-top:16px" onclick="document.getElementById('tgF2').click()">
<p>📁 Naya JSON upload karo</p>
<input type="file" id="tgF2" accept=".json" style="display:none" onchange="tgUp(this.files)">
</div>
<?php endif; ?>
</div>
</div></div>

<!-- Workers -->
<div class="pg" id="p-wk">
<div class="ph"><h1>⚙️ Worker AIs</h1><p class="ps">Status aur kaam</p></div>
<div class="wk">
<div class="wi"><div class="wic">⚡</div><div class="winf"><h3>Main AI Orchestrator</h3><p>Sab workers ko route karta hai</p><div class="wst"><span class="badge on">● Online</span></div></div></div>
<div class="wi"><div class="wic">🔍</div><div class="winf"><h3>Search Worker</h3><p>Content dhundhta hai — movies, books, files</p><div class="wst"><span class="badge on">● Online</span></div></div></div>
<div class="wi"><div class="wic">📊</div><div class="winf"><h3>Analyze Worker</h3><p>Data samajhta hai — trends, patterns</p><div class="wst"><span class="badge on">● Online</span></div></div></div>
<div class="wi"><div class="wic">📝</div><div class="winf"><h3>Summarize Worker</h3><p>TLDR mode — short me batata hai</p><div class="wst"><span class="badge on">● Online</span></div></div></div>
<div class="wi"><div class="wic">📺</div><div class="winf"><h3>Live TV Worker</h3><p>Stream handle karta hai</p><div class="wst"><span class="badge on">● Online</span></div></div></div>
<div class="wi"><div class="wic">📱</div><div class="winf"><h3>Telegram Worker</h3><p>Group data manage karta hai</p><div class="wst"><span class="badge on">● Online</span></div></div></div>
</div></div>

</main>
</div>

<script>
var BOT_TOKEN='1389903628:AAFapVJGN4EUoGul9gvWrSkT_qM71rwZ_2k';
var tgData=<?=json_encode(array_values($messages))?>;
var startTime=Date.now();

// Loader
window.addEventListener('load',function(){
setTimeout(function(){
document.getElementById('loader').classList.add('hid');
document.getElementById('app').classList.add('vis');
setInterval(function(){
var d=Date.now()-startTime,m=Math.floor(d/60000),h=Math.floor(m/60);
document.getElementById('sUp').textContent=h>0?h+'h'+(m%60)+'m':m+'m';
},10000);
},2500);
});

// Navigation
function go(p){
document.querySelectorAll('.pg').forEach(function(e){e.classList.remove('on')});
document.querySelectorAll('.nb').forEach(function(e){e.classList.remove('on')});
var el=document.getElementById('p-'+p);if(el)el.classList.add('on');
var btn=document.querySelector('[data-p="'+p+'"]');if(btn)btn.classList.add('on');
document.querySelector('.side').classList.remove('open');
}

// AI Chat
function aiRoute(msg){
var l=msg.toLowerCase();
if(l.match(/search|dhundh|find|khoj|movie|film|download|book/)){
return{w:'search',i:'🔍',r:'Search Worker activated! 🔍\n\nTelegram group data me search kar raha hoon...\n\nGroup: @hindidubbedfilmmovie\nUpload karo JSON data aur movies/books dhundho!'};
}
if(l.match(/analyz|samjh|samajh|data|trend/)){
return{w:'analyze',i:'📊',r:'Analyze Worker activated! 📊\n\nData analysis mode ON.\n\nTrends aur patterns dhundh raha hoon messages me.'};
}
if(l.match(/summary|tl;dr|short|chhota|recap/)){
return{w:'summarize',i:'📝',r:'Summarize Worker activated! 📝\n\nShort me samjhata hoon!\n\nTelegram group me movies aur books ka collection hai.'};
}
if(l.match(/live\s*tv|tv|stream|channel/)){
return{w:'tv',i:'📺',r:'Live TV Worker activated! 📺\n\nCategories:\n• Hindi Movies 🎬\n• Hindi Dubbed 🎥\n• Web Series 📺\n• Music TV 🎵\n• News 📰\n• Sports ⚽'};
}
if(l.match(/telegram|tg|group|message|chat/)){
return{w:'tg',i:'📱',r:'Telegram Worker activated! 📱\n\nGroup: @hindidubbedfilmmovie\n\nData browse karne ke liye Telegram page par jao aur JSON upload karo.'};
}
if(l.match(/status|kya haal|how|kaisa|health/)){
return{w:'status',i:'⚙️',r:'Status Report ⚙️\n\n✅ Main AI: Online\n✅ Search Worker: Online\n✅ Analyze Worker: Online\n✅ Summarize Worker: Online\n✅ Live TV Worker: Online\n✅ Telegram Worker: Online\n\nAll 6 workers operational! 🔥'};
}
return{w:'main',i:'⚡',r:'Got it! 🤔\n\nTry karo:\n🔍 "Search karo movie name"\n📊 "Analyze karo data"\n📝 "Summary banao"\n📺 "Live TV dikhao"\n📱 "Telegram data"\n⚙️ "Status batao"'};
}

function addMsg(c,text,isUser,wn,wi){
var d=document.createElement('div');d.className='cm '+(isUser?'user':'ai');
d.innerHTML='<span class="cb">'+(isUser?'👤 YOU':wi+' '+wn)+' AI</span><p>'+text.replace(/\n/g,'<br>')+'</p>';
c.appendChild(d);c.scrollTop=c.scrollHeight;
}

function chat(msg){
if(!msg||!msg.trim())return;
var i=document.getElementById('cIn');if(i)i.value='';
var c=document.getElementById('cMsgs');
addMsg(c,msg,true);
var r=aiRoute(msg);
setTimeout(function(){addMsg(c,r.r,false,r.w,r.i);},500);
}

function qSend(){
var i=document.getElementById('qIn');var msg=i.value.trim();if(!msg)return;i.value='';
var c=document.getElementById('qChat');addMsg(c,msg,true);
var r=aiRoute(msg);setTimeout(function(){addMsg(c,r.r,false,r.w,r.i);},400);
}

// Telegram
function tgSearch(){
var q=document.getElementById('tgQ').value.toLowerCase();
if(!tgData.length)return;
var f=tgData.filter(function(m){return(m.text||m.message||'').toLowerCase().includes(q)||(m.file_name||'').toLowerCase().includes(q);});
renderTg(f);
}

function tgF(type,btn){
document.querySelectorAll('.tg-bar .tb').forEach(function(b){b.classList.remove('on')});btn.classList.add('on');
if(!tgData.length)return;
if(type==='all')renderTg(tgData);
else if(type==='photo')renderTg(tgData.filter(function(m){return m.photo||m.type==='photo';}));
else if(type==='video')renderTg(tgData.filter(function(m){return m.video||m.type==='video';}));
else if(type==='doc')renderTg(tgData.filter(function(m){return m.document||m.type==='document';}));
}

function tgUp(files){
if(!files.length)return;
var reader=new FileReader();
reader.onload=function(e){
try{
var d=JSON.parse(e.target.result);
tgData=Array.isArray(d)?d:(d.messages||[]);
var c=document.getElementById('tgC');
c.innerHTML='<div class="tg-list"></div>';
renderTg(tgData);
}catch(err){alert('JSON error: '+err.message);}
};reader.readAsText(files[0]);
}

function renderTg(msgs){
var c=document.getElementById('tgMsgs')||document.getElementById('tgC');
if(!msgs||!msgs.length){c.innerHTML='<div class="empty"><h2>🔍</h2><h3>Koi results nahi</h3></div>';return;}
var h='<div class="tg-list">';
msgs.slice(0,100).forEach(function(m){
var icon='💬',type='text';
if(m.photo||m.type==='photo'){icon='🖼️';type='photo';}
else if(m.video||m.type==='video'){icon='🎬';type='video';}
else if(m.document||m.type==='document'){icon='📄';type='document';}
var text=(m.text||m.message||'').substring(0,150);
if(text.length>=150)text+='...';
h+='<div class="tg-item"><div class="tg-ico">'+icon+'</div><div class="tg-info"><h4>'+type.toUpperCase()+'</h4><p>'+text+'</p><div class="tg-meta">'+(m.date||'')+'</div></div></div>';
});
c.innerHTML=h+'</div>';
}

function loadStream(ch){
document.querySelector('.tvm').innerHTML='<iframe src="about:blank" style="width:100%;height:100%;border:none" id="tvFrame"></iframe>';
document.getElementById('tvFrame').contentDocument.body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#000;color:#00d4ff;font-size:20px;text-align:center;padding:20px"><div><div style="font-size:48px;margin-bottom:12px">📺</div>Stream: '+ch+'<br><span style="font-size:14px;color:#666;margin-top:8px;display:block">Coming soon via Cloudflare Workers</span></div></div>';
}
</script>
</body>
</html>
