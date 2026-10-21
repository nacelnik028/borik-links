/* Osobní žebříčky. Obsah se upravuje v config.js → topThree. */
(() => {
  'use strict';
  const container = document.getElementById('top-three-groups');
  const groups = Array.isArray(window.SITE_CONFIG.topThree) ? window.SITE_CONFIG.topThree : [];

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
  function createCard(entry, index, category) {
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
    if (title && typeof entry.image === 'string' && entry.image.trim()) {
      const image = document.createElement('img');
      image.className = 'favorite-image';
      image.alt = ''; // Název je hned vedle; čtečka jej nemusí opakovat.
      image.width = 48;
      image.height = 48;
      image.loading = 'lazy';
      image.decoding = 'async';
      if (entry.imageFit === 'contain') image.classList.add('favorite-image-contain');
      image.onerror = () => image.remove();
      image.src = entry.image;
      card.append(image);
    }
    const content = document.createElement('div');
    content.className = 'favorite-content';
    if (title && entry.category && entry.category !== category) {
      content.append(textElement('span', 'favorite-category', entry.category));
    }
    content.append(textElement('h4', 'favorite-title', title || 'Výběr už brzy.'));
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
  for (const [groupIndex, group] of groups.entries()) {
    const section = document.createElement('section');
    section.className = 'panel favorite-group';
    const heading = textElement('h3', 'favorite-group-heading', group.title);
    heading.id = `favorite-group-${groupIndex}`;
    section.setAttribute('aria-labelledby', heading.id);
    const list = document.createElement('ol');
    list.className = 'top-three-grid';
    list.setAttribute('role', 'list');
    const entries = Array.isArray(group.items) ? group.items : [];
    for (let index = 0; index < 3; index++) {
      list.append(createCard(entries[index] || {}, index, group.category));
    }
    section.append(heading, list);
    container.append(section);
  }
})();
