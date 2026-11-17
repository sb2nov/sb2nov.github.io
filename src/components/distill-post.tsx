import { withBasePath } from "@/lib/base-path";
import type { ReactNode } from "react";
import { Citation } from "@/components/citations";
import { Giscus } from "@/components/embeds";
import { MetaLine, PostList } from "@/components/cards";
import { MdxContent } from "@/components/mdx-content";
import { PostCitation } from "@/components/post-citation";
import type { ContentEntry, DistillAuthor, PostMeta } from "@/lib/content";
import { getFullName } from "@/lib/content";
import { buildToc } from "@/lib/headings";
import { getPublications, type Publication } from "@/lib/publications";
import { slugify } from "@/lib/slugs";

interface DistillPostProps {
	post: ContentEntry<PostMeta>;
	related: ContentEntry<PostMeta>[];
}

interface TocItem {
	name: string;
	/** Explicit anchor id; front-matter items fall back to slugify(name). */
	id?: string;
	subsections?: TocItem[];
}

type TocPlacement = "left" | "right" | "inline";

function isTocItem(value: unknown): value is TocItem {
	return Boolean(value && typeof value === "object" && "name" in value && typeof value.name === "string");
}

function tocItems(value: unknown): TocItem[] {
	return Array.isArray(value) ? value.filter(isTocItem) : [];
}

/**
 * `toc` front matter can be a list of sections (distill style) or an object:
 * `{ sidebar: left | right }` or `{ beginning: true }`, which auto-generates the
 * contents from the post's `##`/`###` headings.
 */
function resolveToc(post: ContentEntry<PostMeta>): { items: TocItem[]; placement: TocPlacement } {
	const toc = post.meta.toc;
	if (Array.isArray(toc)) return { items: tocItems(toc), placement: "left" };
	if (!toc) return { items: [], placement: "left" };

	const options = typeof toc === "object" ? (toc as Record<string, unknown>) : {};
	const placement: TocPlacement = options.beginning ? "inline" : options.sidebar === "right" ? "right" : "left";
	return { items: buildToc(post.body), placement };
}

function distillAuthors(value: DistillAuthor[] | undefined): DistillAuthor[] {
	const authors = Array.isArray(value) ? value.filter((author) => author.name) : [];
	if (authors.length) return authors;
	const owner = getFullName();
	return owner ? [{ name: owner }] : [];
}

