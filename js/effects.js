/* Hvězdy, padající hvězdy a kurzor. Klidný režim zastaví pohyb. */
(() => {
  'use strict';
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  const finePointer = matchMedia('(pointer: fine)');
  const dot = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');
  const spotlight = document.getElementById('spotlight');
  let width, height, stars = [], shoots = [], frame;
  let mx = -100, my = -100, rx = -100, ry = -100;
  let lastFrame = 0, nextShoot = 0, lastParticle = 0;
  function resize() {
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * ratio; canvas.height = height * ratio;
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    stars = Array.from({ length: Math.min(160, Math.floor(width * height / 8000)) }, () => ({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.1 + .2, opacity: Math.random() * .4 + .1, phase: Math.random() * 6.28 }));
    if (window.siteCalm) draw(0, 0);
  }
  function draw(time, delta) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    for (const star of stars) {
      const alpha = star.opacity * (.7 + .3 * Math.sin(time / 1800 + star.phase));
      ctx.fillStyle = `rgba(221,219,242,${alpha})`;
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
      const easing = 1 - Math.exp(-delta / 80);
      rx += (mx - rx) * easing; ry += (my - ry) * easing;
      dot.style.left = `${mx}px`; dot.style.top = `${my}px`;
      ring.style.left = `${rx}px`; ring.style.top = `${ry}px`;
    }
    frame = requestAnimationFrame(loop);
  }
  function restart() {
    cancelAnimationFrame(frame);
    document.body.classList.toggle('custom-cursor', finePointer.matches && !window.siteCalm);
    if (window.siteCalm) { shoots = []; draw(0, 0); }
    else if (!document.hidden) { lastFrame = performance.now(); frame = requestAnimationFrame(loop); }
  }
  document.addEventListener('pointermove', event => {
    if (!finePointer.matches || window.siteCalm) return;
    mx = event.clientX; my = event.clientY;
    spotlight.style.background = `radial-gradient(350px circle at ${mx}px ${my}px, rgba(var(--accent-rgb), .025), transparent 70%)`;
    document.body.classList.toggle('cursor-hover', Boolean(event.target.closest('a, button')));
    const time = performance.now();
    if (time - lastParticle > 65) {
      lastParticle = time;
      const particle = document.createElement('span'); particle.className = 'cursor-particle'; particle.setAttribute('aria-hidden', 'true');
      particle.style.left = `${mx}px`; particle.style.top = `${my}px`;
      particle.style.setProperty('--dx', `${(Math.random() - .5) * 32}px`); particle.style.setProperty('--dy', `${10 + Math.random() * 20}px`);
      document.body.append(particle); setTimeout(() => particle.remove(), 750);
    }
    const card = event.target.closest('.panel');
    if (card) {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--card-x', `${mx - rect.left}px`); card.style.setProperty('--card-y', `${my - rect.top}px`);
    }
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { mx = my = -100; });
  window.addEventListener('resize', resize); window.addEventListener('motionchange', restart);
  document.addEventListener('visibilitychange', restart); finePointer.addEventListener('change', restart);
  resize(); restart();
})();
