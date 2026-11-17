# sourabhbajaj.com

Source for [sourabhbajaj.com](https://sourabhbajaj.com). It's built with Next.js, TypeScript, and MDX, using the [AI Portfolio](https://github.com/sb2nov/portfolio) theme (a Next.js port of [al-folio](https://github.com/alshedivat/al-folio)).

## Quick start

Requires Node.js 26 and [pnpm](https://pnpm.io) (`corepack enable pnpm`).

```bash
pnpm install
pnpm run dev
```

Open http://localhost:3000.

## Editing content

| Page | Source |
| --- | --- |
| Home (bio) | `content/pages/about.mdx` (`heading` front matter is the page title) |
| Work | `content/data/work.yml` |
| Talks | `content/data/talks.yml` |
| Footer social links | `content/data/socials.yml` |
| Site title, description, URL | `content/site.yml` |

## Blog posts (not linked yet)

The site has no blog index or nav link yet, but the distill-style post layout is kept so posts can be written now. Posts are MDX files in `content/posts/` and are served at `/blog/<year>/<slug>`.

- `content/posts/2021-distill.mdx` is a template that uses every distill feature: byline, table of contents, footnotes, citations, sidenotes, math, code, and interactive charts.
- `published: false` in a post's front matter makes it a draft. Drafts show under `pnpm run dev` but are left out of production builds and the sitemap. `SHOW_DRAFTS=1` includes them in a build.
- Posts use the distill layout by default. `layout: post` switches to the classic single-column layout.

See the [theme README](https://github.com/sb2nov/portfolio#writing-blog-posts) for front matter options and the available MDX components.

## Deployment

The site is hosted on [Vercel](https://vercel.com) as a standard Next.js app. Pushes to `master` deploy to production, and other branches get preview deployments.

### /mac-setup

[sourabhbajaj.com/mac-setup](https://sourabhbajaj.com/mac-setup/) is the [sb2nov/mac-setup](https://github.com/sb2nov/mac-setup) GitHub Pages site. `src/app/mac-setup/[[...path]]/route.ts` proxies every `/mac-setup/*` request to `https://sb2nov.github.io/mac-setup/*`, so its URLs and search ranking stay on this domain. GitHub's own behavior passes through unchanged (`/dir` → `/dir/` redirects, `page` → `page.html`, the custom 404 page), redirects are rewritten back onto this domain, and responses are cached at Vercel's CDN for an hour.

This only works while the sb2nov.github.io repository has **no** GitHub Pages custom domain. If it does, GitHub redirects github.io back to sourabhbajaj.com and the proxy returns a 502 explaining that. `MAC_SETUP_ORIGIN` overrides the upstream, which is useful for testing.

## Development

```bash
pnpm run lint        # ESLint
pnpm run typecheck   # TypeScript
pnpm run test        # Vitest unit tests
pnpm run build       # production build (what deploys)
SHOW_DRAFTS=1 pnpm run build && SHOW_DRAFTS=1 pnpm run test:e2e  # Playwright smoke tests
```

## License

The code is MIT licensed (see [LICENSE](LICENSE), which keeps the al-folio notice). The written content is licensed under Apache 2.0.
