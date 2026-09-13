# MonkeyBytes — NJStream Telegram Bot (Logic Host)

This machine runs the indexing bot (bot.js), NOT the Telegram Bot API server.
Bot connects to rawqh's API server + Cloudflare Worker for index storage.

## Setup
```bash
# SSH in
mkdir -p /opt/njstream-bot
cd /opt/njstream-bot

# Copy files
scp root@<thisMachine>:/path/to/{bot.js,.env.example,njstream-bot.service} .

# Configure
cp .env.example .env
nano .env  # edit BOT_TOKEN, WORKER_URL, INGEST_KEY, CHAT_IDS, LOCAL_BOT_API_URL
```

## Deploy
```bash
sudo cp njstream-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now njstream-bot
sudo journalctl -u njstream-bot -f
```

## Verify
```bash
# Bot should print: ✅ Bot live: @<username>
# Status: /status command in Telegram
curl https://njsoft-stream.njcreative123.workers.dev/api/status | head
```

## How 20MB limit is removed
1. rawqh runs Telegram Bot API server with `--local`
2. `getFile` returns local file path (unlimited size)
3. Bot indexes media → stores in Cloudflare Worker KV/D1
4. Worker's `/api/livebot/stream` fetches local path + streams with Range support
5. Website plays + downloads up to 2GB
