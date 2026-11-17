import type { Metadata } from "next";
import { SafeHtml } from "@/components/safe-html";
import { getWork, pageAlternates, workSpan } from "@/lib/content";
import { inlineMarkdown } from "@/lib/publications";

export const metadata: Metadata = {
	title: "Work",
	description: "Past and current work by Sourabh Bajaj.",
	alternates: pageAlternates("/work"),
};

export default function WorkPage() {
	const work = getWork();

	return (
		<div className="shell page">
			<header className="page-header">
				<h1>Work</h1>
			</header>
			<div className="entry-sections">
				{work.map((job) => (
					<section className="entry" key={job.company}>
						<div className="entry-meta work-list-meta">
							<p>{workSpan(job)}</p>
						</div>
						<div className="entry-body work-list">
							<h2>{job.url ? <a href={job.url}>{job.company}</a> : job.company}</h2>
							{job.roles.map((role) => (
								<div className="entry-role" key={role.title}>
									<p className="entry-subtitle">
										<span className="entry-role-title">{role.title}</span>
										{job.roles.length > 1 ? <span className="entry-role-years">{role.years}</span> : null}
									</p>
									<ul>
										{role.highlights.map((highlight) => (
											<li key={highlight}>
												<SafeHtml html={inlineMarkdown(highlight)} />
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</section>
				))}
			</div>
		</div>
	);
}
