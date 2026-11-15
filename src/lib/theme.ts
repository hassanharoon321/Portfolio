import {useCallback, useEffect, useState} from "react";

/** "light" is the drawing (ink on paper), "dark" is its blueprint. */
export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function savedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

function apply(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  // Keep the browser chrome (mobile address bar) the same colour as the page.
  const paper = getComputedStyle(document.documentElement)
    .getPropertyValue("--paper")
    .trim();
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    meta.setAttribute("content", paper);
  }
}

export function useTheme(): {theme: Theme; setTheme: (theme: Theme) => void} {
  // index.html sets the theme before first paint; start from whatever it chose.
  const [theme, setThemeState] = useState<Theme>(currentTheme);

  const setTheme = useCallback((next: Theme) => {
    apply(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing can block storage. The choice still holds for this visit.
    }
    setThemeState(next);
  }, []);

  useEffect(() => {
    apply(currentTheme());

    // Follow the system setting until the visitor picks a theme themselves.
    const query = matchMedia("(prefers-color-scheme: dark)");
    const follow = (event: MediaQueryListEvent) => {
      if (savedTheme()) return;
      const next: Theme = event.matches ? "dark" : "light";
      apply(next);
      setThemeState(next);
    };
    query.addEventListener("change", follow);
    return () => query.removeEventListener("change", follow);
  }, []);

  return {theme, setTheme};
}
