import type {ReactNode} from "react";
import {
  type CaseStudy,
  footfallCounter,
  restaurantSystem,
  tableTransitions
} from "../data/profile";
import {SectionHeading, StateChip} from "./ui";

export function AiSystems() {
  return (
    <section id="ai" className="wrap section" aria-labelledby="ai-title">
      <SectionHeading
        id="ai-title"
        title="AI systems"
        intro="Two computer-vision products from 2026. Both read ordinary CCTV streams and turn them into numbers a manager can act on."
      />

      <div className="space-y-24 lg:space-y-32">
        <Study study={restaurantSystem}>
          <StateTable />
        </Study>
        <Study study={footfallCounter}>
          <CrossingDiagram />
        </Study>
      </div>
    </section>
  );
}

function Study({study, children}: {study: CaseStudy; children: ReactNode}) {
  return (
    <article id={study.id} className="scroll-mt-24 border-t border-ink pt-8">
      <h3 className="t-h3">{study.name}</h3>
      <p className="t-lead mt-3 max-w-[46ch]">{study.tagline}</p>

      <div className="mt-10 grid gap-x-12 gap-y-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="measure space-y-5">
            {study.summary.map(paragraph => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <dl className="mt-9 border-t border-line">
            <Fact label="My part" value={study.role} />
            <Fact label="Status" value={study.status} />
            {study.facts.map(fact => (
              <Fact key={fact.label} label={fact.label} value={fact.value} />
            ))}
            <Fact label="Built with" value={study.stack} />
          </dl>
        </div>

        <div className="lg:col-span-7">
          <h4 className="t-h4">The decisions that make it work</h4>
          <ul className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {study.decisions.map(decision => (
              <li key={decision.title}>
                <h5 className="t-sub">{decision.title}</h5>
                <p className="mt-2 text-[1.0625rem] leading-normal text-ink-soft">
                  {decision.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-14">
        <h4 className="t-h4">From camera to dashboard</h4>
        <ol className="mt-6 grid sm:grid-cols-5">
          {study.pipeline.map((step, index) => (
            <li
              key={step.name}
              className="border-l-2 border-ink py-2 pl-4 sm:border-t-2 sm:border-l-0 sm:py-0 sm:pt-4 sm:pr-5 sm:pl-0"
            >
              <span className="t-meta tabular-nums">Step {index + 1}</span>
              <strong className="block">{step.name}</strong>
              <span className="mt-1 block text-[1.0625rem] leading-snug text-ink-soft">
                {step.detail}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-14">{children}</div>
    </article>
  );
}

function Fact({label, value}: {label: string; value: string}) {
  return (
    <div className="grid gap-x-6 border-b border-line py-3 sm:grid-cols-[7.5rem_1fr]">
      <dt className="t-meta pt-0.5">{label}</dt>
      <dd className="text-[1.0625rem] leading-normal">{value}</dd>
    </div>
  );
}

/** The table state machine, written out as the rules the engine follows. */
function StateTable() {
  return (
    <div>
      <h4 className="t-h4">How a table changes state</h4>
      <p className="measure mt-3 text-ink-soft">
        These are the same states the plan at the top of this page is running,
        with the timings a real restaurant uses.
      </p>
      <ul className="mt-6 border-t border-line">
        {tableTransitions.map(rule => (
          <li
            key={`${rule.from}-${rule.to}`}
            className="grid gap-x-8 gap-y-1 border-b border-line py-3 md:grid-cols-[11rem_11rem_1fr] md:items-center"
          >
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 md:contents">
              <StateChip state={rule.from} />
              <span className="t-meta md:hidden">becomes</span>
              <StateChip state={rule.to} />
            </span>
            <span className="text-ink-soft">{rule.when}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Three tracks at a doorway: one counted, one ignored, one pair counted as a group. */
function CrossingDiagram() {
  return (
    <figure className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-center">
      <div className="lg:col-span-5">
        <h4 className="t-h4">How a crossing is counted</h4>
        <figcaption>
          <ol className="mt-5 space-y-4">
            <Key number={1} title="Counted in">
              The track clears the dead zone and stays on the far side.
            </Key>
            <Key number={2} title="Not counted">
              The track wobbles inside the dead zone and turns back.
            </Key>
            <Key number={3} title="Counted once, as a group">
              Two people stay close and move at the same speed.
            </Key>
          </ol>
        </figcaption>
      </div>

      <svg
        className="plan border border-line bg-sheet lg:col-span-7"
        viewBox="0 0 400 250"
        role="img"
        aria-label="Diagram of three walking paths at a doorway counting line."
      >
        <text className="plan-label" x="16" y="26">
          Outside
        </text>
        <text className="plan-label" x="384" y="26" textAnchor="end">
          Inside
        </text>

        <rect className="count-band" x="182" y="38" width="36" height="196" />
        <line className="count-line" x1="200" y1="38" x2="200" y2="234" />
        <text className="plan-label" x="200" y="26" textAnchor="middle">
          Dead zone
        </text>

        {/* 1: a clean crossing */}
        <path
          className="track"
          d="M 28 72 C 110 62, 150 86, 200 78 S 300 62, 356 76"
        />
        <Marker x={356} y={76} number={1} />

        {/* 2: hesitation inside the dead zone */}
        <path
          className="track"
          d="M 28 142 C 90 138, 150 132, 192 138 C 214 141, 214 152, 196 154 C 150 158, 90 160, 40 164"
        />
        <Marker x={40} y={164} number={2} hollow />

        {/* 3: two people moving together */}
        <path className="track" d="M 28 198 C 120 192, 180 204, 356 194" />
        <path className="track" d="M 28 216 C 120 210, 180 222, 356 212" />
        <path className="track-link" d="M 340 195 V 211" />
        <Marker x={368} y={203} number={3} />
      </svg>
    </figure>
  );
}

function Key({
  number,
  title,
  children
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="grid grid-cols-[2rem_1fr] gap-x-3">
      <span className="t-figure text-accent" aria-hidden="true">
        {number}
      </span>
      <span>
        <strong className="block">{title}</strong>
        <span className="text-ink-soft">{children}</span>
      </span>
    </li>
  );
}

function Marker({
  x,
  y,
  number,
  hollow = false
}: {
  x: number;
  y: number;
  number: number;
  hollow?: boolean;
}) {
  return (
    <g aria-hidden="true">
      <circle
        className={hollow ? "marker marker-hollow" : "marker"}
        cx={x}
        cy={y}
        r="10"
      />
      <text
        className={hollow ? "marker-text marker-text-hollow" : "marker-text"}
        x={x}
        y={y + 4.5}
        textAnchor="middle"
      >
        {number}
      </text>
    </g>
  );
}