/** Publications cited via <Citation ids="..."> or <Reference ids="..."> in the post body. */
function citedPublications(source: string): Publication[] {
	const ids = new Set(
		[...source.matchAll(/<(?:Citation|Reference)\s+ids="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/))
	);
	return getPublications().filter((publication) => ids.has(publication.id));
}

function formattedDate(date: string) {
	return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
		new Date(date)
	);
}

function textFromMdx(value: string) {
	return value
		.replace(/<[^>]+>/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

function extractFootnotes(source: string) {
	return [...source.matchAll(/(?<!`)<Footnote>([\s\S]*?)<\/Footnote>/g)].map((match) => textFromMdx(match[1]));
}

function createDistillFootnote() {
	let index = 0;

	return function DistillFootnote({ children }: { children?: ReactNode }) {
		index += 1;
		return (
			<span className="distill-footnote" id={`d-footnote-${index}`}>
				<a aria-label={`Footnote ${index}`} className="distill-footnote-number" href={`#d-footnote-${index}-listing`}>
					{index}
				</a>
				<span className="distill-footnote-popover">{children}</span>
			</span>
		);
	};
}

export function DistillPost({ post, related }: DistillPostProps) {
	const authors = distillAuthors(post.meta.authors);
	const bibliography = post.meta.bibliography;
	const references = bibliography
		? getPublications(bibliography)
		: post.meta.related_publications
			? citedPublications(post.body)
			: [];
	const toc = resolveToc(post);
	const footnotes = extractFootnotes(post.body);
	const DistillFootnote = createDistillFootnote();

	return (
		<div className="post distill distill-page">
			<d-title class="distill-title">
				<h1>{post.meta.title}</h1>
				{post.meta.description ? <p>{post.meta.description}</p> : null}
				<MetaLine post={post} showDate={false} />
			</d-title>

			<DistillByline authors={authors} date={post.meta.date} />

			<d-article class="distill-article">
				<DistillContents items={toc.items} placement={toc.placement} />
				<MdxContent
					className="distill-mdx"
					components={{
						Citation: (props) => (
							<Citation bibliography={bibliography} ids={String(props.ids ?? "")} numeric={Boolean(bibliography)} />
						),
						Footnote: DistillFootnote,
					}}
					source={post.body}
				/>
			</d-article>

			{footnotes.length || references.length || post.meta.citation ? (
				<d-appendix class="distill-appendix">
					{footnotes.length ? (
						<d-footnote-list>
							<h3>Footnotes</h3>
							<ol>
								{footnotes.map((footnote, index) => (
									<li id={`d-footnote-${index + 1}-listing`} key={`${footnote}-${index}`}>
										{footnote}
										<a className="footnote-backlink" href={`#d-footnote-${index + 1}`}>
											[↩]
										</a>
									</li>
								))}
							</ol>
						</d-footnote-list>
					) : null}
					{references.length ? (
						<d-citation-list>
							<h3 id="references">References</h3>
							<ol className="references" id="references-list">
								{references.map((reference) => (
									<li id={reference.id} key={reference.id}>
										<span className="title">{reference.title}</span>
										{reference.url ? (
											<>
												{" "}
												<a href={withBasePath(reference.url)}>[PDF]</a>
											</>
										) : null}
										<br />
										{reference.author ? `${reference.author}. ` : ""}
										{reference.year ? `${reference.year}. ` : ""}
										{reference.journal}
									</li>
								))}
							</ol>
						</d-citation-list>
					) : null}
					{post.meta.citation ? (
						<d-citation-list>
							<PostCitation post={post} />
						</d-citation-list>
					) : null}
				</d-appendix>
			) : null}

			{bibliography ? <d-bibliography src={withBasePath(`/assets/bibliography/${bibliography}`)} /> : null}

			<d-article class="distill-after">
				<Giscus enabled={post.meta.giscus_comments} />
				{related.length ? (
					<section>
						<h2>related posts</h2>
						<PostList posts={related} />
					</section>
				) : null}
			</d-article>
		</div>
	);
}

function DistillByline({ authors, date }: { authors: DistillAuthor[]; date: string }) {
	const hasAffiliations = authors.some((author) => author.affiliations?.name);
	return (
		<d-byline class="distill-byline">
			<div className="byline grid">
				<div className={`authors-affiliations grid${hasAffiliations ? "" : " no-affiliations"}`}>
					<h3>Authors</h3>
					{hasAffiliations ? <h3>Affiliations</h3> : null}
					{authors.map((author) => (
						<FragmentedAuthor author={author} key={author.name} showAffiliation={hasAffiliations} />
					))}
				</div>
				<div>
					<h3>Published</h3>
					<p>{formattedDate(date)}</p>
				</div>
			</div>
		</d-byline>
	);
}

function FragmentedAuthor({ author, showAffiliation }: { author: DistillAuthor; showAffiliation: boolean }) {
	return (
		<>
			<p className="author">
				{author.url ? (
					<a className="name" href={author.url}>
						{author.name}
					</a>
				) : (
					author.name
				)}
			</p>
			{showAffiliation ? (
				<p className="affiliation">
					{author.affiliations?.name ? <span className="affiliation">{author.affiliations.name}</span> : null}
				</p>
			) : null}
		</>
	);
}

function DistillContents({ items, placement }: { items: TocItem[]; placement: TocPlacement }) {
	if (!items.length) return null;

	return (
		<d-contents class={`distill-contents distill-contents-${placement}`}>
			<nav aria-label="Contents" className="l-text figcaption">
				<h3>Contents</h3>
				{items.map((item) => (
					<div key={item.name}>
						<a href={`#${item.id ?? slugify(item.name)}`}>{item.name}</a>
						{item.subsections?.length ? (
							<ul>
								{item.subsections.map((subsection) => (
									<li key={subsection.name}>
										<a href={`#${subsection.id ?? slugify(subsection.name)}`}>{subsection.name}</a>
									</li>
								))}
							</ul>
						) : null}
					</div>
				))}
			</nav>
		</d-contents>
	);
}
