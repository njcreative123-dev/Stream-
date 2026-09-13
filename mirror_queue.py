import asyncio, os, time
from telethon import TelegramClient, utils

API_ID = 28694000
API_HASH = '401983247e9767295aac40a0b53cc07c'
BOT_TOKEN = '1389903628:AAFapVJGN4EUoGul9gvWrSkT_qM71rwZ_2k'
CHAT = -1002514429549
SESSION = os.path.join('mirror_cache', 'queue_session.session')
IDS = [243915, 243906, 243846, 243844, 243834, 243876]

def slug(n):
    n = (n or '').replace('.mkv','').replace('.mp4','').replace('.avi','')
    n = ''.join(c if c.isalnum() or c in '-_ .' else ' ' for c in n)
    n = ' '.join(n.split())[:90]
    return n or 'video'

async def main():
    c = TelegramClient(SESSION, API_ID, API_HASH)
    await c.start(bot_token=BOT_TOKEN)
    for mid in IDS:
        out = f'mirror_cache/tg_{mid}.mp4'
        try:
            m = await c.get_messages(CHAT, ids=mid)
            if not m or not m.media:
                print(f'NO MEDIA {mid}', flush=True); continue
            d = m.media.document or m.media.video
            sz = d.size if d else 0
            cur = os.path.getsize(out) if os.path.exists(out) else 0
            name = d.attributes and next((a.file_name for a in d.attributes if hasattr(a,'file_name')), None) or (m.message or '')[:80]
            print(f'START {mid} name={name!r} total={sz/1048576:.1f}MB existing={cur/1048576:.1f}MB', flush=True)
            if cur >= sz:
                print(f'ALREADY DONE {mid}', flush=True); continue
            with open(out, 'ab') as f: pass
            async for chunk in c.iter_download(m.media, offset=cur, request_size=1024*1024):
                with open(out, 'ab') as f: f.write(chunk)
                done = os.path.getsize(out)
                if done % (30*1024*1024) < 1024*1024:
                    print(f'PROG {mid} {done/1048576:.0f}/{sz/1048576:.0f} ({done*100/sz:.0f}%)', flush=True)
            print(f'DONE {mid} file={out} size={os.path.getsize(out)} name={name!r} slug={slug(name)}', flush=True)
        except Exception as e:
            print(f'ERR {mid}: {e}', flush=True)
    await c.disconnect()
    print('QUEUE COMPLETE', flush=True)

asyncio.run(main())
