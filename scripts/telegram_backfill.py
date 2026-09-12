#!/usr/bin/env python3
"""
NJStream — Telegram Group History Backfill + Long-Video Mirror (Telethon)
=========================================================================
Bot API only delivers NEW messages (and ~24h of getUpdates). To import FULL
group history (movies, books, videos, files) use this script with YOUR OWN
Telegram account (needs phone OTP — 100% safe, runs locally).

With --mirror, every video message is ALSO downloaded via MTProto (no 20MB
limit) and uploaded to a free mirror (catbox <=200MB / GitHub Releases / R2),
then registered on the worker. Result: Telegram ki LONG movies NJStream par
direct play + download (no redirect).

Setup:
  pip install telethon
  python scripts/telegram_backfill.py [--mirror] [--limit=5000] [--r2]   # phone OTP
  python scripts/telegram_backfill.py --qr [--mirror] [--limit=5000]   # phone ka QR scan (no OTP typing)
  python scripts/telegram_backfill.py [--mirror]                        # BOT_TOKEN mode = only new msgs (bot can't read history)

Required (config below or env vars):
  API_ID / API_HASH   -> get from https://my.telegram.org (API development tools)
  PHONE               -> your Telegram phone number (international format, +91...)  [ya --qr scan]
  GROUP               -> group username or numeric id, e.g. -1002514429549
  INGEST_KEY          -> key you set on the Cloudflare worker
  WORKER              -> default https://njsoft-stream.njcreative123.workers.dev
  GH_TOKEN (mirror)   -> GitHub personal access token (repos scope)
  GH_REPO             -> default njcreative123-dev/Stream-
  GH_RELEASE          -> default njstream-media
"""
import asyncio
import json
import os
import subprocess
import sys
import tempfile

try:
    from telethon import TelegramClient
    from telethon.tl.types import (
        MessageMediaPhoto,
        MessageMediaDocument,
        DocumentAttributeFilename,
    )
except ImportError:
    sys.exit("pip install telethon")

API_ID = int(os.environ.get("API_ID", os.environ.get("TG_API_ID", 0)))
API_HASH = os.environ.get("API_HASH", os.environ.get("TG_API_HASH", ""))
PHONE = os.environ.get("PHONE", os.environ.get("TG_PHONE", ""))
BOT_TOKEN = os.environ.get("BOT_TOKEN", os.environ.get("TG_BOT_TOKEN", ""))
GROUP = os.environ.get("GROUP", os.environ.get("TG_GROUP", "hindidubbedfilmmovie"))
INGEST_KEY = os.environ.get("INGEST_KEY", "")
WORKER = os.environ.get("WORKER", "https://njsoft-stream.njcreative123.workers.dev")
LIMIT = int(os.environ.get("LIMIT", "5000"))
SESSION = os.environ.get("SESSION", "njstream_telethon.session")
GH_TOKEN = os.environ.get("GH_TOKEN", os.environ.get("GITHUB_TOKEN", ""))
GH_REPO = os.environ.get("GH_REPO", "njcreative123-dev/Stream-")
GH_RELEASE = os.environ.get("GH_RELEASE", "njstream-media")
MIRROR = "--mirror" in sys.argv or os.environ.get("MIRROR") == "1"
USE_QR = "--qr" in sys.argv or os.environ.get("USE_QR") == "1"
USE_R2 = "--r2" in sys.argv or os.environ.get("USE_R2") == "1"
for a in sys.argv[1:]:
    if a.startswith("--limit="):
        LIMIT = int(a.split("=", 1)[1])

if not (API_ID and API_HASH and (PHONE or BOT_TOKEN)):
    print("API_ID, API_HASH and (PHONE or BOT_TOKEN) are required.")
    print("Get API_ID/API_HASH at https://my.telegram.org -> API development tools")
    sys.exit(1)


def http_json(url, method="GET", payload=None, headers=None):
    import urllib.request
    req = urllib.request.Request(url, method=method, headers=headers or {})
    if payload is not None:
        req.data = json.dumps(payload).encode()
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode() or "null")


