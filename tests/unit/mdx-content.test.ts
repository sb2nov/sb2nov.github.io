import fs from "node:fs";
import path from "node:path";
import { compile } from "@mdx-js/mdx";
import matter from "gray-matter";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MdxContent, mdxCompileOptions } from "../../src/components/mdx-content";

function mdxFiles(dir: string): string[] {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) return mdxFiles(fullPath);
		return entry.name.endsWith(".mdx") ? [fullPath] : [];
	});
}

describe("migrated MDX content", () => {
	it("compiles every migrated MDX file", async () => {
		const files = mdxFiles(path.join(process.cwd(), "content"));

		await Promise.all(
			files.map(async (file) => {
				const parsed = matter(fs.readFileSync(file, "utf8"));
				await compile(parsed.content, mdxCompileOptions);
			})
		);

		expect(files.length).toBeGreaterThanOrEqual(2);
	});

	it("rejects compact MDX ESM syntax", async () => {
		await expect(MdxContent({ source: 'export{meta}from "./meta"\n\n# Hidden export' })).rejects.toThrow(/disabled/);
		await expect(MdxContent({ source: 'import{Fragment}from "react"\n\n# Hidden import' })).rejects.toThrow(/disabled/);
	});

	it("does not nest anchors when a heading is already a link", async () => {
		const html = renderToStaticMarkup(
			await MdxContent({ source: "## [Lightbox2](https://example.com/)\n\n## Plain heading" })
		);
		expect(html).toContain('<h2 id="lightbox2"><a href="https://example.com/">Lightbox2</a></h2>');
		expect(html).toContain('<h2 id="plain-heading"><a href="#plain-heading">Plain heading</a></h2>');
	});

	it("renders emoji shortcodes", async () => {
		const html = renderToStaticMarkup(await MdxContent({ source: "Hello :sparkles: :smile:" }));
		expect(html).toContain("✨");
		expect(html).not.toContain(":sparkles:");
	});
});
