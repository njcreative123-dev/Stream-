# NJStream v8.3 — AI-Powered Streaming + Telegram Library

**Live:** https://njsoft-stream.njcreative123.workers.dev

## What's New

### 🎞️ Telegram Library (Categorized)
- **186 videos**, **2 APK/software** items automatically indexed
- SVG thumbnails auto-generated — no external image dependencies
- Search + filter + sort (date, size, A-Z) on every page
- Videos page (`/videos`) — grid view with play + download + mirror status
- Software page (`/apk`) — APK files + documents grid
- Smart categorization: videos, books, APK, photos, audio, text, docs, archives

### 👨‍👩‍👧‍👦 Family Room (`/family`)
- All 6 AI agents (NJ, Telly, Filmy, Kitabi, Sathi, Khojo) talk in one room
- Humans can join and chat with agents directly
- Backed by OpenRouter AI with fallback providers

### 🎭 Roaming 3D Agents
- CSS3D floating agent orbs move freely across every page
- Click any agent orb to navigate to their room
- Movement animation — agents drift to new positions every 4.2s
- Per-page agent assignment (TV → Telly, TG → Sathi, etc.)

### 🔗 Deep Link Routing
- Human-friendly URLs: `/tv`, `/telegram`, `/videos`, `/apk`, `/family`
- SPA fallback — no more 404s for direct links

## Architecture

| Component | Tech |
|-----------|------|
| Worker | Cloudflare Workers (single-file, 287KB) |
| KV Store | Messages + media mirrors + library cache + family chat |
| D1 | Users + catalog |
| TV Sources | IPTV-org (2200+ channels, auto-category) |
| AI | OpenRouter → Groq → Cerberus → Polination (5 providers) |
| Videos | GitHub Releases (mirrors) + Telegram bot proxy (≤20MB) |
| Books | Open Library API (Hindi + English) |
| Movies | TMDB (Hindi/English) |

## Endpoints

```
/                           Home (SPA)
/tv                         Live TV (2200+ channels, Hindi first)
/tg                         Telegram data
/videos                     Telegram videos library
/apk                        Software / APK library
/books                      Open Library books
/movies                     TMDB movies
/search                     Universal search
/ai                         AI Chat (Agent NJ)
/family                     Family Room (agents + humans)
/nj                         NJ Room (admin)
/catalog                    My Catalog (D1)
/login                      Login / Register
/api/telegram/library       Categorized library API
/api/telegram/messages      Telegram messages
/api/telegram/stream        Stream video
/api/telegram/proxy         Proxy stream
/api/media/{id}             Media mirror stream
/api/media/{id}?download=1  Media download
/api/live-tv                Live TV channels
/api/chat                   AI chat
/api/family-chat/start      Start family session
```

## Credentials (in Cloudflare Workers secrets)

- Telegram Bot Token (set via `wrangler secret put`)
- OpenRouter API Key
- Groq API Key  
- Cerberus API Key
- Polination API Key
- Ingest Key

## Deploy

```bash
npx esbuild src/workers/index.js --bundle --format=esm --outfile=/tmp/wb.js
# Upload to CF Workers REST API
```

## Telegram Backfill

```bash
API_ID=28694000 API_HASH=401983247e9767295aac40a0b53cc07c \
GROUP=-1002514429549 INGEST_KEY=... python3 scripts/telegram_backfill.py --qr
```

---
Built by NJ Stream AI Agents 🧠📚📺📱🎬🔍
