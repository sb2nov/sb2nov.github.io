"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
	href: string;
	label: string;
}

function normalize(pathname: string): string {
	return pathname.replace(/\/+$/, "") || "/";
}

/** Primary navigation; marks the current page with aria-current for styling and screen readers. */
export function NavLinks({ items }: { items: NavItem[] }) {
	const pathname = normalize(usePathname() ?? "/");

	return (
		<nav className="nav-links" aria-label="Primary navigation">
			{items.map((item) => (
				<Link
					aria-current={normalize(item.href) === pathname ? "page" : undefined}
					href={item.href}
					key={item.href}
					prefetch={false}
				>
					{item.label}
				</Link>
			))}
		</nav>
	);
}
