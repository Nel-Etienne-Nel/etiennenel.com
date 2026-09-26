# e,e: the etiennenel.com design system

The single source of truth for how etiennenel.com looks, moves and reads.
Anything new on the site follows this document. If a change needs to break a rule, update the rule here first.

---

## 1. Identity

**Name:** e,e (read "e comma e"). It echoes *i,i*, the Bon Iver album whose visualizer by Active Theory
inspired the site. The theme itself is called e,e and so are the site's mark and the "Read e,e" button.

**Premise.** The site holds two kinds of writing, kept apart on purpose:

| Section | What | Written | Numbered |
|---|---|---|---|
| **Technical** `/technical/` | explanatory docs: how things work, how to build them | **with AI** | `T-001`, `T-002`… |
| **Editorial** `/editorial/` | commentary and argument | **by hand, no AI** | `001`, `002`… |

The design never generates or edits **editorial** words. Structure, components and code are fair game;
editorial prose is not, and spelling or grammar is only touched when Etienne asks in that moment.
Technical docs may be drafted and edited with AI. Every post states which it is (its readout says
"AI assistance: None" or "Used").

**Mood:** typographic, like ASCII art. Every image on the site is made of repeated characters. The
interface is monochrome, monospace and brutalist: hairline boxes, capital-letter labels, no decoration.

**Three ideas, in order of importance**
1. **Everything is made of characters.** Pictures are grids of glyphs. The home page draws the
   I1S mark in `1`s and `0`s, posts draw their number in `e,`s.
2. **Everything is a panel.** Content sits in 1px-bordered boxes with a caps header strip, like a
   readout on an instrument.
3. **Form, not colour.** Only black and white. Emphasis comes from weight, size, style,
   inversion and outline, never from hue.

---

## 2. Colour

Pure black and white, swapped for dark mode. One grey for secondary text. That's all.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#ffffff` | `#000000` | page background, panel fill |
| `--ink` | `#000000` | `#ffffff` | text, 1px rules, glyph fields, inverted fills |
| `--mute` | `#6f6f6f` | `#9c9c9c` | secondary text, labels, metadata |
| `--soft` | `rgba(0,0,0,.06)` | `rgba(255,255,255,.08)` | hover band, highlighted code lines, inline code |

- Dark mode follows the visitor's system setting (`prefers-color-scheme`). There is no toggle.
- **Never** introduce a hue: not for links, errors, success, syntax or diagrams. Links are underlined.
- Inversion (ink background, paper text) is a signal, used sparingly: the `e,` tile in the bar,
  the solid pill button, a selected tab, the Warning callout header, the terminal block.
- The I1S navy `#041e41` exists in the logo files but is **not** used on this site.

---

## 3. Typography

Two families, both monospace. Loaded from Google Fonts with system monospace fallbacks.

| Role | Face | Where |
|---|---|---|
| **Glyph / display** | Courier Prime Bold 700 | glyph fields, headings, post titles, numerals, the ETIENNE wordmark |
| **Interface / body** | IBM Plex Mono 400 · 500 · 700 · italic | everything else: prose, labels, readouts, code |

### Scale

| Element | Face | Size / line-height | Notes |
|---|---|---|---|
| Base UI text | Plex | 12px / 1.6 | letter-spacing .02em |
| Caps labels | Plex 500 | 10.5–11px | `text-transform: uppercase`, letter-spacing .08em |
| Fine print | Plex | 9.5px | caps, `--mute` |
| Panel lead (`.big`) | Plex | 13px / 1.55 | |
| **Prose** | Plex | **15px / 1.8** | letter-spacing 0, max 66ch |
| Prose H2 / H3 / H4 | Courier Prime 700 | 26 / 20 / 16px, lh 1.2 | `text-wrap: balance` |
| Post title (panel) | Courier Prime 700 | clamp(26px, 3.6vw, 40px) / 1.05 | |
| Index row title | Courier Prime 700 | clamp(18px, 2.2vw, 24px) / 1.2 | |
| Home index heading "Etienne Nel" | Courier Prime 700 | clamp(40px, 7vw, 88px) / .9 | letter-spacing −.02em |
| Code | Plex | 13px / 1.65 | |

- Numbers that line up in columns use `font-variant-numeric: tabular-nums`.
- Headings get `text-wrap: balance`; paragraphs `text-wrap: pretty` in panels.

---

## 4. Layout

| Token / rule | Value |
|---|---|
| Side gutter `--gutter` | 24px (16px under 860px) |
| Content width | 1100px max (index, article, pager) |
| Reading width | 66ch |
| Bottom bar `--bar-h` | 52px + safe-area inset, fixed |
| Breakpoints | **860px** (panels stack, bar condenses), **520px** (bar trims further) |
| Corners | **square everywhere.** Only pills (999px) and the round play icon are rounded |
| Borders | 1px `--ink`. Heavier (2px) only for Warning callouts |
| Shadows / gradients | none. Only exception: the 1px hatch on removed diff lines |

### Page anatomy

