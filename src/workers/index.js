// ============================================================
// JDUB Hub - Cloudflare Worker (v3.1 — Live TV Added)
// Free services integrated:
//   - Workers Router
//   - KV Cache
//   - D1 SQLite (catalog)
//   - Cron Trigger (daily sync)
//   - TMDB API (movies)
//   - Open Library API (books)
//   - Live TV (free IPTV — Hindi priority)
//   - Telegram API (webhook)
//   - Analytics Engine
// ============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=300',
};


// ============================================================
// STATIC ASSETS — Frontend served from Worker
// ============================================================
const INDEX_HTML = `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>JDUB Hub — Movies, Books, AI</title>
<meta name="description" content="JDUB Hub — Free movies, books, AI chat, live TV. Powered by Cloudflare + GitHub.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>">
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<div class="loader" id="loader">
  <div class="ld-inner">
    <div class="ld-icon">⚡</div>
    <div class="ld-text">JDUB HUB</div>
    <div class="ld-bar"><div class="ld-fill"></div></div>
    <div class="ld-sub">Initializing 10+ free services...</div>
  </div>
</div>

<div class="app" id="app">
  <!-- Sidebar -->
  <nav class="side" id="side">
    <div class="side-h">
      <div class="slogo">⚡</div>
      <div class="sbrand">JDUB<span>HUB</span></div>
    </div>
    <div class="nav">
      <button class="nb on" data-p="dash" onclick="go('dash')"><span class="ni">🏠</span>Dashboard</button>
      <button class="nb" data-p="search" onclick="go('search')"><span class="ni">🔍</span>Search</button>
      <button class="nb" data-p="movies" onclick="go('movies')"><span class="ni">🎬</span>Movies</button>
      <button class="nb" data-p="books" onclick="go('books')"><span class="ni">📚</span>Books</button>
      <button class="nb" data-p="catalog" onclick="go('catalog')"><span class="ni">📁</span>Catalog</button>
      <button class="nb" data-p="chat" onclick="go('chat')"><span class="ni">🤖</span>AI Chat</button>
      <button class="nb" data-p="tv" onclick="go('tv')"><span class="ni">📺</span>Live TV</button>
      <button class="nb" data-p="wk" onclick="go('wk')"><span class="ni">⚙️</span>Workers</button>
    </div>
    <div class="side-f"><div class="dot"></div>All Systems Online</div>
  </nav>

  <main class="main">
    <!-- PAGE: DASHBOARD -->
    <div class="pg on" id="p-dash">
      <div class="ph"><h1>⚡ Command Center</h1><p class="ps">Everything connected, everything live</p></div>
      <div class="gr">
        <div class="cd"><div class="ch2"><span>🤖</span><h3>AI Workers</h3></div><div class="wg"><span class="wp"><i class="dot"></i>Main AI</span><span class="wp"><i class="dot"></i>Search</span><span class="wp"><i class="dot"></i>Analyze</span><span class="wp"><i class="dot"></i>Summarize</span><span class="wp"><i class="dot"></i>Live TV</span><span class="wp"><i class="dot"></i>Telegram</span></div></div>
        <div class="cd"><div class="ch2"><span>📊</span><h3>Quick Stats</h3></div><div class="sg"><div class="st"><div class="sn" id="sUp">0m</div><div class="sl">Uptime</div></div><div class="st"><div class="sn">6</div><div class="sl">Workers</div></div><div class="st"><div class="sn" id="sMsg">0</div><div class="sl">Messages</div></div><div class="st"><div class="sn" id="sMed">0</div><div class="sl">Content</div></div></div></div>
      </div>
      <div class="quick-links">
        <button class="ql" onclick="go('search')">🔍 Search Content</button>
        <button class="ql" onclick="go('movies')">🎬 Movies</button>
        <button class="ql" onclick="go('books')">📚 Books</button>
        <button class="ql" onclick="go('catalog')">📁 My Catalog</button>
        <button class="ql" onclick="go('chat')">🤖 AI Chat</button>
        <button class="ql" onclick="go('tv')">📺 Live TV</button>
      </div>
    </div>

    <!-- PAGE: SEARCH -->
    <div class="pg" id="p-search">
      <div class="ph"><h1>🔍 Search Everything</h1><p class="ps">Movies + Books + Catalog — ek saath</p></div>
      <div class="search-wrap">
        <input type="text" id="searchInput" class="search-input" placeholder="Movie, book, series search karo..." onkeydown="if(event.key==='Enter')searchContent()">
        <button class="search-btn" onclick="searchContent()">🔍 Search</button>
      </div>
      <div id="searchResults" class="search-results"></div>
    </div>

    <!-- PAGE: MOVIES -->
    <div class="pg" id="p-movies">
      <div class="ph"><h1>🎬 Movies</h1><p class="ps">TMDB se live data</p></div>
      <div class="tab-row">
        <button class="tabb on" onclick="switchMovieTab(this,'popular')">🔥 Popular</button>
        <button class="tabb" onclick="switchMovieTab(this,'top_rated')">⭐ Top Rated</button>
        <button class="tabb" onclick="switchMovieTab(this,'now_playing')">🎥 Now Playing</button>
        <button class="tabb" onclick="switchMovieTab(this,'upcoming')">🗓️ Upcoming</button>
      </div>
      <div id="moviesGrid" class="grid-movies"><div class="loading">Loading movies...</div></div>
    </div>

    <!-- PAGE: BOOKS -->
    <div class="pg" id="p-books">
      <div class="ph"><h1>📚 Books</h1><p class="ps">Open Library — free reading</p></div>
      <div class="search-wrap small">
        <input type="text" id="bookInput" class="search-input" placeholder="Book search..." onkeydown="if(event.key==='Enter')loadBooks(document.getElementById('bookInput').value)">
        <button class="search-btn" onclick="loadBooks(document.getElementById('bookInput').value)">📚 Search</button>
      </div>
      <div class="tab-row">
        <button class="tabb on" onclick="switchBookTab(this,'famous')">📖 Famous</button>
        <button class="tabb" onclick="switchBookTab(this,'science')">🔬 Science</button>
        <button class="tabb" onclick="switchBookTab(this,'Hinduism')">🕉️ Hinduism</button>
      </div>
      <div id="booksGrid" class="grid-books"><div class="loading">Loading books...</div></div>
    </div>

    <!-- PAGE: CATALOG -->
    <div class="pg" id="p-catalog">
      <div class="ph"><h1>📁 My Catalog</h1><p class="ps">D1 database — apna content</p></div>
      <div class="add-card">
        <input type="text" id="catTitle" class="search-input" placeholder="Title...">
        <select id="catType" class="cat-select">
          <option value="movie">🎬 Movie</option>
          <option value="book">📚 Book</option>
          <option value="series">📺 Series</option>
        </select>
        <input type="text" id="catDesc" class="search-input" placeholder="Description...">
        <button class="search-btn" onclick="addToCatalog()">➕ Add</button>
      </div>
      <div id="catalogList" class="search-results"><div class="loading">Loading catalog...</div></div>
    </div>

    <!-- PAGE: CHAT -->
    <div class="pg" id="p-chat">
      <div class="ph"><h1>🤖 AI Chat Hub</h1><p class="ps">Main AI + 6 Worker AIs</p></div>
      <div class="cb2">
        <div class="cms" id="cMsgs">
          <div class="cm ai"><span class="cb">⚡ MAIN AI</span><p>Welcome! Movie/book search ya koi bhi sawaal poocho 🎉</p>
            <div class="caps">
              <div class="cap" onclick="chat('Search karo')">🔍 Search</div>
              <div class="cap" onclick="chat('Analyze karo')">📊 Analyze</div>
              <div class="cap" onclick="chat('Summary banao')">📝 Summary</div>
              <div class="cap" onclick="chat('Live TV dikhao')">📺 Live TV</div>
              <div class="cap" onclick="chat('Status batao')">⚙️ Status</div>
            </div>
          </div>
        </div>
        <div class="cin"><input class="ci" id="cIn" placeholder="Message type karo..." onkeydown="if(event.key==='Enter'){chat(document.getElementById('cIn').value);document.getElementById('cIn').value='';}"><button class="sn2" onclick="chat(document.getElementById('cIn').value);document.getElementById('cIn').value='';">Send ⚡</button></div>
      </div>
    </div>

    </div>

    <!-- PAGE: LIVE TV -->
    <div class="pg" id="p-tv">
      <div class="ph"><h1>📺 Live TV</h1><p class="ps">Free IPTV — Hindi priority | <span id="tvCount">0</span> channels</p></div>
      
      <!-- Player -->
      <div class="tv-player" id="tvPlayer">
        <div class="tv-player-inner" id="tvPlayerInner">
          <div class="tv-placeholder" id="tvPlaceholder">
            <span style="font-size:64px">📺</span>
            <p>Channel select karo</p>
          </div>
          <video id="tvVideo" controls autoplay style="width:100%;height:100%;display:none;border-radius:12px"></video>
        </div>
        <div class="tv-now-playing" id="tvNowPlaying" style="display:none">
          <span class="tv-live-badge">● LIVE</span>
          <span id="tvChannelName">—</span>
        </div>
      </div>

      <!-- Group filter -->
      <div class="tv-groups" id="tvGroups"></div>

      <!-- Search -->
      <div class="search-wrap small">
        <input type="text" id="tvSearch" class="search-input" placeholder="Channel search karo..." oninput="filterTVChannels()">
      </div>

      <!-- Channel list -->
      <div class="tv-channels" id="tvChannels">
        <div class="loading">📺 Loading channels...</div>
      </div>
    </div>


    <!-- PAGE: WORKERS STATUS -->
    <div class="pg" id="p-wk">
      <div class="ph"><h1>⚙️ Services Status</h1><p class="ps">10+ free services live</p></div>
      <div class="wgrid">
        <div class="wi"><div class="wic">⚡</div><div class="winf"><h3>Main AI Orchestrator</h3><p>Worker routing</p><div class="wst"><span class="badge on">● Online</span></div></div></div>
        <div class="wi"><div class="wic">🔍</div><div class="winf"><h3>Search Worker</h3><p>TMDB + Open Library + D1</p><div class="wst"><span class="badge on">● Online</span></div></div></div>
        <div class="wi"><div class="wic">📚</div><div class="winf"><h3>Books API</h3><p>Open Library (free)</p><div class="wst"><span class="badge on">● Online</span></div></div></div>
        <div class="wi"><div class="wic">🎬</div><div class="winf"><h3>Movies API</h3><p>TMDB (free tier)</p><div class="wst"><span class="badge on">● Online</span></div></div></div>
        <div class="wi"><div class="wic">🗄️</div><div class="winf"><h3>D1 Database</h3><p>SQLite — catalog</p><div class="wst"><span class="badge on">● Ready</span></div></div></div>
        <div class="wi"><div class="wic">⚡</div><div class="winf"><h3>KV Cache</h3><p>100K reads/day free</p><div class="wst"><span class="badge on">● Ready</span></div></div></div>
        <div class="wi"><div class="wic">📦</div><div class="winf"><h3>R2 Storage</h3><p>10GB free</p><div class="wst"><span class="badge on">● Ready</span></div></div></div>
        <div class="wi"><div class="wic">⏰</div><div class="winf"><h3>Cron Sync</h3><p>Daily data update</p><div class="wst"><span class="badge on">● Scheduled</span></div></div></div>
        <div class="wi"><div class="wic">📱</div><div class="winf"><h3>Telegram Bot</h3><p>Webhook commands</p><div class="wst"><span class="badge on">● Online</span></div></div></div>
        <div class="wi"><div class="wic">🔒</div><div class="winf"><h3>GitHub Security</h3><p>CodeQL + Dependabot</p><div class="wst"><span class="badge on">● Active</span></div></div></div>
        <div class="wi"><div class="wic">📈</div><div class="winf"><h3>Analytics</h3><p>Cloudflare Web Analytics</p><div class="wst"><span class="badge on">● Free</span></div></div></div>
        <div class="wi"><div class="wic">🌐</div><div class="winf"><h3>CDN</h3><p>Cloudflare Network</p><div class="wst"><span class="badge on">● 300+ cities</span></div></div></div>
      </div>
    </div>
  </main>
</div>

<script src="js/app.js"></script>
</body>
</html>
`;
const STYLE_CSS = `/* JDUB Hub — Complete Styles */
:root{--bg:#0a0a0f;--card:#12121a;--card2:#1a1a25;--border:#2a2a35;--accent:#00d4ff;--accent2:#7c3aed;--green:#22c55e;--red:#ef4444;--yellow:#eab308;--text:#e4e4e7;--text2:#a1a1aa;--radius:12px;--shadow:0 4px 24px rgba(0,0,0,.4)}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden}

/* Loader */
.loader{position:fixed;inset:0;z-index:999;background:var(--bg);display:flex;align-items:center;justify-content:center;transition:opacity .5s}
.loader.hid{opacity:0;pointer-events:none}
.ld-inner{text-align:center}
.ld-icon{font-size:64px;animation:pulse 1s infinite}
.ld-text{font-size:28px;font-weight:700;margin:12px 0;color:var(--accent)}
.ld-bar{width:200px;height:4px;background:var(--border);border-radius:4px;overflow:hidden;margin:12px auto}
.ld-fill{width:0%;height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));animation:fillBar 2s forwards}
.ld-sub{color:var(--text2);font-size:13px}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
@keyframes fillBar{0%{width:0}100%{width:100%}}

/* App layout */
.app{display:flex;min-height:100vh;opacity:0;transition:opacity .5s}
.app.vis{opacity:1}

/* Sidebar */
.side{width:240px;background:var(--card);border-right:1px solid var(--border);padding:16px;display:flex;flex-direction:column;position:fixed;top:0;bottom:0;z-index:10}
.side-h{display:flex;align-items:center;gap:10px;margin-bottom:20px}
.slogo{font-size:28px}
.sbrand{font-size:20px;font-weight:700;color:var(--accent)}
.sbrand span{color:var(--accent2)}
.nav{flex:1;display:flex;flex-direction:column;gap:4px}
.nb{display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;border:none;border-radius:8px;background:transparent;color:var(--text2);font-size:14px;cursor:pointer;text-align:left;transition:all .2s}
.nb:hover{background:var(--card2);color:var(--text)}
.nb.on{background:linear-gradient(135deg,rgba(0,212,255,.12),rgba(124,58,237,.12));color:var(--accent);font-weight:600}
.ni{font-size:16px;width:20px;text-align:center}
.side-f{display:flex;align-items:center;gap:8px;padding:12px;background:var(--card2);border-radius:8px;font-size:12px;color:var(--green)}
.dot{width:8px;height:8px;border-radius:50%;background:var(--green);animation:blink 2s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}

/* Main */
.main{margin-left:240px;flex:1;padding:24px}
.pg{display:none}
.pg.on{display:block}

/* Page header */
.ph{margin-bottom:24px}
.ph h1{font-size:28px;font-weight:700}
.ps{color:var(--text2);margin-top:4px;font-size:14px}

/* Grid cards */
.gr{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-bottom:24px}
.cd{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px}
.ch2{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.ch2 span{font-size:24px}
.ch2 h3{font-size:16px;font-weight:600}
.wg{display:flex;flex-wrap:wrap;gap:8px}
.wp{display:flex;align-items:center;gap:6px;padding:6px 12px;background:var(--card2);border-radius:20px;font-size:12px;color:var(--text2)}
.sg{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.st{text-align:center;padding:12px;background:var(--card2);border-radius:8px}
.sn{font-size:22px;font-weight:700;color:var(--accent)}
.sl{font-size:12px;color:var(--text2);margin-top:4px}

/* Quick links */
.quick-links{display:flex;flex-wrap:wrap;gap:10px}
.ql{padding:10px 20px;background:var(--card2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;cursor:pointer;transition:all .2s}
.ql:hover{border-color:var(--accent);transform:translateY(-2px)}

/* Search */
.search-wrap{display:flex;gap:10px;margin-bottom:20px}
.search-wrap.small{max-width:500px}
.search-input{flex:1;padding:12px 16px;background:var(--card2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;outline:none}
.search-input:focus{border-color:var(--accent)}
.search-btn{padding:12px 20px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:8px;color:#fff;font-weight:600;cursor:pointer;white-space:nowrap}
.search-btn:hover{opacity:.9;transform:translateY(-1px)}
.search-results{display:flex;flex-direction:column;gap:12px}
.sr-card{display:flex;gap:16px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;transition:all .2s}
.sr-card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:var(--shadow)}
.sr-img{width:80px;height:120px;object-fit:cover;border-radius:8px}
.sr-info{flex:1}
.sr-info h3{font-size:16px;font-weight:600;margin-bottom:6px}
.sr-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.badge-t{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600}
.badge-t.tmdb{background:rgba(0,212,255,.15);color:var(--accent)}
.badge-t.openlibrary{background:rgba(34,197,94,.15);color:var(--green)}
.badge-t.catalog{background:rgba(124,58,237,.15);color:var(--accent2)}
.badge-t.movie{background:rgba(239,68,68,.15);color:var(--red)}
.badge-t.book{background:rgba(34,197,94,.15);color:var(--green)}
.badge-t.tv{background:rgba(234,179,8,.15);color:var(--yellow)}
.badge-t.series{background:rgba(124,58,237,.15);color:var(--accent2)}
.sr-overview{font-size:13px;color:var(--text2);line-height:1.5}
.sr-link{display:inline-block;margin-top:8px;padding:4px 12px;background:var(--card2);border-radius:6px;color:var(--accent);font-size:13px;text-decoration:none}
.sr-link:hover{background:rgba(0,212,255,.1)}
.sr-count{padding:8px 0;color:var(--text2);font-size:13px}
.sr-empty,.sr-error{padding:40px;text-align:center;color:var(--text2);font-size:14px}
.loading{padding:40px;text-align:center;color:var(--accent);font-size:14px;animation:pulse 1s infinite}

/* Tabs */
.tab-row{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.tabb{padding:8px 16px;background:var(--card2);border:1px solid var(--border);border-radius:8px;color:var(--text2);font-size:13px;cursor:pointer;transition:all .2s}
.tabb:hover,.tabb.on{border-color:var(--accent);color:var(--accent);background:rgba(0,212,255,.08)}

/* Movie grid */
.grid-movies,.grid-books{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px}
.movie-card,.book-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;transition:all .2s;cursor:pointer}
.movie-card:hover,.book-card:hover{border-color:var(--accent);transform:translateY(-4px);box-shadow:var(--shadow)}
.movie-poster,.book-cover{width:100%;height:240px;object-fit:cover}
.movie-info,.book-info{padding:12px}
.movie-info h4,.book-info h4{font-size:14px;font-weight:600;margin-bottom:4px}
.movie-info p,.book-info p{font-size:12px;color:var(--text2)}
.movie-meta{display:flex;gap:8px;font-size:12px;color:var(--text2)}

/* Catalog add form */
.add-card{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;align-items:center}
.cat-select{padding:12px;background:var(--card2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px}
.del-btn{margin-top:8px;padding:4px 10px;background:rgba(239,68,68,.15);border:none;border-radius:6px;color:var(--red);cursor:pointer;font-size:12px}

/* Chat */
.cb2{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);display:flex;flex-direction:column;height:calc(100vh - 160px)}
.cms{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.cm{max-width:80%;padding:12px 16px;border-radius:12px;font-size:14px;line-height:1.6}
.cm.ai{background:var(--card2);border:1px solid var(--border);align-self:flex-start}
.cm.user{background:linear-gradient(135deg,rgba(0,212,255,.2),rgba(124,58,237,.2));align-self:flex-end}
.cb{display:block;font-size:11px;font-weight:600;color:var(--accent);margin-bottom:6px}
.caps{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.cap{padding:6px 12px;background:var(--bg);border:1px solid var(--border);border-radius:16px;font-size:12px;cursor:pointer;transition:all .2s}
.cap:hover{border-color:var(--accent);color:var(--accent)}
.cin{display:flex;gap:8px;padding:12px 16px;border-top:1px solid var(--border)}
.ci{flex:1;padding:10px 14px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;outline:none}
.ci:focus{border-color:var(--accent)}
.sn2{padding:10px 16px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:8px;color:#fff;font-weight:600;cursor:pointer}

/* TV */
.tvm{margin-bottom:20px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);height:300px;display:flex;align-items:center;justify-content:center}
.tvo{width:80px;height:80px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:32px}
.cg{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.ch3{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;cursor:pointer;transition:all .2s}
.ch3:hover{border-color:var(--accent);transform:translateY(-2px)}
.ci2{font-size:32px;margin-bottom:8px}
.cn{font-size:14px;font-weight:600}
.cs{font-size:12px;color:var(--green);margin-top:4px}

/* Workers grid */
.wgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
.wi{display:flex;gap:16px;padding:16px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius)}
.wic{font-size:28px;width:48px;height:48px;display:flex;align-items:center;justify-content:center;background:var(--card2);border-radius:12px}
.winf{flex:1}
.winf h3{font-size:14px;font-weight:600;margin-bottom:2px}
.winf p{font-size:12px;color:var(--text2);margin-bottom:6px}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600}
.badge.on{background:rgba(34,197,94,.15);color:var(--green)}

/* Mobile */
@media(max-width:768px){
  .side{transform:translateX(-100%);transition:transform .3s}
  .main{margin-left:0}
  .gr{grid-template-columns:1fr}
  .grid-movies,.grid-books{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}
}

/* LIVE TV */
.tv-player{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:16px}
.tv-player-inner{width:100%;height:400px;display:flex;align-items:center;justify-content:center;background:#000;position:relative}
.tv-placeholder{display:flex;flex-direction:column;align-items:center;gap:12px;color:var(--text2)}
.tv-now-playing{display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--card2);border-top:1px solid var(--border)}
.tv-live-badge{color:var(--red);font-weight:700;font-size:13px;animation:blink 1.5s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}
.tv-groups{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.tv-gf{padding:6px 14px;border:1px solid var(--border);border-radius:20px;background:var(--card);color:var(--text2);font-size:12px;cursor:pointer;transition:all .2s}
.tv-gf:hover{border-color:var(--accent);color:var(--text)}
.tv-gf.on{background:var(--accent);color:#000;border-color:var(--accent);font-weight:600}
.tv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.tv-card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:10px}
.tv-card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,212,255,.1)}
.tv-logo{width:48px;height:48px;border-radius:8px;object-fit:cover;background:var(--card2)}
.tv-logo-placeholder{width:48px;height:48px;border-radius:8px;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:24px}
.tv-card-info{flex:1;min-width:0}
.tv-card-name{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tv-card-group{font-size:11px;color:var(--text2);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tv-hindi-badge{font-size:11px;margin-top:4px;display:inline-block}
`;
const APP_JS = `(function(){
'use strict';

// ============================================================
// JDUB Hub — Enhanced Frontend
// All free services connected
// ============================================================
const API = window.location.hostname.includes('workers.dev')
  ? '' // same origin
  : 'https://jdub-deploy.njcreative123.workers.dev'; // Cloudflare Worker URL

let tgData = [];
let startTime = Date.now();

// Loader
window.addEventListener('load', function(){
  setTimeout(function(){
    document.getElementById('loader').classList.add('hid');
    document.getElementById('app').classList.add('vis');
    startUptime();
    loadTrending();
  }, 2500);
});

// Navigation
window.go = function(p) {
  document.querySelectorAll('.pg').forEach(function(e){ e.classList.remove('on') });
  document.querySelectorAll('.nb').forEach(function(e){ e.classList.remove('on') });
  var pg = document.getElementById('p-' + p);
  if (pg) pg.classList.add('on');
  var btn = document.querySelector('[data-p="' + p + '"]');
  if (btn) btn.classList.add('on');
  // Load data per page
  if (p === 'search') initSearch();
  if (p === 'catalog') loadCatalog();
};

// Uptime counter
function startUptime() {
  setInterval(function() {
    var d = Date.now() - startTime;
    var m = Math.floor(d / 60000);
    var h = Math.floor(m / 60);
    if (h > 0) document.getElementById('sUp').textContent = h + 'h' + (m % 60) + 'm';
    else document.getElementById('sUp').textContent = m + 'm';
  }, 10000);
}

// ============================================================
// SEARCH — combined search (movies + books + catalog)
// ============================================================
function initSearch() {
  var q = document.getElementById('searchInput');
  if (q) q.focus();
}

window.searchContent = async function() {
  var q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  var resultsDiv = document.getElementById('searchResults');
  resultsDiv.innerHTML = '<div class="loading">🔍 Searching movies, books & catalog...</div>';

  try {
    var resp = await fetch(API + '/api/search?q=' + encodeURIComponent(q));
    var data = await resp.json();
    
    if (data.results && data.results.length > 0) {
      var html = '<div class="sr-count">' + data.results.length + ' results for "' + q + '"</div>';
      data.results.forEach(function(r) {
        html += '<div class="sr-card">';
        if (r.image) html += '<img src="' + r.image + '" class="sr-img" alt="' + (r.title || '') + '">';
        html += '<div class="sr-info">';
        html += '<h3>' + (r.title || 'Untitled') + '</h3>';
        html += '<div class="sr-meta">';
        html += '<span class="badge-t ' + r.source + '">' + getSourceLabel(r.source) + '</span>';
        if (r.type) html += '<span class="badge-t ' + r.type + '">' + r.type + '</span>';
        if (r.year) html += '<span>' + r.year + '</span>';
        if (r.rating) html += '<span>⭐ ' + r.rating + '</span>';
        html += '</div>';
        if (r.author) html += '<p>by ' + r.author + '</p>';
        if (r.overview) html += '<p class="sr-overview">' + r.overview.substring(0, 150) + '...</p>';
        if (r.read_url) html += '<a href="' + r.read_url + '" target="_blank" class="sr-link">📖 Read on Open Library</a>';
        html += '</div></div>';
      });
      resultsDiv.innerHTML = html;
    } else {
      resultsDiv.innerHTML = '<div class="sr-empty">No results found for "' + q + '". Try different keywords.</div>';
    }
  } catch(e) {
    resultsDiv.innerHTML = '<div class="sr-error">⚠️ Worker offline. Using local mode.</div>';
    searchLocal(q, resultsDiv);
  }
};

function getSourceLabel(s) {
  var map = { tmdb: '🎬 Movie', openlibrary: '📚 Book', catalog: '📁 Catalog' };
  return map[s] || s;
}

function searchLocal(q, div) {
  div.innerHTML += '<div class="sr-empty">Worker se connect nahi ho paya. Try again later.</div>';
}

// ============================================================
// MOVIES — load from TMDB via Worker
// ============================================================
window.loadMovies = async function(type) {
  type = type || 'popular';
  var container = document.getElementById('moviesGrid');
  if (container) container.innerHTML = '<div class="loading">🎬 Loading movies...</div>';
  
  try {
    var resp = await fetch(API + '/api/movies?type=' + type);
    var data = await resp.json();
    if (data.results && container) {
      var html = '';
      data.results.forEach(function(m) {
        html += '<div class="movie-card">';
        if (m.image) html += '<img src="' + m.image + '" class="movie-poster" alt="' + m.title + '">';
        html += '<div class="movie-info">';
        html += '<h4>' + m.title + '</h4>';
        html += '<div class="movie-meta">';
        if (m.rating) html += '<span>⭐ ' + m.rating + '</span>';
        if (m.year) html += '<span>' + m.year + '</span>';
        html += '</div></div></div>';
      });
      container.innerHTML = html;
    }
  } catch(e) {
    if (container) container.innerHTML = '<div class="sr-error">Movies load nahi ho payi.</div>';
  }
};

// ============================================================
// BOOKS — Open Library via Worker
// ============================================================
window.loadBooks = async function(q) {
  q = q || 'famous';
  var container = document.getElementById('booksGrid');
  if (container) container.innerHTML = '<div class="loading">📚 Loading books...</div>';
  
  try {
    var resp = await fetch(API + '/api/books?q=' + encodeURIComponent(q));
    var data = await resp.json();
    if (data.results && container) {
      var html = '';
      data.results.forEach(function(b) {
        html += '<div class="book-card">';
        if (b.cover) html += '<img src="' + b.cover + '" class="book-cover" alt="' + b.title + '">';
        html += '<div class="book-info">';
        html += '<h4>' + b.title + '</h4>';
        html += '<p>' + (b.author || '') + ' ' + (b.year ? '(' + b.year + ')' : '') + '</p>';
        if (b.read_url) html += '<a href="' + b.read_url + '" target="_blank" class="sr-link">📖 Read Free</a>';
        html += '</div></div>';
      });
      container.innerHTML = html;
    }
  } catch(e) {
    if (container) container.innerHTML = '<div class="sr-error">Books load nahi ho payi.</div>';
  }
};

// ============================================================
// TRENDING — load combined trending
// ============================================================
window.loadTrending = async function() {
  try {
    var resp = await fetch(API + '/api/trending');
    var data = await resp.json();
    var mCount = (data.movies || []).length;
    var bCount = (data.books || []).length;
    document.getElementById('sMed').textContent = (mCount + bCount);
    document.getElementById('sMsg').textContent = '✅';
  } catch(e) {
    document.getElementById('sMsg').textContent = '—';
  }
};

// ============================================================
// CATALOG — D1 database content
// ============================================================
window.loadCatalog = async function() {
  var container = document.getElementById('catalogList');
  if (!container) return;
  container.innerHTML = '<div class="loading">Loading catalog...</div>';
  
  try {
    var resp = await fetch(API + '/api/catalog');
    var data = await resp.json();
    if (data.results && data.results.length) {
      var html = '<div class="sr-count">' + data.results.length + ' items in catalog</div>';
      data.results.forEach(function(item) {
        html += '<div class="sr-card">';
        if (item.image) html += '<img src="' + item.image + '" class="sr-img" alt="' + item.title + '">';
        html += '<div class="sr-info">';
        html += '<h3>' + item.title + '</h3>';
        html += '<div class="sr-meta">';
        html += '<span class="badge-t ' + item.type + '">' + item.type + '</span>';
        if (item.year) html += '<span>' + item.year + '</span>';
        if (item.rating) html += '<span>⭐ ' + item.rating + '</span>';
        html += '</div>';
        if (item.description) html += '<p>' + item.description.substring(0, 100) + '</p>';
        html += '<button onclick="deleteCatalog(' + item.id + ')" class="del-btn">🗑️</button>';
        html += '</div></div>';
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = '<div class="sr-empty">Catalog khali hai. Items add karo!</div>';
    }
  } catch(e) {
    container.innerHTML = '<div class="sr-error">Catalog load nahi ho paya.</div>';
  }
};

window.addToCatalog = async function() {
  var title = document.getElementById('catTitle').value.trim();
  var type = document.getElementById('catType').value;
  var desc = document.getElementById('catDesc').value.trim();
  if (!title) return alert('Title zaroori hai!');
  
  try {
    await fetch(API + '/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title, type: type, description: desc })
    });
    document.getElementById('catTitle').value = '';
    document.getElementById('catDesc').value = '';
    loadCatalog();
  } catch(e) {
    alert('Add failed: ' + e.message);
  }
};

window.deleteCatalog = async function(id) {
  if (!confirm('Delete this item?')) return;
  try {
    await fetch(API + '/api/catalog/item?id=' + id, { method: 'DELETE' });
    loadCatalog();
  } catch(e) {}
};

// ============================================================
// AI CHAT — worker AI router
// ============================================================
window.chat = async function(msg) {
  if (!msg || !msg.trim()) return;
  msg = msg.trim();
  var msgs = document.getElementById('cMsgs') || document.getElementById('qChat');
  if (!msgs) return;
  
  // Add user message
  msgs.innerHTML += '<div class="cm user"><span class="cb">👤 YOU</span><p>' + escHtml(msg) + '</p></div>';
  
  try {
    var resp = await fetch(API + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    var data = await resp.json();
    msgs.innerHTML += '<div class="cm ai"><span class="cb">' + (data.icon || '⚡') + ' ' + (data.worker || 'MAIN').toUpperCase() + '</span><p>' + escHtml(data.response || 'No response') + '</p></div>';
  } catch(e) {
    msgs.innerHTML += '<div class="cm ai"><span class="cb">⚡ MAIN AI</span><p>Worker se connect nahi ho paya. Try again! 🔌</p></div>';
  }
  
  msgs.scrollTop = msgs.scrollHeight;
};

window.qSend = function() {
  var input = document.getElementById('qIn');
  if (input && input.value.trim()) {
    window.chat(input.value);
    input.value = '';
  }
};

// ============================================================
// UTILITIES
// ============================================================
function escHtml(s) {
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

})();

// ============================================================
// TABS — movie & book tab switching
// ============================================================
window.switchMovieTab = function(btn, type) {
  document.querySelectorAll('#p-movies .tabb').forEach(function(b){ b.classList.remove('on') });
  btn.classList.add('on');
  window.loadMovies(type);
};

window.switchBookTab = function(btn, q) {
  document.querySelectorAll('#p-books .tabb').forEach(function(b){ b.classList.remove('on') });
  btn.classList.add('on');
  window.loadBooks(q);
};

// Load on page show
window.go = (function(orig){
  return function(p) {
    orig(p);
    if (p === 'movies') window.loadMovies('popular');
    if (p === 'books') window.loadBooks('famous');
  };
})(window.go);

// ============================================================
// LIVE TV — IPTV channels with player
// ============================================================
let tvData = { channels: [], hindi: [], other: [] };
let tvCurrentGroup = 'all';

window.loadLiveTV = async function() {
  var container = document.getElementById('tvChannels');
  if (!container) return;
  container.innerHTML = '<div class="loading">📺 Loading channels...</div>';

  try {
    var resp = await fetch(API + '/api/live-tv');
    var data = await resp.json();
    
    tvData = data;
    document.getElementById('tvCount').textContent = data.total || 0;
    
    // Build group filters
    var groupsHtml = '<button class="tv-gf on" onclick="filterTVGroup(\\'all\\',this)">All (' + data.total + ')</button>';
    groupsHtml += '<button class="tv-gf" onclick="filterTVGroup(\\'hindi\\',this)">🇮🇳 Hindi (' + data.hindi + ')</button>';
    if (data.groups) {
      var sorted = Object.entries(data.groups).sort((a,b) => b[1]-a[1]).slice(0, 15);
      sorted.forEach(function(g) {
        groupsHtml += '<button class="tv-gf" onclick="filterTVGroup(\\'' + g[0].replace(/'/g,"\\\\'") + '\\',this)">' + g[0] + ' (' + g[1] + ')</button>';
      });
    }
    document.getElementById('tvGroups').innerHTML = groupsHtml;

    renderTVChannels(data.channels || []);
  } catch(e) {
    container.innerHTML = '<div class="sr-error">⚠️ Channels load nahi ho paye. Try again.</div>';
  }
};

function renderTVChannels(channels) {
  var container = document.getElementById('tvChannels');
  if (!channels.length) {
    container.innerHTML = '<div class="sr-empty">Koi channel nahi mila.</div>';
    return;
  }
  var html = '<div class="tv-grid">';
  channels.forEach(function(ch, i) {
    html += '<div class="tv-card" onclick="playTVChannel(' + i + ')" title="' + escHtml(ch.name) + '">';
    if (ch.logo) html += '<img src="' + ch.logo + '" class="tv-logo" onerror="this.style.display=\\'none\\'">';
    else html += '<div class="tv-logo-placeholder">📺</div>';
    html += '<div class="tv-card-info">';
    html += '<div class="tv-card-name">' + escHtml(ch.name) + '</div>';
    html += '<div class="tv-card-group">' + escHtml(ch.group) + '</div>';
    if (ch.hindi) html += '<span class="tv-hindi-badge">🇮🇳</span>';
    html += '</div></div>';
  });
  html += '</div>';
  container.innerHTML = html;
}

window.playTVChannel = function(index) {
  var ch = tvData.channels[index];
  if (!ch || !ch.url) return;

  var video = document.getElementById('tvVideo');
  var placeholder = document.getElementById('tvPlaceholder');
  var nowPlaying = document.getElementById('tvNowPlaying');
  var channelName = document.getElementById('tvChannelName');

  // Try playing through proxy for CORS
  var playUrl = API ? API + '/api/live-tv/stream?url=' + encodeURIComponent(ch.url) : ch.url;

  video.src = playUrl;
  video.style.display = 'block';
  placeholder.style.display = 'none';
  nowPlaying.style.display = 'flex';
  channelName.textContent = ch.name;

  video.play().catch(function(e) {
    // If proxy fails, try direct
    console.log('Proxy failed, trying direct:', e);
    video.src = ch.url;
    video.play().catch(function(e2) {
      placeholder.innerHTML = '<span style="font-size:48px">❌</span><p>Channel play nahi ho raha</p><p style="font-size:12px;color:var(--text2)">' + e2.message + '</p>';
      placeholder.style.display = 'flex';
      video.style.display = 'none';
      nowPlaying.style.display = 'none';
    });
  });
};

window.filterTVGroup = function(group, btn) {
  tvCurrentGroup = group;
  document.querySelectorAll('.tv-gf').forEach(function(b){ b.classList.remove('on') });
  if (btn) btn.classList.add('on');
  filterTVChannels();
};

window.filterTVChannels = function() {
  var search = (document.getElementById('tvSearch')?.value || '').toLowerCase();
  var filtered = (tvData.channels || []).filter(function(ch) {
    var matchGroup = tvCurrentGroup === 'all' || 
      (tvCurrentGroup === 'hindi' && ch.hindi) ||
      ch.group.toLowerCase() === tvCurrentGroup.toLowerCase();
    var matchSearch = !search || ch.name.toLowerCase().includes(search) || ch.group.toLowerCase().includes(search);
    return matchGroup && matchSearch;
  });
  renderTVChannels(filtered);
};

// Auto-load TV when page shown
window.go = (function(orig){
  return function(p) {
    orig(p);
    if (p === 'tv') window.loadLiveTV();
    if (p === 'movies') window.loadMovies('popular');
    if (p === 'books') window.loadBooks('famous');
  };
})(window.go);
`;

