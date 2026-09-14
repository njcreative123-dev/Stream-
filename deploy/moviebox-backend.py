#!/usr/bin/env python3
"""
NJStream MovieBox Backend
Provides search, detail, and stream URL extraction from MovieBox API.
Deploy on VPSWala or any Python server.
"""
import hashlib, hmac, json, os, random, string, time, asyncio
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="NJStream MovieBox API", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

HOSTS = [
    "https://api6.aoneroom.com",
    "https://api5.aoneroom.com",
    "https://api4.aoneroom.com",
    "https://api.inmoviebox.com",
    "https://api3.aoneroom.com",
]

SEARCH_CACHE = {}
STREAM_CACHE = {}
CACHE_TTL = 600

def generate_client_info():
    chars = string.ascii_lowercase + string.digits
    ver = f"{random.randint(4,5)}.{random.randint(0,9)}.{random.randint(0,9)}"
    build = random.randint(200, 300)
    ci = f"com.community.boxip.TvBrowser:{ver}:{build}"
    ua = f"Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{random.randint(100,120)}.0.0.0 Mobile Safari/537.36"
    return ci, ua

def random_ip():
    return f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"

def build_sign_headers(method, path, body=None, client_info="", spoofed_ip=""):
    ts = str(int(time.time()))
    nonce = ''.join(random.choices(string.ascii_lowercase + string.digits, k=16))
    raw = f"{method}{path}{ts}{nonce}"
    if body:
        raw += body
    sign = hmac.new(b"mobile-bff", raw.encode(), hashlib.sha256).hexdigest()
    return {
        "x-auth": sign,
        "x-client-info": client_info,
        "x-app-version": "4.9",
        "x-timestamp": ts,
        "x-nonce": nonce,
        "x-forwarded-for": spoofed_ip,
        "x-client-id": "web",
        "accept": "application/json",
    }

class MovieBoxAPI:
    def __init__(self):
        self.token = None
        self.uid = None
        self.client_info, self.user_agent = generate_client_info()
        self.spoofed_ip = random_ip()
        self.active_host_idx = 0
    
    @property
    def host(self):
        return HOSTS[self.active_host_idx % len(HOSTS)]
    
    async def init_session(self, client):
        path = "/wefeed-mobile-bff/user-api/visitor-login"
        headers = build_sign_headers("POST", path, "{}", self.client_info, self.spoofed_ip)
        headers["user-agent"] = self.user_agent
        headers["content-type"] = "application/json"
        
        for i in range(len(HOSTS)):
            try:
                r = await client.post(f"{self.host}{path}", headers=headers, content="{}", timeout=10)
                if r.status_code == 200:
                    data = r.json()
                    self.token = data.get("token")
                    self.uid = str(data.get("uid", data.get("userId", "")))
                    if self.token:
                        return True
                self.active_host_idx += 1
            except Exception:
                self.active_host_idx += 1
        return False
    
    async def request(self, client, method, path, body=None):
        if not self.token:
            await self.init_session(client)
        if not self.token:
            return None
        
        headers = build_sign_headers(method, path, body, self.client_info, self.spoofed_ip)
        headers["user-agent"] = self.user_agent
        headers["authorization"] = self.token
        headers["content-type"] = "application/json"
        
        url = f"{self.host}{path}"
        try:
            if method == "GET":
                r = await client.get(url, headers=headers, timeout=12)
            else:
                r = await client.post(url, headers=headers, content=body or "{}", timeout=12)
            
            if r.status_code in (403, 429, 500, 502, 503):
                self.active_host_idx += 1
                return None
            
            # Absorb new token from x-user header
            x_user = r.headers.get("x-user", "")
            if x_user:
                try:
                    ud = json.loads(x_user)
                    if ud.get("token"):
                        self.token = ud["token"]
                except: pass
            
            return r.json() if r.status_code == 200 else None
        except Exception:
            return None

api = MovieBoxAPI()

