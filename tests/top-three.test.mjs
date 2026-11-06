import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, fetchJSON, CACHE_MS } from '../netlify/lib/response.mjs';
import { createArtistsLoader } from '../netlify/functions/top-artists.mjs';
import { createVault, memoryStore } from '../netlify/lib/spotify-vault.mjs';

const envKeys = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_REFRESH_TOKEN', 'SPOTIFY_TIME_RANGE', 'STEAM_API_KEY', 'STEAM_ID'];
const originalFetch = globalThis.fetch;
const originalEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
let importId = 0;
const request = () => new Request('https://example.test/.netlify/functions/top-three');
async function fresh(name) {
  if (name === 'top-artists') return createHandler(createArtistsLoader({ vaultFactory: options => createVault({ ...options, store: memoryStore() }) }));
  return (await import(`../netlify/functions/${name}.mjs?test=${++importId}`)).default;
}
function credentials() {
  process.env.SPOTIFY_CLIENT_ID = 'a'.repeat(32);
  process.env.SPOTIFY_CLIENT_SECRET = 'b'.repeat(32);
  process.env.SPOTIFY_REFRESH_TOKEN = 'refresh-for-tests';
  process.env.SPOTIFY_TIME_RANGE = 'short_term';
  process.env.STEAM_API_KEY = 'c'.repeat(32);
  process.env.STEAM_ID = '76561198879183063';
}
test.afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of envKeys) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

test('Bez přístupových údajů nevolá služby ani neprozradí jejich nastavení', async () => {
  for (const key of envKeys) delete process.env[key];
  globalThis.fetch = () => assert.fail('Nemá volat externí službu.');
  for (const name of ['top-artists', 'top-games']) {
    const response = await (await fresh(name))(request());
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'not_configured' });
  }
});

test('Spotify obnoví token, žádá tři interprety pro správné období a neposílá token návštěvníkovi', async () => {
  credentials();
  let calls = 0;
  const id = '0bFEOKy3T1knA0g7ZaPnHe';
  globalThis.fetch = async (url, options) => {
    calls++;
    if (calls === 1) {
      assert.equal(url, 'https://accounts.spotify.com/api/token');
      assert.equal(options.method, 'POST');
      assert.equal(options.body.get('refresh_token'), 'refresh-for-tests');
      assert.equal(options.headers.Authorization, `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`);
      assert.equal(options.redirect, 'error');
      return Response.json({ access_token: 'private-access-token', token_type: 'Bearer', expires_in: 3600, scope: 'user-top-read' });
    }
    const target = new URL(url);
    assert.equal(target.pathname, '/v1/me/top/artists');
    assert.equal(target.searchParams.get('limit'), '3');
    assert.equal(target.searchParams.get('time_range'), 'short_term');
    assert.equal(options.headers.Authorization, 'Bearer private-access-token');
    return Response.json({ items: [{ id, name: 'Interpret <script>', images: [{ url: 'https://i.scdn.co/image/example' }] }] });
  };
  const handler = await fresh('top-artists');
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Netlify-CDN-Cache-Control'), /max-age=3600/);
  const payload = await response.json();
  assert.equal(payload.items[0].url, `https://open.spotify.com/artist/${id}`);
  assert.equal(payload.period, 'short_term');
  assert.ok(Date.parse(payload.updatedAt));
  assert.doesNotMatch(JSON.stringify(payload), /private-access-token|refresh-for-tests|secret-for-tests/);
  await handler(request());
  assert.equal(calls, 2, 'Druhý návštěvník používá cache.');
});

test('Steam seřadí podle hodin a zahrne hrané free-to-play hry', async () => {
  credentials();
  globalThis.fetch = async url => {
    assert.equal(url.searchParams.get('include_played_free_games'), '1');
    assert.equal(url.searchParams.get('steamid'), process.env.STEAM_ID);
    return Response.json({ response: { games: [
      { appid: 1, name: 'První', playtime_forever: 6000, img_icon_url: 'a'.repeat(40) },
      { appid: 2, name: 'Druhý', playtime_forever: 120 },
      { appid: 3, name: 'Třetí', playtime_forever: 90 },
      { appid: 4, name: 'Čtvrtý', playtime_forever: 60 },
      { appid: 5, name: 'Nikdy nehraná', playtime_forever: 0 },
    ].reverse() } });
  };
  const payload = await (await (await fresh('top-games'))(request())).json();
  assert.deepEqual(payload.items.map(item => item.title), ['První', 'Druhý', 'Třetí']);
  assert.equal(payload.items[0].description, '100 h celkem');
  assert.equal(payload.items[2].description, '1,5 h celkem');
  assert.equal(payload.items[0].url, 'https://store.steampowered.com/app/1/');
  assert.match(payload.items[0].image, /\/1\/a{40}\.jpg$/);
  assert.doesNotMatch(JSON.stringify(payload), /steam-key-for-tests|76561198879183063/);
});

