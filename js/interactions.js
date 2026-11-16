/* Drobné interakce: lišta, příjezd sekcí, magnetická tlačítka, náklon avataru, souhvězdí a easter eggy. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = id => document.getElementById(id);
  const finePointer = matchMedia('(pointer: fine)');
  const lively = () => finePointer.matches && !window.siteCalm;

  // Lišta se zúží, jakmile úvod odjede nahoru.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => $('topbar').classList.toggle('is-scrolled', !entry.isIntersecting)).observe($('topbar-sentinel'));
  }

  // Jednorázové spuštění při příjezdu prvku do okna.
  function onceVisible(elements, callback, threshold = .25) {
    if (!('IntersectionObserver' in window)) { elements.forEach(callback); return; }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { observer.unobserve(entry.target); callback(entry.target); }
    }, { threshold });
    elements.forEach(element => observer.observe(element));
  }

  // Příjezd sekcí řeší CSS (animation-timeline); starší prohlížeče dostanou třídu přes IntersectionObserver.
  if (!CSS.supports('animation-timeline: view()') && 'IntersectionObserver' in window) {
    root.classList.add('io-reveal');
    onceVisible([...document.querySelectorAll('[data-reveal]')], element => element.classList.add('is-inview'), .12);
  }

  // Čísla: pořadí favoritů se odpočítá, věk se dopočítá nahoru.
  function countTo(element, from, to, duration, format) {
    if (window.siteCalm) { element.textContent = format(to); return; }
    const start = performance.now();
    const step = time => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      element.textContent = format(Math.round(from + (to - from) * eased));
      if (progress < 1 && !window.siteCalm) requestAnimationFrame(step); else element.textContent = format(to);
    };
    requestAnimationFrame(step);
  }
  onceVisible([...document.querySelectorAll('.favorite-group')], group => {
    group.querySelectorAll('.favorite-rank').forEach((rank, index) => {
      const target = Number(rank.textContent);
      if (Number.isFinite(target)) countTo(rank, 9, target, 700 + index * 180, value => String(value).padStart(2, '0'));
    });
  }, .4);
  const ageYears = $('age-years');
  onceVisible([ageYears], () => countTo(ageYears, 0, Number(ageYears.dataset.count) || 0, 1100, String), .6);

  // Magnetická tlačítka a karty: jen s efekty navíc (třída fx) se lehce přitáhnou ke kurzoru.
  for (const element of document.querySelectorAll('[data-magnetic]')) {
    const strength = element.classList.contains('si') ? .08 : .22;
    element.addEventListener('pointermove', event => {
      if (!lively() || !root.classList.contains('fx') || event.pointerType === 'touch') return;
      const rect = element.getBoundingClientRect();
      element.style.setProperty('--mx', `${((event.clientX - rect.left - rect.width / 2) * strength).toFixed(1)}px`);
      element.style.setProperty('--my', `${((event.clientY - rect.top - rect.height / 2) * strength).toFixed(1)}px`);
    }, { passive: true });
    const release = () => { element.style.removeProperty('--mx'); element.style.removeProperty('--my'); };
    element.addEventListener('pointerleave', release);
    element.addEventListener('blur', release);
  }

  // Avatar se naklání za kurzorem, orbity se posouvají jako vrstvy v různé hloubce.
  const hero = $('hero'), art = $('hero-art'), tilt = $('avatar-tilt');
  const layers = [...document.querySelectorAll('.orbit-layer')];
  function resetTilt() {
    art.classList.remove('is-tilting');
    tilt.style.removeProperty('--tilt-x'); tilt.style.removeProperty('--tilt-y');
    layers.forEach(layer => { layer.style.transform = ''; });
  }
  hero.addEventListener('pointermove', event => {
    if (!lively() || event.pointerType === 'touch') return;
    const rect = art.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - rect.left - rect.width / 2) / (rect.width / 2)));
    const y = Math.max(-1, Math.min(1, (event.clientY - rect.top - rect.height / 2) / (rect.height / 2)));
    art.classList.add('is-tilting');
    tilt.style.setProperty('--tilt-x', `${(-y * 13).toFixed(2)}deg`);
    tilt.style.setProperty('--tilt-y', `${(x * 16).toFixed(2)}deg`);
    tilt.style.setProperty('--shine-x', `${(50 + x * 45).toFixed(1)}%`);
    tilt.style.setProperty('--shine-y', `${(50 + y * 45).toFixed(1)}%`);
    for (const layer of layers) {
      const depth = Number(layer.dataset.depth) || 0;
      layer.style.transform = `translate3d(${(x * depth).toFixed(1)}px, ${(y * depth).toFixed(1)}px, 0)`;
    }
  }, { passive: true });
  hero.addEventListener('pointerleave', resetTilt);
  window.addEventListener('motionchange', () => { if (window.siteCalm) resetTilt(); });

  // Souhvězdí: spojnice vede od hvězdy ke hvězdě hadovitě po řádcích.
  const constellation = $('constellation'), lines = $('constellation-lines');
  const cards = [...document.querySelectorAll('#si-row .si')];
  function drawConstellation() {
    const box = constellation.getBoundingClientRect();
    if (!box.width) return;
    const columns = getComputedStyle($('si-row')).gridTemplateColumns.split(' ').length || 1;
    const rows = [];
    cards.forEach((card, index) => {
      const star = card.querySelector('.si-star').getBoundingClientRect();
      (rows[Math.floor(index / columns)] ||= []).push({ x: star.left + star.width / 2 - box.left, y: star.top + star.height / 2 - box.top });
    });
    const points = rows.flatMap((row, index) => index % 2 ? row.reverse() : row);
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' '));
    lines.replaceChildren(path);
    path.style.setProperty('--len', String(Math.ceil(path.getTotalLength())));
  }
  // Při kreslení nesmí karty být posunuté hoverem ani magnetem, proto se měří jen v klidu.
  let constellationTimer;
  const scheduleConstellation = () => { clearTimeout(constellationTimer); constellationTimer = setTimeout(drawConstellation, 120); };
  drawConstellation();
  window.addEventListener('resize', scheduleConstellation);
  document.fonts?.ready.then(scheduleConstellation);
  onceVisible([constellation], () => constellation.classList.add('is-drawn'), .35);

  // Easter eggy: pět rychlých kliknutí na avatar a Konami kód.
  // Avatar je odkaz na Discord profil. Běžné kliknutí myší nebo prstem počká chvilku, jestli nepřijde další:
  // samostatné (nebo dvojité) kliknutí otevře profil, rychlá série počítá do pěti. Klávesnice
  // a otevření do nové karty (Ctrl, Shift, prostřední tlačítko) fungují jako obyčejný odkaz.
  const avatar = $('avatar-core');
  let clicks = 0, clickTimer;
  avatar.addEventListener('click', event => {
    if (event.detail === 0 || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    clearTimeout(clickTimer);
    clicks++;
    if (!window.siteCalm) {
      avatar.classList.remove('is-bumped'); void avatar.offsetWidth; avatar.classList.add('is-bumped');
    }
    if (clicks >= 5) {
      clicks = 0;
      if (window.siteEffects?.meteorShower()) window.siteActions?.toast('Meteorický roj. Něco si přej.');
      else window.siteActions?.toast('Našel jsi tajemství. V klidném režimu ale obloha odpočívá.');
      return;
    }
    clickTimer = setTimeout(() => {
      if (clicks <= 2) window.open(avatar.href, '_blank', 'noopener');
      clicks = 0;
    }, 360);
  });
  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIndex = 0;
  document.addEventListener('keydown', event => {
    if ($('command-dialog').open) { konamiIndex = 0; return; }
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    konamiIndex = key === konami[konamiIndex] ? konamiIndex + 1 : key === konami[0] ? 1 : 0;
    if (konamiIndex === konami.length) {
      konamiIndex = 0;
      if (window.siteEffects?.hyperspace()) window.siteActions?.toast('Konami kód přijat. Skok do hyperprostoru.');
      else window.siteActions?.toast('Konami kód přijat. V klidném režimu ale zůstávám na místě.');
    }
  });
})();
