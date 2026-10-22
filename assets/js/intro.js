// The home page intro: a seedling in dark soil, both drawn in 1s and 0s. The bits blink slowly and the plant sways;
// the soil thins out toward the bottom of the screen, and scrolling dissolves the whole picture into the page.
// Drawn on canvas[data-intro]. (Until 2026-10-22 this was the longer "Seed to Signal" story film.)
(() => {
const TAU = Math.PI * 2, SWAY = 20;  // seconds per sway cycle
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const sm = (a, b, t) => ss((t - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a).toFixed(3)})`;
function RNG(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const P = { leafL: [210, 210, 210], leafD: [30, 30, 30], stemL: [220, 220, 220], stemD: [36, 36, 36], vein: [246, 246, 246], bokeh: [96, 96, 96] };

/* ---------- leaf (local units: base 0,0 to tip 1,0) ---------- */
const leafW = u => u <= 0 || u >= 1 ? 0 : 0.40 * Math.pow(Math.sin(Math.PI * u), 0.7) * (1 - 0.2 * u);
const OUT = [];
{ const n = 64; for (let i = 0; i <= n; i++) OUT.push([i / n, leafW(i / n)]); for (let i = n; i >= 0; i--) OUT.push([i / n, -leafW(i / n)]); }
const VEINS = [];
{ const mid = []; for (let i = 0; i <= 120; i++) mid.push([i / 120 * 0.97, 0]); VEINS.push({ pts: mid, mid: true });
  for (let i = 0; i < 6; i++) {
    const u0 = 0.10 + i * 0.135, u1 = Math.min(0.95, u0 + 0.24);
    for (const s of [1, -1]) {
      const p = [], cx = u0 + 0.05, cy = s * leafW(u0 + 0.08) * 0.62, ex = u1, ey = s * leafW(u1) * 0.86;
      for (let j = 0; j <= 48; j++) { const a = j / 48; p.push([(1 - a) * (1 - a) * u0 + 2 * (1 - a) * a * cx + a * a * ex, 2 * (1 - a) * a * cy + a * a * ey]); }
      VEINS.push({ pts: p });
    }
  }
}

/* ---------- soil (world units: soil line y = 0, down is +y) ---------- */
const NB = 8, GR = Array.from({ length: NB }, () => []);  // grains, bucketed by brightness
{ const rG = RNG(3);
  for (let i = 0; i < 9000; i++) {
    const crumb = rG() < .3, x = lerp(-950, 950, rG()), y = crumb ? lerp(-4, 10, rG()) : lerp(0, 700, rG());
    const s = crumb ? lerp(1.5, 4.2, rG()) : lerp(0.7, 2.8, rG());
    const b = (0.05 + 0.95 * Math.exp(-((x + 60) ** 2 + (y + 10) ** 2) / (2 * 190 * 190))) * lerp(.35, 1, rG());
    GR[Math.min(NB - 1, (b * NB) | 0)].push({ x, y, s });
  }
}
const BOKEH = []; { const rB = RNG(11); for (let i = 0; i < 18; i++) BOKEH.push({ x: lerp(-700, 700, rB()), y: lerp(-90, -12, rB()), r: lerp(8, 30, rB()), a: lerp(.03, .09, rB()) }); }

/* ---------- canvas ---------- */
const cv = document.querySelector('canvas[data-intro]');
if (!cv) return;
const ctx = cv.getContext('2d');
let W = 1600, H = 900, U = 900, DPR = 1;

/* ---------- binary layer ----------
   The scene renders into a small canvas with one pixel per character cell; each lit cell becomes a 1 or 0
   whose grey follows that pixel's brightness (like the binary mark). */
const SB = document.createElement('canvas'), sctx = SB.getContext('2d', { willReadFrequently: true });
const ATL = document.createElement('canvas'), actx = ATL.getContext('2d');
const LV = 12;  // grey levels in the glyph atlas
let cw = 6, ch = 8, cols = 1, rows = 1, bits = new Uint8Array(1), drop = new Float32Array(1), base = new Float32Array(1);
let gone = 0, bgA = 1;  // scroll dissolve: share of bits dropped, and how much of the black backdrop is left
const FADE = [.7, 1];   // the soil thins out over this band of the screen height, so it runs into the page below
function buildAtlas() {
  ATL.width = cw * 2; ATL.height = ch * LV; actx.clearRect(0, 0, ATL.width, ATL.height);
  actx.font = `700 ${(ch * 1.05).toFixed(1)}px "Courier Prime", "Courier New", monospace`;
  actx.textAlign = 'center'; actx.textBaseline = 'middle';
  for (let l = 1; l < LV; l++) { const g = Math.round(255 * l / (LV - 1)); actx.fillStyle = `rgb(${g},${g},${g})`;
    for (let b = 0; b < 2; b++) actx.fillText(b ? '1' : '0', cw * b + cw / 2, ch * l + ch * .54); }
}
function buildGrid() {
  cw = Math.max(4, Math.round(6 * DPR)); ch = Math.round(cw * 1.3);
  cols = Math.ceil(W / cw); rows = Math.ceil(H / ch); SB.width = cols; SB.height = rows;
  bits = new Uint8Array(cols * rows); drop = new Float32Array(cols * rows); base = new Float32Array(rows);
  for (let i = 0; i < bits.length; i++) { bits[i] = Math.random() < .5 ? 1 : 0; drop[i] = Math.random(); }
  for (let j = 0; j < rows; j++) base[j] = Math.pow(sm(FADE[0], FADE[1], (j + .5) / rows), 1.3);
  buildAtlas();
}
function bitLayer() {  // clears the small canvas and returns it, set up to draw in full-size coordinates
  sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalCompositeOperation = 'source-over';
  sctx.fillStyle = '#000'; sctx.fillRect(0, 0, cols, rows); sctx.setTransform(1 / cw, 0, 0, 1 / ch, 0, 0);
  return sctx;
}
function drawBits(c) {
  const d = sctx.getImageData(0, 0, cols, rows).data;
  for (let n = (bits.length * .004) | 0; n > 0; n--) bits[(Math.random() * bits.length) | 0] ^= 1;  // a slow blink
  for (let j = 0, i = 0; j < rows; j++) {
    const cut = Math.max(gone, base[j]);
    for (let x = 0; x < cols; x++, i++) {
      const p = i * 4, v = Math.max(d[p], d[p + 1], d[p + 2]) / 255;
      if (v < .045 || drop[i] < cut) continue;
      const l = Math.min(LV - 1, Math.round(Math.pow(v, .75) * (LV - 1)));
      if (l > 0) c.drawImage(ATL, bits[i] * cw, l * ch, cw, ch, x * cw, j * ch, cw, ch);
    }
  }
}

function resize() {
  const r = cv.getBoundingClientRect(); DPR = Math.min(1.5, window.devicePixelRatio || 1);
  W = Math.max(2, Math.round(r.width * DPR)); H = Math.max(2, Math.round(r.height * DPR));
  cv.width = W; cv.height = H;
  U = Math.min(H, W * 1.2);  // scene scale: fit height, or width on tall phone screens
  buildGrid();
}

/* ---------- the seedling ---------- */
const CAM = { x: 0, y: -70, s: 1.9 };  // soil line a little below the middle, plenty of soil under it
function seedT(t) { const sw = 0.03 * Math.sin(TAU * t / SWAY); return { sw, T: [-3 + 150 * sw, -168] }; }
function leafMat(t, right) {
  const { sw, T } = seedT(t), k = U / 1000 * CAM.s;
  return { ox: W / 2 + (T[0] - CAM.x) * k, oy: H / 2 + (T[1] - CAM.y) * k, sc: (right ? 92 : 86) * k, an: (right ? -0.40 : Math.PI + 0.46) + sw * 1.2 };
}
const mapM = (M, u, v) => { const c = Math.cos(M.an), s = Math.sin(M.an); return [M.ox + M.sc * (c * u - s * v), M.oy + M.sc * (s * u + c * v)]; };
function drawLeaf(c, M, P, a) {
  if (a <= 0) return;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  c.beginPath();
  OUT.forEach((p, i) => { const q = mapM(M, p[0], p[1]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]);
    x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); });
  c.closePath();
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, rgba(P.leafL, a)); g.addColorStop(.55, rgba(mix(P.leafL, P.leafD, .62), a)); g.addColorStop(1, rgba(P.leafD, a));
  c.fillStyle = g; c.fill();
  c.save(); c.clip();
  const r = Math.max(1, (x1 - x0) * .9), rg = c.createRadialGradient(x0, y0, 0, x0, y0, r);
  rg.addColorStop(0, rgba(mix(P.leafL, [255, 255, 255], .3), .38 * a)); rg.addColorStop(1, rgba(P.leafL, 0));
  c.fillStyle = rg; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  c.restore();
  const lw = Math.max(.6 * DPR, M.sc * .005);
  for (const v of VEINS) {
    c.beginPath(); v.pts.forEach((p, i) => { const q = mapM(M, p[0], p[1]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); });
    c.strokeStyle = rgba(P.vein, (v.mid ? .42 : .3) * a); c.lineWidth = v.mid ? lw * 1.6 : lw; c.stroke();
  }
}
function drawStem(c, X, Y, P, a, T) {
  if (a <= 0) return;
  const N = 28, pts = [], B = [[0, 2], [5, -60], [-7, -118], T];
  for (let i = 0; i <= N; i++) { const u = i / N, v = 1 - u;
    pts.push([v * v * v * B[0][0] + 3 * v * v * u * B[1][0] + 3 * v * u * u * B[2][0] + u * u * u * B[3][0],
              v * v * v * B[0][1] + 3 * v * v * u * B[1][1] + 3 * v * u * u * B[2][1] + u * u * u * B[3][1]]); }
  const L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const p = pts[i], a0 = pts[Math.max(0, i - 1)], a1 = pts[Math.min(N, i + 1)];
    let dx = a1[0] - a0[0], dy = a1[1] - a0[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const w = lerp(3.4, 2.1, i / N);
    L.push([p[0] - dy * w, p[1] + dx * w]); R.push([p[0] + dy * w, p[1] - dx * w]);
  }
  c.beginPath(); L.forEach((p, i) => i ? c.lineTo(X(p[0]), Y(p[1])) : c.moveTo(X(p[0]), Y(p[1])));
  for (let i = N; i >= 0; i--) c.lineTo(X(R[i][0]), Y(R[i][1])); c.closePath();
  const g = c.createLinearGradient(X(T[0] - 8), 0, X(T[0] + 8), 0);
  g.addColorStop(0, rgba(P.stemL, a)); g.addColorStop(.5, rgba(mix(P.stemL, P.stemD, .55), a)); g.addColorStop(1, rgba(P.stemD, a));
  c.fillStyle = g; c.fill();
}

function render(t) {
  const k = U / 1000 * CAM.s, X = x => W / 2 + (x - CAM.x) * k, Y = y => H / 2 + (y - CAM.y) * k, { T } = seedT(t);
  ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = `rgba(0,0,0,${bgA.toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  const b = bitLayer();
  for (const bk of BOKEH) { const x = X(bk.x), y = Y(bk.y), r = bk.r * k, g = b.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(P.bokeh, bk.a * 4)); g.addColorStop(1, rgba(P.bokeh, 0)); b.fillStyle = g; b.fillRect(x - r, y - r, 2 * r, 2 * r); }
  const top = Math.max(0, Y(0));
  if (top < H) {
    b.fillStyle = 'rgb(30,30,30)'; b.fillRect(0, top, W, H - top);                     // every soil cell holds a bit
    const g = b.createLinearGradient(0, Y(0), 0, Y(220)); g.addColorStop(0, 'rgba(70,70,70,1)'); g.addColorStop(1, 'rgba(70,70,70,0)');
    b.fillStyle = g; b.fillRect(0, top, W, H - top);
    const pg = b.createRadialGradient(X(-50), Y(4), 0, X(-50), Y(4), 320 * k);
    pg.addColorStop(0, 'rgba(150,150,150,.7)'); pg.addColorStop(1, 'rgba(150,150,150,0)'); b.fillStyle = pg; b.fillRect(0, top, W, H - top);
  }
  const y1 = CAM.y + 500 / CAM.s + 10, xr = W / 2 / k + 10;
  for (let bi = 0; bi < NB; bi++) { b.beginPath();
    for (const g of GR[bi]) { if (g.y > y1 || Math.abs(g.x - CAM.x) > xr) continue; const s = Math.max(cw * .8, g.s * k); b.rect(X(g.x) - s / 2, Y(g.y) - s / 2, s, s); }
    b.fillStyle = rgba(mix([0, 0, 0], [230, 230, 230], (bi + 1) / NB), 1); b.fill(); }
  drawStem(b, X, Y, P, 1, T);
  drawLeaf(b, leafMat(t, false), P, 1);
  drawLeaf(b, leafMat(t, true), P, 1);
  drawBits(ctx);
  const v = ctx.createRadialGradient(W * .44, H * .46, H * .16, W * .5, H * .5, W * .78);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${(.93 * bgA).toFixed(3)})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

/* ---------- playback ----------
   The picture loops gently on its own (blink and sway). Scrolling one screen dissolves it into the page:
   the bits drop out, the black thins, then the canvas fades (CSS: .intro.merge sits above the stage). */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const intro = cv.closest('.intro'), cue = intro && intro.querySelector('.cue');
let screen = 1, p = 0, t0 = performance.now(), last = 0;
function onScroll() {
  p = clamp(window.scrollY / (screen * 1.1));
  gone = sm(0, .75, p); bgA = 1 - sm(.1, .8, p);
  cv.style.opacity = String(1 - sm(.55, 1, p));
  if (cue) cue.style.opacity = String(1 - sm(0, .3, p));
}
function frame(now) {
  if (p < 1 && now - last > 33) { last = now; render((now - t0) / 1000); }  // ~30 fps is plenty for a blink
  requestAnimationFrame(frame);
}
resize();
document.fonts && document.fonts.ready.then(buildAtlas);
if (reduce || !intro) {
  // a still picture and the normal page
  new ResizeObserver(() => { resize(); render(0); }).observe(cv);
  render(0); document.fonts && document.fonts.ready.then(() => render(0));
} else {
  intro.classList.add('merge');
  screen = cv.clientHeight || 1; onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  new ResizeObserver(() => { resize(); screen = cv.clientHeight || 1; onScroll(); }).observe(cv);
  if (cue) cue.addEventListener('click', e => { e.preventDefault(); window.scrollBy({ top: screen, behavior: 'smooth' }); });
  requestAnimationFrame(frame);
}
})();
