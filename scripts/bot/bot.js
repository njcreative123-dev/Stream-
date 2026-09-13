#!/usr/bin/env node
// ============================================================
// NJStream Telegram Bot — MonkeyBytes / any Node 18+ host
// Zero-dependency long-polling bot (native fetch, no npm install)
//
// Features:
//   /start /search /play /download /list /status /index
//   Group indexer: har connected group/channel ki media file_id,
//   file_name, file_size, media_type collect karke Worker ke
//   /api/telegram/ingest par bhejta hai.
//
// Env vars (copy .env.example → .env):
//   BOT_TOKEN, WORKER_URL, INGEST_KEY, CHAT_IDS (comma list)
//   LOCAL_BOT_API_URL (self-hosted Bot API, optional here)
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const WORKER_URL = (process.env.WORKER_URL || '').replace(/\/+$/, '');
const INGEST_KEY = process.env.INGEST_KEY || '';
const CHAT_IDS = (process.env.CHAT_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
const LOCAL_BOT_API_URL = (process.env.LOCAL_BOT_API_URL || '').replace(/\/+$/, '');
const STATE_FILE = path.join(__dirname, 'bot-state.json');
const API = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : '';

let state = { offset: 0, index: {}, indexedTotal: 0 };
try { state = Object.assign(state, JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))); } catch (e) {}

function saveState() {
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(state)); } catch (e) {}
}

