# VPSWala — Backup Telegram Bot API

Port 8083 (mapped to container 8081). Same steps as rawqh README.
Primary + Backup both connect to same Cloudflare Worker.
Worker uses `LOCAL_BOT_API_URL` (rawqh primary — VPSWala used only if rawqh goes down).

## Quick Start
```bash
ssh root@<VPSWala_IP>
apt update && apt install -y docker.io && systemctl enable --now docker
mkdir -p /opt/njstream && cd /opt/njstream
# copy docker-compose.yml here
docker compose up -d
curl -s "http://localhost:8083/getMe?token=YOUR_TOKEN"
```

## Switch to backup in Worker
```bash
wrangler secret put LOCAL_BOT_API_URL
# Enter: http://<VPSWala_IP>:8083
```
