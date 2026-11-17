import { MdxContent } from "@/components/mdx-content";
import { getPage, getSiteConfig } from "@/lib/content";

export default function HomePage() {
	const config = getSiteConfig();
	const about = getPage("about");
	const heading = typeof about?.meta.heading === "string" ? about.meta.heading : undefined;

	return (
		<div className="shell page">
			<section className="home">
				{heading ? <h1>{heading}</h1> : null}
				{about ? <MdxContent source={about.body} /> : <p>{config.description}</p>}
			</section>
		</div>
	);
}
