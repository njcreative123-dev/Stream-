# NJStream — All-in-One Streaming Platform

🎬 **Live TV** • **Movies** • **Books** • **Telegram Data** • **AI Chat** — Sab Free!

**Live Site:** https://njsoft-stream.njcreative123.workers.dev

---

## Features

| Feature | Status | Details |
|---------|--------|---------|
| 📺 Live TV | ✅ 910 channels | Hindi priority (188), HLS.js player |
| 📱 Telegram Data | ✅ Readable + Downloadable | Photos, videos, documents — inline playback |
| 🎬 Movies | ✅ TMDB Hindi + English | Popular, Top Rated, Now Playing, Upcoming |
| 📚 Books | ✅ Open Library | 20+ Hindi books, read links |
| 🤖 AI Chat | ✅ Smart routing | Cloudflare AI LLM powered |
| 🔍 Search | ✅ Multi-source | Movies + Books + Telegram |
| 📁 Catalog | ✅ D1 SQLite | Add/edit content |
| 🔄 Sync | ✅ Cron + Manual | 6-hour auto-sync + UI button |

## Architecture

```
Cloudflare Worker (edge)
├── /css/style.css — Dark glassmorphism theme
├── /js/app.js — Single-page app (HLS.js TV player)
├── /api/live-tv — IPTV parser (iptv-org sources)
├── /api/telegram/* — Webhook + KV storage + ingest
├── /api/movies — TMDB fallback → D1 cache
├── /api/books — Open Library
├── /api/chat — Cloudflare AI / smart fallback
├── /api/search — Multi-source
└── /api/catalog — D1 SQLite CRUD
```

## Services

- **Cloudflare Worker** — v5.0.0 (200+ edge locations)
- **KV Storage** — Telegram data cache (30-day TTL)
- **D1 Database** — `njsoft-catalog` (SQLite at edge)
- **Cron Trigger** — `0 */6 * * *` (every 6 hours)

## Telegram Setup

### Automatic (webhook)
Bot `@no1currentbot` webhook is active — all new messages in group `-1002514429549` are stored automatically.

### Full History Backfill (Telethon)
To import old group history:

1. Get `API_ID`/`API_HASH` from https://my.telegram.org
2. Install: `pip install telethon`
3. Run:
```bash
API_ID=xxxxx API_HASH=xxxxx PHONE=+91xxxx GROUP=hindidubbedfilmmovie \
  INGEST_KEY=$(cat .env | grep INGEST_KEY | cut -d= -f2) \
  python scripts/telegram_backfill.py
```

### Webhook Status
Check: https://njsoft-stream.njcreative123.workers.dev/api/status

## Deploy

```bash
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=18998bfa1e33fe431b59dd938db7907c
npx wrangler deploy
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Service health |
| `/api/live-tv` | GET | All channels (filterable) |
| `/api/live-tv/stream` | GET | Proxy (302 redirect) |
| `/api/telegram/messages` | GET | Messages (paginated) |
| `/api/telegram/sync` | POST | Sync from webhook |
| `/api/telegram/ingest` | POST | Bulk import (x-ingest-key) |
| `/api/movies` | GET | TMDB movies by category |
| `/api/books` | GET | Open Library search |
| `/api/search` | GET | Multi-source search |
| `/api/chat` | POST | AI chat |
| `/api/catalog` | GET/POST/DELETE | D1 catalog CRUD |

## Credentials (Cloudflare)

- Account: `18998bfa1e33fe431b59dd938db7907c`
- Worker: `njsoft-stream`
- KV: `e1889fcdeca94f2abe934162ade34db8`
- D1: `njsoft-catalog` / `a8cf8fd3-fa70-42ed-b83c-83dc326909a9`

---
Built with ❤️ by NJCreative