```
┌───────────────────────────────────────────────┐
│ STAGE: canvas glyph field + floating panels   │  home: clamp(420px, 78vh, 820px)
│  ┌PANEL┐                          ┌PANEL┐     │  other pages: clamp(300px, 52vh, 520px)
│  └─────┘                          └─────┘     │
├───────────────────────────────────────────────┤  1px rule
│ CONTENT: index rows · article (220px aside +  │
│ prose) · pager                                │
├───────────────────────────────────────────────┤
│ e, │ ≡ FILES │ ▶ ETIENNE NEL │  (space)  │ ETIENNE │ ABOUT  READ E,E │  fixed bar
└───────────────────────────────────────────────┘
```

- **Stage:** a canvas fills the stage. Panels float over it on desktop and stack below it under 860px.
- **Panels:** `INFO` (360px, bottom-left), `READOUT` (260px, top-right), title panel (max 560px).
  Header strip: caps label left, `−`/`+` collapse button right.
- **Readout lists** (`<dl class="readout">`): label in `--mute` left, value right-aligned, tabular.
- **Home index:** heading "Etienne Nel", then **two columns**: `technical/` left, `editorial/` right. Each has
  a caps note ("Written with AI" / "Handwritten, no AI"). They stack under 860px.
- **Index rows:** number (Courier 18px) · title + summary · date over reading time, separated by 1px rules.
  The hover state is the `--soft` band.
- **Article:** a sticky 220px aside (Contents panel) next to the prose. It becomes one column under 860px.
- **Bottom bar:** cells separated by 1px rules: inverted `e,` tile (home) · **≡ Files** (opens the file menu) ·
  who ("Etienne Nel / Technical · Editorial", links About) · flexible spacer · ETIENNE wordmark ·
  About (outline pill) · Read e,e (solid pill, jumps to the home index).

### File menu (navigation)

The burger opens the site **as a file system**. The screen splits in two: `technical/` slides in from the
**left** and `editorial/` from the **right** (0.38s ease-out). Each half has:
- a big Courier folder name (links to the section page), and a file count plus "written with AI / by hand"
- a real file tree: `├──` / `└──` guides, the post's file name (`001-cognitive-surrender.md`), and its date
- the current page inverted, like a selected file
- the section description at the bottom

A root strip along the bottom reads `~/etiennenel.com/  index  about.md  rss.xml`. The burger turns into an ✕
and inverts while the menu is open. Esc closes it and returns focus to the burger. The page behind stops scrolling.
Closed, the menu is `inert`. Under 860px the halves stack (technical on top). Reduced motion: no slide.

---

## 5. Glyph fields and the mark

Every page opens with a stage that draws one big shape out of small characters.

| Page | Shape | Drawn with | Script |
|---|---|---|---|
| Home | **I1S binary 3D mark** | `1` / `0` | `assets/js/mark.js` |
| Post | its number: `001` (editorial) or `T-001` (technical) | `e,` | `assets/js/field.js` |
| Technical section | `</>` | `e,` | `field.js` |
| Editorial section | `e,e` | `e,` | `field.js` |
| About | `e,` | `e,` | `field.js` |
| 404 | `404` | `e,` | `field.js` |