function serveStatic(path) {
  if (path === '/' || path === '/index.html') {
    return new Response(INDEX_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
  }
  if (path === '/css/style.css') {
    return new Response(STYLE_CSS, { headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
  }
  if (path === '/js/app.js') {
    return new Response(APP_JS, { headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
  }
  return null;
}

const json = (data, status = 200) => new Response(
  JSON.stringify(data),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
);

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDailySync(env));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    trackAnalytics(env, path);

    // Serve static frontend
    const staticResp = serveStatic(path);
    if (staticResp) return staticResp;

    let route;
    
    if (path === '/api/health' || path === '/api/status') {
      route = handleStatus(env);
    }
    else if (path === '/api/chat' && method === 'POST') {
      route = handleChat(request, env);
    }
    else if (path === '/api/search') {
      route = handleSearch(url, env);
    }
    else if (path === '/api/movies') {
      route = handleMovies(url, env);
    }
    else if (path === '/api/books') {
      route = handleBooks(url, env);
    }
    else if (path === '/api/trending') {
      route = handleTrending(env);
    }
    else if (path === '/api/live-tv') {
      route = handleLiveTV(url, env);
    }
    else if (path === '/api/live-tv/stream') {
      route = handleLiveTVStream(url, env);
    }
    else if (path === '/api/telegram/webhook' && method === 'POST') {
      route = handleTelegramWebhook(request, env);
    }
    else if (path === '/api/catalog' && method === 'GET') {
      route = handleCatalogList(url, env);
    }
    else if (path === '/api/catalog' && method === 'POST') {
      route = handleCatalogAdd(request, env);
    }
    else if (path === '/api/catalog/item' && method === 'DELETE') {
      route = handleCatalogDelete(url, env);
    }
    else if (path.startsWith('/api/media/upload') && method === 'PUT') {
      route = handleMediaUpload(request, env);
    }
    else if (path.startsWith('/api/media/') && method === 'GET') {
      route = handleMediaGet(path, env);
    }
    else if (path === '/api/analytics') {
      route = handleAnalytics(env);
    }
    else if (path === '/api/cache') {
      route = handleCacheDemo(env);
    }
    else {
      route = json({
        service: 'jdub-hub-worker',
        version: '3.1.0',
        endpoints: [
          '/api/health', '/api/status',
          '/api/search?q=', '/api/movies', '/api/books',
          '/api/trending', '/api/live-tv', '/api/live-tv/stream?url=',
          '/api/catalog', '/api/analytics', '/api/cache',
          '/api/telegram/webhook'
        ]
      });
    }
    return route;
  }
};

// ============================================================
// ANALYTICS
// ============================================================
function trackAnalytics(env, path) {
  try {
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: [path, 'jdub-hub'],
        doubles: [1],
        indexes: ['pageview']
      });
    }
  } catch (e) {}
}

