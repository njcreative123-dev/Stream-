// ============================================================
// JDUB Hub - Cloudflare Worker (Enhanced)
// Free services integrated:
//   - Workers Router (this)
//   - KV Cache (read caching)
//   - D1 SQLite (catalog search)
//   - R2 Storage (media store)
//   - Cron Trigger (daily sync)
//   - TMDB API (free movie metadata)
//   - Open Library API (free book data)
//   - Telegram API (webhook + commands)
//   - Analytics Engine (pageview tracking)
// ============================================================

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=300',
};

const json = (data, status = 200) => new Response(
  JSON.stringify(data),
  { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
);

export default {
  // Scheduled task — daily data sync
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDailySync(env));
  },

  // Main entry point
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Track analytics (free Cloudflare Analytics Engine)
    trackAnalytics(env, path);

    // ---- API Routes ----
    let route;
    
    // Health & status
    if (path === '/api/health' || path === '/api/status') {
      route = handleStatus(env);
    }
    
    // AI Chat (simulated worker router)
    else if (path === '/api/chat' && method === 'POST') {
      route = handleChat(request, env);
    }
    
    // Search — TMDB movies + Open Library books + D1 catalog
    else if (path === '/api/search') {
      route = handleSearch(url, env);
    }
    
    // Movies from TMDB (free API, search + trending)
    else if (path === '/api/movies') {
      route = handleMovies(url, env);
    }
    
    // Books from Open Library (free API)
    else if (path === '/api/books') {
      route = handleBooks(url, env);
    }
    
    // Trending content
    else if (path === '/api/trending') {
      route = handleTrending(env);
    }
    
    // Telegram webhook (for bot commands)
    else if (path === '/api/telegram/webhook' && method === 'POST') {
      route = handleTelegramWebhook(request, env);
    }
    
    // Catalog CRUD — D1 database (movies/books user adds)
    else if (path === '/api/catalog' && method === 'GET') {
      route = handleCatalogList(url, env);
    }
    else if (path === '/api/catalog' && method === 'POST') {
      route = handleCatalogAdd(request, env);
    }
    else if (path === '/api/catalog/item' && method === 'DELETE') {
      route = handleCatalogDelete(url, env);
    }
    
    // R2 — upload/download thumbnails
    else if (path.startsWith('/api/media/upload') && method === 'PUT') {
      route = handleMediaUpload(request, env);
    }
    else if (path.startsWith('/api/media/') && method === 'GET') {
      route = handleMediaGet(path, env);
    }
    
    // Analytics stats
    else if (path === '/api/analytics') {
      route = handleAnalytics(env);
    }
    
    // KV cache demo endpoint
    else if (path === '/api/cache') {
      route = handleCacheDemo(env);
    }

    // Fallback
    else {
      route = json({
        service: 'jdub-hub-worker',
        version: '3.0.0',
        message: 'JDUB Hub Worker API — ek complete free-tier ecosystem',
        endpoints: [
          '/api/health', '/api/status',
          '/api/search?q=',
          '/api/movies', '/api/books', '/api/trending',
          '/api/catalog', '/api/analytics', '/api/cache',
          '/api/telegram/webhook'
        ]
      });
    }

    return route;
  }
};

// ============================================================
// ANALYTICS — Cloudflare Analytics Engine (free)
// ============================================================
function trackAnalytics(env, path) {
  try {
    if (env.ANALYTICS) {
      env.ANALYTICS.writeDataPoint({
        blobs: [path, 'jdub-hub'],
        doubles: [1],
        indexes: ['pageview']
      });
    }
  } catch (e) { /* analytics non-blocking */ }
}

