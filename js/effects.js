/* Polární záře, hvězdy a kurzor. Klidný režim zastaví pohyb. */
(() => {
  'use strict';
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
    // Hustota roste i na širokých monitorech; jasné hvězdy jsou vidět přes záři.
    const count = Math.min(650, Math.max(65, Math.floor(width * height / 9000)));
    stars = Array.from({ length: count }, () => {
      const brightness = Math.random();
      const bright = brightness > .85;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: bright ? 1.4 + Math.random() * .8 : .65 + Math.random() * .7,
        opacity: bright ? .8 + Math.random() * .2 : .35 + Math.random() * .35,
        phase: Math.random() * Math.PI * 2,
        bright,
        sparkle: brightness > .97,
      };
    });
    if (window.siteCalm) draw(0, 0);
  }
  function draw(time, delta) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    for (const star of stars) {
      const alpha = star.opacity * (.82 + .18 * Math.sin(time / 2200 + star.phase));
      if (star.bright) {
        ctx.fillStyle = `rgba(192,204,255,${alpha * .08})`;
        ctx.beginPath(); ctx.arc(star.x, star.y, star.radius * 3.5, 0, Math.PI * 2); ctx.fill();
      }
      if (star.sparkle) {
        const ray = star.radius * 2.8;
        ctx.strokeStyle = `rgba(228,232,255,${alpha * .35})`;
        ctx.lineWidth = .7;
        ctx.beginPath();
        ctx.moveTo(star.x - ray, star.y); ctx.lineTo(star.x + ray, star.y);
        ctx.moveTo(star.x, star.y - ray); ctx.lineTo(star.x, star.y + ray);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(235,238,255,${alpha})`;
      ctx.beginPath(); ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2); ctx.fill();
    }
    if (window.siteCalm) return;
    if (time > nextShoot) {
      shoots.push({ x: Math.random() * width * .8, y: Math.random() * height * .3, life: 1 });
      nextShoot = time + 6000 + Math.random() * 6000;
    }
    shoots = shoots.filter(shoot => shoot.life > 0);
    for (const shoot of shoots) {
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
    if (window.siteCalm) { shoots = []; draw(0, 0); }
    else if (!document.hidden) { lastFrame = performance.now(); frame = requestAnimationFrame(loop); }
  }
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
    const card = event.target.closest('.panel');
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