**`e,` field rules** (Etienne's decisions, 2026-09-25)
- Draw **only the glyph**. No drifting background, no wave, no size pulsing.
- Full-size `e,` inside the shape, smaller ones along its edge so the outline stays crisp.
- Diagonal fill-in from the top-left corner on load, about 1.2s.
- The cursor opens a clear circular lens with a bold edge.
- No density slider. The small +/− buttons on the stage are the only density control.

**Binary mark rules** (locked 2026-09-26)
- Geometry: exact polygons from `I1S/Brand Assets/Logo Variations/SVG Logos/Industry One Solutions Logo-07.svg`.
- Oblique (cavalier) projection: fronts face the viewer, depth runs **up-right at 45°**.
- **Depth 0.21 · outline 1.2 · 7px cells.** Fronts use full-size digits; sides use smaller digits scaled by light
  (light from the upper left).
- An empty keyline (outline) is cut around every front face so the shapes never merge.
- **Motion: blinking only.** About 12 times a second, 4% of the bits flip. No cursor effects, no sway, no rotation.
- Reusable copies (JS, SVG, PNG) live in the brand library: `I1S/Brand Assets/Logo Variations/Binary 3D Mark/`.

**Shared field rules**
- Fields read `--ink` from CSS, so they flip with dark mode.
- They pause when scrolled out of view.
- Under `prefers-reduced-motion`, fields render still: no fill-in, no blink.

---

## 6. Components

Components are Hugo shortcodes and Markdown extensions. In editorial posts they are **containers only**: the words inside are Etienne's.

**How to use the built ones**
- Code: a normal fence, optionally ```` ```js {file="path/file.js" hl="3-4"} ````. Rendered by `layouts/_default/_markup/render-codeblock.html`.
- Terminal: a ```` ```console ```` fence. Lines starting `$ ` are commands; the rest is output.
- File tree: `{{< tree title="…" >}}` around a tree drawn with `├── │ └──`. Folders end in `/`, `# note` goes right, a trailing `(+)` `(M)` `(-)` fills the status column.
- Callouts: `{{< note >}}`, `{{< tip >}}`, `{{< warning >}}` around Markdown, optional `title="…"`.
- Steps: `{{< steps >}}` around a Markdown ordered list whose items start with a **bold lead**. Leave blank lines between items when they contain code or trees.
Specimen sheet: https://claude.ai/artifact/FXznf8KroNhDJfDye3p5c4

| Component | Status | Styling rule |
|---|---|---|
| Code block | **built** | panel · filename + language in the header · line numbers · `▸` + `--soft` for highlighted lines · Copy (excludes line numbers) |
| Diff | proposed | `+` lines heavier (500), `−` lines grey with a 1px diagonal hatch. Never red/green |
| Code tabs | proposed | header tabs, the selected one inverted. Arrow keys move between tabs |
| Terminal | **built** | **the one fully inverted surface.** Prompt `$` dimmed and not copyable. Output at 70%. Copy = commands only |
| File tree | **built** | box-drawing guides (`├── │ └──`) · folders bold with a trailing `/` · status column `+` new, `M` changed, `−` deleted · notes right-aligned in `--mute` · a focus line uses the `--soft` band |
| Callouts | **built** | severity in form: **Note** plain 1px · **Tip** dashed · **Warning** 2px with an inverted header |
| Steps | **built** | real sequences only · Courier `01 02 03` numerals · bold lead line |
| Figure | proposed | 1px frame · caption `FIG. 01` auto-numbered |
| Diagram | proposed | Mermaid written in the post, drawn as 1px boxes and hairline arrows, the key node inverted |
| Spec table | proposed | caps `--mute` headers · 1px row rules · `REQ` badge · tabular defaults |
| Pull quote | proposed | Courier 22–30px between 1px rules · caps cite line. Quotes only Etienne's own text |
| Side notes | proposed | margin notes over 1200px, inline with a 1px left rule below that |
| Inline | proposed | `code` on the `--soft` band · `kbd` with a 2px bottom border · paths with a dashed underline |
| Post type | proposed | caps label: Technical (solid) / Commentary / Note (outline), set by `type:` in the front matter |

**Syntax highlighting (monochrome):** keywords **bold** · strings *italic* · comments `--mute` ·
numbers underlined · function names 500 · punctuation `--mute`.

---

## 7. Motion

- Motion lives in the stage only. The content area and bottom bar are still.
- Allowed: field fill-in (once), cursor lens (`e,` fields), bit blinking (mark).
- Not allowed: scroll-triggered reveals, parallax, hover animations beyond a colour/background change,
  looping decorative motion.
- Content is never hidden waiting for an animation. The page is fully readable at rest.
- `prefers-reduced-motion` disables all of it.

---

## 8. Voice and copy

- Interface copy is short, lowercase in source and displayed in caps by CSS: `READOUT`, `BITS ON SCREEN`,
  `WORDS, UNASSISTED`, `AI ASSISTANCE: NONE`.
- Readouts state facts about the page or the writing (counts, dates, time). No marketing lines.
- Home and About intro text comes from Etienne's own About page. Don't write new bio copy.
- Post titles: `NNN - Title` for editorial (e.g. `001 - Cognitive Surrender`), `T-NNN - Title` for technical.
  The number is display-critical: it becomes the post's glyph field and its index column.

---

## 9. Accessibility

- Visible focus: 2px `--ink` outline, 2px offset. A skip link goes to `#main`.
- Decorative canvases are `aria-hidden`. The home mark canvas has `role="img"` and a label.
- Panels collapse with a real `<button>` carrying `aria-expanded` / `aria-controls`.
- Contrast: ink on paper is 21:1. `--mute` on paper is ≥ 4.5:1 in both themes.
- Nothing relies on colour alone, by design.

---

## 10. Where things live

| Path | What |
|---|---|
| `assets/css/main.css` | all styles. Tokens at the top |
| `assets/js/field.js` | `e,` glyph fields, panel collapse, the clock, the file menu |
| `assets/js/mark.js` | binary I1S mark (home) |
| `layouts/_default/baseof.html` | page shell, loads CSS and field.js |
| `layouts/index.html` | home: stage, INFO, READOUT, index |
| `layouts/_default/single.html` | posts and pages: short stage, title panel, article, pager |
| `layouts/_default/list.html`, `layouts/404.html` | posts index, not found |
| `layouts/partials/bar.html` | fixed bottom bar |
| `layouts/partials/nav.html` | the file-system menu |
| `content/en/technical/`, `content/en/editorial/` | the two sections. `_index.md` holds each one's glyph, description and `ai` flag |
| `layouts/partials/rows.html` | index rows |
| `layouts/partials/fn/*.html` | helpers: post number, title without number, post list |
| `static/favicon.svg` | inverted `e,` favicon |

**Workflow:** posts are added with the `etiennenel-post` Claude skill. **Pushing to `main` deploys live**
(GitHub Actions → Cloudflare Worker `etiennenel-blog`), so design work goes on a branch.
