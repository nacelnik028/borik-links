/* Polární záře jako WebGL shader. Bez WebGL zůstává původní SVG záře z index.html. */
(() => {
  'use strict';
  const canvas = document.getElementById('aurora-gl');
  const root = document.documentElement;
  if (!canvas || new URLSearchParams(location.search).has('nogl')) return;
  let gl;
  try { gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' }); } catch { gl = null; }
  if (!gl) return;

  const vertexSource = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0., 1.); }';
  const fragmentSource = `
    precision mediump float;
    uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uScroll;
    uniform vec3 uA; uniform vec3 uB;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
      return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
    }
    float fbm(vec2 p) { float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.3, 9.1); a *= .5; } return v; }
    // Jeden závoj: světlá spodní hrana, dlouhý dozvuk směrem nahoru a svislé paprsky.
    vec4 curtain(vec2 uv, float t, float seed, float height, float depth) {
      uv.x += uMouse.x * .05 * depth;
      float bend = fbm(vec2(uv.x * 1.4 + seed, t * .07 + seed));
      float edge = height + (bend - .5) * .46 - uScroll * .12 * depth + uMouse.y * .03 * depth;
      float d = edge - uv.y;
      float x = uv.x * 3. + bend * 2.4 + seed * 3.;
      float rays = fbm(vec2(x * 4.5, t * .22 + seed + uv.y * .5));
      rays = .25 + .75 * smoothstep(.25, .8, rays);
      float glow = smoothstep(-.11, .03, d) * exp(-max(d, 0.) * (3.4 + bend * 2.)) * rays;
      vec3 color = mix(uA, uB, clamp(d * 2.4 + bend * .5 - .1, 0., 1.));
      return vec4(color * glow, glow);
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / uRes; uv.y = 1. - uv.y; uv.x *= uRes.x / uRes.y * .6;
      float t = uTime + uScroll * 3.;
      vec4 far = curtain(uv * vec2(.8, 1.), t * .6, 1.7, .46, .4) * .5;
      vec4 mid = curtain(uv, t, 4.2, .58, .8) * .72;
      vec4 near = curtain(uv * vec2(1.25, 1.), t * 1.3, 8.9, .36, 1.4) * .6;
      // Pod úvodem záře zeslábne, aby nerušila čtení obsahu.
      vec3 color = (far.rgb + mid.rgb + near.rgb) * mix(1., .42, clamp(uScroll, 0., 1.));
      color += (hash(gl_FragCoord.xy + fract(uTime)) - .5) * .012;
      float alpha = clamp(max(color.r, max(color.g, color.b)), 0., 1.);
      gl_FragColor = vec4(clamp(color, 0., 1.), alpha);
    }`;
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  }
  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return;
  const program = gl.createProgram();
  gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniform = name => gl.getUniformLocation(program, name);
  const uRes = uniform('uRes'), uTime = uniform('uTime'), uMouse = uniform('uMouse'), uScroll = uniform('uScroll'), uA = uniform('uA'), uB = uniform('uB');

  const coarse = matchMedia('(pointer: coarse)');
  let frame = 0, last = 0, clock = 40, lost = false;
  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0, scroll = 0;
  const colorA = [.76, .65, 1], colorB = [.55, .59, .91], targetA = [...colorA], targetB = [...colorB];
  function readColors() {
    const style = getComputedStyle(root);
    const parse = (name, target) => {
      const parts = style.getPropertyValue(name).split(',').map(value => Number.parseFloat(value) / 255);
      if (parts.length === 3 && parts.every(Number.isFinite)) parts.forEach((value, index) => { target[index] = value; });
    };
    // --aurora-a-rgb / --aurora-b-rgb jsou ve výchozím stavu barvy motivu; nebe podle denní doby je jemně posouvá.
    parse('--aurora-a-rgb', targetA); parse('--aurora-b-rgb', targetB);
  }
  function resize() {
    // Záře je měkká, takže stačí zlomek rozlišení; šetří to GPU hlavně na mobilech.
    const scale = coarse.matches ? .33 : .5;
    const width = Math.max(2, Math.min(960, Math.round(innerWidth * scale)));
    const height = Math.max(2, Math.round(width * innerHeight / Math.max(1, innerWidth)));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; gl.viewport(0, 0, width, height); }
  }
  function render() {
    gl.uniform2f(uRes, canvas.width, canvas.height); gl.uniform1f(uTime, clock);
    gl.uniform2f(uMouse, mouseX, mouseY); gl.uniform1f(uScroll, scroll);
    gl.uniform3fv(uA, colorA); gl.uniform3fv(uB, colorB);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function loop(time) {
    if (document.hidden || window.siteCalm || lost) return;
    frame = requestAnimationFrame(loop);
    const delta = Math.min(time - last, 80);
    // Dotyková zařízení kreslí zhruba 30 snímků za sekundu.
    if (coarse.matches && delta < 30) return;
    last = time; clock += delta / 1000;
    const ease = 1 - Math.exp(-delta / 500);
    mouseX += (targetX - mouseX) * ease; mouseY += (targetY - mouseY) * ease;
    scroll += (Math.min(scrollY / Math.max(1, innerHeight), 3) - scroll) * ease;
    for (let index = 0; index < 3; index++) {
      colorA[index] += (targetA[index] - colorA[index]) * ease * .6;
      colorB[index] += (targetB[index] - colorB[index]) * ease * .6;
    }
    render();
  }
  function restart() {
    cancelAnimationFrame(frame);
    if (lost) return;
    resize(); readColors();
    if (window.siteCalm) {
      // Klidný režim: jeden statický snímek v cílových barvách.
      colorA.splice(0, 3, ...targetA); colorB.splice(0, 3, ...targetB);
      mouseX = mouseY = targetX = targetY = 0; scroll = 0; clock = 40; render();
    } else if (!document.hidden) { last = performance.now(); frame = requestAnimationFrame(loop); }
  }
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); lost = true; cancelAnimationFrame(frame); root.classList.remove('has-gl'); });
  canvas.addEventListener('webglcontextrestored', () => location.reload());
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || window.siteCalm) return;
    targetX = event.clientX / Math.max(1, innerWidth) - .5; targetY = event.clientY / Math.max(1, innerHeight) - .5;
  }, { passive: true });
  window.addEventListener('resize', () => { resize(); if (window.siteCalm) render(); });
  window.addEventListener('motionchange', restart);
  window.addEventListener('themechange', () => { readColors(); if (window.siteCalm) restart(); });
  window.addEventListener('skychange', () => { readColors(); if (window.siteCalm) restart(); });
  document.addEventListener('visibilitychange', restart);
  root.classList.add('has-gl');
  restart();
})();
