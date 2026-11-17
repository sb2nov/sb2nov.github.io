# sourabhbajaj.com

Source for my personal site, [sourabhbajaj.com](https://sourabhbajaj.com). It's a Next.js, TypeScript, and MDX app built on the [AI Portfolio](https://github.com/sb2nov/portfolio) theme, a Next.js port of [al-folio](https://github.com/alshedivat/al-folio).

## Getting started

Requires Node.js 26 and [pnpm](https://pnpm.io) (`corepack enable pnpm`).

```bash
pnpm install
pnpm run dev
```

Then open http://localhost:3000.

## Content

| Page | Source |
| --- | --- |
| Home | `content/pages/about.mdx` |
| Work | `content/data/work.yml` |
| Talks | `content/data/talks.yml` |
| Footer links | `content/data/socials.yml` |
| Site title, description, URL | `content/site.yml` |

Blog posts are MDX files in `content/posts/` and are served at `/blog/<year>/<slug>`. Posts with `published: false` are drafts: they show up in `pnpm run dev` but are left out of production builds. See the [theme README](https://github.com/sb2nov/portfolio#writing-blog-posts) for front matter options and MDX components.

## Checks

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
SHOW_DRAFTS=1 pnpm run build && SHOW_DRAFTS=1 pnpm run test:e2e
```

CI runs all of these on every pull request.

## Deployment

The site is hosted on [Vercel](https://vercel.com). Every merge to `master` deploys to production, and pull requests get preview deployments.

[sourabhbajaj.com/mac-setup](https://sourabhbajaj.com/mac-setup/) is served from [sb2nov/mac-setup](https://github.com/sb2nov/mac-setup) through a proxy route in `src/app/mac-setup`.

## License

The code is MIT licensed (see [LICENSE](LICENSE)). The written content is licensed under Apache 2.0.
