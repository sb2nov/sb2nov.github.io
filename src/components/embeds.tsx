"use client";

import { withBasePath } from "@/lib/base-path";
import { useEffect, useId, useRef, useState } from "react";
import hljs from "highlight.js/lib/common";
import "leaflet/dist/leaflet.css";
import "katex/dist/katex.min.css";

type RichLanguage =
	| "chartjs"
	| "echarts"
	| "vega_lite"
	| "plotly"
	| "mermaid"
	| "geojson"
	| "diff2html"
	| "pseudocode"
	| "typograms";

const richLanguages = new Set<string>([
	"chartjs",
	"echarts",
	"vega_lite",
	"plotly",
	"mermaid",
	"geojson",
	"diff2html",
	"pseudocode",
	"typograms",
]);

const highlightLanguageAliases: Record<string, string> = {
	"c++": "cpp",
	html: "xml",
	liquid: "xml",
};

type TypogramsCreate = (source: string, zoom: number, debug: boolean) => SVGElement;

let typogramsLoader: Promise<TypogramsCreate> | undefined;

/** Loads Google's typograms renderer (vendored at /assets/js/typograms.js), which defines a global `create`. */
function loadTypograms(): Promise<TypogramsCreate> {
	typogramsLoader ??= new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = withBasePath("/assets/js/typograms.js");
		script.async = true;
		script.onload = () => {
			const create = (window as unknown as { create?: TypogramsCreate }).create;
			if (create) resolve(create);
			else reject(new Error("typograms failed to initialize"));
		};
		script.onerror = () => reject(new Error("Unable to load typograms."));
		document.head.appendChild(script);
	});
	return typogramsLoader;
}

function tryJson(code: string): unknown | undefined {
	try {
		return JSON.parse(code);
	} catch {
		return undefined;
	}
}

function highlightedCode(language: string, code: string) {
	const normalizedLanguage = highlightLanguageAliases[language] ?? language;
	if (!hljs.getLanguage(normalizedLanguage)) return { __html: code };
	return { __html: hljs.highlight(code, { language: normalizedLanguage }).value };
}

export function RichCodeBlock({ language, code }: { language: string; code: string }) {
	if (!richLanguages.has(language)) {
		return (
			<pre className={`language-${language}`}>
				<code className="hljs" dangerouslySetInnerHTML={highlightedCode(language, code)} />
			</pre>
		);
	}

	return <InteractiveBlock language={language as RichLanguage} code={code} />;
}

function InteractiveBlock({ language, code }: { language: RichLanguage; code: string }) {
	const ref = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const id = useId().replaceAll(":", "-");
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let dispose: (() => void) | undefined;
		let cancelled = false;

		function setDispose(cleanup: () => void) {
			if (cancelled) cleanup();
			else dispose = cleanup;
		}

		async function render() {
			setError(null);

			try {
				if (language === "chartjs") {
					const canvas = canvasRef.current;
					if (!canvas) return;
					const { default: Chart } = await import("chart.js/auto");
					if (cancelled || !canvas.isConnected) return;
					const spec = tryJson(code);
					if (!spec || typeof spec !== "object") throw new Error("Chart.js block must be JSON.");
					const chart = new Chart(canvas, spec as never);
					setDispose(() => chart.destroy());
					return;
				}

				const target = ref.current;
				if (!target) return;

				if (language === "echarts") {
					const echarts = await import("echarts");
					if (cancelled || !target.isConnected) return;
					const spec = tryJson(code);
					if (!spec || typeof spec !== "object") throw new Error("ECharts block must be JSON.");
					const chart = echarts.init(target);
					chart.setOption(spec as echarts.EChartsOption);
					setDispose(() => chart.dispose());
					return;
				}

				if (language === "vega_lite") {
					const { default: embed } = await import("vega-embed");
					if (cancelled || !target.isConnected) return;
					const spec = tryJson(code);
					if (!spec || typeof spec !== "object") throw new Error("Vega-Lite block must be JSON.");
					const result = await embed(target, spec, { actions: false });
					setDispose(() => result.finalize());
					return;
				}

				if (language === "plotly") {
					const Plotly = await import("plotly.js-dist-min");
					if (cancelled || !target.isConnected) return;
					const spec = tryJson(code) as
						| { data?: unknown[]; layout?: Record<string, unknown>; config?: Record<string, unknown> }
						| undefined;
					if (!spec || typeof spec !== "object") throw new Error("Plotly block must be JSON.");
					await Plotly.newPlot(target, spec.data ?? [], spec.layout ?? {}, {
						responsive: true,
						...(spec.config ?? {}),
					});
					setDispose(() => Plotly.purge(target));
					return;
				}

				if (language === "mermaid") {
					const mermaid = (await import("mermaid")).default;
					if (cancelled || !target.isConnected) return;
					mermaid.initialize({
						startOnLoad: false,
						theme: document.documentElement.dataset.theme === "dark" ? "dark" : "default",
					});
					const result = await mermaid.render(`mermaid-${id}`, code);
					if (!cancelled && target.isConnected) target.innerHTML = result.svg;
					return;
				}

				if (language === "geojson") {
					const L = await import("leaflet");
					if (cancelled || !target.isConnected) return;
					const spec = tryJson(code);
					if (!spec || typeof spec !== "object") throw new Error("GeoJSON block must be JSON.");
					const map = L.map(target).setView([0, 0], 2);
					L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
						attribution: "&copy; OpenStreetMap contributors",
					}).addTo(map);
					const layer = L.geoJSON(spec as never).addTo(map);
					const bounds = layer.getBounds();
					if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
					setDispose(() => map.remove());
					return;
				}

				if (language === "diff2html") {
					const diff2html = await import("diff2html");
					if (!cancelled && target.isConnected) {
						target.innerHTML = diff2html.html(code, { drawFileList: false, outputFormat: "side-by-side" });
					}
					return;
				}

				if (language === "pseudocode") {
					const pseudocode = await import("pseudocode");
					if (!cancelled && target.isConnected) pseudocode.render(code, target, { lineNumber: true });
					return;
				}

				if (language === "typograms") {
					const create = await loadTypograms();
					if (!cancelled && target.isConnected) {
						const figure = document.createElement("div");
						figure.className = "typogram";
						// create() drops the first and last lines, so wrap the source in newlines.
						figure.appendChild(create(`\n${code}\n`, 0.3, false));
						target.replaceChildren(figure);
					}
				}
			} catch (renderError) {
				if (!cancelled) setError(renderError instanceof Error ? renderError.message : "Unable to render this block.");
			}
		}

		void render();

		return () => {
			cancelled = true;
			dispose?.();
		};
	}, [code, id, language]);

	return (
		<div className={`rich-block rich-${language}`}>
			{language === "chartjs" ? <canvas ref={canvasRef} /> : <div ref={ref} className="rich-target" />}
			{error ? (
				<details className="render-error">
					<summary>{error}</summary>
					<pre>
						<code>{code}</code>
					</pre>
				</details>
			) : null}
		</div>
	);
}