// ============================================================
// STATUS
// ============================================================
async function handleStatus(env) {
  const services = {
    main: 'online', workers: 6,
    kv: env.CACHE ? 'connected' : 'not_configured',
    d1: env.CATALOG_DB ? 'connected' : 'not_configured',
    r2: env.MEDIA_BUCKET ? 'connected' : 'not_configured',
    cron: 'scheduled', analytics: 'configured',
    tmdb: 'api_ready', openlibrary: 'api_ready',
    livetv: 'ready', telegram: 'webhook_ready'
  };

  if (env.CACHE) {
    try {
      await env.CACHE.put('health_check', Date.now().toString());
      const t = await env.CACHE.get('health_check');
      services.kv = t ? 'connected_live' : 'connected';
    } catch (e) {}
  }
  if (env.CATALOG_DB) {
    try {
      await env.CATALOG_DB.prepare('SELECT 1 AS ok').first();
      services.d1 = 'connected_live';
    } catch (e) {}
  }

  return json({ status: 'ok', service: 'jdub-hub', version: '3.1.0', uptime: Date.now(), services });
}

// ============================================================
// SEARCH
// ============================================================
async function handleSearch(url, env) {
  const q = url.searchParams.get('q');
  if (!q) return json({ error: 'q param required' }, 400);

  // KV cache
  if (env.CACHE) {
    const cached = await env.CACHE.get('search_' + q.toLowerCase());
    if (cached) return json(JSON.parse(cached));
  }

  const results = { movies: [], books: [], catalog: [] };

  // D1 catalog
  if (env.CATALOG_DB) {
    try {
      await initCatalogTable(env.CATALOG_DB);
      const { results: dbResults } = await env.CATALOG_DB.prepare(
        "SELECT * FROM catalog WHERE title LIKE ?1 OR description LIKE ?1 LIMIT 10"
      ).bind('%' + q + '%').all();
      results.catalog = dbResults;
    } catch (e) {}
  }

  // TMDB
  if (env.TMDB_KEY) {
    try {
      const resp = await fetch(
        `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&api_key=${env.TMDB_KEY}&language=hi-IN`
      );
      const data = await resp.json();
      results.movies = (data.results || []).slice(0, 10).map(r => ({
        id: r.id, title: r.title || r.name,
        type: r.media_type === 'movie' ? 'movie' : 'tv',
        rating: r.vote_average, image: r.poster_path ? `https://image.tmdb.org/t/p/w300${r.poster_path}` : '',
        year: (r.release_date || r.first_air_date || '').substring(0, 4),
        overview: r.overview || ''
      }));
    } catch (e) {}
  }

  // Open Library
  try {
    const resp = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10`);
    const data = await resp.json();
    results.books = (data.docs || []).slice(0, 10).map(b => ({
      title: b.title, author: (b.author_name || [])[0] || 'Unknown',
      year: (b.first_publish_year || ''), cover: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : '',
      key: b.key, read_url: `https://openlibrary.org${b.key}`
    }));
  } catch (e) {}

  // Cache 5 min
  if (env.CACHE) {
    await env.CACHE.put('search_' + q.toLowerCase(), JSON.stringify(results), { expirationTtl: 300 });
  }

  return json(results);
}

