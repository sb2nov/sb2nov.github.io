import { getPublications } from "@/lib/publications";
import type { Publication } from "@/lib/publications";

function isPublication(value: Publication | undefined): value is Publication {
	return Boolean(value);
}

function findPublications(ids: string, bibliography = "papers.bib") {
	const lookup = new Map(getPublications(bibliography).map((publication) => [publication.id, publication]));
	return ids
		.split(/[\s,]+/)
		.filter(Boolean)
		.map((id) => lookup.get(id))
		.filter(isPublication);
}

export function Citation({
	bibliography,
	ids,
	numeric = false,
}: {
	bibliography?: string;
	ids: string;
	numeric?: boolean;
}) {
	const publications = findPublications(ids, bibliography);
	if (!publications.length) return <span className="citation">[{ids}]</span>;

	if (numeric) {
		return (
			<span className="citation distill-citation">
				[
				{publications.map((publication, index) => (
					<a href={`#${publication.id}`} key={publication.id} title={publication.title}>
						{index > 0 ? ", " : ""}
						{index + 1}
					</a>
				))}
				]
			</span>
		);
	}

	return (
		<span className="citation">
			[
			{publications.map((publication, index) => (
				<span key={publication.id}>
					{index > 0 ? "; " : ""}
					{publication.author?.split(" and ")[0] ?? publication.title}, {publication.year}
				</span>
			))}
			]
		</span>
	);
}

export function Reference({ bibliography, ids }: { bibliography?: string; ids: string }) {
	const publications = findPublications(ids, bibliography);
	return (
		<div className="references">
			{publications.map((publication) => (
				<p key={publication.id}>
					<strong>{publication.title}</strong>. {publication.author ? `${publication.author}. ` : ""}
					{publication.journal ?? publication.publisher} {publication.year ? `(${publication.year}).` : ""}
				</p>
			))}
		</div>
	);
}

export function CitationQuote({ ids, children }: { ids: string; children: React.ReactNode }) {
	return (
		<blockquote className="citation-quote">
			{children}
			<footer>
				<Citation ids={ids} />
			</footer>
		</blockquote>
	);
}
