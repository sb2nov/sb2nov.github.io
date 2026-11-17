"use client";

import { withBasePath } from "@/lib/base-path";
import { useEffect, useRef, useState } from "react";

export interface ZoomableFigureProps {
	src: string;
	title?: string;
	alt?: string;
	loading?: "eager" | "lazy";
	slot?: string;
}

export function ZoomableFigure({ src, title, alt, loading, slot }: ZoomableFigureProps) {
	const [open, setOpen] = useState(false);
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!open) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		closeButtonRef.current?.focus();

		function closeOnEscape(event: KeyboardEvent) {
			if (event.key === "Escape") setOpen(false);
		}

		document.addEventListener("keydown", closeOnEscape);

		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener("keydown", closeOnEscape);
		};
	}, [open]);

	return (
		<>
			<figure className="figure zoomable" slot={slot}>
				<button
					aria-label={`Open image preview${title || alt ? `: ${title ?? alt}` : ""}`}
					className="zoomable-trigger"
					onClick={() => setOpen(true)}
					type="button"
				>
					<img alt={alt ?? title ?? ""} data-zoomable="" loading={loading ?? "lazy"} src={withBasePath(src)} />
				</button>
				{title ? <figcaption>{title}</figcaption> : null}
			</figure>

			{open ? (
				<div
					aria-label="Image preview"
					aria-modal="true"
					className="image-lightbox"
					onClick={() => setOpen(false)}
					role="dialog"
				>
					<button
						aria-label="Close image preview"
						className="image-lightbox-close"
						onClick={() => setOpen(false)}
						ref={closeButtonRef}
						type="button"
					>
						Close
					</button>
					<img
						alt={alt ?? title ?? ""}
						className="image-lightbox-image"
						onClick={(event) => event.stopPropagation()}
						src={withBasePath(src)}
					/>
					{title ? <p className="image-lightbox-caption">{title}</p> : null}
				</div>
			) : null}
		</>
	);
}
