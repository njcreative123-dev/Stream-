#!/usr/bin/env python3
"""NJStream MTProto downloader (resume-capable). Usage:
python3 mirror_dl.py --id 243885 --out mirror_cache/tg_243885.mkv --title "Dhamaal 4"
"""
import argparse, asyncio, os, sys, time
from telethon import TelegramClient

API_ID = 28694000
API_HASH = "401983247e9767295aac40a0b53cc07c"
BOT_TOKEN = "1389903628:AAFapVJGN4EUoGul9gvWrSkT_qM71rwZ_2k"
CHAT = -1002514429549
SESSION = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mirror_cache", "njbot_session.session")

async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", type=int, required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--title", default="")
    a = ap.parse_args()
    out = a.out
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    client = TelegramClient(SESSION, API_ID, API_HASH)
    await client.start(bot_token=BOT_TOKEN)
    try:
        m = await client.get_messages(CHAT, ids=a.id)
        if not m or not m.media:
            print(f"FAIL: message {a.id} not found / no media")
            sys.exit(2)
        d = m.media.document
        size = d.size
        cur = os.path.getsize(out) if os.path.exists(out) else 0
        if cur >= size:
            print(f"DONE: already complete {out} ({size} bytes)")
            print(f"FINAL:{out}")
            return
        print(f"INFO: {a.title or a.id} total={size} existing={cur} resume={cur>0}")
        f = open(out, "ab")
        last = time.time()
        async def prog(done, total):
            nonlocal last
            now = time.time()
            if now - last >= 5 or done >= total:
                last = now
                pct = done * 100.0 / total if total else 0
                print(f"PROG: {done}/{total} ({pct:.1f}%)", flush=True)
        try:
            async for chunk in client.iter_download(m.media, offset=cur, request_size=512 * 1024):
                f.write(chunk)
                if time.time() - last >= 5:
                    print(f"PROG: {f.tell()}/{size} ({(f.tell())*100.0/size:.1f}%)", flush=True)
                    last = time.time()
        finally:
            f.close()
        final = os.path.getsize(out)
        if final >= size:
            print(f"DONE: {out} complete ({final} bytes)")
            print(f"FINAL:{out}")
        else:
            print(f"FAIL: incomplete {final}/{size}")
            sys.exit(3)
    finally:
        await client.disconnect()

asyncio.run(main())
