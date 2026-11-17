import sanitizeHtml from "sanitize-html";

const allowedTags = ["a", "br", "code", "em", "p", "span", "strong", "sub", "sup"];

export function sanitizeTrustedHtml(html: string): string {
	return sanitizeHtml(html, {
		allowedTags,
		allowedAttributes: {
			a: ["href", "rel", "target"],
			span: ["class"],
			p: ["class"],
		},
		allowedSchemes: ["http", "https", "mailto"],
		transformTags: {
			a: (_tagName, attribs) => {
				const nextAttributes: Record<string, string> = {
					href: attribs.href ?? "",
					rel: "noopener noreferrer",
				};
				if (attribs.target === "_blank") nextAttributes.target = "_blank";

				return {
					tagName: "a",
					attribs: nextAttributes,
				};
			},
		},
	});
}

export function SafeHtml({
	html,
	as: Element = "span",
	className,
}: {
	html: string;
	as?: "div" | "p" | "span";
	className?: string;
}) {
	return <Element className={className} dangerouslySetInnerHTML={{ __html: sanitizeTrustedHtml(html) }} />;
}
