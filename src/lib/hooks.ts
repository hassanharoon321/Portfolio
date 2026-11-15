import {type RefObject, useEffect, useState, useSyncExternalStore} from "react";

/** Tracks a CSS media query, such as a breakpoint or a reduced-motion preference. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    onChange => {
      const list = matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => matchMedia(query).matches
  );
}

/** True while any part of the element is on screen. */
export function useInView(ref: RefObject<Element | null>): boolean {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting)
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return inView;
}

/** The id of the section currently crossing the middle of the viewport, for the nav. */
export function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    const sections = key
      .split(",")
      .map(id => document.getElementById(id))
      .filter(section => section !== null);

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
          else
            setActive(current =>
              current === entry.target.id ? null : current
            );
        }
      },
      // A thin band across the middle of the screen: whichever section touches it is current.
      {rootMargin: "-45% 0px -54% 0px"}
    );
    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, [key]);

  return active;
}
