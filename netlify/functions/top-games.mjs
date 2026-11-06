import { createHandler, fetchJSON, SourceError } from '../lib/response.mjs';

async function loadGames() {
  const { STEAM_API_KEY: key, STEAM_ID: steamId } = process.env;
  if (!/^[a-f\d]{32}$/i.test(key || '') || !/^\d{17}$/.test(steamId || '')) throw new SourceError('not_configured', 503);
  const url = new URL('https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/');
  url.search = new URLSearchParams({ key, steamid: steamId, include_appinfo: '1', include_played_free_games: '1' });
  const data = await fetchJSON(url);
  const library = data?.response;
  // Soukromá knihovna se nesmí tvářit jako prázdný veřejný žebříček.
  if (!library || (!Array.isArray(library.games) && library.game_count !== 0)
    || (library.game_count !== undefined && (!Number.isSafeInteger(library.game_count) || library.game_count < 0))) throw new SourceError('unavailable');
  const games = library.games || [];
  const ids = new Set();
  for (const game of games) {
    if (!game || typeof game.name !== 'string' || !game.name.trim() || game.name.length > 300
      || !Number.isSafeInteger(game.appid) || game.appid <= 0 || game.appid > 4294967295 || ids.has(game.appid)
      || !Number.isSafeInteger(game.playtime_forever) || game.playtime_forever < 0) throw new SourceError('unavailable');
    ids.add(game.appid);
  }
  const hours = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });
  const items = games.filter(game => game.playtime_forever > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever || a.appid - b.appid)
    .slice(0, 3).map(game => ({
      title: game.name.trim(),
      description: `${hours.format(game.playtime_forever / 60)} h celkem`,
      minutes: game.playtime_forever,
      url: `https://store.steampowered.com/app/${game.appid}/`,
      ...(/^[a-fA-F0-9]{40}$/.test(game.img_icon_url || '') ? {
        image: `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`,
      } : {}),
    }));
  return { source: 'steam', period: 'all_time', items };
}

export default createHandler(loadGames);
