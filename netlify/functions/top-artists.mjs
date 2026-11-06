import { createHandler, fetchJSON, SourceError } from '../lib/response.mjs';
import { createVault } from '../lib/spotify-vault.mjs';

export function createArtistsLoader({ vaultFactory = createVault } = {}) {
  let accessToken, tokenExpiresAt = 0, vault;
  return async () => {
    const { SPOTIFY_CLIENT_ID: clientId, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: refreshToken } = process.env;
    if (!/^[a-f\d]{32}$/i.test(clientId || '') || !/^[a-f\d]{32}$/i.test(secret || '')
      || !/^[\w.~+/=-]+$/.test(refreshToken || '')) throw new SourceError('not_configured', 503);
    const period = process.env.SPOTIFY_TIME_RANGE || 'short_term';
    if (!['short_term', 'medium_term', 'long_term'].includes(period)) throw new SourceError('not_configured', 503);
    vault ||= vaultFactory({ clientId, secret, refreshToken });
    if (!accessToken || Date.now() >= tokenExpiresAt) {
      await vault.run(async () => {
        const currentRefreshToken = await vault.read();
        let token;
        try {
          token = await fetchJSON('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: currentRefreshToken }),
          });
        } catch (error) {
          if (error instanceof SourceError && error.code === 'reauthorize') await vault.disable();
          throw error;
        }
        if (typeof token.scope !== 'string' || token.scope.trim() !== 'user-top-read') {
          await vault.disable();
          throw new SourceError('not_configured', 503, 3600);
        }
        if (typeof token.access_token !== 'string' || !/^[\w.~+/=-]+$/.test(token.access_token)
          || token.token_type?.toLowerCase() !== 'bearer' || !Number.isSafeInteger(token.expires_in)
          || token.expires_in <= 60 || token.expires_in > 86400) throw new SourceError('unavailable');
        if (token.refresh_token !== undefined) {
          if (typeof token.refresh_token !== 'string' || !/^[\w.~+/=-]+$/.test(token.refresh_token)) throw new SourceError('unavailable');
          await vault.save(token.refresh_token);
        }
        accessToken = token.access_token;
        tokenExpiresAt = Date.now() + (token.expires_in - 60) * 1000;
      });
    }
    let data;
    try {
      data = await fetchJSON(`https://api.spotify.com/v1/me/top/artists?limit=3&time_range=${period}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (error) { accessToken = null; throw error; }
    if (!Array.isArray(data?.items) || data.items.length > 3) throw new SourceError('unavailable');
    const ids = new Set();
    const items = data.items.map(artist => {
      if (!artist || typeof artist.name !== 'string' || !artist.name.trim() || artist.name.length > 300
        || typeof artist.id !== 'string' || !/^[a-z\d]{22}$/i.test(artist.id) || ids.has(artist.id)) throw new SourceError('unavailable');
      ids.add(artist.id);
      const image = Array.isArray(artist.images) ? artist.images.find(entry => typeof entry?.url === 'string'
        && /^https:\/\/i\.scdn\.co\/image\/[a-z\d]+$/i.test(entry.url))?.url : undefined;
      return { title: artist.name.trim(), url: `https://open.spotify.com/artist/${artist.id}`, ...(image ? { image } : {}) };
    });
    return { source: 'spotify', period, items };
  };
}

export default createHandler(createArtistsLoader());
