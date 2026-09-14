from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import subprocess, json, os, time, hashlib

app = FastAPI(title="MovieBox API", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SEARCH_CACHE = {}
CACHE_TTL = 600  # 10 min

@app.get("/health")
async def health():
    return {"status": "ok", "service": "moviebox-api", "version": "1.0"}

@app.get("/search")
async def search(q: str = Query(..., min_length=2)):
    cache_key = hashlib.md5(q.encode()).hexdigest()
    if cache_key in SEARCH_CACHE:
        cached = SEARCH_CACHE[cache_key]
        if time.time() - cached["ts"] < CACHE_TTL:
            return cached["data"]
    try:
        result = subprocess.run(
            ["moviebox-tui", "search", q, "--json"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0 and result.stdout.strip():
            data = json.loads(result.stdout)
        else:
            data = {"results": [], "error": "no results or timeout"}
    except FileNotFoundError:
        data = {"results": [], "error": "moviebox-tui not installed"}
    except subprocess.TimeoutExpired:
        data = {"results": [], "error": "search timeout"}
    except Exception as e:
        data = {"results": [], "error": str(e)}
    SEARCH_CACHE[cache_key] = {"data": data, "ts": time.time()}
    return data

@app.get("/stream")
async def stream(movie_id: str = Query(...)):
    try:
        result = subprocess.run(
            ["moviebox-tui", "stream", movie_id, "--json"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0 and result.stdout.strip():
            data = json.loads(result.stdout)
            return {"stream_url": data.get("url",""), "quality": data.get("quality",""), "subtitles": data.get("subs",[])}
        return {"error": "stream not found"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/categories")
async def categories():
    return {"categories": ["trending","popular","new","action","comedy","drama","horror","romance","thriller","scifi"]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
