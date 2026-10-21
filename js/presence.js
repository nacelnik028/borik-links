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
  const statusNames = { online: 'Online na Discordu', idle: 'Nečinný na Discordu', dnd: 'Nerušit', offline: 'Právě offline' };
  // Discord type 0 (Playing) zahrnuje i aplikace. Rozlišujeme jen přesné
  // známé názvy; neznámé aktivity neodhadujeme podle slov ani obrázků.
  const knownActivityKinds = new Map([
    ['Visual Studio Code', 'app'],
    ['Kingdom Come: Deliverance II', 'game'],
    ['Cyberpunk 2077', 'game'],
    ['RimWorld', 'game'],
  ]);
  const activityLabels = { 1: 'Právě streamuju', 3: 'Právě sleduju', 5: 'Právě soutěžím v' };
  function describeActivity(activity) {
    const kind = activity.type === 0 ? knownActivityKinds.get(activity.name) : null;
    if (kind === 'game') return { label: 'Právě hraju', icon: '🎮' };
    if (kind === 'app') return { label: 'Právě používám', icon: '💻' };
    return {
      label: activityLabels[activity.type] || 'Právě běží',
      icon: activity.type === 1 || activity.type === 3 ? '📺' : activity.type === 5 ? '🏆' : '◈',
    };
  }
  const savedOnline = storage.get('_lo');
  let lastOnline = savedOnline && Number.isFinite(Date.parse(savedOnline)) ? new Date(savedOnline) : null;
  let spotifyTimer, heartbeat, retryTimer, staleTimer, socket;
  let retry = 0, spotify = null, currentStatus = null;
  const formatTime = ms => {
    const seconds = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  };
  function updateLastSeen() {
    if (currentStatus !== 'offline' || !lastOnline) { $('lseen').textContent = ''; return; }
    const seconds = Math.max(0, Math.floor((Date.now() - lastOnline) / 1000));
    const value = seconds < 60 ? `${seconds} s` : seconds < 3600 ? `${Math.floor(seconds / 60)} min` : seconds < 86400 ? `${Math.floor(seconds / 3600)} h` : `${Math.floor(seconds / 86400)} d`;
    $('lseen').textContent = `Naposledy online před ${value}`;
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
    $('sp-card').closest('.music-panel').classList.remove('is-playing');
    $('presence-status').textContent = 'Živý stav je teď nedostupný'; $('sdot').className = 'sdot unknown'; $('lseen').textContent = '';
    $('sp-card').style.display = 'none'; $('sp-idle').style.display = '';
    $('sp-idle-title').textContent = 'Spotify není dostupné'; $('sp-idle-detail').textContent = 'Stav poslechu se teď nepodařilo načíst.';
    $('act-card').style.display = 'none'; $('act-idle').style.display = '';
    $('act-card').closest('.activity-panel').classList.remove('is-active');
    $('act-idle-title').textContent = 'Discord není dostupný'; $('act-idle-detail').textContent = 'Zkouším se znovu připojit.';
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
    if (currentStatus !== 'offline') { lastOnline = new Date(); storage.set('_lo', lastOnline.toISOString()); }
    updateLastSeen();
    const activity = data.activities?.find(item => item.type !== 2 && item.type !== 4);
    $('act-card').style.display = activity ? 'flex' : 'none'; $('act-idle').style.display = activity ? 'none' : '';
    $('act-card').closest('.activity-panel').classList.toggle('is-active', Boolean(activity));
    $('act-idle-title').textContent = 'Žádná aktivita'; $('act-idle-detail').textContent = 'Discord teď žádnou aktivitu neukazuje.';
    if (activity) {
      const presentation = describeActivity(activity);
      $('act-label').textContent = presentation.label; $('act-name').textContent = activity.name; $('act-name').title = activity.name;
      $('act-detail').textContent = activity.details || activity.state || '';
      const wrap = $('act-icon-wrap');
      const fallback = presentation.icon;
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
    $('sp-idle-title').textContent = 'Teď tu nic nehraje'; $('sp-idle-detail').textContent = 'Spotify teď žádný poslech neukazuje.';
    if (spotify) {
      $('sp-song').textContent = spotify.song; $('sp-song').title = spotify.song; $('sp-artist').textContent = spotify.artist;
      setImage($('sp-art'), spotify.album_art_url);
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
