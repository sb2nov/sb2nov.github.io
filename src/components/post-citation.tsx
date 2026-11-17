import type { ContentEntry, PostMeta } from "@/lib/content";
import { absoluteUrl, getPostRoute } from "@/lib/content";

export function PostCitation({ post }: { post: ContentEntry<PostMeta> }) {
	const year = post.meta.year;
	const citationKey = `${post.meta.slug}-${year}`;
	const url = absoluteUrl(getPostRoute(post));
	const published = post.meta.date ? new Date(post.meta.date).toISOString().slice(0, 10) : year;

	return (
		<section className="post-citation">
			<h2>Cite this post</h2>
			<p>
				{post.meta.title}. Published {published}. Available at <a href={url}>{url}</a>.
			</p>
			<pre>
				<code>{`@online{${citationKey},
  title = {${post.meta.title}},
  year = {${year}},
  url = {${url}}
}`}</code>
			</pre>
		</section>
	);
}
