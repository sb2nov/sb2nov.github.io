import type { DetailedHTMLProps, HTMLAttributes } from "react";

type DistillElementProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
	class?: string;
	src?: string;
};

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"d-appendix": DistillElementProps;
			"d-article": DistillElementProps;
			"d-bibliography": DistillElementProps;
			"d-byline": DistillElementProps;
			"d-citation-list": DistillElementProps;
			"d-contents": DistillElementProps;
			"d-footnote-list": DistillElementProps;
			"d-title": DistillElementProps;
		}
	}
}
