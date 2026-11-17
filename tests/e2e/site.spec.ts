import { expect, test } from "@playwright/test";

// Distill tests use the unpublished template post, so CI builds with SHOW_DRAFTS=1 before
// running these. Production builds (`pnpm run build:pages`) leave drafts out.

test("home page renders the bio and primary navigation", async ({ page }) => {
	await page.goto("/");

	await expect(page.getByRole("heading", { level: 1, name: "Hi, I'm Sourabh." })).toBeVisible();
	await expect(page.getByText("ambitious mission")).toBeVisible();
	await expect(page.locator("main img")).toHaveCount(0);

	const nav = page.getByRole("navigation", { name: "Primary navigation" });
	await expect(nav.getByRole("link")).toHaveText(["home", "work", "talks"]);
	await expect(nav.getByRole("link", { name: "home" })).toHaveAttribute("aria-current", "page");
	await expect(nav).not.toContainText("blog");
});

test("work page lists past roles with resume dates", async ({ page }) => {
	await page.goto("/work");

	await expect(page.getByRole("heading", { level: 1, name: "Work" })).toBeVisible();
	await expect(page.locator(".entry-body h2")).toHaveText([
		"Uplimit (acquired by Handshake)",
		"Neeva",
		"Google Brain",
		"Coursera",
	]);
	await expect(page.locator(".entry-meta p")).toHaveText([
		"Sep 2021 - Oct 2026",
		"Jul 2019 - Sep 2021",
		"Oct 2016 - Jul 2019",
		"Jan 2014 - Oct 2016",
	]);

	const uplimit = page.locator(".entry").first();
	await expect(uplimit.locator(".entry-role-title")).toHaveText([
		"Head of Engineering, Learn at Handshake",
		"Co-founder and CTO",
	]);
	await expect(uplimit.getByText("Conviction, Greylock")).toBeVisible();

	const handshakeRole = uplimit.locator(".entry-role").first();
	const titleBox = await handshakeRole.locator(".entry-role-title").boundingBox();
	const yearsBox = await handshakeRole.locator(".entry-role-years").boundingBox();
	if (page.viewportSize()!.width > 760) expect(yearsBox!.y).toBeLessThan(titleBox!.y + titleBox!.height);
	await expect(page.getByRole("link", { name: "Apache Beam" })).toHaveAttribute("href", "https://beam.apache.org/");
});

test("talks page groups talks by year with slide and video links", async ({ page }) => {
	await page.goto("/talks");

	await expect(page.getByRole("heading", { level: 1, name: "Talks" })).toBeVisible();
	const years = await page.locator(".entry-meta h2").allTextContents();
	expect(years).toEqual(["2023", "2022", "2020", "2018", "2017", "2016", "2015"]);

	const beam = page.locator("article", { has: page.getByRole("heading", { name: /Apache Beam/ }) });
	await expect(beam.getByRole("link", { name: "PyData, July 2017" })).toBeVisible();
	await expect(beam.getByRole("link", { name: "Video" }).first()).toHaveAttribute(
		"href",
		"https://www.youtube.com/watch?v=-6xpDRiurmA"
	);
	await expect(beam.getByRole("listitem")).toHaveCount(4);
});