function escapeMarkdown(s) {
  return String(s || '').replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

async function tg(method, payload) {
  if (!API) throw new Error('BOT_TOKEN missing');
  const r = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const d = await r.json().catch(() => ({}));
  if (!d.ok) throw new Error(JSON.stringify(d));
  return d.result;
}

async function sendMessage(chatId, text, opts) {
  try {
    await tg('sendMessage', Object.assign({ chat_id: chatId, text }, opts || {}));
  } catch (e) { console.error('sendMessage fail:', e.message); }
}

async function sendChatAction(chatId, action) {
  try { await tg('sendChatAction', { chat_id: chatId, action: action || 'typing' }); } catch (e) {}
}

function mediaOf(msg) {
  if (msg.video) return { type: 'video', file_id: msg.video.file_id, file_name: msg.video.file_name || (`video_${msg.message_id}.mp4`), file_size: msg.video.file_size || 0, mime: msg.video.mime_type || 'video/mp4', duration: msg.video.duration || 0 };
  if (msg.document) return { type: 'document', file_id: msg.document.file_id, file_name: msg.document.file_name || 'file', file_size: msg.document.file_size || 0, mime: msg.document.mime_type || 'application/octet-stream' };
  if (msg.audio) return { type: 'audio', file_id: msg.audio.file_id, file_name: msg.audio.file_name || 'audio', file_size: msg.audio.file_size || 0, mime: msg.audio.mime_type || 'audio/mpeg', duration: msg.audio.duration || 0 };
  if (msg.voice) return { type: 'voice', file_id: msg.voice.file_id, file_name: 'voice.ogg', file_size: msg.voice.file_size || 0, mime: 'audio/ogg', duration: msg.voice.duration || 0 };
  if (msg.photo && msg.photo.length) {
    const p = msg.photo[msg.photo.length - 1];
    return { type: 'photo', file_id: p.file_id, file_name: `photo_${msg.message_id}.jpg`, file_size: p.file_size || 0, mime: 'image/jpeg' };
  }
  if (msg.animation) return { type: 'animation', file_id: msg.animation.file_id, file_name: msg.animation.file_name || 'anim.gif', file_size: msg.animation.file_size || 0, mime: 'video/mp4' };
  return null;
}

function fmtSize(b) {
  b = b || 0;
  if (b >= 1024 ** 3) return (b / 1024 ** 3).toFixed(1) + ' GB';
  if (b >= 1024 ** 2) return Math.round(b / 1024 ** 2) + ' MB';
  return Math.round(b / 1024) + ' KB';
}

function indexOfEntry(chatId, msg) {
  const media = mediaOf(msg);
  const text = msg.text || msg.caption || '';
  const entry = {
    id: String(msg.message_id),
    chat_id: String(msg.chat && msg.chat.id ? msg.chat.id : chatId),
    text,
    from: (msg.from && (msg.from.username || msg.from.first_name)) || 'unknown',
    date: msg.date || Math.floor(Date.now() / 1000),
    has_media: !!media,
    media_type: media ? media.type : '',
    file_id: media ? media.file_id : '',
    file_name: media ? media.file_name : '',
    file_size: media ? media.file_size : 0,
    mime: media ? media.mime : '',
    duration: media && media.duration ? media.duration : 0,
    video: media && media.type === 'video' ? { fileId: media.file_id, url: '', size: media.file_size, name: media.file_name, mime: media.mime, duration: media.duration } : null,
    document: media && media.type === 'document' ? { fileId: media.file_id, url: '', size: media.file_size, name: media.file_name, mime: media.mime } : null,
    audio: media && (media.type === 'audio' || media.type === 'voice') ? { fileId: media.file_id, url: '', size: media.file_size, name: media.file_name, mime: media.mime, duration: media.duration } : null,
    photo: media && media.type === 'photo' ? media.file_id : '',
  };
  return entry;
}

async function pushToWorker(batch) {
  if (!WORKER_URL || !INGEST_KEY) return;
  try {
    const r = await fetch(`${WORKER_URL}/api/telegram/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-ingest-key': INGEST_KEY },
      body: JSON.stringify({ chat_id: state.currentChat || '', messages: batch }),
    });
    const d = await r.json().catch(() => ({}));
    if (!d.ok) console.error('ingest fail:', JSON.stringify(d));
  } catch (e) { console.error('ingest error:', e.message); }
}

async function indexMessage(chatId, msg) {
  const key = String(chatId) + ':' + String(msg.message_id);
  if (state.index[key]) return false;
  const entry = indexOfEntry(chatId, msg);
  state.index[key] = entry;
  state.indexedTotal = Object.keys(state.index).length;
  saveState();
  return entry;
}

function searchIndex(q) {
  const needle = String(q || '').toLowerCase().trim();
  const out = [];
  for (const key of Object.keys(state.index)) {
    const e = state.index[key];
    if (!needle) { out.push(e); if (out.length >= 50) break; continue; }
    const hay = [e.text, e.file_name, e.media_type, e.id].join(' ').toLowerCase();
    if (hay.includes(needle)) { out.push(e); if (out.length >= 50) break; }
  }
  return out;
}

function mediaLink(entry) {
  const base = WORKER_URL || 'https://njsoft-stream.njcreative123.workers.dev';
  if (LOCAL_BOT_API_URL) {
    // Local Bot API: direct file path serving (unlimited size)
    return {
      play: `${base}/api/livebot/stream?file_id=${encodeURIComponent(entry.file_id || '')}`,
      download: `${base}/api/livebot/stream?file_id=${encodeURIComponent(entry.file_id || '')}&download=1`,
    };
  }
  return {
    play: `${base}/api/telegram/proxy?msg_id=${encodeURIComponent(entry.id)}&chat_id=${encodeURIComponent(entry.chat_id || '')}`,
    download: `${base}/api/telegram/proxy?msg_id=${encodeURIComponent(entry.id)}&chat_id=${encodeURIComponent(entry.chat_id || '')}&download=1`,
  };
}

// ---------------- Commands ----------------
async function cmdStart(chatId, text) {
  await sendChatAction(chatId, 'typing');
  const total = state.indexedTotal;
  await sendMessage(chatId,
    `👑 *NJStream Bot* — Telegram Data Manager\n\n` +
    `Maine launch ho gaya. Ek group family ki tarah kaam karta hu:\n` +
    `• Movies/Videos index\n` +
    `• Books/Docs index\n` +
    `• Long video play/download (20MB limit removed via Local Bot API)\n\n` +
    `Indexed media abhi: *${total}*\n\n` +
    `*Commands:*\n` +
    `/search <query> — movies, books, media dhundho\n` +
    `/play <file_id> — streaming link do\n` +
    `/download <file_id> — direct download link do\n` +
    `/list — indexed media list\n` +
    `/status — bot + API server health\n` +
    `/index — groups scan karo`,
    { parse_mode: 'Markdown' });
}

async function cmdSearch(chatId, query) {
  await sendChatAction(chatId, 'typing');
  if (!query) { await sendMessage(chatId, `Search query bhi do: \`/search <name>\``, { parse_mode: 'Markdown' }); return; }
  const results = searchIndex(query);
  if (!results.length) { await sendMessage(chatId, `😕 "${query}" ke liye kuch nahi mila.`); return; }
  let out = `🔎 *Search: ${escapeMarkdown(query)}* — ${results.length} results\n\n`;
  const lines = [];
  for (const e of results.slice(0, 20)) {
    const name = e.file_name || e.text || ('msg ' + e.id);
    lines.push(`• ${escapeMarkdown(name)} — ${fmtSize(e.file_size)} (${e.media_type || 'text'})\n  /play\\_${e.id} | /download\\_${e.id}`);
  }
  out += lines.join('\n');
  await sendMessage(chatId, out, { parse_mode: 'Markdown' });
}

async function cmdPlay(chatId, arg) {
  await sendChatAction(chatId, 'upload_video');
  const isId = /^\d+$/.test(arg);
  const entry = isId ? searchIndex(arg).find(e => e.id === arg) : searchIndex(arg)[0];
  if (!entry) { await sendMessage(chatId, `Media nahi mila: \`${escapeMarkdown(arg)}\``, { parse_mode: 'Markdown' }); return; }
  const links = mediaLink(entry);
  await sendMessage(chatId,
    `🎬 *${escapeMarkdown(entry.file_name || 'Video')}*\n` +
    `📦 ${fmtSize(entry.file_size)} | ${entry.media_type}\n\n` +
    `▶️ [Stream link](${links.play})\n` +
    `⬇️ [Download link](${links.download})\n\n` +
    `_(Browser mein khulte hi play/download ho jayega)_`,
    { parse_mode: 'Markdown', disable_web_page_preview: true });
}

async function cmdDownload(chatId, arg) {
  await sendChatAction(chatId, 'upload_document');
  const entry = arg && /^\d+$/.test(arg) ? searchIndex(String(arg)).find(e => e.id === String(arg)) : (arg ? searchIndex(arg)[0] : null);
  if (!entry) { await sendMessage(chatId, `Media nahi mila. /list se file_id lo ya /search karo.`); return; }
  const links = mediaLink(entry);
  await sendMessage(chatId, `⬇️ *Download ready*\n📦 ${escapeMarkdown(entry.file_name || 'file')} (${fmtSize(entry.file_size)})\n\n[Direct Download](${links.download})`, { parse_mode: 'Markdown', disable_web_page_preview: true });
}

async function cmdList(chatId, arg) {
  await sendChatAction(chatId, 'typing');
  const q = arg && arg !== 'all' ? arg : '';
  const results = searchIndex(q);
  if (!results.length) { await sendMessage(chatId, `Index khali hai ya "${q}" nahi mila. /index chalao.`); return; }
  const videos = results.filter(e => e.media_type === 'video');
  const docs = results.filter(e => e.media_type === 'document' || e.media_type === 'audio');
  const photos = results.filter(e => e.media_type === 'photo');
  let out = `📚 *Indexed Library* (${results.length} total)\n\n`;
  if (videos.length) out += `🎬 *Videos:* ${videos.length}\n${videos.slice(0, 10).map(e => `• ${escapeMarkdown(e.file_name || e.id)} (${fmtSize(e.file_size)})`).join('\n')}\n\n`;
  if (docs.length) out += `📄 *Docs/Audio:* ${docs.length}\n${docs.slice(0, 10).map(e => `• ${escapeMarkdown(e.file_name || e.id)} (${fmtSize(e.file_size)})`).join('\n')}\n\n`;
  if (photos.length) out += `🖼 *Photos:* ${photos.length}\n`;
  out += `\nPlay karo: \`/play <file_id>\`  |  Download: \`/download <file_id>\``;
  await sendMessage(chatId, out, { parse_mode: 'Markdown' });
}

async function cmdStatus(chatId) {
  await sendChatAction(chatId, 'typing');
  let localStatus = 'not configured';
  if (LOCAL_BOT_API_URL) {
    try {
      const r = await fetch(`${LOCAL_BOT_API_URL}/bot${BOT_TOKEN}/getMe`);
      const d = await r.json();
      localStatus = d.ok ? '✅ UP (Local Bot API)' : '⚠️ DOWN (' + JSON.stringify(d) + ')';
    } catch (e) { localStatus = '❌ unreachable: ' + e.message; }
  }
  let workerStatus = 'not checked';
  if (WORKER_URL) {
    try {
      const r = await fetch(`${WORKER_URL}/api/status`);
      const d = await r.json();
      workerStatus = r.ok ? `✅ UP (${(d && d.videos) ? d.videos + ' videos' : 'ok'})` : '⚠️ ' + r.status;
    } catch (e) { workerStatus = '❌ ' + e.message; }
  }
  const med = Object.values(state.index);
  const byType = med.reduce((a, e) => { a[e.media_type || 'text'] = (a[e.media_type || 'text'] || 0) + 1; return a; }, {});
  await sendMessage(chatId,
    `🔧 *NJStream Bot Status*\n\n` +
    `🤖 Bot: ✅ live (long-polling)\n` +
    `📡 Worker: ${workerStatus}\n` +
    `🖥 Local Bot API: ${localStatus}\n\n` +
    `🗄 Index: *${state.indexedTotal}* entries\n` +
    `• ${JSON.stringify(byType)}\n` +
    `🧠 Memory: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB\n` +
    `⏱ Uptime: ${Math.round(process.uptime())}s\n` +
    `💾 State file: ${STATE_FILE}`,
    { parse_mode: 'Markdown' });
}

async function cmdIndex(chatId) {
  await sendChatAction(chatId, 'typing');
  const chats = CHAT_IDS.length ? CHAT_IDS : [String(chatId)];
  let scanned = 0;
  let added = 0;
  for (const cid of chats) {
    state.currentChat = cid;
    let offset = 0;
    let batches = 0;
    while (batches < 50) {
      try {
        const data = await tg('getUpdates', { offset, limit: 100, timeout: 5, allowed_updates: ['message', 'channel_post'] });
        if (!data.length) break;
        const batch = [];
        for (const u of data) {
          const msg = u.message || u.channel_post || u.edited_message || u.edited_channel_post;
          if (!msg) continue;
          const actualChat = String(msg.chat && msg.chat.id ? msg.chat.id : cid);
          const got = await indexMessage(actualChat, msg);
          if (got) { batch.push(got); added++; }
          offset = Math.max(offset, (u.update_id || 0) + 1);
        }
        if (batch.length) await pushToWorker(batch);
        scanned += data.length;
        batches++;
      } catch (e) { console.error('index error:', e.message); break; }
    }
  }
  await sendMessage(chatId, `🗃 *Indexing complete!*\n\nChats scanned: ${chats.length}\nUpdates read: ${scanned}\nNew entries added: *${added}*\nTotal index: *${state.indexedTotal}*`);
}

// ---------------- Update loop ----------------
async function handleUpdate(u) {
  const msg = u.message || u.channel_post || u.edited_message || u.edited_channel_post;
  if (!msg) return;
  const chatId = msg.chat && msg.chat.id;
  if (!chatId) return;
  // Channel posts / group messages → silent index (no reply)
  const isPrivate = msg.chat && (msg.chat.type === 'private');
  const isGroup = msg.chat && (msg.chat.type === 'group' || msg.chat.type === 'supergroup' || msg.chat.type === 'channel');
  const entry = await indexMessage(chatId, msg);
  if (entry) {
    state.currentChat = String(chatId);
    await pushToWorker([entry]);
  }
  if (!msg.text) { if (isGroup) { /* media json update hi kafi hai */ } return; }
  const parts = String(msg.text).trim().split(/\s+/);
  const cmd = (parts[0] || '').toLowerCase();
  const arg = parts.slice(1).join(' ').trim();
  const cmdName = cmd.replace(/@[a-z0-9_]+/i, '');
  try {
    if (cmdName === '/start' || cmdName === '/help') await cmdStart(chatId, arg);
    else if (cmdName === '/search') await cmdSearch(chatId, arg);
    else if (cmdName === '/play') await cmdPlay(chatId, arg);
    else if (cmdName === '/download') await cmdDownload(chatId, arg);
    else if (cmdName === '/list' || cmdName === '/library') await cmdList(chatId, arg);
    else if (cmdName === '/status' || cmdName === '/health') await cmdStatus(chatId);
    else if (cmdName === '/index' || cmdName === '/sync') await cmdIndex(chatId);
  } catch (e) {
    console.error('command error:', e.message);
    if (isPrivate) await sendMessage(chatId, '⚠️ Error: ' + e.message);
  }
}

async function pollOnce() {
  if (!API) { console.error('BOT_TOKEN missing — .env check karo'); return; }
  let updates = [];
  try {
    updates = await tg('getUpdates', { offset: state.offset, limit: 100, timeout: 25, allowed_updates: ['message', 'channel_post', 'edited_message', 'edited_channel_post'] });
  } catch (e) { console.error('poll error:', e.message); return; }
  for (const u of updates) {
    try { await handleUpdate(u); } catch (e) { console.error('update error:', e.message); }
    state.offset = (u.update_id || 0) + 1;
    saveState();
  }
}

(async function main() {
  console.log('🧠 NJStream Bot starting…');
  if (!API) { console.error('❌ BOT_TOKEN missing. Abort.'); process.exit(1); }
  const me = await tg('getMe').catch(e => null);
  if (!me) { console.error('❌ getMe failed — token galat ya network band:', (await tg('getMe').catch(e => e.message))); process.exit(1); }
  console.log(`✅ Bot live: @${me.username} (${me.first_name})`);
  console.log(`📡 Worker: ${WORKER_URL || 'not set'}`);
  console.log(`🖥 Local Bot API: ${LOCAL_BOT_API_URL || 'not set'}`);
  console.log(`🗄 Existing index: ${state.indexedTotal} entries`);
  setInterval(pollOnce, 3000);
  await pollOnce();
})();