// ============================================================
// MOVIES
// ============================================================
async function handleMovies(url, env) {
  const type = url.searchParams.get('type') || 'popular';
  if (!env.TMDB_KEY) return json({ error: 'TMDB key not set' }, 500);

  if (env.CACHE) {
    const cached = await env.CACHE.get('movies_' + type);
    if (cached) return json({ type, results: JSON.parse(cached) });
  }

  try {
    const resp = await fetch(
      `https://api.themoviedb.org/3/movie/${type}?language=hi-IN&page=1&api_key=${env.TMDB_KEY}`
    );
    const data = await resp.json();
    const results = (data.results || []).map(r => ({
      id: r.id, title: r.title, rating: r.vote_average,
      image: r.poster_path ? `https://image.tmdb.org/t/p/w300${r.poster_path}` : '',
      year: (r.release_date || '').substring(0, 4), overview: r.overview || ''
    }));

    if (env.CACHE) {
      await env.CACHE.put('movies_' + type, JSON.stringify(results), { expirationTtl: 7200 });
    }
    return json({ type, results });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// ============================================================
// BOOKS
// ============================================================
async function handleBooks(url, env) {
  const q = url.searchParams.get('q') || 'famous';
  
  if (env.CACHE) {
    const cached = await env.CACHE.get('books_' + q.toLowerCase());
    if (cached) return json({ results: JSON.parse(cached) });
  }

  try {
    const resp = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20`);
    const data = await resp.json();
    const results = (data.docs || []).map(b => ({
      title: b.title, author: (b.author_name || [])[0] || 'Unknown',
      year: b.first_publish_year || '', cover: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : '',
      key: b.key, read_url: `https://openlibrary.org${b.key}`
    }));

    if (env.CACHE) {
      await env.CACHE.put('books_' + q.toLowerCase(), JSON.stringify(results), { expirationTtl: 7200 });
    }
    return json({ results });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// ============================================================
// TRENDING
// ============================================================
async function handleTrending(env) {
  if (env.CACHE) {
    const cached = await env.CACHE.get('trending_movies');
    if (cached) return json({ movies: JSON.parse(cached) });
  }

  let movies = [];
  if (env.TMDB_KEY) {
    try {
      const resp = await fetch(
        `https://api.themoviedb.org/3/trending/all/week?language=hi-IN&api_key=${env.TMDB_KEY}`
      );
      const data = await resp.json();
      movies = (data.results || []).map(r => ({
        id: r.id, title: r.title || r.name, type: r.media_type,
        rating: r.vote_average,
        image: r.poster_path ? `https://image.tmdb.org/t/p/w300${r.poster_path}` : ''
      }));
    } catch (e) {}
  }
  return json({ movies });
}

// ============================================================
// LIVE TV — Free IPTV (Hindi priority)
// ============================================================
const IPTV_SOURCES = [
  { name: 'India', url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u' },
  { name: 'World', url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/all.m3u' }
];

const HINDI_KEYWORDS = [
  'hindi', 'india', 'star plus', 'sony', 'zee', 'colors', 'and tv', 'sab',
  'news18', 'ndtv', 'aaj tak', 'abp', 'zee news', 'republic', 'times now',
  'ndtv india', 'dangal', 'rishtey', 'big magic', 'sony sab', 'star bharat',
  'set max', 'sony max', 'zee cinema', 'zee action', 'marathi', 'bhojpuri',
  'punjabi', 'tamil', 'telugu', 'kannada', 'malayalam', 'bengali', 'gujarati',
  'tv9', 'republic bharat', 'news nation', 'india tv', 'zeal', 'zoom',
  'bindass', 'colours', 'star gold', 'sony wah', 'zee anmol',
  // Popular Indian channel names from iptv-org
  '9x', 'zoom', 'bindass', 'channel v', 'mtv', 'uttam', 'khushiyon',
  'dangal', 'rishtey', 'big magic', 'sony pal', 'sahara', 'astha',
  'aajtak', 'aaj tak', 'republic', 'news24', 'india news', 'india tv',
  'India', 'IN@', '.in@', 'zee bangla', 'star jalsha', 'emami',
  'sun tv', 'gemini', ' Asianet', 'mazhavil', 'kairali', 'flowers',
  'zee tamil', 'star vijay', 'kalanjiyam', 'adithya', 'manorama',
  'mathrubhumi', 'powder', 'j Movies', 'jio cinema', 'jiocinema',
  'monsoon', 'hindi', 'bollywood', 'desi', 'Tashan', 'Jhakaas',
  'Jalwa', 'Music', 'Bhakti', 'Satsang', 'Divya', 'Sudarshan',
  'News18', 'TV9', 'NDTV', 'Republic', 'Times', 'India',
  'Colors', 'Star', 'Sony', 'Zee', 'SET', 'Sab', 'And'
];

function isHindi(name, group) {
  const text = (name + ' ' + group).toLowerCase();
  // India group = Hindi priority
  if (group === 'India') return true;
  return HINDI_KEYWORDS.some(k => text.includes(k.toLowerCase()));
}

async function parseM3U(text) {
  const lines = text.split('\n');
  const channels = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#EXTINF:')) {
      // Find the next non-comment, non-empty line (the URL)
      let url = '';
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const l = lines[j].trim();
        if (l && !l.startsWith('#')) { url = l; break; }
      }
      if (!url) continue;

      // Name: everything after the last comma
      const commaIdx = line.lastIndexOf(',');
      const name = commaIdx > -1 ? line.substring(commaIdx + 1).trim() : 'Unknown';

      // Group from group-title attribute
      const groupMatch = line.match(/group-title="([^"]+)"/);
      let group = groupMatch ? groupMatch[1] : '';

      // Infer group from tvg-id if no group-title
      if (!group) {
        const tvgMatch = line.match(/tvg-id="([^"]+)"/);
        if (tvgMatch) {
          const tvgId = tvgMatch[1];
          // Extract country from tvg-id like "AajTak.in@SD"
          const countryMatch = tvgId.match(/\.([a-z]{2})@/i);
          if (countryMatch) {
            const cc = countryMatch[1].toUpperCase();
            if (cc === 'IN') group = 'India';
            else if (cc === 'US') group = 'USA';
            else if (cc === 'GB') group = 'UK';
            else group = cc;
          }
        }
      }
      if (!group) group = 'Other';

      // Logo
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const logo = logoMatch ? logoMatch[1] : '';

      channels.push({ name, group, logo, url });
    }
  }
  return channels;
}

