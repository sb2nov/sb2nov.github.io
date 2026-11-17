/**
 * Path prefix the site is served under, e.g. "/portfolio" for a GitHub Pages project site.
 * Set by next.config.ts (from `baseurl` in content/site.yml for static exports) and inlined at build time.
 * Next.js applies it to <Link> and its own assets automatically; `withBasePath` covers raw URLs
 * such as `/assets/...` images, PDFs, and fetches that come from content.
 */
export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

export function withBasePath(url: string): string;
export function withBasePath(url: string | undefined): string | undefined;
export function withBasePath(url: string | undefined): string | undefined {
	if (!url || !basePath) return url;
	if (!url.startsWith("/") || url.startsWith("//")) return url;
	if (
		url === basePath ||
		url.startsWith(`${basePath}/`) ||
		url.startsWith(`${basePath}?`) ||
		url.startsWith(`${basePath}#`)
	) {
		return url;
	}
	return `${basePath}${url}`;
}

type HastNode = {
	type: string;
	properties?: Record<string, unknown>;
	attributes?: Array<{ type: string; name?: string; value?: unknown }>;
	children?: HastNode[];
};

const urlProperties = new Set(["href", "src", "poster", "data"]);

/** Rehype plugin that prefixes root-relative `href`/`src` values in Markdown, HTML, and MDX JSX elements. */
export function rehypeBasePath() {
	return (tree: HastNode) => {
		if (!basePath) return;

		const visit = (node: HastNode) => {
			if (node.type === "element" && node.properties) {
				for (const name of urlProperties) {
					const value = node.properties[name];
					if (typeof value === "string") node.properties[name] = withBasePath(value);
				}
			}
			if ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && node.attributes) {
				for (const attribute of node.attributes) {
					if (
						attribute.type === "mdxJsxAttribute" &&
						urlProperties.has(attribute.name ?? "") &&
						typeof attribute.value === "string"
					) {
						attribute.value = withBasePath(attribute.value);
					}
				}
			}
			node.children?.forEach(visit);
		};

		visit(tree);
	};
}
