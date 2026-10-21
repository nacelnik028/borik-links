/* Obsah, motivy a ovládání stránky. Texty upravuj v ../config.js. */
(() => {
  'use strict';
  const config = window.SITE_CONFIG;
  const $ = id => document.getElementById(id);
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* Úložiště může být blokované. */ } },
  };
  window.siteStorage = storage;
  $('greeting').textContent = config.greeting;
  $('tagline').textContent = config.tagline;
  $('av-fb').textContent = config.name.charAt(0);
  $('av').alt = `${config.name} – Discord avatar`;
  document.title = `${config.name.toLocaleLowerCase('cs')} · můj kout internetu`;
  document.querySelector('meta[name="description"]').content = `${config.name} · ${config.tagline}`;

  // Obsah konfigurace se vkládá jako text, nikoliv jako HTML.
  const [year, month, day] = config.birthday.split('-').map(Number);
  const now = new Date();
  let age = now.getFullYear() - year;
  if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) age--;
  $('bio').replaceChildren();
  for (const paragraph of config.bio.replaceAll('{age}', String(age)).split(/\n\s*\n/).filter(text => text.trim())) {
    const p = document.createElement('p');
    paragraph.trim().split(/(\*\*[^*]+\*\*)/g).forEach(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const strong = document.createElement('strong');
        strong.textContent = part.slice(2, -2);
        p.append(strong);
      } else p.append(document.createTextNode(part));
    });
    $('bio').append(p);
  }
  for (const interest of config.interests) {
    const tag = document.createElement('span');
    tag.className = 'interest-tag';
    tag.textContent = interest;
    $('interests').append(tag);
  }

  const themes = ['violet', 'aurora', 'sunset'];
  function setTheme(theme) {
    if (!themes.includes(theme)) theme = 'violet';
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
    storage.set('borik-theme', theme);
  }
  setTheme(storage.get('borik-theme') || config.defaultTheme);
  document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => setTheme(button.dataset.themeChoice)));
  let toastTimer;
  function toast(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3500);
  }
  const dialog = $('command-dialog');
  document.querySelectorAll('[data-open-menu]').forEach(button => button.addEventListener('click', () => dialog.showModal()));
  $('close-menu').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  document.querySelectorAll('[data-close-menu]').forEach(link => link.addEventListener('click', () => dialog.close()));
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (dialog.open) dialog.close(); else dialog.showModal();
    }
  });
  $('cycle-theme').addEventListener('click', () => {
    const next = themes[(themes.indexOf(document.documentElement.dataset.theme) + 1) % themes.length];
    setTheme(next); dialog.close();
    toast(`Barevný motiv: ${next.charAt(0).toUpperCase() + next.slice(1)}`);
  });
  document.querySelectorAll('[data-copy-discord]').forEach(button => button.addEventListener('click', async () => {
    dialog.close();
    try { await navigator.clipboard.writeText(config.discordUsername); toast(`Discord zkopírován: ${config.discordUsername}`); }
    catch { window.prompt('Zkopíruj moje Discord jméno:', config.discordUsername); }
  }));

  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let userCalm = storage.get('borik-calm') === 'true';
  function updateMotion() {
    window.siteCalm = media.matches || userCalm;
    document.documentElement.classList.toggle('calm', window.siteCalm);
    $('motion-toggle').setAttribute('aria-pressed', String(window.siteCalm));
    $('motion-toggle').textContent = window.siteCalm ? '◌ Klidný režim zapnutý' : '◌ Klidný režim';
    window.dispatchEvent(new Event('motionchange'));
  }
  updateMotion(); media.addEventListener('change', updateMotion);
  $('motion-toggle').addEventListener('click', () => {
    if (media.matches) { toast('Omezení animací je zapnuté v nastavení tvého zařízení.'); return; }
    userCalm = !userCalm; storage.set('borik-calm', String(userCalm)); updateMotion();
  });
  const phrases = config.rotatingNames.filter(name => typeof name === 'string' && name.trim());
  if (!phrases.length) phrases.push(config.name);
  let phrase = 0, character = phrases[0].length, deleting = true, typingTimer;
  const typed = $('typed');
  const nameLine = typed.parentElement;
  $('hero-heading').setAttribute('aria-label', `${config.greeting} ${config.name}`);
  nameLine.setAttribute('aria-hidden', 'true');
  function renderName() {
    typed.textContent = phrases[phrase].slice(0, character);
    nameLine.classList.toggle('long-name', phrases[phrase].length > 7);
  }
  function tick() {
    if (window.siteCalm || document.hidden) return;
    character += deleting ? -1 : 1; renderName();
    let delay = deleting ? 45 : 95;
    if (character >= phrases[phrase].length) { deleting = true; delay = 2500; }
    if (character <= 0) { deleting = false; phrase = (phrase + 1) % phrases.length; delay = 350; }
    typingTimer = setTimeout(tick, delay);
  }
  function restartTyping() {
    clearTimeout(typingTimer);
    if (window.siteCalm) { phrase = 0; character = phrases[0].length; deleting = true; renderName(); }
    else if (!document.hidden) typingTimer = setTimeout(tick, 2400);
  }
  renderName(); restartTyping();
  window.addEventListener('motionchange', restartTyping);
  document.addEventListener('visibilitychange', restartTyping);
  const clockFormat = new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', hour: '2-digit', minute: '2-digit', hour12: false });
  let clockTimer;
  function updateClock() {
    clearTimeout(clockTimer);
    $('local-time').textContent = `${clockFormat.format(new Date())} · MŮJ ČAS`;
    // Každý další termín odvozujeme od skutečného času, aby se zpoždění nesčítalo.
    if (!document.hidden) clockTimer = setTimeout(updateClock, 60_000 - Date.now() % 60_000);
  }
  updateClock();
  document.addEventListener('visibilitychange', updateClock);
  window.addEventListener('pageshow', updateClock);
})();
