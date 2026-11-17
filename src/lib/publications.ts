import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { sanitizeTrustedHtml } from "@/components/safe-html";
import { getSiteConfig, getSocials } from "./content";

export interface PublicationAuthor {
	first: string;
	last: string;
	/** Footnote markers such as `*` or `†`, rendered as superscripts. */
	marks: string;
	isSelf: boolean;
	url?: string;
}

export interface PublicationLink {
	label: string;
	href: string;
}

export interface PublicationBadges {
	altmetric?: Record<string, string>;
	dimensions?: Record<string, string>;
	scholar?: { href: string; citations: number };
	inspire?: { href: string; id: string };
}

export interface Publication {
	id: string;
	type: string;
	title: string;
	/** Plain-text author list as written in the BibTeX entry. */
	author?: string;
	authors: PublicationAuthor[];
	year?: string;
	month?: string;
	journal?: string;
	publisher?: string;
	/** Journal, proceedings, or school line rendered under the authors. */
	venue?: string;
	location?: string;
	note?: string;
	additionalInfoHtml?: string;
	annotationHtml?: string;
	abbr?: string;
	abbrUrl?: string;
	abbrColor?: string;
	doi?: string;
	url?: string;
	html?: string;
	pdf?: string;
	preview?: string;
	video?: string;
	links: PublicationLink[];
	badges: PublicationBadges;
	selected: boolean;
	award?: string;
	awardName?: string;
	awardHtml?: string;
	abstract?: string;
	/** Cleaned BibTeX source, present only when `bibtex_show = {true}`. */
	bibtex?: string;
	/** Lower-cased text used by the publication search box. */
	searchText: string;
	fields: Record<string, string>;
}

const defaultFilteredKeywords = [
	"abbr",
	"abstract",
	"additional_info",
	"altmetric",
	"annotation",
	"arxiv",
	"award",
	"award_name",
	"bibtex_show",
	"blog",
	"code",
	"dimensions",
	"eprint",
	"google_scholar_id",
	"hal",
	"html",
	"inspirehep_id",
	"pdf",
	"pmid",
	"poster",
	"preview",
	"selected",
	"slides",
	"supp",
	"video",
	"website",
];

const authorMarks = /[*∗†‡§¶‖&^]+/g;

const accentMarks: Record<string, string> = {
	'"': "̈",
	"'": "́",
	"`": "̀",
	"^": "̂",
	"~": "̃",
	"=": "̄",
	".": "̇",
	u: "̆",
	v: "̌",
	H: "̋",
	c: "̧",
	k: "̨",
	r: "̊",
};

function splitEntries(source: string): string[] {
	const entries: string[] = [];
	let start = -1;
	let depth = 0;

	for (let index = 0; index < source.length; index += 1) {
		const char = source[index];
		const previous = source[index - 1];

		if (char === "@" && depth === 0) start = index;
		if (char === "{" && previous !== "\\") depth += 1;
		if (char === "}" && previous !== "\\") {
			depth -= 1;
			if (depth === 0 && start >= 0) {
				entries.push(source.slice(start, index + 1));
				start = -1;
			}
		}
	}

	return entries;
}

/** Parses `name = {value}` / `name = "value"` / `name = macro` pairs, keeping raw (uncleaned) values. */
function parseRawFields(body: string, macros: Record<string, string>): Record<string, string> {
	const fields: Record<string, string> = {};
	let index = 0;

	while (index < body.length) {
		const nameMatch = body.slice(index).match(/^\s*,?\s*([a-zA-Z0-9_:-]+)\s*=\s*/);
		if (!nameMatch) break;
		const name = nameMatch[1].toLowerCase();
		index += nameMatch[0].length;

		const opener = body[index];
		let value = "";

		if (opener === "{" || opener === '"') {
			const closer = opener === "{" ? "}" : '"';
			let depth = opener === "{" ? 1 : 0;
			index += 1;
			const start = index;

			while (index < body.length) {
				const char = body[index];
				const previous = body[index - 1];
				if (opener === "{" && char === "{" && previous !== "\\") depth += 1;
				if (char === closer && previous !== "\\") {
					if (opener === "{") {
						depth -= 1;
						if (depth === 0) break;
					} else {
						break;
					}
				}
				index += 1;
			}

			value = body.slice(start, index);
			index += 1;
		} else {
			const end = body.indexOf(",", index);
			const token = body.slice(index, end === -1 ? body.length : end).trim();
			value = macros[token.toLowerCase()] ?? token;
			index = end === -1 ? body.length : end + 1;
		}

		fields[name] = value;
	}

	return fields;
}

