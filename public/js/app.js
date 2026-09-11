(function(){
'use strict';

// ============================================================
// JDUB Hub — Enhanced Frontend
// All free services connected
// ============================================================
const API = window.location.hostname.includes('workers.dev')
  ? '' // same origin
  : 'https://jdub-deploy.njcreative123.workers.dev'; // Cloudflare Worker URL

let tgData = [];
let startTime = Date.now();

// Loader
window.addEventListener('load', function(){
  setTimeout(function(){
    document.getElementById('loader').classList.add('hid');
    document.getElementById('app').classList.add('vis');
    startUptime();
    loadTrending();
  }, 2500);
});

// Navigation
window.go = function(p) {
  document.querySelectorAll('.pg').forEach(function(e){ e.classList.remove('on') });
  document.querySelectorAll('.nb').forEach(function(e){ e.classList.remove('on') });
  var pg = document.getElementById('p-' + p);
  if (pg) pg.classList.add('on');
  var btn = document.querySelector('[data-p="' + p + '"]');
  if (btn) btn.classList.add('on');
  // Load data per page
  if (p === 'search') initSearch();
  if (p === 'catalog') loadCatalog();
};

// Uptime counter
function startUptime() {
  setInterval(function() {
    var d = Date.now() - startTime;
    var m = Math.floor(d / 60000);
    var h = Math.floor(m / 60);
    if (h > 0) document.getElementById('sUp').textContent = h + 'h' + (m % 60) + 'm';
    else document.getElementById('sUp').textContent = m + 'm';
  }, 10000);
}

// ============================================================
// SEARCH — combined search (movies + books + catalog)
// ============================================================
function initSearch() {
  var q = document.getElementById('searchInput');
  if (q) q.focus();
}

window.searchContent = async function() {
  var q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  var resultsDiv = document.getElementById('searchResults');
  resultsDiv.innerHTML = '<div class="loading">🔍 Searching movies, books & catalog...</div>';

  try {
    var resp = await fetch(API + '/api/search?q=' + encodeURIComponent(q));
    var data = await resp.json();
    
    if (data.results && data.results.length > 0) {
      var html = '<div class="sr-count">' + data.results.length + ' results for "' + q + '"</div>';
      data.results.forEach(function(r) {
        html += '<div class="sr-card">';
        if (r.image) html += '<img src="' + r.image + '" class="sr-img" alt="' + (r.title || '') + '">';
        html += '<div class="sr-info">';
        html += '<h3>' + (r.title || 'Untitled') + '</h3>';
        html += '<div class="sr-meta">';
        html += '<span class="badge-t ' + r.source + '">' + getSourceLabel(r.source) + '</span>';
        if (r.type) html += '<span class="badge-t ' + r.type + '">' + r.type + '</span>';
        if (r.year) html += '<span>' + r.year + '</span>';
        if (r.rating) html += '<span>⭐ ' + r.rating + '</span>';
        html += '</div>';
        if (r.author) html += '<p>by ' + r.author + '</p>';
        if (r.overview) html += '<p class="sr-overview">' + r.overview.substring(0, 150) + '...</p>';
        if (r.read_url) html += '<a href="' + r.read_url + '" target="_blank" class="sr-link">📖 Read on Open Library</a>';
        html += '</div></div>';
      });
      resultsDiv.innerHTML = html;
    } else {
      resultsDiv.innerHTML = '<div class="sr-empty">No results found for "' + q + '". Try different keywords.</div>';
    }
  } catch(e) {
    resultsDiv.innerHTML = '<div class="sr-error">⚠️ Worker offline. Using local mode.</div>';
    searchLocal(q, resultsDiv);
  }
};

function getSourceLabel(s) {
  var map = { tmdb: '🎬 Movie', openlibrary: '📚 Book', catalog: '📁 Catalog' };
  return map[s] || s;
}

function searchLocal(q, div) {
  div.innerHTML += '<div class="sr-empty">Worker se connect nahi ho paya. Try again later.</div>';
}

// ============================================================
// MOVIES — load from TMDB via Worker
// ============================================================
window.loadMovies = async function(type) {
  type = type || 'popular';
  var container = document.getElementById('moviesGrid');
  if (container) container.innerHTML = '<div class="loading">🎬 Loading movies...</div>';
  
  try {
    var resp = await fetch(API + '/api/movies?type=' + type);
    var data = await resp.json();
    if (data.results && container) {
      var html = '';
      data.results.forEach(function(m) {
        html += '<div class="movie-card">';
        if (m.image) html += '<img src="' + m.image + '" class="movie-poster" alt="' + m.title + '">';
        html += '<div class="movie-info">';
        html += '<h4>' + m.title + '</h4>';
        html += '<div class="movie-meta">';
        if (m.rating) html += '<span>⭐ ' + m.rating + '</span>';
        if (m.year) html += '<span>' + m.year + '</span>';
        html += '</div></div></div>';
      });
      container.innerHTML = html;
    }
  } catch(e) {
    if (container) container.innerHTML = '<div class="sr-error">Movies load nahi ho payi.</div>';
  }
};

// ============================================================
// BOOKS — Open Library via Worker
// ============================================================
window.loadBooks = async function(q) {
  q = q || 'famous';
  var container = document.getElementById('booksGrid');
  if (container) container.innerHTML = '<div class="loading">📚 Loading books...</div>';
  
  try {
    var resp = await fetch(API + '/api/books?q=' + encodeURIComponent(q));
    var data = await resp.json();
    if (data.results && container) {
      var html = '';
      data.results.forEach(function(b) {
        html += '<div class="book-card">';
        if (b.cover) html += '<img src="' + b.cover + '" class="book-cover" alt="' + b.title + '">';
        html += '<div class="book-info">';
        html += '<h4>' + b.title + '</h4>';
        html += '<p>' + (b.author || '') + ' ' + (b.year ? '(' + b.year + ')' : '') + '</p>';
        if (b.read_url) html += '<a href="' + b.read_url + '" target="_blank" class="sr-link">📖 Read Free</a>';
        html += '</div></div>';
      });
      container.innerHTML = html;
    }
  } catch(e) {
    if (container) container.innerHTML = '<div class="sr-error">Books load nahi ho payi.</div>';
  }
};

// ============================================================
// TRENDING — load combined trending
// ============================================================
window.loadTrending = async function() {
  try {
    var resp = await fetch(API + '/api/trending');
    var data = await resp.json();
    var mCount = (data.movies || []).length;
    var bCount = (data.books || []).length;
    document.getElementById('sMed').textContent = (mCount + bCount);
    document.getElementById('sMsg').textContent = '✅';
  } catch(e) {
    document.getElementById('sMsg').textContent = '—';
  }
};

// ============================================================
// CATALOG — D1 database content
// ============================================================
window.loadCatalog = async function() {
  var container = document.getElementById('catalogList');
  if (!container) return;
  container.innerHTML = '<div class="loading">Loading catalog...</div>';
  
  try {
    var resp = await fetch(API + '/api/catalog');
    var data = await resp.json();
    if (data.results && data.results.length) {
      var html = '<div class="sr-count">' + data.results.length + ' items in catalog</div>';
      data.results.forEach(function(item) {
        html += '<div class="sr-card">';
        if (item.image) html += '<img src="' + item.image + '" class="sr-img" alt="' + item.title + '">';
        html += '<div class="sr-info">';
        html += '<h3>' + item.title + '</h3>';
        html += '<div class="sr-meta">';
        html += '<span class="badge-t ' + item.type + '">' + item.type + '</span>';
        if (item.year) html += '<span>' + item.year + '</span>';
        if (item.rating) html += '<span>⭐ ' + item.rating + '</span>';
        html += '</div>';
        if (item.description) html += '<p>' + item.description.substring(0, 100) + '</p>';
        html += '<button onclick="deleteCatalog(' + item.id + ')" class="del-btn">🗑️</button>';
        html += '</div></div>';
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = '<div class="sr-empty">Catalog khali hai. Items add karo!</div>';
    }
  } catch(e) {
    container.innerHTML = '<div class="sr-error">Catalog load nahi ho paya.</div>';
  }
};

window.addToCatalog = async function() {
  var title = document.getElementById('catTitle').value.trim();
  var type = document.getElementById('catType').value;
  var desc = document.getElementById('catDesc').value.trim();
  if (!title) return alert('Title zaroori hai!');
  
  try {
    await fetch(API + '/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title, type: type, description: desc })
    });
    document.getElementById('catTitle').value = '';
    document.getElementById('catDesc').value = '';
    loadCatalog();
  } catch(e) {
    alert('Add failed: ' + e.message);
  }
};

window.deleteCatalog = async function(id) {
  if (!confirm('Delete this item?')) return;
  try {
    await fetch(API + '/api/catalog/item?id=' + id, { method: 'DELETE' });
    loadCatalog();
  } catch(e) {}
};

// ============================================================
// AI CHAT — worker AI router
// ============================================================
window.chat = async function(msg) {
  if (!msg || !msg.trim()) return;
  msg = msg.trim();
  var msgs = document.getElementById('cMsgs') || document.getElementById('qChat');
  if (!msgs) return;
  
  // Add user message
  msgs.innerHTML += '<div class="cm user"><span class="cb">👤 YOU</span><p>' + escHtml(msg) + '</p></div>';
  
  try {
    var resp = await fetch(API + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    var data = await resp.json();
    msgs.innerHTML += '<div class="cm ai"><span class="cb">' + (data.icon || '⚡') + ' ' + (data.worker || 'MAIN').toUpperCase() + '</span><p>' + escHtml(data.response || 'No response') + '</p></div>';
  } catch(e) {
    msgs.innerHTML += '<div class="cm ai"><span class="cb">⚡ MAIN AI</span><p>Worker se connect nahi ho paya. Try again! 🔌</p></div>';
  }
  
  msgs.scrollTop = msgs.scrollHeight;
};

window.qSend = function() {
  var input = document.getElementById('qIn');
  if (input && input.value.trim()) {
    window.chat(input.value);
    input.value = '';
  }
};

// ============================================================
// UTILITIES
// ============================================================
function escHtml(s) {
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

})();

// ============================================================
// TABS — movie & book tab switching
// ============================================================
window.switchMovieTab = function(btn, type) {
  document.querySelectorAll('#p-movies .tabb').forEach(function(b){ b.classList.remove('on') });
  btn.classList.add('on');
  window.loadMovies(type);
};

window.switchBookTab = function(btn, q) {
  document.querySelectorAll('#p-books .tabb').forEach(function(b){ b.classList.remove('on') });
  btn.classList.add('on');
  window.loadBooks(q);
};

// Load on page show
window.go = (function(orig){
  return function(p) {
    orig(p);
    if (p === 'movies') window.loadMovies('popular');
    if (p === 'books') window.loadBooks('famous');
  };
})(window.go);
