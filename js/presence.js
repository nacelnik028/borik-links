/* Živý profil přes Lanyard: Discord, Spotify a herní aktivita. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const storage = window.siteStorage;
  // Dekorativní vizualizace poslechu; Lanyard neposkytuje zvuková data.
  const wave = document.querySelector('.sound-wave');
  for (let index = 0; index < 48; index++) {
    const bar = document.createElement('i');
    const envelope = Math.sin(Math.PI * (index + 1) / 49);
    bar.style.setProperty('--bar-height', `${5 + envelope * (8 + 9 * Math.abs(Math.sin(index * 1.7)))}px`);
    bar.style.setProperty('--bar-duration', `${1.1 + (index % 7) * .17}s`);
    bar.style.setProperty('--bar-delay', `${-index * .19}s`);
    wave.append(bar);
  }
  function updateAnimationVisibility() {
    document.documentElement.classList.toggle('presence-paused', document.hidden);
  }
  document.addEventListener('visibilitychange', updateAnimationVisibility);
  updateAnimationVisibility();
  const statusNames = { online: 'Online na Discordu', idle: 'Právě někde pryč', dnd: 'Nerušit. Jsem ve svém světě.', offline: 'Právě offline' };
  const tileNames = { online: 'Online', idle: 'Někde pryč', dnd: 'Nerušit', offline: 'Offline' };
  const tileNotes = { online: 'Jsem na Discordu. Klidně napiš.', idle: 'Discord běží, já zrovna ne.', dnd: 'Soustředím se. Ozvu se později.', offline: 'Zrovna tu nejsem.' };
  const activityLabels = { 0: 'aktuálně hraju', 1: 'streamuje', 3: 'sleduje', 5: 'soutěží v' };
  const savedOnline = storage.get('_lo');
  let lastOnline = savedOnline && Number.isFinite(Date.parse(savedOnline)) ? new Date(savedOnline) : null;
  let spotifyTimer, heartbeat, retryTimer, staleTimer, socket;
  let retry = 0, spotify = null, currentStatus = null;
  const root = document.documentElement;
  const ticker = (key, text) => window.siteTicker?.set(key, text);
  // Naladění webu: akcent se vezme z obalu alba. Když obrázek nejde přečíst (CORS), použije se zelená.
  let tunedArt = null;
  let tuneEnabled = storage.get('borik-tune') !== 'off';
  const tuneButtons = document.querySelectorAll('[data-tune-toggle]');
  const syncTuneButtons = () => tuneButtons.forEach(button => button.setAttribute('aria-pressed', String(tuneEnabled)));
  function hslToRgb(h, s, l) {
    const f = n => { const k = (n + h * 12) % 12; return Math.round(255 * (l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
    return [f(0), f(8), f(4)];
  }
  function swapColors(change, instant) {
    if (!instant && document.startViewTransition && !window.siteCalm && !document.hidden) document.startViewTransition(change);
    else change();
  }
  function applyTune(hue, saturation) {
    swapColors(() => {
      // Světlost je pevná, aby text v barvě akcentu držel kontrast na tmavém pozadí.
      const accent = hslToRgb(hue, Math.max(.5, Math.min(.9, saturation)), .76);
      const secondary = hslToRgb((hue + .09) % 1, .55, .64);
      root.style.setProperty('--accent', `rgb(${accent.join(', ')})`); root.style.setProperty('--accent-rgb', accent.join(', '));
      root.style.setProperty('--secondary', `rgb(${secondary.join(', ')})`); root.style.setProperty('--secondary-rgb', secondary.join(', '));
      root.classList.add('is-tuned');
      window.dispatchEvent(new Event('themechange'));
    });
  }
  // Bez použitelné barvy (šedý obal, obrázek nejde přečíst) zůstává motiv, který si návštěvník vybral.
  function dropTune(instant) {
    if (!root.classList.contains('is-tuned')) return;
    swapColors(() => {
      ['--accent', '--accent-rgb', '--secondary', '--secondary-rgb'].forEach(name => root.style.removeProperty(name));
      root.classList.remove('is-tuned');
      window.dispatchEvent(new Event('themechange'));
    }, instant);
  }
  function clearTune(instant) { tunedArt = null; dropTune(instant); }
  function tuneFromArt(source) {
    if (!tuneEnabled || !source || source === tunedArt) return;
    tunedArt = source;
    const probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.onerror = () => { if (tunedArt === source) dropTune(); };
    probe.onload = () => {
      if (tunedArt !== source) return;
      try {
        const size = 24, sampler = document.createElement('canvas');
        sampler.width = sampler.height = size;
        const context = sampler.getContext('2d', { willReadFrequently: true });
        context.drawImage(probe, 0, 0, size, size);
        const pixels = context.getImageData(0, 0, size, size).data;
        // Vyhrává nejsytější odstín; šedé a příliš tmavé nebo světlé body skoro nepočítají.
        const buckets = Array.from({ length: 12 }, () => ({ weight: 0, x: 0, y: 0, saturation: 0 }));
        for (let index = 0; index < pixels.length; index += 4) {
          const r = pixels[index] / 255, g = pixels[index + 1] / 255, b = pixels[index + 2] / 255;
          const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min, light = (max + min) / 2;
          if (delta < .08) continue;
          const saturation = delta / (1 - Math.abs(2 * light - 1) || 1);
          let hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
          hue = (hue / 6 + 1) % 1;
          const weight = saturation * Math.max(0, 1 - Math.abs(light - .5) * 1.7);
          const bucket = buckets[Math.floor(hue * 12) % 12];
          bucket.weight += weight; bucket.saturation += saturation * weight;
          bucket.x += Math.cos(hue * Math.PI * 2) * weight; bucket.y += Math.sin(hue * Math.PI * 2) * weight;
        }
        const best = buckets.reduce((a, b) => b.weight > a.weight ? b : a);
        if (best.weight < 6) { dropTune(); return; }
        applyTune((Math.atan2(best.y, best.x) / (Math.PI * 2) + 1) % 1, best.saturation / best.weight);
      } catch { dropTune(); }
    };
    // Samostatná adresa: stejný obal načtený bez CORS do <img> by se jinak vrátil z cache a nešel by přečíst.
    probe.src = `${source}${source.includes('?') ? '&' : '?'}tune=1`;
  }
  window.siteTune = {
    get enabled() { return tuneEnabled; },
    // persist = false platí jen do konce návštěvy (ruční volba motivu), jinak se volba uloží.
    set(on, instant, persist = true) {
      tuneEnabled = Boolean(on); if (persist) storage.set('borik-tune', tuneEnabled ? 'on' : 'off'); syncTuneButtons();
      if (!tuneEnabled) clearTune(instant); else if (spotify) tuneFromArt(spotify.album_art_url);
    },
    toggle() {
      this.set(!tuneEnabled);
      window.siteActions?.toast(tuneEnabled ? 'Barvy se ladí podle hudby. Když něco hraje, web si vezme barvu z obalu.' : 'Barvy podle hudby jsou vypnuté. Platí vybraný motiv.');
    },
  };
  tuneButtons.forEach(button => button.addEventListener('click', () => window.siteTune.toggle()));
  syncTuneButtons();
  const formatTime = ms => {
    const seconds = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  };
  function updateLastSeen() {
    if (currentStatus !== 'offline' || !lastOnline) {
      $('lseen').textContent = '';
      if (currentStatus === 'offline') $('online-note').textContent = 'Poslední signál tenhle prohlížeč nezachytil.';
      return;
    }
    const seconds = Math.max(0, Math.floor((Date.now() - lastOnline) / 1000));
    const value = seconds < 60 ? `${seconds} s` : seconds < 3600 ? `${Math.floor(seconds / 60)} min` : seconds < 86400 ? `${Math.floor(seconds / 3600)} h` : `${Math.floor(seconds / 86400)} d`;
    $('lseen').textContent = `Naposledy online před ${value}`;
    $('online-note').textContent = `Naposledy online před ${value}.`;
  }
  function updateProgress() {
    if (!spotify) return;
    const duration = spotify.timestamps.end - spotify.timestamps.start;
    const elapsed = Math.max(0, Math.min(Date.now() - spotify.timestamps.start, duration));
    $('sp-fill').style.width = `${duration > 0 ? elapsed / duration * 100 : 0}%`;
    $('sp-el').textContent = formatTime(elapsed); $('sp-tot').textContent = formatTime(duration);
  }
  function setImage(element, source, fallback) {
    if (!source || element.getAttribute('src') === source) return;
    element.onload = () => { element.classList.add('on'); if (fallback) fallback.classList.add('gone'); };
    element.onerror = () => { element.classList.remove('on'); if (fallback) fallback.classList.remove('gone'); };
    element.src = source;
  }
  function activityImage(activity) {
    const image = activity.assets?.large_image;
    if (image?.startsWith('mp:external/')) return `https://media.discordapp.net/external/${image.slice(12)}`;
    if (image && activity.application_id) return `https://cdn.discordapp.com/app-assets/${encodeURIComponent(activity.application_id)}/${encodeURIComponent(image)}.png`;
    if (activity.application_id) return `https://dcdn.dstn.to/app-icons/${encodeURIComponent(activity.application_id)}`;
    return null;
  }
  function showUnavailable() {
    clearInterval(spotifyTimer); spotify = null; currentStatus = null;
    clearTune(); ticker('status', 'signál hledám'); ticker('game', ''); ticker('music', '');
    $('online-dot').className = 'sdot unknown tile-sdot'; $('online-value').textContent = 'Bez signálu'; $('online-note').textContent = 'Zkouším se znovu spojit.';
    $('sp-card').closest('.music-panel').classList.remove('is-playing');
    $('presence-status').textContent = 'Živý stav je teď nedostupný'; $('sdot').className = 'sdot unknown'; $('lseen').textContent = '';
    $('sp-card').style.display = 'none'; $('sp-idle').style.display = '';
    $('sp-idle-title').textContent = 'Malá pauza v signálu.'; $('sp-idle-detail').textContent = 'Spotify stav se teď nepodařilo načíst.';
    $('act-card').style.display = 'none'; $('act-idle').style.display = '';
    $('act-idle-title').textContent = 'Signál na cestě.'; $('act-idle-detail').textContent = 'Zkouším znovu připojit Discord.';
  }
  function applyPresence(data) {
    clearTimeout(staleTimer); retry = 0;
    const user = data.discord_user;
    currentStatus = data.discord_status || 'offline';
    $('presence-status').textContent = statusNames[currentStatus] || statusNames.offline;
    $('sdot').className = `sdot ${Object.hasOwn(statusNames, currentStatus) ? currentStatus : 'offline'}`;
    if (user?.avatar) {
      const extension = user.avatar.startsWith('a_') ? 'gif' : 'png';
      setImage($('av'), `https://cdn.discordapp.com/avatars/${encodeURIComponent(user.id)}/${encodeURIComponent(user.avatar)}.${extension}?size=256`, $('av-fb'));
    }
    const knownStatus = Object.hasOwn(statusNames, currentStatus) ? currentStatus : 'offline';
    $('online-dot').className = `sdot ${knownStatus} tile-sdot`;
    $('online-value').textContent = tileNames[knownStatus];
    $('online-note').textContent = tileNotes[knownStatus];
    ticker('status', tileNames[knownStatus].toLocaleLowerCase('cs'));
    if (currentStatus !== 'offline') { lastOnline = new Date(); storage.set('_lo', lastOnline.toISOString()); }
    updateLastSeen();
    const activity = data.activities?.find(item => item.type !== 2 && item.type !== 4);
    $('act-card').style.display = activity ? 'flex' : 'none'; $('act-idle').style.display = activity ? 'none' : '';
    $('act-idle-title').textContent = 'Mezi dvěma světy.'; $('act-idle-detail').textContent = 'Zrovna nic nehraju.';
    ticker('game', activity ? `${activity.type === 0 ? 'hraju' : activityLabels[activity.type] || 'dělám'} ${activity.name}` : '');
    if (activity) {
      $('act-label').textContent = activityLabels[activity.type] || 'aktuálně'; $('act-name').textContent = activity.name; $('act-name').title = activity.name;
      $('act-detail').textContent = activity.details || activity.state || '';
      const wrap = $('act-icon-wrap');
      const fallback = activity.type === 3 ? '📺' : activity.type === 5 ? '🏆' : '🎮';
      wrap.textContent = fallback;
      const source = activityImage(activity);
      if (source) {
        const image = document.createElement('img'); image.className = 'act-thumb'; image.alt = '';
        image.onerror = () => { wrap.textContent = fallback; }; image.src = source; wrap.replaceChildren(image);
      }
    }
    clearInterval(spotifyTimer);
    spotify = data.spotify?.timestamps ? data.spotify : null;
    $('sp-card').closest('.music-panel').classList.toggle('is-playing', Boolean(spotify));
    $('sp-card').style.display = spotify ? 'block' : 'none'; $('sp-idle').style.display = spotify ? 'none' : '';
    $('sp-idle-title').textContent = 'Chvilka ticha.'; $('sp-idle-detail').textContent = 'Zrovna nic neposlouchám.';
    if (!spotify) { clearTune(); ticker('music', ''); }
    if (spotify) {
      $('sp-song').textContent = spotify.song; $('sp-song').title = spotify.song; $('sp-artist').textContent = spotify.artist;
      setImage($('sp-art'), spotify.album_art_url);
      tuneFromArt(spotify.album_art_url);
      $('sp-backdrop').style.backgroundImage = `url("${encodeURI(spotify.album_art_url)}")`;
      ticker('music', `poslouchám ${spotify.song}`);
      $('sp-link').hidden = !spotify.track_id;
      if (spotify.track_id) $('sp-link').href = `https://open.spotify.com/track/${encodeURIComponent(spotify.track_id)}`;
      updateProgress(); spotifyTimer = setInterval(updateProgress, 1000);
    }
  }
  function connect() {
    clearTimeout(retryTimer); clearTimeout(staleTimer);
    socket = new WebSocket('wss://api.lanyard.rest/socket');
    staleTimer = setTimeout(() => { showUnavailable(); socket.close(); }, 12_000);
    socket.onmessage = event => {
      let payload;
      try { payload = JSON.parse(event.data); } catch { return; }
      if (payload.op === 1) {
        clearInterval(heartbeat);
        heartbeat = setInterval(() => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ op: 3 })); }, payload.d.heartbeat_interval);
        socket.send(JSON.stringify({ op: 2, d: { subscribe_to_id: window.SITE_CONFIG.discordId } }));
      }
      if (payload.op === 0 && payload.d) applyPresence(payload.d);
    };
    socket.onclose = () => {
      clearInterval(heartbeat); clearTimeout(staleTimer); showUnavailable();
      retryTimer = setTimeout(connect, Math.min(3000 * 2 ** retry++, 30_000));
    };
    socket.onerror = () => socket.close();
  }
  connect(); setInterval(updateLastSeen, 60_000);
})();
