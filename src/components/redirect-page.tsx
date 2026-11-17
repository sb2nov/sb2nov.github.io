import { redirect } from "next/navigation";

/** Redirects to `target` (used by posts with `redirect` front matter). */
export function RedirectPage({ target }: { target: string }): never {
	redirect(target);
}