export function Tweet({ url }: { url: string }) {
	return (
		<div className="tweet-card">
			<a href={url} target="_blank" rel="noreferrer">
				View post on X/Twitter
			</a>
		</div>
	);
}

export function Tikz({ code }: { code: string }) {
	const srcDoc = `<!doctype html><html><head><link rel="stylesheet" href="${withBasePath("/assets/css/tikzjax.min.css")}"><script src="${withBasePath("/assets/js/tikzjax.min.js")}"></script></head><body><script type="text/tikz">${code.replaceAll("</script>", "<\\/script>")}</script></body></html>`;

	return (
		<iframe
			className="tikz-frame"
			title="TikZ diagram"
			srcDoc={srcDoc}
			loading="lazy"
			sandbox="allow-scripts allow-same-origin"
		/>
	);
}

export function Notebook({ src }: { src: string }) {
	const [notebook, setNotebook] = useState<NotebookDocument | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function loadNotebook() {
			try {
				const response = await fetch(withBasePath(src));
				if (!response.ok) throw new Error(`Unable to load notebook (${response.status})`);
				const data = (await response.json()) as NotebookDocument;
				if (!cancelled) setNotebook(data);
			} catch (loadError) {
				if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load notebook.");
			}
		}

		void loadNotebook();

		return () => {
			cancelled = true;
		};
	}, [src]);

	return (
		<div className="notebook-card">
			<div className="notebook-header">
				<strong>Jupyter notebook</strong>
				<a href={withBasePath(src)} target="_blank" rel="noreferrer">
					Open notebook
				</a>
			</div>
			{error ? <p className="render-error">{error}</p> : null}
			{notebook ? <NotebookCells notebook={notebook} /> : <p>Loading notebook...</p>}
		</div>
	);
}

interface NotebookDocument {
	cells?: NotebookCell[];
}

interface NotebookCell {
	cell_type?: string;
	source?: string | string[];
	outputs?: Array<{ name?: string; text?: string | string[]; data?: Record<string, string | string[]> }>;
}

function cellText(value: string | string[] | undefined): string {
	return Array.isArray(value) ? value.join("") : (value ?? "");
}

function NotebookCells({ notebook }: { notebook: NotebookDocument }) {
	return (
		<div className="notebook-cells">
			{notebook.cells?.map((cell, index) => {
				const source = cellText(cell.source);

				if (cell.cell_type === "markdown") {
					return (
						<div className="notebook-markdown" key={index}>
							{source.split(/\n{2,}/).map((paragraph) => (
								<p key={paragraph}>{paragraph}</p>
							))}
						</div>
					);
				}

				return (
					<div className="notebook-code" key={index}>
						<pre>
							<code>{source}</code>
						</pre>
						{cell.outputs?.map((output, outputIndex) => {
							const text = cellText(output.text ?? output.data?.["text/plain"]);
							return text ? (
								<pre className="notebook-output" key={outputIndex}>
									<code>{text}</code>
								</pre>
							) : null;
						})}
					</div>
				);
			})}
		</div>
	);
}

export function Giscus({ enabled }: { enabled?: boolean }) {
	if (!enabled) return null;

	return (
		<aside className="comments-placeholder">
			<strong>Comments</strong>
			<p>Giscus can be enabled by filling in the repository identifiers in `content/site.yml`.</p>
		</aside>
	);
}