test('Spotify odmítne token s širším nebo neznámým oprávněním ještě před čtením dat', async () => {
  credentials();
  for (const scope of ['user-top-read user-modify-playback-state', 'playlist-modify-public', '', undefined]) {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return Response.json({ access_token: 'overpowered-token', expires_in: 3600, scope });
    };
    const response = await (await fresh('top-artists'))(request());
    assert.equal(response.status, 503);
    assert.equal(calls, 1);
    assert.deepEqual(await response.json(), { error: 'not_configured' });
  }
});

test('Soukromý Steam odliší od skutečně prázdné knihovny', async () => {
  credentials();
  globalThis.fetch = async () => Response.json({ response: {} });
  assert.equal((await (await fresh('top-games'))(request())).status, 502);
  globalThis.fetch = async () => Response.json({ response: { game_count: 0 } });
  const response = await (await fresh('top-games'))(request());
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).items, []);
});

test('Výpadky a chyby JSON zůstanou bez tajných údajů a bez cache', async () => {
  credentials();
  for (const mock of [
    async () => { throw new Error(`https://upstream.test/?key=${process.env.STEAM_API_KEY}`); },
    async () => new Response('private-access-token', { status: 200 }),
  ]) {
    globalThis.fetch = mock;
    const response = await (await fresh('top-games'))(request());
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'unavailable' });
  }
});

test('Rate limit respektuje Retry-After a nevolá znovu službu během prodlevy', async t => {
  credentials();
  let calls = 0, now = Date.now();
  t.mock.method(Date, 'now', () => now);
  globalThis.fetch = async () => { calls++; return new Response('sensitive upstream body', { status:429, headers:{'Retry-After':'120'} }); };
  const handler = await fresh('top-games');
  const response = await handler(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '120');
  assert.deepEqual(await response.json(), { error:'rate_limited' });
  now += 60000;
  assert.equal((await handler(request())).headers.get('Retry-After'), '60');
  assert.equal(calls, 1);
  now += 60001;
  await handler(request());
  assert.equal(calls, 2);
});

test('CDN dostává jen zbývající životnost a cache se po hodině obnoví', async t => {
  let calls = 0, now = Date.now();
  t.mock.method(Date, 'now', () => now);
  const handler = createHandler(async () => ({ items:[++calls] }));
  assert.equal((await handler(request())).headers.get('Netlify-CDN-Cache-Control'), 'public, durable, max-age=3600');
  now += CACHE_MS - 1000;
  assert.equal((await handler(request())).headers.get('Netlify-CDN-Cache-Control'), 'public, durable, max-age=1');
  assert.equal(calls, 1);
  now += 1001;
  await handler(request());
  assert.equal(calls, 2);
});

test('Parametry proxy a nepotřebné metody jsou odmítnuty bez upstream požadavku', async () => {
  let calls = 0;
  const handler = createHandler(async () => { calls++; return {}; });
  for (const query of ['?url=https://evil.test','?steamid=76561190000000000','?token=fixture','?endpoint=me']) {
    assert.equal((await handler(new Request('https://example.test/'+query))).status, 400);
  }
  for (const method of ['POST','PUT','PATCH','DELETE','OPTIONS']) assert.equal((await handler(new Request('https://example.test/',{method}))).status,405);
  assert.equal(calls,0);
});

test('Upstream přesměrování je zakázané a nevystaví citlivý Location', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(options.redirect,'error');
    return new Response(null,{status:302,headers:{Location:'https://evil.test/secret'}});
  };
  await assert.rejects(fetchJSON('https://accounts.spotify.com/api/token'), /unavailable/);
});

test('Steam odmítne poškozené časy, duplicitní ID i neplatná data', async () => {
  credentials();
  for(const games of [
    [{appid:1,name:'Hra',playtime_forever:-1}],
    [{appid:1,name:'Hra',playtime_forever:1.5}],
    [{appid:'1',name:'Hra',playtime_forever:60}],
    [{appid:1,name:'Hra',playtime_forever:60},{appid:1,name:'Duplicitní',playtime_forever:120}],
  ]) {
    globalThis.fetch = async () => Response.json({response:{games}});
    assert.equal((await (await fresh('top-games'))(request())).status,502);
  }
});

