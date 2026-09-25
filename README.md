# etiennenel.com

Personal writing site. Hugo, no theme: the layouts in `layouts/` are the whole design.
Black and white; every character in the header field is an `e,`.

## Write a post

```bash
hugo new content/en/posts/002-title-here.md
```

Start the title with the post number (`002 - Title Here`). The number becomes the giant
glyph drawn in the post's header field and the index column on the home page.
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
