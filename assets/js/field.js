// The e, field: a grid of "e," glyphs that together draw one giant glyph
// (the canvas's data-glyph). The cursor opens a clear lens; the +/− buttons
// rescale the grid.
(() => {
  const cv = document.querySelector('canvas.field:not([data-mark])');   // the home page's mark has its own script
  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FONT = '"Courier Prime", "Courier New", monospace';

  // ---- panels + misc UI (works with or without a canvas) ----
  document.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.closest('.panel');
      const body = $(btn.getAttribute('aria-controls'));
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      btn.textContent = open ? '+' : '−';
      body.hidden = open;
      panel.dataset.collapsed = String(open);
    });
  });
  const clock = $('clock');
  if (clock) {
    const tick = () => { clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); };
    tick(); setInterval(tick, 1000);
  }

  // ---- file-system menu (burger in the bar) ----
  const burger = document.querySelector('.burger'), fs = $('fs');
  if (burger && fs) {
    const setMenu = open => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close the file menu' : 'Open the file menu');
      fs.classList.toggle('open', open);
      fs.inert = !open;
      document.body.classList.toggle('fs-lock', open);
      if (open) (fs.querySelector('.r.here, [aria-current]') || fs.querySelector('a')).focus({ preventScroll: true });
    };
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && fs.classList.contains('open')) { setMenu(false); burger.focus(); }
    });
  }

  if (!cv) return;
  const ctx = cv.getContext('2d');
  const countEl = $('count');
  const densEl = $('dens');
  const glyph = cv.dataset.glyph || 'e,';

  let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, cw = 0, ch = 0, mask = new Float32Array(0);
  let ink = '#000';
  let density = 9.3;                          // 8.8 (coarse) → 9.8 (fine)
  const mouse = { x: -9999, y: -9999, r: 0, tr: 0 };
  let t0 = performance.now();
  let frame = 0;

  try { const d = parseFloat(localStorage.getItem('density')); if (d >= 8.8 && d <= 9.8) density = d; } catch (e) {}

  function readInk() { ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#000'; }

  function layout() {
    const r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    if (densEl) densEl.textContent = density.toFixed(1);
    cw = 36 - (density - 8.8) * 22;           // 36px → 14px cells
    if (W < 600) cw *= .58;                   // phones need more columns for the glyph to read
    ch = cw * 1.12;
    cols = Math.ceil(W / cw); rows = Math.ceil(H / ch);
    buildMask();
    redraw();
  }

  // Rasterise the big glyph into a cols×rows buffer; each cell samples its coverage.
  function buildMask() {
    const off = document.createElement('canvas');
    off.width = cols; off.height = rows;
    const o = off.getContext('2d');
    o.save(); o.scale(1, 1 / 1.12);           // cells are taller than wide
    o.font = `700 100px ${FONT}`;
    const wRatio = o.measureText(glyph).width / 100;
    const narrow = W < 860;
    const size = Math.min(rows * 1.12 * 1.35, (cols * (narrow ? .95 : .62)) / wRatio);
    o.font = `700 ${size}px ${FONT}`;
    const m = o.measureText(glyph);
    // position by the ink bounds, not the advance width, so nothing clips at the edges
    const bl = m.actualBoundingBoxLeft || 0;
    const tw = (bl + (m.actualBoundingBoxRight || m.width)) || m.width;
    const x = (narrow ? (cols - tw) / 2 : cols - tw - cols * .04) + bl;
    const gh = (m.actualBoundingBoxAscent || size * .5) + (m.actualBoundingBoxDescent || 0);
    const y = rows * 1.12 / 2 + gh / 2 - (m.actualBoundingBoxDescent || 0);
    o.fillStyle = '#000';
    o.fillText(glyph, x, y);
    o.restore();
    const data = o.getImageData(0, 0, cols, rows).data;
    mask = new Float32Array(cols * rows);
    for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] / 255;
  }

  // Only the glyph is drawn: full-size e, inside it, smaller ones along its
  // anti-aliased edge so the outline stays crisp.
  const SIZES = [.62, .82, 1.04];
  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = ink;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    mouse.r += (mouse.tr - mouse.r) * .18;
    const reveal = reduce ? 1 : Math.min(1, (now - t0) / 1200);
    const buckets = [[], [], []];
    let n = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const m = mask[y * cols + x];
        if (m < .35) continue;
        if ((x + y) / (cols + rows) > reveal) continue;           // diagonal load-in
        const px = x * cw + cw / 2, py = y * ch + ch / 2;
        let b = m > .85 ? 2 : m > .6 ? 1 : 0;
        if (mouse.r > 1) {
          const dx = px - mouse.x, dy = py - mouse.y, dd = Math.sqrt(dx * dx + dy * dy);
          if (dd < mouse.r) continue;                               // the lens
          if (dd < mouse.r + cw * 1.5) b = 2;                       // bold rim
        }
        buckets[b].push(px, py);
        n++;
      }
    }
    for (let b = 0; b < SIZES.length; b++) {
      const arr = buckets[b]; if (!arr.length) continue;
      ctx.font = `700 ${ch * SIZES[b]}px ${FONT}`;
      for (let i = 0; i < arr.length; i += 2) ctx.fillText('e,', arr[i], arr[i + 1]);
    }
    if (countEl) countEl.textContent = n.toLocaleString();
    // keep animating only while the load-in or the lens is still moving
    frame = (reveal < 1 || Math.abs(mouse.tr - mouse.r) > .5) ? requestAnimationFrame(draw) : 0;
  }
  function redraw() { if (!frame) frame = requestAnimationFrame(draw); }

  cv.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    mouse.tr = Math.max(60, Math.min(W, H) * .14);
    if (reduce) mouse.r = mouse.tr;
    redraw();
  });
  cv.addEventListener('pointerleave', () => { mouse.tr = 0; if (reduce) mouse.r = 0; redraw(); });

  const setDensity = v => {
    density = Math.round(Math.max(8.8, Math.min(9.8, v)) * 10) / 10;
    try { localStorage.setItem('density', String(density)); } catch (e) {}
    layout();
  };
  const zin = $('zin'), zout = $('zout');
  if (zin) zin.addEventListener('click', () => setDensity(density + .1));
  if (zout) zout.addEventListener('click', () => setDensity(density - .1));

  new MutationObserver(() => { readInk(); redraw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readInk(); redraw(); });
  new ResizeObserver(layout).observe(cv);

  readInk();
  const start = () => { t0 = performance.now(); layout(); };
  (document.fonts && document.fonts.load)
    ? document.fonts.load(`700 40px "Courier Prime"`).then(start, start)
    : start();
  if (document.fonts) document.fonts.ready.then(layout);
})();
