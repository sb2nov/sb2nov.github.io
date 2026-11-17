import type { Metadata } from "next";
import { Footer, Header } from "@/components/navigation";
import { ThemeProvider } from "@/components/theme";
import { withBasePath } from "@/lib/base-path";
import { getSiteConfig, getSiteTitle, getSiteUrl, getSocials, pageAlternates } from "@/lib/content";
import "@/styles/globals.scss";

function stripMarkdown(value: string | undefined): string | undefined {
	return value
		?.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.replace(/[*_`]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

export function generateMetadata(): Metadata {
	const config = getSiteConfig();
	const title = getSiteTitle(config);
	const description = stripMarkdown(config.description);
	const twitter = getSocials().twitter_username;

	return {
		metadataBase: new URL(`${getSiteUrl(config)}/`),
		title: {
			default: title,
			template: `%s | ${title}`,
		},
		description,
		keywords: config.keywords,
		alternates: pageAlternates("./"),
		openGraph: {
			type: "website",
			siteName: title,
			title,
			description,
			locale: config.lang ?? "en",
			url: "./",
			images: [{ url: "/images/favicon.png", width: 192, height: 192, alt: title }],
		},
		twitter: {
			card: "summary",
			title,
			description,
			creator: typeof twitter === "string" ? `@${twitter}` : undefined,
		},
		icons: {
			icon: [
				{ url: withBasePath("/favicon.ico"), sizes: "any" },
				{ url: withBasePath("/images/favicon.png"), type: "image/png", sizes: "192x192" },
			],
			apple: withBasePath("/images/apple-touch-icon.png"),
		},
	};
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	const config = getSiteConfig();

	return (
		<html lang={config.lang ?? "en"} suppressHydrationWarning>
			<head>
				<link
					rel="search"
					type="application/opensearchdescription+xml"
					title="sourabhbajaj.com"
					href={withBasePath("/opensearch.xml")}
				/>
			</head>
			<body>
				<ThemeProvider>
					<Header />
					<main>{children}</main>
					<Footer />
				</ThemeProvider>
			</body>
		</html>
	);
}
