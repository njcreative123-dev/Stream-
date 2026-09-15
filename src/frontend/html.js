// NJStream v11 — SPA Shell (consolidated navigation)
export const INDEX_HTML = `<!DOCTYPE html>
<html lang="hi" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">
<title>NJStream — Live, Stream, Discover</title>
<meta name="description" content="NJStream — futuristic streaming dashboard: Live TV, Movies, Series, Books, Software, Telegram & AI.">
<meta name="theme-color" content="#060a14">
<meta property="og:title" content="NJStream — Live, Stream, Discover">
<meta property="og:description" content="Your entertainment, knowledge and AI world in one futuristic dashboard.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2220%22 fill=%22%23060a14%22/><text x=%2250%22 y=%2268%22 text-anchor=%22middle%22 font-size=%2240%22 font-weight=%22900%22 fill=%22%2300e5ff%22>NJ</text></svg>">
<link rel="stylesheet" href="/css/style.css?v=11">
<script>var hlsReady=new Promise(function(r){var s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js";s.async=true;s.onload=function(){r(true)};s.onerror=function(){r(false)};document.head.appendChild(s)});</script>
</head>
<body>
<a href="#main" class="skip-link">Skip to main content</a>
<div class="bg-orb bg-orb-1"></div>
<div class="bg-orb bg-orb-2"></div>
<div class="bg-orb bg-orb-3"></div>
<canvas id="particles"></canvas>

<!-- LOADER -->
<div class="loader" id="loader">
  <div class="ld-box">
    <div class="ld-logo">
      <svg width="64" height="64" viewBox="0 0 100 100" fill="none">
        <defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00e5ff"/><stop offset="50%" stop-color="#7c4dff"/><stop offset="100%" stop-color="#00b0ff"/></linearGradient></defs>
        <rect x="8" y="8" width="84" height="84" rx="20" fill="url(#lg)" opacity=".12"/>
        <rect x="12" y="12" width="76" height="76" rx="16" stroke="url(#lg)" stroke-width="2.5" fill="none" opacity=".6"/>
        <text x="50" y="42" text-anchor="middle" font-size="24" font-weight="900" fill="url(#lg)">NJ</text>
        <text x="50" y="68" text-anchor="middle" font-size="15" font-weight="700" fill="#7c4dff">STREAM</text>
        <circle cx="78" cy="22" r="5" fill="#00e5ff" opacity=".5"/><circle cx="22" cy="78" r="3.5" fill="#7c4dff" opacity=".4"/>
      </svg>
    </div>
    <div class="ld-name">NJ<span>Stream</span></div>
    <div class="ld-bar"><div class="ld-fill"></div></div>
    <div class="ld-sub">Initializing services…</div>
  </div>
</div>

<!-- TOP BAR -->
<header class="topbar" id="topbar">
  <div class="tb-left">
    <button class="tb-hamburger" id="tbHamburger" aria-label="Open navigation"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
    <a class="tb-logo" href="#" onclick="NJ.nav('home');return false;">
      <svg width="30" height="30" viewBox="0 0 100 100" fill="none"><defs><linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00e5ff"/><stop offset="100%" stop-color="#7c4dff"/></linearGradient></defs><rect x="10" y="10" width="80" height="80" rx="18" stroke="url(#lg2)" stroke-width="4" fill="none"/><text x="50" y="42" text-anchor="middle" font-size="20" font-weight="900" fill="url(#lg2)">NJ</text><text x="50" y="66" text-anchor="middle" font-size="12" font-weight="700" fill="#7c4dff">STREAM</text></svg>
      <span>NJ<span class="hl">Stream</span></span>
    </a>
  </div>
  <nav class="tb-nav" id="tbNav" aria-label="Primary">
    <button class="tb-link active" data-nav="home">Home</button>
    <button class="tb-link" data-nav="watch">Watch</button>
    <button class="tb-link" data-nav="discover">Discover</button>
    <button class="tb-link" data-nav="library">Library</button>
    <button class="tb-link" data-nav="ai">AI</button>
    <button class="tb-link" data-nav="account">Account</button>
    <button class="tb-link tb-admin" data-nav="admin" style="display:none">Admin</button>
  </nav>
  <div class="tb-right">
    <button class="tb-icon" id="tbSearchBtn" aria-label="Smart search" onclick="NJ.openSearch()"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg></button>
    <button class="tb-icon" id="tbNotifBtn" aria-label="Notifications" onclick="NJ.toggleNotif()"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><span class="tb-notif-dot" id="notifDot"></span></button>
    <button class="tb-avatar" id="tbAvatar" onclick="NJ.nav('account')">👤</button>
  </div>
</header>

<!-- MAIN -->
<main class="main" id="main">

  <!-- HOME -->
  <section class="page active" id="pg-home"></section>

  <!-- WATCH -->
  <section class="page" id="pg-watch">
    <div class="page-header"><h1>🎬 <span class="hl">Watch</span></h1><p class="page-sub">Live TV · Movies · Series · MovieBox · Videos</p></div>
    <div class="tabs-wrap"><div class="tabs" id="watchTabs">
      <button class="tab active" data-tab="live" onclick="NJ.tab('watch','live',this)">📺 Live</button>
      <button class="tab" data-tab="movies" onclick="NJ.tab('watch','movies',this)">🎬 Movies</button>
      <button class="tab" data-tab="series" onclick="NJ.tab('watch','series',this)">📺 Series</button>
      <button class="tab" data-tab="moviebox" onclick="NJ.tab('watch','moviebox',this)">🎥 MovieBox</button>
      <button class="tab" data-tab="videos" onclick="NJ.tab('watch','videos',this)">📹 Videos</button>
    </div></div>
    <div id="watchPane" class="tab-pane"></div>
  </section>

  <!-- DISCOVER -->
  <section class="page" id="pg-discover">
    <div class="page-header"><h1>🔍 <span class="hl">Discover</span></h1><p class="page-sub">Books · Software · Telegram</p></div>
    <div class="tabs-wrap"><div class="tabs" id="discoverTabs">
      <button class="tab active" data-tab="books" onclick="NJ.tab('discover','books',this)">📚 Books</button>
      <button class="tab" data-tab="software" onclick="NJ.tab('discover','software',this)">💻 Software</button>
      <button class="tab" data-tab="telegram" onclick="NJ.tab('discover','telegram',this)">📱 Telegram</button>
    </div></div>
    <div id="discoverPane" class="tab-pane"></div>
  </section>

  <!-- LIBRARY -->
  <section class="page" id="pg-library">
    <div class="page-header"><h1>📚 <span class="hl">Library</span></h1><p class="page-sub">Catalog · Favorites · Watchlist · History</p></div>
    <div class="tabs-wrap"><div class="tabs" id="libraryTabs">
      <button class="tab active" data-tab="catalog" onclick="NJ.tab('library','catalog',this)">📋 My Catalog</button>
      <button class="tab" data-tab="favorites" onclick="NJ.tab('library','favorites',this)">❤️ Favorites</button>
      <button class="tab" data-tab="watchlist" onclick="NJ.tab('library','watchlist',this)">🔖 Watchlist</button>
      <button class="tab" data-tab="history" onclick="NJ.tab('library','history',this)">🕘 History</button>
    </div></div>
    <div id="libraryPane" class="tab-pane"></div>
  </section>

  <!-- AI -->
  <section class="page" id="pg-ai">
    <div class="page-header"><h1>🤖 <span class="hl">AI</span></h1><p class="page-sub">AI Family · Agent Rooms · Tools</p></div>
    <div class="tabs-wrap"><div class="tabs" id="aiTabs">
      <button class="tab active" data-tab="family" onclick="NJ.tab('ai','family',this)">👨‍👩‍👧‍👦 AI Family</button>
      <button class="tab" data-tab="famroom" onclick="NJ.tab('ai','famroom',this)">🏠 Family Room</button>
      <button class="tab" data-tab="njroom" onclick="NJ.tab('ai','njroom',this)">🚀 NJ Room</button>
      <button class="tab" data-tab="tools" onclick="NJ.tab('ai','tools',this)">🛠️ Agent Tools</button>
    </div></div>
    <div id="aiPane" class="tab-pane"></div>
  </section>

  <!-- ACCOUNT -->
  <section class="page" id="pg-account">
    <div class="page-header"><h1>👤 <span class="hl">Account</span></h1><p class="page-sub">Profile · Settings · Preferences</p></div>
    <div class="tabs-wrap"><div class="tabs" id="accountTabs">
      <button class="tab active" data-tab="profile" onclick="NJ.tab('account','profile',this)">👤 Profile</button>
      <button class="tab" data-tab="settings" onclick="NJ.tab('account','settings',this)">⚙️ Settings</button>
      <button class="tab" data-tab="history" onclick="NJ.tab('account','history',this)">🕘 History</button>
    </div></div>
    <div id="accountPane" class="tab-pane"></div>
  </section>

  <!-- ADMIN -->
  <section class="page" id="pg-admin">
    <div class="page-header"><h1>🛡️ <span class="hl">Admin</span></h1><p class="page-sub">Authorized administrators only.</p></div>
    <div id="adminContent"><div class="skeleton">Checking access…</div></div>
  </section>

</main>

<!-- BOTTOM NAV (mobile) -->
<nav class="bnav" id="bnav">
  <div class="bnav-inner">
    <button class="bn active" data-nav="home"><span class="bn-ic">🏠</span>Home</button>
    <button class="bn" data-nav="watch"><span class="bn-ic">🎬</span>Watch</button>
    <button class="bn" data-nav="discover"><span class="bn-ic">🔍</span>Discover</button>
    <button class="bn" data-nav="ai"><span class="bn-ic">🤖</span>AI</button>
    <button class="bn" data-nav="library"><span class="bn-ic">📚</span>Library</button>
  </div>
</nav>

<!-- DRAWER -->
<div class="drawer-overlay" id="drawerOverlay" onclick="NJ.closeDrawer()"></div>
<div class="more-drawer" id="moreDrawer">
  <div class="dr-head"><h3>NJStream</h3><p>v11 — Futuristic Dashboard</p></div>
  <div class="dr-item" onclick="NJ.nav('home');NJ.closeDrawer()">🏠 Home</div>
  <div class="dr-item" onclick="NJ.nav('watch');NJ.closeDrawer()">🎬 Watch</div>
  <div class="dr-item" onclick="NJ.nav('discover');NJ.closeDrawer()">🔍 Discover</div>
  <div class="dr-item" onclick="NJ.nav('library');NJ.closeDrawer()">📚 Library</div>
  <div class="dr-item" onclick="NJ.openSearch();NJ.closeDrawer()">🔎 Search</div>
  <div class="dr-item" onclick="NJ.nav('account');NJ.closeDrawer()">👤 Account</div>
  <div class="dr-item dr-admin" data-nav="admin" onclick="NJ.nav('admin');NJ.closeDrawer()">🛡️ Admin</div>
</div>

<!-- SMART SEARCH -->
<div class="search-overlay" id="searchOverlay">
  <div class="so-head">
    <div class="so-box">
      <span class="so-ico">🔍</span>
      <input id="smartSearch" placeholder='Try: "Avengers Endgame", "Hindi action movies 2024", "science books Hindi"…' autocomplete="off">
      <button class="so-voice" id="voiceBtn" aria-label="Voice search" onclick="NJ.voiceSearch()">🎤</button>
      <button class="so-close" onclick="NJ.closeSearch()">✕</button>
    </div>
    <div class="so-hints" id="soHints">
      <span class="so-hint" onclick="NJ.searchHint('trending')">🔥 Trending</span>
      <span class="so-hint" onclick="NJ.searchHint('Hindi movies')">🎬 Hindi Movies</span>
      <span class="so-hint" onclick="NJ.searchHint('live sports')">📺 Live Sports</span>
      <span class="so-hint" onclick="NJ.searchHint('books Hindi')">📚 Books Hindi</span>
    </div>
  </div>
  <div class="so-body" id="soBody"><div class="empty"><div class="ico">🔍</div><h3>Smart Universal Search</h3><p>Type ya bol — intent samajh kar sirf useful results dikhenge.</p></div></div>
</div>

<!-- NOTIFICATIONS -->
<div class="notif-panel" id="notifPanel" style="display:none"><div id="notifList"><div class="empty"><div class="ico">🔔</div><p>No notifications yet.</p></div></div></div>

<!-- DETAIL MODAL -->
<div class="modal-overlay" id="detailModal" onclick="if(event.target===this)NJ.closeDetail()">
  <div class="modal-box modal-wide" id="detailBody"></div>
</div>

<!-- READER MODAL -->
<div class="modal-overlay" id="readerModal" onclick="if(event.target===this)NJ.closeReader()">
  <div class="modal-box modal-reader">
    <div class="modal-head"><span id="readerTitle">Reading…</span><button class="modal-x" onclick="NJ.closeReader()">✕</button></div>
    <div class="reader-body" id="readerBody"><div class="skeleton">Loading text…</div></div>
  </div>
</div>

<!-- PLAYER MODAL -->
<div class="player-overlay" id="playerModal" onclick="if(event.target===this)NJ.closePlayer()">
  <div class="player-shell">
    <div class="player-top">
      <div class="player-title" id="pmTitle">NJStream Player</div>
      <div class="player-meta">
        <span class="source-pill" id="pmSource"></span>
        <span class="player-status" id="pmStatus"></span>
      </div>
      <button class="modal-x" onclick="NJ.closePlayer()" aria-label="Close player">✕</button>
    </div>
    <div class="player-stage" id="pmStage">
      <video id="pmVideo" controls playsinline preload="auto"></video>
      <div class="player-overlay-ui" id="pmOverlay">
        <div class="spinner" id="pmSpinner" style="display:none"></div>
        <div class="player-error" id="pmError" style="display:none">
          <div class="pe-ico">⚠️</div>
          <h3 id="pmErrorTitle">Playback unavailable</h3>
          <p id="pmErrorMsg"></p>
          <div class="pe-actions">
            <button class="btn btn-primary btn-sm" id="pmRetryBtn" onclick="NJ.retryPlayback()">↻ Retry</button>
            <button class="btn btn-ghost btn-sm" id="pmFallbackBtn" style="display:none" onclick="NJ.playFallback()">⚡ Try direct source</button>
            <a class="btn btn-ghost btn-sm" id="pmTrailerBtn" style="display:none" target="_blank" rel="noopener">▶ Trailer</a>
          </div>
        </div>
      </div>
    </div>
    <div class="player-side" id="pmSide"></div>
  </div>
</div>

<!-- TOASTS -->
<div class="toast-wrap" id="toastWrap"></div>

<script src="/js/app.js?v=31"></script>
</body>
</html>`;
