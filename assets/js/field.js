// The e, field: a grid of "e," glyphs that together draw one giant glyph
// (the canvas's data-glyph). Cursor opens a clear lens; the density slider
// in the bottom bar rescales the grid.
(() => {
  const cv = document.querySelector('canvas.field');
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
  const about = $('about-btn');
  if (about) about.addEventListener('click', () => {
    const btn = document.querySelector('#info [data-toggle]');
    if (btn.getAttribute('aria-expanded') === 'false') btn.click();
    $('info').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  });
  const clock = $('clock');
  if (clock) {
    const tick = () => { clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); };
    tick(); setInterval(tick, 1000);
  }

  if (!cv) return;
  const ctx = cv.getContext('2d');
  const range = $('density');
  const countEl = $('count');
  const densEl = $('dens');
  const glyph = cv.dataset.glyph || 'e,';

  let W = 0, H = 0, dpr = 1, cols = 0, rows = 0, cw = 0, ch = 0, mask = new Float32Array(0);
  let ink = '#000';
  const mouse = { x: -9999, y: -9999, r: 0, tr: 0 };
  const t0 = performance.now();

  try { const d = localStorage.getItem('density'); if (d && range) range.value = d; } catch (e) {}

  function readInk() { ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#000'; }

  function layout() {
    const r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const d = range ? parseFloat(range.value) : 9.3;
    if (densEl) densEl.textContent = d.toFixed(1);
    cw = 36 - (d - 8.8) * 22;               // 36px → 14px cells
    if (W < 600) cw *= .58;                  // phones need more columns for the glyph to read
    ch = cw * 1.12;
    cols = Math.ceil(W / cw); rows = Math.ceil(H / ch);
    buildMask();
    if (reduce) draw(performance.now());
  }

  // Rasterise the big glyph into a cols×rows buffer; each cell samples its coverage.
  function buildMask() {
    const off = document.createElement('canvas');
    off.width = cols; off.height = rows;
    const o = off.getContext('2d');
    o.save(); o.scale(1, 1 / 1.12);          // cells are taller than wide
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

  const SIZES = [.42, .62, .82, 1.04];
  function draw(now) {
    const t = now - t0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = ink;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    mouse.r += (mouse.tr - mouse.r) * .15;
    const reveal = reduce ? 9 : Math.min(9, t / 1500);
    const buckets = [[], [], [], []];
    let n = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if ((x + y) / (cols + rows) > reveal) continue;          // diagonal load-in
        const m = mask[y * cols + x];
        const wave = .5 + .5 * Math.sin(x * .21 + t * .0011 + Math.sin(y * .17 + t * .0007) * 2.2);
        let v = m > .35 ? .45 + .55 * wave : (wave > .9 ? (wave - .9) * 6 : 0);
        if (v <= .05) continue;
        const px = x * cw + cw / 2, py = y * ch + ch / 2;
        if (mouse.r > 1) {
          const dx = px - mouse.x, dy = py - mouse.y, dd = Math.sqrt(dx * dx + dy * dy);
          if (dd < mouse.r) continue;                              // the lens
          if (dd < mouse.r + cw * 1.5) v = 1;                      // bold rim
        }
        buckets[Math.min(3, Math.floor(v * 4))].push(px, py);
        n++;
      }
    }
    for (let b = 0; b < 4; b++) {
      const arr = buckets[b]; if (!arr.length) continue;
      ctx.font = `700 ${ch * SIZES[b]}px ${FONT}`;
      for (let i = 0; i < arr.length; i += 2) ctx.fillText('e,', arr[i], arr[i + 1]);
    }
    if (countEl) countEl.textContent = n.toLocaleString();
  }

  let visible = true;
  function loop(now) { if (visible) draw(now); requestAnimationFrame(loop); }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(cv);

  cv.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    mouse.tr = Math.max(60, Math.min(W, H) * .14);
    if (reduce) { mouse.r = mouse.tr; draw(performance.now()); }
  });
  cv.addEventListener('pointerleave', () => { mouse.tr = 0; if (reduce) { mouse.r = 0; draw(performance.now()); } });

  const setDensity = v => {
    if (!range) return;
    range.value = Math.max(8.8, Math.min(9.8, v)).toFixed(2);
    try { localStorage.setItem('density', range.value); } catch (e) {}
    layout();
  };
  if (range) range.addEventListener('input', () => setDensity(parseFloat(range.value)));
  const zin = $('zin'), zout = $('zout');
  if (zin) zin.addEventListener('click', () => setDensity(parseFloat(range.value) + .1));
  if (zout) zout.addEventListener('click', () => setDensity(parseFloat(range.value) - .1));

  new MutationObserver(readInk).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readInk(); if (reduce) draw(performance.now()); });
  new ResizeObserver(layout).observe(cv);

  readInk();
  const start = () => { layout(); if (!reduce) requestAnimationFrame(loop); };
  (document.fonts && document.fonts.load)
    ? document.fonts.load(`700 40px "Courier Prime"`).then(start, start)
    : start();
  if (document.fonts) document.fonts.ready.then(layout);
})();
