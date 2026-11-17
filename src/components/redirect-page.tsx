import { redirect } from "next/navigation";
import { withBasePath } from "@/lib/base-path";

/**
 * Redirects to `target`. The Node server answers with an HTTP redirect; static exports
 * (GitHub Pages) cannot, so they get a meta-refresh page with a fallback link instead.
 */
export function RedirectPage({ target }: { target: string }) {
	if (process.env.NEXT_OUTPUT !== "export") redirect(target);

	const href = withBasePath(target);
	return (
		<div className="shell page">
			<meta httpEquiv="refresh" content={`0; url=${href}`} />
			<p>
				Redirecting to <a href={href}>{href}</a>…
			</p>
		</div>
	);
}
