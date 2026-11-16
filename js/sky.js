/* Nebe podle denní doby v Praze a sezónní efekty: sníh v prosinci, ohňostroj o silvestrovské půlnoci, konfety na narozeniny.
   Barvy z obalu alba i ručně vybraný motiv mají před nebem přednost. Klidný režim vypíná pohyb i přechody. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = id => document.getElementById(id);
  const storage = window.siteStorage;
  const toast = message => window.siteActions?.toast(message);
  const LAT = 50.08, LON = 14.43; // Praha, stejné souřadnice jako popisek u avataru.

  // Pražský čas nezávisle na časovém pásmu návštěvníka, včetně posunu vůči UTC (letní čas).
  const pragueFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Prague', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
  function prague(date = new Date()) {
    const p = Object.fromEntries(pragueFormat.formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
    const offset = Math.round((Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - date.getTime()) / 60000);
    return { ...p, minutes: p.hour * 60 + p.minute + p.second / 60, offset };
  }
  // Východ a západ slunce (zjednodušený výpočet NOAA, přesnost na pár minut), v minutách pražského času.
  function sunTimes(p) {
    const rad = Math.PI / 180;
    const dayIndex = Math.round((Date.UTC(p.year, p.month - 1, p.day) - Date.UTC(p.year, 0, 1)) / 86_400_000);
    const g = 2 * Math.PI / 365 * dayIndex;
    const equation = 229.18 * (.000075 + .001868 * Math.cos(g) - .032077 * Math.sin(g) - .014615 * Math.cos(2 * g) - .040849 * Math.sin(2 * g));
    const declination = .006918 - .399912 * Math.cos(g) + .070257 * Math.sin(g) - .006758 * Math.cos(2 * g) + .000907 * Math.sin(2 * g) - .002697 * Math.cos(3 * g) + .00148 * Math.sin(3 * g);
    const cosHour = Math.cos(90.833 * rad) / (Math.cos(LAT * rad) * Math.cos(declination)) - Math.tan(LAT * rad) * Math.tan(declination);
    const hour = Math.acos(Math.max(-1, Math.min(1, cosHour))) / rad;
    return { rise: 720 - 4 * (LON + hour) - equation + p.offset, set: 720 - 4 * (LON - hour) - equation + p.offset };
  }
  const clockText = minutes => { const value = Math.round(minutes); return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`; };

  // Barvy fází: záře u obzoru, nádech u horního okraje, odstín polární záře a její síla.
  const looks = {
    night: { glow: [52, 62, 140], glowA: .09, top: [10, 12, 34], topA: 0, tintA: [150, 140, 255], tintB: [120, 130, 230], amount: 0, aurora: 1 },
    dawn: { glow: [255, 146, 122], glowA: .15, top: [74, 62, 146], topA: .16, tintA: [255, 178, 152], tintB: [198, 142, 232], amount: .5, aurora: .85 },
    day: { glow: [112, 172, 255], glowA: .1, top: [44, 84, 156], topA: .2, tintA: [150, 206, 255], tintB: [118, 222, 214], amount: .42, aurora: .62 },
    dusk: { glow: [255, 124, 86], glowA: .16, top: [92, 52, 124], topA: .18, tintA: [255, 152, 112], tintB: [226, 112, 172], amount: .5, aurora: .85 },
  };
  const phaseNames = { night: 'noc', dawn: 'svítání', day: 'den', dusk: 'soumrak' };
  const mix = (a, b, t) => a + (b - a) * t;
  const mixRgb = (a, b, t) => a.map((value, index) => Math.round(mix(value, b[index], t)));
  function lookAt(minutes, sun) {
    // Opěrné body dne; mezi nimi se barvy plynule prolínají.
    const stops = [[sun.rise - 100, 'night'], [sun.rise - 10, 'dawn'], [sun.rise + 80, 'day'], [sun.set - 80, 'day'], [sun.set + 10, 'dusk'], [sun.set + 100, 'night']];
    if (minutes <= stops[0][0] || minutes >= stops[stops.length - 1][0]) return { ...looks.night };
    const next = stops.findIndex(([at]) => at > minutes);
    const [fromAt, fromName] = stops[next - 1], [toAt, toName] = stops[next];
    const t = (minutes - fromAt) / Math.max(1, toAt - fromAt), from = looks[fromName], to = looks[toName];
    return {
      glow: mixRgb(from.glow, to.glow, t), glowA: mix(from.glowA, to.glowA, t), top: mixRgb(from.top, to.top, t), topA: mix(from.topA, to.topA, t),
      tintA: mixRgb(from.tintA, to.tintA, t), tintB: mixRgb(from.tintB, to.tintB, t), amount: mix(from.amount, to.amount, t), aurora: mix(from.aurora, to.aurora, t),
    };
  }
  function phaseAt(minutes, sun) {
    if (minutes < sun.rise - 55 || minutes > sun.set + 55) return 'night';
    if (minutes < sun.rise + 35) return 'dawn';
    if (minutes > sun.set - 35) return 'dusk';
    return 'day';
  }

  // Nebe je zapnuté, dokud ho návštěvník nevypne v paletě nebo si ručně nevybere motiv.
  let skyEnabled = storage.get('borik-sky') !== 'off';
  let picked = storage.get('borik-theme-pick') === '1';
  let active = false, phase = 'night', signature = '';
  const skyVars = ['--sky-glow', '--sky-glow-a', '--sky-top', '--sky-top-a', '--sky-aurora', '--aurora-a-rgb', '--aurora-b-rgb'];
  const readRgb = name => getComputedStyle(root).getPropertyValue(name).split(',').map(Number).filter(Number.isFinite);
  function applySky() {
    const p = prague(), sun = sunTimes(p);
    phase = phaseAt(p.minutes, sun);
    root.dataset.sky = phase;
    const track = document.querySelector('.day-track');
    track?.style.setProperty('--sunrise', (sun.rise / 1440).toFixed(4));
    track?.style.setProperty('--sunset', (sun.set / 1440).toFixed(4));
    const times = $('sun-times');
    if (times) { times.textContent = `${phaseNames[phase]} · ↑${clockText(sun.rise)} ↓${clockText(sun.set)}`; times.title = `Východ slunce v Praze ${clockText(sun.rise)}, západ ${clockText(sun.set)}.`; }
    active = skyEnabled && !picked && !root.classList.contains('is-tuned');
    root.classList.toggle('sky-on', active);
    let next = 'off';
    if (active) {
      const look = lookAt(p.minutes, sun);
      const accent = readRgb('--accent-rgb'), secondary = readRgb('--secondary-rgb');
      const values = {
        '--sky-glow': look.glow.join(', '), '--sky-glow-a': look.glowA.toFixed(3), '--sky-top': look.top.join(', '), '--sky-top-a': look.topA.toFixed(3),
        '--sky-aurora': look.aurora.toFixed(3),
        '--aurora-a-rgb': (accent.length === 3 ? mixRgb(accent, look.tintA, look.amount) : look.tintA).join(', '),
        '--aurora-b-rgb': (secondary.length === 3 ? mixRgb(secondary, look.tintB, look.amount) : look.tintB).join(', '),
      };
      Object.entries(values).forEach(([name, value]) => root.style.setProperty(name, value));
      next = Object.values(values).join('|');
    } else skyVars.forEach(name => root.style.removeProperty(name));
    if (next !== signature) { signature = next; window.dispatchEvent(new Event('skychange')); }
  }
  window.siteSky = {
    get active() { return active; },
    get phase() { return phase; },
    toggle() {
      if (skyEnabled && !picked) {
        skyEnabled = false; storage.set('borik-sky', 'off'); applySky();
        toast('Nebe podle denní doby je vypnuté. Platí čisté barvy motivu.');
      } else {
        skyEnabled = true; picked = false; storage.set('borik-sky', 'on'); storage.set('borik-theme-pick', ''); applySky();
        toast(`Nebe podle denní doby je zapnuté. V Praze je teď ${phaseNames[phase]}.${root.classList.contains('is-tuned') ? ' Dokud hraje hudba, mají přednost barvy z obalu.' : ''}`);
      }
    },
  };
  window.addEventListener('themepick', () => {
    const wasActive = active;
    picked = true; applySky();
    if (wasActive) setTimeout(() => toast(`Motiv ${root.dataset.theme.charAt(0).toUpperCase()}${root.dataset.theme.slice(1)}. Nebe podle denní doby ho už nepřebarví, zapneš ho v paletě (Ctrl+K).`), 80);
  });
  window.addEventListener('themechange', applySky);
  window.addEventListener('minutechange', () => { applySky(); checkSeason(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { applySky(); checkSeason(); } });

  // ===== Sezónní efekty =====
  let seasonEnabled = storage.get('borik-season') !== 'off';
  let snowChoice = null; // příkaz „sníh“ v paletě přepíná sníh jen do konce návštěvy
  const overlay = document.createElement('canvas');
  overlay.className = 'fx-overlay'; overlay.setAttribute('aria-hidden', 'true');
  const ctx = overlay.getContext('2d');
  let particles = [], rockets = [], showUntil = 0, nextRocket = 0, frame = 0, last = 0, width = 0, height = 0;
  function palette() {
    const accent = readRgb('--accent-rgb'), secondary = readRgb('--secondary-rgb');
    return [accent, secondary, [255, 214, 140], [255, 255, 255], [255, 150, 170]].filter(color => color.length === 3);
  }
  function sizeOverlay() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    width = innerWidth; height = innerHeight;
    overlay.width = width * ratio; overlay.height = height * ratio;
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function startLoop() {
    if (!ctx) return;
    if (!overlay.isConnected) { document.body.append(overlay); sizeOverlay(); }
    if (!frame) { last = performance.now(); frame = requestAnimationFrame(step); }
  }
  function stopOverlay() {
    cancelAnimationFrame(frame); frame = 0; particles = []; rockets = []; showUntil = 0;
    ctx?.clearRect(0, 0, width, height); overlay.remove();
  }
  function launchRocket(colors) {
    rockets.push({ x: width * (.15 + Math.random() * .7), y: height + 10, vy: -(.55 + Math.random() * .25), target: height * (.12 + Math.random() * .3), color: colors[Math.floor(Math.random() * colors.length)] });
  }
  function burst(rocket) {
    const count = 54 + Math.floor(Math.random() * 26);
    for (let index = 0; index < count; index++) {
      const angle = Math.PI * 2 * index / count + Math.random() * .1, speed = .12 + Math.random() * .2;
      particles.push({ kind: 'spark', x: rocket.x, y: rocket.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, decay: .0007 + Math.random() * .0004, color: rocket.color });
    }
  }
  function step(time) {
    const delta = Math.min(time - last, 50); last = time;
    if (document.hidden || window.siteCalm) { stopOverlay(); return; }
    ctx.clearRect(0, 0, width, height);
    if (time < showUntil && time > nextRocket) { launchRocket(palette()); nextRocket = time + 380 + Math.random() * 520; }
    rockets = rockets.filter(rocket => {
      rocket.y += rocket.vy * delta;
      ctx.fillStyle = `rgba(${rocket.color.join(',')},.9)`;
      ctx.fillRect(rocket.x - 1, rocket.y, 2, 7);
      if (rocket.y <= rocket.target) { burst(rocket); return false; }
      return true;
    });
    particles = particles.filter(particle => {
      particle.life -= particle.decay * delta;
      if (particle.life <= 0 || particle.y > height + 40) return false;
      if (particle.kind === 'spark') {
        particle.vy += .00012 * delta; particle.vx *= .995; particle.vy *= .995;
        particle.x += particle.vx * delta; particle.y += particle.vy * delta;
        ctx.fillStyle = `rgba(${particle.color.join(',')},${Math.min(1, particle.life * 1.4)})`;
        ctx.beginPath(); ctx.arc(particle.x, particle.y, 1.6, 0, Math.PI * 2); ctx.fill();
      } else {
        particle.vy = Math.min(particle.vy + .00008 * delta, .26); particle.sway += delta * .004;
        particle.x += (particle.vx + Math.sin(particle.sway) * .04) * delta; particle.y += particle.vy * delta; particle.spin += particle.turn * delta;
        ctx.save(); ctx.translate(particle.x, particle.y); ctx.rotate(particle.spin);
        ctx.fillStyle = `rgba(${particle.color.join(',')},${Math.min(1, particle.life * 2)})`;
        ctx.fillRect(-particle.w / 2, -particle.h / 2 * Math.abs(Math.cos(particle.sway)), particle.w, particle.h * Math.abs(Math.cos(particle.sway)) + .5);
        ctx.restore();
      }
      return true;
    });
    if (time < showUntil || rockets.length || particles.length) frame = requestAnimationFrame(step);
    else stopOverlay();
  }
  function fireworks(duration) {
    if (window.siteCalm) return false;
    startLoop();
    showUntil = Math.max(showUntil, performance.now() + duration); nextRocket = 0;
    return true;
  }
  function confetti() {
    if (window.siteCalm) return false;
    startLoop();
    const colors = palette();
    for (let index = 0; index < 150; index++) {
      particles.push({ kind: 'confetti', x: Math.random() * width, y: -20 - Math.random() * height * .5, vx: (Math.random() - .5) * .06, vy: .08 + Math.random() * .12,
        w: 5 + Math.random() * 5, h: 8 + Math.random() * 6, spin: Math.random() * Math.PI, turn: (Math.random() - .5) * .01, sway: Math.random() * Math.PI * 2,
        life: 1, decay: .00016 + Math.random() * .00008, color: colors[index % colors.length] });
    }
    return true;
  }
  let newYearShown = '', birthdayShown = false;
  function checkSeason() {
    const p = prague();
    const snow = !window.siteCalm && (snowChoice ?? (seasonEnabled && p.month === 12));
    window.siteEffects?.setSnow(snow);
    if (!seasonEnabled || window.siteCalm) return;
    // Silvestrovská půlnoc: ohňostroj při vstupu do prvních 15 minut nového roku (jednou za návštěvu).
    if (p.month === 1 && p.day === 1 && p.hour === 0 && p.minute < 15 && newYearShown !== String(p.year)) {
      newYearShown = String(p.year);
      fireworks(40_000); toast(`Šťastný nový rok ${p.year}!`);
    }
    // Narozeniny (datum z config.js): krátká sprška konfet po načtení.
    if (window.siteBirthday && !birthdayShown) {
      birthdayShown = true;
      setTimeout(() => { if (seasonEnabled && !window.siteCalm) confetti(); }, root.classList.contains('intro') ? 1600 : 500);
    }
  }
  window.siteSeason = {
    get enabled() { return seasonEnabled; },
    toggle() {
      seasonEnabled = !seasonEnabled; storage.set('borik-season', seasonEnabled ? 'on' : 'off');
      if (!seasonEnabled) { snowChoice = null; stopOverlay(); }
      checkSeason();
      toast(seasonEnabled ? 'Sezónní efekty zapnuté: v prosinci sníh, o silvestrovské půlnoci ohňostroj, na moje narozeniny konfety.' : 'Sezónní efekty vypnuté.');
    },
    snow() {
      if (window.siteCalm) { toast('V klidném režimu nesněží.'); return; }
      snowChoice = !window.siteEffects?.snowing; checkSeason();
      toast(snowChoice ? 'Sněží. Do konce návštěvy.' : 'Sníh přestal.');
    },
    fireworks() { toast(fireworks(7000) ? 'Ohňostroj!' : 'V klidném režimu se nestřílí.'); },
    confetti() { toast(confetti() ? 'Konfety!' : 'V klidném režimu konfety zůstávají v krabici.'); },
  };
  window.addEventListener('resize', () => { if (overlay.isConnected) sizeOverlay(); });
  window.addEventListener('motionchange', () => { if (window.siteCalm) stopOverlay(); applySky(); checkSeason(); });

  applySky(); checkSeason();
})();
