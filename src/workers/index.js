// ============================================================
// NJStream — Cloudflare Worker v5.0
// All-in-One: Live TV, Telegram, AI, Movies, Books
// ============================================================

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

function json(d, s = 200) {
  return new Response(JSON.stringify(d), {
    status: s,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function html(content) {
  return new Response(content, {
    headers: { ...CORS, 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'public,max-age=60' },
  });
}

// ============================================================
// IPTV SOURCES — Hindi + World
// ============================================================
const IPTV_SOURCES = [
  { name: 'India Hindi', url: 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u' },
  { name: 'World Hindi', url: 'https://raw.githubusercontent.com/Free-TV/IPTV/main/streams/India.m3u' },
];

const HINDI_KEYWORDS = [
  'hindi','star plus','sony sab','sony','zee tv','zee','colors','and tv','star bharat',
  'news18','aaj tak','abp news','zee news','ndtv','republic','times now','india tv',
  'dd national','dd news','star gold','zee cinema','sony max','set max','b4u','zee anmol',
  'star utsav','sony wah','big magic','rishtey','alliance','entertainment',
  'mtv','bindass','sab','disney','hungama','nick','pogo','cartoon',
  'tsp1','tsp2','tsp3','sports18','jio cinema','jiocinema',
];

function isHindi(name) {
  const n = name.toLowerCase();
  return HINDI_KEYWORDS.some(k => n.includes(k));
}

async function parseM3U(url) {
  try {
    const resp = await fetch(url, { redirect: 'follow' });
    if (!resp.ok) return [];
    const text = await resp.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const channels = [];
    let current = {};
    for (const line of lines) {
      if (line.startsWith('#EXTINF:')) {
        const nameMatch = line.match(/,(.+)$/);
        const logoMatch = line.match(/tvg-logo="([^"]*)"/i) || line.match(/logo="([^"]*)"/i);
        const groupMatch = line.match(/group-title="([^"]*)"/i);
        current = {
          name: nameMatch ? nameMatch[1].trim() : 'Unknown',
          logo: logoMatch ? logoMatch[1] : '',
          group: groupMatch ? groupMatch[1] : 'General',
        };
      } else if (line && !line.startsWith('#') && (line.startsWith('http') || line.startsWith('rtmp'))) {
        current.url = line;
        current.hindi = isHindi(current.name) || isHindi(current.group);
        channels.push(current);
        current = {};
      }
    }
    return channels;
  } catch (e) {
    console.error('M3U parse error:', e);
    return [];
  }
}

// ============================================================
// ROUTING
// ============================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return new Response(null, { headers: CORS });

    try {
      // --- Telegram ---
      if (path === '/api/telegram/webhook' && method === 'POST')
        return handleTelegramWebhook(request, env);
      if (path === '/api/telegram/messages')
        return handleTelegramMessages(url, env);
      if (path === '/api/telegram/file') return handleTelegramFile(url, env);
      if (path === '/api/telegram/sync' && method === 'POST')
        return handleTelegramSync(env);
      if (path === '/api/telegram/ingest' && method === 'POST')
        return handleTelegramIngest(request, env);
      if (path === '/api/telegram/stats')
        return handleTelegramStats(env);

      // --- Live TV ---
      if (path === '/api/live-tv')
        return handleLiveTV(url, env);
      if (path === '/api/live-tv/stream')
        return handleLiveTVStream(url);

      // --- Movies ---
      if (path === '/api/movies')
        return handleMovies(url, env);

      // --- Books ---
      if (path === '/api/books')
        return handleBooks(url, env);

      // --- Search ---
      if (path === '/api/search')
        return handleSearch(url, env);

      // --- Chat ---
      if (path === '/api/chat' && method === 'POST')
        return handleChat(request, env);

      // --- Catalog (D1) ---
      if (path === '/api/catalog' && method === 'GET')
        return handleCatalogList(env);
      if (path === '/api/catalog' && method === 'POST')
        return handleCatalogAdd(request, env);
      if (path === '/api/catalog' && method === 'DELETE')
        return handleCatalogDelete(url, env);

      // --- Status ---
      if (path === '/api/status' || path === '/api/health')
        return handleStatus(env);

      // --- Frontend ---
      if (path === '/' || path === '/index.html')
        return html(INDEX_HTML);
      if (path === '/css/style.css')
        return new Response(STYLE_CSS, { headers: { ...CORS, 'Content-Type': 'text/css', 'Cache-Control': 'public,max-age=3600' } });
      if (path === '/js/app.js')
        return new Response(APP_JS, { headers: { ...CORS, 'Content-Type': 'application/javascript', 'Cache-Control': 'public,max-age=3600' } });

      // --- 404 ---
      return json({ error: 'Not Found', endpoints: ['/api/status','/api/telegram/messages','/api/live-tv','/api/movies','/api/books','/api/search','/api/chat','/api/catalog'] }, 404);
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runScheduledSync(env));
  },
};

// ============================================================
// TELEGRAM — Webhook & Data Storage
// ============================================================
async function handleTelegramWebhook(request, env) {
  try {
    const update = await request.json();
    const msg = update.message || update.channel_post || update.edited_message;
    if (!msg) return json({ ok: true });

    const chatId = msg.chat?.id?.toString();
    const allowedChat = env.TG_CHAT_ID;

    if (allowedChat && chatId !== allowedChat) return json({ ok: true });

    const fileId = (msg.photo ? msg.photo[msg.photo.length - 1]?.file_id : null) || msg.document?.file_id || msg.video?.file_id || msg.audio?.file_id || msg.voice?.file_id || '';
    let fileUrl = '';
    if (fileId && env.TG_BOT_TOKEN) {
      try {
        const f = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/getFile?file_id=${fileId}`);
        const fd = await f.json();
        if (fd.ok && fd.result?.file_path) fileUrl = `https://api.telegram.org/file/bot${env.TG_BOT_TOKEN}/${fd.result.file_path}`;
      } catch (e) {}
    }
    const entry = {
      id: msg.message_id,
      chat_id: chatId,
      date: msg.date,
      from: msg.from?.first_name || (msg.sender_chat ? (msg.sender_chat.title || msg.sender_chat.username || 'Channel') : 'Unknown'),
      text: msg.text || '',
      has_media: !!(msg.photo || msg.document || msg.video || msg.audio || msg.voice || msg.animation),
      media_type: msg.photo ? 'photo' : msg.document ? 'document' : msg.video ? 'video' : msg.audio ? 'audio' : msg.voice ? 'voice' : msg.animation ? 'animation' : null,
      file_name: msg.document?.file_name || msg.video?.file_name || '',
      file_size: msg.document?.file_size || msg.video?.file_size || msg.audio?.file_size || 0,
      file_id: fileId,
      file_url: fileUrl,
      caption: msg.caption || '',
      views: msg.views || 0,
      forwards: msg.forwards || 0,
    };

    // Store in KV
    if (env.KV_STORE) {
      // Store individual message
      await env.KV_STORE.put(`msg:${chatId}:${msg.message_id}`, JSON.stringify(entry), { expirationTtl: 2592000 });

      // Update message index (keep last 5000)
      const indexKey = `index:${chatId}`;
      const existing = await env.KV_STORE.get(indexKey, { type: 'json' }) || { ids: [], total: 0, last_sync: 0 };
      existing.ids = [msg.message_id, ...existing.ids.filter(id => id !== msg.message_id)].slice(0, 5000);
      existing.total = existing.total + 1;
      existing.last_sync = Date.now();
      await env.KV_STORE.put(indexKey, JSON.stringify(existing), { expirationTtl: 2592000 });

      // Update stats
      const statsKey = `stats:${chatId}`;
      const stats = await env.KV_STORE.get(statsKey, { type: 'json' }) || { total: 0, photos: 0, videos: 0, documents: 0, audios: 0 };
      stats.total++;
      if (entry.media_type === 'photo') stats.photos++;
      else if (entry.media_type === 'video') stats.videos++;
      else if (entry.media_type === 'document') stats.documents++;
      else if (entry.media_type === 'audio') stats.audios++;
      await env.KV_STORE.put(statsKey, JSON.stringify(stats), { expirationTtl: 2592000 });
    }

    // Set webhook URL if not set
    if (env.TG_BOT_TOKEN && env.WORKER_URL && !env._webhook_set) {
      try {
        await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: env.WORKER_URL + '/api/telegram/webhook', allowed_updates: ['message'] }),
        });
        if (env.KV_STORE) await env.KV_STORE.put('webhook_set', 'true');
      } catch (e) {}
    }

    return json({ ok: true });
  } catch (e) {
    return json({ ok: true });
  }
}

async function handleTelegramMessages(url, env) {
  if (!env.KV_STORE) return json({ messages: [], error: 'KV not configured', total: 0 });

  const chatId = url.searchParams.get('chat_id') || env.TG_CHAT_ID || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const type = url.searchParams.get('type'); // photo, video, document, audio

  const indexKey = `index:${chatId}`;
  const index = await env.KV_STORE.get(indexKey, { type: 'json' }) || { ids: [], total: 0 };

  const startIdx = offset;
  const endIdx = Math.min(startIdx + limit, index.ids.length);
  const sliceIds = index.ids.slice(startIdx, endIdx);

  const messages = [];
  for (const id of sliceIds) {
    const raw = await env.KV_STORE.get(`msg:${chatId}:${id}`, { type: 'json' });
    if (raw) {
      if (!type || raw.media_type === type || (type === 'media' && raw.has_media)) {
        messages.push(raw);
      }
    }
  }

  return json({ messages, total: index.total, offset, limit, has_more: endIdx < index.ids.length });
}

