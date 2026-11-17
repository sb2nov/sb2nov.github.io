import { afterEach, describe, expect, it, vi } from "vitest";
import { localRedirectLocation, MAC_SETUP_CACHE_CONTROL, proxyMacSetup } from "../../src/lib/mac-setup-proxy";

afterEach(() => {
	vi.unstubAllEnvs();
});

type Call = { url: string; init: RequestInit };

function upstream(response: Response) {
	const calls: Call[] = [];
	const fetchImpl = (async (url: string, init: RequestInit) => {
		calls.push({ url, init });
		return response;
	}) as unknown as typeof fetch;
	return { calls, fetchImpl };
}

function request(path: string, init?: RequestInit) {
	return new Request(`https://sourabhbajaj.com${path}`, init);
}

describe("mac-setup proxy", () => {
	it("fetches the same path and query from GitHub Pages without following redirects", async () => {
		const { calls, fetchImpl } = upstream(
			new Response("<h1>Homebrew</h1>", { headers: { "content-type": "text/html" } })
		);
		const response = await proxyMacSetup(request("/mac-setup/homebrew/usage?x=1"), fetchImpl);

		expect(calls[0].url).toBe("https://sb2nov.github.io/mac-setup/homebrew/usage?x=1");
		expect(calls[0].init.redirect).toBe("manual");
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("text/html");
		expect(response.headers.get("cache-control")).toBe(MAC_SETUP_CACHE_CONTROL);
		expect(await response.text()).toBe("<h1>Homebrew</h1>");
	});

	it("keeps GitHub's directory redirects on this domain", async () => {
		const { fetchImpl } = upstream(
			new Response(null, { status: 301, headers: { location: "https://sb2nov.github.io/mac-setup/Homebrew/" } })
		);
		const response = await proxyMacSetup(request("/mac-setup/Homebrew"), fetchImpl);

		expect(response.status).toBe(301);
		expect(response.headers.get("location")).toBe("/mac-setup/Homebrew/");
	});

	it("redirects the bare prefix to the site root", async () => {
		const { fetchImpl } = upstream(
			new Response(null, { status: 301, headers: { location: "https://sb2nov.github.io/mac-setup/" } })
		);
		const response = await proxyMacSetup(request("/mac-setup"), fetchImpl);

		expect(response.headers.get("location")).toBe("/mac-setup/");
	});

	it("passes through GitHub's 404 page with its status", async () => {
		const { fetchImpl } = upstream(
			new Response("custom 404", { status: 404, headers: { "content-type": "text/html" } })
		);
		const response = await proxyMacSetup(request("/mac-setup/nope/"), fetchImpl);

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("custom 404");
	});

	it("fails instead of looping while GitHub still redirects to this domain", async () => {
		const { fetchImpl } = upstream(
			new Response(null, { status: 301, headers: { location: "https://sourabhbajaj.com/mac-setup/" } })
		);
		const response = await proxyMacSetup(request("/mac-setup/"), fetchImpl);

		expect(response.status).toBe(502);
		expect(await response.text()).toMatch(/custom domain/);
	});

	it("returns 502 when GitHub is unreachable", async () => {
		const fetchImpl = (async () => {
			throw new Error("network down");
		}) as unknown as typeof fetch;
		const response = await proxyMacSetup(request("/mac-setup/"), fetchImpl);

		expect(response.status).toBe(502);
		expect(response.headers.get("cache-control")).toBe("no-store");
	});

	it("forwards conditional headers and sends no body for HEAD or 304", async () => {
		const { calls, fetchImpl } = upstream(new Response(null, { status: 304, headers: { etag: '"abc"' } }));
		const response = await proxyMacSetup(
			request("/mac-setup/", { method: "HEAD", headers: { "if-none-match": '"abc"' } }),
			fetchImpl
		);

		expect(new Headers(calls[0].init.headers).get("if-none-match")).toBe('"abc"');
		expect(calls[0].init.method).toBe("HEAD");
		expect(response.status).toBe(304);
		expect(response.headers.get("etag")).toBe('"abc"');
		expect(response.body).toBeNull();
	});

	it("uses MAC_SETUP_ORIGIN when set", async () => {
		vi.stubEnv("MAC_SETUP_ORIGIN", "http://127.0.0.1:4180/");
		const { calls, fetchImpl } = upstream(new Response("ok"));
		await proxyMacSetup(request("/mac-setup/"), fetchImpl);

		expect(calls[0].url).toBe("http://127.0.0.1:4180/mac-setup/");
	});

	it("maps only /mac-setup redirect targets onto this domain", () => {
		const base = "https://sb2nov.github.io/mac-setup/x";
		expect(localRedirectLocation("/mac-setup/a/", base)).toBe("/mac-setup/a/");
		expect(localRedirectLocation("https://sb2nov.github.io/mac-setup/a/?q=1#h", base)).toBe("/mac-setup/a/?q=1#h");
		expect(localRedirectLocation("https://github.com/sb2nov/mac-setup", base)).toBe(
			"https://github.com/sb2nov/mac-setup"
		);
		expect(localRedirectLocation("https://sb2nov.github.io/mac-setupx", base)).toBe(
			"https://sb2nov.github.io/mac-setupx"
		);
	});
});
