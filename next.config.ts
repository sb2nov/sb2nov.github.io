import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	poweredByHeader: false,
	allowedDevOrigins: ["127.0.0.1"],
	// /mac-setup is proxied to GitHub Pages, which has its own trailing-slash rules
	// (`/dir` -> `/dir/`, `/page` -> `page.html`). Next's global slash stripping would fight
	// them, so it is turned off and the site's own pages are normalized in `redirects` below.
	skipTrailingSlashRedirect: true,
	async redirects() {
		return [
			// Strip trailing slashes everywhere except /mac-setup.
			{ source: "/:path((?!mac-setup(?:/|$)).+)/", destination: "/:path", permanent: true },
			// URLs from the old Jekyll site.
			{ source: "/index.html", destination: "/", permanent: true },
			{ source: "/work.html", destination: "/work", permanent: true },
			{ source: "/talks.html", destination: "/talks", permanent: true },
			{ source: "/projects", destination: "/work", permanent: true },
			{ source: "/projects.html", destination: "/work", permanent: true },
		];
	},
	images: {
		unoptimized: true,
	},
};

export default nextConfig;
