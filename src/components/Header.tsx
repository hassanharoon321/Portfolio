import {useEffect, useState} from "react";
import {nav, profile} from "../data/profile";
import {useActiveSection} from "../lib/hooks";
import {type Theme, useTheme} from "../lib/theme";

const sectionIds = nav.map(item => item.href.slice(1));

export function Header() {
  const {theme, setTheme} = useTheme();
  const active = useActiveSection(sectionIds);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper">
      <a href="#main" className="btn btn-primary btn-small skip-link">
        Skip to content
      </a>

      <div className="wrap flex h-16 items-center justify-between gap-6">
        <a href="#top" className="text-[1.0625rem] font-bold">
          {profile.name}
        </a>

        <nav
          aria-label="Sections"
          className="hidden items-center gap-7 lg:flex"
        >
          {nav.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="nav-link"
              aria-current={active === item.href.slice(1) ? "true" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeSwitch
            theme={theme}
            setTheme={setTheme}
            className="max-sm:hidden"
          />
          <button
            type="button"
            className="btn btn-quiet btn-small lg:hidden"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen(value => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="site-menu"
          className="wrap border-t border-line pt-3 pb-6 lg:hidden"
        >
          <nav aria-label="Sections" className="flex flex-col">
            {nav.map(item => (
              <a
                key={item.href}
                href={item.href}
                className="t-h4 border-b border-line-soft py-3"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <ThemeSwitch
            theme={theme}
            setTheme={setTheme}
            className="mt-5 sm:hidden"
          />
        </div>
      )}
    </header>
  );
}

/** The same page as an ink drawing or as its blueprint. */
function ThemeSwitch({
  theme,
  setTheme,
  className = ""
}: {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  className?: string;
}) {
  return (
    <div className={`seg ${className}`} role="group" aria-label="Colour theme">
      <button
        type="button"
        aria-pressed={theme === "light"}
        onClick={() => setTheme("light")}
      >
        Drawing
      </button>
      <button
        type="button"
        aria-pressed={theme === "dark"}
        onClick={() => setTheme("dark")}
      >
        Blueprint
      </button>
    </div>
  );
}
