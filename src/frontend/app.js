// NJStream v11 — Consolidated Frontend Application
export const APP_JS = String.raw`
(function(){
'use strict';
window.NJ=window.NJ||{};

var API='';
var state={page:'home',tab:{},user:null,token:null,prefs:JSON.parse(localStorage.getItem('nj_prefs')||'{}')};
var cache={};
var players={mode:null,data:null,fallbackUrl:null,streamUrl:null};

function $(id){return document.getElementById(id)}
function esc(s){if(s==null)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function toast(msg,type){var c=$('toastWrap');if(!c)return;var d=document.createElement('div');d.className='toast '+(type||'info');d.textContent=msg;c.appendChild(d);setTimeout(function(){d.style.opacity='0';d.style.transform='translateY(8px)';setTimeout(function(){d.remove()},300)},3400)}
function debounce(fn,ms){var t;return function(){var a=arguments,c=this;clearTimeout(t);t=setTimeout(function(){fn.apply(c,a)},ms||300)}}
function lsGet(k){try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return[]}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function lsObj(k){try{return JSON.parse(localStorage.getItem(k)||'{}')}catch(e){return{}}}

// === API helper ===
function fetchJSON(url){return fetch(url).then(function(r){return r.json()})}
function apiPath(p){return API+p}

// === Poster placeholder (never broken images) ===
function posterPH(title,kind){
  var t=String(title||(kind==='book'?'Book':'Movie')).replace(/[<>&"']/g,'').slice(0,40);
  var ic=kind==='book'?'📚':kind==='series'?'📺':kind==='soft'?'⚙️':'🎬';
  var bg=kind==='book'?'#0e3a2a':kind==='series'?'#0a2e38':'#0e2a4a';
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="400" height="600" fill="'+bg+'"/><circle cx="330" cy="70" r="110" fill="rgba(0,229,255,0.07)"/><circle cx="60" cy="540" r="90" fill="rgba(124,77,255,0.09)"/><rect x="20" y="20" width="360" height="560" rx="16" fill="none" stroke="rgba(0,229,255,0.2)" stroke-width="1.5"/><text x="200" y="250" font-size="80" text-anchor="middle">'+ic+'</text><text x="200" y="340" font-size="24" font-weight="800" fill="#eaf6ff" text-anchor="middle" font-family="Arial">'+t.slice(0,30)+'</text><text x="200" y="400" font-size="12" letter-spacing="4" fill="rgba(0,229,255,0.7)" text-anchor="middle" font-family="Arial">NJSTREAM</text></svg>');
}
function imgOr(bg,title,kind,cls){
  if(bg)return '<img src="'+bg+'" alt="'+esc(title)+'" loading="lazy" class="'+(cls||'')+'" onerror="this.outerHTML=\'<div class=\\\'poster-ph\\\'><div class=\\\'ph-emoji\\\'>🎬</div><div class=\\\'ph-title\\\'>'+esc(title).replace(/'/g,"&#39;")+'</div></div>\'">';
  return '<div class="poster-ph" style="background:url(\''+posterPH(title,kind)+'\') center/cover"><div class="ph-emoji">'+(kind==='book'?'📚':kind==='series'?'📺':'🎬')+'</div></div>';
}
function thumbOr(thumb,title){return thumb?'<img src="'+thumb+'" alt="'+esc(title)+'" loading="lazy" class="tg-thumb" onerror="this.onerror=null;this.src=\''+posterPH(title,'movie')+'\'">':'<img src="'+posterPH(title,'movie')+'" alt="'+esc(title)+'" class="tg-thumb">';}

function skeleton(n){var h='<div class="skeleton-grid">';for(var i=0;i<(n||6);i++)h+='<div class="sk-card"><div class="sk-poster"></div><div class="sk-lines"><div class="sk-line" style="width:80%"></div><div class="sk-line" style="width:50%"></div></div></div>';return h+'</div>';}
function emptyH(msg,icon,title){return '<div class="empty"><div class="ico">'+(icon||'📭')+'</div><h3>'+esc(title||'Nothing here yet')+'</h3><p>'+esc(msg||'')+'</p></div>';}
function errorH(msg){return '<div class="error"><div class="ico">⚠️</div><h3>Something went wrong</h3><p>'+esc(msg||'Please try again.')+'</p></div>';}

// === Navigation ===
function nav(page){
  state.page=page;
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  var pg=$('pg-'+page);if(pg)pg.classList.add('active');
  document.querySelectorAll('.tb-link[data-nav]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-nav')===page)});
  document.querySelectorAll('.bn[data-nav]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-nav')===page)});
  window.scrollTo(0,0);
  if(page==='home')loadHome();
  else if(page==='watch')NJ.tab('watch','live',$('#watchTabs .tab.active')||$('#watchTabs .tab'));
  else if(page==='discover')NJ.tab('discover','books',$('#discoverTabs .tab.active')||$('#discoverTabs .tab'));
  else if(page==='library')NJ.tab('library','catalog',$('#libraryTabs .tab.active')||$('#libraryTabs .tab'));
  else if(page==='ai')NJ.tab('ai','family',$('#aiTabs .tab.active')||$('#aiTabs .tab'));
  else if(page==='account')NJ.tab('account','profile',$('#accountTabs .tab.active')||$('#accountTabs .tab'));
  else if(page==='admin')loadAdmin();
}
window.NJ.nav=nav;

// === Tab system ===
NJ.tab=function(section,name,btn){
  state.tab[section]=name;
  if(btn){btn.closest('.tabs').querySelectorAll('.tab').forEach(function(t){t.classList.remove('active')});btn.classList.add('active')}
  var pane=$(section+'Pane');if(!pane)return;
  if(section==='watch')loadWatchTab(name,pane);
  else if(section==='discover')loadDiscoverTab(name,pane);
  else if(section==='library')loadLibraryTab(name,pane);
  else if(section==='ai')loadAITab(name,pane);
  else if(section==='account')loadAccountTab(name,pane);
};

// === HOME PAGE ===
function loadHome(){
  var el=$('pg-home');if(!el)return;
  el.innerHTML='<div class="hero" id="heroBanner"><div class="hero-content"><div class="hero-badge">🚀 FUTURISTIC STREAMING</div><h1 class="hero-title">NJ<span class="grad">Stream</span></h1><p class="hero-sub">Live • Stream • Discover — your entertainment, knowledge & AI world in one dashboard.</p><div class="hero-btns"><button class="btn btn-primary" onclick="NJ.nav(\'watch\')">▶ WATCH NOW</button><button class="btn btn-ghost" onclick="NJ.nav(\'discover\')">🔍 EXPLORE</button></div></div></div><div class="stats-row" id="homeStats">'+skeleton(4)+'</div><div class="section" id="homeContinue"><div class="section-row"><h2 class="section-title">📹 Continue Watching</h2></div><div id="homeContinueGrid"></div></div><div class="section" id="homeTrending"><div class="section-row"><h2 class="section-title">🔥 Trending</h2><span class="section-more" onclick="NJ.nav(\'watch\')">See all →</span></div><div id="homeTrendingGrid"></div></div><div class="section" id="homeLive"><div class="section-row"><h2 class="section-title">📺 Live Now</h2><span class="section-more" onclick="NJ.tab(\'watch\',\'live\')">See all →</span></div><div id="homeLiveGrid"></div></div><div class="section"><div class="section-row"><h2 class="section-title">📚 Books</h2><span class="section-more" onclick="NJ.tab(\'discover\',\'books\')">See all →</span></div><div id="homeBooksGrid"></div></div><div class="section"><div class="section-row"><h2 class="section-title">🤖 AI Family</h2><span class="section-more" onclick="NJ.nav(\'ai\')">Meet agents →</span></div><div id="homeAgentsGrid"></div></div>';
  loadHomeStats();loadHomeTrending();loadHomeLive();loadHomeBooks();loadHomeAgents();loadHomeContinue();
}
function loadHomeStats(){
  fetchJSON(apiPath('/api/stats')).then(function(d){
    var el=$('homeStats');if(!el)return;
    var ch=(d.channels&&d.channels.working)||0;var mv=(d.movies&&d.movies.count)||0;var bk=(d.books&&d.books.count)||0;var tg=(d.tg&&d.tg.total)||0;el.innerHTML='<div class="stat-card"><div class="stat-num">'+ch+'</div><div class="stat-label">Live Channels</div></div><div class="stat-card"><div class="stat-num">'+mv+'</div><div class="stat-label">Movies</div></div><div class="stat-card"><div class="stat-num">'+bk+'</div><div class="stat-label">Books</div></div><div class="stat-card"><div class="stat-num">'+tg+'</div><div class="stat-label">Telegram</div></div>';
  }).catch(function(){var el=$('homeStats');if(el)el.innerHTML='';});
}
function loadHomeTrending(){
  fetchJSON(apiPath('/api/moviebox/trending')).then(function(d){
    var items=(d.results||[]).slice(0,8);var el=$('homeTrendingGrid');if(!el)return;
    if(!items.length){el.innerHTML=emptyH('No trending data yet','🔥','No Trending');return;}
    el.innerHTML='<div class="grid-movies">'+items.map(function(m){return movieCard(m)}).join('')+'</div>';
  }).catch(function(){});
}
function loadHomeLive(){
  fetchJSON(apiPath('/api/live-tv?limit=6')).then(function(d){
    var chs=(d.channels||[]).slice(0,6);var el=$('homeLiveGrid');if(!el)return;
    if(!chs.length){el.innerHTML=emptyH('No live channels available','📺','No Live TV');return;}
    el.innerHTML='<div class="grid-channels">'+chs.map(function(c){return channelCard(c)}).join('')+'</div>';
  }).catch(function(){});
}
function loadHomeBooks(){
  fetchJSON(apiPath('/api/books?q=hindi&limit=6')).then(function(d){
    var books=(d.results||[]).slice(0,6);var el=$('homeBooksGrid');if(!el)return;
    if(!books.length){el.innerHTML=emptyH('No books available','📚','No Books');return;}
    el.innerHTML='<div class="grid-books">'+books.map(function(b){return bookCard(b)}).join('')+'</div>';
  }).catch(function(){});
}
function loadHomeAgents(){
  fetchJSON(apiPath('/api/agents')).then(function(d){
    var agents=d.agents||[];var el=$('homeAgentsGrid');if(!el)return;
    el.innerHTML='<div class="grid-agents">'+agents.map(function(a){return '<div class="agent-card" onclick="NJ.nav(\'ai\')"><div class="agent-avatar">'+esc(a.emoji)+'</div><div class="agent-name">'+esc(a.name)+'</div><div class="agent-role">'+esc(a.role)+'</div><div class="agent-tags">'+(a.capabilities||[]).slice(0,3).map(function(c){return '<span class="agent-tag">'+esc(c)+'</span>'}).join('')+'</div></div>'}).join('')+'</div>';
  }).catch(function(){});
}
function loadHomeContinue(){
  var hist=lsGet('nj_history');var el=$('homeContinueGrid');if(!el)return;
  if(!hist.length){el.innerHTML=emptyH('Start watching to see your progress here.','📹','No recent activity');return;}
  el.innerHTML='<div class="grid-movies">'+hist.slice(0,6).map(function(h){return movieCard({id:h.id,title:h.title,image:h.image,year:h.year,rating:h.rating,type:h.type})}).join('')+'</div>';
}

// === CARD RENDERERS ===
function movieCard(m){
  var rating=m.rating?'<span class="media-rating">⭐ '+esc(String(m.rating).slice(0,3))+'</span>':'';
  var badge='';
  if(m.playable)badge='<span class="media-badge badge-hd">PLAYABLE</span>';
  return '<div class="media-card" onclick="NJ.openDetail(\''+esc(m.id)+'\',\''+esc(m.type||'movie')+'\')"><div class="media-poster">'+imgOr(m.image,m.title,m.type||'movie')+'<div class="media-overlay"><button class="btn-play" onclick="event.stopPropagation();NJ.playItem(\''+esc(m.id)+'\',\''+esc(m.type||'movie')+'\')">▶</button></div>'+rating+badge+'</div><div class="media-info"><div class="media-title">'+esc(m.title)+'</div><div class="media-meta">'+(m.year?'<span>'+esc(m.year)+'</span>':'')+(m.genre?'<span>'+esc(m.genre)+'</span>':'')+'</div></div></div>';
}
function channelCard(c){
  return '<div class="ch-card" onclick="NJ.playChannel(\''+esc(c.url||c.name)+'\',\''+esc(c.name)+'\')"><div class="ch-live-dot"></div><div class="ch-name">'+esc(c.name)+'</div><span class="ch-cat">'+esc((c.categories&&c.categories[0])||c.category||'General')+'</span><button class="ch-play" onclick="event.stopPropagation();NJ.playChannel(\''+esc(c.url||c.name)+'\',\''+esc(c.name)+'\')">▶</button></div>';
}
function bookCard(b){
  var cover=b.cover||b.image||b.cover_i?'https://covers.openlibrary.org/b/id/'+b.cover_i+'-M.jpg':'';
  return '<div class="book-card" onclick="NJ.openBook(\''+esc(b.key||b.id||'')+'\','+(b.ia?'\''+esc(b.ia)+'\'':'\'\'')+')"><div class="book-cover">'+imgOr(cover,b.title,'book')+'</div><div class="book-info"><div class="book-title">'+esc(b.title||'Untitled')+'</div><div class="book-author">'+esc(b.author||b.author_name||'Unknown')+'</div>'+(b.language?'<span class="book-lang">'+esc(b.language)+'</span>':'')+'</div></div>';
}
function softwareCard(s){
  return '<div class="soft-card"><div class="soft-icon">📦</div><div class="soft-info"><div class="soft-name">'+esc(s.name||'App')+'</div><div class="soft-meta"><span>v'+esc(s.version||'?')+'</span><span>'+esc(s.category||'Tools')+'</span><span>'+esc(s.size||'')+'</span>'+(s.verified?'<span class="soft-verified">✓ Verified</span>':'')+'</div></div></div>';
}
function tgCard(t){
  var typeClass=t.type==='video'?'tg-type-video':t.type==='photo'?'tg-type-photo':t.type==='document'?'tg-type-doc':'tg-type-text';
  var typeLabel=t.type==='video'?'🎬 Video':t.type==='photo'?'📷 Photo':t.type==='document'?'📄 Document':'📝 Text';
  var desc=t.text||t.title||'No description';
  return '<div class="tg-card" onclick="'+(t.type==='video'?'NJ.playTelegram(\''+esc(t.id)+'\',\''+esc(t.title||'')+'\')':'NJ.openTGDetail('+JSON.stringify(t).replace(/'/g,"\\'").replace(/"/g,'&quot;')+')')+'">'+thumbOr(t.thumbnail||t.image,t.title||'Telegram')+'<div class="tg-info"><div class="tg-title">'+esc(t.title||t.name||'Untitled')+'</div><div class="tg-desc">'+esc(desc.slice(0,120))+'</div><span class="tg-type '+typeClass+'">'+typeLabel+'</span></div></div>';
}

// === WATCH TABS ===
function loadWatchTab(name,pane){
  if(name==='live')loadLiveTV(pane);
  else if(name==='movies')loadMovies(pane);
  else if(name==='series')loadSeries(pane);
  else if(name==='moviebox')loadMovieBox(pane);
  else if(name==='videos')loadVideosTab(pane);
}
function loadLiveTV(el){
  el.innerHTML=skeleton(4);
  fetchJSON(apiPath('/api/live-tv?limit=40')).then(function(d){
    var chs=d.channels||[];var working=chs.filter(function(c){return c.working!==false});
    if(!working.length){el.innerHTML='<div style="margin-bottom:14px"><div class="stats-row"><div class="stat-card"><div class="stat-num">'+chs.length+'</div><div class="stat-label">Channels Listed</div></div><div class="stat-card"><div class="stat-num">0</div><div class="stat-label">Verified Working</div></div></div></div>'+emptyH('No verified working channels. Run health check to verify channels.','📺','No Live TV');return;}
    var cats={};working.forEach(function(c){var k=(c.categories&&c.categories[0])||c.category||'General';cats[k]=(cats[k]||0)+1});
    el.innerHTML='<div style="margin-bottom:14px"><div class="stats-row"><div class="stat-card"><div class="stat-num">'+working.length+'</div><div class="stat-label">Working Channels</div></div><div class="stat-card"><div class="stat-num">'+Object.keys(cats).length+'</div><div class="stat-label">Categories</div></div></div></div><div class="grid-channels">'+working.map(function(c){return channelCard(c)}).join('')+'</div>';
  }).catch(function(e){el.innerHTML=errorH('Could not load channels: '+e.message)});
}
function loadMovies(el){
  el.innerHTML=skeleton(6);
  fetchJSON(apiPath('/api/movies?type=popular')).then(function(d){
    var items=d.results||[];
    if(!items.length){el.innerHTML=emptyH('No movies available right now.','🎬','No Movies');return;}
    el.innerHTML='<div class="grid-movies">'+items.map(function(m){return movieCard(m)}).join('')+'</div>';
  }).catch(function(e){el.innerHTML=errorH('Movies load failed: '+e.message)});
}
function loadSeries(el){
  el.innerHTML=skeleton(6);
  fetchJSON(apiPath('/api/movies/series')).then(function(d){
    var items=d.results||[];
    if(!items.length){el.innerHTML=emptyH('No series available right now.','📺','No Series');return;}
    el.innerHTML='<div class="grid-movies">'+items.map(function(m){return movieCard({...m,type:'series'})}).join('')+'</div>';
  }).catch(function(e){el.innerHTML=errorH('Series load failed: '+e.message)});
}
function loadMovieBox(el){
  el.innerHTML='<div style="margin-bottom:14px"><div class="form-group" style="max-width:480px"><div style="display:flex;gap:8px"><input id="mbSearch" placeholder="Search movies, series…" style="flex:1;padding:10px 14px;border-radius:var(--radius-sm);background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:13px" onkeydown="if(event.key===\'Enter\')NJ.mbSearch()"><button class="btn btn-primary btn-sm" onclick="NJ.mbSearch()">Search</button></div></div></div><div id="mbResults">'+skeleton(6)+'</div>';
  fetchJSON(apiPath('/api/moviebox/trending')).then(function(d){
    var items=(d.results||[]).slice(0,12);var r=$('mbResults');if(!r)return;
    if(!items.length){r.innerHTML=emptyH('MovieBox catalog empty. Backend may not be configured.','🎥','No Movies');return;}
    r.innerHTML='<div class="section-title" style="margin-bottom:10px">🔥 Trending</div><div class="grid-movies">'+items.map(function(m){return movieCard(m)}).join('')+'</div>';
  }).catch(function(e){var r=$('mbResults');if(r)r.innerHTML=errorH('MovieBox load failed: '+e.message)});
}
NJ.mbSearch=function(){
  var q=($('mbSearch')||{}).value||'';q=q.trim();if(!q)return;
  var r=$('mbResults');if(r)r.innerHTML=skeleton(6);
  fetchJSON(apiPath('/api/moviebox/search?q='+encodeURIComponent(q))).then(function(d){
    var items=d.results||[];var r=$('mbResults');if(!r)return;
    if(!items.length){r.innerHTML=emptyH('No results for "'+esc(q)+'"','🔍','No Results');return;}
    r.innerHTML='<div class="section-title" style="margin-bottom:10px">🔍 Results for "'+esc(q)+'"</div><div class="grid-movies">'+items.map(function(m){return movieCard(m)}).join('')+'</div>';
  }).catch(function(e){var r=$('mbResults');if(r)r.innerHTML=errorH('Search failed: '+e.message)});
};
function loadVideosTab(el){
  el.innerHTML=emptyH('Video content will appear here when available.','📹','No Videos Yet');
}

// === DISCOVER TABS ===
function loadDiscoverTab(name,pane){
  if(name==='books')loadBooks(pane);
  else if(name==='software')loadSoftware(pane);
  else if(name==='telegram')loadTelegram(pane);
}
function loadBooks(el){
  var cats=[{k:'hindi',l:'Hindi'},{k:'english',l:'English'},{k:'science',l:'Science'},{k:'technology',l:'Tech'},{k:'fiction',l:'Fiction'},{k:'education',l:'Education'},{k:'selfhelp',l:'Self Help'}];
  el.innerHTML='<div style="margin-bottom:14px"><div class="form-group" style="max-width:480px"><div style="display:flex;gap:8px"><input id="bookSearch" placeholder="Search books…" style="flex:1;padding:10px 14px;border-radius:var(--radius-sm);background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:13px" onkeydown="if(event.key===\'Enter\')NJ.bookSearch()"><button class="btn btn-primary btn-sm" onclick="NJ.bookSearch()">Search</button></div></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">'+cats.map(function(c){return '<button class="tab" onclick="NJ.bookCat(\''+c.k+'\')">'+esc(c.l)+'</button>'}).join('')+'</div></div><div id="bookResults">'+skeleton(6)+'</div>';
  loadBookCategory('hindi');
}
NJ.bookCat=function(cat){var i=$('bookSearch');if(i)i.value=cat;loadBookCategory(cat);};
NJ.bookSearch=function(){var q=($('bookSearch')||{}).value||'';q=q.trim();if(!q)return;loadBookCategory(q);};
function loadBookCategory(q){
  var el=$('bookResults');if(el)el.innerHTML=skeleton(6);
  fetchJSON(apiPath('/api/books?q='+encodeURIComponent(q))).then(function(d){
    var items=d.results||[];var el=$('bookResults');if(!el)return;
    if(!items.length){el.innerHTML=emptyH('No books found for "'+esc(q)+'"','📚','No Books');return;}
    el.innerHTML='<div class="grid-books">'+items.map(function(b){return bookCard(b)}).join('')+'</div>';
  }).catch(function(e){var el=$('bookResults');if(el)el.innerHTML=errorH('Books failed: '+e.message)});
}
function loadSoftware(el){
  el.innerHTML=skeleton(4);
  fetchJSON(apiPath('/api/software')).then(function(d){
    var items=d.items||d.results||[];var el=$('softwareResults')||el;
    if(!items.length){el.innerHTML=emptyH('No software available right now.','💻','No Software');return;}
    el.innerHTML='<div class="grid-software">'+items.map(function(s){return softwareCard(s)}).join('')+'</div>';
  }).catch(function(e){el.innerHTML=errorH('Software load failed: '+e.message)});
}
function loadTelegram(el){
  el.innerHTML=skeleton(4);
  fetchJSON(apiPath('/api/telegram/messages?limit=30')).then(function(d){
    var msgs=d.messages||d.results||[];var el2=$('tgResults')||el;
    if(!msgs.length){el2.innerHTML=emptyH('No Telegram content available.','📱','No Telegram Data');return;}
    el2.innerHTML='<div class="grid-tg">'+msgs.map(function(t){return tgCard(t)}).join('')+'</div>';
  }).catch(function(e){el.innerHTML=errorH('Telegram load failed: '+e.message)});
}

// === LIBRARY TABS ===
function loadLibraryTab(name,pane){
  if(name==='catalog')loadCatalog(pane);
  else if(name==='favorites')loadFavorites(pane);
  else if(name==='watchlist')loadWatchlist(pane);
  else if(name==='history')loadHistoryTab(pane);
}
function loadCatalog(el){
  fetchJSON(apiPath('/api/catalog')).then(function(d){
    var items=d.results||[];
    if(!items.length){el.innerHTML=emptyH('Your catalog is empty. Add favorites from movies, books, or channels.','📋','No Catalog');return;}
    el.innerHTML='<div class="grid-movies">'+items.map(function(i){return movieCard({id:i.id||i.title,title:i.title,image:i.image||'',year:i.year||'',type:i.type||'movie'})}).join('')+'</div>';
  }).catch(function(e){el.innerHTML=errorH('Catalog failed: '+e.message)});
}
function loadFavorites(el){
  var favs=lsGet('nj_favorites');
  if(!favs.length){el.innerHTML=emptyH('No favorites yet. Tap ❤️ on any content to save it.','❤️','No Favorites');return;}
  el.innerHTML='<div class="grid-movies">'+favs.map(function(f){return movieCard(f)}).join('')+'</div>';
}
function loadWatchlist(el){
  var wl=lsGet('nj_watchlist');
  if(!wl.length){el.innerHTML=emptyH('Your watchlist is empty. Add items to watch later.','🔖','No Watchlist');return;}
  el.innerHTML='<div class="grid-movies">'+wl.map(function(w){return movieCard(w)}).join('')+'</div>';
}
function loadHistoryTab(el){
  var hist=lsGet('nj_history');
  if(!hist.length){el.innerHTML=emptyH('No watch history yet.','🕘','No History');return;}
  el.innerHTML='<div class="grid-movies">'+hist.slice(0,20).map(function(h){return movieCard({id:h.id,title:h.title,image:h.image,year:h.year,rating:h.rating,type:h.type})}).join('')+'</div>';
}

// === AI TABS ===
function loadAITab(name,pane){
  if(name==='family')loadAIFamily(pane);
  else if(name==='famroom')loadFamilyRoom(pane);
  else if(name==='njroom')loadNJRoom(pane);
  else if(name==='agentTools')loadAgentTools(pane);
  else loadAgentTools(pane);
}
function loadAIFamily(el){
  fetchJSON(apiPath('/api/agents')).then(function(d){
    var agents=d.agents||[];
    el.innerHTML='<div class="grid-agents">'+agents.map(function(a){
      return '<div class="agent-card" onclick="NJ.chatAgent(\''+esc(a.id)+'\')"><div class="agent-avatar">'+esc(a.emoji)+'</div><div class="agent-name">'+esc(a.name)+'</div><div class="agent-role">'+esc(a.role)+'</div><div style="font-size:11px;color:var(--text3);margin-top:4px">'+esc(a.tagline||'')+'</div><div class="agent-tags" style="margin-top:8px">'+(a.capabilities||[]).slice(0,3).map(function(c){return '<span class="agent-tag">'+esc(c)+'</span>'}).join('')+'</div></div>';
    }).join('')+'</div><div style="margin-top:16px"><div class="chat-container" id="aiChatBox"><div class="chat-box" id="aiChatMsgs"><div class="empty"><div class="ico">🤖</div><h3>Choose an agent to start chatting</h3><p>Click any agent card above to begin.</p></div></div><div class="chat-input"><input id="aiChatInput" placeholder="Type a message…" onkeydown="if(event.key===\'Enter\')NJ.aiSend()"><button onclick="NJ.aiSend()">Send</button></div></div></div>';
  }).catch(function(e){el.innerHTML=errorH('AI load failed: '+e.message)});
}
NJ.chatAgent=function(agentId){
  state._aiAgent=agentId;
  var msgs=$('aiChatMsgs');if(msgs)msgs.innerHTML='<div class="empty"><div class="ico">🤖</div><h3>Chat with '+esc(agentId)+'</h3><p>Type a message to begin.</p></div>';
  var inp=$('aiChatInput');if(inp)inp.focus();
};
NJ.aiSend=function(){
  var inp=$('aiChatInput');if(!inp)return;
  var msg=inp.value.trim();if(!msg)return;inp.value='';
  var agent=state._aiAgent||'main';
  var msgs=$('aiChatMsgs');if(!msgs)return;
  if(msgs.querySelector('.empty'))msgs.innerHTML='';
  msgs.innerHTML+='<div class="chat-msg user">'+esc(msg)+'</div>';
  msgs.innerHTML+='<div class="chat-msg bot" id="aiPending"><div class="spinner" style="margin:10px auto;width:24px;height:24px"></div></div>';
  msgs.scrollTop=msgs.scrollHeight;
  fetch(apiPath('/api/chat'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,agent:agent,history:[]})}).then(function(r){return r.json()}).then(function(d){
    var pending=$('aiPending');if(pending)pending.remove();
    var tools=d.tools||[];
    var toolsHtml=tools.length?'<div class="chat-tools">'+tools.map(function(t){return '<span class="tool-chip '+(t.status||'')+'">'+esc(t.name)+' '+(t.status==='done'?'✓':t.status==='running'?'⏳':'')+'</span>'}).join('')+'</div>':'';
    msgs.innerHTML+='<div class="chat-msg bot">'+toolsHtml+'<div class="agent-label">'+esc(d.emoji||'🤖')+' '+esc(d.agentName||'AI')+'</div><div>'+(d.response||'No response').replace(/\n/g,'<br>')+'</div></div>';
    msgs.scrollTop=msgs.scrollHeight;
  }).catch(function(e){
    var pending=$('aiPending');if(pending)pending.remove();
    msgs.innerHTML+='<div class="chat-msg bot" style="border-color:var(--red)">⚠️ Error: '+esc(e.message)+'</div>';
  });
};
function loadFamilyRoom(el){
  el.innerHTML='<div class="chat-container"><div class="chat-box" id="famRoomMsgs"><div class="empty"><div class="ico">🏠</div><h3>Family Room</h3><p>AI Family agents discuss topics together here.</p></div></div><div class="chat-input"><input id="famRoomInput" placeholder="Start a family discussion…" onkeydown="if(event.key===\'Enter\')NJ.famRoomSend()"><button onclick="NJ.famRoomSend()">Send</button></div></div>';
}
NJ.famRoomSend=function(){toast('Family Room — feature requires backend support','info');};
function loadNJRoom(el){
  el.innerHTML='<div class="chat-container"><div class="chat-box" id="njRoomMsgs"><div class="empty"><div class="ico">🚀</div><h3>NJ Room</h3><p>NJStream command center. Advanced AI interactions.</p></div></div><div class="chat-input"><input id="njRoomInput" placeholder="Command NJ…" onkeydown="if(event.key===\'Enter\')NJ.njRoomSend()"><button onclick="NJ.njRoomSend()">Send</button></div></div>';
}
NJ.njRoomSend=function(){toast('NJ Room — feature requires backend support','info');};
function loadAgentTools(el){
  fetchJSON(apiPath('/api/agents/skills')).then(function(d){
    var skills=d.skills||[];
    el.innerHTML='<div class="grid-agents">'+skills.map(function(s){
      return '<div class="agent-card" style="cursor:default;align-items:flex-start;text-align:left"><div class="agent-name" style="font-size:14px">'+esc(s.name)+'</div><div class="agent-role" style="font-size:11px;color:var(--text2)">'+esc(s.desc)+'</div><div style="margin-top:6px"><code style="font-size:10px;color:var(--text3)">'+esc(s.args||'{}')+'</code></div></div>';
    }).join('')+'</div>';
  }).catch(function(e){el.innerHTML=errorH('Tools load failed: '+e.message)});
}

// === ACCOUNT TABS ===
function loadAccountTab(name,pane){
  if(name==='profile')loadProfile(pane);
  else if(name==='settings')loadSettings(pane);
  else if(name==='history')loadHistoryTab(pane);
}
function loadProfile(el){
  if(state.user){
    el.innerHTML='<div class="acct-form"><h3 style="margin-bottom:8px">Welcome, '+esc(state.user.username)+'</h3><p style="color:var(--text3);font-size:13px">Role: '+esc(state.user.role||'user')+'</p><button class="btn btn-ghost btn-sm" style="margin-top:10px;width:fit-content" onclick="NJ.logout()">Logout</button></div>';
  }else{
    el.innerHTML='<div class="acct-form"><h3 style="margin-bottom:12px">Login</h3><div class="form-group"><label>Username</label><input id="loginUser" placeholder="Username"></div><div class="form-group"><label>Password</label><input id="loginPass" type="password" placeholder="Password"></div><button class="btn btn-primary" onclick="NJ.login()" style="margin-top:8px">Login</button><p style="margin-top:12px;font-size:12px;color:var(--text3)">New user? <a href="#" onclick="NJ.showRegister();return false">Register</a></p><div id="regForm" style="display:none;margin-top:16px"><h3 style="margin-bottom:12px">Register</h3><div class="form-group"><label>Username</label><input id="regUser" placeholder="Username"></div><div class="form-group"><label>Email</label><input id="regEmail" type="email" placeholder="Email"></div><div class="form-group"><label>Password</label><input id="regPass" type="password" placeholder="Password (6+ chars)"></div><button class="btn btn-primary" onclick="NJ.register()" style="margin-top:8px">Register</button></div></div>';
  }
}
NJ.login=function(){
  var u=($('loginUser')||{}).value,p=($('loginPass')||{}).value;
  if(!u||!p){toast('Username aur password zaroori hai','error');return;}
  fetch(apiPath('/api/auth/login'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})}).then(function(r){return r.json()}).then(function(d){
    if(d.ok&&d.token){localStorage.setItem('nj_token',d.token);localStorage.setItem('nj_user',JSON.stringify(d.user));state.token=d.token;state.user=d.user;toast('Welcome back, '+d.user.username+'!','success');loadAccountTab('profile',$('accountPane'));}else{toast(d.error||'Login failed','error');}
  }).catch(function(e){toast('Login error: '+e.message,'error')});
};
NJ.register=function(){
  var u=($('regUser')||{}).value,e=($('regEmail')||{}).value,p=($('regPass')||{}).value;
  if(!u||!e||!p){toast('All fields required','error');return;}
  fetch(apiPath('/api/auth/register'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,email:e,password:p})}).then(function(r){return r.json()}).then(function(d){
    if(d.ok&&d.token){localStorage.setItem('nj_token',d.token);localStorage.setItem('nj_user',JSON.stringify(d.user));state.token=d.token;state.user=d.user;toast('Account created! Welcome, '+d.user.username,'success');loadAccountTab('profile',$('accountPane'));}else{toast(d.error||'Registration failed','error');}
  }).catch(function(e){toast('Register error: '+e.message,'error')});
};
NJ.showRegister=function(){var r=$('regForm');if(r)r.style.display='block';};
NJ.logout=function(){localStorage.removeItem('nj_token');localStorage.removeItem('nj_user');state.token=null;state.user=null;toast('Logged out','info');loadAccountTab('profile',$('accountPane'));};
function loadSettings(el){
  var st=lsObj('nj_settings');
  el.innerHTML='<div class="acct-form"><h3 style="margin-bottom:12px">Settings</h3><div class="form-group"><label>Particles Animation</label><select id="setParticles" onchange="NJ.saveSetting(\'particles\',this.value)"><option value="on"'+(st.particles!==false?' selected':'')+'">On</option><option value="off"'+(st.particles===false?' selected':'')+'>Off</option></select></div><div class="form-group"><label>Clear Local Data</label><div style="display:flex;gap:8px;margin-top:6px"><button class="btn btn-ghost btn-sm" onclick="NJ.clearLocal(\'nj_history\',this)">Clear History</button><button class="btn btn-ghost btn-sm" onclick="NJ.clearLocal(\'nj_favorites\',this)">Clear Favorites</button><button class="btn btn-ghost btn-sm" onclick="NJ.clearLocal(\'nj_watchlist\',this)">Clear Watchlist</button></div></div></div>';
}
NJ.saveSetting=function(k,v){var st=lsObj('nj_settings');st[k]=v==='on'?true:v==='off'?false:v;localStorage.setItem('nj_settings',JSON.stringify(st));if(k==='particles'){var c=$('particles');if(c)c.style.display=st.particles===false?'none':''}toast('Setting saved','success');};
NJ.clearLocal=function(key,btn){localStorage.removeItem(key);if(btn)btn.textContent='Cleared ✓';toast('Cleared','success');};

// === ADMIN ===
function loadAdmin(){
  var el=$('adminContent');if(!el)return;
  el.innerHTML='<div class="acct-form"><h3 style="margin-bottom:12px">Admin Panel</h3><p style="font-size:13px;color:var(--text3);margin-bottom:16px">Admin functionality requires authorized access.</p><div class="form-group"><label>Status</label><div id="adminStatus" class="skeleton">Loading…</div></div></div>';
  fetchJSON(apiPath('/api/stats')).then(function(d){
    var el2=$('adminStatus');if(!el2)return;
    el2.innerHTML='<pre style="font-size:11px;color:var(--text2);white-space:pre-wrap">'+JSON.stringify(d,null,2)+'</pre>';
  }).catch(function(e){var el2=$('adminStatus');if(el2)el2.innerHTML=errorH(e.message)});
}

// === SEARCH ===
NJ.openSearch=function(){$('searchOverlay').classList.add('open');setTimeout(function(){var i=$('smartSearch');if(i)i.focus()},100);};
NJ.closeSearch=function(){$('searchOverlay').classList.remove('open');};
NJ.searchHint=function(q){var i=$('smartSearch');if(i)i.value=q;doSearch();};
var doSearch=debounce(function(){
  var q=($('smartSearch')||{}).value||'';q=q.trim();
  if(!q){$('soBody').innerHTML='<div class="empty"><div class="ico">🔍</div><h3>Smart Universal Search</h3><p>Type ya bol — sirf useful results.</p></div>';return;}
  $('soBody').innerHTML='<div class="skeleton">Understanding intent…</div>';
  fetchJSON(apiPath('/api/search?q='+encodeURIComponent(q))).then(function(d){renderSearchResults(d)}).catch(function(){$('soBody').innerHTML=errorH('Search failed.')});
},350);
function renderSearchResults(d){
  var el=$('soBody');if(!el)return;
  var html='';var intent=d.intent||{};
  if(intent.type)html+='<div style="margin-bottom:14px"><span style="padding:4px 10px;border-radius:6px;background:rgba(0,229,255,.1);color:var(--accent);font-size:11px;font-weight:700">Intent: '+esc(intent.type)+(intent.year?' • '+esc(intent.year):'')+(intent.language?' • '+esc(intent.language):'')+'</span></div>';
  var sections=[
    {key:'movies',title:'🎬 Movies',render:function(m){return movieCard({id:m.id,title:m.title,image:m.image,year:m.year,rating:m.rating,type:'movie'})}},
    {key:'series',title:'📺 Series',render:function(m){return movieCard({id:m.id,title:m.title,image:m.image,year:m.year,rating:m.rating,type:'series'})}},
    {key:'books',title:'📚 Books',render:function(b){return bookCard(b)}},
    {key:'channels',title:'📺 Live TV',render:function(c){return channelCard(c)}},
    {key:'software',title:'💻 Software',render:function(s){return softwareCard(s)}},
    {key:'tg',title:'📱 Telegram',render:function(t){return tgCard(t)}}
  ];
  sections.forEach(function(s){
    var items=d[s.key]||[];
    if(items.length){
      html+='<div class="so-section"><div class="so-section-title">'+s.title+' ('+items.length+')</div><div class="so-results">'+items.slice(0,8).map(function(i){return s.render(i)}).join('')+'</div></div>';
    }
  });
  if(!html)html=emptyH('No results found. Try a different search.','🔍','No Results');
  el.innerHTML=html;
}

// === VOICE SEARCH ===
NJ.voiceSearch=function(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){toast('Voice search not supported','error');return;}
  var rec=new SR();rec.lang='hi-IN';rec.interimResults=true;rec.maxAlternatives=1;
  var btn=$('voiceBtn'),i=$('smartSearch');
  btn.classList.add('listening');btn.textContent='⏺';
  if(i)i.placeholder='Listening… speak now';
  rec.onresult=function(e){var t='';for(var j=0;j<e.results.length;j++)t+=e.results[j][0].transcript;if(i)i.value=t;};
  rec.onend=function(){btn.classList.remove('listening');btn.textContent='🎤';if(i&&i.value.trim())doSearch()};
  rec.onerror=function(e){btn.classList.remove('listening');btn.textContent='🎤';toast('Voice error: '+(e.error||'unknown'),'error');};
  rec.start();
};

// === DETAIL MODAL ===
NJ.openDetail=function(id,type){
  var url=type==='series'?apiPath('/api/movies/detail?id='+encodeURIComponent(id)):apiPath('/api/moviebox/detail/'+encodeURIComponent(id));
  fetchJSON(url).then(function(d){
    var modal=$('detailModal');var body=$('detailBody');
    if(!d.ok&&d.error){body.innerHTML='<div class="modal-head"><span>Details</span><button class="modal-x" onclick="NJ.closeDetail()">✕</button></div><div style="padding:20px">'+errorH(d.error)+'</div>';modal.classList.add('open');return;}
    body.innerHTML='<div class="modal-head"><span>'+esc(d.title||'Details')+'</span><button class="modal-x" onclick="NJ.closeDetail()">✕</button></div><div class="detail-hero"><div class="detail-poster">'+imgOr(d.image||d.poster,d.title||'','movie')+'</div><div class="detail-body"><h2>'+esc(d.title||'Untitled')+'</h2><div class="detail-meta">'+(d.year?'<span class="detail-tag">'+esc(d.year)+'</span>':'')+(d.rating?'<span class="detail-tag">⭐ '+esc(String(d.rating).slice(0,3))+'</span>':'')+(d.genre?'<span class="detail-tag">'+esc(d.genre)+'</span>':'')+(d.language?'<span class="detail-tag">'+esc(d.language)+'</span>':'')+(d.type?'<span class="detail-tag">'+esc(d.type)+'</span>':'')+'</div>'+(d.overview?'<div class="detail-overview">'+esc(d.overview)+'</div>':'')+(d.cast&&d.cast.length?'<div class="detail-overview"><strong>Cast:</strong> '+d.cast.map(esc).join(', ')+'</div>':'')+'<div class="detail-actions"><button class="btn btn-primary" onclick="NJ.playItem(\''+esc(d.id||id)+'\',\''+esc(d.type||type)+'\')">▶ Play</button><button class="btn btn-ghost" onclick="NJ.toggleFavorite('+JSON.stringify({id:d.id||id,title:d.title,image:d.image||d.poster,year:d.year,rating:d.rating,type:d.type||type}).replace(/"/g,'&quot;')+')">❤️ Favorite</button><button class="btn btn-ghost" onclick="NJ.toggleWatchlist('+JSON.stringify({id:d.id||id,title:d.title,image:d.image||d.poster,year:d.year,rating:d.rating,type:d.type||type}).replace(/"/g,'&quot;')+')">🔖 Watchlist</button></div></div></div>';
    modal.classList.add('open');
  }).catch(function(e){toast('Failed to load details','error');});
};
NJ.closeDetail=function(){$('detailModal').classList.remove('open');};

// === BOOK READER ===
NJ.openBook=function(key,ia){
  $('readerModal').classList.add('open');
  $('readerTitle').textContent='Reading…';
  $('readerBody').innerHTML='<div class="skeleton">Loading book text…</div>';
  var url=apiPath('/api/books/read?key='+encodeURIComponent(key));
  if(ia)url+='&ia='+encodeURIComponent(ia);
  fetchJSON(url).then(function(d){
    if(d.ok&&d.text){$('readerTitle').textContent=d.title||'Book';$('readerBody').textContent=d.text.slice(0,200000);}
    else{$('readerBody').innerHTML=errorH(d.error||'Book text unavailable')+'<div style="margin-top:12px;text-align:center"><a class="btn btn-ghost btn-sm" href="https://openlibrary.org'+(key||'')+'" target="_blank" rel="noopener">Open on Open Library →</a></div>';}
  }).catch(function(e){$('readerBody').innerHTML=errorH('Failed to load: '+e.message);});
};
NJ.closeReader=function(){$('readerModal').classList.remove('open');};

// === TELEGRAM DETAIL ===
NJ.openTGDetail=function(t){toast('Telegram detail view — tap video to play','info');};

// === PLAYER ===
NJ.playChannel=function(url,name){
  if(!url){toast('No stream URL','error');return;}
  openPlayer(name||'Live TV','livetv',url,url);
};
NJ.playItem=function(id,type){
  if(type==='livetv'){return;}
  fetchJSON(apiPath('/api/moviebox/stream?id='+encodeURIComponent(id))).then(function(d){
    if(d.ok&&d.stream_url){openPlayer(d.title||id,'moviebox',d.stream_url,'');}
    else if(d.url){openPlayer(d.title||id,'moviebox',d.url,'');}
    else{toast(d.reason||d.error||'Stream unavailable','error');}
  }).catch(function(e){toast('Stream fetch failed: '+e.message,'error');});
};
NJ.playTelegram=function(id,title){
  var url=apiPath('/api/telegram/stream?id='+encodeURIComponent(id));
  openPlayer(title||'Telegram','telegram',url,'');
};
function openPlayer(title,source,url,fallbackUrl){
  var modal=$('playerModal');var video=$('pmVideo');
  players={mode:source,data:{title:title},fallbackUrl:fallbackUrl||'',streamUrl:url};
  $('pmTitle').textContent=title||'NJStream Player';
  $('pmSource').textContent=source||'';
  $('pmOverlay').style.display='none';
  $('pmSpinner').style.display='none';
  $('pmError').style.display='none';
  modal.classList.add('open');
  video.src=url;
  video.play().catch(function(e){
    $('pmSpinner').style.display='none';
    showPlayerError('Playback failed',e.message||'Could not start playback');
  });
  $('pmSpinner').style.display='flex';
  video.onplaying=function(){$('pmSpinner').style.display='none';$('pmStatus').textContent='Playing';};
  video.onerror=function(){$('pmSpinner').style.display='none';showPlayerError('Playback error','The stream could not be loaded. Try a different source.');};
}
function showPlayerError(title,msg){
  $('pmSpinner').style.display='none';
  $('pmErrorTitle').textContent=title;
  $('pmErrorMsg').textContent=msg;
  $('pmError').style.display='flex';
  $('pmOverlay').style.display='flex';
}
NJ.retryPlayback=function(){
  if(players.streamUrl){$('pmError').style.display='none';$('pmSpinner').style.display='flex';$('pmVideo').src=players.streamUrl;$('pmVideo').play().catch(function(e){showPlayerError('Retry failed',e.message)});}
};
NJ.playFallback=function(){
  if(players.fallbackUrl){$('pmError').style.display='none';$('pmSpinner').style.display='flex';$('pmVideo').src=players.fallbackUrl;$('pmVideo').play().catch(function(e){showPlayerError('Fallback failed',e.message)});}
};
NJ.closePlayer=function(){
  var v=$('pmVideo');if(v){v.pause();v.src='';}
  $('playerModal').classList.remove('open');
  players={mode:null,data:null,fallbackUrl:null,streamUrl:null};
};

// === FAVORITES / WATCHLIST ===
NJ.toggleFavorite=function(item){
  var favs=lsGet('nj_favorites');var idx=favs.findIndex(function(f){return f.id===item.id});
  if(idx>=0){favs.splice(idx,1);toast('Removed from favorites','info');}else{favs.unshift(item);toast('Added to favorites ❤️','success');}
  lsSet('nj_favorites',favs);
};
NJ.toggleWatchlist=function(item){
  var wl=lsGet('nj_watchlist');var idx=wl.findIndex(function(w){return w.id===item.id});
  if(idx>=0){wl.splice(idx,1);toast('Removed from watchlist','info');}else{wl.unshift(item);toast('Added to watchlist 🔖','success');}
  lsSet('nj_watchlist',wl);
};

// === NOTIFICATIONS ===
NJ.toggleNotif=function(){
  var p=$('notifPanel');if(!p)return;
  p.style.display=p.style.display==='none'?'block':'none';
  if(p.style.display==='block'){
    $('notifDot')&&($('notifDot').style.display='none');
    $('notifList').innerHTML='<div class="notif-item"><span>📡</span><span>Smart search available — try natural language queries</span></div><div class="notif-item"><span>🤖</span><span>AI agents now use real tools for live data</span></div><div class="notif-item"><span>🎬</span><span>MovieBox works with or without backend</span></div><div class="notif-item"><span>ℹ️</span><span>No private credentials are exposed in this app</span></div>';
  }
};

// === DRAWER ===
NJ.openDrawer=function(){$('moreDrawer').classList.add('open');$('drawerOverlay').classList.add('show');};
NJ.closeDrawer=function(){$('moreDrawer').classList.remove('open');$('drawerOverlay').classList.remove('show');};

// === PARTICLES ===
function initParticles(){
  var c=$('particles');if(!c)return;
  var ctx=c.getContext('2d');var w,h,particles=[];
  function resize(){w=c.width=window.innerWidth;h=c.height=window.innerHeight;}
  resize();window.addEventListener('resize',resize);
  for(var i=0;i<40;i++)particles.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.5+.5,dx:(Math.random()-.5)*.3,dy:(Math.random()-.5)*.3,o:Math.random()*.4+.1});
  function draw(){
    ctx.clearRect(0,0,w,h);
    particles.forEach(function(p){
      p.x+=p.dx;p.y+=p.dy;
      if(p.x<0)p.x=w;if(p.x>w)p.x=0;if(p.y<0)p.y=h;if(p.y>h)p.y=0;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(0,229,255,'+p.o+')';ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// === INIT ===
function init(){
  $('loader').classList.add('hide');
  var st=lsObj('nj_settings');if(st.particles===false){var c=$('particles');if(c)c.style.display='none';}
  initParticles();
  state.token=localStorage.getItem('nj_token');
  try{state.user=JSON.parse(localStorage.getItem('nj_user')||'null')}catch(e){state.user=null}
  var isAdmin=state.user&&state.user.role==='admin';
  document.querySelectorAll('.tb-admin,.dr-admin').forEach(function(b){b.style.display=isAdmin?'':'none'});
  document.querySelectorAll('.tb-link[data-nav]').forEach(function(b){b.addEventListener('click',function(){nav(b.getAttribute('data-nav'))})});
  document.querySelectorAll('.bn[data-nav]').forEach(function(b){b.addEventListener('click',function(){nav(b.getAttribute('data-nav'))})});
  $('tbHamburger').addEventListener('click',function(){NJ.openDrawer()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){NJ.closeSearch();NJ.closeDrawer();NJ.closeDetail();NJ.closeReader();NJ.closePlayer();}});
  $('smartSearch').addEventListener('input',doSearch);
  loadHome();
}

window.NJ.nav=nav;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
`;
