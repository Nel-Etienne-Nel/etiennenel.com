// Seed to Signal: the home page intro film. A seedling's roots carry the bits of "Etienne",
// straighten into circuit traces, run into a chip, open into a network that is a leaf's veins,
// and return to the seedling. 20 s, seamless loop, drawn live on canvas[data-intro].
(() => {
const TAU = Math.PI * 2, DUR = 20, CHIPY = 1010;
const SEQ = "01000101011101000110100101100101011011100110111001100101";
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const sm = (a, b, t) => ss((t - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a).toFixed(3)})`;
function RNG(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const PAL = {
  mono: { leafL:[210,210,210], leafD:[30,30,30], stemL:[220,220,220], stemD:[36,36,36], vein:[246,246,246],
    soil:[26,26,26], grain:[118,118,118], rootO:[196,196,196], glowO:[140,140,140], circ:[240,240,240], glowC:[255,255,255], bokeh:[96,96,96] }
};
const pal = () => PAL.mono;

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
const P0 = [0.505, 0];
const rM = RNG(7), MESH = [], EDGES = [];
{ const g = 0.03, idx = new Map();
  for (let ix = 0; ix <= 34; ix++) for (let iy = -14; iy <= 14; iy++) {
    const u = ix * g + (rM() - .5) * g * .7, v = iy * g + (rM() - .5) * g * .7;
    if (u > 0.02 && u < 0.98 && Math.abs(v) < leafW(u) * 0.93) { idx.set(ix + ',' + iy, MESH.length); MESH.push([u, v]); }
  }
  for (const [key, a] of idx) {
    const [ix, iy] = key.split(',').map(Number);
    for (const [dx, dy, p] of [[1, 0, .88], [0, 1, .88], [1, 1, .3], [1, -1, .2]]) {
      const b = idx.get((ix + dx) + ',' + (iy + dy)); if (b !== undefined && rM() < p) EDGES.push([a, b]);
    }
  }
}
const FRAGS = ["01000101", "0x45 E", "01110100", "t", "01101001", "i · 0x69", "e,", "n = 7", "56 bits", "01101110", "→ root", "depth 3", "w .82", "{ node }", "</>", "id 412", "vein 07", "01100101"];
const LABELS = [];
for (let i = 0; i < 46; i++) {
  const ty = i % 5 === 3 ? 'spark' : i % 5 === 4 ? 'bars' : 'text', vals = [];
  for (let j = 0; j < 9; j++) vals.push(rM());
  LABELS.push({ n: (rM() * MESH.length) | 0, ty, txt: FRAGS[i % FRAGS.length], vals });
}

/* ---------- roots (world units: soil line y = 0, down is +y) ---------- */
const rR = RNG(21);
function organic(ang, len, n, curl, grav) {
  const o = [[0, 0]]; let x = 0, y = 0, a = ang; const st = len / (n - 1);
  for (let i = 1; i < n; i++) { a += (rR() - .5) * curl; a += (Math.PI / 2 - a) * grav; x += Math.cos(a) * st; y += Math.sin(a) * st; o.push([x, y]); }
  return o;
}
function resample(poly, n) {
  const L = [0]; for (let i = 1; i < poly.length; i++) L.push(L[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  const tot = L[L.length - 1], out = []; let j = 0;
  for (let i = 0; i < n; i++) { const d = tot * i / (n - 1); while (j < poly.length - 2 && L[j + 1] < d) j++;
    const f = (d - L[j]) / ((L[j + 1] - L[j]) || 1); out.push([lerp(poly[j][0], poly[j + 1][0], f), lerp(poly[j][1], poly[j + 1][1], f)]); }
  return out;
}
function hairs(n) { const h = []; for (let i = 2; i < n - 1; i += 2) if (rR() < .7) h.push({ i, s: rR() < .5 ? 1 : -1, l: 2 + rR() * 5 }); return h; }
const TAP = { o: organic(Math.PI / 2, 640, 64, 0.12, 0.08), c: resample([[0, 0], [0, 900]], 64), h: hairs(64) };
const LAT = [];
for (let i = 0; i < 14; i++) {
  const side = i % 2 ? 1 : -1, n = 36;
  const ti = Math.round(lerp(5, 50, i / 13) + (rR() - .5) * 2);
  const len = lerp(180, 300, rR()) * (1 - 0.35 * i / 14);
  const sp = lerp(0.15, 0.6, rR()), ang = side > 0 ? sp : Math.PI - sp;
  const o = organic(ang, len, n, 0.22, 0.02);
  const a = len * lerp(.25, .45, rR()), b = len * lerp(.2, .35, rR()), c = Math.max(20, len - a - b), r2 = .7071;
  const poly = rR() < .6
    ? [[0, 0], [side * a, 0], [side * (a + b * r2), b * r2], [side * (a + b * r2), b * r2 + c]]
    : [[0, 0], [side * a * r2, a * r2], [side * (a * r2 + b + c), a * r2]];
  const kids = [];
  for (let k = 0, nk = 1 + (rR() * 2 | 0); k < nk; k++) {
    const j = Math.round(lerp(10, 30, rR())), l = lerp(40, 90, rR());
    const pa = Math.atan2(o[j][1] - o[j - 1][1], o[j][0] - o[j - 1][0]);
    const co = organic(pa + (rR() < .5 ? -1 : 1) * 0.7, l, 14, 0.3, 0.03);
    const cp = rR() < .5 ? [[0, 0], [side * l * .4, l * .4], [side * l * .4, l * .85]] : [[0, 0], [0, l * .5], [side * l * .35, l * .5 + l * .35]];
    kids.push({ j, o: co, c: resample(cp, 14), h: hairs(14) });
  }
  LAT.push({ ti, o, c: resample(poly, n), h: hairs(n), kids });
}
/* chip */
const PINS = [], FAN = [];
{ const rF = RNG(99), h = 110, step = 220 / 14;
  for (let side = 0; side < 4; side++) for (let i = 0; i < 14; i++) {
    const q = -h + (i + .5) * step;
    let px, py, d, pp, rect;
    if (side === 0) { px = q; py = CHIPY - h; d = [0, -1]; pp = [1, 0]; rect = [q - 2, CHIPY - h - 14, 4, 14]; }
    if (side === 1) { px = h; py = CHIPY + q; d = [1, 0]; pp = [0, 1]; rect = [h, CHIPY + q - 2, 14, 4]; }
    if (side === 2) { px = q; py = CHIPY + h; d = [0, 1]; pp = [1, 0]; rect = [q - 2, CHIPY + h, 4, 14]; }
    if (side === 3) { px = -h; py = CHIPY + q; d = [-1, 0]; pp = [0, 1]; rect = [-h - 14, CHIPY + q - 2, 14, 4]; }
    PINS.push(rect);
    if ((side === 0 && (i === 6 || i === 7)) || rF() < .3) continue;
    const l = lerp(40, 170, rF()), sg = rF() < .5 ? -1 : 1;
    const e = [px + d[0] * 14, py + d[1] * 14], m1 = [e[0] + d[0] * l * .4, e[1] + d[1] * l * .4];
    FAN.push([e, m1, [m1[0] + (d[0] + pp[0] * sg) * l * .3, m1[1] + (d[1] + pp[1] * sg) * l * .3]]);
  }
}
/* soil grains, bucketed by brightness */
const NB = 8, GR = Array.from({ length: NB }, () => []);
{ const rG = RNG(3);
  for (let i = 0; i < 9000; i++) {
    const crumb = rG() < .3, x = lerp(-950, 950, rG()), y = crumb ? lerp(-4, 10, rG()) : lerp(0, 1150, rG());
    const s = crumb ? lerp(1.5, 4.2, rG()) : lerp(0.7, 2.8, rG());
    const b = (0.05 + 0.95 * Math.exp(-((x + 60) ** 2 + (y + 10) ** 2) / (2 * 190 * 190))) * lerp(.35, 1, rG());
    GR[Math.min(NB - 1, (b * NB) | 0)].push({ x, y, s });
  }
}
const BOKEH = []; { const rB = RNG(11); for (let i = 0; i < 18; i++) BOKEH.push({ x: lerp(-700, 700, rB()), y: lerp(-90, -12, rB()), r: lerp(8, 30, rB()), a: lerp(.03, .09, rB()) }); }
const DUST = []; { const rD = RNG(5); for (let i = 0; i < 320; i++) DUST.push({ a: rD() * TAU, r: Math.pow(rD(), .7), s: rD() * 1.6 + .4, tw: rD() * TAU, b: rD() }); }

/* ---------- canvas ---------- */
const cv = document.querySelector('canvas[data-intro]');
if (!cv) return;
const ctx = cv.getContext('2d');
const NL = document.createElement('canvas'), nctx = NL.getContext('2d');
let W = 1600, H = 900, U = 900, DPR = 1;
/* ---------- binary layer: soil and seedling are drawn as 1s and 0s ----------
   The soil and seedling render into a small canvas with one pixel per character cell; each lit
   cell becomes a 1 or 0 whose grey follows that pixel's brightness (like the binary mark). */
const SB = document.createElement('canvas'), sctx = SB.getContext('2d', { willReadFrequently: true });
const ATL = document.createElement('canvas'), actx = ATL.getContext('2d');
const LV = 12;  // grey levels in the glyph atlas
let cw = 6, ch = 8, cols = 1, rows = 1, bits = new Uint8Array(1), drop = new Float32Array(1);
let gone = 0, bgA = 1;  // scroll dissolve: share of bits dropped, and how much of the black backdrop is left
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
  bits = new Uint8Array(cols * rows); drop = new Float32Array(cols * rows);
  for (let i = 0; i < bits.length; i++) { bits[i] = Math.random() < .5 ? 1 : 0; drop[i] = Math.random(); }
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
  for (let j = 0, i = 0; j < rows; j++) for (let x = 0; x < cols; x++, i++) {
    const p = i * 4, v = Math.max(d[p], d[p + 1], d[p + 2]) / 255;
    if (v < .045 || drop[i] < gone) continue;
    const l = Math.min(LV - 1, Math.round(Math.pow(v, .75) * (LV - 1)));
    if (l > 0) c.drawImage(ATL, bits[i] * cw, l * ch, cw, ch, x * cw, j * ch, cw, ch);
  }
}

function resize() {
  const r = cv.getBoundingClientRect(); DPR = Math.min(1.5, window.devicePixelRatio || 1);
  W = Math.max(2, Math.round(r.width * DPR)); H = Math.max(2, Math.round(r.height * DPR));
  cv.width = NL.width = W; cv.height = NL.height = H;
  U = Math.min(H, W * 1.2);  // scene scale: fit height, or width on tall phone screens
  buildGrid();
}

/* ---------- camera ---------- */
const CA = { x: 0, y: -112, s: 1.9 }, CB = { x: 0, y: 300, s: 1.02 }, CC = { x: 0, y: 430, s: 0.92 };
function camAt(t) {
  if (t < 2) return CA;
  if (t < 6.3) { const q = ss((t - 2) / 4.3); return { x: 0, y: lerp(CA.y, CB.y, q), s: Math.exp(lerp(Math.log(CA.s), Math.log(CB.s), q)) }; }
  if (t < 9.2) { const q = ss((t - 6.3) / 2.9); return { x: 0, y: lerp(CB.y, CC.y, q), s: lerp(CB.s, CC.s, q) }; }
  const q = clamp((t - 9.2) / 2.8);
  return { x: 0, y: lerp(CC.y, CHIPY, ss(clamp((t - 9.2) / 1.9))), s: CC.s * Math.pow(28 / CC.s, Math.pow(q, 2.2)) };
}
function seedT(t) { const sw = 0.03 * Math.sin(TAU * t / DUR); return { sw, T: [-3 + 150 * sw, -168] }; }
function leafMat(t, cam, right) {
  const { sw, T } = seedT(t), k = U / 1000 * cam.s;
  return { ox: W / 2 + (T[0] - cam.x) * k, oy: H / 2 + (T[1] - cam.y) * k, sc: (right ? 92 : 86) * k, an: (right ? -0.40 : Math.PI + 0.46) + sw * 1.2 };
}
const mapM = (M, u, v) => { const c = Math.cos(M.an), s = Math.sin(M.an); return [M.ox + M.sc * (c * u - s * v), M.oy + M.sc * (s * u + c * v)]; };
function netM(t) {
  const E = leafMat(t, CA, true), pe = mapM(E, P0[0], P0[1]);
  if (t >= 19.5) return Object.assign(E, { px: pe[0], py: pe[1] });
  const q = ss((t - 12.55) / 6.95);
  const sc = Math.exp(lerp(Math.log(55 * U), Math.log(E.sc), q)), an = lerp(E.an - 1.15, E.an, q);
  const px = lerp(W / 2, pe[0], q), py = lerp(H / 2, pe[1], q), c = Math.cos(an), s = Math.sin(an);
  return { ox: px - sc * (c * P0[0] - s * P0[1]), oy: py - sc * (s * P0[0] + c * P0[1]), sc, an, px, py };
}

/* ---------- helpers ---------- */
function poly(c, pts, X, Y) { c.beginPath(); c.moveTo(X(pts[0][0]), Y(pts[0][1])); for (let i = 1; i < pts.length; i++) c.lineTo(X(pts[i][0]), Y(pts[i][1])); }
function arcLen(pts) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); L.tot = L[L.length - 1]; return L; }
function at(pts, L, s) {
  if (s <= 0) return pts[0]; if (s >= L.tot) return pts[pts.length - 1];
  let lo = 0, hi = L.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= s) lo = m; else hi = m; }
  const f = (s - L[lo]) / ((L[hi] - L[lo]) || 1); return [lerp(pts[lo][0], pts[hi][0], f), lerp(pts[lo][1], pts[hi][1], f)];
}
function morph(o, cp, m, bx, by, n) { const out = new Array(n); for (let i = 0; i < n; i++) out[i] = [bx + lerp(o[i][0], cp[i][0], m), by + lerp(o[i][1], cp[i][1], m)]; return out; }
function glowDot(c, x, y, r, col, a) {
  if (r <= 0 || a <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba([255, 255, 255], a)); g.addColorStop(.25, rgba(col, a * .7)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r);
}

/* ---------- seedling ---------- */
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

/* ---------- underground ---------- */
function drawRoots(c, t, k, X, Y, P, m, rA) {
  const conv = sm(9.2, 10.5, t), tb = sm(9.3, 10.6, t);
  const tp = morph(TAP.o, TAP.c, m, 0, 0, TAP.o.length);
  const paths = [{ pts: tp, w: lerp(3.4, 2.2, m) + 2.2 * tb, tap: true, h: TAP.h }];
  if (conv < .999) for (const L of LAT) {
    const b = tp[L.ti], n = Math.max(2, Math.ceil(L.o.length * (1 - conv)));
    const pts = morph(L.o, L.c, m, b[0], b[1], n);
    paths.push({ pts, w: lerp(1.7, 1.3, m), h: L.h, via: n === L.o.length });
    for (const C of L.kids) { if (C.j >= n) continue;
      const cb = pts[C.j], cn = Math.max(2, Math.ceil(C.o.length * (1 - conv)));
      paths.push({ pts: morph(C.o, C.c, m, cb[0], cb[1], cn), w: 1, h: C.h, kid: true, via: cn === C.o.length }); }
  }
  const col = mix(P.rootO, P.circ, m), glow = mix(P.glowO, P.glowC, m);
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.globalCompositeOperation = 'lighter';
  for (const p of paths) { poly(c, p.pts, X, Y); c.strokeStyle = rgba(glow, (p.tap ? .1 + .3 * tb : .08) * rA); c.lineWidth = p.w * k * 4; c.stroke(); }
  c.globalCompositeOperation = 'source-over';
  for (const p of paths) { poly(c, p.pts, X, Y);
    c.strokeStyle = rgba(p.tap ? mix(col, [255, 255, 255], tb) : col, (.5 + .4 * m + (p.tap ? .1 : 0)) * rA);
    c.lineWidth = Math.max(.7 * DPR, p.w * k); c.stroke(); }
  const ha = (1 - m) * rA * .45;
  if (ha > .01) { c.beginPath();
    for (const p of paths) for (const h of p.h) { if (h.i >= p.pts.length - 1) continue;
      const a = p.pts[h.i - 1], b = p.pts[h.i + 1], q = p.pts[h.i]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      c.moveTo(X(q[0]), Y(q[1])); c.lineTo(X(q[0] - dy * h.s * h.l + dx * h.l * .4), Y(q[1] + dx * h.s * h.l + dy * h.l * .4)); }
    c.strokeStyle = rgba(P.rootO, ha); c.lineWidth = Math.max(.5 * DPR, .5 * k); c.stroke(); }
  if (m > .05) { c.beginPath();
    for (const p of paths) { if (!p.via) continue; const q = p.pts[p.pts.length - 1]; c.moveTo(X(q[0]) + 2.6 * k, Y(q[1])); c.arc(X(q[0]), Y(q[1]), 2.6 * k, 0, TAU); }
    c.strokeStyle = rgba(P.circ, m * .8 * rA); c.lineWidth = Math.max(.7 * DPR, .9 * k); c.stroke(); }
  const pa = sm(4.4, 5.2, t) * (1 - sm(6.8, 7.8, t)) * rA;
  if (pa > .01) { c.globalCompositeOperation = 'lighter';
    paths.forEach((p, i) => { if (p.kid) return; const A = arcLen(p.pts);
      for (let j = 0; j < 2; j++) { const f = ((t - 4.4) * .32 + i * .137 + j * .5) % 1, q = at(p.pts, A, f * A.tot);
        glowDot(c, X(q[0]), Y(q[1]), 6 * k, mix(P.glowO, [255, 236, 200], .4), pa); } });
    c.globalCompositeOperation = 'source-over'; }
  const da = sm(6.0, 7.2, t) * (1 - sm(10.8, 11.5, t)) * rA;
  if (da > .01) {
    c.font = `500 ${Math.max(6, 8.5 * k).toFixed(1)}px "IBM Plex Mono", monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = rgba(mix([255, 236, 205], P.circ, m), da * .92);
    paths.forEach((p, i) => { if (p.kid) return; const A = arcLen(p.pts), sp = 11, tt = (t - 6) * 24 * (p.tap ? 1 + 2 * tb : 1), ph = i * 7;
      for (let q = Math.ceil(-tt / sp), q1 = Math.floor((A.tot - tt) / sp); q <= q1; q++) {
        const pt = at(p.pts, A, q * sp + tt); c.fillText(SEQ[((q + ph) % 56 + 56) % 56], X(pt[0]), Y(pt[1])); } });
  }
  const la = sm(9.4, 10.0, t) * rA;
  if (la > .01) { c.globalCompositeOperation = 'lighter'; const A = arcLen(tp);
    for (let j = 0; j < 7; j++) { const q = at(tp, A, (((t - 9.4) * .8 + j / 7) % 1) * A.tot); glowDot(c, X(q[0]), Y(q[1]), 8 * k, P.glowC, la); }
    c.globalCompositeOperation = 'source-over'; }
}
function drawChip(c, k, X, Y, P, a) {
  const lw = Math.max(.7 * DPR, 1.1 * k);
  c.beginPath(); for (const f of FAN) { c.moveTo(X(f[0][0]), Y(f[0][1])); c.lineTo(X(f[1][0]), Y(f[1][1])); c.lineTo(X(f[2][0]), Y(f[2][1])); }
  c.strokeStyle = rgba(P.circ, .35 * a); c.lineWidth = lw; c.stroke();
  c.beginPath(); for (const f of FAN) { const e = f[2]; c.moveTo(X(e[0]) + 2.6 * k, Y(e[1])); c.arc(X(e[0]), Y(e[1]), 2.6 * k, 0, TAU); } c.stroke();
  c.fillStyle = rgba(P.circ, .55 * a); for (const p of PINS) c.fillRect(X(p[0]), Y(p[1]), p[2] * k, p[3] * k);
  c.fillStyle = rgba([9, 9, 11], a); c.fillRect(X(-110), Y(CHIPY - 110), 220 * k, 220 * k);
  c.strokeStyle = rgba(P.circ, .6 * a); c.lineWidth = Math.max(DPR, 1.2 * k); c.strokeRect(X(-110), Y(CHIPY - 110), 220 * k, 220 * k);
  c.strokeStyle = rgba(P.circ, .5 * a); c.lineWidth = lw; c.strokeRect(X(-46), Y(CHIPY - 46), 92 * k, 92 * k);
  c.beginPath(); for (let g = -42; g <= 42; g += 4) { c.moveTo(X(g), Y(CHIPY - 46)); c.lineTo(X(g), Y(CHIPY + 46)); c.moveTo(X(-46), Y(CHIPY + g)); c.lineTo(X(46), Y(CHIPY + g)); }
  c.strokeStyle = rgba(P.circ, .1 * a); c.lineWidth = Math.max(.5 * DPR, .4 * k); c.stroke();
  c.fillStyle = rgba(P.circ, .9 * a); c.fillRect(X(-7), Y(CHIPY - 7), 14 * k, 14 * k);
}

