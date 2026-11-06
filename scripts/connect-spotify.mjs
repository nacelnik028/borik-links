// Jednorázové propojení vlastníka. Token se uloží jen do ignorovaného .env.
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';

const envFile = new URL('../.env', import.meta.url);
try { process.loadEnvFile(envFile); }
catch { console.error('Nejprve zkopíruj .env.example do .env a doplň Spotify Client ID a Client Secret.'); process.exit(1); }

const clientId = process.env.SPOTIFY_CLIENT_ID;
const secret = process.env.SPOTIFY_CLIENT_SECRET;
if (!/^[a-fA-F0-9]{32}$/.test(clientId || '') || !/^[a-fA-F0-9]{32}$/.test(secret || '')) {
  console.error('Do .env doplň platné SPOTIFY_CLIENT_ID a SPOTIFY_CLIENT_SECRET z nastavení své Spotify aplikace.');
  process.exit(1);
}

const redirectUri = 'http://127.0.0.1:8888/callback';
const state = randomBytes(32).toString('hex');
let exchanging = false, completed = false, timeout;
const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  let url;
  try { url = new URL(request.url, 'http://127.0.0.1:8888'); }
  catch { response.writeHead(400).end('Neplatná adresa.'); return; }
  if (request.method !== 'GET' || request.headers.host !== '127.0.0.1:8888' || url.origin !== 'http://127.0.0.1:8888') {
    response.writeHead(404).end('Nenalezeno.');
    return;
  }
  if (url.pathname === '/' && completed) {
    response.end('Hotovo. Spotify je propojené. Tuto kartu můžeš zavřít. Dočasná stránka se za dvě minuty vypne; propojení tím zůstane zachované.');
    return;
  }
  if (url.pathname !== '/callback') {
    response.writeHead(404).end('Nenalezeno.');
    return;
  }
  if (url.searchParams.get('state') !== state) {
    response.writeHead(400).end('Neplatný požadavek. Otevři původní přihlašovací odkaz z terminálu.');
    return;
  }
  if (completed) {
    response.writeHead(303, { Location: '/' }).end();
    return;
  }
  if (exchanging) {
    response.writeHead(409).end('Propojení se právě dokončuje. Chvíli počkej.');
    return;
  }
  exchanging = true;
  clearTimeout(timeout);
  if (url.searchParams.has('error') || !url.searchParams.get('code')) {
    response.writeHead(400).end('Propojení nebylo povoleno. Pomocníka můžeš spustit znovu.');
    server.close();
    process.exitCode = 1;
    return;
  }
  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: redirectUri }),
    });
    if (!tokenResponse.ok) throw new Error('Token nelze získat.');
    const token = await tokenResponse.json();
    if (typeof token.refresh_token !== 'string' || !/^[a-zA-Z0-9._~+/=-]+$/.test(token.refresh_token)
      || typeof token.scope !== 'string' || token.scope.trim() !== 'user-top-read') {
      throw new Error('Povoleno je pouze čtení žebříčku.');
    }
    const content = await readFile(envFile, 'utf8');
    const line = `SPOTIFY_REFRESH_TOKEN=${token.refresh_token}`;
    const next = /^SPOTIFY_REFRESH_TOKEN=.*$/m.test(content)
      ? content.replace(/^SPOTIFY_REFRESH_TOKEN=.*$/gm, () => line) : `${content.trimEnd()}\n${line}\n`;
    await writeFile(envFile, next, { encoding: 'utf8', mode: 0o600 });
    completed = true;
    // Odstranit jednorázový kód z adresy; krátce ponechat potvrzení i pro reload.
    response.writeHead(303, { Location: '/' }).end();
    timeout = setTimeout(() => server.close(), 2 * 60 * 1000);
    console.log('Hotovo. SPOTIFY_REFRESH_TOKEN je uložený v .env. Přenes jej do proměnných prostředí na Netlify.');
  } catch {
    response.writeHead(502).end('Propojení se nepodařilo. Zkontroluj nastavení aplikace a spusť pomocníka znovu.');
    console.error('Propojení se nepodařilo. Ověř Client ID, Client Secret, redirect URI a přístup účtu k aplikaci.');
    process.exitCode = 1;
  } finally {
    if (!completed) server.close();
  }
});
server.on('error', () => {
  clearTimeout(timeout);
  console.error('Nelze spustit místní propojení na portu 8888. Zkontroluj, zda jej nepoužívá jiný program.');
  process.exitCode = 1;
});
server.listen(8888, '127.0.0.1', () => {
  const authorize = new URL('https://accounts.spotify.com/authorize');
  authorize.search = new URLSearchParams({ client_id: clientId, response_type: 'code', redirect_uri: redirectUri,
    scope: 'user-top-read', state, show_dialog: 'true' });
  console.log(`V nastavení Spotify aplikace musí být Redirect URI: ${redirectUri}`);
  console.log(`Otevři tento odkaz a povol čtení svého žebříčku:\n${authorize.href}`);
  timeout = setTimeout(() => {
    console.error('Čas pro propojení vypršel. Spusť pomocníka znovu.');
    process.exitCode = 1;
    server.close();
  }, 5 * 60 * 1000);
});
