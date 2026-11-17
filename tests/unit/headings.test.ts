import { describe, expect, it } from "vitest";
import { buildToc, extractHeadings } from "../../src/lib/headings";

describe("heading extraction", () => {
	it("matches rehype-slug ids, strips inline Markdown, and skips fenced code", () => {
		const source = [
			"## [Lightbox2](https://example.com)",
			"```md",
			"## Not a heading",
			"```",
			"### `Code` and **bold**",
			"## Intro",
			"## Intro",
		].join("\n");

		expect(extractHeadings(source)).toEqual([
			{ depth: 2, text: "Lightbox2", id: "lightbox2" },
			{ depth: 3, text: "Code and bold", id: "code-and-bold" },
			{ depth: 2, text: "Intro", id: "intro" },
			{ depth: 2, text: "Intro", id: "intro-1" },
		]);
	});

	it("nests h3 headings under their h2", () => {
		expect(buildToc("## A\n### A.1\n### A.2\n## B")).toEqual([
			{
				name: "A",
				id: "a",
				subsections: [
					{ name: "A.1", id: "a1" },
					{ name: "A.2", id: "a2" },
				],
			},
			{ name: "B", id: "b" },
		]);
	});
});