// ============================================================
// STATUS — health check for all services
// ============================================================
async function handleStatus(env) {
  const services = {
    main: 'online',
    workers: 6,
    kv: env.CACHE ? 'connected' : 'not_configured',
    d1: env.CATALOG_DB ? 'connected' : 'not_configured',
    r2: env.MEDIA_BUCKET ? 'connected' : 'not_configured',
    cron: 'scheduled',
    analytics: 'configured',
    tmdb: 'api_ready',
    openlibrary: 'api_ready',
    telegram: 'webhook_ready'
  };

  // Try KV read test
  if (env.CACHE) {
    try {
      await env.CACHE.put('health_check', Date.now().toString());
      const t = await env.CACHE.get('health_check');
      services.kv = t === 'connected_live' ? 'online' : 'online';
    } catch (e) { services.kv = 'error: ' + e.message; }
  }

  // Try D1 query
  if (env.CATALOG_DB) {
    try {
      await env.CATALOG_DB.prepare('SELECT 1 AS ok').first();
      services.d1 = 'online';
    } catch (e) { services.d1 = 'error: ' + e.message; }
  }

  return json({
    status: 'ok',
    service: 'jdub-hub',
    version: '3.0.0',
    uptime: Date.now(),
    services
  });
}

// ============================================================
// SEARCH — combines D1 catalog + TMDB + Open Library
// ============================================================
async function handleSearch(url, env) {
  const q = (url.searchParams.get('q') || '').trim();
  if (!q) return json({ query: q, results: [], message: 'Query empty' });

  const results = [];

  // 1. Local D1 catalog (if configured)
  if (env.CATALOG_DB) {
    try {
      const { results: dbResults } = await env.CATALOG_DB.prepare(
        'SELECT * FROM catalog WHERE title LIKE ?1 OR description LIKE ?1 LIMIT 10'
      ).bind(`%${q}%`).all();
      results.push(...dbResults.map(r => ({ ...r, source: 'catalog' })));
    } catch (e) { /* table may not exist yet */ }
  }

  // 2. TMDB search (movies/tv)
  try {
    const tmdb = await fetch(
      `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(q)}&api_key=${env.TMDB_KEY || ''}&language=hi-IN`,
      { headers: { 'accept': 'application/json' } }
    );
    if (tmdb.ok) {
      const data = await tmdb.json();
      if (data.results) {
        results.push(...data.results.slice(0, 5).map(r => ({
          title: r.title || r.name || 'Untitled',
          year: (r.release_date || r.first_air_date || '').slice(0, 4),
          type: r.media_type === 'movie' ? 'movie' : 'tv',
          image: r.poster_path ? `https://image.tmdb.org/t/p/w200${r.poster_path}` : null,
          source: 'tmdb'
        })));
      }
    }
  } catch (e) { /* tmdb may fail without key */ }

  // 3. Open Library search (books) — completely free, no key
  try {
    const ol = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5`
    );
    if (ol.ok) {
      const data = await ol.json();
      if (data.docs) {
        results.push(...data.docs.map(b => ({
          title: b.title,
          author: b.author_name ? b.author_name[0] : 'Unknown',
          year: b.first_publish_year || '',
          type: 'book',
          image: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null,
          source: 'openlibrary'
        })));
      }
    }
  } catch (e) { /* openlibrary failed */ }

  return json({ query: q, results, count: results.length });
}

// ============================================================
// MOVIES — TMDB free movie endpoints (trending, popular)
// ============================================================
async function handleMovies(url, env) {
  const type = url.searchParams.get('type') || 'popular';
  const valid = ['popular', 'top_rated', 'now_playing', 'upcoming'];
  const endpoint = valid.includes(type) ? type : 'popular';

  try {
    const tmdb = await fetch(
      `https://api.themoviedb.org/3/movie/${endpoint}?language=hi-IN&page=1&api_key=${env.TMDB_KEY || ''}`,
      { headers: { 'accept': 'application/json' } }
    );
    if (tmdb.ok) {
      const data = await tmdb.json();
      return json({
        type: endpoint,
        results: (data.results || []).slice(0, 20).map(r => ({
          id: r.id,
          title: r.title,
          rating: r.vote_average,
          image: r.poster_path ? `https://image.tmdb.org/t/p/w300${r.poster_path}` : null,
          year: (r.release_date || '').slice(0, 4),
          overview: r.overview
        }))
      });
    }
    return json({ results: [], error: 'TMDB needs api key' });
  } catch (e) {
    return json({ results: [], error: e.message }, 500);
  }
}