@app.on_event("startup")
async def startup():
    async with httpx.AsyncClient() as c:
        await api.init_session(c)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "moviebox-api", "token": bool(api.token)}

@app.get("/search")
async def search(q: str = Query(..., min_length=2)):
    cache_key = hashlib.md5(q.encode()).hexdigest()
    if cache_key in SEARCH_CACHE:
        cached = SEARCH_CACHE[cache_key]
        if time.time() - cached["ts"] < CACHE_TTL:
            return cached["data"]
    
    async with httpx.AsyncClient() as client:
        path = f"/wefeed-mobile-bff/search-api/search?keyword={q}&page=1&page_size=20"
        data = await api.request(client, "GET", path)
    
    if not data:
        return {"results": [], "error": "search failed"}
    
    items = data.get("data", data.get("list", []))
    results = []
    for item in items[:20]:
        results.append({
            "id": str(item.get("id", "")),
            "title": item.get("title", item.get("name", "")),
            "year": str(item.get("release_year", item.get("year", ""))),
            "poster": item.get("poster", item.get("cover", "")),
            "type": item.get("type", item.get("media_type", "movie")),
            "rating": item.get("rating", ""),
            "provider": "moviebox",
        })
    
    resp = {"results": results, "total": len(results), "query": q}
    SEARCH_CACHE[cache_key] = {"data": resp, "ts": time.time()}
    return resp

@app.get("/detail/{subject_id}")
async def detail(subject_id: str):
    async with httpx.AsyncClient() as client:
        path = f"/wefeed-mobile-bff/subject-api/subject?subject_id={subject_id}"
        data = await api.request(client, "GET", path)
    
    if not data:
        return {"error": "detail not found"}
    
    d = data.get("data", data)
    return {
        "id": subject_id,
        "title": d.get("title", ""),
        "description": d.get("description", ""),
        "year": d.get("release_year", ""),
        "poster": d.get("poster", ""),
        "rating": d.get("rating", ""),
        "genres": d.get("genres", []),
        "seasons": d.get("seasons", []),
        "episodes": d.get("episodes", []),
    }

@app.get("/stream/{subject_id}")
async def stream(subject_id: str, season: int = 1, episode: int = 1):
    cache_key = f"{subject_id}:{season}:{episode}"
    if cache_key in STREAM_CACHE:
        cached = STREAM_CACHE[cache_key]
        if time.time() - cached["ts"] < 300:
            return cached["data"]
    
    async with httpx.AsyncClient() as client:
        path = f"/wefeed-mobile-bff/subject-api/episode?subject_id={subject_id}&season={season}&episode={episode}"
        data = await api.request(client, "GET", path)
    
    if not data:
        return {"error": "stream not found"}
    
    ep = data.get("data", data)
    streams = ep.get("streams", ep.get("urls", []))
    result = {
        "subject_id": subject_id,
        "season": season,
        "episode": episode,
        "title": ep.get("title", ""),
        "streams": streams,
        "subtitles": ep.get("subtitles", []),
    }
    
    if streams:
        best = streams[0]
        result["stream_url"] = best.get("url", best.get("file", ""))
        result["quality"] = best.get("quality", best.get("name", ""))
    
    STREAM_CACHE[cache_key] = {"data": result, "ts": time.time()}
    return result

@app.get("/trending")
async def trending():
    async with httpx.AsyncClient() as client:
        path = "/wefeed-mobile-bff/subject-api/rank?rank_type=1&page=1&page_size=20"
        data = await api.request(client, "GET", path)
    
    if not data:
        return {"results": []}
    
    items = data.get("data", data).get("list", [])
    results = []
    for item in items[:20]:
        results.append({
            "id": str(item.get("id", "")),
            "title": item.get("title", ""),
            "poster": item.get("poster", ""),
            "year": str(item.get("release_year", "")),
            "rating": item.get("rating", ""),
            "type": item.get("type", "movie"),
        })
    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
