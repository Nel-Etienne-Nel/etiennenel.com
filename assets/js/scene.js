// The footer engraving at the end of every page: Mount Fuji over still water, a great torii standing in it, a pagoda
// on the near hills, a cherry branch and a stone lantern framing the view, all printed in 1s and 0s.
// The scene is painted at one pixel per character cell into an offscreen canvas that holds a tone (R) and a hatch
// direction (G) per cell. A cell prints a digit when its tone beats the hatch pattern, so light areas read as
// engraved lines and bright areas fill solid. White on black, greys only. Prints in from the bottom up the first time
// it scrolls into view, then only blinks, drifts and sways. Ported from the I1S site's Giza footer (i1s-site glyph.js).
// Drawn on canvas[data-scene].
(() => {
  const cv = document.querySelector('canvas[data-scene]');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FONT = '"Courier Prime", "Courier New", monospace';

  // ---------- maths ----------
  const hash = (a, b = 0, c = 0) => {
    let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return h >>> 0;
  };
  const rand = (a, b = 0, c = 0) => hash(a, b, c) / 4294967296;
  const bit = (x, y, fr) => {    // a bit that flips on its own irregular clock, so the field blinks rather than strobes
    const period = 45 + (hash(x, y, 3) % 120);
    return hash(x, y, Math.floor((fr + (hash(x, y, 7) % period)) / period)) & 1;
  };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

  // ---------- scene constants (scene units; the scene is 1600 × 460, anchored to the bottom of the canvas) ----------
  const SW = 1600, SH = 460, SHORE = 326, FOCUS = 830;   // FOCUS: the x kept in view when narrow screens crop the sides
  const FX = 1090, FY = 34;                               // Fuji's summit
  const TX = 610, TB = 404;                               // the torii's centre and its feet in the water
  const SUN = [870, 132, 40];
  const LEVELS = [0.34, 0.5, 0.66, 0.83, 1];              // grey steps: digit alpha (and size) per tone band

  // fixed scatter: trees on the near hills, blossoms on the branch, falling petals
  const trees = [];
  for (let x = -300, i = 0; x < SW + 300; x += 9 + (hash(i, 21) % 12), i++) trees.push([x, 4 + rand(i, 22) * 7]);
  const petals = Array.from({ length: 16 }, (_, i) => [rand(i, 41) * SW, rand(i, 42) * SH, 10 + rand(i, 43) * 14, 7 + rand(i, 44) * 8, rand(i, 45) * 6.3]);

  // ---------- canvas state ----------
  const sc = document.createElement('canvas'), sx = sc.getContext('2d', { willReadFrequently: true });
  let w = 0, h = 0, dpr = 1, s = 1, cw = 4, ch = 5, ox = 0, oy = 0, cols = 0, rows = 0, ink = '#fff';
  let bs = null, last = null, visible = false, raf = 0;

  function layout() {
    const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    s = h / SH; if (SW * s < w) s = w / SW;
    ox = SW * s > w ? clamp(w / 2 - FOCUS * s, w - SW * s, 0) : 0;
    oy = h - SH * s;
    cw = dpr >= 2 ? clamp(s * 3.1, 2.1, 4.2) : clamp(s * 4.2, 3.4, 4.8); ch = cw * 1.25;
    cols = Math.ceil(w / cw); rows = Math.ceil(h / ch);
    sc.width = cols; sc.height = rows;
    ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#fff';
    last = null;
  }

  // ---------- painting ----------
  // Hatch codes (G): 0 stipple, 1 —, 2 /, 3 \, 4 water, 5 |
  const P = (tone, hatch = 0) => `rgb(${Math.round(clamp(tone) * 255)},${hatch * 40},0)`;
  const BK = '#000';

  function paint(T) {
    const o = sx;
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.fillStyle = BK; o.fillRect(0, 0, cols, rows);
    o.setTransform(s / cw, 0, 0, s / ch, ox / cw, oy / ch);
    const X0 = -ox / s - 10, X1 = (w - ox) / s + 10, span = X1 - X0 + 240;
    const wrap = (x) => X0 - 120 + ((((x - X0 + 120) % span) + span) % span);
    const gap = (1.1 * cw) / s;          // one keyline, in scene units
    const path = (pts) => { o.beginPath(); pts.forEach(([x, y], i) => (i ? o.lineTo(x, y) : o.moveTo(x, y))); o.closePath(); };
    const poly = (pts, st) => { path(pts); o.fillStyle = st; o.fill(); };
    const cut = (pts, k = 1) => { path(pts); o.lineWidth = gap * 2 * k; o.lineJoin = 'round'; o.strokeStyle = BK; o.stroke(); };
    const ell = (x, y, rx, ry, st, rot = 0) => { o.beginPath(); o.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); o.fillStyle = st; o.fill(); };
    const line = (pts, lw, st) => { o.beginPath(); pts.forEach(([x, y], i) => (i ? o.lineTo(x, y) : o.moveTo(x, y))); o.lineWidth = lw; o.lineCap = 'round'; o.lineJoin = 'round'; o.strokeStyle = st; o.stroke(); };

    // sky: an evening glow round a low sun, drawn as engraved horizontal lines
    const glow = o.createRadialGradient(SUN[0], SUN[1], 30, SUN[0], SUN[1], 620);
    glow.addColorStop(0, P(0.34, 1)); glow.addColorStop(0.35, P(0.17, 1)); glow.addColorStop(1, P(0, 1));
    o.fillStyle = glow; o.fillRect(X0, -200, X1 - X0, SHORE + 200);
    ell(SUN[0], SUN[1], SUN[2], SUN[2], P(0.95, 1));
    // long streaks of cloud, lit from below, drifting slowly
    const streak = (x, y, len, th, tone) => {
      o.beginPath(); o.moveTo(x - len / 2, y);
      o.quadraticCurveTo(x, y - th * 1.6, x + len / 2, y - th * 0.4);
      o.quadraticCurveTo(x, y + th * 0.4, x - len / 2, y); o.closePath();
      o.lineWidth = gap * 2; o.strokeStyle = BK; o.stroke();
      o.fillStyle = P(tone, 2); o.fill();
      line([[x - len * 0.42, y - th * 0.05], [x + len * 0.1, y - th * 0.2], [x + len * 0.45, y - th * 0.45]], 2.6, P(Math.min(1, tone + 0.4), 0));
    };
    streak(wrap(1380 + T * 1.6), 120, 520, 22, 0.42);
    streak(wrap(980 + T * 1.1), 168, 380, 14, 0.36);
    streak(wrap(1560 + T * 2), 206, 300, 10, 0.5);
    streak(wrap(300 + T * 1.3), 150, 420, 16, 0.3);
    streak(wrap(620 + T * 0.8), 92, 300, 12, 0.26);
    for (let i = 0; i < 6; i++) {        // a skein of birds heading home
      const bx = wrap(330 + i * 26 + (hash(i, 61) % 22) + T * 7), by = 190 + (i % 3) * 13 + (hash(i, 62) % 12);
      const fl = Math.sin(T * 4 + i * 1.9) * 3, sp = 7 + (i % 2) * 2;
      line([[bx - sp, by - 2 - fl], [bx - sp * 0.3, by], [bx, by + 2], [bx + sp * 0.3, by], [bx + sp, by - 2 - fl]], 2.8, P(1, 0));
    }

    // Mount Fuji: concave slopes, snow fingers down the gullies, the sunlit east face brighter
    const fuji = () => {
      o.beginPath(); o.moveTo(FX - 26, FY + 4);
      o.quadraticCurveTo(FX - 170, 300, FX - 640, 322);
      o.lineTo(FX + 680, 322);
      o.quadraticCurveTo(FX + 180, 300, FX + 26, FY + 4);
      o.lineTo(FX + 12, FY); o.lineTo(FX, FY + 3); o.lineTo(FX - 12, FY); o.closePath();
    };
    fuji(); o.lineWidth = gap * 2; o.lineJoin = 'round'; o.strokeStyle = BK; o.stroke();
    o.save(); fuji(); o.clip();
    const ridge = (y) => FX + 6 + (y - FY) * 0.28;   // where the shaded west face meets the lit east face
    poly([[FX - 700, FY - 10], [FX + 6, FY - 10], [ridge(330), 330], [FX - 700, 330]], P(0.24, 5));
    poly([[FX + 6, FY - 10], [FX + 700, FY - 10], [FX + 700, 330], [ridge(330), 330]], P(0.4, 5));
    const snow = [[FX - 700, FY - 20]];
    for (let x = FX - 330, i = 0; x <= FX + 350; x += 13, i++) {
      const taper = 1 - Math.abs(x - FX) / 380, deep = i % 2 ? 6 + (hash(i, 71) % 14) : 26 + (hash(i, 72) % 48);
      snow.push([x, 140 + Math.abs(x - FX) * 0.08 + deep * taper * (0.6 + 0.4 * taper)]);
    }
    snow.push([FX + 700, FY - 20]);
    o.save(); path(snow); o.clip();
    poly([[FX - 700, FY - 10], [FX + 6, FY - 10], [ridge(330), 330], [FX - 700, 330]], P(0.6, 3));
    poly([[FX + 6, FY - 10], [FX + 700, FY - 10], [FX + 700, 330], [ridge(330), 330]], P(0.97, 0));
    o.restore();
    line(snow.slice(1, -1), gap * 0.8, BK);
    for (let i = -6; i <= 6; i++) {      // gullies: carved lines fanning down from the crater
      const x0 = FX + i * 4, x1 = FX + i * 30 + (hash(i + 9, 73) % 14) - 7, y1 = 150 + (hash(i + 9, 74) % 70);
      line([[x0, FY + 6], [x0 + (x1 - x0) * 0.4, FY + (y1 - FY) * 0.45], [x1, y1]], 2.2, BK);
    }
    for (let i = 0; i < 10; i++) {       // lit ridges below the snow
      const x0 = FX - 300 + i * 66 + (hash(i, 75) % 20), y0 = 200 + Math.abs(x0 - FX) * 0.12;
      line([[x0, y0], [x0 + (x0 - FX) * 0.35, y0 + 70]], 2.2, P(x0 > FX ? 0.7 : 0.48, 0));
    }
    o.restore();
    fuji(); o.lineWidth = gap * 0.8; o.strokeStyle = P(1, 0); o.stroke();
    // a band of mist across the lower slopes (kasumi)
    const band = (x, y, len, th) => {
      o.beginPath(); o.roundRect(x - len / 2, y - th / 2, len, th, th / 2);
      o.fillStyle = BK; o.fill(); o.lineWidth = 2.4; o.strokeStyle = P(0.75, 0); o.stroke();
      line([[x - len * 0.3, y], [x + len * 0.25, y]], 2, P(0.38, 0));
    };
    band(wrap(1000 + T * 2.2), 246, 420, 18);

    // far hills, then the dark near hills with a pagoda among the trees
    o.beginPath(); o.moveTo(X0, 330);
    for (let x = X0; x <= X1; x += 20) o.lineTo(x, 288 + Math.sin(x * 0.006) * 12 + Math.sin(x * 0.021 + 1) * 5);
    o.lineTo(X1, 330); o.closePath();
    o.lineWidth = gap * 2; o.strokeStyle = BK; o.stroke(); o.fillStyle = P(0.32, 2); o.fill();
    const nearY = (x) => 308 + Math.sin(x * 0.009 + 2) * 9 + Math.sin(x * 0.031) * 3 - Math.max(0, 1 - Math.abs(x - 280) / 260) * 22;
    o.beginPath(); o.moveTo(X0, 330);
    for (let x = X0; x <= X1; x += 12) o.lineTo(x, nearY(x));
    o.lineTo(X1, 330); o.closePath();
    o.lineWidth = gap * 2; o.strokeStyle = BK; o.stroke(); o.fillStyle = P(0.15, 3); o.fill();
    for (const [x, r] of trees) {        // tree crowns, lit along their tops
      if (x < X0 - 20 || x > X1 + 20) continue;
      const y = nearY(x);
      o.beginPath(); o.arc(x, y + 2, r, Math.PI * 1.05, Math.PI * 1.95); o.lineWidth = 2.4; o.strokeStyle = P(0.72, 0); o.stroke();
    }
    const pagoda = (px, base) => {
      const tiers = 5, top = base - tiers * 17 - 26;
      o.fillStyle = BK; o.fillRect(px - 22 - gap, top - gap, 44 + gap * 2, base - top + gap);
      for (let k = 0; k < tiers; k++) {
        const y = base - k * 17, hw = 22 - k * 2.2;
        o.fillStyle = P(0.42, 5); o.fillRect(px - hw * 0.55, y - 13, hw * 1.1, 13);
        o.fillStyle = P(0.85, 0); o.fillRect(px + hw * 0.1, y - 13, hw * 0.45, 13);
        poly([[px - hw - 7, y - 15], [px - hw, y - 12], [px + hw, y - 12], [px + hw + 7, y - 15], [px + hw - 3, y - 17], [px - hw + 3, y - 17]], P(1, 0));
      }
      const sy = base - tiers * 17;
      line([[px, sy - 2], [px, top]], 2.6, P(1, 0));
      for (let k = 0; k < 5; k++) line([[px - 4, sy - 6 - k * 4], [px + 4, sy - 6 - k * 4]], 1.8, P(0.9, 0));
    };
    pagoda(280, 302);
    for (let i = 0; i < 6; i++) {        // a few lit buildings along the shore
      const bx = 1370 + i * 34 + (hash(i, 81) % 12), bw = 14 + (hash(i, 82) % 14), bh = 7 + (hash(i, 83) % 8);
      o.fillStyle = BK; o.fillRect(bx - gap, SHORE - bh - gap, bw + gap * 2, bh + gap);
      o.fillStyle = P(0.92, 0); o.fillRect(bx, SHORE - bh, bw, bh);
    }
    o.fillStyle = P(0.85, 1); o.fillRect(X0, SHORE - 2, X1 - X0, 3);

    // the water: darker toward the viewer, carrying the reflections
    const sea = o.createLinearGradient(0, SHORE, 0, SH);
    sea.addColorStop(0, P(0.16, 4)); sea.addColorStop(1, P(0.4, 4));
    o.fillStyle = sea; o.fillRect(X0, SHORE + 1, X1 - X0, SH - SHORE + 20);
    o.fillStyle = P(0.55, 4); o.fillRect(X0, SHORE + 1, X1 - X0, 7);
    poly([[FX - 520, SHORE + 2], [FX + 560, SHORE + 2], [FX + 30, SHORE + 2 + (SHORE - FY) * 0.42], [FX - 30, SHORE + 2 + (SHORE - FY) * 0.42]], P(0.34, 4));
    poly([[FX - 200, SHORE + 2 + 60], [FX + 220, SHORE + 2 + 60], [FX + 30, SHORE + 2 + (SHORE - FY) * 0.42], [FX - 30, SHORE + 2 + (SHORE - FY) * 0.42]], P(0.62, 4));
    poly([[SUN[0] - 40, SHORE + 2], [SUN[0] + 40, SHORE + 2], [SUN[0] + 110, SH + 10], [SUN[0] - 110, SH + 10]], P(0.85, 4));
    for (let i = 0; i < 16; i++) {       // glints
      const gx = wrap((hash(i, 91) % SW) + T * 4), gy = SHORE + 16 + (hash(i, 92) % 120);
      ell(gx, gy, 7 + (hash(i, 93) % 12), 1.8, P(0.75, 4));
    }

    // a small boat, poled slowly across
    const boat = (x, y) => {
      y += Math.sin(T * 1.2 + x * 0.01) * 0.8;
      line([[x + 34, y + 5], [x + 110, y + 9]], 3, P(0.5, 4));
      poly([[x - 32, y + 7], [x + 30, y + 7], [x + 20, y + 22], [x - 36, y + 22]].map(([a, b]) => [a, 2 * (y + 7) - b + 14]), P(0.4, 4));
      cut([[x - 36, y - 3], [x + 34, y - 3], [x + 24, y + 7], [x - 30, y + 7]]);
      poly([[x - 36, y - 3], [x + 34, y - 3], [x + 24, y + 7], [x - 30, y + 7]], P(0.95, 0));
      ell(x - 8, y - 28, 5, 5, P(1, 0));
      poly([[x - 18, y - 23], [x - 8, y - 31], [x + 2, y - 23]], P(1, 0));    // a conical hat
      line([[x - 8, y - 22], [x - 10, y - 4]], 6, P(0.95, 0));
      line([[x + 6, y - 46], [x - 18, y + 30]], 2.2, P(1, 0));             // the pole
    };
    boat(wrap(1460 - T * 3.5), 366);

    // the torii, with its reflection in the water first
    const torii = (refl) => {
      const F = (tone, hatch) => (refl ? P(tone * 0.55, 4) : P(tone, hatch));
      const part = (pts, tone, hatch) => { if (!refl) cut(pts); poly(pts, F(tone, hatch)); };
      const pillar = (cx, top, bot, wb, wt, k) => {     // shaded west strip, lit east side
        const pts = [[cx - wt / 2, top], [cx + wt / 2, top], [cx + wb / 2, bot], [cx - wb / 2, bot]];
        if (!refl) cut(pts, k);
        poly(pts, F(0.94, 0));
        poly([[cx - wt / 2, top], [cx - wt / 2 + wt * 0.38, top], [cx - wb / 2 + wb * 0.38, bot], [cx - wb / 2, bot]], F(0.5, 5));
      };
      for (const sd of [-1, 1]) {        // the four short legs and their ties to each main pillar
        const mx = TX + sd * 76;
        for (const ax of [mx - 44, mx + 44]) {
          for (const ty of [316, 370]) part([[Math.min(ax, mx), ty], [Math.max(ax, mx), ty], [Math.max(ax, mx), ty + 7], [Math.min(ax, mx), ty + 7]], 0.8, 1);
          pillar(ax, 300, TB + 2, 14, 12, 0.8);
          part([[ax - 13, 296], [ax - 9, 292], [ax + 9, 292], [ax + 13, 296], [ax + 8, 302], [ax - 8, 302]], 0.62, 1);  // little roof cap
        }
      }
      pillar(TX - 76, 176, TB, 28, 21, 1);
      pillar(TX + 76, 176, TB, 28, 21, 1);
      part([[TX - 150, 238], [TX + 150, 238], [TX + 146, 252], [TX - 146, 252]], 0.92, 1);   // nuki, the lower tie beam
      part([[TX - 5, 176], [TX + 5, 176], [TX + 5, 238], [TX - 5, 238]], 0.7, 5);           // gakuzuka strut
      part([[TX - 16, 186], [TX + 16, 186], [TX + 16, 226], [TX - 16, 226]], 0.98, 0);       // the plaque
      if (!refl) { o.fillStyle = BK; o.fillRect(TX - 10, 192, 20, 28); o.fillStyle = P(0.5, 5); o.fillRect(TX - 6, 196, 12, 20); }
      part([[TX - 152, 164], [TX + 152, 164], [TX + 148, 176], [TX - 148, 176]], 0.86, 1);   // shimaki
      const kasagi = [], roof = [];
      for (let i = 0; i <= 24; i++) {    // the top beam, its ends sweeping up
        const u = i / 24 * 2 - 1, a = Math.abs(u) ** 2.6;
        kasagi.push([TX + u * 176, 150 - a * 24]); roof.push([TX + u * 176, 140 - a * 30]);
      }
      const bottom = [];
      for (let i = 24; i >= 0; i--) { const u = i / 24 * 2 - 1; bottom.push([TX + u * 168, 164 - Math.abs(u) ** 2.4 * 16]); }
      const beam = [[TX - 176, roof[0][1]], ...kasagi.slice(1, -1), [TX + 176, roof[24][1]], ...bottom];
      part(beam, 0.95, 0);
      poly([...roof, ...kasagi.slice().reverse()], F(0.55, 1));
      if (!refl) line(roof, gap * 0.8, P(1, 0));
    };
    o.save(); o.beginPath(); o.rect(X0, TB + 2, X1 - X0, SH); o.clip();
    o.translate(Math.sin(T * 0.7) * 1.5, 2 * TB + 4); o.scale(1, -0.9); torii(true); o.restore();
    torii(false);
    for (const x of [TX - 76, TX + 76, TX - 120, TX - 32, TX + 32, TX + 120]) {   // rings where the legs meet the water
      const r = x === TX - 76 || x === TX + 76 ? 24 : 14, ph = Math.sin(T * 1.1 + x) * 2;
      o.beginPath(); o.ellipse(x, TB + 2, r + ph, 3.4, 0, 0.05, Math.PI - 0.05); o.lineWidth = 2.2; o.strokeStyle = P(0.9, 0); o.stroke();
    }

    // foreground right: a rocky bank and a stone lantern, lit from inside
    poly([[X1, 400], [1560, 402], [1400, 428], [1320, 470], [X1, 470]], P(0.45, 3));
    const rock = (x, y, rx, ry) => {
      const pts = [[x - rx, y], [x - rx * 0.8, y - ry * 0.7], [x - rx * 0.2, y - ry], [x + rx * 0.5, y - ry * 0.85], [x + rx, y - ry * 0.2], [x + rx * 0.9, y]];
      cut(pts, 1.4); poly(pts, P(0.26, 2));
      poly([[x + rx * 0.05, y - ry * 0.55], [x + rx * 0.5, y - ry * 0.85], [x + rx, y - ry * 0.2], [x + rx * 0.9, y], [x - rx * 0.3, y]], P(0.8, 3));
      line(pts.slice(0, 4), 2.6, P(1, 0));
    };
    rock(1360, 468, 58, 30); rock(1550, 462, 74, 36); rock(1640, 452, 48, 26);
    const lantern = (lx, base) => {
      const parts = [
        [[lx - 30, base], [lx + 30, base], [lx + 26, base - 9], [lx - 26, base - 9]],                 // foot
        [[lx - 8, base - 9], [lx + 8, base - 9], [lx + 7, base - 46], [lx - 7, base - 46]],            // post
        [[lx - 22, base - 46], [lx + 22, base - 46], [lx + 18, base - 54], [lx - 18, base - 54]],      // platform
        [[lx - 15, base - 54], [lx + 15, base - 54], [lx + 15, base - 82], [lx - 15, base - 82]],      // fire box
      ];
      for (const p of parts) { cut(p); poly(p, P(0.4, 5)); poly([[(p[0][0] + p[1][0]) / 2, p[0][1]], p[1], p[2], [(p[2][0] + p[3][0]) / 2, p[2][1]]], P(0.85, 0)); }
      const glowA = 0.85 + Math.sin(T * 2.3) * 0.08 + Math.sin(T * 5.1) * 0.04;
      o.fillStyle = BK; o.fillRect(lx - 10, base - 79, 20, 22);
      o.fillStyle = P(glowA, 0); o.fillRect(lx - 7, base - 76, 14, 16);
      const kasa = [[lx - 40, base - 80], [lx - 30, base - 86], [lx - 10, base - 100], [lx + 10, base - 100], [lx + 30, base - 86], [lx + 40, base - 80], [lx + 24, base - 84], [lx - 24, base - 84]];
      cut(kasa); poly(kasa, P(0.92, 0)); line([[lx - 40, base - 80], [lx - 24, base - 84], [lx + 24, base - 84], [lx + 40, base - 80]], 2.4, BK);
      cut([[lx - 5, base - 100], [lx + 5, base - 100], [lx + 5, base - 106], [lx - 5, base - 106]]);
      ell(lx, base - 113, 7, 9, P(0.95, 0));
      poly([[lx - 5, base - 100], [lx + 5, base - 100], [lx + 5, base - 106], [lx - 5, base - 106]], P(0.7, 0));
    };
    o.save(); o.translate(1450, 440); o.scale(1.45, 1.45); o.translate(-1450, -440); lantern(1450, 440); o.restore();

    // foreground left: a cherry branch reaching in over the water, blossom on every twig
    const sway = Math.sin(T * 0.45) * 2;
    const limb = (pts, wd) => { line(pts, wd + gap * 2, BK); line(pts, wd, P(0.95, 0)); line(pts, Math.max(1, wd - 5), P(0.38, 2)); };
    const B = (x, y, k = 1) => [x + sway * k, y + sway * 0.4 * k];
    limb([[-80, 40], [60, 58], [170, 50], [300, 78], [420, 96]].map(([x, y], i) => B(x, y, i / 4)), 13);
    limb([[170, 50], [230, 20], [330, 8]].map(([x, y], i) => B(x, y, 0.5 + i / 4)), 7);
    limb([[300, 78], [360, 130], [400, 170]].map(([x, y], i) => B(x, y, 0.75 + i / 4)), 6);
    limb([[60, 58], [110, 110], [130, 150]].map(([x, y], i) => B(x, y, 0.25 + i / 4)), 6);
    const flower = (x, y, r, k) => {
      const [fx, fy] = B(x, y, k);
      ell(fx, fy, r * 1.5 + gap, r * 1.5 + gap, BK);
      for (let p = 0; p < 5; p++) {
        const a = p * 1.2566 + x * 0.1;
        ell(fx + Math.cos(a) * r * 0.75, fy + Math.sin(a) * r * 0.75, r * 0.72, r * 0.5, P(p % 2 ? 1 : 0.86, 0), a);
      }
      ell(fx, fy, r * 0.25, r * 0.25, BK);
    };
    const FLOWERS = [[44, 50, 9, 0.1], [82, 68, 8, 0.2], [128, 44, 10, 0.4], [150, 66, 7, 0.4], [200, 34, 9, 0.6], [236, 12, 8, 0.7],
      [282, 4, 9, 0.8], [330, 14, 7, 0.9], [262, 64, 10, 0.7], [318, 92, 8, 0.8], [350, 118, 9, 0.9], [392, 152, 9, 1], [404, 178, 7, 1],
      [392, 88, 9, 0.95], [428, 104, 8, 1], [100, 104, 8, 0.4], [126, 140, 9, 0.5], [140, 160, 6, 0.5], [8, 40, 8, 0.05], [182, 58, 7, 0.5]];
    for (const [x, y, r, k] of FLOWERS) flower(x, y, r, k);
    for (const [x0, y0, vx, vy, ph] of petals) {   // petals drifting down across the whole view
      const y = ((y0 + T * vy) % (SH + 40)) - 20, x = wrap(x0 + T * vx + Math.sin(T * 0.8 + ph) * 18);
      ell(x, y, 4.4, 2.6, P(1, 0), T * 0.9 + ph);
    }
  }

  // ---------- printing the cells ----------
  const LINES = [1, 0.45, 0.1];
  function draw(t, fr) {
    if (!cols) return;
    const T = reduce ? 0 : t;
    paint(T);
    const img = sx.getImageData(0, 0, cols, rows).data;
    const pb = reduce ? 1 : bs == null ? 0 : inOut(clamp((t - bs) / 2.8));
    const r0 = Math.max(0, Math.floor(oy / ch)), head = rows - pb * (rows - r0 + 2);
    const buckets = Array.from({ length: 6 }, () => []), f = reduce ? 0 : fr * 0.5;
    for (let y = Math.max(0, Math.floor(head)); y < rows; y++) for (let x = 0; x < cols; x++) {
      const k = (y * cols + x) * 4, tone = img[k] / 255;
      if (tone < 0.04) continue;
      const hatch = Math.round(img[k + 1] / 40);
      let p;
      if (hatch === 1) p = LINES[y % 3];
      else if (hatch === 2) p = LINES[(x + y) % 3];
      else if (hatch === 3) p = LINES[((x - y) % 3 + 3) % 3];
      else if (hatch === 5) p = LINES[x % 3];
      else if (hatch === 4) {            // water: horizontal dashes that slide and break up over time
        const st = Math.sin(x * 0.33 + y * 2.3 + T * (0.6 + (y % 4) * 0.15) + 2 * Math.sin(y * 0.41 + T * 0.4));
        p = y % 2 ? 0 : st > 0.25 + rand(x >> 2, y, 17) * 0.4 ? 1 : 0;
      } else p = rand(x, y, 11);
      const v = tone * (hatch === 4 ? 0.15 + 0.85 * p : 0.72 + 0.4 * p) + (rand(x, y, 13) - 0.5) * 0.08;
      if (v < 0.16) continue;
      buckets[y < head + 1 ? 5 : Math.min(4, Math.floor(v * 5.2))].push(x, y);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = ink;
    buckets.forEach((b, i) => {
      if (!b.length) return;
      const lv = Math.min(4, i);
      ctx.globalAlpha = i === 5 ? 1 : LEVELS[lv];
      ctx.font = `700 ${(ch * (0.7 + lv * 0.11)).toFixed(1)}px ${FONT}`;
      for (let j = 0; j < b.length; j += 2) ctx.fillText(bit(b[j], b[j + 1], f) ? '1' : '0', b[j] * cw + cw / 2, b[j + 1] * ch + ch / 2);
    });
    ctx.globalAlpha = 1;
  }

  // ~40k digits a frame is the cost and everything moves a cell at a time, so redraw at 10 fps once printed in
  let fr = 0;
  function loop(now) {
    raf = 0;
    if (!visible) return;
    const t = now / 1000;
    fr++;
    if (bs == null) bs = t;
    const busy = t - bs < 3;
    if (last == null || busy || t - last >= 0.1) { last = t; draw(t, fr); }
    if (!reduce || busy) raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!raf) raf = requestAnimationFrame(loop); };

  layout();
  if (reduce) { bs = 0; draw(0, 0); }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !reduce) start(); }, { rootMargin: '80px' }).observe(cv);
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); if (reduce) draw(0, 0); else if (visible) start(); }, 120); });
  if (document.fonts) document.fonts.ready.then(() => { last = null; if (reduce) draw(0, 0); });
})();