async function handleTelegramIngest(request, env) {
  const key = request.headers.get('x-ingest-key');
  const secret = env.INGEST_KEY;
  if (secret && key !== secret) return json({ error: 'Unauthorized' }, 401);
  if (!env.KV_STORE) return json({ error: 'KV not configured' }, 500);

  try {
    const data = await request.json();
    const messages = Array.isArray(data.messages) ? data.messages : [data.messages || data];
    let processed = 0;

    for (const raw of messages) {
      const msg = raw.message || raw.channel_post || raw;
      const chatId = (msg.chat?.id || raw.chat_id || '-1002514429549').toString();
      const entry = {
        id: msg.message_id || processed,
        chat_id: chatId,
        date: msg.date || Math.floor(Date.now() / 1000),
        from: msg.from?.first_name || msg.sender_chat?.title || 'User',
        text: msg.text || '',
        has_media: !!(msg.photo || msg.document || msg.video || msg.audio || msg.voice || msg.animation),
        media_type: msg.photo ? 'photo' : msg.document ? 'document' : msg.video ? 'video' : msg.audio ? 'audio' : msg.voice ? 'voice' : msg.animation ? 'animation' : null,
        file_name: msg.document?.file_name || msg.video?.file_name || '',
        file_size: msg.document?.file_size || msg.video?.file_size || msg.audio?.file_size || 0,
        file_id: (msg.photo ? msg.photo[msg.photo.length - 1]?.file_id : null) || msg.document?.file_id || msg.video?.file_id || msg.audio?.file_id || '',
        file_url: '',
        caption: msg.caption || '',
        views: msg.views || 0,
        forwards: msg.forwards || 0,
      };
      await env.KV_STORE.put(`msg:${chatId}:${entry.id}`, JSON.stringify(entry), { expirationTtl: 2592000 });
      processed++;
    }

    // Update index
    const chatId = (messages[0]?.chat?.id || '-1002514429549').toString();
    const indexKey = `index:${chatId}`;
    const index = await env.KV_STORE.get(indexKey, { type: 'json' }) || { ids: [], total: 0, last_sync: 0 };
    for (const raw of messages) {
      const msg = raw.message || raw.channel_post || raw;
      const mid = msg.message_id || processed;
      if (!index.ids.includes(mid)) index.ids = [mid, ...index.ids].slice(0, 5000);
    }
    index.total = Math.max(index.total, index.ids.length);
    index.last_sync = Date.now();
    await env.KV_STORE.put(indexKey, JSON.stringify(index), { expirationTtl: 2592000 });

    return json({ ok: true, processed });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function handleTelegramSync(env) {
  if (!env.TG_BOT_TOKEN) return json({ error: 'TG_BOT_TOKEN not set' });

  try {
    const botToken = env.TG_BOT_TOKEN;
    // getUpdates and webhook cannot be active at the same time — temporarily remove webhook
    const webhook = env.WORKER_URL ? env.WORKER_URL + '/api/telegram/webhook' : null;
    let hadWebhook = false;
    try {
      const wh = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
      const whd = await wh.json();
      hadWebhook = whd.ok && whd.result && whd.result.url;
      if (hadWebhook) {
        await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
      }
    } catch (e) {}

    const resp = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=100&allowed_updates=["message"]`);
    const data = await resp.json();

    // Restore webhook if it existed
    if (hadWebhook || webhook) {
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhook, allowed_updates: ['message'] }),
        });
      } catch (e) {}
    }

    if (!data.ok) return json({ error: 'Telegram API error', detail: data.description });

    let processed = 0;
    for (const update of data.result) {
      if (update.message) {
        const msg = update.message;
        const chatId = msg.chat?.id?.toString();
        if (!chatId) continue;

        const fileId = (msg.photo ? msg.photo[msg.photo.length - 1]?.file_id : null) || msg.document?.file_id || msg.video?.file_id || msg.audio?.file_id || msg.voice?.file_id || '';
        let fileUrl = '';
        if (fileId && env.TG_BOT_TOKEN) {
          try {
            const f = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/getFile?file_id=${fileId}`);
            const fd = await f.json();
            if (fd.ok && fd.result?.file_path) fileUrl = `https://api.telegram.org/file/bot${env.TG_BOT_TOKEN}/${fd.result.file_path}`;
          } catch (e) {}
        }
        const entry = {
          id: msg.message_id,
          chat_id: chatId,
          date: msg.date,
          from: msg.from?.first_name || 'Unknown',
          text: msg.text || '',
          has_media: !!(msg.photo || msg.document || msg.video || msg.audio || msg.voice || msg.animation),
          media_type: msg.photo ? 'photo' : msg.document ? 'document' : msg.video ? 'video' : msg.audio ? 'audio' : msg.voice ? 'voice' : msg.animation ? 'animation' : null,
          file_name: msg.document?.file_name || msg.video?.file_name || '',
          file_size: msg.document?.file_size || msg.video?.file_size || msg.audio?.file_size || 0,
          file_id: fileId,
          file_url: fileUrl,
          caption: msg.caption || '',
          views: msg.views || 0,
          forwards: msg.forwards || 0,
        };

        if (env.KV_STORE) {
          await env.KV_STORE.put(`msg:${chatId}:${msg.message_id}`, JSON.stringify(entry), { expirationTtl: 2592000 });
          const indexKey = `index:${chatId}`;
          const existing = await env.KV_STORE.get(indexKey, { type: 'json' }) || { ids: [], total: 0, last_sync: 0 };
          if (!existing.ids.includes(msg.message_id)) {
            existing.ids = [msg.message_id, ...existing.ids].slice(0, 5000);
            existing.total++;
          }
          existing.last_sync = Date.now();
          await env.KV_STORE.put(indexKey, JSON.stringify(existing), { expirationTtl: 2592000 });
          processed++;
        }
      }
    }

    return json({ ok: true, processed, total_updates: data.result.length });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function handleTelegramStats(env) {
  if (!env.KV_STORE) return json({ error: 'KV not configured' });
  const chatId = env.TG_CHAT_ID || '';
  const stats = await env.KV_STORE.get(`stats:${chatId}`, { type: 'json' }) || { total: 0, photos: 0, videos: 0, documents: 0, audios: 0 };
  const index = await env.KV_STORE.get(`index:${chatId}`, { type: 'json' }) || { total: 0, last_sync: 0 };
  return json({ ...stats, indexed: index.ids?.length || 0, last_sync: index.last_sync });
}

// ============================================================
// LIVE TV
// ============================================================