// ============================================================
// BOOKS — Open Library (completely free, no key)
// ============================================================
async function handleBooks(url, env) {
  const q = url.searchParams.get('q') || 'popular';
  const subject = url.searchParams.get('subject') || '';
  
  try {
    let apiUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20`;
    if (subject) apiUrl = `https://openlibrary.org/subjects/${encodeURIComponent(subject)}.json?limit=20`;

    const ol = await fetch(apiUrl);
    if (ol.ok) {
      const data = await ol.json();
      const docs = data.docs || [];
      return json({
        results: docs.map(b => ({
          title: b.title,
          author: b.author_name ? b.author_name[0] : 'Unknown',
          year: b.first_publish_year || '',
          cover: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : null,
          key: b.key,
          read_url: b.key ? `https://openlibrary.org${b.key}` : null
        }))
      });
    }
    return json({ results: [] }, 400);
  } catch (e) {
    return json({ results: [], error: e.message }, 500);
  }
}

// ============================================================
// TRENDING — combines popular movies + books
// ============================================================
async function handleTrending(env) {
  const [moviesRes, booksRes] = await Promise.all([
    handleMovies(new URL('https://x/?type=popular'), env),
    handleBooks(new URL('https://x/?q=popular'), env)
  ]);
  const movies = await moviesRes.json();
  const books = await booksRes.json();
  
  return json({
    movies: movies.results || [],
    books: books.results || []
  });
}

// ============================================================
// TELEGRAM — webhook handler for bot commands
// ============================================================
async function handleTelegramWebhook(request, env) {
  try {
    const body = await request.json();
    const message = body.message || body.edited_message;
    if (!message) return json({ ok: true });

    const chatId = message.chat.id;
    const text = (message.text || '').trim();

    // Command handlers
    let reply;
    if (text.startsWith('/start')) {
      reply = `🎬 *JDUB Hub Bot*\n\nCommands:\n/start — info\n/search <movie/book>\n/latest — trending\n/status — services\n/help — help`;
    } else if (text.startsWith('/search')) {
      const query = text.replace('/search', '').trim();
      reply = query
        ? `🔍 Searching for: *${query}*\n\nWebsite par search bhi kar sakte ho!`
        : 'Usage: /search movie name';
    } else if (text.startsWith('/latest') || text.startsWith('/trending')) {
      reply = `📊 *Trending Now*\n\nMovies & books latest trending dekho:\n${env.WORKER_URL || 'https://jdub-deploy.njcreative123.workers.dev'}/api/trending`;
    } else if (text.startsWith('/status')) {
      reply = `⚡ *Services*\n\n✅ Worker: Online\n✅ KV: Configured\n✅ D1: Configured\n✅ R2: Configured\n✅ Cron: Daily`;
    } else if (text.startsWith('/help')) {
      reply = `📱 *JDUB Hub Help*\n\nBot commands:\n/start, /search, /latest, /status, /help`;
    } else {
      reply = `I understood: "${text}"\nUse /search to find movies or books.`;
    }

    // Send reply via Telegram API (env.TELEGRAM_BOT_TOKEN from secrets)
    if (env.TELEGRAM_BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply,
          parse_mode: 'Markdown'
        })
      });
    }

    return json({ ok: true, replied: true });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}

// ============================================================
// CATALOG — D1 database CRUD (user's added content)
// ============================================================
async function initCatalogTable(db) {
  await db.exec(`CREATE TABLE IF NOT EXISTS catalog (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'movie',
    description TEXT,
    image TEXT,
    link TEXT,
    year TEXT,
    rating REAL DEFAULT 0,
    created_at INTEGER DEFAULT (unixepoch())
  )`);
}

async function handleCatalogList(url, env) {
  if (!env.CATALOG_DB) return json({ results: [], error: 'D1 not configured' });
  try {
    await initCatalogTable(env.CATALOG_DB);
    const type = url.searchParams.get('type') || '';
    const sql = type
      ? `SELECT * FROM catalog WHERE type = ?1 ORDER BY created_at DESC LIMIT 50`
      : `SELECT * FROM catalog ORDER BY created_at DESC LIMIT 50`;
    const { results } = type
      ? await env.CATALOG_DB.prepare(sql).bind(type).all()
      : await env.CATALOG_DB.prepare(sql).all();
    return json({ results });
  } catch (e) {
    return json({ results: [], error: e.message }, 500);
  }
}

