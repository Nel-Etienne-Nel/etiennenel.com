# etiennenel.com

Etienne's personal writing site. Hugo, no theme: `layouts/` and `assets/` are the whole design.

**Before changing anything visual, read `DESIGN.md`**, the design system (e,e). Follow it. If a change breaks one of
its rules, update `DESIGN.md` in the same change.

## Rules that matter most

- **The words are Etienne's.** Posts are written without AI. Never write, rewrite or "fix" post prose, and never write
  new bio copy. Only correct spelling or grammar when Etienne asks in that request.
- **Black and white only.** No hues anywhere. Emphasis comes from weight, size, inversion and outline (DESIGN.md §2).
- **Pushing to `main` deploys to etiennenel.com** within about 30s. Work on a branch and ask before merging or pushing to main.
- New posts: use the `etiennenel-post` skill (`~/.claude/skills/etiennenel-post`).

## Commands

```bash
hugo server            # local preview at http://localhost:1313
hugo --minify          # production build into public/ (CI does this)
```

Pushing needs the personal GitHub account `Nel-Etienne-Nel`; the active `gh` account may be a work one.