def probe(id):
    try:
        return http_json(f"{WORKER}/api/media/{id}?probe=1")
    except Exception:
        return None


def is_registered(media_id):
    p = probe(media_id)
    return bool(p and p.get("available"))


def curl_json(args):
    proc = subprocess.run(["curl", "-sS"] + args, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"curl failed: {proc.stderr[:200]}")
    return proc.stdout


def upload_github(path, name, media_id):
    """GitHub Release asset upload (permanent, any size) via curl -T."""
    headers = ["-H", "Authorization: Bearer " + GH_TOKEN,
               "-H", "Accept: application/vnd.github+json",
               "-H", "Content-Type: application/octet-stream"]
    rel = curl_json(["-H", "Authorization: Bearer " + GH_TOKEN,
                     "-H", "Accept: application/vnd.github+json",
                     "https://api.github.com/repos/%s/releases/tags/%s" % (GH_REPO, GH_RELEASE)])
    out = curl_json(headers + ["-T", path,
                    "https://uploads.github.com/repos/%s/releases/%s/assets?name=%s"
                    % (GH_REPO, rel["id"], urllib_quote(name))])
    return out["browser_download_url"]


def urllib_quote(s):
    from urllib.parse import quote
    return quote(s, safe="")


def upload_catbox(path, name, media_id):
    out = subprocess.run(
        ["curl", "-sS", "-F", "reqtype=fileupload", "-F", "fileToUpload=@%s" % path,
         "https://catbox.moe/user/api.php"],
        capture_output=True, text=True)
    if out.returncode != 0 or not out.stdout.strip().startswith("https://"):
        raise RuntimeError("catbox upload failed: " + out.stdout[:200] + out.stderr[:200])
    return out.stdout.strip()


