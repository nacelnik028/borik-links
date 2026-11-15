/* Obsah, motivy a ovládání stránky. Texty upravuj v ../config.js. */
(() => {
  'use strict';
  const config = window.SITE_CONFIG;
  const root = document.documentElement;
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

  // Dlaždice věku: roky, dny od posledních narozenin a postup k dalším.
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastBirthday = new Date(year + age, month - 1, day);
  const nextBirthday = new Date(year + age + 1, month - 1, day);
  const dayMs = 86_400_000;
  const daysSince = Math.max(0, Math.round((today - lastBirthday) / dayMs));
  const daysLeft = Math.max(0, Math.round((nextBirthday - today) / dayMs));
  const plural = (count, one, few, many) => count === 1 ? one : count >= 2 && count <= 4 ? few : many;
  $('age-years').textContent = String(age);
  $('age-years').dataset.count = String(age);
  $('age-next').textContent = daysLeft === 0 || daysSince === 0 ? 'LEVEL UP' : `LVL ${age + 1} ZA ${daysLeft} D`;
  $('online-user').textContent = config.discordUsername;
  $('age-note').textContent = daysLeft === 0 || daysSince === 0
    ? 'Dneska slavím. Dort vítán.'
    : `${daysSince} z ${daysSince + daysLeft} dní do levelu ${age + 1}.`;
  $('age-fill').style.setProperty('--age-progress', (daysSince / Math.max(1, daysSince + daysLeft)).toFixed(3));

  // Stavový pásek v liště skládají dohromady hodiny a živá data.
  const tickerParts = { time: '', status: '', game: '', music: '' };
  window.siteTicker = {
    set(key, text) {
      tickerParts[key] = text || '';
      $('ticker-text').textContent = Object.values(tickerParts).filter(Boolean).join(' · ');
    },
  };

  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const themes = ['violet', 'aurora', 'sunset'];
  const themeLabel = theme => theme.charAt(0).toUpperCase() + theme.slice(1);
  function applyTheme(theme) {
    root.dataset.theme = theme;
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
    storage.set('borik-theme', theme);
    window.dispatchEvent(new Event('themechange'));
  }
  // Při kliknutí se nová barva rozlije kruhem z místa kliknutí (View Transitions API).
  function setTheme(theme, origin) {
    if (!themes.includes(theme)) theme = 'violet';
    // Ruční volba motivu má přednost před barvou z obalu alba.
    const untune = Boolean(origin) && root.classList.contains('is-tuned');
    const change = () => { applyTheme(theme); if (untune) window.siteTune?.set(false, true, false); };
    if (untune) setTimeout(() => toast(`Motiv ${themeLabel(theme)}. Barvy podle hudby jsou pro tuhle návštěvu vypnuté.`), 50);
    const animated = origin && document.startViewTransition && !window.siteCalm && (untune || root.dataset.theme !== theme);
    if (!animated) { change(); return; }
    root.style.setProperty('--vt-x', `${origin.x}px`); root.style.setProperty('--vt-y', `${origin.y}px`);
    root.classList.add('vt-circle');
    const transition = document.startViewTransition(change);
    transition.finished.catch(() => {}).finally(() => root.classList.remove('vt-circle'));
  }
  const originOf = (event, element) => {
    if (event && (event.clientX || event.clientY)) return { x: event.clientX, y: event.clientY };
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };
  setTheme(storage.get('borik-theme') || config.defaultTheme);
  document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', event => setTheme(button.dataset.themeChoice, originOf(event, button))));
  let toastTimer;
  function toast(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3500);
  }

  let userCalm = storage.get('borik-calm') === 'true';
  function updateMotion() {
    window.siteCalm = media.matches || userCalm;
    root.classList.toggle('calm', window.siteCalm);
    $('motion-toggle').setAttribute('aria-pressed', String(window.siteCalm));
    $('motion-toggle').textContent = window.siteCalm ? '◌ Klidný režim zapnutý' : '◌ Klidný režim';
    window.dispatchEvent(new Event('motionchange'));
  }
  function toggleCalm() {
    if (media.matches) { toast('Omezení animací je zapnuté v nastavení tvého zařízení.'); return; }
    userCalm = !userCalm; storage.set('borik-calm', String(userCalm)); updateMotion();
  }
  updateMotion(); media.addEventListener('change', updateMotion);
  $('motion-toggle').addEventListener('click', toggleCalm);

  // Úvodní sekvence: jen při první návštěvě, nejdéle 1,5 s, jakákoli akce ji přeskočí.
  if (!window.siteCalm && !storage.get('borik-intro')) {
    root.classList.add('intro');
    const endIntro = () => {
      root.classList.remove('intro');
      ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(type => window.removeEventListener(type, endIntro));
    };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(type => window.addEventListener(type, endIntro, { passive: true }));
    window.addEventListener('motionchange', () => { if (window.siteCalm) endIntro(); });
    setTimeout(endIntro, 1500);
  }
  storage.set('borik-intro', '1');

  // Příkazová paleta: hledání, šipky a Enter. Skryté příkazy se ukážou až po napsání.
  const dialog = $('command-dialog');
  const input = $('command-input');
  const options = [...$('command-list').children];
  const normalize = text => text.toLocaleLowerCase('cs').normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  options.forEach((option, index) => {
    if (!option.id) option.id = `command-option-${index}`;
    option.dataset.search = normalize(`${option.textContent} ${option.dataset.command || ''}`);
  });
  let active = -1;
  const visibleOptions = () => options.filter(option => !option.hidden);
  function setActive(index) {
    const visible = visibleOptions();
    active = visible.length ? (index + visible.length) % visible.length : -1;
    options.forEach(option => { option.classList.remove('is-active'); option.setAttribute('aria-selected', 'false'); });
    const current = visible[active];
    if (current) {
      current.classList.add('is-active'); current.setAttribute('aria-selected', 'true');
      current.scrollIntoView({ block: 'nearest' });
      input.setAttribute('aria-activedescendant', current.id);
    } else input.removeAttribute('aria-activedescendant');
  }
  function filterCommands() {
    const query = normalize(input.value);
    for (const option of options) {
      const secret = option.hasAttribute('data-hidden');
      const words = option.dataset.search.split(/\s+/);
      option.hidden = secret
        ? !(query.length >= 2 && words.some(word => word.startsWith(query)))
        : Boolean(query) && !option.dataset.search.includes(query);
    }
    $('command-empty').hidden = visibleOptions().length > 0;
    setActive(0);
  }
  function openMenu() {
    if (dialog.open) return;
    input.value = ''; dialog.showModal(); filterCommands(); input.focus();
  }
  const commands = {
    calm: () => toggleCalm(),
    warp: () => { if (window.siteCalm) toast('V klidném režimu motory nestartuju.'); else { window.siteEffects?.hyperspace(); toast('Warp pohon zapnut. Drž se.'); } },
    meteors: () => { if (window.siteCalm) toast('V klidném režimu je obloha v klidu.'); else { window.siteEffects?.meteorShower(); toast('Meteorický roj. Něco si přej.'); } },
    top: () => window.scrollTo({ top: 0, behavior: window.siteCalm ? 'auto' : 'smooth' }),
    sudo: () => toast('Hezký pokus. Tady velím já.'),
    42: () => toast('Odpověď sedí. Otázku pořád hledám.'),
    tune: () => window.siteTune?.toggle(),
    kafe: () => toast('Chyba 418: jsem konvice na čaj.'),
    ahoj: () => toast('Ahojkyy! Díky za návštěvu.'),
    neofetch: () => toast(`${config.name.toLocaleLowerCase('cs')}@borik.space · ${age} let · motiv ${themeLabel(root.dataset.theme)} · na palubě od ${year}`),
  };
  function runCommand(name, event, element) {
    if (name.startsWith('theme:')) {
      const theme = name.slice(6);
      const origin = originOf(event, element);
      const tuned = root.classList.contains('is-tuned');
      dialog.close(); setTheme(theme, origin); if (!tuned) toast(`Nová atmosféra: ${themeLabel(theme)}`);
      return;
    }
    dialog.close(); commands[name]?.();
  }
  window.siteActions = { toast, setTheme, toggleCalm, openMenu, runCommand: name => commands[name]?.() };
  document.querySelectorAll('[data-open-menu]').forEach(button => button.addEventListener('click', openMenu));
  $('close-menu').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  document.querySelectorAll('[data-close-menu]').forEach(link => link.addEventListener('click', () => dialog.close()));
  document.querySelectorAll('[data-run]').forEach(button => button.addEventListener('click', event => runCommand(button.dataset.run, event, button)));
  input.addEventListener('input', filterCommands);
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(active + 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(active - 1); }
    else if (event.key === 'Enter') { event.preventDefault(); visibleOptions()[active]?.click(); }
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (dialog.open) dialog.close(); else openMenu();
    }
  });
  $('cycle-theme').addEventListener('click', event => {
    const next = themes[(themes.indexOf(root.dataset.theme) + 1) % themes.length];
    const origin = originOf(event, $('cycle-theme'));
    const tuned = root.classList.contains('is-tuned');
    dialog.close(); setTheme(next, origin);
    if (!tuned) toast(`Nová atmosféra: ${themeLabel(next)}`);
  });
  document.querySelectorAll('[data-copy-discord]').forEach(button => button.addEventListener('click', async () => {
    dialog.close();
    try { await navigator.clipboard.writeText(config.discordUsername); toast(`Discord zkopírován: ${config.discordUsername}`); }
    catch { window.prompt('Zkopíruj moje Discord jméno:', config.discordUsername); }
  }));

  const phrases = config.rotatingNames.filter(name => typeof name === 'string' && name.trim());
  if (!phrases.length) phrases.push(config.name);
  let phrase = 0, character = phrases[0].length, deleting = true, typingTimer;
  const typed = $('typed');
  const nameLine = typed.parentElement;
  $('hero-heading').setAttribute('aria-label', `${config.greeting} ${config.name}`);
  nameLine.setAttribute('aria-hidden', 'true');
  function renderName() {
    const text = phrases[phrase].slice(0, character);
    if (root.classList.contains('intro')) {
      // Úvodní sekvence skládá jméno po písmenech.
      typed.replaceChildren(...[...text].map((letter, index) => {
        const span = document.createElement('span');
        span.textContent = letter; span.style.setProperty('--i', String(index));
        return span;
      }));
    } else typed.textContent = text;
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

  // Pražský čas: živé hodiny v dlaždici, v patičce bia a ve stavovém pásku.
  const clockFormat = new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const clockNotes = [[5, 'Hluboká noc. Asi ještě nespím.'], [9, 'Ráno. Pomalý rozjezd.'], [15, 'Přes den. Nejspíš škola.'], [19, 'Odpoledne. Čas na hry.'], [23, 'Večer. Sluchátka na uších.'], [24, 'Pozdní večer. Ještě jednu písničku.']];
  const dateFormat = new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', weekday: 'short', day: 'numeric', month: 'numeric' });
  let lastMinute = '';
  function updateClock() {
    if (document.hidden) return;
    const parts = Object.fromEntries(clockFormat.formatToParts(new Date()).map(part => [part.type, part.value]));
    const minute = `${parts.hour}:${parts.minute}`;
    $('clock-seconds').textContent = `:${parts.second}`;
    if (minute === lastMinute) return;
    lastMinute = minute;
    $('clock-value').firstChild.textContent = minute;
    $('clock-date').textContent = `PRAHA · ${dateFormat.format(new Date()).toLocaleUpperCase('cs')}`;
    // Tečka na denní ose: půlnoc vlevo, poledne uprostřed.
    $('day-dot').style.setProperty('--day', ((Number(parts.hour) % 24 * 60 + Number(parts.minute)) / 1440).toFixed(4));
    $('local-time').textContent = `${minute} · MŮJ ČAS`;
    $('clock-note').textContent = clockNotes.find(([hour]) => Number(parts.hour) % 24 < hour)[1];
    window.siteTicker.set('time', `Praha ${minute}`);
  }
  updateClock(); setInterval(updateClock, 1000);
  document.addEventListener('visibilitychange', updateClock);
})();