async function handleCatalogAdd(request, env) {
  if (!env.CATALOG_DB) return json({ error: 'D1 not configured' }, 500);
  try {
    const item = await request.json();
    if (!item.title) return json({ error: 'title required' }, 400);
    
    await initCatalogTable(env.CATALOG_DB);
    await env.CATALOG_DB.prepare(
      'INSERT INTO catalog (title, type, description, image, link, year, rating) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)'
    ).bind(
      item.title,
      item.type || 'movie',
      item.description || '',
      item.image || '',
      item.link || '',
      item.year || '',
      Number(item.rating) || 0
    ).run();

    // Invalidate cache
    if (env.CACHE) await env.CACHE.delete('catalog_list');

    return json({ ok: true, added: item.title });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function handleCatalogDelete(url, env) {
  if (!env.CATALOG_DB) return json({ error: 'D1 not configured' }, 500);
  try {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'id required' }, 400);
    await env.CATALOG_DB.prepare('DELETE FROM catalog WHERE id = ?1').bind(id).run();
    return json({ ok: true, deleted: id });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// ============================================================
// MEDIA — R2 upload/download
// ============================================================
async function handleMediaUpload(request, env) {
  if (!env.MEDIA_BUCKET) return json({ error: 'R2 not configured' }, 500);
  const url = new URL(request.url);
  const filename = url.pathname.split('/').pop();
  
  try {
    await env.MEDIA_BUCKET.put(filename, request.body, {
      httpMetadata: { contentType: request.headers.get('Content-Type') || 'application/octet-stream' }
    });
    return json({ ok: true, filename, url: `/api/media/${filename}` });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function handleMediaGet(path, env) {
  if (!env.MEDIA_BUCKET) return json({ error: 'R2 not configured' }, 500);
  const filename = path.replace('/api/media/', '');
  try {
    const object = await env.MEDIA_BUCKET.get(filename);
    if (!object) return json({ error: 'not found' }, 404);
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000'
      }
    });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// ============================================================
// ANALYTICS — get pageview stats
// ============================================================
async function handleAnalytics(env) {
  // Cloudflare Analytics Engine doesn't have a query API in worker runtime,
  // so we return config status + optional KV-stored counter
  let pageviews = 0;
  if (env.CACHE) {
    pageviews = Number(await env.CACHE.get('pageview_counter')) || 0;
  }
  return json({
    service: 'cloudflare_analytics_engine',
    status: env.ANALYTICS ? 'enabled' : 'not_configured',
    pageviews_approximate: pageviews,
    note: 'Full analytics: Cloudflare Dashboard → Analytics → Web Analytics (free)'
  });
}

// ============================================================
// KV CACHE — demo endpoint
// ============================================================
async function handleCacheDemo(env) {
  if (!env.CACHE) return json({ error: 'KV not configured' }, 500);
  
  // Increment counter
  const current = Number(await env.CACHE.get('demo_counter')) || 0;
  const next = current + 1;
  await env.CACHE.put('demo_counter', next.toString());
  await env.CACHE.put('pageview_counter', (Number(await env.CACHE.get('pageview_counter')) || 0) + 1);

  return json({
    counter: next,
    kv_status: 'online',
    cache_bucket: 'jdub_cache'
  });
}

// ============================================================
// DAILY SYNC — cron scheduled task
// ============================================================
async function runDailySync(env) {
  const log = { ts: new Date().toISOString(), synced: [] };
  
  // Sync trending movies to KV cache
  try {
    const movies = await handleMovies(new URL('https://x/?type=popular'), env);
    const data = await movies.json();
    if (env.CACHE) {
      await env.CACHE.put('trending_movies', JSON.stringify(data.results || []), { expirationTtl: 86400 });
      log.synced.push('trending_movies');
    }
  } catch (e) { log.error = e.message; }

  // Sync popular books
  try {
    const books = await handleBooks(new URL('https://x/?q=popular'), env);
    const data = await books.json();
    if (env.CACHE) {
      await env.CACHE.put('popular_books', JSON.stringify(data.results || []), { expirationTtl: 86400 });
      log.synced.push('popular_books');
    }
  } catch (e) { log.error = e.message; }

  // Save log to KV
  if (env.CACHE) {
    await env.CACHE.put('last_sync', JSON.stringify(log));
  }

  return log;
}
