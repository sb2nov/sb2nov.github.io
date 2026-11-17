import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";
import readingTime from "reading-time";
import { normalizeAssetPath, normalizeList, postRoute, slugify } from "./slugs";

const root = process.cwd();
const contentRoot = path.join(root, "content");

export type Frontmatter = Record<string, unknown>;

export interface SiteConfig {
	title?: string;
	first_name?: string;
	middle_name?: string;
	last_name?: string;
	description?: string;
	footer_text?: string;
	keywords?: string;
	lang?: string;
	url?: string;
	baseurl?: string;
	max_width?: string;
	enable_darkmode?: boolean;
	giscus?: Record<string, unknown>;
	scholar?: { last_name?: string[]; first_name?: string[] };
	enable_publication_badges?: Partial<Record<"altmetric" | "dimensions" | "google_scholar" | "inspirehep", boolean>>;
	filtered_bibtex_keywords?: string[];
}

export interface ContentEntry<TMeta extends Frontmatter = Frontmatter> {
	body: string;
	filePath: string;
	meta: TMeta & {
		slug: string;
		title: string;
	};
}

export interface PostMeta extends Frontmatter {
	title: string;
	slug: string;
	year: string;
	date: string;
	description?: string;
	layout?: string;
	tags: string[];
	categories: string[];
	thumbnail?: string;
	redirect?: string;
	giscus_comments?: boolean;
	related_posts?: boolean;
	citation?: boolean;
	related_publications?: boolean;
	readingTime?: string;
	authors?: DistillAuthor[];
	bibliography?: string;
	toc?: unknown;
	published?: boolean;
}

export interface DistillAuthor {
	name: string;
	url?: string;
	affiliations?: {
		name?: string;
		url?: string;
	};
}

export interface WorkRole {
	title: string;
	/** "Mon YYYY - Mon YYYY" or "Mon YYYY - Present". */
	years: string;
	/** One sentence each; inline markdown links are allowed. */
	highlights: string[];
}

export interface WorkEntry {
	company: string;
	url?: string;
	/** Newest first. */
	roles: WorkRole[];
}

/** Overall span of a company's roles: start of the earliest role to end of the latest. */
export function workSpan(entry: WorkEntry): string {
	const latest = entry.roles[0]?.years.split(/\s+-\s+/) ?? [];
	const earliest = entry.roles.at(-1)?.years.split(/\s+-\s+/) ?? [];
	return [earliest[0], latest.at(-1)].filter(Boolean).join(" - ");
}

export interface TalkLink {
	label: string;
	url: string;
}

export interface TalkVenue {
	venue: string;
	url?: string;
	links?: TalkLink[];
}

export interface Talk extends TalkVenue {
	title: string;
	description?: string;
	also_intro?: string;
	also?: TalkVenue[];
}

export interface TalkYear {
	year: number;
	talks: Talk[];
}

function asRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function contentPath(...parts: string[]): string {
	return path.join(contentRoot, ...parts);
}

function readYaml<T>(filePath: string): T {
	return yaml.load(fs.readFileSync(filePath, "utf8")) as T;
}

function toIsoDate(value: unknown): string {
	if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString();
	if (typeof value === "string") {
		const parsed = new Date(value);
		if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString();
		return value;
	}
	return "";
}

function yearFromDate(date: string, fallback: unknown): string {
	const parsed = new Date(date);
	if (!Number.isNaN(parsed.valueOf())) return String(parsed.getUTCFullYear());
	return String(fallback ?? "");
}

function readCollection<TMeta extends Frontmatter>(directory: string): ContentEntry<TMeta>[] {
	const dir = contentPath(directory);
	if (!fs.existsSync(dir)) return [];

	return fs
		.readdirSync(dir)
		.filter((file) => file.endsWith(".mdx"))
		.sort()
		.map((file) => {
			const filePath = path.join(dir, file);
			const parsed = matter(fs.readFileSync(filePath, "utf8"));
			const data = asRecord(parsed.data);
			const slug = typeof data.slug === "string" ? data.slug : slugify(path.basename(file, ".mdx"));
			const title = typeof data.title === "string" ? data.title : slug.replace(/-/g, " ");

			return {
				body: parsed.content,
				filePath,
				meta: {
					...data,
					slug,
					title,
				} as TMeta & { slug: string; title: string },
			};
		});
}

export function getSiteConfig(): SiteConfig {
	return readYaml<SiteConfig>(contentPath("site.yml"));
}

