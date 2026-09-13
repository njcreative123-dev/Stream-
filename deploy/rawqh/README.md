# rawqh — Self-hosted Telegram Bot API (primary)

## Quick Start
```bash
ssh root@<RAWQH_IP>
# Docker install agar nahi hai:
apt update && apt install -y docker.io && systemctl enable --now docker
docker --version

# Deploy:
mkdir -p /opt/njstream && cd /opt/njstream
# docker-compose.yml ko yahan copy karo (nano / vim / scp)
docker compose up -d
docker logs -f njstream-telegram-api --tail=50
```

## Verify
```bash
# /getMe — server chalu hai?
curl -s "http://localhost:8081/getMe?token=YOUR_TOKEN" | head
# Should return: {"ok":true,"result":{...}}

# getFile with >20MB file_id:
curl -s "http://localhost:8081/botYOUR_TOKEN/getFile?file_id=AGACAgIAAxkBAAI..." | python3 -m json.tool
# file_path should be relative, not URL
```

## Security
- Port 8081 ko firewall se public mat kholo unless Worker public IP se access kare
- Local network pe sirf Cloudflare Worker ko access chahiye
- `ufw allow 8081` agar Worker public IP se connect karta hai
- `ufw deny 8081` agar sirf local/docker pe run karna hai

## Set in Cloudflare Worker (via wrangler)
```
wrangler secret put LOCAL_BOT_API_URL
# Enter: http://<RAWQH_PUBLIC_IP>:8081
```

## Stats Dashboard
`http://<RAWQH_PUBLIC_IP>:8082` — Telegram Bot API stats page

## Alternative (ragnarok22 community image — task ke command jaisa)
```bash
docker run -d --name telegram-bot-api \
  -e TELEGRAM_API_ID=28694000 \
  -e TELEGRAM_API_HASH=401983247e9767295aac40a0b53cc07c \
  -e TELEGRAM_LOCAL=true \
  -e TELEGRAM_HTTP_PORT=8081 \
  -e TELEGRAM_STAT_PORT=8082 \
  -p 8081:8081 -p 8082:8082 \
  -v /var/lib/telegram-bot-api:/data \
  ragnarok22/telegram-bot-api-docker
```
Kompose (official tdlib image) hi recommended hai — `--local` flag guaranteed.
