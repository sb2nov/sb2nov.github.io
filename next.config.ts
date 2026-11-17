import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { NextConfig } from "next";

// `pnpm run build:pages` sets NEXT_OUTPUT=export to produce a static site in `out/` for GitHub Pages.
const staticExport = process.env.NEXT_OUTPUT === "export";

function configuredBaseUrl(): string {
	const site = yaml.load(fs.readFileSync(path.join(process.cwd(), "content", "site.yml"), "utf8")) as {
		baseurl?: string;
	};
	return site.baseurl ?? "";
}

// Static exports are served from `baseurl` (e.g. /portfolio on GitHub Pages); the Node server
// used for local development, tests, and Docker serves from the root unless NEXT_PUBLIC_BASE_PATH is set.
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? (staticExport ? configuredBaseUrl() : "")).replace(/\/+$/, "");

const nextConfig: NextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	allowedDevOrigins: ["127.0.0.1"],
	basePath: basePath || undefined,
	env: { NEXT_PUBLIC_BASE_PATH: basePath },
	// Static hosts resolve `/blog/2024/` to `blog/2024/index.html`, which also avoids
	// clashes between a page file and a directory of the same name.
	...(staticExport ? { output: "export" as const, trailingSlash: true } : {}),
	images: {
		unoptimized: true,
	},
};

export default nextConfig;
