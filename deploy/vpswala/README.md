# VPSWala — Backup Bot API + Redis Chunk Cache

## Free VPS register
- https://vpswala.org/cart/register.php (traditional form)
- Plan: free (up to 8GB RAM)

## 1) Backup Telegram Bot API (port 8091/8092)
```bash
ssh root@<VPSWALA_IP>
curl -fsSL https://get.docker.com | sh
mkdir -p /opt/njstream && cd /opt/njstream
# docker-compose.yml copy karo (port 8091/8092 override):
#   sed 's/8081/8091/g; s/8082/8092/g' ...
docker compose up -d
```

## 2) Redis chunk cache (port 6379)
```bash
docker run -d --name chunk-cache -p 6379:6379 --restart unless-stopped redis:7-alpine
redis-cli ping   # PONG
# Cache policy: (file_id, chunk_offset) → bytes, TTL 1hr (worker/bot decide karte hain)
```

## Failover
- MonkeyBytes bot har 30s pe primary (rawqh) + backup (VPSWala) ka /getMe ping karta hai
- rawqh 3 baar fail → bot BACKUP_API_URL pe switch (pickApi)
- Worker side: PRIMARY_API_URL / BACKUP_API_URL env me dono daalo

## Worker env
```bash
wrangler secret put BACKUP_API_URL   # http://<VPSWALA_PUBLIC_IP>:8091
wrangler secret put REDIS_URL        # optional: redis://<VPSWALA_IP>:6379
```
