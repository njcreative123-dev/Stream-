// === ADD THESE LINES AFTER THE SEARCH ROUTE (around line 245) ===
// if (path === '/api/search') return handleSearch(url, env);
// ADD:
      if (path === '/api/moviebox/search') return handleMovieBoxSearch(url, env);
      if (path === '/api/moviebox/stream') return handleMovieBoxStream(request, url, env);

// === ADD THESE FUNCTIONS BEFORE THE serveStreamFromUpstream function ===
async function handleMovieBoxSearch(url, env) {
  const q = url.searchParams.get('q');
  if (!q || q.length < 2) return json({ error: 'q parameter required (min 2 chars)' }, 400);
  const api = env.MOVIEBOX_API || '';
  if (!api) return json({ results: [], note: 'MovieBox API not configured' });
  try {
    const res = await fetch(api + '/search?q=' + encodeURIComponent(q), { signal: AbortSignal.timeout(15000) });
    return new Response(res.body, { status: res.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return json({ results: [], error: 'MovieBox API unreachable: ' + e.message });
  }
}

async function handleMovieBoxStream(request, url, env) {
  const movieId = url.searchParams.get('movie_id');
  if (!movieId) return json({ error: 'movie_id required' }, 400);
  const api = env.MOVIEBOX_API || '';
  if (!api) return json({ error: 'MovieBox API not configured' }, 500);
  try {
    const res = await fetch(api + '/stream?movie_id=' + encodeURIComponent(movieId), { signal: AbortSignal.timeout(20000) });
    const data = await res.json();
    if (data.stream_url) {
      // Range proxy through worker for seek support
      return serveStreamFromUpstream(request, data.stream_url, { name: movieId + '.mp4', mime: 'video/mp4', download: url.searchParams.get('download') === '1' });
    }
    return json(data);
  } catch (e) {
    return json({ error: 'MovieBox stream error: ' + e.message }, 500);
  }
}
