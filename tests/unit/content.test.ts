import { afterEach, describe, expect, it, vi } from "vitest";
import { getPage, getPost, getPostRoute, getPosts, getTalks, getWork, workSpan } from "../../src/lib/content";
import { getPublications } from "../../src/lib/publications";
import { slugify } from "../../src/lib/slugs";

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("content loading", () => {
	it("loads the home page bio", () => {
		expect(getPage("about")?.body).toContain("Uplimit");
	});

	it("loads work history in order", () => {
		const work = getWork();

		expect(work.map((job) => job.company)).toEqual([
			"Uplimit (acquired by Handshake)",
			"Neeva",
			"Google Brain",
			"Coursera",
		]);
		expect(
			work.every(
				(job) => job.roles.length && job.roles.every((role) => role.title && role.years && role.highlights.length)
			)
		).toBe(true);
	});

	it("spans a company's roles from the earliest start to the latest end", () => {
		const [uplimit, neeva] = getWork();

		expect(uplimit.roles.map((role) => role.years)).toEqual(["Jun 2026 - Oct 2026", "Sep 2021 - Jun 2026"]);
		expect(workSpan(uplimit)).toBe("Sep 2021 - Oct 2026");
		expect(workSpan(neeva)).toBe("Jul 2019 - Sep 2021");
	});

	it("loads talks grouped by descending year", () => {
		const years = getTalks().map((group) => group.year);

		expect(years).toEqual([...years].sort((a, b) => b - a));
		expect(years[0]).toBe(2023);
		expect(getTalks().every((group) => group.talks.every((talk) => talk.title && talk.venue))).toBe(true);
	});
});

describe("draft posts", () => {
	it("serves unpublished posts outside production builds", () => {
		const post = getPost("2021", "distill");

		expect(post?.meta.published).toBe(false);
		expect(post ? getPostRoute(post) : "").toBe("/blog/2021/distill");
	});

	it("hides unpublished posts from production builds unless SHOW_DRAFTS is set", () => {
		vi.stubEnv("NODE_ENV", "production");
		expect(getPosts().some((post) => post.meta.published === false)).toBe(false);

		vi.stubEnv("SHOW_DRAFTS", "1");
		expect(getPost("2021", "distill")).toBeDefined();
	});
});

describe("bibliography loading", () => {
	it("parses a post bibliography and tolerates a missing file", () => {
		expect(getPublications("2018-12-22-distill.bib").some((entry) => entry.id === "gregor2015draw")).toBe(true);
		expect(getPublications("missing.bib")).toEqual([]);
	});
});

describe("slug helpers", () => {
	it("normalizes titles to route-safe slugs", () => {
		expect(slugify("A Rich Blog Post: Charts & Math")).toBe("a-rich-blog-post-charts-math");
	});
});
