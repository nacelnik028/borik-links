export const CACHE_MS = 60 * 60 * 1000;
const codes = new Set(['unavailable', 'not_configured', 'reauthorize', 'rate_limited', 'invalid_request']);

export class SourceError extends Error {
  constructor(code, status = 502, retryAfter = 60) {
    super(codes.has(code) ? code : 'unavailable');
    this.code = this.message;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export async function fetchJSON(url, options = {}) {
  // Přesměrování nesmí přenést hlavičku ani Steam klíč na jinou adresu.
  const response = await fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(8000) });
  if (response.status === 429) {
    const raw = response.headers.get('Retry-After');
    const seconds = /^\d+$/.test(raw || '') ? Number(raw) : (Date.parse(raw) - Date.now()) / 1000;
    throw new SourceError('rate_limited', 429, Math.min(3600, Math.max(60, Math.ceil(seconds) || 60)));
  }
  if (!response.ok) {
    if (String(url) === 'https://accounts.spotify.com/api/token' && [400, 401].includes(response.status)) {
      throw new SourceError('reauthorize', 503, 3600);
    }
    throw new SourceError('unavailable');
  }
  return response.json();
}

export function createHandler(load) {
  let cached, expiresAt = 0, pending, failure, retryAt = 0;
  return async request => {
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
    const reply = (payload, status, extra = {}) => new Response(request.method === 'HEAD' ? null : JSON.stringify(payload),
      { status, headers: { ...headers, ...extra } });
    if (!['GET', 'HEAD'].includes(request.method)) return reply({ error: 'invalid_request' }, 405, { Allow: 'GET, HEAD' });
    if (new URL(request.url).search) return reply({ error: 'invalid_request' }, 400);
    try {
      if (!cached || Date.now() >= expiresAt) {
        if (failure && Date.now() < retryAt) throw failure;
        if (!pending) {
          pending = Promise.resolve().then(load).then(result => {
            cached = { ...result, updatedAt: new Date().toISOString() };
            expiresAt = Date.now() + CACHE_MS;
            failure = null;
          }).catch(error => {
            failure = error instanceof SourceError ? error : new SourceError('unavailable');
            retryAt = Date.now() + failure.retryAfter * 1000;
            throw failure;
          }).finally(() => { pending = null; });
        }
        await pending;
      }
      // CDN dostane jen zbývající životnost stejného výsledku, vrstvy se nesčítají.
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      return reply(cached, 200, { 'Netlify-CDN-Cache-Control': `public, durable, max-age=${remaining}` });
    } catch (error) {
      const safe = error instanceof SourceError ? error : new SourceError('unavailable');
      const retry = Math.max(1, Math.ceil((retryAt - Date.now()) / 1000) || safe.retryAfter);
      return reply({ error: safe.code }, safe.status, { 'Retry-After': String(retry) });
    }
  };
}
