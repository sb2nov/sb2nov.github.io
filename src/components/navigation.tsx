import { withBasePath } from "@/lib/base-path";
import Link from "next/link";
import { NavLinks } from "@/components/nav-links";
import { SafeHtml } from "@/components/safe-html";
import { getFullName, getSiteConfig, getSocials } from "@/lib/content";

const navItems = [
	{ href: "/", label: "Home" },
	{ href: "/work", label: "Work" },
	{ href: "/talks", label: "Talks" },
];

interface FooterLink {
	href: string;
	label: string;
}

function text(value: unknown): string {
	return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function socialLinks(): FooterLink[] {
	const socials = getSocials();
	const linkedin = text(socials.linkedin_username);
	const github = text(socials.github_username);
	const twitter = text(socials.twitter_username);

	return [
		linkedin ? { href: `https://www.linkedin.com/in/${linkedin}`, label: "LinkedIn" } : undefined,
		github ? { href: `https://github.com/${github}`, label: "GitHub" } : undefined,
		twitter ? { href: `https://twitter.com/${twitter}`, label: "Twitter" } : undefined,
	].filter((link): link is FooterLink => Boolean(link));
}

export function Header() {
	const config = getSiteConfig();
	const title = config.title && config.title !== "blank" ? config.title : getFullName(config);

	return (
		<header className="site-header">
			<div className="shell header-inner">
				<Link className="brand" href="/">
					{title}
				</Link>
				<NavLinks items={navItems} />
			</div>
		</header>
	);
}

export function Footer() {
	const config = getSiteConfig();
	const links = socialLinks();
	const name = getFullName(config);
	const year = new Date().getFullYear();

	return (
		<footer className="site-footer">
			<div className="shell footer-inner">
				{links.length ? (
					<nav className="footer-socials" aria-label="Social links">
						{links.map((link, index) => (
							<span key={link.href}>
								<a href={withBasePath(link.href)}>{link.label}</a>
								{index < links.length - 1 ? <span className="footer-separator">|</span> : null}
							</span>
						))}
					</nav>
				) : null}
				<p>
					© 2012–{year} {name ? <Link href="/">{name}</Link> : null}. All rights reserved.
				</p>
				{config.footer_text ? <SafeHtml as="p" html={config.footer_text} /> : null}
			</div>
		</footer>
	);
}