async function handleLiveTV(url, env) {
  const cacheKey = 'live_tv_v2';
  if (env.CACHE) {
    const cached = await env.CACHE.get(cacheKey);
    if (cached) return json(JSON.parse(cached));
  }

  const allChannels = [];
  const errors = [];

  for (const source of IPTV_SOURCES) {
    try {
      const resp = await fetch(source.url, {
        headers: { 'User-Agent': 'JDUB-Hub/3.1' },
        cf: { cacheTtl: 3600 }
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      const channels = await parseM3U(text);
      for (const ch of channels) {
        ch.source = source.name;
        ch.hindi = isHindi(ch.name, ch.group);
        allChannels.push(ch);
      }
    } catch (e) {
      errors.push({ source: source.name, error: e.message });
    }
  }

  allChannels.sort((a, b) => (a.hindi ? 0 : 1) - (b.hindi ? 0 : 1));

  const hindiChannels = allChannels.filter(ch => ch.hindi);
  const otherChannels = allChannels.filter(ch => !ch.hindi);
  const groups = {};
  for (const ch of allChannels) {
    if (!groups[ch.group]) groups[ch.group] = 0;
    groups[ch.group]++;
  }

  const result = {
    total: allChannels.length,
    hindi: hindiChannels.length,
    other: otherChannels.length,
    groups,
    channels: [...hindiChannels.slice(0, 150), ...otherChannels.slice(0, 150)],
    errors
  };

  if (env.CACHE) {
    await env.CACHE.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });
  }
  return json(result);
}