test('Spotify validuje token a výsledky a cizí obrázky nezveřejní', async () => {
  credentials();
  const token = {access_token:'private-access-token',token_type:'Bearer',expires_in:3600,scope:'user-top-read'};
  for(const changes of [{token_type:'Other'},{expires_in:0},{access_token:''},{refresh_token:'invalid\nvalue'}]) {
    globalThis.fetch = async () => Response.json({...token,...changes});
    assert.equal((await (await fresh('top-artists'))(request())).status,502);
  }
  for(const items of [[{id:'bad',name:'Artist'}],Array(4).fill({id:'a'.repeat(22),name:'Artist'}),null]) {
    globalThis.fetch = async url => Response.json(String(url).includes('/api/token')?token:{items});
    assert.equal((await (await fresh('top-artists'))(request())).status,502);
  }
  globalThis.fetch = async url => Response.json(String(url).includes('/api/token')?token:{items:[{id:'a'.repeat(22),name:'Artist',images:[{url:'https://evil.test/image'}]}]});
  const payload = await (await (await fresh('top-artists'))(request())).json();
  assert.equal(payload.items[0].image,undefined);
});

test('Rotovaný refresh token je šifrovaný a po novém startu se použije místo původního', async () => {
  credentials();
  const store = memoryStore();
  let lastCiphertext;
  const captureStore = {get:store.get, async set(key,value) {lastCiphertext=value;await store.set(key,value);} };
  const factory = options => createVault({...options,store:captureStore});
  let tokens = 0;
  globalThis.fetch = async (url,options) => {
    if(String(url).includes('/api/token')) {
      assert.equal(options.body.get('refresh_token'), tokens++ === 0 ? 'refresh-for-tests' : 'rotated-refresh-token');
      return Response.json({access_token:'private-access-token',token_type:'Bearer',expires_in:3600,scope:'user-top-read',refresh_token:'rotated-refresh-token'});
    }
    return Response.json({items:[]});
  };
  for(let i=0;i<2;i++) assert.equal((await createHandler(createArtistsLoader({vaultFactory:factory}))(request())).status,200);
  assert.doesNotMatch(lastCiphertext,/rotated-refresh-token|private-access-token/);
});

test('Odvolaný či vypršený refresh token zastaví obnovování i v nové instanci', async () => {
  credentials();
  const store=memoryStore();
  const factory=options=>createVault({...options,store});
  let calls=0;
  globalThis.fetch=async()=>{calls++;return Response.json({error:'invalid_grant',secret:'must-not-leak'},{status:400});};
  for(let i=0;i<2;i++) {
    const response=await createHandler(createArtistsLoader({vaultFactory:factory}))(request());
    assert.equal(response.status,503);
    assert.deepEqual(await response.json(),{error:'reauthorize'});
  }
  assert.equal(calls,1);
});

test('Současné instance sdílejí zámek při obnově Spotify', async () => {
  const map=new Map();let sequence=0;
  const store={
    async getWithMetadata(key) {return map.get(key)||null;},
    async setJSON(key,data,options) {
      const old=map.get(key);
      if(options.onlyIfNew && old || options.onlyIfMatch && old?.etag!==options.onlyIfMatch) return {modified:false};
      const etag=String(++sequence);map.set(key,{data,etag});return {modified:true,etag};
    },
  };
  const options={clientId:'client',secret:'secret',refreshToken:'refresh',store};
  const first=createVault(options),second=createVault(options);
  let release;const gate=new Promise(resolve=>{release=resolve;});
  const pending=first.run(async()=>{await gate;return 'done';});
  await new Promise(resolve=>setImmediate(resolve));
  await assert.rejects(second.run(async()=>assert.fail('Nesmí obnovovat současně.')),/unavailable/);
  release();assert.equal(await pending,'done');
  assert.equal(await second.run(async()=>true),true);
});

test('Odmítnuté oprávnění Spotify nerozbije nezávislý Steam', async () => {
  credentials();
  globalThis.fetch = async url => String(url).includes('steampowered')
    ? Response.json({ response: { game_count: 0 } }) : new Response('', { status: 403 });
  const responses = await Promise.all([(await fresh('top-artists'))(request()), (await fresh('top-games'))(request())]);
  assert.deepEqual(responses.map(response => response.status), [502, 200]);
});

test('Souběžné návštěvy sdílejí jeden dotaz a jiné metody nevolají službu', async () => {
  let calls = 0;
  const handler = createHandler(async () => { calls++; return { items: [] }; });
  assert.equal((await handler(new Request('https://example.test', { method: 'POST' }))).status, 405);
  assert.equal(calls, 0);
  const responses = await Promise.all([handler(request()), handler(request()), handler(request())]);
  assert.ok(responses.every(response => response.status === 200));
  assert.equal(calls, 1);
  assert.equal(await (await handler(new Request('https://example.test', { method: 'HEAD' }))).text(), '');
});
