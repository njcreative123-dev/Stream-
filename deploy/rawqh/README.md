# rawqh — Self-hosted Telegram Bot API (primary VPS)

## rawqh CLI bootstrap (pehli baar)
```bash
# Apne PC/phone par (ya rawqh ke web panel par):
npm install -g rawhq
raw init          # email daalo — no credit card
raw deploy --type raw-free --region eu
# SSH details milengi — phir:
ssh root@<RAWQH_IP>
```

## Telegram Bot API Server (--local mode)
```bash
# Docker install
curl -fsSL https://get.docker.com | sh
mkdir -p /opt/njstream && cd /opt/njstream
# docker-compose.yml copy karo (PORT 8081/8082)
docker compose up -d
docker logs -f njstream-telegram-api --tail=50
# restart pe auto-start: compose me restart: unless-stopped already hai
```

## Firewall — sirf MonkeyBytes IP se allow karo
```bash
ufw allow from <MONKEYBYTES_IP> to any port 8081
ufw allow from <MONKEYBYTES_IP> to any port 8082
ufw enable
# (ya cloud panel ke firewall rules me ye 2 rules daalo)
```

## Verify (20MB limit removed = getFile local path)
```bash
curl -s http://localhost:8081/bot<BOT_TOKEN>/getMe
# 100MB+ file par:
curl -s "http://localhost:8081/bot<BOT_TOKEN>/getFile?file_id=<BIG_FILE_ID>" | python3 -m json.tool
# → {"ok":true,"result":{"file_path":"/data/.../file_0","file_size":...}}  ← local path = limit free
```

## Worker env
```bash
wrangler secret put PRIMARY_API_URL   # http://<RAWQH_PUBLIC_IP>:8081
```
