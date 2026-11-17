"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const themeListeners = new Set<() => void>();

export function initialTheme(): Theme {
	return "light";
}

export function resolvePreferredTheme(): Theme {
	if (typeof window === "undefined") return "light";
	const saved = window.localStorage.getItem("theme");
	if (saved === "light" || saved === "dark") return saved;
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeToTheme(listener: () => void) {
	themeListeners.add(listener);
	window.addEventListener("storage", listener);
	return () => {
		themeListeners.delete(listener);
		window.removeEventListener("storage", listener);
	};
}

function notifyThemeListeners() {
	themeListeners.forEach((listener) => listener());
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const theme = useSyncExternalStore(subscribeToTheme, resolvePreferredTheme, initialTheme);

	function applyTheme(nextTheme: Theme) {
		document.documentElement.dataset.theme = nextTheme;
		window.localStorage.setItem("theme", nextTheme);
		notifyThemeListeners();
	}

	useEffect(() => {
		document.documentElement.dataset.theme = theme;
	}, [theme]);

	return (
		<>
			{children}
			<button
				className="theme-toggle"
				type="button"
				aria-label="Toggle dark mode"
				onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
			>
				{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
			</button>
		</>
	);
}