test("footer renders social links from socials data", async ({ page }) => {
	await page.goto("/");

	const footer = page.locator(".site-footer");
	await expect(footer.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
		"href",
		"https://www.linkedin.com/in/sbajaj9"
	);
	await expect(footer.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/sb2nov");
	await expect(footer.getByRole("link", { name: "Twitter" })).toHaveAttribute(
		"href",
		"https://twitter.com/sourabhbajaj90"
	);
	await expect(footer.getByRole("link", { name: "Speaker Deck" })).toHaveCount(0);
	await expect(footer.getByRole("link", { name: "Email" })).toHaveAttribute("href", "mailto:sourabh@sourabhbajaj.com");
	await expect(footer).toContainText("© 2012");
	await expect(footer).toContainText("Sourabh Bajaj");
});

test("old /projects link redirects to /work", async ({ page }) => {
	await page.goto("/projects");
	await expect(page).toHaveURL(/\/work\/?$/);
});

test("removed pages are not served", async ({ request }) => {
	for (const route of ["/blog", "/publications", "/cv", "/feed.xml"]) {
		expect((await request.get(route)).status(), route).toBe(404);
	}
});

test("SEO routes serve sitemap and robots", async ({ request }) => {
	const sitemap = await request.get("/sitemap.xml");
	const xml = await sitemap.text();
	expect(xml).toContain("<loc>https://sourabhbajaj.com/talks</loc>");

	const robots = await request.get("/robots.txt");
	expect(await robots.text()).toContain("Sitemap:");
});

test("dark mode toggle works on mobile viewport", async ({ page }) => {
	await page.addInitScript(() => window.localStorage.setItem("theme", "light"));
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/");

	await page.getByRole("button", { name: "Toggle dark mode" }).click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("saved dark theme hydrates without mismatch", async ({ page }) => {
	const consoleErrors: string[] = [];
	page.on("console", (message) => {
		if (message.type() === "error") consoleErrors.push(message.text());
	});

	await page.addInitScript(() => window.localStorage.setItem("theme", "dark"));
	await page.goto("/");
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

	expect(consoleErrors.filter((message) => message.includes("Hydration failed"))).toEqual([]);
});

test("distill post preserves wide article layout and sidenotes", async ({ page }) => {
	const failedLocalResources: string[] = [];
	const consoleErrors: string[] = [];
	page.on("console", (message) => {
		if (message.type() === "error") consoleErrors.push(message.text());
	});
	page.on("response", (response) => {
		if (response.status() >= 400 && response.url().startsWith("http://127.0.0.1:3000")) {
			failedLocalResources.push(`${response.status()} ${response.url()}`);
		}
	});

	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.goto("/blog/2021/distill");

	await expect(page.locator(".distill-page")).toBeVisible();
	await expect(page.locator("d-title h1")).toHaveText("a distill-style blog post");
	await expect(page.locator("d-byline .byline.grid")).toContainText("Albert Einstein");
	await expect(page.locator("d-byline")).not.toContainText("Reading Time");
	await expect(page.locator("d-article > d-contents nav.l-text.figcaption")).toContainText("Equations");
	await expect(page.locator(".distill-citation a").first()).toHaveAttribute("href", "#gregor2015draw");
	await expect(page.locator("d-appendix d-citation-list .references #gregor2015draw")).toContainText(
		"DRAW: A recurrent neural network"
	);

	const metrics = await page.evaluate(() => {
		const rect = (selector: string) => {
			const element = document.querySelector(selector);
			if (!element) throw new Error(`Missing ${selector}`);
			const bounds = element.getBoundingClientRect();
			return { bottom: bounds.bottom, left: bounds.left, right: bounds.right, top: bounds.top, width: bounds.width };
		};

		const paragraph = rect(".distill-article > .mdx-content > p");
		const codeBlock = rect(".distill-article > .mdx-content > pre.language-html");
		// The code block showing the image-sidenote markup sits directly before that sidenote.
		const rhinoPre = document.querySelector(".distill-article aside:nth-of-type(2)")?.previousElementSibling;
		if (!rhinoPre?.matches("pre")) throw new Error("Missing code block before the image aside");
		const rhinoBounds = rhinoPre.getBoundingClientRect();
		const rhinoCodeBlock = { bottom: rhinoBounds.bottom, top: rhinoBounds.top };
		const pageBlock = rect(".distill-article .l-page");
		const screenBlock = rect(".distill-article .l-screen");
		const aside = rect(".distill-article aside:nth-of-type(1)");
		const imageAside = rect(".distill-article aside:nth-of-type(2)");
		const paragraphAfterFirstAside = rect(".distill-article aside:nth-of-type(1) + p");
		const paragraphAfterImageAside = rect(".distill-article aside:nth-of-type(2) + p");

		return {
			aside,
			codeBlock,
			imageAside,
			pageBlock,
			paragraph,
			paragraphAfterFirstAside,
			paragraphAfterImageAside,
			rhinoCodeBlock,
			screenBlock,
			viewport: window.innerWidth,
		};
	});

	expect(metrics.pageBlock.width).toBeGreaterThan(metrics.paragraph.width + 180);
	expect(metrics.screenBlock.width).toBeGreaterThan(metrics.viewport - 48);
	expect(metrics.paragraph.width).toBeGreaterThan(680);
	expect(metrics.aside.width).toBeLessThan(180);
	expect(metrics.aside.left).toBeGreaterThan(metrics.paragraph.right + 12);
	expect(metrics.aside.left).toBeGreaterThan(metrics.codeBlock.right + 12);
	expect(Math.abs(metrics.aside.top - metrics.codeBlock.top)).toBeLessThanOrEqual(2);
	expect(Math.abs(metrics.paragraphAfterFirstAside.top - metrics.codeBlock.bottom)).toBeLessThanOrEqual(2);
	expect(Math.abs(metrics.imageAside.top - metrics.rhinoCodeBlock.top)).toBeLessThanOrEqual(2);
	expect(Math.abs(metrics.paragraphAfterImageAside.top - metrics.rhinoCodeBlock.bottom)).toBeLessThanOrEqual(2);
	expect(failedLocalResources).toEqual([]);
	expect(consoleErrors.filter((message) => /Hydration failed|cannot be a descendant of/i.test(message))).toEqual([]);
});

test("standard fenced code blocks include syntax highlighting", async ({ page }) => {
	await page.goto("/blog/2021/distill");

	const javascriptBlock = page.locator("pre.language-javascript").first();
	await expect(javascriptBlock.locator(".hljs-keyword, .hljs-string, .hljs-number").first()).toBeVisible();
});

test("distill sidebar zoomable image opens an enlarged view", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1200 });
	await page.goto("/blog/2021/distill");

	const sidebarImage = page.locator('d-article aside img[src="/assets/img/rhino.png"]');
	await sidebarImage.scrollIntoViewIfNeeded();
	await sidebarImage.click();

	const dialog = page.getByRole("dialog", { name: "Image preview" });
	await expect(dialog).toBeVisible();
	await expect(dialog.locator('img[src="/assets/img/rhino.png"]')).toBeVisible();

	await page.keyboard.press("Escape");
	await expect(dialog).toBeHidden();
});
