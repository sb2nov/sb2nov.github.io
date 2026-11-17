# Agent Guidelines for sourabhbajaj.com

This repository is a TypeScript Next.js App Router site deployed to Vercel.

## Commands

```bash
pnpm install
pnpm run dev
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build                  # production build, what deploys
SHOW_DRAFTS=1 pnpm run build    # build used by the e2e suite
SHOW_DRAFTS=1 pnpm run test:e2e
```

## Project Layout

- `src/app` contains the routes: `/` (home), `/work`, `/talks`, `/blog/[year]/[slug]` (unlinked), `/mac-setup/*` (proxied to the sb2nov/mac-setup GitHub Pages site), the sitemap, and robots.txt. Redirects for old URLs live in `next.config.ts`.
- `src/components` contains shared UI and MDX components.
- `src/lib` contains content loading, slug, and BibTeX parsing logic.
- `src/styles/globals.scss` contains the global visual system.
- `content` contains MDX, YAML, and BibTeX source content. Work and talks are YAML in `content/data`.
- `public/assets` contains static assets.
- `tests/unit` contains Vitest tests. `tests/e2e` contains Playwright smoke tests.

## Notes

- The site navigation exposes only home, work, and talks. Blog posts are not linked from the UI.
- Blog posts render with the distill layout (`src/components/distill-post.tsx`) by default; `layout: post` opts into the classic layout.
- `published: false` marks a post as a draft: it renders in dev and tests but is excluded from production builds unless `SHOW_DRAFTS=1`.
- Keep `/assets/...` URLs stable by placing files under `public/assets`.
- `/mac-setup` gets heavy traffic. Keep `skipTrailingSlashRedirect` and the `/mac-setup` exclusion in `next.config.ts`, or GitHub's trailing-slash redirects will loop.
- The `/mac-setup` proxy only works while the sb2nov.github.io repository has no GitHub Pages custom domain; otherwise GitHub redirects back to sourabhbajaj.com and the proxy returns a 502. `MAC_SETUP_ORIGIN` overrides the upstream for testing.
- Vercel deploys every push to `master` to production; other branches get preview deployments.
- Run `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`, and `pnpm run build` before committing.
