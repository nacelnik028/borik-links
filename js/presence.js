/* Živý profil přes Lanyard: Discord, Spotify a herní aktivita. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const storage = window.siteStorage;
  const statusNames = { online: 'Online na Discordu', idle: 'Právě někde pryč', dnd: 'Nerušit. Jsem ve svém světě.', offline: 'Právě offline' };
  const activityLabels = { 0: 'aktuálně hraju', 1: 'streamuje', 3: 'sleduje', 5: 'soutěží v' };
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
    if (currentStatus !== 'offline') { lastOnline = new Date(); storage.set('_lo', lastOnline.toISOString()); }
    updateLastSeen();
    const activity = data.activities?.find(item => item.type !== 2 && item.type !== 4);
    $('act-card').style.display = activity ? 'flex' : 'none'; $('act-idle').style.display = activity ? 'none' : '';
    $('act-idle-title').textContent = 'Mezi dvěma světy.'; $('act-idle-detail').textContent = 'Zrovna nic nehraju.';
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