async function handleTelegramFile(url, env) {
  if (!env.TG_BOT_TOKEN) return json({ error: 'Bot token not configured' }, 500);
  const fileId = url.searchParams.get('file_id');
  if (!fileId) return json({ error: 'file_id required' }, 400);
  try {
    const resp = await fetch('https://api.telegram.org/bot' + env.TG_BOT_TOKEN + '/getFile?file_id=' + encodeURIComponent(fileId));
    const data = await resp.json();
    if (!data.ok) return json({ error: 'Telegram API error', detail: data.description }, 500);
    const filePath = data.result.file_path;
    const fileResp = await fetch('https://api.telegram.org/file/bot' + env.TG_BOT_TOKEN + '/' + filePath);
    return new Response(fileResp.body, {
      headers: {
        'Content-Type': data.result.file_path.endsWith('.mp4') ? 'video/mp4' : data.result.file_path.endsWith('.jpg') || data.result.file_path.endsWith('.png') ? 'image/jpeg' : 'application/octet-stream',
        'Content-Length': data.result.file_size || '',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function handleLiveTV(url, env) {
  if (env.KV_STORE) {
    const cached = await env.KV_STORE.get('livetv_all');
    if (cached) return json(JSON.parse(cached));
  }

  const allChannels = [];
  for (const src of IPTV_SOURCES) {
    const channels = await parseM3U(src.url);
    channels.forEach(ch => { ch.source = src.name; allChannels.push(ch); });
  }

  // Deduplicate by name
  const seen = new Set();
  const unique = allChannels.filter(ch => {
    const key = ch.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort: Hindi first
  unique.sort((a, b) => (b.hindi ? 1 : 0) - (a.hindi ? 1 : 0));

  const hindiCount = unique.filter(ch => ch.hindi).length;
  const groups = {};
  unique.forEach(ch => { groups[ch.group] = (groups[ch.group] || 0) + 1; });

  const result = { channels: unique, total: unique.length, hindi: hindiCount, groups };

  if (env.KV_STORE) {
    await env.KV_STORE.put('livetv_all', JSON.stringify(result), { expirationTtl: 3600 });
  }

  return json(result);
}

function handleLiveTVStream(url) {
  const streamUrl = url.searchParams.get('url');
  if (!streamUrl) return json({ error: 'url param required' }, 400);
  return new Response(null, {
    status: 302,
    headers: { Location: streamUrl, ...CORS },
  });
}

// ============================================================
// MOVIES — TMDB
// ============================================================
async function handleMovies(url, env) {
  const type = url.searchParams.get('type') || 'popular';
  if (!env.TMDB_KEY) {
    return json({ results: getSampleMovies(), type });
  }

  if (env.KV_STORE) {
    const cached = await env.KV_STORE.get('movies_' + type);
    if (cached) return json({ type, results: JSON.parse(cached) });
  }

  try {
    const resp = await fetch(`https://api.themoviedb.org/3/movie/${type}?language=hi-IN&page=1&api_key=${env.TMDB_KEY}`);
    const data = await resp.json();
    const results = (data.results || []).map(r => ({
      id: r.id, title: r.title, rating: r.vote_average,
      image: r.poster_path ? `https://image.tmdb.org/t/p/w300${r.poster_path}` : '',
      year: (r.release_date || '').substring(0, 4), overview: r.overview || '',
    }));

    if (env.KV_STORE) await env.KV_STORE.put('movies_' + type, JSON.stringify(results), { expirationTtl: 7200 });
    return json({ type, results });
  } catch (e) {
    return json({ type, results: getSampleMovies() });
  }
}

function getSampleMovies() {
  return [
    { id: 1, title: 'Pushpa 2: The Rule', rating: 7.5, image: '', year: '2024', overview: 'Action drama' },
    { id: 2, title: 'Stree 2', rating: 7.2, image: '', year: '2024', overview: 'Horror comedy' },
    { id: 3, title: 'Jawan', rating: 7.1, image: '', year: '2023', overview: 'Action thriller' },
    { id: 4, title: 'Pathaan', rating: 6.5, image: '', year: '2023', overview: 'Spy action' },
    { id: 5, title: 'Animal', rating: 6.8, image: '', year: '2023', overview: 'Crime drama' },
    { id: 6, title: 'Gadar 2', rating: 6.0, image: '', year: '2023', overview: 'Period action' },
    { id: 7, title: 'Rocky Aur Rani', rating: 6.5, image: '', year: '2023', overview: 'Romance drama' },
    { id: 8, title: 'Tiger 3', rating: 5.8, image: '', year: '2023', overview: 'Spy action' },
    { id: 9, title: 'Dunki', rating: 6.2, image: '', year: '2023', overview: 'Drama' },
    { id: 10, title: 'Adipurush', rating: 3.5, image: '', year: '2023', overview: 'Mythology' },
  ];
}

// ============================================================
// BOOKS — Open Library
// ============================================================
async function handleBooks(url, env) {
  const q = url.searchParams.get('q') || 'hindi+novel';

  if (env.KV_STORE) {
    const cached = await env.KV_STORE.get('books_' + q.toLowerCase());
    if (cached) return json({ results: JSON.parse(cached) });
  }

  try {
    const resp = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20`);
    const data = await resp.json();
    const results = (data.docs || []).map(b => ({
      title: b.title, author: (b.author_name || [])[0] || 'Unknown',
      year: b.first_publish_year || '',
      cover: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : '',
      key: b.key, read_url: `https://openlibrary.org${b.key}`,
    }));

    if (env.KV_STORE) await env.KV_STORE.put('books_' + q.toLowerCase(), JSON.stringify(results), { expirationTtl: 7200 });
    return json({ results });
  } catch (e) {
    return json({ results: [] });
  }
}

// ============================================================
// SEARCH — Combined
// ============================================================
async function handleSearch(url, env) {
  const q = url.searchParams.get('q');
  if (!q) return json({ error: 'q required' }, 400);

  const results = { movies: [], books: [], telegram: [] };

  // Search Telegram messages
  if (env.KV_STORE && env.TG_CHAT_ID) {
    try {
      const index = await env.KV_STORE.get(`index:${env.TG_CHAT_ID}`, { type: 'json' }) || { ids: [] };
      const searchIds = index.ids.slice(0, 200);
      for (const id of searchIds) {
        const msg = await env.KV_STORE.get(`msg:${env.TG_CHAT_ID}:${id}`, { type: 'json' });
        if (msg && (msg.text.toLowerCase().includes(q.toLowerCase()) || msg.file_name.toLowerCase().includes(q.toLowerCase()) || msg.caption.toLowerCase().includes(q.toLowerCase()))) {
          results.telegram.push(msg);
          if (results.telegram.length >= 20) break;
        }
      }
    } catch (e) {}
  }

  // Search TMDB
  if (env.TMDB_KEY) {
    try {
      const resp = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&language=hi-IN&api_key=${env.TMDB_KEY}`);
      const data = await resp.json();
      results.movies = (data.results || []).slice(0, 10).map(r => ({
        id: r.id, title: r.title, rating: r.vote_average,
        image: r.poster_path ? `https://image.tmdb.org/t/p/w300${r.poster_path}` : '',
        year: (r.release_date || '').substring(0, 4), overview: r.overview || '',
      }));
    } catch (e) {}
  }

  // Search Open Library
  try {
    const resp = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10`);
    const data = await resp.json();
    results.books = (data.docs || []).map(b => ({
      title: b.title, author: (b.author_name || [])[0] || 'Unknown',
      cover: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : '',
      read_url: `https://openlibrary.org${b.key}`,
    }));
  } catch (e) {}

  return json(results);
}

// ============================================================
// AI CHAT — Free Cloudflare AI
// ============================================================
async function handleChat(request, env) {
  const body = await request.json();
  const message = body.message || '';
  if (!message) return json({ error: 'message required' }, 400);

  const lower = message.toLowerCase();

  // Smart routing
  if (lower.includes('tv') || lower.includes('channel') || lower.includes('live'))
    return json({ worker: '📺 Live TV', icon: '📺', response: 'Live TV page par jaake channels dekho! Hindi priority channels upar dikhenge. Koi bhi channel click karo aur direct play hoga. 🎬' });

  if (lower.includes('movie') || lower.includes('film'))
    return json({ worker: '🎬 Movies', icon: '🎬', response: 'Movies page par TMDB se Hindi aur English movies available hain. Search ya category choose karo! 🔥' });

  if (lower.includes('book') || lower.includes('padh') || lower.includes('read'))
    return json({ worker: '📚 Books', icon: '📚', response: 'Books page par Open Library se free books milenge. Search karo ya famous books check karo! 📖' });

  if (lower.includes('telegram') || lower.includes('group') || lower.includes('data'))
    return json({ worker: '📱 Telegram', icon: '📱', response: 'Telegram group ka saara data website par hai! Messages, photos, videos, documents sab browse kar sakte ho. Catalog page par jaao! 📂' });

  if (lower.includes('status') || lower.includes('health'))
    return json({ worker: '⚙️ Status', icon: '⚙️', response: 'Saare systems online hain! Workers, KV, D1, Cron sab active hai. Workers page par detailed status dekh sakte ho. ✅' });

  if (lower.includes('search') || lower.includes('dhundh') || lower.includes('khoj'))
    return json({ worker: '🔍 Search', icon: '🔍', response: 'Search page par movies, books, aur Telegram data sab ek saath search kar sakte ho. Koi bhi keyword dalo! 🎯' });

  // Default — try Cloudflare AI
  if (env.AI) {
    try {
      const resp = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: 'NJStream AI assistant. Reply in Hindi/Hinglish. Be helpful, friendly. We offer: Live TV, Movies (TMDB), Books (Open Library), Telegram group data browsing, AI chat.' },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
      });
      return json({ worker: '🤖 Main AI', icon: '🤖', response: resp.response || resp });
    } catch (e) {}
  }

  // Fallback
  return json({
    worker: '🤖 Main AI', icon: '🤖',
    response: `Bhai "${message}" ke baare mein poocha hai! 🤔\n\nMain NJStream ka AI hun. Ye cheezein kar sakta hun:\n\n📺 Live TV — Hindi channels free\n🎬 Movies — TMDB se Hindi/English\n📚 Books — Open Library se free\n📱 Telegram — Group data browse\n🔍 Search — Sab kuch ek saath\n\nKuch specific poocho! 😊`,
  });
}

// ============================================================
// CATALOG — D1
// ============================================================
async function initCatalogTable(db) {
  try {
    await db.prepare('CREATE TABLE IF NOT EXISTS catalog (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, type TEXT DEFAULT "movie", description TEXT DEFAULT "", image TEXT DEFAULT "", link TEXT DEFAULT "", year TEXT DEFAULT "", rating REAL DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)').run();
  } catch (e) {}
}

async function handleCatalogList(env) {
  if (!env.CATALOG_DB) return json({ results: [] });
  try {
    await initCatalogTable(env.CATALOG_DB);
    const { results } = await env.CATALOG_DB.prepare('SELECT * FROM catalog ORDER BY created_at DESC LIMIT 50').all();
    return json({ results });
  } catch (e) {
    return json({ results: [], error: e.message });
  }
}

