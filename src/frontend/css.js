// NJStream v11 — Futuristic Streaming Dashboard (Redesigned)
export const STYLE_CSS = `
/* ============================================================
   NJStream v11 — Dark Navy · Electric Cyan · Glassmorphism
   ============================================================ */
:root{
  --bg:#060a14;--bg2:#0a1020;--bg3:#0e1528;--bg4:#141e38;
  --surface:rgba(255,255,255,.04);--surface2:rgba(255,255,255,.07);--surface3:rgba(255,255,255,.12);--surface4:rgba(255,255,255,.18);
  --border:rgba(80,200,255,.08);--border2:rgba(80,200,255,.15);--border3:rgba(80,200,255,.28);
  --accent:#00e5ff;--accent2:#7c4dff;--accent3:#00b0ff;--accent-glow:rgba(0,229,255,.22);
  --grad:linear-gradient(135deg,#00e5ff 0%,#7c4dff 50%,#00b0ff 100%);
  --grad-h:linear-gradient(90deg,#00e5ff,#7c4dff);
  --green:#00e676;--red:#ff1744;--yellow:#ffd740;--orange:#ff9100;--pink:#ff4081;
  --text:#eaf6ff;--text2:#8ea4c0;--text3:#5a7090;
  --radius:18px;--radius-sm:12px;--radius-xs:8px;--radius-full:999px;
  --shadow:0 10px 40px rgba(0,0,0,.55);--shadow-sm:0 4px 16px rgba(0,0,0,.35);
  --glow-sm:0 0 12px rgba(0,229,255,.12);--glow-md:0 0 26px rgba(0,229,255,.2);--glow-lg:0 0 52px rgba(0,229,255,.26);
  --glass:rgba(10,18,40,.62);--glass-border:rgba(80,200,255,.12);
  --transition:all .26s cubic-bezier(.4,0,.2,1);
  --font:system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;
  --topbar-h:60px;--bnav-h:60px;
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-tap-highlight-color:transparent;font-size:16px}
body{font-family:var(--font);background:var(--bg);color:var(--text);overflow-x:hidden;line-height:1.6;-webkit-font-smoothing:antialiased;min-height:100vh}
::selection{background:rgba(0,229,255,.3);color:#fff}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(0,229,255,.2);border-radius:10px}
img{max-width:100%;display:block;object-fit:cover}
button{cursor:pointer;font-family:var(--font);border:none;background:none;color:inherit}
input,textarea,select{font-family:var(--font);border:none;outline:none;background:none;color:var(--text)}
a{color:var(--accent);text-decoration:none;transition:var(--transition)}
a:hover{color:#fff}

/* === AMBIENT === */
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 50% at 50% -20%,rgba(0,229,255,.06),transparent),radial-gradient(ellipse 60% 40% at 85% 105%,rgba(124,77,255,.04),transparent);pointer-events:none;z-index:0}
body::after{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,229,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.03) 1px,transparent 1px);background-size:54px 54px;pointer-events:none;z-index:0;opacity:.35}
.bg-orb{position:fixed;border-radius:50%;pointer-events:none;z-index:0;filter:blur(120px)}
.bg-orb-1{width:600px;height:600px;top:-260px;right:-160px;background:rgba(0,229,255,.07);animation:orbFloat 22s ease-in-out infinite}
.bg-orb-2{width:500px;height:500px;bottom:-200px;left:-120px;background:rgba(124,77,255,.05);animation:orbFloat 28s ease-in-out infinite reverse}
.bg-orb-3{width:300px;height:300px;top:42%;left:48%;background:rgba(0,176,255,.04);animation:orbFloat 20s ease-in-out infinite 5s}
@keyframes orbFloat{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-40px) scale(1.06)}66%{transform:translate(-20px,30px) scale(.94)}}
#particles{position:fixed;inset:0;pointer-events:none;z-index:0}

/* === LOADER === */
.loader{position:fixed;inset:0;z-index:9999;background:var(--bg);display:flex;align-items:center;justify-content:center;transition:opacity .5s,visibility .5s}
.loader.hide{opacity:0;visibility:hidden;pointer-events:none}
.ld-box{text-align:center}
.ld-logo{margin-bottom:16px;animation:ldPulse 2.4s ease-in-out infinite}
@keyframes ldPulse{0%,100%{transform:scale(1);filter:drop-shadow(0 0 18px rgba(0,229,255,.3))}50%{transform:scale(1.05);filter:drop-shadow(0 0 30px rgba(0,229,255,.5))}}
.ld-name{font-size:32px;font-weight:900;letter-spacing:-1px;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.ld-name span{-webkit-text-fill-color:var(--accent2)}
.ld-bar{width:200px;height:3px;background:var(--bg3);border-radius:10px;overflow:hidden;margin:14px auto}
.ld-fill{height:100%;width:0;background:var(--grad);border-radius:10px;animation:ldFill 2s ease forwards}
@keyframes ldFill{0%{width:0}50%{width:65%}100%{width:100%}}
.ld-sub{color:var(--text3);font-size:12px}

/* === TOP BAR === */
.topbar{position:fixed;top:0;left:0;right:0;height:var(--topbar-h);z-index:900;display:flex;align-items:center;gap:12px;padding:0 16px;background:rgba(6,10,20,.78);border-bottom:1px solid var(--border);backdrop-filter:blur(22px) saturate(1.4);-webkit-backdrop-filter:blur(22px) saturate(1.4);transition:var(--transition)}
.tb-left{display:flex;align-items:center;gap:10px;flex-shrink:0}
.tb-hamburger{display:none;width:36px;height:36px;border-radius:10px;align-items:center;justify-content:center;background:var(--surface);border:1px solid var(--border);color:var(--accent);font-size:18px;transition:var(--transition)}
.tb-hamburger:hover{background:var(--surface2);border-color:var(--border2)}
.tb-logo{display:flex;align-items:center;gap:8px;font-size:17px;font-weight:900;letter-spacing:-.5px;color:var(--text);text-decoration:none}
.tb-logo span{color:var(--text2);font-weight:700}
.tb-logo .hl{color:var(--accent);background:var(--grad-h);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.tb-nav{display:flex;align-items:center;gap:2px;margin-left:16px}
.tb-link{padding:7px 14px;border-radius:var(--radius-xs);font-size:13px;font-weight:600;color:var(--text2);transition:var(--transition);white-space:nowrap;letter-spacing:.2px}
.tb-link:hover,.tb-link.active{color:var(--accent);background:rgba(0,229,255,.08)}
.tb-link.active{box-shadow:inset 0 -2px 0 var(--accent)}
.tb-admin{color:var(--orange)!important}
.tb-right{display:flex;align-items:center;gap:6px;margin-left:auto}
.tb-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--text2);transition:var(--transition);position:relative}
.tb-icon:hover{color:var(--accent);background:rgba(0,229,255,.08)}
.tb-notif-dot{position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:var(--red);border:2px solid var(--bg)}
.tb-avatar{width:32px;height:32px;border-radius:var(--radius-full);background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid var(--border2);cursor:pointer;transition:var(--transition)}
.tb-avatar:hover{border-color:var(--accent);box-shadow:var(--glow-sm)}

/* === MOBILE BOTTOM NAV === */
.bnav{display:none;position:fixed;bottom:0;left:0;right:0;height:var(--bnav-h);z-index:900;background:rgba(6,10,20,.88);border-top:1px solid var(--border);backdrop-filter:blur(22px) saturate(1.4);-webkit-backdrop-filter:blur(22px) saturate(1.4)}
.bnav-inner{display:flex;justify-content:space-around;height:100%;align-items:center}
.bn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:6px 8px;border-radius:10px;min-width:52px;color:var(--text3);font-size:10px;font-weight:600;transition:var(--transition);letter-spacing:.3px}
.bn-ic{font-size:20px;line-height:1}
.bn.active{color:var(--accent)}
.bn.active .bn-ic{filter:drop-shadow(0 0 8px rgba(0,229,255,.4))}

/* === DRAWER === */
.drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:950;opacity:0;pointer-events:none;transition:opacity .25s}
.drawer-overlay.show{opacity:1;pointer-events:auto}
.more-drawer{position:fixed;top:0;left:0;width:280px;height:100%;z-index:960;background:var(--bg2);border-right:1px solid var(--border);transform:translateX(-100%);transition:transform .3s cubic-bezier(.4,0,.2,1);overflow-y:auto;padding:16px 0}
.more-drawer.open{transform:translateX(0)}
.dr-head{padding:20px 18px 14px;border-bottom:1px solid var(--border);margin-bottom:8px}
.dr-head h3{font-size:18px;font-weight:900;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.dr-head p{font-size:11px;color:var(--text3);margin-top:3px}
.dr-item{display:flex;align-items:center;gap:10px;padding:11px 18px;font-size:13.5px;font-weight:600;color:var(--text2);cursor:pointer;transition:var(--transition);border-radius:0 12px 12px 0;margin:1px 8px 1px 0}
.dr-item:hover{background:rgba(0,229,255,.08);color:var(--accent)}
.dr-item.dr-admin{color:var(--orange)}

/* === MAIN === */
.main{position:relative;z-index:1;padding:calc(var(--topbar-h) + 14px) 20px 32px;max-width:1500px;margin:0 auto}
.page{display:none;animation:fadeUp .3s ease}
.page.active{display:block}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

/* === PAGE HEADER === */
.page-header{margin-bottom:18px}
.page-header h1{font-size:28px;font-weight:900;letter-spacing:-.5px}
.page-header h1 .hl{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.page-sub{color:var(--text3);font-size:12.5px;margin-top:4px}

/* === TABS === */
.tabs-wrap{margin-bottom:14px;overflow:hidden}
.tabs{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;padding-bottom:2px}
.tabs::-webkit-scrollbar{display:none}
.tab{padding:8px 16px;border-radius:var(--radius-xs);font-size:12.5px;font-weight:600;color:var(--text3);white-space:nowrap;transition:var(--transition);border:1px solid transparent;letter-spacing:.2px}
.tab:hover{color:var(--accent);background:rgba(0,229,255,.06)}
.tab.active{color:var(--accent);background:rgba(0,229,255,.1);border-color:rgba(0,229,255,.2);box-shadow:0 0 12px rgba(0,229,255,.08)}
.tab-pane{animation:fadeUp .25s ease}

/* === HERO === */
.hero{position:relative;border-radius:var(--radius);overflow:hidden;min-height:400px;display:flex;align-items:flex-end;background:linear-gradient(135deg,var(--bg2) 0%,var(--bg3) 50%,var(--bg4) 100%);border:1px solid var(--border)}
.hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 70% 30%,rgba(0,229,255,.12),transparent 60%),radial-gradient(ellipse at 20% 80%,rgba(124,77,255,.08),transparent 60%);z-index:1}
.hero-badge{display:inline-block;padding:4px 12px;border-radius:var(--radius-full);background:rgba(0,229,255,.12);border:1px solid rgba(0,229,255,.25);color:var(--accent);font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px}
.hero-content{position:relative;z-index:2;padding:44px 36px;max-width:640px}
.hero-title{font-size:56px;font-weight:900;letter-spacing:-2px;line-height:1.05;margin-bottom:10px}
.hero-title .grad{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.hero-sub{font-size:17px;color:var(--text2);margin-bottom:20px;line-height:1.5}
.hero-btns{display:flex;gap:10px;flex-wrap:wrap}

/* === BUTTONS === */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 22px;border-radius:var(--radius-sm);font-size:13px;font-weight:700;letter-spacing:.3px;transition:var(--transition);white-space:nowrap;border:1px solid transparent}
.btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#040a14;border-color:transparent;box-shadow:0 4px 20px rgba(0,229,255,.25)}
.btn-primary:hover{box-shadow:0 6px 30px rgba(0,229,255,.35);transform:translateY(-1px);filter:brightness(1.1)}
.btn-ghost{background:rgba(255,255,255,.06);border-color:var(--border2);color:var(--text)}
.btn-ghost:hover{background:rgba(255,255,255,.12);border-color:var(--accent);color:var(--accent)}
.btn-sm{padding:7px 14px;font-size:12px;border-radius:var(--radius-xs)}
.btn-xs{padding:4px 10px;font-size:11px;border-radius:6px}
.btn-play{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#040a14;display:flex;align-items:center;justify-content:center;font-size:18px;border:none;box-shadow:0 4px 20px rgba(0,229,255,.3);transition:var(--transition)}
.btn-play:hover{transform:scale(1.1);box-shadow:0 6px 30px rgba(0,229,255,.45)}
.btn-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--surface);border:1px solid var(--border);color:var(--text2);font-size:16px;transition:var(--transition)}
.btn-icon:hover{background:rgba(0,229,255,.1);border-color:var(--accent);color:var(--accent)}

/* === STATS ROW === */
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}
.stat-card{background:var(--glass);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px 16px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transition:var(--transition);cursor:default}
.stat-card:hover{border-color:var(--border2);transform:translateY(-2px)}
.stat-num{font-size:24px;font-weight:900;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.stat-label{font-size:11px;color:var(--text3);margin-top:2px;font-weight:600;letter-spacing:.5px;text-transform:uppercase}

/* === SECTION TITLES === */
.section-title{font-size:17px;font-weight:800;margin-bottom:12px;display:flex;align-items:center;gap:8px;letter-spacing:-.2px}
.section-title .hl{background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.section-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.section-more{font-size:12px;color:var(--accent);font-weight:600;cursor:pointer;transition:var(--transition)}
.section-more:hover{color:#fff}
.section{margin-bottom:24px}

/* === MEDIA GRID === */
.grid-movies{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}
.media-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;transition:var(--transition);cursor:pointer;position:relative}
.media-card:hover{border-color:var(--border2);transform:translateY(-4px);box-shadow:0 12px 36px rgba(0,0,0,.4)}
.media-poster{position:relative;aspect-ratio:2/3;background:var(--surface2);overflow:hidden}
.media-poster img{width:100%;height:100%;object-fit:cover;transition:transform .4s}
.media-card:hover .media-poster img{transform:scale(1.06)}
.media-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.85) 0%,transparent 50%);opacity:0;transition:opacity .3s;display:flex;align-items:center;justify-content:center}
.media-card:hover .media-overlay{opacity:1}
.media-badge{position:absolute;top:8px;left:8px;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;z-index:2}
.badge-live{background:rgba(255,23,68,.85);color:#fff;animation:livePulse 2s infinite}
.badge-hd{background:rgba(0,229,255,.8);color:#040a14}
.badge-new{background:rgba(124,77,255,.85);color:#fff}
@keyframes livePulse{0%,100%{opacity:1}50%{opacity:.6}}
.media-rating{position:absolute;top:8px;right:8px;padding:3px 7px;border-radius:6px;font-size:10px;font-weight:700;background:rgba(0,0,0,.7);color:var(--yellow);backdrop-filter:blur(6px);z-index:2}
.media-info{padding:10px 12px}
.media-title{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px}
.media-meta{font-size:11px;color:var(--text3);display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.media-meta span{display:flex;align-items:center;gap:2px}

/* === POSTER PLACEHOLDER === */
.poster-ph{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,var(--bg3),var(--bg4))}
.ph-emoji{font-size:42px;opacity:.6}
.ph-title{font-size:12px;color:var(--text3);text-align:center;padding:0 12px;font-weight:600;line-height:1.3}

/* === BOOK GRID === */
.grid-books{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px}
.book-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);overflow:hidden;transition:var(--transition);cursor:pointer}
.book-card:hover{border-color:var(--border2);transform:translateY(-3px)}
.book-cover{position:relative;aspect-ratio:2/3;background:var(--surface2);overflow:hidden}
.book-cover img{width:100%;height:100%;object-fit:cover}
.book-info{padding:10px}
.book-title{font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px}
.book-author{font-size:11px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.book-lang{display:inline-block;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;background:rgba(0,229,255,.1);color:var(--accent);margin-top:4px;letter-spacing:.5px}

/* === CHANNEL GRID === */
.grid-channels{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
.ch-card{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);transition:var(--transition);cursor:pointer}
.ch-card:hover{border-color:var(--border2);background:var(--surface2)}
.ch-live-dot{width:8px;height:8px;border-radius:50%;background:var(--green);flex-shrink:0;animation:livePulse 2s infinite}
.ch-name{font-size:13px;font-weight:700;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ch-cat{font-size:10px;padding:3px 7px;border-radius:5px;background:rgba(124,77,255,.12);color:var(--accent2);font-weight:600;letter-spacing:.3px;flex-shrink:0}
.ch-play{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#040a14;display:flex;align-items:center;justify-content:center;font-size:14px;border:none;flex-shrink:0;transition:var(--transition)}
.ch-play:hover{transform:scale(1.15);box-shadow:var(--glow-sm)}

/* === SOFTWARE GRID === */
.grid-software{display:grid;grid-template-columns:1fr;gap:10px}
.soft-card{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);transition:var(--transition);cursor:pointer}
.soft-card:hover{border-color:var(--border2);background:var(--surface2)}
.soft-icon{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,var(--bg3),var(--bg4));display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;border:1px solid var(--border)}
.soft-info{flex:1;min-width:0}
.soft-name{font-size:14px;font-weight:700;margin-bottom:1px}
.soft-meta{font-size:11px;color:var(--text3);display:flex;gap:8px;flex-wrap:wrap}
.soft-verified{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:5px;font-size:9px;font-weight:700;background:rgba(0,230,118,.12);color:var(--green);letter-spacing:.3px}

/* === TG GRID === */
.grid-tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.tg-card{display:flex;gap:12px;padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);transition:var(--transition);cursor:pointer;overflow:hidden}
.tg-card:hover{border-color:var(--border2);background:var(--surface2)}
.tg-thumb{width:110px;min-height:80px;border-radius:8px;object-fit:cover;flex-shrink:0;background:var(--surface2)}
.tg-thumb.tall{height:140px;width:80px}
.tg-info{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:4px}
.tg-title{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tg-desc{font-size:11px;color:var(--text3);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.4}
.tg-type{font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600;width:fit-content;letter-spacing:.3px}
.tg-type-video{background:rgba(255,23,68,.12);color:var(--red)}
.tg-type-doc{background:rgba(0,229,255,.12);color:var(--accent)}
.tg-type-photo{background:rgba(124,77,255,.12);color:var(--accent2)}
.tg-type-text{background:rgba(255,215,64,.12);color:var(--yellow)}

/* === AGENT GRID === */
.grid-agents{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.agent-card{display:flex;flex-direction:column;align-items:center;padding:22px 16px;background:var(--glass);border:1px solid var(--border);border-radius:var(--radius);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transition:var(--transition);cursor:pointer;text-align:center}
.agent-card:hover{border-color:var(--border2);transform:translateY(-3px);box-shadow:0 12px 30px rgba(0,0,0,.3)}
.agent-avatar{font-size:38px;margin-bottom:8px}
.agent-name{font-size:15px;font-weight:800;margin-bottom:3px}
.agent-role{font-size:11px;color:var(--text3);margin-bottom:8px}
.agent-tags{display:flex;flex-wrap:wrap;gap:4px;justify-content:center}
.agent-tag{font-size:9px;padding:2px 7px;border-radius:5px;background:var(--surface2);color:var(--text3);font-weight:600}

/* === CHAT === */
.chat-container{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;display:flex;flex-direction:column}
.chat-box{height:420px;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.chat-msgs{display:flex;flex-direction:column;gap:10px;max-width:720px;margin:0 auto;width:100%}
.chat-msg{padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.55;max-width:85%;animation:fadeUp .25s ease}
.chat-msg.user{align-self:flex-end;background:linear-gradient(135deg,rgba(0,229,255,.15),rgba(124,77,255,.12));border:1px solid rgba(0,229,255,.18)}
.chat-msg.bot{align-self:flex-start;background:var(--surface2);border:1px solid var(--border)}
.chat-msg .agent-label{font-size:10px;font-weight:700;color:var(--accent);margin-bottom:4px;display:flex;align-items:center;gap:4px}
.chat-input{display:flex;gap:8px;padding:12px 14px;border-top:1px solid var(--border);background:var(--bg2)}
.chat-input input{flex:1;padding:10px 14px;border-radius:var(--radius-sm);background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:13px}
.chat-input input:focus{border-color:var(--accent);box-shadow:0 0 12px rgba(0,229,255,.12)}
.chat-input button{padding:10px 16px;border-radius:var(--radius-sm);background:linear-gradient(135deg,var(--accent),var(--accent2));color:#040a14;font-weight:700;font-size:13px;transition:var(--transition)}
.chat-input button:hover{filter:brightness(1.1);box-shadow:0 4px 16px rgba(0,229,255,.25)}
.chat-tools{padding:8px 14px;display:flex;gap:6px;flex-wrap:wrap;border-top:1px solid var(--border)}
.tool-chip{padding:4px 10px;border-radius:var(--radius-full);font-size:10px;font-weight:600;border:1px solid var(--border);color:var(--text3);transition:var(--transition);cursor:default}
.tool-chip.running{border-color:var(--yellow);color:var(--yellow)}
.tool-chip.done{border-color:var(--green);color:var(--green)}

/* === SEARCH OVERLAY === */
.search-overlay{position:fixed;inset:0;z-index:1000;background:rgba(6,10,20,.92);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);display:none;flex-direction:column;animation:fadeUp .2s ease}
.search-overlay.open{display:flex}
.so-head{padding:16px 20px;border-bottom:1px solid var(--border)}
.so-box{display:flex;align-items:center;gap:10px;background:var(--surface2);border:1px solid var(--border2);border-radius:var(--radius-sm);padding:4px 4px 4px 16px;transition:var(--transition)}
.so-box:focus-within{border-color:var(--accent);box-shadow:0 0 20px rgba(0,229,255,.15)}
.so-ico{font-size:18px;flex-shrink:0}
.so-box input{flex:1;padding:10px 0;font-size:15px;font-weight:500;background:none;color:var(--text)}
.so-box input::placeholder{color:var(--text3)}
.so-voice{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;transition:var(--transition)}
.so-voice:hover{background:rgba(0,229,255,.1)}
.so-voice.listening{background:rgba(255,23,68,.15);color:var(--red);animation:livePulse 1s infinite}
.so-close{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--text3);transition:var(--transition)}
.so-close:hover{color:var(--text);background:var(--surface)}
.so-hints{display:flex;gap:6px;padding:10px 0 0;flex-wrap:wrap}
.so-hint{padding:5px 12px;border-radius:var(--radius-full);background:var(--surface);border:1px solid var(--border);font-size:11px;color:var(--text3);cursor:pointer;transition:var(--transition);font-weight:600}
.so-hint:hover{border-color:var(--accent);color:var(--accent)}
.so-body{flex:1;overflow-y:auto;padding:20px}
.so-section{margin-bottom:20px}
.so-section-title{font-size:13px;font-weight:800;color:var(--text2);margin-bottom:10px;display:flex;align-items:center;gap:6px}
.so-results{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px}

/* === DETAIL MODAL === */
.modal-overlay{position:fixed;inset:0;z-index:980;background:rgba(0,0,0,.7);display:none;align-items:center;justify-content:center;animation:fadeUp .2s ease;padding:20px}
.modal-overlay.open{display:flex}
.modal-box{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);max-width:800px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.modal-wide{max-width:760px}
.modal-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--bg2);z-index:2}
.modal-head span{font-size:15px;font-weight:800}
.modal-x{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:16px;transition:var(--transition)}
.modal-x:hover{background:var(--surface);color:var(--text)}
.detail-hero{display:flex;gap:20px;padding:20px}
.detail-poster{width:200px;flex-shrink:0;border-radius:var(--radius-sm);overflow:hidden;background:var(--surface2)}
.detail-poster img{width:100%;aspect-ratio:2/3;object-fit:cover}
.detail-body{flex:1;min-width:0}
.detail-body h2{font-size:22px;font-weight:900;margin-bottom:6px}
.detail-meta{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.detail-tag{padding:3px 9px;border-radius:6px;font-size:11px;font-weight:600;background:var(--surface2);color:var(--text2);border:1px solid var(--border)}
.detail-overview{font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:14px}
.detail-actions{display:flex;gap:8px;flex-wrap:wrap}

/* === READER MODAL === */
.modal-reader{max-width:680px;max-height:85vh}
.reader-body{padding:20px;font-size:14px;line-height:1.8;color:var(--text2);white-space:pre-wrap;max-height:70vh;overflow-y:auto}

/* === PLAYER === */
.player-overlay{position:fixed;inset:0;z-index:1100;background:rgba(0,0,0,.92);display:none;align-items:center;justify-content:center;animation:fadeUp .2s ease}
.player-overlay.open{display:flex}
.player-shell{width:100%;max-width:1100px;display:grid;grid-template-columns:1fr 300px;max-height:92vh;border-radius:var(--radius);overflow:hidden;background:var(--bg2);border:1px solid var(--border)}
.player-shell.side-hidden{grid-template-columns:1fr}
.player-top{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border);background:var(--bg2)}
.player-title{font-size:14px;font-weight:800;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.player-meta{display:flex;gap:8px;align-items:center}
.source-pill{padding:3px 9px;border-radius:5px;font-size:10px;font-weight:600;background:rgba(0,229,255,.1);color:var(--accent);border:1px solid rgba(0,229,255,.2)}
.player-status{font-size:11px;color:var(--text3)}
.player-stage{position:relative;background:#000;aspect-ratio:16/9;width:100%}
.player-stage video{width:100%;height:100%;object-fit:contain}
.player-overlay-ui{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.player-error{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px;background:rgba(0,0,0,.7)}
.pe-ico{font-size:40px;margin-bottom:10px}
.player-error h3{font-size:16px;font-weight:800;color:var(--text);margin-bottom:6px}
.player-error p{font-size:12px;color:var(--text3);margin-bottom:14px;max-width:400px}
.pe-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.player-side{border-left:1px solid var(--border);overflow-y:auto;padding:14px}

/* === SPINNER === */
.spinner{width:40px;height:40px;border:3px solid var(--surface3);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* === NOTIFICATIONS === */
.notif-panel{position:fixed;top:var(--topbar-h);right:14px;width:320px;max-height:400px;overflow-y:auto;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);z-index:920;box-shadow:var(--shadow);padding:10px}
.notif-item{display:flex;gap:10px;padding:10px;border-radius:8px;font-size:12px;transition:var(--transition);color:var(--text2)}
.notif-item:hover{background:var(--surface)}
.notif-item span:first-child{font-size:16px;flex-shrink:0}

/* === EMPTY / ERROR === */
.empty{text-align:center;padding:40px 20px}
.empty .ico{font-size:48px;margin-bottom:10px;filter:drop-shadow(0 0 12px rgba(0,229,255,.25))}
.empty h3{font-size:16px;font-weight:800;color:var(--text);margin-bottom:4px}
.empty p{font-size:12.5px;color:var(--text3);line-height:1.6}
.error{text-align:center;padding:34px 20px;background:rgba(255,23,68,.05);border:1px solid rgba(255,23,68,.18);border-radius:var(--radius)}
.error .ico{font-size:34px;margin-bottom:8px}
.error h3{font-size:15px;font-weight:800;color:var(--red);margin-bottom:5px}
.error p{font-size:12.5px;color:var(--text2)}
.skeleton{color:var(--text3);font-size:13px;padding:14px;text-align:center}
.skeleton-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}
.sk-card{border-radius:var(--radius-sm);overflow:hidden;background:var(--surface);border:1px solid var(--border);animation:skPulse 1.3s ease-in-out infinite}
.sk-card .sk-poster{aspect-ratio:2/3;background:var(--surface2)}
.sk-card .sk-lines{padding:10px}
.sk-card .sk-line{height:8px;border-radius:4px;background:var(--surface3);margin:6px 0}
@keyframes skPulse{0%,100%{opacity:.55}50%{opacity:1}}

/* === TOASTS === */
.toast-wrap{position:fixed;bottom:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:min(360px,92vw)}
.toast{padding:12px 16px;border-radius:12px;background:var(--glass);border:1px solid var(--glass-border);font-size:13px;font-weight:700;box-shadow:var(--shadow);backdrop-filter:blur(18px);animation:fadeUp .25s ease;transition:all .3s}
.toast.success{border-color:rgba(0,230,118,.35);color:var(--green)}
.toast.error{border-color:rgba(255,23,68,.35);color:var(--red)}
.toast.info{border-color:rgba(0,229,255,.35);color:var(--accent)}

/* === ACCOUNT PAGES === */
.acct-form{max-width:400px;display:flex;flex-direction:column;gap:12px}
.form-group{display:flex;flex-direction:column;gap:4px}
.form-group label{font-size:12px;font-weight:700;color:var(--text2);letter-spacing:.3px}
.form-group input,.form-group select{padding:10px 14px;border-radius:var(--radius-sm);background:var(--surface);border:1px solid var(--border);color:var(--text);font-size:13px;transition:var(--transition)}
.form-group input:focus,.form-group select:focus{border-color:var(--accent);box-shadow:0 0 12px rgba(0,229,255,.12)}
.form-group select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235a7090' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center}

/* === FOOTER === */
.footer{border-top:1px solid var(--border);padding:24px 0;margin-top:30px;text-align:center;font-size:11px;color:var(--text3)}
.footer b{color:var(--text2)}

/* === ACCESSIBILITY === */
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
button:focus:not(:focus-visible),input:focus:not(:focus-visible){outline:none}
.skip-link{position:absolute;top:-50px;left:0;background:var(--accent);color:#040a14;padding:10px 20px;z-index:9999;border-radius:0 0 10px 0;font-weight:800;font-size:14px}
.skip-link:focus{top:0}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

/* === RESPONSIVE === */
@media(max-width:1024px){
  .player-shell{grid-template-columns:1fr}
  .player-shell.side-hidden{grid-template-columns:1fr}
  .player-side{display:none}
  .main{padding:calc(var(--topbar-h) + 12px) 14px 44px}
  .hero{min-height:340px}
  .hero-content{padding:36px 30px}
  .hero-title{font-size:46px}
}
@media(max-width:768px){
  .tb-hamburger{display:flex}
  .tb-nav{display:none}
  .bnav{display:block}
  .bnav-inner{display:flex;justify-content:space-around}
  .main{padding-bottom:calc(var(--bnav-h) + 14px)}
  .page{padding:0 2px}
  .hero{min-height:300px;border-radius:14px}
  .hero-content{padding:30px 20px}
  .hero-title{font-size:38px;letter-spacing:-1.4px}
  .hero-sub{font-size:15px}
  .hero-badge{font-size:10px;letter-spacing:1px}
  .hero-btns .btn{padding:10px 16px;font-size:12px}
  .stats-row{grid-template-columns:repeat(2,1fr);gap:8px}
  .stat-card{padding:12px 13px}
  .stat-num{font-size:20px}
  .grid-movies{grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
  .grid-books{grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px}
  .grid-channels{grid-template-columns:1fr}
  .grid-agents{grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:10px}
  .grid-software{grid-template-columns:1fr}
  .grid-tg{grid-template-columns:1fr}
  .tabs{width:100%;overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch}
  .tab{padding:8px 12px;font-size:12px}
  .chat-box{height:calc(100vh - 250px)}
  .chat-msgs{max-width:100%}
  .detail-hero{flex-direction:column;align-items:center;text-align:center;padding:16px}
  .detail-poster{width:160px}
  .detail-actions,.detail-meta{justify-content:center}
  .toast-wrap{bottom:calc(var(--bnav-h) + 8px);right:10px;left:10px}
  .toast{width:100%}
  .player-shell{max-height:94vh}
  .player-stage{aspect-ratio:16/10}
  .player-top{padding:10px 12px}
  .player-title{font-size:12.5px}
  .source-pill{display:none}
  .page-header h1{font-size:22px}
  .section-title{font-size:15px}
  .tg-thumb{width:96px}
  .tg-thumb.tall{width:72px}
  .notif-panel{right:8px;left:8px;width:auto}
  .search-overlay .so-body{padding:14px}
  .so-results{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}
}
@media(max-width:420px){
  .bn{min-width:44px;padding:5px 2px}
  .bn-ic{font-size:17px}
  .grid-movies{grid-template-columns:repeat(auto-fill,minmax(115px,1fr));gap:9px}
  .media-title{font-size:12px}
  .hero-title{font-size:32px}
  .stats-row{grid-template-columns:1fr 1fr}
  .soft-card{flex-direction:column;text-align:center}
  .soft-icon{align-self:center}
  .room-grid{grid-template-columns:1fr}
  .so-results{grid-template-columns:1fr 1fr}
}
@media(min-width:1440px){
  .main{max-width:1500px;padding-left:24px;padding-right:24px}
  .grid-movies{grid-template-columns:repeat(auto-fill,minmax(185px,1fr))}
}
`;
