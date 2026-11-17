import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "../../src/app/robots";
import sitemap from "../../src/app/sitemap";
import { getSiteUrl } from "../../src/lib/content";

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("SEO routes", () => {
	it("defaults to the custom domain", () => {
		expect(getSiteUrl()).toBe("https://sourabhbajaj.com");
	});

	it("uses SITE_URL to override the configured site URL", () => {
		vi.stubEnv("SITE_URL", "https://example.org/");
		expect(getSiteUrl()).toBe("https://example.org");
		expect(robots().sitemap).toBe("https://example.org/sitemap.xml");
	});

	it("lists the public pages and leaves drafts out of production sitemaps", () => {
		vi.stubEnv("SITE_URL", "https://example.org");
		vi.stubEnv("NODE_ENV", "production");
		const urls = sitemap().map((entry) => entry.url);

		expect(urls).toEqual(["https://example.org/", "https://example.org/work", "https://example.org/talks"]);
	});
});
