declare module "plotly.js-dist-min" {
	interface PlotlyConfig {
		responsive?: boolean;
		[key: string]: unknown;
	}

	export function newPlot(
		root: HTMLElement | null,
		data: unknown[],
		layout?: Record<string, unknown>,
		config?: PlotlyConfig
	): Promise<void>;
	export function purge(root: HTMLElement | null): void;
}

declare module "pseudocode" {
	export function render(code: string, element: HTMLElement, options?: Record<string, unknown>): void;
}
