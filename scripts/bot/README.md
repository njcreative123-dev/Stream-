# NJStream Bot (MonkeyBytes / Node 18+)

Zero-dependency Telegram group-indexing + media bot. Long-polling (native `fetch`),
koi npm install nahi chahiye.

## Run
```bash
cp .env.example .env   # phir .env edit karo
node bot.js
```

Production (systemd):
```bash
sudo cp njstream-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now njstream-bot
journalctl -u njstream-bot -f
```

## Commands
| Command | Kaam |
|---|---|
| `/start` | Welcome + menu |
| `/search <query>` | Movies/books/media search |
| `/play <file_id>` | Streaming link |
| `/download <file_id>` | Download link |
| `/list` | Indexed library |
| `/status` | Bot + Local API + Worker health |
| `/index` | Groups scan karke index banao |

## How it removes the 20MB limit
1. Bot har group/channel ka media index karta hai (file_id, name, size, type).
2. Local Bot API server (`--local` mode) `getFile` par local file path deta hai —
   download limit nahi.
3. `LOCAL_BOT_API_URL=http://<rawqh-ip>:8081` set karne par links
   `WORKER_URL/api/livebot/stream?file_id=...` banate hain jo browser mein
   Range + 206 ke saath chunk-by-chunk stream karta hai (2GB tak).
