import Link from "next/link";

export default function NotFound() {
	return (
		<div className="shell page">
			<header className="page-header">
				<h1>Page not found</h1>
				<p>Nothing exists at this route.</p>
				<Link className="button-link" href="/">
					return home
				</Link>
			</header>
		</div>
	);
}
