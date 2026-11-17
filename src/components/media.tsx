import { withBasePath } from "@/lib/base-path";
import { ZoomableFigure } from "./zoomable-figure";

export function Figure({
	src,
	title,
	alt,
	loading,
	zoomable,
	slot,
}: {
	src?: string;
	title?: string;
	alt?: string;
	loading?: "eager" | "lazy";
	zoomable?: boolean;
	slot?: string;
}) {
	if (!src) return null;
	if (zoomable) return <ZoomableFigure alt={alt} loading={loading} slot={slot} src={withBasePath(src)} title={title} />;

	return (
		<figure className="figure" slot={slot}>
			<img src={withBasePath(src)} alt={alt ?? title ?? ""} loading={loading ?? "lazy"} />
			{title ? <figcaption>{title}</figcaption> : null}
		</figure>
	);
}

export function AudioEmbed({ src, title, controls = true }: { src?: string; title?: string; controls?: boolean }) {
	if (!src) return null;

	return (
		<figure className="media-embed">
			<audio src={withBasePath(src)} controls={controls} />
			{title ? <figcaption>{title}</figcaption> : null}
		</figure>
	);
}

export function VideoEmbed({
	src,
	title,
	controls = true,
	autoplay = false,
}: {
	src?: string;
	title?: string;
	controls?: boolean;
	autoplay?: boolean;
}) {
	if (!src) return null;

	if (/youtube\.com|youtu\.be|vimeo\.com/.test(src)) {
		return (
			<figure className="media-embed">
				<iframe src={withBasePath(src)} title={title ?? "Embedded video"} allowFullScreen loading="lazy" />
				{title ? <figcaption>{title}</figcaption> : null}
			</figure>
		);
	}

	return (
		<figure className="media-embed">
			<video src={withBasePath(src)} controls={controls} autoPlay={autoplay} muted={autoplay} playsInline />
			{title ? <figcaption>{title}</figcaption> : null}
		</figure>
	);
}