async function handleLiveTVStream(url, env) {
  const streamUrl = url.searchParams.get('url');
  if (!streamUrl) return json({ error: 'url param required' }, 400);
  try {
    const resp = await fetch(streamUrl, {
      headers: { 'User-Agent': 'JDUB-Hub/3.1' },
      cf: { cacheTtl: 60 }
    });
    return new Response(resp.body, {
      status: resp.status,
      headers: {
        'Content-Type': resp.headers.get('Content-Type') || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (e) {
    return json({ error: e.message }, 502);
  }
}

// ============================================================
// TELEGRAM WEBHOOK
// ============================================================
async function handleTelegramWebhook(request, env) {
  try {
    const update = await request.json();
    const msg = update.message;
    if (!msg || !msg.text) return json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text.trim().toLowerCase();
    let reply = '';

    if (text === '/start') {
      reply = '⚡ *JDUB Hub Bot*\n\nCommands:\n/movies — Trending movies\n/books <query> — Book search\n/search <query> — Full search\n/live — Live TV channels\n/status — System status';
    } else if (text === '/movies') {
      reply = `🎬 Trending:\n${env.WORKER_URL || 'https://jdub-hub-worker.njcreative123.workers.dev'}/api/movies?type=popular`;
    } else if (text.startsWith('/books')) {
      const q = text.replace('/books', '').trim() || 'famous';
      reply = `📚 Results:\n${env.WORKER_URL || 'https://jdub-hub-worker.njcreative123.workers.dev'}/api/books?q=${encodeURIComponent(q)}`;
    } else if (text.startsWith('/search')) {
      const q = text.replace('/search', '').trim();
      reply = `🔍 Results:\n${env.WORKER_URL || 'https://jdub-hub-worker.njcreative123.workers.dev'}/api/search?q=${encodeURIComponent(q)}`;
    } else if (text === '/live') {
      reply = `📺 Live TV:\n${env.WORKER_URL || 'https://jdub-hub.njcreative123.workers.dev'}`;
    } else if (text === '/status') {
      reply = `📊 System: Online\nKV: ${env.CACHE ? 'OK' : 'No'}\nD1: ${env.CATALOG_DB ? 'OK' : 'No'}`;
    } else {
      reply = 'Commands: /start /movies /books /search /live /status';
    }

    if (env.TELEGRAM_BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: reply, parse_mode: 'Markdown' })
      });
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// ============================================================
// CATALOG — D1
// ============================================================
async function initCatalogTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'movie',
    description TEXT,
    image TEXT,
    link TEXT,
    year TEXT,
    rating REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
}

async function handleCatalogList(url, env) {
  if (!env.CATALOG_DB) return json({ results: [], error: 'D1 not configured' });
  try {
    await initCatalogTable(env.CATALOG_DB);
    const type = url.searchParams.get('type');
    const sql = type
      ? 'SELECT * FROM catalog WHERE type = ?1 ORDER BY created_at DESC LIMIT 50'
      : 'SELECT * FROM catalog ORDER BY created_at DESC LIMIT 50';
    const { results } = type
      ? await env.CATALOG_DB.prepare(sql).bind(type).all()
      : await env.CATALOG_DB.prepare(sql).all();
    return json({ results });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function handleCatalogAdd(request, env) {
  if (!env.CATALOG_DB) return json({ error: 'D1 not configured' }, 500);
  try {
    const item = await request.json();
    if (!item.title) return json({ error: 'title required' }, 400);
    await initCatalogTable(env.CATALOG_DB);
    await env.CATALOG_DB.prepare(
      'INSERT INTO catalog (title, type, description, image, link, year, rating) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)'
    ).bind(item.title, item.type || 'movie', item.description || '', item.image || '', item.link || '', item.year || '', Number(item.rating) || 0).run();
    if (env.CACHE) await env.CACHE.delete('catalog_list');
    return json({ ok: true, added: item.title });
  } catch (e) { return json({ error: e.message }, 500); }
}

async function handleCatalogDelete(url, env) {
  if (!env.CATALOG_DB) return json({ error: 'D1 not configured' }, 500);
  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'id required' }, 400);
    await env.CATALOG_DB.prepare('DELETE FROM catalog WHERE id = ?1').bind(id).run();
    return json({ ok: true, deleted: id });
  } catch (e) { return json({ error: e.message }, 500); }
}

// ============================================================
// MEDIA — R2
// ============================================================
async function handleMediaUpload(request, env) {
  if (!env.MEDIA_BUCKET) return json({ error: 'R2 not configured' }, 500);
  const url = new URL(request.url);
  const filename = url.pathname.split('/').pop();
  try {
    await env.MEDIA_BUCKET.put(filename, request.body, {
      httpMetadata: { contentType: request.headers.get('Content-Type') || 'application/octet-stream' }
    });
    return json({ ok: true, filename, url: `/api/media/${filename}` });
  } catch (e) { return json({ error: e.message }, 500); }
}

async function handleMediaGet(path, env) {
  if (!env.MEDIA_BUCKET) return json({ error: 'R2 not configured' }, 500);
  const filename = path.replace('/api/media/', '');
  try {
    const object = await env.MEDIA_BUCKET.get(filename);
    if (!object) return json({ error: 'not found' }, 404);
    return new Response(object.body, {
      headers: { 'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000' }
    });
  } catch (e) { return json({ error: e.message }, 500); }
}

// ============================================================
// ANALYTICS
// ============================================================
async function handleAnalytics(env) {
  let pageviews = 0;
  if (env.CACHE) pageviews = Number(await env.CACHE.get('pageview_counter')) || 0;
  return json({ service: 'cloudflare_analytics_engine', status: env.ANALYTICS ? 'enabled' : 'not_configured', pageviews_approximate: pageviews });
}

// ============================================================
// KV CACHE
// ============================================================
async function handleCacheDemo(env) {
  if (!env.CACHE) return json({ error: 'KV not configured' }, 500);
  const current = Number(await env.CACHE.get('demo_counter')) || 0;
  await env.CACHE.put('demo_counter', (current + 1).toString());
  await env.CACHE.put('pageview_counter', (Number(await env.CACHE.get('pageview_counter')) || 0) + 1);
  return json({ counter: current + 1, kv_status: 'online' });
}

// ============================================================
// DAILY SYNC
// ============================================================
async function runDailySync(env) {
  const log = { ts: new Date().toISOString(), synced: [] };
  try {
    const movies = await handleMovies(new URL('https://x/?type=popular'), env);
    const data = await movies.json();
    if (env.CACHE) {
      await env.CACHE.put('trending_movies', JSON.stringify(data.results || []), { expirationTtl: 86400 });
      log.synced.push('trending_movies');
    }
  } catch (e) { log.error = e.message; }
  try {
    const books = await handleBooks(new URL('https://x/?q=popular'), env);
    const data = await books.json();
    if (env.CACHE) {
      await env.CACHE.put('popular_books', JSON.stringify(data.results || []), { expirationTtl: 86400 });
      log.synced.push('popular_books');
    }
  } catch (e) { log.error = e.message; }
  if (env.CACHE) await env.CACHE.put('last_sync', JSON.stringify(log));
  return log;
}
