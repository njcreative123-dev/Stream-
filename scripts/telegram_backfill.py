#!/usr/bin/env python3
"""
NJStream — Telegram Group History Backfill (Telethon)
=====================================================
Bot API only delivers NEW messages (and only ~24h of getUpdates).
To import FULL group history (movies, books, videos, files) use this script
with YOUR OWN Telegram account (needs phone OTP — 100% safe, runs locally).

Setup:
  pip install telethon
  python scripts/telegram_backfill.py

Required (config below or env vars):
  API_ID / API_HASH   -> get from https://my.telegram.org (API development tools)
  PHONE               -> your Telegram phone number (international format, +91...)
  GROUP               -> group username or numeric id, e.g. hindidubbedfilmmovie
  INGEST_KEY          -> key you set on the Cloudflare worker (set via:
                         wrangler secret put INGEST_KEY) — blank = open endpoint
  WORKER              -> default https://njsoft-stream.njcreative123.workers.dev

The script asks for the OTP (and password if 2FA is on) the first time it runs.
"""
import asyncio
import json
import os
import sys

try:
    from telethon import TelegramClient
    from telethon.tl.types import MessageMediaPhoto, MessageMediaDocument
except ImportError:
    sys.exit("pip install telethon")

API_ID = int(os.environ.get("API_ID", os.environ.get("TG_API_ID", 0)))
API_HASH = os.environ.get("API_HASH", os.environ.get("TG_API_HASH", ""))
PHONE = os.environ.get("PHONE", os.environ.get("TG_PHONE", ""))
GROUP = os.environ.get("GROUP", os.environ.get("TG_GROUP", "hindidubbedfilmmovie"))
INGEST_KEY = os.environ.get("INGEST_KEY", "")
WORKER = os.environ.get("WORKER", "https://njsoft-stream.njcreative123.workers.dev")
LIMIT = int(os.environ.get("LIMIT", "500"))
SESSION = os.environ.get("SESSION", "njstream_telethon.session")

if not (API_ID and API_HASH and PHONE):
    print("API_ID, API_HASH and PHONE are required.")
    print("Get API_ID/API_HASH at https://my.telegram.org -> API development tools")
    sys.exit(1)

async def main():
    client = TelegramClient(SESSION, API_ID, API_HASH)
    await client.start(phone=PHONE)

    entity = None
    if GROUP.startswith("-") or GROUP.isdigit():
        entity = int(GROUP)
    else:
        entity = GROUP
    entity = await client.get_entity(entity)
    print(f"Connected to: {entity.title}")

    messages = []
    async for m in client.iter_messages(entity, limit=LIMIT):
        text = m.message or ""
        caption = getattr(m.media, "caption", "") or ""
        file_name = ""
        file_size = 0
        file_id = ""
        media_type = None

        if isinstance(m.media, MessageMediaPhoto):
            media_type = "photo"
            file_id = str(m.media.photo.id)
            file_size = getattr(m.media.photo, "size", 0)
        elif isinstance(m.media, MessageMediaDocument):
            doc = m.media.document
            file_id = str(doc.id)
            file_size = doc.size
            file_name = next((a.file_name for a in doc.attributes if hasattr(a, "file_name")), "")
            mime = doc.mime_type or ""
            if "video" in mime:
                media_type = "video"
            elif "audio" in mime:
                media_type = "audio"
            else:
                media_type = "document"

        has_media = media_type is not None
        messages.append({
            "id": m.id,
            "date": int(m.date.timestamp()),
            "from": m.chat_id if hasattr(m, "chat_id") else "",
            "text": text,
            "caption": caption,
            "has_media": has_media,
            "media_type": media_type,
            "file_name": file_name,
            "file_size": file_size,
            "file_id": file_id,
        })

    print(f"Fetched {len(messages)} messages")
    if not messages:
        return

    headers = {"Content-Type": "application/json"}
    if INGEST_KEY:
        headers["x-ingest-key"] = INGEST_KEY

    url = f"{WORKER}/api/telegram/ingest"
    resp = await asyncio.to_thread(
        lambda: __import__("urllib.request", fromlist=["request"]).request.urlopen(
            __import__("urllib.request", fromlist=["request"]).request.Request(
                url,
                data=json.dumps({"messages": messages}).encode(),
                headers=headers,
                method="POST",
            )
        )
    )
    result = json.loads(resp.read().decode())
    print(f"Worker response: {result}")

asyncio.run(main())
print("Done! Telegram data ab site par visible hai: /api/telegram/messages")
