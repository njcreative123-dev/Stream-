# rawqh — Self-hosted Telegram Bot API (primary VPS)

## Quick Start (Official tdlib image)
```bash
ssh root@<RAWQH_IP>
apt update && apt install -y docker.io && systemctl enable --now docker

mkdir -p /opt/njstream && cd /opt/njstream
# docker-compose.yml copy karo
docker compose up -d
docker logs -f njstream-telegram-api --tail=50
```

## Verify
```bash
# /getMe — server alive?
curl -s "http://localhost:8081/getMe?token=YOUR_BOT_TOKEN" | head
# getFile > 20MB:
curl -s "http://localhost:8081/botYOUR_BOT_TOKEN/getFile?file_id=AGACAgIAAxkBAA..." | python3 -m json.tool
```

## ⚠️ ragnarok22 image does NOT support --local
Use official `tdlib/telegram-bot-api:latest` image — it supports `--local` flag.

## Set in Cloudflare Worker
```bash
wrangler secret put LOCAL_BOT_API_URL
# Enter: http://<RAWQH_PUBLIC_IP>:8081
```
