#!/usr/bin/env python3
"""Resumable GitHub release asset upload (chunked, retry-safe).
Usage: python3 gh_resumable_upload.py <token> <owner> <repo> <release_id> <name> <file> [chunk_mb]
"""
import json, os, sys, time, urllib.request, urllib.error

def req(method, url, headers=None, body=None):
    r = urllib.request.Request(url, method=method, headers=headers or {}, data=body)
    try:
        with urllib.request.urlopen(r, timeout=120) as resp:
            return resp.status, dict(resp.headers), resp.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()

def main():
    token, owner, repo, rid, name, path = sys.argv[1:7]
    chunk_mb = int(sys.argv[7]) if len(sys.argv) > 7 else 25
    size = os.path.getsize(path)
    base = f"https://uploads.github.com/repos/{owner}/{repo}/releases/{rid}/assets?name={urllib.parse.quote(name)}"
    chunk = chunk_mb * 1024 * 1024
    offset = 0
    loc = None
    with open(path, 'rb') as f:
        while offset < size:
            data = f.read(chunk)
            end = min(offset + len(data) - 1, size - 1)
            h = {
                'Authorization': f'Bearer {token}',
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/octet-stream',
                'Content-Range': f'bytes {offset}-{end}/{size}',
            }
            url = loc if loc else base
            method = 'PUT' if loc else 'POST'
            # retry loop
            for attempt in range(5):
                try:
                    code, hdrs, body = req(method, url, h, data)
                    if code in (202, 201, 200):
                        if code == 202 and not loc:
                            loc = hdrs.get('Location')
                        if 'Location' in hdrs:
                            loc = hdrs['Location']
                        pct = (end + 1) * 100 / size
                        print(f'chunk {offset//chunk} -> HTTP {code} [{pct:.1f}%] loc={bool(loc)}', flush=True)
                        offset += len(data)
                        break
                    else:
                        print(f'chunk {offset//chunk} -> HTTP {code} {body[:300]} retry {attempt}', flush=True)
                        time.sleep(2 ** attempt)
                except Exception as e:
                    print(f'chunk {offset//chunk} -> EXC {e} retry {attempt}', flush=True)
                    time.sleep(2 ** attempt)
            else:
                print('FAILED at offset', offset, flush=True)
                sys.exit(2)
    print('DONE', flush=True)

if __name__ == '__main__':
    import urllib.parse  # ensure import
    main()
