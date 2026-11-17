import type { MetadataRoute } from "next";
import { absoluteUrl, getPostRoute, getPosts } from "@/lib/content";

export const dynamic = "force-static";

const staticRoutes = ["/", "/work", "/talks"];

export default function sitemap(): MetadataRoute.Sitemap {
	const posts = getPosts().filter((post) => !post.meta.redirect);

	return [
		...staticRoutes.map((route) => ({ url: absoluteUrl(route) })),
		...posts.map((post) => ({
			url: absoluteUrl(getPostRoute(post)),
			lastModified: post.meta.date ? new Date(post.meta.date) : undefined,
		})),
	];
}
