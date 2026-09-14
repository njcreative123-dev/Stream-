# MonkeyBytes — NJStream Bot (Brain)

- 2GB RAM / 2GB SSD — bot commands + indexing + AI routing
- Runtime: Node.js 20+ (zero-dependency bot — native fetch, no npm install)
- Code: `scripts/bot/bot.js`

## Deploy
1. File manager / SFTP se `scripts/bot/` upload karo
2. `.env` banao (`.env.example` copy karo):
   - `BOT_TOKEN` (primary), `BOT_TOKENS` (multi-token rotation, optional)
   - `WORKER_URL=https://njsoft-stream.njcreative123.workers.dev`
   - `PRIMARY_API_URL=http://<RAWQH_IP>:8081`
   - `BACKUP_API_URL=http://<VPSWALA_IP>:8091`
3. Entry file: `bot.js` → `node bot.js`
4. Uptime: platform Kron (cron ping) ya panel auto-restart

## Verify
```bash
# Telegram par bot ko private message karo:
/start        → 5 sec ke andar welcome aaye
/search <q>   → indexed media results
/play <id>    → streaming link
/download <id> → direct download link
/mirror <url> → naya direct URL mirror register
/status       → bot + rawqh + VPSWala health
```

## Speed mechanism (implemented in bot.js)
- Multi-token round-robin (429 pe token cooldown)
- Primary/backup API failover har 30s health check
- Worker edge cache: pehle 1MB chunk popular videos ka (cache TTL 300s)
- Chunk streaming: Worker Range passthrough (seek), zero full-file buffering
