/* Pouze skutečné žebříčky z Netlify a jejich poslední použitelný výsledek. */
(() => {
  'use strict';
  const container = document.getElementById('top-three-groups');
  if (!container) return;
  const groups = Array.isArray(window.SITE_CONFIG.topThree) ? window.SITE_CONFIG.topThree : [];
  const sources = {
    steam: { endpoint: '/.netlify/functions/top-games', periods: { all_time: 'Steam · celkový odehraný čas' } },
    spotify: { endpoint: '/.netlify/functions/top-artists', periods: {
      short_term: 'Spotify · přibližně poslední 4 týdny', medium_term: 'Spotify · přibližně posledních 6 měsíců', long_term: 'Spotify · přibližně poslední rok',
    } },
  };
  const refreshInterval = 15 * 60 * 1000;
  const cacheLifetime = 7 * 24 * 60 * 60 * 1000;
  const canFetch = ['http:', 'https:'].includes(location.protocol);
  const liveGroups = [];

  function textElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
  }
  function externalLink(value) {
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }
  function createCard(entry, index, category, pendingText = 'Načítám…') {
    const title = typeof entry.title === 'string' ? entry.title.trim() : '';
    const url = title ? externalLink(entry.url) : null;
    const item = document.createElement('li');
    item.className = 'top-three-item';
    const card = document.createElement(url ? 'a' : 'article');
    card.className = `favorite-card${title ? '' : ' favorite-pending'}`;
    if (url) {
      card.href = url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    }
    const rank = textElement('span', 'favorite-rank', String(index + 1).padStart(2, '0'));
    rank.setAttribute('aria-hidden', 'true');
    card.append(rank);
    const artwork = entry.appId
      ? `https://shared.steamstatic.com/store_item_assets/steam/apps/${entry.appId}/library_600x900.jpg` : '';
    if (title && (artwork || entry.image)) {
      const image = document.createElement('img');
      image.className = 'favorite-image';
      image.alt = ''; // Název je hned vedle; čtečka jej nemusí opakovat.
      image.width = 48;
      image.height = 48;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.onerror = () => {
        if (!artwork || !entry.image) {
          image.remove();
          return;
        }
        image.onerror = () => image.remove();
        image.src = entry.image;
      };
      image.src = artwork || entry.image;
      card.append(image);
    }
    const content = document.createElement('div');
    content.className = 'favorite-content';
    if (title && entry.category && entry.category !== category) {
      content.append(textElement('span', 'favorite-category', entry.category));
    }
    content.append(textElement('h4', 'favorite-title', title || pendingText));
    if (entry.description && title) content.append(textElement('p', 'favorite-description', entry.description));
    if (url) {
      const host = new URL(url).hostname;
      const destination = host === 'store.steampowered.com' ? 'Steam' : host === 'open.spotify.com' ? 'Spotify' : 'Otevřít';
      const hint = textElement('span', 'favorite-link', `${destination} ↗`);
      content.append(hint);
    }
    card.append(content);
    item.append(card);
    return item;
  }

  function normalizePayload(value, source) {
    if (!value || value.source !== source || !Object.hasOwn(sources[source].periods, value.period)
      || !Array.isArray(value.items) || value.items.length > 3) return null;
    const timestamp = Date.parse(value.updatedAt);
    if (!Number.isFinite(timestamp) || timestamp > Date.now() + 300000 || Date.now() - timestamp > cacheLifetime) return null;
    const items = [], urls = new Set();
    const pattern = source === 'steam' ? /^https:\/\/store\.steampowered\.com\/app\/(\d+)\/$/
      : /^https:\/\/open\.spotify\.com\/artist\/[a-zA-Z0-9]{22}$/;
    for (const item of value.items) {
      if (!item || typeof item.title !== 'string' || !item.title.trim() || item.title.length > 300) return null;
      const url = externalLink(item.url);
      const linkMatch = url && pattern.exec(url);
      if (!linkMatch || urls.has(url)) return null;
      urls.add(url);
      if (source === 'steam' && (!Number.isSafeInteger(item.minutes) || item.minutes <= 0
        || (items.length && item.minutes > items[items.length - 1].minutes))) return null;
      const appId = linkMatch[1];
      const image = typeof item.image === 'string' && (appId
        ? /^https:\/\/media\.steampowered\.com\/steamcommunity\/public\/images\/apps\/(\d+)\/[a-f\d]{40}\.jpg$/i.exec(item.image)?.[1] === appId
        : /^https:\/\/i\.scdn\.co\/image\/[a-z\d]+$/i.test(item.image)) ? item.image : '';
      items.push({ title: item.title, url,
        ...(appId ? { appId, minutes: item.minutes,
          description: `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 }).format(item.minutes / 60)} h celkem` } : {}),
        image,
      });
    }
    return { source, period: value.period, updatedAt: new Date(timestamp).toISOString(), items };
  }

  function ageText(timestamp) {
    const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(timestamp)) / 60000));
    if (minutes < 1) return 'načteno právě teď';
    if (minutes < 60) return `stáří ${minutes} min`;
    if (minutes < 1440) return `stáří ${Math.floor(minutes / 60)} h`;
    return `stáří ${Math.floor(minutes / 1440)} d`;
  }
  function updateNote(state) {
    const { payload, mode } = state.view;
    const period = payload ? sources[state.source].periods[payload.period] : '';
    const loadedAt = payload ? `Načteno: ${new Date(payload.updatedAt).toLocaleString('cs-CZ')}` : '';
    if (payload) state.heading.title = `${period} · ${loadedAt}`;
    else state.heading.removeAttribute('title');

    if (mode === 'fresh' || mode === 'loading') {
      state.note?.remove();
      state.note = null;
      state.section.classList.remove('has-statistics');
      return;
    }
    if (!state.note) {
      state.note = textElement('p', 'favorite-group-note', '');
      state.note.setAttribute('role', 'status');
      state.list.before(state.note);
      state.section.classList.add('has-statistics');
    }
    const service = state.source === 'steam' ? 'Steam' : 'Spotify';
    state.note.textContent = payload ? `${period} · uložené údaje · ${ageText(payload.updatedAt)}`
      : `${service} · statistiky nejsou dostupné`;
    if (payload) state.note.title = loadedAt;
    else state.note.removeAttribute('title');
  }
  function showStatistics(state, payload, mode) {
    if (payload && !normalizePayload(payload, state.source)) { payload = null; mode = 'unavailable'; }
    // Aktualizace neodebere odkaz, který právě někdo ovládá klávesnicí.
    if (state.list.contains(document.activeElement)) {
      state.pending = { payload, mode };
      return;
    }
    state.pending = null;
    state.view = { payload, mode };
    updateNote(state);
    state.list.setAttribute('aria-busy', String(mode === 'loading'));
    let cards;
    if (payload?.items.length) cards = payload.items.map((item, index) => createCard(item, index, state.group.category));
    else if (mode === 'loading') cards = Array.from({ length: 3 }, (_, index) => createCard({}, index, state.group.category));
    else cards = [textElement('li', 'favorite-status', payload ? 'Zatím není dost údajů pro žebříček.' : 'Statistiky teď nelze načíst. Zkus to prosím později.')];
    state.list.replaceChildren(...cards);
  }

  async function refresh(state) {
    if (state.loading || document.hidden || Date.now() - state.lastCheck < refreshInterval) return;
    state.loading = true;
    state.lastCheck = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(sources[state.source].endpoint, { signal: controller.signal, credentials: 'omit', cache: 'no-store', redirect: 'error' });
      if (!response.ok) {
        const retry = Number(response.headers.get('Retry-After'));
        if (Number.isFinite(retry) && retry > 0) state.lastCheck = Math.max(state.lastCheck, Date.now() + Math.min(retry * 1000, 3600000) - refreshInterval);
        throw new Error('Zdroj není dostupný.');
      }
      const payload = normalizePayload(await response.json(), state.source);
      if (!payload) throw new Error('Neplatná odpověď.');
      state.latest = payload;
      window.siteStorage?.set(state.cacheKey, JSON.stringify(payload));
      showStatistics(state, payload, 'fresh');
    } catch {
      if (state.latest && Date.now() - Date.parse(state.latest.updatedAt) <= cacheLifetime) {
        showStatistics(state, state.latest, 'saved');
      } else {
        state.latest = null;
        showStatistics(state, null, 'unavailable');
      }
    } finally {
      clearTimeout(timeout);
      state.loading = false;
    }
  }
  for (const [groupIndex, group] of groups.entries()) {
    if (!Object.hasOwn(sources, group.source)) continue;
    const section = document.createElement('section');
    section.className = 'panel favorite-group';
    const heading = textElement('h3', 'favorite-group-heading', group.title);
    heading.id = `favorite-group-${groupIndex}`;
    section.setAttribute('aria-labelledby', heading.id);
    const list = document.createElement('ol');
    list.className = 'top-three-grid';
    list.setAttribute('role', 'list');
    section.append(heading, list);
    const state = { group, source: group.source, section, heading, list, note: null, lastCheck: 0,
      cacheKey: `borik-top-three-v2-${group.source}`, loading: false, latest: null, pending: null, view: null };
    try {
      state.latest = normalizePayload(JSON.parse(window.siteStorage?.get(state.cacheKey) || 'null'), state.source);
    } catch { /* Poškozená nebo zablokovaná cache nemá bránit načtení webu. */ }
    showStatistics(state, null, canFetch ? 'loading' : 'unavailable');
    list.addEventListener('focusout', () => setTimeout(() => {
      if (state.pending) showStatistics(state, state.pending.payload, state.pending.mode);
    }, 0));
    liveGroups.push(state);
    container.append(section);
  }
  if (canFetch && liveGroups.length) {
    liveGroups.forEach(refresh);
    setInterval(() => {
      if (document.hidden) return;
      liveGroups.forEach(state => {
        if (state.view.payload && Date.now() - Date.parse(state.view.payload.updatedAt) > cacheLifetime) {
          state.latest = null;
          showStatistics(state, null, 'unavailable');
        } else if (state.view.mode === 'saved') updateNote(state);
        refresh(state);
      });
    }, 60000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) liveGroups.forEach(refresh);
    });
  }
})();
