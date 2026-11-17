import type { ComponentProps } from "react";
import { evaluate, type EvaluateOptions } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { rehypeBasePath } from "@/lib/base-path";
import { DataTable } from "./data-table";
import { AudioEmbed, Figure, VideoEmbed } from "./media";
import { Citation, CitationQuote, Reference } from "./citations";
import { Giscus, Notebook, RichCodeBlock, Tikz, Tweet } from "./embeds";
import { Tab, Tabs } from "./tabs";

function extractCode(children: unknown): { code: string; language: string } | undefined {
	if (!children || typeof children !== "object" || !("props" in children)) return undefined;
	const props = (children as { props?: { className?: string; children?: unknown } }).props;
	if (!props) return undefined;
	const className = props.className ?? "";
	const language = className.replace(/^language-/, "") || "text";
	const code = Array.isArray(props.children) ? props.children.join("") : String(props.children ?? "");
	return { code: code.replace(/\n$/, ""), language };
}

function Pre(props: ComponentProps<"pre">) {
	const extracted = extractCode(props.children);
	if (!extracted) return <pre {...props} />;
	return <RichCodeBlock language={extracted.language} code={extracted.code} />;
}

function Callout({ title, children }: { title?: string; children: React.ReactNode }) {
	return (
		<aside className="callout">
			{title ? <strong>{title}</strong> : null}
			{children}
		</aside>
	);
}

function Footnote({ children }: { children: React.ReactNode }) {
	return <span className="footnote">{children}</span>;
}

const components = {
	pre: Pre,
	Figure,
	AudioEmbed,
	VideoEmbed,
	Citation,
	Reference,
	CitationQuote,
	Tweet,
	Tikz,
	Notebook,
	Giscus,
	Tabs,
	Tab,
	Callout,
	Footnote,
	DataTable,
};

type HastNode = { type: string; tagName?: string; children?: HastNode[] };

function containsLink(node: HastNode): boolean {
	return node.tagName === "a" || (node.children ?? []).some(containsLink);
}

// Headings whose text is already a link (e.g. `## [Lightbox2](https://...)`) are left
// unwrapped; wrapping them would nest <a> inside <a> and break hydration.
export const mdxCompileOptions = {
	remarkPlugins: [remarkGfm, remarkMath, remarkEmoji],
	rehypePlugins: [
		rehypeSlug,
		[rehypeAutolinkHeadings, { behavior: "wrap", test: (node: HastNode) => !containsLink(node) }],
		rehypeKatex,
		rehypeBasePath,
	],
} satisfies Pick<EvaluateOptions, "remarkPlugins" | "rehypePlugins">;

const mdxEsmDeclarationPattern = /^\s*(?:import(?=\s|["'{*])|export(?=\s|[{\*]))/m;

export async function MdxContent({
	className,
	components: componentOverrides,
	source,
}: {
	className?: string;
	components?: Record<string, React.ComponentType<Record<string, unknown>>>;
	source: string;
}) {
	const sourceWithoutFencedCode = source.replace(/````[\s\S]*?````/g, "").replace(/```[\s\S]*?```/g, "");

	if (mdxEsmDeclarationPattern.test(sourceWithoutFencedCode)) {
		throw new Error("MDX import/export statements are disabled for portfolio content.");
	}

	// MDX is intentionally evaluated only for trusted repository-authored content loaded from `content/`.
	const { default: Content } = await evaluate(source, {
		...runtime,
		...mdxCompileOptions,
	});

	return (
		<div className={["mdx-content", className].filter(Boolean).join(" ")}>
			<Content components={{ ...components, ...componentOverrides }} />
		</div>
	);
}