async function handleCatalogAdd(request, env) {
  if (!env.CATALOG_DB) return json({ error: 'D1 not configured' }, 500);
  try {
    const item = await request.json();
    if (!item.title) return json({ error: 'title required' }, 400);
    await initCatalogTable(env.CATALOG_DB);
    await env.CATALOG_DB.prepare('INSERT INTO catalog (title, type, description, image, link, year, rating) VALUES (?1,?2,?3,?4,?5,?6,?7)').bind(item.title, item.type || 'movie', item.description || '', item.image || '', item.link || '', item.year || '', Number(item.rating) || 0).run();
    return json({ ok: true });
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
    return json({ ok: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// ============================================================
// STATUS
// ============================================================
async function handleStatus(env) {
  const services = {
    worker: 'online',
    kv: env.KV_STORE ? 'connected' : 'not_configured',
    d1: env.CATALOG_DB ? 'connected' : 'not_configured',
    tg_messages: env.KV_STORE ? 'connected' : 'not_configured',
    tmdb: env.TMDB_KEY ? 'configured' : 'needs_key',
    ai: env.AI ? 'available' : 'fallback_mode',
    iptv: 'ready',
  };

  if (env.KV_STORE) {
    try {
      await env.KV_STORE.put('_health', Date.now().toString());
      services.kv = 'live';
    } catch (e) {}
  }
  if (env.KV_STORE && env.TG_CHAT_ID) {
    try {
      const index = await env.KV_STORE.get(`index:${env.TG_CHAT_ID}`, { type: 'json' });
      services.tg_messages = index ? `${index.ids?.length || 0} messages indexed` : 'empty';
    } catch (e) {}
  }

  return json({ status: 'ok', service: 'NJStream', version: '5.0.0', services });
}

// ============================================================
// SCHEDULED SYNC
// ============================================================
async function runScheduledSync(env) {
  // Sync Telegram messages
  if (env.TG_BOT_TOKEN) {
    try { await handleTelegramSync(env); } catch (e) {}
  }
  // Refresh Live TV cache
  if (env.KV_STORE) {
    try { await env.KV_STORE.delete('livetv_all'); } catch (e) {}
  }
  // Refresh movies cache
  if (env.KV_STORE) {
    try { await env.KV_STORE.delete('movies_popular'); } catch (e) {}
  }
}


// ============================================================
// FRONTEND — HTML
// ============================================================
const INDEX_HTML = `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NJStream — Live TV, Movies, Books, AI</title>
<meta name="description" content="NJStream — Free Live TV, Movies, Books, Telegram data, AI. Powered by Cloudflare.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎬</text></svg>">
<link rel="stylesheet" href="/css/style.css">
<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js"></script>
</head>
<body>

<!-- LOADER -->
<div class="loader" id="loader">
  <div class="ld-box">
    <div class="ld-logo">🎬</div>
    <div class="ld-name">NJ<span>Stream</span></div>
    <div class="ld-bar"><div class="ld-fill"></div></div>
    <div class="ld-sub">Initializing services...</div>
  </div>
</div>

<!-- APP -->
<div class="app" id="app">

  <!-- SIDEBAR -->
  <nav class="side" id="side">
    <div class="side-head">
      <div class="logo">🎬</div>
      <div class="brand">NJ<span>Stream</span></div>
    </div>
    <div class="nav-list">
      <button class="nav-btn active" data-page="home" onclick="N.go('home')"><span>🏠</span>Home</button>
      <button class="nav-btn" data-page="tv" onclick="N.go('tv')"><span>📺</span>Live TV</button>
      <button class="nav-btn" data-page="tg" onclick="N.go('tg')"><span>📱</span>Telegram</button>
      <button class="nav-btn" data-page="movies" onclick="N.go('movies')"><span>🎬</span>Movies</button>
      <button class="nav-btn" data-page="books" onclick="N.go('books')"><span>📚</span>Books</button>
      <button class="nav-btn" data-page="search" onclick="N.go('search')"><span>🔍</span>Search</button>
      <button class="nav-btn" data-page="ai" onclick="N.go('ai')"><span>🤖</span>AI Chat</button>
      <button class="nav-btn" data-page="catalog" onclick="N.go('catalog')"><span>📁</span>Catalog</button>
    </div>
    <div class="side-status"><div class="dot green"></div> All Systems Live</div>
  </nav>

  <!-- MAIN -->
  <main class="main" id="main">

    <!-- HOME -->
    <section class="page active" id="pg-home">
      <div class="page-head">
        <h1>🎬 NJStream</h1>
        <p>Live TV • Movies • Books • Telegram • AI — Sab Kuch Free</p>
      </div>
      <div class="stats-grid" id="homeStats">
        <div class="stat-card"><div class="stat-icon">📺</div><div class="stat-val" id="stTV">...</div><div class="stat-label">Live TV</div></div>
        <div class="stat-card"><div class="stat-icon">📱</div><div class="stat-val" id="stTG">...</div><div class="stat-label">TG Messages</div></div>
        <div class="stat-card"><div class="stat-icon">🎬</div><div class="stat-val" id="stMovies">...</div><div class="stat-label">Movies</div></div>
        <div class="stat-card"><div class="stat-icon">🤖</div><div class="stat-val">Active</div><div class="stat-label">AI Online</div></div>
      </div>
      <div class="quick-grid">
        <button class="qcard" onclick="N.go('tv')"><span class="qi">📺</span><span>Live TV</span><span class="qd">Hindi channels free</span></button>
        <button class="qcard" onclick="N.go('tg')"><span class="qi">📱</span><span>Telegram Data</span><span class="qd">Browse group messages</span></button>
        <button class="qcard" onclick="N.go('movies')"><span class="qi">🎬</span><span>Movies</span><span class="qd">TMDB Hindi & English</span></button>
        <button class="qcard" onclick="N.go('books')"><span class="qi">📚</span><span>Books</span><span class="qd">Open Library free</span></button>
        <button class="qcard" onclick="N.go('ai')"><span class="qi">🤖</span><span>AI Chat</span><span class="qd">Ask anything</span></button>
        <button class="qcard" onclick="N.go('search')"><span class="qi">🔍</span><span>Search</span><span class="qd">All sources at once</span></button>
      </div>
      <div class="services-section">
        <h2>⚡ Live Services</h2>
        <div class="svc-grid" id="svcGrid">
          <div class="svc"><div class="svc-icon">⚡</div><div class="svc-info"><h4>Cloudflare Worker</h4><p>Edge computing</p><span class="badge live">● Online</span></div></div>
          <div class="svc"><div class="svc-icon">🗄️</div><div class="svc-info"><h4>KV Storage</h4><p>Telegram data cache</p><span class="badge live" id="svcKV">● Ready</span></div></div>
          <div class="svc"><div class="svc-icon">💾</div><div class="svc-info"><h4>D1 Database</h4><p>SQLite catalog</p><span class="badge live" id="svcD1">● Ready</span></div></div>
          <div class="svc"><div class="svc-icon">📺</div><div class="svc-info"><h4>IPTV Parser</h4><p>Free live channels</p><span class="badge live">● Active</span></div></div>
          <div class="svc"><div class="svc-icon">📱</div><div class="svc-info"><h4>Telegram Bot</h4><p>Group data sync</p><span class="badge live" id="svcTG">● Ready</span></div></div>
          <div class="svc"><div class="svc-icon">🤖</div><div class="svc-info"><h4>AI Engine</h4><p>LLM powered chat</p><span class="badge live">● Online</span></div></div>
        </div>
      </div>
    </section>

    <!-- LIVE TV -->
    <section class="page" id="pg-tv">
      <div class="page-head"><h1>📺 Live TV</h1><p>Free IPTV — Hindi priority | <span id="tvTotal">0</span> channels</p></div>
      <div class="tv-player-wrap">
        <div class="tv-player-box" id="tvPlayerBox">
          <div class="tv-placeholder" id="tvPlaceholder"><span>📺</span><p>Channel select karo</p></div>
          <video id="tvVideo" controls style="display:none;width:100%;height:100%"></video>
        </div>
        <div class="tv-bar" id="tvBar" style="display:none"><span class="live-dot">● LIVE</span><span id="tvPlaying">—</span></div>
      </div>
      <div class="filter-bar" id="tvFilters"></div>
      <div class="search-bar"><input id="tvSearch" placeholder="Channel search karo..." oninput="N.filterTV()"></div>
      <div class="tv-grid" id="tvGrid"><div class="loading">📺 Loading channels...</div></div>
    </section>

    <!-- TELEGRAM -->
    <section class="page" id="pg-tg">
      <div class="page-head"><h1>📱 Telegram Group Data</h1><p>All messages, photos, videos, files — readable & downloadable</p></div>
      <div class="tg-stats" id="tgStats"></div>
      <div class="tg-sync-row">
        <button class="fbtn sync-btn" onclick="N.syncTG(this)">🔄 Sync Group Data</button>
        <span class="sync-hint" id="tgSyncHint">Group se latest messages fetch karo</span>
      </div>
      <div class="filter-bar">
        <button class="fbtn active" onclick="N.filterTG('all',this)">All</button>
        <button class="fbtn" onclick="N.filterTG('photo',this)">📷 Photos</button>
        <button class="fbtn" onclick="N.filterTG('video',this)">🎥 Videos</button>
        <button class="fbtn" onclick="N.filterTG('document',this)">📄 Documents</button>
        <button class="fbtn" onclick="N.filterTG('audio',this)">🎵 Audio</button>
        <button class="fbtn" onclick="N.filterTG('text',this)">💬 Text</button>
      </div>
      <div class="search-bar"><input id="tgSearch" placeholder="Search messages..." oninput="N.filterTGMessages()"></div>
      <div id="tgMessages" class="tg-list"><div class="loading">Loading Telegram data...</div></div>
    </section>

    <!-- MOVIES -->
    <section class="page" id="pg-movies">
      <div class="page-head"><h1>🎬 Movies</h1><p>TMDB — Hindi & English</p></div>
      <div class="filter-bar">
        <button class="fbtn active" onclick="N.loadMovies('popular',this)">🔥 Popular</button>
        <button class="fbtn" onclick="N.loadMovies('top_rated',this)">⭐ Top Rated</button>
        <button class="fbtn" onclick="N.loadMovies('now_playing',this)">🎥 Now Playing</button>
        <button class="fbtn" onclick="N.loadMovies('upcoming',this)">🗓️ Upcoming</button>
      </div>
      <div id="moviesGrid" class="media-grid"><div class="loading">Loading movies...</div></div>
    </section>

    <!-- BOOKS -->
    <section class="page" id="pg-books">
      <div class="page-head"><h1>📚 Books</h1><p>Open Library — Free Reading</p></div>
      <div class="search-bar"><input id="bookSearch" placeholder="Search books..." onkeydown="if(event.key==='Enter')N.loadBooks()"><button onclick="N.loadBooks()">Search</button></div>
      <div class="filter-bar">
        <button class="fbtn active" onclick="N.loadBooks('hindi',this)">🇮🇳 Hindi</button>
        <button class="fbtn" onclick="N.loadBooks('famous',this)">📖 Famous</button>
        <button class="fbtn" onclick="N.loadBooks('science',this)">🔬 Science</button>
        <button class="fbtn" onclick="N.loadBooks('fiction',this)">🎭 Fiction</button>
      </div>
      <div id="booksGrid" class="media-grid"><div class="loading">Loading books...</div></div>
    </section>

    <!-- SEARCH -->
    <section class="page" id="pg-search">
      <div class="page-head"><h1>🔍 Search Everything</h1><p>Movies + Books + Telegram — ek saath</p></div>
      <div class="search-bar big"><input id="searchInput" placeholder="Movie, book, ya kuchh bhi search karo..." onkeydown="if(event.key==='Enter')N.doSearch()"><button onclick="N.doSearch()">🔍 Search</button></div>
      <div id="searchResults" class="search-results"></div>
    </section>

    <!-- AI CHAT -->
    <section class="page" id="pg-ai">
      <div class="page-head"><h1>🤖 AI Chat</h1><p>Main AI + Worker AIs</p></div>
      <div class="chat-box">
        <div class="chat-messages" id="chatMsgs">
          <div class="msg ai"><div class="msg-label">🤖 NJStream AI</div><p>Welcome bhai! Kuchh bhi poocho — movies, books, live TV, Telegram data, ya koi bhi sawaal 🎉</p>
            <div class="quick-asks">
              <button onclick="N.chat('Live TV dikhao')">📺 Live TV</button>
              <button onclick="N.chat('Movies dikhao')">🎬 Movies</button>
              <button onclick="N.chat('Books dikhao')">📚 Books</button>
              <button onclick="N.chat('Telegram data')">📱 Telegram</button>
              <button onclick="N.chat('Status batao')">⚙️ Status</button>
            </div>
          </div>
        </div>
        <div class="chat-input">
          <input id="chatIn" placeholder="Message type karo..." onkeydown="if(event.key==='Enter'){N.chat(this.value);this.value='';}">
          <button onclick="N.chat(document.getElementById('chatIn').value);document.getElementById('chatIn').value='';">Send ⚡</button>
        </div>
      </div>
    </section>

    <!-- CATALOG -->
    <section class="page" id="pg-catalog">
      <div class="page-head"><h1>📁 My Catalog</h1><p>D1 Database — Apna content</p></div>
      <div class="add-form">
        <input id="catTitle" placeholder="Title...">
        <select id="catType"><option value="movie">🎬 Movie</option><option value="book">📚 Book</option><option value="series">📺 Series</option></select>
        <input id="catDesc" placeholder="Description...">
        <button onclick="N.addToCatalog()">➕ Add</button>
      </div>
      <div id="catalogList" class="media-grid"><div class="loading">Loading...</div></div>
    </section>

  </main>
</div>

<!-- MOBILE TOGGLE -->
<button class="mobile-toggle" onclick="document.getElementById('side').classList.toggle('open')">☰</button>

<script src="/js/app.js"></script>
</body>
</html>`;

// ============================================================
// FRONTEND — CSS
// ============================================================
const STYLE_CSS = `
:root{--bg:#09090b;--card:#18181b;--card2:#27272a;--border:#3f3f46;--accent:#22d3ee;--accent2:#a855f7;--green:#22c55e;--red:#ef4444;--text:#fafafa;--text2:#a1a1aa;--radius:12px}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden}

/* Loader */
.loader{position:fixed;inset:0;z-index:999;background:var(--bg);display:flex;align-items:center;justify-content:center}
.loader.hide{opacity:0;pointer-events:none;transition:opacity .4s}
.ld-box{text-align:center}
.ld-logo{font-size:60px;animation:pulse 1s infinite}
.ld-name{font-size:26px;font-weight:800;margin:10px 0;color:var(--accent)}.ld-name span{color:var(--accent2)}
.ld-bar{width:200px;height:3px;background:var(--card2);border-radius:3px;overflow:hidden;margin:10px auto}
.ld-fill{height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--accent2));animation:fillB 2s forwards}
.ld-sub{color:var(--text2);font-size:12px}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
@keyframes fillB{to{width:100%}}

/* Layout */
.app{display:flex;min-height:100vh;opacity:0;transition:opacity .5s}
.app.vis{opacity:1}

/* Sidebar */
.side{width:220px;background:var(--card);border-right:1px solid var(--border);padding:16px;display:flex;flex-direction:column;position:fixed;top:0;bottom:0;z-index:50}
.side-head{display:flex;align-items:center;gap:8px;margin-bottom:20px}
.logo{font-size:24px}.brand{font-size:18px;font-weight:800;color:var(--accent)}.brand span{color:var(--accent2)}
.nav-list{flex:1;display:flex;flex-direction:column;gap:2px}
.nav-btn{display:flex;align-items:center;gap:8px;width:100%;padding:10px 12px;border:none;border-radius:8px;background:transparent;color:var(--text2);font-size:13px;cursor:pointer;text-align:left;transition:.15s}
.nav-btn:hover{background:var(--card2);color:var(--text)}
.nav-btn.active{background:linear-gradient(135deg,rgba(34,211,238,.12),rgba(168,85,247,.12));color:var(--accent);font-weight:600}
.nav-btn span{width:18px;text-align:center;font-size:15px}
.side-status{display:flex;align-items:center;gap:6px;padding:10px;background:var(--card2);border-radius:8px;font-size:11px;color:var(--green)}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block}.green{background:var(--green);animation:blink 2s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}

/* Main */
.main{margin-left:220px;flex:1;padding:24px;min-height:100vh}
.page{display:none}.page.active{display:block}

/* Page head */
.page-head{margin-bottom:24px}.page-head h1{font-size:26px;font-weight:800}.page-head p{color:var(--text2);margin-top:4px;font-size:13px}

/* Stats */
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.stat-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;text-align:center}
.stat-icon{font-size:28px;margin-bottom:6px}.stat-val{font-size:22px;font-weight:800;color:var(--accent)}.stat-label{font-size:11px;color:var(--text2);margin-top:4px}

/* Quick links */
.quick-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.qcard{display:flex;flex-direction:column;align-items:center;gap:4px;padding:20px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;transition:.2s;text-align:center}
.qcard:hover{border-color:var(--accent);transform:translateY(-2px)}
.qi{font-size:32px}.qd{font-size:11px;color:var(--text2);margin-top:4px}

/* Services */
.services-section h2{font-size:18px;margin-bottom:12px}
.svc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.svc{display:flex;gap:12px;padding:14px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius)}
.svc-icon{font-size:24px;width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:var(--card2);border-radius:10px;flex-shrink:0}
.svc-info h4{font-size:13px;font-weight:600}.svc-info p{font-size:11px;color:var(--text2)}
.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600}.badge.live{background:rgba(34,197,94,.15);color:var(--green)}

/* Filters */
.filter-bar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.fbtn{padding:6px 14px;border:1px solid var(--border);border-radius:20px;background:var(--card);color:var(--text2);font-size:12px;cursor:pointer;transition:.15s}
.fbtn:hover{border-color:var(--accent);color:var(--text)}.fbtn.active{background:var(--accent);color:#000;border-color:var(--accent);font-weight:600}

/* Search */
.search-bar{display:flex;gap:8px;margin-bottom:16px}
.search-bar input,.search-bar button{padding:10px 14px;background:var(--card);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;outline:none}
.search-bar input{flex:1}.search-bar input:focus{border-color:var(--accent)}
.search-bar button{background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:#fff;font-weight:600;cursor:pointer;white-space:nowrap}
.search-bar.big input{font-size:16px;padding:14px}

/* Media grid */
.media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.media-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;cursor:pointer;transition:.2s}
.media-card:hover{border-color:var(--accent);transform:translateY(-2px)}
.media-card img{width:100%;height:240px;object-fit:cover;background:var(--card2)}
.media-card .info{padding:10px}.media-card .info h4{font-size:13px;font-weight:600;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.media-card .info .meta{font-size:11px;color:var(--text2);display:flex;gap:8px}
.media-card .info .read-link{display:inline-block;margin-top:6px;font-size:12px;color:var(--accent);text-decoration:none}

/* Search results */
.search-results{display:flex;flex-direction:column;gap:10px}
.sr-card{display:flex;gap:14px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:14px;transition:.2s}
.sr-card:hover{border-color:var(--accent)}
.sr-img{width:70px;height:100px;object-fit:cover;border-radius:8px;background:var(--card2)}
.sr-info{flex:1}.sr-info h3{font-size:14px;font-weight:600;margin-bottom:4px}
.sr-meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
.sr-tag{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600}
.sr-tag.movie{background:rgba(34,211,238,.15);color:var(--accent)}
.sr-tag.book{background:rgba(168,85,247,.15);color:var(--accent2)}
.sr-tag.tg{background:rgba(34,197,94,.15);color:var(--green)}

/* TV Player */
.tv-player-wrap{margin-bottom:16px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
.tv-player-box{width:100%;height:380px;background:#000;display:flex;align-items:center;justify-content:center}
.tv-placeholder{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--text2)}.tv-placeholder span{font-size:56px}
.tv-bar{display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--card2);border-top:1px solid var(--border)}
.live-dot{color:var(--red);font-weight:700;font-size:12px;animation:blink 1.5s infinite}
.tv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}
.tv-card{display:flex;align-items:center;gap:10px;padding:10px;background:var(--card);border:1px solid var(--border);border-radius:10px;cursor:pointer;transition:.2s}
.tv-card:hover{border-color:var(--accent);transform:translateY(-1px)}
.tv-card-img{width:42px;height:42px;border-radius:8px;background:var(--card2);display:flex;align-items:center;justify-content:center;font-size:20px;overflow:hidden;flex-shrink:0}
.tv-card-img img{width:100%;height:100%;object-fit:cover}
.tv-card-info{flex:1;min-width:0}
.tv-card-name{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tv-card-group{font-size:10px;color:var(--text2);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* Telegram */
.tg-stats{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.tg-stat{padding:10px 16px;background:var(--card);border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;gap:6px;font-size:13px}
.tg-stat .num{font-weight:700;color:var(--accent)}
.tg-list{display:flex;flex-direction:column;gap:8px}
.tg-msg{padding:12px 16px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);transition:.15s}
.tg-msg:hover{border-color:var(--accent)}
.tg-msg-header{display:flex;justify-content:space-between;margin-bottom:6px;font-size:11px;color:var(--text2)}
.tg-msg-from{font-weight:600;color:var(--accent)}
.tg-msg-text{font-size:13px;line-height:1.5;margin-bottom:6px;word-break:break-word}
.tg-msg-media{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.tg-media-tag{padding:3px 8px;border-radius:6px;font-size:10px;background:var(--card2);color:var(--text2);display:inline-flex;align-items:center;gap:4px}
.tg-media-tag a{color:var(--accent);text-decoration:none}

/* Chat */
.chat-box{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);display:flex;flex-direction:column;height:calc(100vh - 160px)}
.chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.msg{max-width:80%;padding:12px 16px;border-radius:12px;font-size:13px;line-height:1.6}
.msg.ai{background:var(--card2);border:1px solid var(--border);align-self:flex-start}
.msg.user{background:linear-gradient(135deg,rgba(34,211,238,.15),rgba(168,85,247,.15));align-self:flex-end}
.msg-label{font-size:11px;font-weight:700;color:var(--accent);margin-bottom:6px}
.quick-asks{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.quick-asks button{padding:5px 10px;background:var(--bg);border:1px solid var(--border);border-radius:14px;font-size:11px;color:var(--text2);cursor:pointer;transition:.15s}
.quick-asks button:hover{border-color:var(--accent);color:var(--accent)}
.chat-input{display:flex;gap:8px;padding:12px 16px;border-top:1px solid var(--border)}
.chat-input input{flex:1;padding:10px 14px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;outline:none}
.chat-input input:focus{border-color:var(--accent)}
.chat-input button{padding:10px 16px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:8px;color:#fff;font-weight:600;cursor:pointer}

/* Catalog */
.add-form{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.add-form input,.add-form select{padding:10px 12px;background:var(--card);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;outline:none}
.add-form input{flex:1;min-width:120px}
.add-form button{padding:10px 16px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:8px;color:#fff;font-weight:600;cursor:pointer}

/* Empty/Loading/Error */
.loading{text-align:center;padding:40px;color:var(--text2);font-size:14px}
.empty{text-align:center;padding:40px;color:var(--text2)}
.empty span{font-size:40px;display:block;margin-bottom:10px}

/* Telegram sync */
.tg-sync-row{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.sync-btn{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;padding:8px 16px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;transition:.2s}
.sync-btn:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(34,211,238,.25)}
.sync-btn:disabled{opacity:.6;cursor:wait;transform:none}
.sync-hint{font-size:11px;color:var(--text2)}

/* Media cards — poster style */
.media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
.media-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;transition:.2s;cursor:default}
.media-card:hover{border-color:var(--accent);transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.35)}
.media-card img{width:100%;height:200px;object-fit:cover;display:block;background:var(--card2)}
.media-card .info{padding:10px 12px}
.media-card .info h4{font-size:13px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.media-card .meta{display:flex;gap:8px;margin-top:6px;font-size:11px;color:var(--text2)}

/* Search results */
.search-results{display:flex;flex-direction:column;gap:10px}
.sr-card{display:flex;gap:12px;padding:12px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);transition:.15s}
.sr-card:hover{border-color:var(--accent)}
.sr-img{width:64px;height:88px;object-fit:cover;border-radius:8px;flex-shrink:0}
.sr-info{flex:1;min-width:0}
.sr-info h3{font-size:14px;font-weight:600;margin-bottom:4px}
.sr-meta{display:flex;gap:8px;align-items:center;font-size:11px;color:var(--text2);flex-wrap:wrap}
.sr-tag{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600}
.sr-tag.tg{background:rgba(34,211,238,.15);color:var(--accent)}
.sr-tag.movie{background:rgba(168,85,247,.15);color:var(--accent2)}
.sr-tag.book{background:rgba(34,197,94,.15);color:var(--green)}

/* Books */
.book-link{display:inline-block;margin-top:6px;padding:5px 10px;background:linear-gradient(135deg,rgba(34,211,238,.15),rgba(168,85,247,.15));border-radius:8px;font-size:11px;color:var(--accent);text-decoration:none;transition:.15s}
.book-link:hover{color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent2))}

/* Scrollbar */
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-track{background:var(--bg)}
::-webkit-scrollbar-thumb{background:var(--card2);border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:var(--border)}

/* TV player box */
.tv-player-box{position:relative;width:100%;aspect-ratio:16/9;background:#000;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:8px}
.tv-placeholder{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--text2);font-size:14px}
.tv-placeholder span{font-size:48px}
#tvVideo{width:100%;height:100%;object-fit:contain}

/* Mobile toggle */

.mobile-toggle{display:none;position:fixed;top:12px;left:12px;z-index:100;padding:8px 12px;background:var(--card);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:18px;cursor:pointer}

@media(max-width:768px){
  .side{transform:translateX(-100%);transition:.3s;z-index:60}.side.open{transform:translateX(0)}
  .main{margin-left:0;padding:16px;padding-top:50px}
  .mobile-toggle{display:block}
  .stats-grid{grid-template-columns:repeat(2,1fr)}
  .quick-grid{grid-template-columns:repeat(2,1fr)}
  .svc-grid{grid-template-columns:1fr}
  .tv-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}
  .media-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}
  .chat-box{height:calc(100vh - 100px)}
}
`;

// ============================================================
// FRONTEND — JavaScript
// ============================================================
const APP_JS = `
(function(){
'use strict';

var API = '';
var tgMessages = [];
var tgCurrentType = 'all';
var tvAllChannels = [];
var tvCurrentGroup = 'all';

// --- Init ---
window.addEventListener('load', function(){
  setTimeout(function(){
    document.getElementById('loader').classList.add('hide');
    document.getElementById('app').classList.add('vis');
    N.go('home');
  }, 1800);
});

// --- Navigation ---
var N = window.N = {};
N.go = function(page){
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active') });
  document.querySelectorAll('.nav-btn').forEach(function(b){ b.classList.remove('active') });
  var pg = document.getElementById('pg-'+page);
  if(pg) pg.classList.add('active');
  var btn = document.querySelector('[data-page="'+page+'"]');
  if(btn) btn.classList.add('active');
  document.getElementById('side').classList.remove('open');

  if(page==='home') N.loadHome();
  if(page==='tv') N.loadTV();
  if(page==='tg') N.loadTG();
  if(page==='movies') N.loadMovies('popular');
  if(page==='books') N.loadBooks('hindi');
  if(page==='catalog') N.loadCatalog();
};

// --- HOME ---
N.loadHome = async function(){
  try{
    var r = await fetch(API+'/api/status');
    var d = await r.json();
    document.getElementById('svcKV').textContent = d.services.kv==='live'?'● Live':'● '+d.services.kv;
    document.getElementById('svcD1').textContent = '● '+d.services.d1;
    document.getElementById('svcTG').textContent = '● '+d.services.tg_messages;
  }catch(e){}

  try{
    var r2 = await fetch(API+'/api/live-tv');
    var d2 = await r2.json();
    document.getElementById('stTV').textContent = d2.total+' ch';
  }catch(e){document.getElementById('stTV').textContent='0';}

  try{
    var r3 = await fetch(API+'/api/telegram/stats');
    var d3 = await r3.json();
    document.getElementById('stTG').textContent = d3.total||d3.indexed||'0';
  }catch(e){document.getElementById('stTG').textContent='0';}

  document.getElementById('stMovies').textContent='10+';
};

// --- LIVE TV ---
N.loadTV = async function(){
  var grid = document.getElementById('tvGrid');
  grid.innerHTML='<div class="loading">📺 Loading channels...</div>';
  try{
    var r = await fetch(API+'/api/live-tv');
    var d = await r.json();
    tvAllChannels = d.channels||[];
    document.getElementById('tvTotal').textContent = d.total||0;

    // Build filters
    var fh = '<button class="fbtn active" onclick="N.tvFilterGroup(\\'all\\',this)">All ('+d.total+')</button>';
    fh += '<button class="fbtn" onclick="N.tvFilterGroup(\\'hindi\\',this)">🇮🇳 Hindi ('+d.hindi+')</button>';
    if(d.groups){
      var sorted = Object.entries(d.groups).sort(function(a,b){return b[1]-a[1]}).slice(0,10);
      sorted.forEach(function(g){fh+='<button class="fbtn" onclick="N.tvFilterGroup(\\''+g[0].replace(/'/g,"\\\\'")+'\\',this)">'+g[0]+' ('+g[1]+')</button>'});
    }
    document.getElementById('tvFilters').innerHTML=fh;
    N.renderTV(tvAllChannels);
  }catch(e){
    grid.innerHTML='<div class="empty"><span>📺</span>Channels load nahi ho paye. Try again.</div>';
  }
};

N.renderTV = function(channels){
  var grid = document.getElementById('tvGrid');
  if(!channels.length){grid.innerHTML='<div class="empty"><span>📺</span>Koi channel nahi mila</div>';return;}
  var h='<div class="tv-grid">';
  channels.forEach(function(ch,i){
    h+='<div class="tv-card" onclick="N.playTV('+i+')">';
    h+='<div class="tv-card-img">'+(ch.logo?'<img src="'+ch.logo+'" onerror="this.parentElement.innerHTML=\\'📺\\'">':'📺')+'</div>';
    h+='<div class="tv-card-info"><div class="tv-card-name">'+esc(ch.name)+'</div><div class="tv-card-group">'+esc(ch.group)+(ch.hindi?' 🇮🇳':'')+'</div></div>';
    h+='</div>';
  });
  h+='</div>';
  grid.innerHTML=h;
};

N.playTV = function(idx){
  var ch = tvAllChannels[idx];
  if(!ch||!ch.url)return;
  var video = document.getElementById('tvVideo');
  var ph = document.getElementById('tvPlaceholder');
  var bar = document.getElementById('tvBar');
  var status = document.getElementById('tvPlaying');
  video.style.display='block';
  ph.style.display='none';
  bar.style.display='flex';
  status.textContent=ch.name+' — loading...';

  // Stop any existing HLS instance
  if (window.__hls) { try { window.__hls.destroy(); } catch(e){} window.__hls=null; }

  var src = API+'/api/live-tv/stream?url='+encodeURIComponent(ch.url);
  var canHls = window.Hls && Hls.isSupported();

  function attachAndPlay(url){
    video.removeAttribute('src');
    try { video.load(); } catch(e){}
    if (canHls) {
      var hls = new Hls({ maxBufferLength: 30, enableWorker: true });
      window.__hls = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function(){ video.play().catch(function(){}); status.textContent=ch.name+' — LIVE'; });
      hls.on(Hls.Events.ERROR, function(evt, data){
        if (data.fatal){
          if (data.type==='networkError') { try { hls.startLoad(); } catch(e){} }
          else if (data.type==='mediaError') { try { hls.recoverMediaError(); } catch(e){} }
          else { showTVError(ch.name, 'Stream error'); }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.play().catch(function(){ showTVError(ch.name,'Play failed'); });
      video.onplaying = function(){ status.textContent=ch.name+' — LIVE'; };
    } else {
      video.src = url;
      video.play().catch(function(){ showTVError(ch.name,'Play failed'); });
      video.onplaying = function(){ status.textContent=ch.name+' — LIVE'; };
    }
  }

  attachAndPlay(src);
};

function showTVError(name, err){
  var ph = document.getElementById('tvPlaceholder');
  var video = document.getElementById('tvVideo');
  var bar = document.getElementById('tvBar');
  ph.innerHTML='<span>❌</span><p>'+esc(name)+' — play nahi ho raha</p><p style="font-size:11px;color:var(--text2)">'+esc(err)+'. Koi aur channel try karo.</p>';
  ph.style.display='flex';
  video.style.display='none';
  bar.style.display='none';
  if (window.__hls) { try { window.__hls.destroy(); } catch(e){} window.__hls=null; }
}

N.tvFilterGroup = function(group,btn){
  tvCurrentGroup=group;
  document.querySelectorAll('#tvFilters .fbtn').forEach(function(b){b.classList.remove('active')});
  if(btn)btn.classList.add('active');
  N.filterTV();
};

N.filterTV = function(){
  var q = (document.getElementById('tvSearch').value||'').toLowerCase();
  var filtered = tvAllChannels.filter(function(ch){
    var matchGroup = tvCurrentGroup==='all'||(tvCurrentGroup==='hindi'&&ch.hindi)||ch.group.toLowerCase()===tvCurrentGroup.toLowerCase();
    var matchQ = !q||ch.name.toLowerCase().includes(q)||ch.group.toLowerCase().includes(q);
    return matchGroup&&matchQ;
  });
  N.renderTV(filtered);
};

// --- TELEGRAM ---
N.loadTG = async function(){
  document.getElementById('tgMessages').innerHTML='<div class="loading">📱 Loading Telegram data...</div>';
  try{
    var r = await fetch(API+'/api/telegram/stats');
    var d = await r.json();
    document.getElementById('tgStats').innerHTML=
      '<div class="tg-stat">📱 <span class="num">'+(d.total||0)+'</span> Messages</div>'+
      '<div class="tg-stat">📷 <span class="num">'+(d.photos||0)+'</span> Photos</div>'+
      '<div class="tg-stat">🎥 <span class="num">'+(d.videos||0)+'</span> Videos</div>'+
      '<div class="tg-stat">📄 <span class="num">'+(d.documents||0)+'</span> Documents</div>'+
      '<div class="tg-stat">🎵 <span class="num">'+(d.audios||0)+'</span> Audio</div>';
  }catch(e){document.getElementById('tgStats').innerHTML='';}

  try{
    var r2 = await fetch(API+'/api/telegram/messages?limit=200');
    var d2 = await r2.json();
    tgMessages = d2.messages||[];
    N.renderTG(tgMessages);
  }catch(e){
    document.getElementById('tgMessages').innerHTML='<div class="empty"><span>📱</span>Telegram data load nahi ho paya. Bot ko group me add karo aur /api/telegram/sync call karo.</div>';
  }
};

N.syncTG = async function(btn){
  if (btn){ btn.disabled=true; btn.textContent='🔄 Syncing...'; }
  var hint = document.getElementById('tgSyncHint');
  if (hint) hint.textContent = 'Group se messages fetch ho rahe hain...';
  try{
    var r = await fetch(API+'/api/telegram/sync',{method:'POST'});
    var d = await r.json();
    if (hint){
      if (d.ok !== false && !d.error){
        hint.textContent = '✅ Sync complete — '+(d.processed||0)+' messages processed';
      } else if (d.error){
        hint.textContent = '⚠️ '+(d.error||'Sync failed')+(d.detail?' — '+d.detail:'');
      } else {
        hint.textContent = '✅ Sync done';
      }
    }
    N.loadTG();
  }catch(e){
    if (hint) hint.textContent='⚠️ Sync failed: '+e.message;
  }
  if (btn){ btn.disabled=false; btn.textContent='🔄 Sync Group Data'; }
};

N.renderTG = function(msgs){
  var el = document.getElementById('tgMessages');
  if(!msgs.length){el.innerHTML='<div class="empty"><span>📱</span>Koi message nahi mila. Pehle Telegram bot ko group me add karo.</div>';return;}
  var h='';
  msgs.forEach(function(m){
    var date = m.date?new Date(m.date*1000).toLocaleString('hi-IN'):'Unknown date';
    h+='<div class="tg-msg">';
    h+='<div class="tg-msg-header"><span class="tg-msg-from">'+esc(m.from||'Unknown')+'</span><span>'+date+'</span></div>';
    if(m.text) h+='<div class="tg-msg-text">'+esc(m.text)+'</div>';
    if(m.caption) h+='<div class="tg-msg-text"><em>'+esc(m.caption)+'</em></div>';
    if(m.has_media){
      var dl = m.file_url ? m.file_url : (m.file_id ? '/api/telegram/file?file_id='+m.file_id : '');
      h+='<div class="tg-msg-media">';
      h+='<span class="tg-media-tag">📎 '+esc(m.media_type||'media')+'</span>';
      if(m.file_name) h+='<span class="tg-media-tag">📄 '+esc(m.file_name)+'</span>';
      if(m.file_size) h+='<span class="tg-media-tag">💾 '+formatSize(m.file_size)+'</span>';
      if(m.media_type==='video'&&dl){
        h+='<video controls preload="none" style="width:100%;max-height:320px;border-radius:10px;margin-top:6px;background:#000"><source src="'+dl+'"></video>';
      }else if(m.media_type==='photo'&&dl){
        h+='<a href="'+dl+'" target="_blank"><img src="'+dl+'" style="max-width:100%;max-height:280px;border-radius:10px;margin-top:6px;cursor:pointer" alt="photo"></a>';
      }else if(dl){
        h+='<div style="margin-top:6px"><a class="book-link" href="'+dl+'" target="_blank">⬇️ Download '+(m.media_type||'file')+'</a></div>';
      }else if(m.file_id){
        h+='<div style="margin-top:6px"><a class="book-link" href="/api/telegram/file?file_id='+m.file_id+'" target="_blank">⬇️ Download</a></div>';
      }
      h+='</div>';
    }
    h+='</div>';
  });
  el.innerHTML=h;
};

N.filterTG = function(type,btn){
  tgCurrentType=type;
  document.querySelectorAll('#pg-tg .fbtn').forEach(function(b){b.classList.remove('active')});
  if(btn)btn.classList.add('active');
  N.filterTGMessages();
};

N.filterTGMessages = function(){
  var q = (document.getElementById('tgSearch').value||'').toLowerCase();
  var filtered = tgMessages.filter(function(m){
    var matchType = tgCurrentType==='all'||(tgCurrentType==='text'?!m.has_media:m.media_type===tgCurrentType);
    var matchQ = !q||(m.text||'').toLowerCase().includes(q)||(m.file_name||'').toLowerCase().includes(q)||(m.caption||'').toLowerCase().includes(q);
    return matchType&&matchQ;
  });
  N.renderTG(filtered);
};

// --- MOVIES ---
N.loadMovies = async function(type,btn){
  if(btn){document.querySelectorAll('#pg-movies .fbtn').forEach(function(b){b.classList.remove('active')});btn.classList.add('active');}
  document.getElementById('moviesGrid').innerHTML='<div class="loading">🎬 Loading...</div>';
  try{
    var r = await fetch(API+'/api/movies?type='+type);
    var d = await r.json();
    var h='';
    (d.results||[]).forEach(function(m){
      h+='<div class="media-card">';
      if(m.image) h+='<img src="'+m.image+'" alt="'+esc(m.title)+'">';
      else h+='<img src="" style="background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center" alt="">';
      h+='<div class="info"><h4>'+esc(m.title)+'</h4>';
      h+='<div class="meta"><span>⭐ '+m.rating+'</span><span>'+(m.year||'')+'</span></div></div></div>';
    });
    document.getElementById('moviesGrid').innerHTML=h||'<div class="empty"><span>🎬</span>Koi movie nahi mili</div>';
  }catch(e){
    document.getElementById('moviesGrid').innerHTML='<div class="empty"><span>🎬</span>Movies load nahi ho payi</div>';
  }
};

// --- BOOKS ---
N.loadBooks = async function(q,btn){
  if(btn){document.querySelectorAll('#pg-books .fbtn').forEach(function(b){b.classList.remove('active')});btn.classList.add('active');}
  var query = document.getElementById('bookSearch').value||q||'hindi';
  document.getElementById('booksGrid').innerHTML='<div class="loading">📚 Loading...</div>';
  try{
    var r = await fetch(API+'/api/books?q='+encodeURIComponent(query));
    var d = await r.json();
    var h='';
    (d.results||[]).forEach(function(b){
      h+='<div class="media-card">';
      if(b.cover) h+='<img src="'+b.cover+'" alt="'+esc(b.title)+'">';
      else h+='<img src="" style="background:var(--card2)" alt="">';
      h+='<div class="info"><h4>'+esc(b.title)+'</h4>';
      h+='<div class="meta"><span>'+(b.author||'')+'</span><span>'+(b.year||'')+'</span></div>';
      if(b.read_url) h+='<a class="read-link" href="'+b.read_url+'" target="_blank">📖 Read Free</a>';
      h+='</div></div>';
    });
    document.getElementById('booksGrid').innerHTML=h||'<div class="empty"><span>📚</span>Koi book nahi mili</div>';
  }catch(e){
    document.getElementById('booksGrid').innerHTML='<div class="empty"><span>📚</span>Books load nahi ho payi</div>';
  }
};

// --- SEARCH ---
N.doSearch = async function(){
  var q = document.getElementById('searchInput').value.trim();
  if(!q)return;
  var el = document.getElementById('searchResults');
  el.innerHTML='<div class="loading">🔍 Searching all sources...</div>';
  try{
    var r = await fetch(API+'/api/search?q='+encodeURIComponent(q));
    var d = await r.json();
    var h='';
    var total = (d.movies||[]).length+(d.books||[]).length+(d.telegram||[]).length;
    h+='<div style="margin-bottom:12px;color:var(--text2);font-size:13px">'+total+' results for "'+q+'"</div>';

    (d.telegram||[]).forEach(function(m){
      h+='<div class="sr-card"><div class="sr-info"><h3>'+esc(m.text||m.file_name||'Media')+'</h3>';
      h+='<div class="sr-meta"><span class="sr-tag tg">📱 Telegram</span>';
      if(m.media_type) h+='<span class="sr-tag tg">'+m.media_type+'</span>';
      h+='</div>';
      if(m.from) h+='<p style="font-size:12px;color:var(--text2)">'+esc(m.from)+'</p>';
      h+='</div></div>';
    });
    (d.movies||[]).forEach(function(m){
      h+='<div class="sr-card">';
      if(m.image) h+='<img class="sr-img" src="'+m.image+'" alt="">';
      h+='<div class="sr-info"><h3>'+esc(m.title)+'</h3>';
      h+='<div class="sr-meta"><span class="sr-tag movie">🎬 Movie</span>';
      if(m.rating) h+='<span>⭐ '+m.rating+'</span>';
      if(m.year) h+='<span>'+m.year+'</span>';
      h+='</div>';
      if(m.overview) h+='<p style="font-size:12px;color:var(--text2)">'+esc(m.overview.substring(0,120))+'...</p>';
      h+='</div></div>';
    });
    (d.books||[]).forEach(function(b){
      h+='<div class="sr-card">';
      if(b.cover) h+='<img class="sr-img" src="'+b.cover+'" alt="">';
      h+='<div class="sr-info"><h3>'+esc(b.title)+'</h3>';
      h+='<div class="sr-meta"><span class="sr-tag book">📚 Book</span>';
      if(b.author) h+='<span>'+esc(b.author)+'</span>';
      h+='</div>';
      if(b.read_url) h+='<a href="'+b.read_url+'" target="_blank" style="color:var(--accent);font-size:12px">📖 Read Free</a>';
      h+='</div></div>';
    });
    if(!total) h='<div class="empty"><span>🔍</span>Kuchh nahi mila</div>';
    el.innerHTML=h;
  }catch(e){
    el.innerHTML='<div class="empty"><span>⚠️</span>Search fail hua. Try again.</div>';
  }
};

// --- AI CHAT ---
N.chat = async function(msg){
  if(!msg||!msg.trim())return;
  msg=msg.trim();
  var msgs = document.getElementById('chatMsgs');
  msgs.innerHTML+='<div class="msg user"><div class="msg-label">👤 You</div><p>'+esc(msg)+'</p></div>';
  msgs.innerHTML+='<div class="msg ai"><div class="msg-label">🤖 Thinking...</div><p>⏳</p></div>';
  msgs.scrollTop=msgs.scrollHeight;
  try{
    var r = await fetch(API+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})});
    var d = await r.json();
    var last = msgs.lastElementChild;
    last.innerHTML='<div class="msg-label">'+(d.icon||'⚡')+' '+(d.worker||'MAIN')+'</div><p>'+esc(d.response||'No response').replace(/\\n/g,'<br>')+'</p>';
  }catch(e){
    var last = msgs.lastElementChild;
    last.innerHTML='<div class="msg-label">⚠️ Error</div><p>Connect nahi ho paya. Try again.</p>';
  }
  msgs.scrollTop=msgs.scrollHeight;
};

// --- CATALOG ---
N.loadCatalog = async function(){
  try{
    var r = await fetch(API+'/api/catalog');
    var d = await r.json();
    var el = document.getElementById('catalogList');
    if((d.results||[]).length){
      var h='';
      d.results.forEach(function(item){
        h+='<div class="media-card">';
        if(item.image) h+='<img src="'+item.image+'" alt="">';
        else h+='<img src="" style="background:var(--card2)" alt="">';
        h+='<div class="info"><h4>'+esc(item.title)+'</h4>';
        h+='<div class="meta"><span>'+item.type+'</span><span>'+(item.year||'')+'</span></div>';
        if(item.description) h+='<p style="font-size:11px;color:var(--text2);margin-top:4px">'+esc(item.description.substring(0,80))+'</p>';
        h+='</div></div>';
      });
      el.innerHTML=h;
    }else{
      el.innerHTML='<div class="empty"><span>📁</span>Catalog khali hai. Add karo!</div>';
    }
  }catch(e){
    document.getElementById('catalogList').innerHTML='<div class="empty"><span>📁</span>Load nahi ho paya</div>';
  }
};

N.addToCatalog = async function(){
  var title = document.getElementById('catTitle').value.trim();
  if(!title){alert('Title zaroori hai!');return;}
  try{
    await fetch(API+'/api/catalog',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:title,type:document.getElementById('catType').value,description:document.getElementById('catDesc').value.trim()})});
    document.getElementById('catTitle').value='';
    document.getElementById('catDesc').value='';
    N.loadCatalog();
  }catch(e){alert('Add failed: '+e.message);}
};

// --- UTILS ---
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function formatSize(b){if(b>1073741824)return(b/1073741824).toFixed(1)+' GB';if(b>1048576)return(b/1048576).toFixed(1)+' MB';if(b>1024)return(b/1024).toFixed(1)+' KB';return b+' B';}

})();
`;