/**
 * Absolute origin (plus optional base path) used for canonical URLs, the sitemap, and the RSS feed.
 * `SITE_URL` overrides `url` + `baseurl` from content/site.yml, e.g. for preview deployments.
 */
export function getSiteUrl(config = getSiteConfig()): string {
	const fromEnv = process.env.SITE_URL?.trim();
	const base = fromEnv || `${config.url ?? "http://localhost:3000"}${config.baseurl ?? ""}`;
	return base.replace(/\/+$/, "");
}

export function absoluteUrl(pathname: string, config = getSiteConfig()): string {
	if (/^https?:\/\//.test(pathname)) return pathname;
	let normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
	// Static exports use trailing-slash URLs (blog/index.html), so page URLs get one to avoid redirects.
	if (process.env.NEXT_OUTPUT === "export" && !normalized.endsWith("/") && !/\.[a-z0-9]+$/i.test(normalized)) {
		normalized = `${normalized}/`;
	}
	return `${getSiteUrl(config)}${normalized}`;
}

export function pageAlternates(canonical: string) {
	// Absolute URLs keep the base path (e.g. /portfolio) that root-relative metadata paths would drop.
	return { canonical: canonical.startsWith(".") ? canonical : absoluteUrl(canonical) };
}

export function getSiteTitle(config = getSiteConfig()): string {
	return config.title && config.title !== "blank" ? config.title : getFullName(config);
}

export function getFullName(config = getSiteConfig()): string {
	return [config.first_name, config.middle_name, config.last_name].filter(Boolean).join(" ").trim();
}

export function getPage(slug: string): ContentEntry | undefined {
	return readCollection("pages").find((page) => page.meta.slug === slug);
}

/**
 * Posts with `published: false` are drafts: they render under `pnpm run dev` (and in tests)
 * but are left out of production builds. Set SHOW_DRAFTS=1 to include them in a build.
 */
export function includeDrafts(): boolean {
	return process.env.NODE_ENV !== "production" || process.env.SHOW_DRAFTS === "1";
}

export function getPosts(): ContentEntry<PostMeta>[] {
	const drafts = includeDrafts();
	return readCollection<PostMeta>("posts")
		.filter((entry) => drafts || entry.meta.published !== false)
		.map((entry) => {
			const date = toIsoDate(entry.meta.date);
			const year = yearFromDate(date, entry.meta.year);
			return {
				...entry,
				meta: {
					...entry.meta,
					date,
					year,
					tags: normalizeList(entry.meta.tags),
					categories: normalizeList(entry.meta.categories),
					thumbnail: normalizeAssetPath(entry.meta.thumbnail),
					redirect: normalizeAssetPath(entry.meta.redirect),
					readingTime: readingTime(entry.body).text,
				},
			};
		})
		.sort((a, b) => new Date(b.meta.date).valueOf() - new Date(a.meta.date).valueOf());
}

export function getPost(year: string, slug: string): ContentEntry<PostMeta> | undefined {
	return getPosts().find((post) => post.meta.year === year && post.meta.slug === slug);
}

export function getPostRoute(post: ContentEntry<PostMeta>): string {
	return postRoute(post.meta.year, post.meta.slug);
}

export function getRelatedPosts(post: ContentEntry<PostMeta>, limit = 5): ContentEntry<PostMeta>[] {
	const tags = new Set(post.meta.tags);
	return getPosts()
		.filter((candidate) => candidate.meta.slug !== post.meta.slug)
		.map((candidate) => ({
			candidate,
			score:
				candidate.meta.tags.filter((tag) => tags.has(tag)).length +
				candidate.meta.categories.filter((category) => post.meta.categories.includes(category)).length,
		}))
		.filter((item) => item.score > 0)
		.sort(
			(a, b) =>
				b.score - a.score || new Date(b.candidate.meta.date).valueOf() - new Date(a.candidate.meta.date).valueOf()
		)
		.slice(0, limit)
		.map((item) => item.candidate);
}

export function getSocials(): Record<string, unknown> {
	return readYaml<Record<string, unknown>>(contentPath("data", "socials.yml"));
}

export function getWork(): WorkEntry[] {
	return readYaml<WorkEntry[]>(contentPath("data", "work.yml")) ?? [];
}

export function getTalks(): TalkYear[] {
	return (readYaml<TalkYear[]>(contentPath("data", "talks.yml")) ?? []).sort((a, b) => b.year - a.year);
}
