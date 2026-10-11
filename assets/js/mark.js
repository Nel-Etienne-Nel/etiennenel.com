// The binary mark: the Industry One Solutions logo extruded back at 45° and
// drawn in blinking 1s and 0s. Used by the home page (canvas[data-mark]).
(() => {
  const cv = document.querySelector('canvas[data-mark]');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const off = document.createElement('canvas'), octx = off.getContext('2d', { willReadFrequently: true });
  const countEl = document.getElementById('count');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FONT = '"Courier Prime", "Courier New", monospace';

  // Exact polygons from "Industry One Solutions Logo-07.svg" (viewBox 283.46², y down).
  const SRC = [
    "108.02 95.47 128.95 141.04 111.91 192.72 91.12 147.61",
    "138.28 215.3 125.27 186.46 140.77 140.15 122.83 100.66 133.87 68.17 164.64 136.27",
    "175.79 185.71 166.47 166.35 176.2 134.63 163.35 108.12 170.29 85.87 192.35 131.59",
  ];
  // centre (141.73) and half-height (73.57) of the mark → unit box, y up, counter-clockwise
  const SHAPES = SRC.map(str => {
    const n = str.split(' ').map(Number), p = [];
    for (let i = 0; i < n.length; i += 2) p.push([(n[i] - 141.73) / 73.57, -(n[i + 1] - 141.73) / 73.57]);
    let a = 0; for (let i = 0; i < p.length; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length]; a += x1 * y2 - x2 * y1; }
    return a < 0 ? p.reverse() : p;
  });

  const DEPTH = 0.21;          // extrusion length, in mark half-heights
  const GAP = 1.2;             // empty outline around each front face, in cells
  const CELL = 7;              // cell width in px
  const ANG = Math.PI / 4;     // depth runs up and to the right
  const L = (v => { const l = Math.hypot(...v); return v.map(c => c / l); })([-0.45, 0.6, -0.66]);  // light: upper-left-front
  const SIZES = [.62, .76, .9, 1.08];

  let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, cw = CELL, ch = CELL * 1.2;
  let cells = [], bits = new Uint8Array(0), ink = '#000';

  const readInk = () => { ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#000'; };

  // Rasterise the extruded mark into the character grid. Geometry is fixed, so this
  // only runs on resize; each frame just blinks bits.
  function build() {
    const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cols = Math.ceil(W / cw); rows = Math.ceil(H / ch);
    off.width = cols; off.height = rows;

    const narrow = W < 860;
    const S = Math.min(W * .9, H * .82) / 2.4;
    const cx = narrow ? W / 2 : W * .56, cy = H / 2;
    const kx = Math.cos(ANG), ky = Math.sin(ANG);
    const P = ([x, y], z) => [cx + (x + z * kx) * S, cy - (y + z * ky) * S];   // oblique (cavalier) projection

    // visible side faces: outward normal points along the depth direction
    const sides = [];
    SHAPES.forEach(p => p.forEach((a, i) => {
      const b = p[(i + 1) % p.length];
      const nx = b[1] - a[1], ny = -(b[0] - a[0]), l = Math.hypot(nx, ny);
      if (nx * kx + ny * ky <= 0) return;
      const lit = Math.max(0, (nx / l) * L[0] + (ny / l) * L[1]);
      sides.push({ pts: [P(a, 0), P(b, 0), P(b, DEPTH), P(a, DEPTH)], shade: .15 + .7 * lit });
    }));

    octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, cols, rows);
    octx.setTransform(1 / cw, 0, 0, 1 / ch, 0, 0);
    const poly = pts => { octx.beginPath(); pts.forEach(([x, y], i) => i ? octx.lineTo(x, y) : octx.moveTo(x, y)); octx.closePath(); };
    for (const s of sides) { const v = Math.round(s.shade * 255); octx.fillStyle = `rgb(${v},0,0)`; poly(s.pts); octx.fill(); }
    // each front face: cut an empty outline around it, then fill it on top
    const fronts = SHAPES.map(p => p.map(q => P(q, 0)));
    octx.globalCompositeOperation = 'destination-out';
    octx.lineWidth = GAP * 2 * cw;
    for (const f of fronts) { poly(f); octx.stroke(); }
    octx.globalCompositeOperation = 'source-over';
    octx.fillStyle = 'rgb(255,0,0)';
    for (const f of fronts) { poly(f); octx.fill(); }

    const img = octx.getImageData(0, 0, cols, rows).data;
    cells = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const o = (y * cols + x) * 4;
      if (img[o + 3] < 120) continue;
      const s = img[o] / 255;
      cells.push(x, y, s > .98 ? 3 : s > .6 ? 2 : s > .35 ? 1 : 0);
    }
    bits = new Uint8Array(cells.length / 3);
    for (let i = 0; i < bits.length; i++) bits[i] = Math.random() < .5 ? 1 : 0;
    if (countEl) countEl.textContent = bits.length.toLocaleString();
    draw();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let b = 0; b < SIZES.length; b++) {
      ctx.font = `700 ${ch * SIZES[b]}px ${FONT}`;
      for (let i = 0, k = 0; i < cells.length; i += 3, k++) {
        if (cells[i + 2] === b) ctx.fillText(bits[k] ? '1' : '0', cells[i] * cw + cw / 2, cells[i + 1] * ch + ch / 2);
      }
    }
  }

  // blink: flip a few random bits roughly 12 times a second, only while on screen
  let last = 0, visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);
  function tick(now) {
    if (visible && now - last > 80) {
      last = now;
      for (let k = 0, n = Math.max(1, bits.length * .04); k < n; k++) bits[(Math.random() * bits.length) | 0] ^= 1;
      draw();
    }
    requestAnimationFrame(tick);
  }

  new ResizeObserver(build).observe(cv);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readInk(); draw(); });
  new MutationObserver(() => { readInk(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  readInk();
  const go = () => { build(); if (!reduce) requestAnimationFrame(tick); };
  document.fonts && document.fonts.load ? document.fonts.load('700 20px "Courier Prime"').then(go, go) : go();
})();
