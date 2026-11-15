import type {ReactNode} from "react";
import type {TableState} from "../lib/sim/types";
import {stateNames} from "../data/profile";

/** A link that leaves the site. Says so to screen readers, since it opens a new tab. */
export function ExternalLink({
  href,
  className = "link",
  children
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={className} target="_blank" rel="noreferrer">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function SectionHeading({
  title,
  intro,
  id
}: {
  title: string;
  intro?: string;
  id?: string;
}) {
  return (
    <header className="mb-12 lg:mb-16">
      <h2 id={id} className="t-h2">
        {title}
      </h2>
      {intro && <p className="t-lead measure mt-5 text-ink-soft">{intro}</p>}
    </header>
  );
}

/** A table state shown the way the plan draws it: by fill, outline and pattern, not colour alone. */
export function StateChip({state}: {state: TableState | "unknown" | "any"}) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold whitespace-nowrap">
      {state !== "any" && (
        <span className="swatch" data-state={state} aria-hidden="true" />
      )}
      {stateNames[state]}
    </span>
  );
}
