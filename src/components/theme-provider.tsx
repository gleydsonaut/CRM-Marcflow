"use client";

import { useEffect } from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "marcflow-theme";

export function applyTheme(preference: ThemePreference) {
    const root = document.documentElement;
    const resolved = preference === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        : preference;
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
}

export function getThemePreference(): ThemePreference {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export function setThemePreference(preference: ThemePreference) {
    window.localStorage.setItem(STORAGE_KEY, preference);
    applyTheme(preference);
}

/** Keeps the system preference live when the user selected the system theme. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const preference = getThemePreference();
        applyTheme(preference);
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => {
            if (getThemePreference() === "system") applyTheme("system");
        };
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, []);

    return <>{children}</>;
}
