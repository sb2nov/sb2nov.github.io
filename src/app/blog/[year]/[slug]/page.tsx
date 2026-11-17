import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RedirectPage } from "@/components/redirect-page";
import { DistillPost } from "@/components/distill-post";
import { Giscus } from "@/components/embeds";
import { MetaLine, PostList } from "@/components/cards";
import { MdxContent } from "@/components/mdx-content";
import { PostCitation } from "@/components/post-citation";
import type { ContentEntry, PostMeta } from "@/lib/content";
import {
	absoluteUrl,
	getFullName,
	getPost,
	getPostRoute,
	getPosts,
	getRelatedPosts,
	pageAlternates,
} from "@/lib/content";

interface PageProps {
	params: Promise<{ year: string; slug: string }>;
}

// Posts are not linked from the site navigation yet; they are reachable only by URL.
export function generateStaticParams() {
	const params = getPosts().map((post) => ({ year: post.meta.year, slug: post.meta.slug }));
	// `output: export` refuses dynamic routes with no params, which is the case while every
	// post is still a draft. This placeholder renders the not-found page.
	return params.length ? params : [{ year: "_", slug: "_" }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { year, slug } = await params;
	const post = getPost(year, slug);
	if (!post) return {};
	const route = absoluteUrl(getPostRoute(post));
	const images = post.meta.thumbnail ? [absoluteUrl(post.meta.thumbnail)] : undefined;
	return {
		title: post.meta.title,
		description: post.meta.description,
		keywords: post.meta.tags,
		alternates: pageAlternates(route),
		openGraph: {
			type: "article",
			url: route,
			title: post.meta.title,
			description: post.meta.description,
			publishedTime: post.meta.date || undefined,
			tags: post.meta.tags,
			images,
		},
		twitter: {
			card: images ? "summary_large_image" : "summary",
			title: post.meta.title,
			description: post.meta.description,
			images,
		},
	};
}

function PostJsonLd({ post }: { post: ContentEntry<PostMeta> }) {
	const data = {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: post.meta.title,
		description: post.meta.description,
		datePublished: post.meta.date || undefined,
		url: absoluteUrl(getPostRoute(post)),
		image: post.meta.thumbnail ? absoluteUrl(post.meta.thumbnail) : undefined,
		keywords: post.meta.tags.join(", ") || undefined,
		author: { "@type": "Person", name: getFullName() },
	};
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
		/>
	);
}

export default async function BlogPostPage({ params }: PageProps) {
	const { year, slug } = await params;
	const post = getPost(year, slug);
	if (!post) notFound();
	if (post.meta.redirect) return <RedirectPage target={post.meta.redirect} />;

	const related = getRelatedPosts(post);

	// Distill is the default post layout; `layout: post` opts into the classic single-column layout.
	if (post.meta.layout !== "post") {
		return (
			<>
				<PostJsonLd post={post} />
				<DistillPost post={post} related={related} />
			</>
		);
	}

	return (
		<article className="shell page post-page">
			<PostJsonLd post={post} />
			<header className="page-header">
				<h1>{post.meta.title}</h1>
				{post.meta.description ? <p>{post.meta.description}</p> : null}
				<MetaLine post={post} />
			</header>
			<MdxContent source={post.body} />
			{post.meta.citation ? <PostCitation post={post} /> : null}
			<Giscus enabled={post.meta.giscus_comments} />
			{related.length ? (
				<section>
					<h2>related posts</h2>
					<PostList posts={related} />
				</section>
			) : null}
		</article>
	);
}
