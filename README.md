# ⚡ JDUB Hub

**Movies · Books · AI · Live TV — 10+ Free Services**

![JDUB Hub](https://img.shields.io/badge/Status-Online-brightgreen?style=flat-square)
![Workers](https://img.shields.io/badge/Workers-6-blue?style=flat-square)
![Hosting](https://img.shields.io/badge/Hosting-Free%20Tier-purple?style=flat-square)

## 🌐 Live Endpoints

| Service | URL | Free Tier |
|---------|-----|-----------|
| HelioHost | https://njcreative123.helioho.st/ | ✅ Unlimited |
| Cloudflare Worker | https://jdub-deploy.njcreative123.workers.dev/ | ✅ 10M req/day |
| Cloudflare Pages | https://jdub-hub.pages.dev/ | ✅ Unlimited |
| GitHub Pages | https://njcreative123-dev.github.io/Stream-/ | ✅ Unlimited |

## 🤖 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/status` | GET | All services status |
| `/api/search?q=` | GET | Search movies + books |
| `/api/movies?type=popular` | GET | Movies (TMDB) |
| `/api/books?q=famous` | GET | Books (Open Library) |
| `/api/trending` | GET | Trending movies + books |
| `/api/catalog` | GET/POST | D1 database CRUD |
| `/api/telegram/webhook` | POST | Telegram bot commands |
| `/api/analytics` | GET | Pageview stats |
| `/api/cache` | GET | KV cache demo |
| `/api/chat` | POST | AI worker chat |

## ☁️ Free Cloudflare Services

| Service | Free Tier | Usage |
|---------|-----------|-------|
| **Workers** | 10M req/day | API routing, AI |
| **KV** | 100K reads/day | Caching |
| **D1** | 5GB, 5M reads/day | Movie/book catalog |
| **R2** | 10GB storage | Thumbnails, media |
| **Cron** | 1 trigger/day | Daily data sync |
| **Pages** | Unlimited deploys | Static site |
| **Analytics** | Unlimited | Pageview tracking |
| **Turnstile** | Unlimited | CAPTCHA |
| **CDN** | 300+ cities | Global edge |

## 🐙 GitHub Features

| Feature | Status |
|---------|--------|
| **Actions** | ✅ Auto-deploy on push |
| **Pages** | ✅ Static site hosting |
| **CodeQL** | ✅ Weekly security scan |
| **Dependabot** | ✅ Auto dependency updates |
| **Funding** | ✅ Sponsor button |
| **Bot** | ✅ `/status`, `/deploy`, `/help` |

## 📱 Free External Services

| Service | Usage |
|---------|-------|
| **TMDB API** | Movie metadata (free key) |
| **Open Library** | Books (completely free) |
| **Telegram Bot API** | Webhook commands |
| **HelioHost** | PHP hosting |
| **Vercel** | Backup deploy (config ready) |
| **Netlify** | Backup deploy (config ready) |
| **Render** | Backup deploy (config ready) |
| **Koyeb** | Backup deploy (config ready) |

## 🚀 Deploy

### Cloudflare Worker
```bash
npx wrangler deploy
```

### Cloudflare Pages
```bash
npx wrangler pages deploy public --project-name=jdub-hub
```

### HelioHost
Push to `main` branch → GitHub Actions auto-deploys via FTP

### GitHub Pages
```bash
# Enable in repo Settings → Pages → GitHub Actions
# Workflow already configured
```

### Backups
```bash
# Vercel: import repo → auto-detect vercel.json
# Netlify: import repo → auto-detect netlify.toml
# Render: import repo → auto-detect render.yaml
# Koyeb: import repo → auto-detect koyeb.yaml
```

## 🔐 Required Secrets (GitHub)

```
CLOUDFLARE_API_TOKEN=cfut_xxx
CLOUDFLARE_ACCOUNT_ID=xxx
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx
HELIOHOST_FTP_USER=xxx
HELIOHOST_FTP_PASS=xxx
TMDB_KEY=xxx  # optional — get free key at themoviedb.org
```

## 📁 Project Structure

```
├── src/workers/index.js    # Main Cloudflare Worker
├── public/                 # Static site
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   ├── index.php           # HelioHost PHP fallback
│   └── telegram-bot/       # Telegram webhook
├── scripts/                # Data sync scripts
├── .github/workflows/      # CI/CD (6 workflows)
│   ├── deploy.yml
│   ├── bot.yml
│   ├── codeql.yml
│   └── scheduled-sync.yml
├── wrangler.toml           # Cloudflare config
├── vercel.json             # Vercel config
├── netlify.toml            # Netlify config
├── render.yaml             # Render config
└── koyeb.yaml              # Koyeb config
```

## 📜 License

MIT
