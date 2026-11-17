import type { Metadata } from "next";
import { Fragment } from "react";
import type { TalkLink, TalkVenue } from "@/lib/content";
import { getTalks, pageAlternates } from "@/lib/content";

export const metadata: Metadata = {
	title: "Talks",
	description: "Talks, panels, podcasts, and interviews by Sourabh Bajaj.",
	alternates: pageAlternates("/talks"),
};

function Links({ links }: { links?: TalkLink[] }) {
	if (!links?.length) return null;
	return (
		<span className="talk-links">
			{" "}
			(
			{links.map((link, index) => (
				<Fragment key={link.url + link.label}>
					{index > 0 ? " | " : null}
					<a href={link.url}>{link.label}</a>
				</Fragment>
			))}
			)
		</span>
	);
}

function Venue({ venue }: { venue: TalkVenue }) {
	return venue.url ? <a href={venue.url}>{venue.venue}</a> : <>{venue.venue}</>;
}

export default function TalksPage() {
	const years = getTalks();

	return (
		<div className="shell page">
			<header className="page-header">
				<h1>Talks</h1>
			</header>
			<div className="entry-sections">
				{years.map((group) => (
					<section className="entry" key={group.year} id={String(group.year)}>
						<div className="entry-meta">
							<h2>{group.year}</h2>
						</div>
						<div className="entry-body talk-list">
							{group.talks.map((talk) => (
								<article key={talk.title}>
									<h3>{talk.title}</h3>
									<p className="entry-subtitle">
										<Venue venue={talk} />
										<Links links={talk.links} />
									</p>
									{talk.description ? <p>{talk.description}</p> : null}
									{talk.also?.length ? (
										<>
											<p>{talk.also_intro ?? "Also presented at"}:</p>
											<ul>
												{talk.also.map((venue) => (
													<li key={venue.venue}>
														<Venue venue={venue} />
														<Links links={venue.links} />
													</li>
												))}
											</ul>
										</>
									) : null}
								</article>
							))}
						</div>
					</section>
				))}
			</div>
		</div>
	);
}
