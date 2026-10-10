// Binary roots: the home stage. A root system drawn in 1s and 0s that keep spelling "Etienne"
// (01000101 01110100 01101001 01100101 01101110 01101110 01100101), grown from a fixed seed so the
// shape is the same on every load. One number grows it: `growth` (0 to 1), read from the canvas's
// data-growth, which comes from `rootsGrowth` in hugo.toml. Used by canvas[data-mark="roots"].
(() => {
  const cv = document.querySelector('canvas[data-mark="roots"]');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const countEl = document.getElementById('count');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FONT = '"Courier Prime", "Courier New", monospace';
  const SEQ = '01000101011101000110100101100101011011100110111001100101';
  const CELL = 7;                    // cell width in px, as the old mark
  const SIZES = [.66, .8, .94, 1.08]; // digit size by root thickness: tips smallest
  const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
  const lerp = (a, b, t) => a + (b - a) * t;

  // The parameters. growth is the only one meant to change over time.
  const P = {
    seed: 1871,      // fixed: identical roots on every load
    depth: 3,        // levels of branching below the taproot
    branches: 6,     // laterals off the taproot (fewer on each level down)
    spread: 0.9,     // how far laterals swing out from their parent
    growth: Number.isFinite(parseFloat(cv.dataset.growth)) ? clamp(parseFloat(cv.dataset.growth)) : 0.6,
  };

  function RNG(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // The full-grown tree, in stage units: x from the centre line, y down from the top, both as a share of
  // the stage height. Each root has a start (b) and a duration (d) on the growth scale, so growth reveals
  // the same tree a little at a time instead of building a different one.
  function tree(p) {
    const r = RNG(p.seed), roots = [];
    function root(x, y, ang, len, w, lvl, b, d, parent, pi) {
      const n = Math.max(8, Math.round(len / .01)), pts = [[x, y]], arc = [0];
      let a = ang;
      for (let i = 1; i <= n; i++) {
        a += (r() - .5) * (lvl ? .22 : .1);           // wander
        a += (Math.PI / 2 - a) * (lvl ? .035 : .12);   // gravity pulls every root downward
        x += Math.cos(a) * len / n; y += Math.sin(a) * len / n;
        pts.push([x, y]); arc.push(arc[i - 1] + len / n);
      }
      const R = { pts, arc, w, b, d, lvl, a0: parent ? parent.arc[pi] + parent.a0 : 0 };
      roots.push(R);
      if (lvl >= p.depth) return;
      const k = Math.max(1, Math.round(p.branches * (1 - lvl * .3) * lerp(.8, 1.2, r())));
      let side = r() < .5 ? -1 : 1;
      for (let j = 0; j < k; j++) {
        const tt = lerp(.1, .86, (j + .2 + r() * .6) / k), i = Math.round(tt * n);
        const q = pts[i], u = pts[Math.min(n, i + 1)], v = pts[Math.max(0, i - 1)];
        side = r() < .8 ? -side : side;                 // mostly alternating, not always: a little lopsided
        const ca = Math.atan2(u[1] - v[1], u[0] - v[0]) + side * lerp(.6, 1.2, r()) * p.spread;
        root(q[0], q[1], ca, len * lerp(.34, .6, r()) * (1 - tt * .3), w * (1 - tt * .6) * .66,
             lvl + 1, b + d * tt, d * .72, R, i);
      }
    }
    root(0, -.03, Math.PI / 2, 1.0, .03, 0, 0, .62);
    return roots;
  }
  let ROOTS = tree(P);

  let W = 0, H = 0, dpr = 1, cw = CELL, ch = CELL * 1.2, cells = [], flow = 0, ink = '#000';
  const readInk = () => { ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#000'; };

  // Rasterise the visible part of every root into the character grid: thick near the top, one character
  // wide at the tips. Each cell remembers its distance along the root so the digits run in sequence.
  function build() {
    const rc = cv.getBoundingClientRect();
    W = rc.width; H = rc.height; dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const cols = Math.ceil(W / cw), rows = Math.ceil(H / ch), seen = new Int32Array(cols * rows).fill(-1);
    const S = H, ox = W / 2;
    cells = [];
    for (const R of ROOTS) {
      const f = clamp((P.growth - R.b) / R.d); if (f <= 0) continue;
      const n = R.pts.length - 1, nv = f * n;
      for (let i = 0; i <= nv; i += .35) {
        const i0 = Math.floor(i), i1 = Math.min(n, i0 + 1), fr = i - i0;
        const px = ox + lerp(R.pts[i0][0], R.pts[i1][0], fr) * S, py = lerp(R.pts[i0][1], R.pts[i1][1], fr) * S;
        if (py < -ch || py > H + ch) continue;
        const along = (R.a0 + lerp(R.arc[i0], R.arc[i1], fr)) * S / ch;
        const rr = Math.max(cw * .62, R.w * S * (1 - .7 * i / n) * clamp((nv - i) / 10, .1, 1));
        const size = rr < cw * .9 ? 0 : rr < cw * 1.5 ? 1 : rr < cw * 2.4 ? 2 : 3;
        const mid = Math.floor(px / cw);
        for (let c = Math.floor((px - rr) / cw); c <= Math.floor((px + rr) / cw); c++) {
          if (c < 0 || c >= cols) continue;
          for (let rw = Math.floor((py - rr) / ch); rw <= Math.floor((py + rr) / ch); rw++) {
            if (rw < 0 || rw >= rows) continue;
            const dx = (c + .5) * cw - px, dy = (rw + .5) * ch - py;
            if (dx * dx + dy * dy > rr * rr) continue;
            const id = rw * cols + c;
            if (seen[id] >= 0) { const o = cells[seen[id]]; if (size > o.s) o.s = size; continue; }
            seen[id] = cells.length;
            cells.push({ x: c * cw + cw / 2, y: rw * ch + ch / 2, a: Math.round(along) + (c - mid), s: size });
          }
        }
      }
    }
    if (countEl) countEl.textContent = cells.length.toLocaleString();
    draw();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let s = 0; s < SIZES.length; s++) {
      ctx.font = `700 ${(ch * SIZES[s]).toFixed(1)}px ${FONT}`;
      for (const c of cells) if (c.s === s) ctx.fillText(SEQ[(((c.a - flow) % 56) + 56) % 56], c.x, c.y);
    }
  }

  // sap: the sequence runs down and out along the roots, a few steps a second, only while on screen
  let last = 0, visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);
  function tick(now) {
    if (visible && now - last > 160) { last = now; flow++; draw(); }
    requestAnimationFrame(tick);
  }

  // For trying growth values in the console: etiennenelRoots.grow(0.9)
  window.etiennenelRoots = { params: P, grow(g) { P.growth = clamp(g); build(); } };

  new ResizeObserver(build).observe(cv);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readInk(); draw(); });
  new MutationObserver(() => { readInk(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  readInk();
  const go = () => { build(); if (!reduce) requestAnimationFrame(tick); };
  document.fonts && document.fonts.load ? document.fonts.load('700 20px "Courier Prime"').then(go, go) : go();
})();
