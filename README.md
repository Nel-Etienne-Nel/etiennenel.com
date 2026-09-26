# etiennenel.com

Personal writing site. Hugo, no theme: the layouts in `layouts/` are the whole design.
Black and white; every character in the header field is an `e,`.

## Write a post

Two sections, numbered separately:

- `content/en/editorial/002-title-here.md`, titled `002 - Title Here` (handwritten, no AI)
- `content/en/technical/t-001-title-here.md`, titled `T-001 - Title Here` (written with AI)

The number becomes the giant glyph drawn in the post's header field and its index column.
The `etiennenel-post` Claude skill does all of this for you.
Set `draft = false` when it's ready. An optional `description` in front matter replaces
the auto-summary on the index.

## Run locally

```bash
hugo server
```

## Deploy

Pushing to `main` builds with Hugo and deploys to Cloudflare (`.github/workflows/deploy.yml`).

## Where things live

- `layouts/index.html`: home (field, INFO + READOUT panels, post index)
- `layouts/_default/single.html`: posts and pages (field draws the post number)
- `layouts/_default/list.html`, `layouts/404.html`
- `layouts/partials/bar.html`: the fixed bottom bar
- `assets/js/field.js`: the `e,` canvas field
- `assets/css/main.css`: all styles; colour tokens at the top