def upload_r2(worker, path, media_id, name, mime, size):
    """Stream straight to Cloudflare R2 via worker (R2 enabled hone par)."""
    proc = subprocess.run(
        ["curl", "-sS", "-X", "POST",
         "-H", "Content-Type: " + mime,
         "-H", "x-ingest-key: " + INGEST_KEY,
         "--data-binary", "@" + path,
         "%s/api/r2/import?id=%s&name=%s&size=%d" % (worker, media_id, urllib_quote(name), size)],
        capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError("r2 import failed: " + proc.stdout[:200] + proc.stderr[:200])
    return proc.stdout.strip()


def register(media_id, url, name, mime, size, source):
    payload = {"id": str(media_id), "url": url, "name": name, "mime": mime, "size": size, "source": source}
    headers = {"Content-Type": "application/json"}
    if INGEST_KEY:
        headers["x-ingest-key"] = INGEST_KEY
    return http_json(f"{WORKER}/api/media/register", "POST", payload, headers)


async def main():
    client = TelegramClient(SESSION, API_ID, API_HASH)
    if BOT_TOKEN:
        await client.start(bot_token=BOT_TOKEN)
    elif USE_QR:
        def qr_cb(url):
            try:
                import qrcode
                qr = qrcode.QRCode(border=1)
                qr.add_data(url)
                qr.make(fit=True)
                qr.print_ascii(invert=True)
            except Exception:
                print("\n=== TELEGRAM QR LOGIN ===\nScan nahi ho raha? URL:", url)
            print("\n📱 Telegram me jaao: Settings → Devices → Link Desktop Device → QR scan karo\n")
        await client.start(qr_code_callback=qr_cb)
    else:
        await client.start(phone=PHONE)

    entity = None
    if GROUP.startswith("-") or GROUP.isdigit():
        entity = int(GROUP)
    else:
        entity = GROUP
    entity = await client.get_entity(entity)
    print(f"Connected to: {entity.title}")

    messages = []
    raw = []
    async for m in client.iter_messages(entity, limit=LIMIT):
        text = m.message or ""
        caption = getattr(getattr(m, "media", None), "caption", "") or ""
        file_name = ""
        file_size = 0
        file_id = ""
        media_type = None
        mime = ""

        if isinstance(m.media, MessageMediaPhoto):
            media_type = "photo"
            file_id = str(m.media.photo.id)
            file_size = getattr(m.media.photo, "size", 0) or 0
        elif isinstance(m.media, MessageMediaDocument):
            doc = m.media.document
            file_id = str(doc.id)
            file_size = doc.size
            for a in doc.attributes:
                if isinstance(a, DocumentAttributeFilename):
                    file_name = a.file_name
            mime = doc.mime_type or ""
            if "video" in mime:
                media_type = "video"
            elif "audio" in mime:
                media_type = "audio"
            else:
                media_type = "document"

        messages.append({
            "id": m.id,
            "date": int(m.date.timestamp()),
            "from": "",
            "text": text,
            "caption": caption,
            "has_media": media_type is not None,
            "media_type": media_type,
            "file_name": file_name,
            "file_size": file_size,
            "file_id": file_id,
        })
        raw.append((m, media_type, file_name, mime, file_size))

    print(f"Fetched {len(messages)} messages")
    if not messages:
        return

    headers = {"Content-Type": "application/json"}
    if INGEST_KEY:
        headers["x-ingest-key"] = INGEST_KEY
    chat_id = str(getattr(entity, "id", GROUP or ""))
    if str(GROUP).startswith("-"):
        chat_id = str(GROUP)
    try:
        result = http_json(f"{WORKER}/api/telegram/ingest", "POST",
                           {"chat_id": chat_id, "messages": messages}, headers)
        print("Ingest:", result)
    except Exception as e:
        print("Ingest failed (continue anyway):", e)

    if not MIRROR:
        return

    videos = [(m, name, mime, size) for (m, mt, name, mime, size) in raw if mt == "video"]
    print(f"Total videos to mirror-check: {len(videos)}")

    if not GH_TOKEN and not USE_R2:
        print("--mirror chahiye GH_TOKEN (ya --r2 with R2 enabled). Skipping mirror.")
        return

    done = skipped = failed = 0
    for m, name, mime, size in videos:
        mid = str(m.id)
        if is_registered(mid):
            print(f"[{mid}] already mirrored — skip")
            skipped += 1
            continue
        fname = name or f"video_{mid}.mp4"
        print(f"[{mid}] downloading {fname} ({round(size/1048576,1)} MB)...")
        path = None
        try:
            path = await client.download_media(m, file=tempfile.gettempdir() + f"/nj_{mid}_{fname}")
        except Exception as e:
            print(f"[{mid}] download failed: {e}")
            failed += 1
            continue
        if not path:
            failed += 1
            continue
        try:
            fsize = os.path.getsize(path)
            if USE_R2:
                print(f"[{mid}] uploading to R2...")
                up = upload_r2(WORKER, path, mid, fname, mime or "video/mp4", fsize)
                print(" ", up[:120])
                url = f"{WORKER}/api/media/{mid}"
                source = "r2"
            elif fsize <= 200 * 1024 * 1024:
                print(f"[{mid}] uploading to catbox...")
                url = upload_catbox(path, f"{mid}-{fname}", mid)
                source = "catbox"
            else:
                if not GH_TOKEN:
                    print(f"[{mid}] {round(fsize/1048576,1)}MB >200MB — GH_TOKEN chahiye. Skipping.")
                    failed += 1
                    continue
                print(f"[{mid}] uploading to GitHub Release (slow but permanent)...")
                url = upload_github(path, f"{mid}-{fname}", mid)
                source = "github"
            reg = register(mid, url, fname, mime or "video/mp4", fsize, source)
            print(f"[{mid}] registered -> play: {WORKER}/api/media/{mid}?proxy=1")
            done += 1
        except Exception as e:
            print(f"[{mid}] mirror failed: {e}")
            failed += 1
        finally:
            try:
                if path:
                    os.remove(path)
            except OSError:
                pass

    print(f"Mirror done: {done} mirrored, {skipped} already, {failed} failed")

asyncio.run(main())
print("Done! Telegram data ab site par visible + long videos NJStream par direct play/download ready.")
