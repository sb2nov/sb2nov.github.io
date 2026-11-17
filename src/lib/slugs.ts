export function slugify(value: string): string {
	return value
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function normalizeList(value: unknown): string[] {
	if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
	if (typeof value === "string") return value.split(/\s+/).filter(Boolean);
	return [];
}

export function normalizeAssetPath(value: unknown): string | undefined {
	if (typeof value !== "string" || !value) return undefined;
	if (/^(https?:)?\/\//.test(value)) return value;
	if (value.startsWith("/")) return value;
	if (value.startsWith("assets/")) return `/${value}`;
	return value;
}

export function postRoute(year: string | number, slug: string): string {
	return `/blog/${year}/${slug}`;
}
