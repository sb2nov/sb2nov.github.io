import { withBasePath } from "@/lib/base-path";
import Link from "next/link";
import { CalendarDays, Hash, Tag } from "lucide-react";
import type { ContentEntry, PostMeta } from "@/lib/content";
import { getPostRoute } from "@/lib/content";

export function PostList({ posts }: { posts: ContentEntry<PostMeta>[] }) {
	return (
		<div className="post-list">
			{posts.map((post) => {
				const href = post.meta.redirect || getPostRoute(post);
				const isExternal = /^https?:\/\//.test(href);

				return (
					<article
						className={post.meta.thumbnail ? "post-item" : "post-item no-thumb"}
						key={`${post.meta.year}-${post.meta.slug}`}
					>
						{post.meta.thumbnail ? <img src={withBasePath(post.meta.thumbnail)} alt="" className="post-thumb" /> : null}
						<div>
							<h2>
								{isExternal ? (
									<a href={withBasePath(href)} target="_blank" rel="noreferrer">
										{post.meta.title}
									</a>
								) : (
									<Link href={href}>{post.meta.title}</Link>
								)}
							</h2>
							{post.meta.description ? <p>{post.meta.description}</p> : null}
							<MetaLine post={post} />
						</div>
					</article>
				);
			})}
		</div>
	);
}

export function MetaLine({ post, showDate = true }: { post: ContentEntry<PostMeta>; showDate?: boolean }) {
	const date =
		showDate && post.meta.date
			? new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
					new Date(post.meta.date)
				)
			: "";

	return (
		<div className="meta-line">
			{date ? (
				<span>
					<CalendarDays size={14} /> {date}
				</span>
			) : null}
			{post.meta.tags.map((tag) => (
				<span key={`tag-${tag}`}>
					<Hash size={14} /> {tag}
				</span>
			))}
			{post.meta.categories.map((category) => (
				<span key={`category-${category}`}>
					<Tag size={14} /> {category}
				</span>
			))}
		</div>
	);
}
