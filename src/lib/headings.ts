import GithubSlugger from "github-slugger";

export interface Heading {
	depth: number;
	text: string;
	/** Matches the id `rehype-slug` assigns to the rendered heading. */
	id: string;
}

export interface TocEntry {
	name: string;
	id: string;
	subsections?: TocEntry[];
}

function plainText(markdown: string): string {
	return markdown
		.replace(/<[^>]+>/g, "")
		.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/`([^`]*)`/g, "$1")
		.replace(/(\*\*|__|\*|_|~~)(.+?)\1/g, "$2")
		.replace(/\s+#+\s*$/, "")
		.trim();
}

/** Extracts ATX headings (`## Title`) from MDX source, skipping fenced code blocks. */
export function extractHeadings(source: string): Heading[] {
	const slugger = new GithubSlugger();
	const headings: Heading[] = [];
	let fence: string | null = null;

	for (const line of source.split("\n")) {
		const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
		if (fenceMatch) {
			const marker = fenceMatch[1];
			if (fence === null) fence = marker;
			else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null;
			continue;
		}
		if (fence !== null) continue;

		const match = line.match(/^(#{1,6})\s+(.+)$/);
		if (!match) continue;
		const text = plainText(match[2]);
		headings.push({ depth: match[1].length, text, id: slugger.slug(text) });
	}

	return headings;
}

/** Groups `##` headings with their `###` children into a two-level table of contents. */
export function buildToc(source: string): TocEntry[] {
	const toc: TocEntry[] = [];

	for (const heading of extractHeadings(source)) {
		if (heading.depth === 2) {
			toc.push({ name: heading.text, id: heading.id });
		} else if (heading.depth === 3 && toc.length) {
			const parent = toc[toc.length - 1];
			parent.subsections = [...(parent.subsections ?? []), { name: heading.text, id: heading.id }];
		}
	}

	return toc;
}
