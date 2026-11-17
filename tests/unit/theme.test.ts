import { afterEach, describe, expect, it, vi } from "vitest";
import { initialTheme, resolvePreferredTheme } from "../../src/components/theme";

describe("theme hydration", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("uses a stable light theme for the initial render", () => {
		vi.stubGlobal("window", {
			localStorage: {
				getItem: () => "dark",
			},
			matchMedia: () => ({ matches: true }),
		});

		expect(initialTheme()).toBe("light");
		expect(resolvePreferredTheme()).toBe("dark");
	});
});
