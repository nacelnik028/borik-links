/* Hvězdy, sníh, meteory a kurzor. Warp při scrollu a náhodné meteory jen s efekty navíc (třída fx). */
(() => {
  'use strict';
  const root = document.documentElement;
  const extras = () => root.classList.contains('fx');
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  const finePointer = matchMedia('(pointer: fine)');
  const dot = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');
  const spotlight = document.getElementById('spotlight');
  const aurora = document.getElementById('aurora');
  const auroraField = document.getElementById('aurora-field');
  let auroraX = 0, auroraY = 0, targetAuroraX = 0, targetAuroraY = 0;
  let width, height, stars = [], shoots = [], frame;
  let mx = -100, my = -100, rx = -100, ry = -100;
  let lastFrame = 0, nextShoot = 0;
  // Scroll: hvězdy se posouvají podle hloubky a při rychlém scrollu se protáhnou.
  let scrollPosition = 0, lastScroll = 0, warp = 0;
  let hyperStart = -1;
  const hyperDuration = 2400;
  // Sníh: pár desítek měkkých vloček, zapíná ho sky.js (prosinec nebo příkaz v paletě).
  let snowing = false, flakes = [];
  function makeFlake(top) {
    const near = Math.random();
    return { x: Math.random() * width, y: top ? -10 - Math.random() * height * .3 : Math.random() * height, radius: .8 + near * 1.8,
      speed: .012 + near * .028, sway: Math.random() * Math.PI * 2, drift: .4 + Math.random() * .8, alpha: .25 + near * .45 };
  }
  function seedSnow() { flakes = snowing ? Array.from({ length: Math.min(110, Math.max(30, Math.floor(width * height / 18000))) }, () => makeFlake(false)) : []; }
  function resetCursor() {
    document.body.classList.remove('cursor-visible', 'cursor-hover', 'cursor-pressed');
    mx = my = rx = ry = -100;
    targetAuroraX = targetAuroraY = 0;
  }
  function updateCursorHover(target) {
    document.body.classList.toggle('cursor-hover', Boolean(target?.closest('a[href], button:not(:disabled)')));
  }
  function resize() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * ratio; canvas.height = height * ratio;
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    // Hustota roste i na širokých monitorech; na dotykových zařízeních je nižší.
    const density = finePointer.matches ? 9000 : 14000;
    const count = Math.min(650, Math.max(65, Math.floor(width * height / density)));
    stars = Array.from({ length: count }, () => {
      const brightness = Math.random();
      const bright = brightness > .85;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: bright ? 1.4 + Math.random() * .8 : .65 + Math.random() * .7,
        opacity: bright ? .8 + Math.random() * .2 : .35 + Math.random() * .35,
        phase: Math.random() * Math.PI * 2,
        depth: bright ? .1 + Math.random() * .08 : .02 + Math.random() * .07,
        bright,
        sparkle: brightness > .97,
      };
    });
    seedSnow();
    if (window.siteCalm) draw(0, 0);
  }
  function draw(time, delta) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const calm = window.siteCalm;
    const hyper = !calm && hyperStart >= 0 ? Math.sin(Math.PI * Math.min(1, (time - hyperStart) / hyperDuration)) : 0;
    if (hyperStart >= 0 && time - hyperStart > hyperDuration) hyperStart = -1;
    const streak = calm || !extras() ? 0 : Math.max(-90, Math.min(90, warp * 2.2));
    const centerX = width / 2, centerY = height / 2;
    for (const star of stars) {
      const alpha = star.opacity * (.82 + .18 * Math.sin(time / 2200 + star.phase));
      const x = star.x;
      let y = star.y;
      if (!calm) { y = (star.y - scrollPosition * star.depth) % height; if (y < 0) y += height; }
      if (hyper > .01) {
        // Hyperprostor: hvězdy se protáhnou od středu obrazovky.
        const dx = x - centerX, dy = y - centerY;
        const length = hyper * (.25 + star.depth * 3.2);
        ctx.strokeStyle = `rgba(228,232,255,${alpha * (.35 + hyper * .5)})`;
        ctx.lineWidth = star.radius * .9;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx * length, y + dy * length); ctx.stroke();
        continue;
      }
      if (Math.abs(streak) > 1.5) {
        const length = streak * star.depth * 5;
        ctx.strokeStyle = `rgba(228,232,255,${alpha * .7})`;
        ctx.lineWidth = star.radius * 1.3;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + length); ctx.stroke();
        continue;
      }
      if (star.bright) {
        ctx.fillStyle = `rgba(192,204,255,${alpha * .08})`;
        ctx.beginPath(); ctx.arc(x, y, star.radius * 3.5, 0, Math.PI * 2); ctx.fill();
      }
      if (star.sparkle) {
        const ray = star.radius * 2.8;
        ctx.strokeStyle = `rgba(228,232,255,${alpha * .35})`;
        ctx.lineWidth = .7;
        ctx.beginPath();
        ctx.moveTo(x - ray, y); ctx.lineTo(x + ray, y);
        ctx.moveTo(x, y - ray); ctx.lineTo(x, y + ray);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(235,238,255,${alpha})`;
      ctx.beginPath(); ctx.arc(x, y, star.radius, 0, Math.PI * 2); ctx.fill();
    }
    if (calm) return;
    if (snowing) {
      for (const flake of flakes) {
        flake.y += flake.speed * delta; flake.sway += delta * .0012;
        flake.x += Math.sin(flake.sway) * flake.drift * delta * .01;
        if (flake.y > height + 10) Object.assign(flake, makeFlake(true));
        if (flake.x < -10) flake.x += width + 20; else if (flake.x > width + 10) flake.x -= width + 20;
        ctx.fillStyle = `rgba(240,244,255,${flake.alpha})`;
        ctx.beginPath(); ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (time > nextShoot) {
      if (extras()) shoots.push({ x: Math.random() * width * .8, y: Math.random() * height * .3, life: 1, delay: 0 });
      nextShoot = time + 6000 + Math.random() * 6000;
    }
    shoots = shoots.filter(shoot => shoot.life > 0);
    for (const shoot of shoots) {
      if (shoot.delay > 0) { shoot.delay -= delta; continue; }
      shoot.x += delta * .4; shoot.y += delta * .19; shoot.life -= delta * .0009;
      const gradient = ctx.createLinearGradient(shoot.x - 100, shoot.y - 48, shoot.x, shoot.y);
      gradient.addColorStop(0, 'rgba(190,177,236,0)');
      gradient.addColorStop(1, `rgba(222,213,255,${Math.max(0, shoot.life)})`);
      ctx.strokeStyle = gradient; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(shoot.x - 100, shoot.y - 48); ctx.lineTo(shoot.x, shoot.y); ctx.stroke();
    }
  }
  function loop(time) {
    if (document.hidden || window.siteCalm) return;
    const delta = Math.min(time - lastFrame || 16, 40); lastFrame = time;
    const currentScroll = scrollY;
    const velocity = (currentScroll - lastScroll) / delta * 16;
    lastScroll = currentScroll; scrollPosition = currentScroll;
    warp += (velocity - warp) * (1 - Math.exp(-delta / 90));
    draw(time, delta);
    if (finePointer.matches) {
      const drift = 1 - Math.exp(-delta / 650);
      auroraX += (targetAuroraX - auroraX) * drift;
      auroraY += (targetAuroraY - auroraY) * drift;
      auroraField.style.setProperty('--aurora-x', `${auroraX.toFixed(2)}px`);
      auroraField.style.setProperty('--aurora-y', `${auroraY.toFixed(2)}px`);
      const easing = 1 - Math.exp(-delta / 35);
      rx += (mx - rx) * easing; ry += (my - ry) * easing;
      dot.style.left = `${mx}px`; dot.style.top = `${my}px`;
      ring.style.left = `${rx}px`; ring.style.top = `${ry}px`;
    }
    frame = requestAnimationFrame(loop);
  }
  function restart() {
    cancelAnimationFrame(frame);
    aurora.classList.toggle('is-paused', document.hidden || window.siteCalm);
    if (window.siteCalm || !finePointer.matches) {
      auroraX = auroraY = targetAuroraX = targetAuroraY = 0;
      auroraField.style.setProperty('--aurora-x', '0px');
      auroraField.style.setProperty('--aurora-y', '0px');
    }
    document.body.classList.toggle('custom-cursor', finePointer.matches && !window.siteCalm);
    if (document.hidden || window.siteCalm || !finePointer.matches) resetCursor();
    if (window.siteCalm) { shoots = []; hyperStart = -1; warp = 0; draw(0, 0); }
    else if (!document.hidden) { lastFrame = performance.now(); lastScroll = scrollY; warp = 0; frame = requestAnimationFrame(loop); }
  }
  // Skryté efekty pro paletu příkazů, Konami kód a kliknutí na avatar.
  window.siteEffects = {
    meteorShower() {
      if (window.siteCalm) return false;
      for (let index = 0; index < 34; index++) {
        shoots.push({ x: Math.random() * width * 1.1 - width * .2, y: Math.random() * height * .55 - 60, life: .8 + Math.random() * .5, delay: index * 85 + Math.random() * 120 });
      }
      return true;
    },
    hyperspace() {
      if (window.siteCalm) return false;
      hyperStart = performance.now();
      return true;
    },
    get snowing() { return snowing; },
    setSnow(on) {
      if (snowing === Boolean(on)) return;
      snowing = Boolean(on); seedSnow();
    },
  };
  document.addEventListener('pointermove', event => {
    if (!finePointer.matches || window.siteCalm || event.pointerType === 'touch') return;
    mx = event.clientX; my = event.clientY;
    if (!document.body.classList.contains('cursor-visible')) { rx = mx; ry = my; }
    dot.style.left = `${mx}px`; dot.style.top = `${my}px`;
    ring.style.left = `${rx}px`; ring.style.top = `${ry}px`;
    document.body.classList.add('cursor-visible');
    targetAuroraX = (Math.max(0, Math.min(1, mx / width)) - .5) * 28;
    targetAuroraY = (Math.max(0, Math.min(1, my / height)) - .5) * 20;
    spotlight.style.background = `radial-gradient(350px circle at ${mx}px ${my}px, rgba(var(--accent-rgb), .025), transparent 70%)`;
    updateCursorHover(event.target);
    // Světlo a okraj karty sledují kurzor přes CSS proměnné.
    const card = event.target.closest('.panel, .si');
    if (card) {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--card-x', `${mx - rect.left}px`); card.style.setProperty('--card-y', `${my - rect.top}px`);
    }
  }, { passive: true });
  document.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') { resetCursor(); return; }
    if (event.button !== 0 || !finePointer.matches || window.siteCalm) return;
    document.body.classList.add('cursor-pressed');
  });
  window.addEventListener('pointerup', () => document.body.classList.remove('cursor-pressed'));
  window.addEventListener('pointercancel', resetCursor);
  window.addEventListener('blur', resetCursor);
  document.documentElement.addEventListener('pointerleave', resetCursor);
  document.addEventListener('scroll', () => {
    if (document.body.classList.contains('cursor-visible')) updateCursorHover(document.elementFromPoint(mx, my));
  }, { passive: true, capture: true });
  window.addEventListener('resize', resize); window.addEventListener('motionchange', restart);
  document.addEventListener('visibilitychange', restart); finePointer.addEventListener('change', restart);
  resize(); restart();
})();