export function cleanBibtex(value: string): string {
	return value
		.replace(/\{?\\(["'`^~=.uvHckr])\s*\{?([A-Za-z])\}?\}?/g, (_match, accent: string, letter: string) => {
			return letter + (accentMarks[accent] ?? "");
		})
		.replace(/\\ss\b\s*/g, "ß")
		.replace(/\\o\b\s*/g, "ø")
		.replace(/\\O\b\s*/g, "Ø")
		.replace(/\\&/g, "&")
		.replace(/\\%/g, "%")
		.replace(/[{}]/g, "")
		.replace(/---/g, "—")
		.replace(/--/g, "–")
		.replace(/\s+/g, " ")
		.trim()
		.normalize("NFC");
}

function removeAccents(value: string): string {
	return value.normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

/** Renders the small Markdown subset used in bib fields (bold, italics, links) to sanitized HTML. */
export function inlineMarkdown(value: string): string {
	const html = value
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<em>$2</em>")
		.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
	return sanitizeTrustedHtml(html);
}

function assetLink(value: string | undefined, directory: string): string | undefined {
	if (!value) return undefined;
	if (/^(https?:)?\/\//.test(value) || value.startsWith("/")) return value;
	return `/assets/${directory}/${value.replace(new RegExp(`^/?assets/${directory}/`), "")}`;
}

function readDataFile<T>(fileName: string): T | undefined {
	const filePath = path.join(process.cwd(), "content", "data", fileName);
	if (!fs.existsSync(filePath)) return undefined;
	return yaml.load(fs.readFileSync(filePath, "utf8")) as T;
}

type CoauthorData = Record<string, Array<{ firstname: string[]; url: string }>>;
type VenueData = Record<string, { url?: string; color?: string }>;
type CitationData = { papers?: Record<string, { citations?: number }> };

interface PublicationContext {
	selfLastNames: string[];
	selfFirstNames: string[];
	coauthors: CoauthorData;
	venues: VenueData;
	citations: CitationData;
	scholarUserId?: string;
	filteredKeywords: Set<string>;
	badges: Record<string, boolean>;
}

function loadContext(): PublicationContext {
	const config = getSiteConfig();
	const scholar = config.scholar ?? {};
	const badges = config.enable_publication_badges ?? {};
	const socials = getSocials();

	return {
		selfLastNames: (scholar.last_name ?? []).map(String),
		selfFirstNames: (scholar.first_name ?? []).map(String),
		coauthors: readDataFile<CoauthorData>("coauthors.yml") ?? {},
		venues: readDataFile<VenueData>("venues.yml") ?? {},
		citations: readDataFile<CitationData>("citations.yml") ?? {},
		scholarUserId: typeof socials.scholar_userid === "string" ? socials.scholar_userid : undefined,
		filteredKeywords: new Set(config.filtered_bibtex_keywords ?? defaultFilteredKeywords),
		badges: {
			altmetric: badges.altmetric !== false,
			dimensions: badges.dimensions !== false,
			google_scholar: badges.google_scholar !== false,
			inspirehep: badges.inspirehep !== false,
		},
	};
}

export function parseAuthors(
	value: string | undefined,
	context?: Pick<PublicationContext, "selfLastNames" | "selfFirstNames" | "coauthors">
): PublicationAuthor[] {
	if (!value) return [];

	return value
		.split(/\s+and\s+/)
		.map((name) => name.trim())
		.filter(Boolean)
		.map((name) => {
			let first = "";
			let last = "";
			const commaIndex = name.indexOf(",");

			if (commaIndex >= 0) {
				last = name.slice(0, commaIndex).trim();
				first = name.slice(commaIndex + 1).trim();
			} else {
				const parts = name.split(/\s+/);
				last = parts.pop() ?? "";
				first = parts.join(" ");
			}

			const marks = [...`${first}${last}`.matchAll(authorMarks)].map((match) => match[0]).join("");
			first = first.replace(authorMarks, "").trim();
			last = last.replace(authorMarks, "").trim();

			const isSelf = Boolean(context?.selfLastNames.includes(last) && context.selfFirstNames.includes(first));
			const coauthorKey = removeAccents(last).toLowerCase();
			const url = context?.coauthors[coauthorKey]?.find((coauthor) =>
				coauthor.firstname.map(String).includes(first)
			)?.url;

			return { first, last, marks, isSelf, url };
		});
}

function citationCount(context: PublicationContext, scholarId: string): number {
	const papers = context.citations.papers ?? {};
	const keyed = context.scholarUserId ? papers[`${context.scholarUserId}:${scholarId}`] : undefined;
	if (keyed?.citations !== undefined) return keyed.citations;
	if (papers[scholarId]?.citations !== undefined) return papers[scholarId].citations ?? 0;
	const match = Object.entries(papers).find(([key]) => key.includes(scholarId));
	return match?.[1].citations ?? 0;
}

function buildBadges(fields: Record<string, string>, context: PublicationContext): PublicationBadges {
	const badges: PublicationBadges = {};
	const isOn = (value: string | undefined) => Boolean(value) && value !== "false";

	if (context.badges.altmetric && isOn(fields.altmetric)) {
		const value = fields.altmetric;
		if (value !== "true") badges.altmetric = { "data-altmetric-id": value };
		else if (fields.arxiv) badges.altmetric = { "data-arxiv-id": fields.arxiv };
		else if (fields.eprint) badges.altmetric = { "data-arxiv-id": fields.eprint };
		else if (fields.doi) badges.altmetric = { "data-doi": fields.doi };
		else if (fields.pmid) badges.altmetric = { "data-pmid": fields.pmid };
		else if (fields.isbn) badges.altmetric = { "data-isbn": fields.isbn };
	}

	if (context.badges.dimensions && isOn(fields.dimensions)) {
		const value = fields.dimensions;
		if (value !== "true") badges.dimensions = { "data-id": value };
		else if (fields.doi) badges.dimensions = { "data-doi": fields.doi };
		else if (fields.pmid) badges.dimensions = { "data-pmid": fields.pmid };
	}

	if (context.badges.google_scholar && fields.google_scholar_id) {
		const user = context.scholarUserId ?? "";
		badges.scholar = {
			href: `https://scholar.google.com/citations?view_op=view_citation&hl=en&user=${user}&citation_for_view=${user}:${fields.google_scholar_id}`,
			citations: citationCount(context, fields.google_scholar_id),
		};
	}

	if (context.badges.inspirehep && fields.inspirehep_id) {
		badges.inspire = {
			href: `https://inspirehep.net/literature/${fields.inspirehep_id}`,
			id: fields.inspirehep_id,
		};
	}

	return badges;
}

function buildLinks(fields: Record<string, string>): PublicationLink[] {
	const candidates: Array<[string, string | undefined]> = [
		["DOI", fields.doi ? `https://doi.org/${fields.doi}` : undefined],
		["arXiv", fields.arxiv ? `https://arxiv.org/abs/${fields.arxiv}` : undefined],
		["HAL", fields.hal ? `https://hal.science/${fields.hal}` : undefined],
		["HTML", assetLink(fields.html, "html")],
		["PDF", assetLink(fields.pdf, "pdf")],
		["Supp", assetLink(fields.supp, "pdf")],
		["Blog", fields.blog],
		["Code", fields.code],
		["Poster", assetLink(fields.poster, "pdf")],
		["Slides", assetLink(fields.slides, "pdf")],
		["Website", fields.website],
	];

	return candidates
		.filter((link): link is [string, string] => Boolean(link[1]))
		.map(([label, href]) => ({ label, href }));
}

function buildVenue(type: string, fields: Record<string, string>): string | undefined {
	if (type === "article") return fields.journal;
	if (type === "inproceedings" || type === "incollection")
		return fields.booktitle ? `In ${fields.booktitle}` : undefined;
	if (type === "thesis" || type === "mastersthesis" || type === "phdthesis") return fields.school;
	return undefined;
}

function buildBibtex(type: string, id: string, rawFields: Record<string, string>, filtered: Set<string>): string {
	const entries = Object.entries(rawFields).filter(([name]) => !filtered.has(name));
	const width = Math.max(0, ...entries.map(([name]) => name.length));
	const lines = entries.map(([name, value]) => `  ${name.padEnd(width)} = {${value.replace(/\s+/g, " ").trim()}}`);
	return `@${type}{${id},\n${lines.join(",\n")}\n}`;
}

function capitalize(value: string | undefined): string | undefined {
	if (!value) return undefined;
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseEntry(
	entry: string,
	macros: Record<string, string>,
	context: PublicationContext
): Publication | undefined {
	const header = entry.match(/^@([a-zA-Z]+)\s*\{\s*([^,]+),/);
	if (!header) return undefined;

	const type = header[1].toLowerCase();
	const id = header[2].trim();
	const rawFields = parseRawFields(entry.slice(header[0].length, -1), macros);
	const fields = Object.fromEntries(Object.entries(rawFields).map(([name, value]) => [name, cleanBibtex(value)]));
	const authors = parseAuthors(fields.author, context);
	const venue = buildVenue(type, fields);
	const abbrData = fields.abbr ? context.venues[fields.abbr] : undefined;

	const publication: Publication = {
		id,
		type,
		title: fields.title ?? id,
		author: fields.author,
		authors,
		year: fields.year,
		month: capitalize(fields.month),
		journal: fields.journal,
		publisher: fields.publisher,
		venue,
		location: fields.location,
		note: fields.note,
		// additional_info and annotation intentionally keep their raw (uncleaned) Markdown/HTML.
		additionalInfoHtml: rawFields.additional_info ? inlineMarkdown(rawFields.additional_info) : undefined,
		annotationHtml: rawFields.annotation ? inlineMarkdown(rawFields.annotation) : undefined,
		abbr: fields.abbr,
		abbrUrl: abbrData?.url,
		abbrColor: abbrData?.color,
		doi: fields.doi,
		url: fields.url,
		html: assetLink(fields.html, "html"),
		pdf: assetLink(fields.pdf, "pdf"),
		preview: assetLink(fields.preview, "img/publication_preview"),
		video: fields.video,
		links: buildLinks(fields),
		badges: buildBadges(fields, context),
		selected: fields.selected === "true",
		award: fields.award,
		awardName: fields.award_name,
		awardHtml: rawFields.award ? inlineMarkdown(rawFields.award) : undefined,
		abstract: fields.abstract,
		bibtex: fields.bibtex_show === "true" ? buildBibtex(type, id, rawFields, context.filteredKeywords) : undefined,
		searchText: "",
		fields,
	};

	publication.searchText = [
		publication.title,
		...authors.map((author) => `${author.first} ${author.last}`),
		publication.venue,
		publication.publisher,
		publication.year,
		publication.abbr,
		publication.abstract,
		id,
	]
		.filter(Boolean)
		.join(" ")
		.toLowerCase();

	return publication;
}

function parseMacros(entries: string[]): Record<string, string> {
	const macros: Record<string, string> = {};
	for (const entry of entries.filter((item) => /^@string\s*\{/i.test(item))) {
		const body = entry.replace(/^@string\s*\{/i, "").slice(0, -1);
		Object.assign(macros, parseRawFields(body, macros));
	}
	return Object.fromEntries(Object.entries(macros).map(([name, value]) => [name, value.replace(/,\s*$/, "")]));
}

export function getPublications(fileName = "papers.bib"): Publication[] {
	const filePath = path.join(process.cwd(), "content", "bibliography", fileName);
	if (!fs.existsSync(filePath)) return [];
	const entries = splitEntries(fs.readFileSync(filePath, "utf8"));
	const macros = parseMacros(entries);
	const context = loadContext();

	return entries
		.filter((entry) => !/^@(string|preamble|comment)\s*\{/i.test(entry))
		.map((entry) => parseEntry(entry, macros, context))
		.filter((entry): entry is Publication => Boolean(entry))
		.sort((a, b) => Number(b.year ?? 0) - Number(a.year ?? 0) || a.title.localeCompare(b.title));
}
