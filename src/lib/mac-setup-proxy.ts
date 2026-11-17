/**
 * Serves https://sourabhbajaj.com/mac-setup/* from the sb2nov/mac-setup GitHub Pages site.
 *
 * mac-setup used to live on this domain because it is a GitHub Pages project site under the
 * user site's custom domain. Now that the main site is hosted elsewhere, we proxy it so the
 * public URLs (and their search ranking) stay the same.
 *
 * The proxy passes GitHub Pages behavior through untouched: extensionless `.html` lookups,
 * `/dir` -> `/dir/` redirects, and the custom 404 page. GitHub's redirects point at its own
 * host, so `Location` headers are rewritten back onto this domain.
 */

export const MAC_SETUP_PREFIX = "/mac-setup";

/** Cached at the CDN for an hour and served stale for a day while it refreshes. */
export const MAC_SETUP_CACHE_CONTROL = "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400";

const FORWARDED_REQUEST_HEADERS = [
	"accept",
	"accept-language",
	"if-modified-since",
	"if-none-match",
	"range",
	"user-agent",
];
const FORWARDED_RESPONSE_HEADERS = ["accept-ranges", "content-range", "content-type", "etag", "last-modified"];

export function macSetupOrigin(): string {
	return (process.env.MAC_SETUP_ORIGIN ?? "https://sb2nov.github.io").replace(/\/+$/, "");
}

function isUnderPrefix(pathname: string): boolean {
	return pathname === MAC_SETUP_PREFIX || pathname.startsWith(`${MAC_SETUP_PREFIX}/`);
}

/**
 * Maps an upstream redirect target onto this site. Targets under /mac-setup on GitHub's host
 * (or any host) become same-site paths; anything else is returned as an absolute URL.
 */
export function localRedirectLocation(location: string, upstreamUrl: string): string {
	const target = new URL(location, upstreamUrl);
	if (isUnderPrefix(target.pathname)) return `${target.pathname}${target.search}${target.hash}`;
	return target.toString();
}

function plainResponse(status: number, message: string): Response {
	return new Response(message, {
		status,
		headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
	});
}

export async function proxyMacSetup(request: Request, fetchImpl: typeof fetch = fetch): Promise<Response> {
	const url = new URL(request.url);
	if (!isUnderPrefix(url.pathname)) return plainResponse(404, "Not found");

	const upstreamUrl = `${macSetupOrigin()}${url.pathname}${url.search}`;
	const headers = new Headers();
	for (const name of FORWARDED_REQUEST_HEADERS) {
		const value = request.headers.get(name);
		if (value) headers.set(name, value);
	}

	let upstream: Response;
	try {
		upstream = await fetchImpl(upstreamUrl, {
			method: request.method === "HEAD" ? "HEAD" : "GET",
			headers,
			redirect: "manual",
			cache: "no-store",
		});
	} catch {
		return plainResponse(502, "mac-setup is temporarily unavailable.");
	}

	const responseHeaders = new Headers({ "cache-control": MAC_SETUP_CACHE_CONTROL });
	for (const name of FORWARDED_RESPONSE_HEADERS) {
		const value = upstream.headers.get(name);
		if (value) responseHeaders.set(name, value);
	}

	if (upstream.status >= 300 && upstream.status < 400 && upstream.status !== 304) {
		const location = upstream.headers.get("location");
		if (!location) return plainResponse(502, "mac-setup returned a redirect without a location.");

		const local = localRedirectLocation(location, upstreamUrl);
		// While GitHub still has this domain configured on the user site, it redirects every
		// github.io request back here. Proxying that would loop, so fail loudly instead.
		if (local === `${url.pathname}${url.search}`) {
			return plainResponse(
				502,
				"mac-setup redirect loop: remove the custom domain from the sb2nov.github.io GitHub Pages settings."
			);
		}
		responseHeaders.set("location", local);
		return new Response(null, { status: upstream.status, headers: responseHeaders });
	}

	const hasBody = request.method !== "HEAD" && upstream.status !== 204 && upstream.status !== 304;
	return new Response(hasBody ? upstream.body : null, { status: upstream.status, headers: responseHeaders });
}
