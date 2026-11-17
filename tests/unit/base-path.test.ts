import { afterEach, describe, expect, it, vi } from "vitest";

async function loadWithBasePath(value: string) {
	vi.stubEnv("NEXT_PUBLIC_BASE_PATH", value);
	vi.resetModules();
	return import("../../src/lib/base-path");
}

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("withBasePath", () => {
	it("prefixes root-relative URLs once and leaves other URLs alone", async () => {
		const { withBasePath } = await loadWithBasePath("/portfolio/");
		expect(withBasePath("/assets/img/a.jpg")).toBe("/portfolio/assets/img/a.jpg");
		expect(withBasePath("/portfolio/assets/img/a.jpg")).toBe("/portfolio/assets/img/a.jpg");
		expect(withBasePath("/portfolio")).toBe("/portfolio");
		expect(withBasePath("/portfolios")).toBe("/portfolio/portfolios");
		expect(withBasePath("https://example.com/x")).toBe("https://example.com/x");
		expect(withBasePath("//cdn.example.com/x")).toBe("//cdn.example.com/x");
		expect(withBasePath("#section")).toBe("#section");
		expect(withBasePath(undefined)).toBeUndefined();
	});

	it("is a no-op without a base path", async () => {
		const { withBasePath } = await loadWithBasePath("");
		expect(withBasePath("/assets/img/a.jpg")).toBe("/assets/img/a.jpg");
	});

	it("rewrites element and MDX JSX URL attributes", async () => {
		const { rehypeBasePath } = await loadWithBasePath("/portfolio");
		const tree = {
			type: "root",
			children: [
				{ type: "element", properties: { href: "/blog/", className: ["x"] }, children: [] },
				{ type: "element", properties: { src: "https://example.com/a.png" }, children: [] },
				{
					type: "mdxJsxFlowElement",
					attributes: [
						{ type: "mdxJsxAttribute", name: "src", value: "/assets/video/a.mp4" },
						{ type: "mdxJsxAttribute", name: "caption", value: "/not-a-url" },
					],
					children: [],
				},
			],
		};
		rehypeBasePath()(tree);
		expect(tree.children[0].properties?.href).toBe("/portfolio/blog/");
		expect(tree.children[1].properties?.src).toBe("https://example.com/a.png");
		expect(tree.children[2].attributes?.map((attribute) => attribute.value)).toEqual([
			"/portfolio/assets/video/a.mp4",
			"/not-a-url",
		]);
	});
});
