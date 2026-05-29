export type Theme = "light" | "dark";

const THEME_KEY = "theme"; // localStorage key
const THEME_EVENT = "theme:change"; // event name

let initialized = false;

function applyTheme(theme: Theme) {
    document.documentElement.setAttribute("data-theme", theme);
}

function getSystemTheme(): Theme {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
    }
    return "light";
}

function setTheme(theme: Theme) {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

export function getTheme(): Theme {
    const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    if (storedTheme) {
        return storedTheme;
    }
    return getSystemTheme();
}

export function toggleTheme() {
    const currentTheme = getTheme();
    const newTheme: Theme = currentTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
}

export function initTheme() {
    // With the way we recreate the html element on each page swap, we need to re-apply the theme after each swap.
    applyTheme(getTheme());
    if (initialized) return;
    initialized = true;

    document.addEventListener("astro:after-swap", () => {
        applyTheme(getTheme());
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function onSystemThemeChange(e: MediaQueryListEvent) {
        if (!localStorage.getItem(THEME_KEY)) {
            setTheme(e.matches ? "dark" : "light");
        }
    }

    mediaQuery.addEventListener("change", onSystemThemeChange);
}