/* ---------- the world: seedling, soil, roots, chip ---------- */
function drawWorld(c, t, cam, o) {
  const P = pal(), k = U / 1000 * cam.s, X = x => W / 2 + (x - cam.x) * k, Y = y => H / 2 + (y - cam.y) * k;
  const m = o.under ? sm(6.2, 9.4, t) : 0, ra = o.ra * (1 - m), { T } = seedT(t);
  const b = bitLayer();
  if (ra > .002) {
    for (const bk of BOKEH) { const x = X(bk.x), y = Y(bk.y), r = bk.r * k, g = b.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(P.bokeh, bk.a * 4 * ra)); g.addColorStop(1, rgba(P.bokeh, 0)); b.fillStyle = g; b.fillRect(x - r, y - r, 2 * r, 2 * r); }
    const top = Math.max(0, Y(0));
    if (top < H) {
      b.fillStyle = rgba([30, 30, 30], ra); b.fillRect(0, top, W, H - top);                     // every soil cell holds a bit
      const g = b.createLinearGradient(0, Y(0), 0, Y(220)); g.addColorStop(0, rgba([70, 70, 70], ra)); g.addColorStop(1, rgba([70, 70, 70], 0));
      b.fillStyle = g; b.fillRect(0, top, W, H - top);
      const pg = b.createRadialGradient(X(-50), Y(4), 0, X(-50), Y(4), 320 * k);
      pg.addColorStop(0, rgba([150, 150, 150], .7 * ra)); pg.addColorStop(1, rgba([150, 150, 150], 0)); b.fillStyle = pg; b.fillRect(0, top, W, H - top);
    }
    const y0 = cam.y - 500 / cam.s - 10, y1 = cam.y + 500 / cam.s + 10, xr = W / 2 / k + 10;
    for (let bi = 0; bi < NB; bi++) { b.beginPath();
      for (const g of GR[bi]) { if (g.y < y0 || g.y > y1 || Math.abs(g.x - cam.x) > xr) continue; const s = Math.max(cw * .8, g.s * k); b.rect(X(g.x) - s / 2, Y(g.y) - s / 2, s, s); }
      b.fillStyle = rgba(mix([0, 0, 0], [230, 230, 230], (bi + 1) / NB), ra); b.fill(); }
  }
  drawStem(b, X, Y, P, o.ra, T);
  drawLeaf(b, leafMat(t, cam, false), P, o.ra);
  drawLeaf(b, o.leafM || leafMat(t, cam, true), P, o.leafM ? o.leafA : o.ra);
  drawBits(c);
  if (o.under) {
    const rA = sm(2.4, 4.6, t); if (rA > 0) drawRoots(c, t, k, X, Y, P, m, rA);
    const chA = sm(8.6, 10, t); if (chA > 0) drawChip(c, k, X, Y, P, chA);
  }
  const v = c.createRadialGradient(W * .44, H * .46, H * .16, W * .5, H * .5, W * .78);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${(.93 * bgA).toFixed(3)})`); c.fillStyle = v; c.fillRect(0, 0, W, H);
}

/* ---------- the network: expansion, then the leaf ---------- */
function drawNet(t, P) {
  const M = netM(t), n = nctx, mp = (u, v) => mapM(M, u, v);
  n.globalCompositeOperation = 'source-over'; n.clearRect(0, 0, W, H);
  const meshA = 1 - sm(17.2, 18.9, t), labA = sm(13.3, 14.5, t) * (1 - sm(16.3, 17.4, t));
  const strA = sm(13, 14, t) * (1 - sm(17.4, 18.6, t)), vA = 1 - sm(18.9, 19.75, t), vk = sm(17.6, 19.2, t);
  if (meshA > .01) {
    n.beginPath(); for (const e of EDGES) { const a = mp(...MESH[e[0]]), b = mp(...MESH[e[1]]); n.moveTo(a[0], a[1]); n.lineTo(b[0], b[1]); }
    n.strokeStyle = rgba(P.circ, .2 * meshA); n.lineWidth = clamp(M.sc * .0008, .6, 1.2) * DPR; n.stroke();
    const r = clamp(M.sc * .0025, .8, 2.2) * DPR; n.beginPath();
    for (const p of MESH) { const q = mp(p[0], p[1]); if (q[0] < -9 || q[1] < -9 || q[0] > W + 9 || q[1] > H + 9) continue; n.rect(q[0] - r / 2, q[1] - r / 2, r, r); }
    n.fillStyle = rgba(P.circ, .7 * meshA); n.fill();
  }
  if (vA > .01) {
    const col = mix(P.circ, P.vein, vk), lw = lerp(clamp(M.sc * .004, 1, 2.4) * DPR, Math.max(.6 * DPR, M.sc * .005), vk);
    for (const pass of [0, 1]) for (const v of VEINS) {
      n.beginPath(); v.pts.forEach((p, i) => { const q = mp(p[0], p[1]); i ? n.lineTo(q[0], q[1]) : n.moveTo(q[0], q[1]); });
      if (pass === 0) { n.strokeStyle = rgba(mix(P.glowC, P.vein, vk), .12 * vA * (1 - vk)); n.lineWidth = lw * 4; }
      else { n.strokeStyle = rgba(col, .85 * vA); n.lineWidth = v.mid ? lw * 1.4 : lw; }
      n.stroke();
    }
    n.beginPath(); OUT.forEach((p, i) => { const q = mp(p[0], p[1]); i ? n.lineTo(q[0], q[1]) : n.moveTo(q[0], q[1]); });
    n.strokeStyle = rgba(col, .45 * vA * (1 - vk)); n.lineWidth = lw * .8; n.stroke();
    n.beginPath(); for (const v of VEINS) { if (v.mid) continue; for (const p of [v.pts[0], v.pts[v.pts.length - 1]]) { const q = mp(p[0], p[1]); n.moveTo(q[0] + 3 * DPR, q[1]); n.arc(q[0], q[1], 3 * DPR, 0, TAU); } }
    n.strokeStyle = rgba(P.circ, .6 * vA * (1 - vk)); n.lineWidth = DPR; n.stroke();
  }
  if (strA > .01) VEINS.forEach((v, i) => { for (let j = 0; j < 2; j++) {
    const f = ((t * .18 + i * .37 + j * .5) % 1), idx = f * (v.pts.length - 1), a = v.pts[idx | 0], b = v.pts[Math.min(v.pts.length - 1, (idx | 0) + 1)], fr = idx % 1;
    const q = mp(lerp(a[0], b[0], fr), lerp(a[1], b[1], fr)); glowDot(n, q[0], q[1], 7 * DPR, P.glowC, strA * .9); } });
  if (labA > .01) {
    n.font = `${(10 * DPR).toFixed(1)}px "IBM Plex Mono", monospace`; n.textBaseline = 'middle'; n.textAlign = 'left';
    n.strokeStyle = n.fillStyle = rgba(P.circ, .6 * labA); n.lineWidth = DPR;
    for (const L of LABELS) {
      const q = mp(...MESH[L.n]); if (q[0] < 0 || q[1] < 0 || q[0] > W - 60 * DPR || q[1] > H) continue;
      if (Math.hypot(q[0] - W / 2, q[1] - H / 2) < .14 * H) continue;
      const x = q[0] + 8 * DPR, y = q[1] - 8 * DPR;
      n.beginPath(); n.moveTo(q[0] + 2 * DPR, q[1] - 2 * DPR); n.lineTo(x - 2 * DPR, y + 2 * DPR); n.stroke();
      if (L.ty === 'text') n.fillText(L.txt, x, y);
      else if (L.ty === 'spark') { n.beginPath(); L.vals.forEach((v, i) => { const px = x + i * 4 * DPR, py = y + (4 - v * 9) * DPR; i ? n.lineTo(px, py) : n.moveTo(px, py); }); n.stroke(); }
      else L.vals.slice(0, 6).forEach((v, i) => { const h = (2 + v * 9) * DPR; n.fillRect(x + i * 4 * DPR, y + 5 * DPR - h, 2.4 * DPR, h); });
    }
  }
  const R = U * (1.1 * sm(12.55, 16.2, t) + 3 * sm(15.8, 18, t)) + 2 * DPR;
  const g = n.createRadialGradient(M.px, M.py, R * .6, M.px, M.py, R);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  n.globalCompositeOperation = 'destination-in'; n.fillStyle = g; n.fillRect(0, 0, W, H); n.globalCompositeOperation = 'source-over';
  ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(NL, 0, 0);
  glowDot(ctx, M.px, M.py, 16 * DPR, P.glowC, sm(12.5, 12.8, t) * (1 - sm(13.8, 15, t)));
  ctx.globalCompositeOperation = 'source-over';
}
function drawDust(t, P) {
  const a = sm(12.6, 13.6, t) * (1 - sm(16.8, 18.2, t)); if (a < .01) return;
  const diag = Math.hypot(W, H) / 2, gr = 1 + .05 * (t - 12.55);
  for (const d of DUST) { if (d.r < .12) continue; const r = d.r * diag * gr, x = W / 2 + Math.cos(d.a) * r, y = H / 2 + Math.sin(d.a) * r;
    ctx.fillStyle = rgba(P.circ, a * (.2 + .5 * d.b) * (.6 + .4 * Math.sin(t * 1.3 + d.tw))); const s = d.s * DPR; ctx.fillRect(x - s / 2, y - s / 2, s, s); }
}

/* ---------- frame ---------- */
function render(t) {
  const P = pal();
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = `rgba(0,0,0,${bgA.toFixed(3)})`; ctx.fillRect(0, 0, W, H);
  if (t < 12.15) {
    const cam = camAt(t);
    drawWorld(ctx, t, cam, { ra: 1, under: true });
    const cg = sm(10.4, 11.7, t);
    if (cg > 0) { const k = U / 1000 * cam.s; ctx.globalCompositeOperation = 'lighter';
      glowDot(ctx, W / 2 + (0 - cam.x) * k, H / 2 + (CHIPY - cam.y) * k, (40 * DPR + 24 * k) * (1 + 3 * sm(11.2, 11.9, t)), P.glowC, cg);
      ctx.globalCompositeOperation = 'source-over'; }
    const bl = sm(11.75, 12.12, t); if (bl > 0) { ctx.fillStyle = `rgba(0,0,0,${bl * bgA})`; ctx.fillRect(0, 0, W, H); }
  } else if (t >= 12.5) {
    if (t >= 17.9) drawWorld(ctx, t, CA, { ra: sm(18.3, 19.8, t), under: false, leafM: netM(t), leafA: sm(18.0, 19.5, t) });
    drawDust(t, P);
    drawNet(t, P);
  }
}

/* ---------- playback: scroll plays the story ----------
   The film is pinned while you scroll through .intro-track (about 2.75 screens). Scroll position maps to
   story time through KEYS, so each stage holds for a beat; the shown time eases toward it in rAF, which
   keeps wheel flicks and touch flings smooth. Past the track, one more screen dissolves the film into the
   home stage: the bits drop out, the black thins, then the lines fade. */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const intro = cv.closest('.intro'), opening = cv.closest('.opening'), cue = intro && intro.querySelector('.cue');
const track = opening && opening.querySelector('.intro-track');
// [share of the track, story seconds]: sapling · descent · bits to traces · taproot and core · black ·
// expansion · network hold · pull back · settle
const KEYS = [[0, 0], [.08, 1.9], [.26, 6.3], [.40, 9.2], [.50, 12.1], [.53, 12.9], [.62, 15.0], [.70, 16.0], [.90, 19.5], [1, 20]];
const storyT = s => { for (let i = 1; i < KEYS.length; i++) if (s <= KEYS[i][0]) { const [a, ta] = KEYS[i - 1], [b, tb] = KEYS[i]; return lerp(ta, tb, (s - a) / (b - a)); } return DUR; };
let travel = 0, screen = 1, target = 0, T = 0, p = 0;
function measure() { screen = cv.clientHeight || 1; travel = track ? track.offsetHeight : 0; }
function onScroll() {
  const y = window.scrollY;
  target = travel ? storyT(clamp(y / travel)) : 0;
  p = clamp((y - travel) / screen);
  gone = sm(0, .75, p); bgA = 1 - sm(.1, .8, p);
  cv.style.opacity = String(1 - sm(.55, 1, p));
  if (cue) cue.style.opacity = String(1 - sm(0, .5, y / screen));
}
function frame() {
  T += (target - T) * .12; if (Math.abs(target - T) < .002) T = target;
  if (p < 1) render(T >= DUR ? 0 : T);
  requestAnimationFrame(frame);
}
resize();
document.fonts && document.fonts.ready.then(buildAtlas);
if (reduce || !intro || !opening) {
  // a still, settled frame and the normal page: no pinning, no dive
  new ResizeObserver(() => { resize(); render(0); }).observe(cv);
  render(0); document.fonts && document.fonts.ready.then(() => render(0));
} else {
  opening.classList.add('scrub'); intro.classList.add('merge');
  measure(); onScroll(); T = target;
  addEventListener('scroll', onScroll, { passive: true });
  new ResizeObserver(() => { resize(); measure(); onScroll(); }).observe(cv);
  if (cue) cue.addEventListener('click', e => { e.preventDefault(); window.scrollBy({ top: screen * .9, behavior: 'smooth' }); });
  requestAnimationFrame(frame);
}
})();
