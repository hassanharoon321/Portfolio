import {
  type KeyboardEvent,
  type RefObject,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {stateNames} from "../data/profile";
import {useInView, useMediaQuery} from "../lib/hooks";
import {Sim, TIMING} from "../lib/sim/engine";
import {compactScene, wideScene} from "../lib/sim/scene";
import type {
  Agent,
  SceneDef,
  Snapshot,
  TableDef,
  TableView
} from "../lib/sim/types";

const SVG_NS = "http://www.w3.org/2000/svg";
/** How long the simulation runs before it is first shown, so the room opens mid-service. */
const WARM_UP_SECONDS = 31;

const legend = [
  "available",
  "occupied",
  "away",
  "cleaning",
  "reserved",
  "unknown"
] as const;

/** The hero: a restaurant floor plan with my occupancy and footfall engines running on it. */
export function LivePlan() {
  const compact = useMediaQuery("(max-width: 639px)");
  const scene = compact ? compactScene : wideScene;
  // A different scene is a different simulation, so remount rather than patch it.
  return <PlanRunner key={scene.variant} scene={scene} />;
}

function PlanRunner({scene}: {scene: SceneDef}) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const sim = useMemo(() => {
    const next = new Sim(scene);
    next.warmUp(WARM_UP_SECONDS);
    return next;
  }, [scene]);

  const [snap, setSnap] = useState<Snapshot>(() => sim.snapshot());
  const [running, setRunning] = useState(!reducedMotion);
  const [message, setMessage] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);

  const figureRef = useRef<HTMLElement>(null);
  const agentLayerRef = useRef<SVGGElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const tableRefs = useRef<(SVGGElement | null)[]>([]);
  const nodes = useRef(new Map<number, {group: SVGGElement; still: boolean}>());
  const painted = useRef({version: -1, minute: -1, crossings: sim.crossings});
  const inView = useInView(figureRef);

  /** Draws the current state of the simulation. Guests are moved directly, without React. */
  const paint = useCallback(() => {
    const layer = agentLayerRef.current;
    if (!layer) return;

    const alive = new Set<number>();
    for (const agent of sim.agents) {
      alive.add(agent.id);
      let node = nodes.current.get(agent.id);
      if (!node) {
        node = {group: createAgentNode(agent), still: false};
        layer.appendChild(node.group);
        nodes.current.set(agent.id, node);
      }
      node.group.setAttribute(
        "transform",
        `translate(${agent.x.toFixed(1)} ${agent.y.toFixed(1)})`
      );
      const still = agent.still >= TIMING.stationary;
      if (still !== node.still) {
        node.still = still;
        node.group.dataset.still = still ? "1" : "0";
      }
    }
    for (const [id, node] of nodes.current) {
      if (alive.has(id)) continue;
      node.group.remove();
      nodes.current.delete(id);
    }

    const last = painted.current;
    if (sim.crossings !== last.crossings) {
      last.crossings = sim.crossings;
      const line = lineRef.current;
      if (line) {
        // Restart the pulse even if the previous one has not finished.
        line.classList.remove("is-pulsing");
        line.getBoundingClientRect();
        line.classList.add("is-pulsing");
      }
    }

    // Everything else changes a few times a second at most, so React can render it.
    const minute = Math.floor(sim.time);
    if (sim.version !== last.version || minute !== last.minute) {
      last.version = sim.version;
      last.minute = minute;
      setSnap(sim.snapshot());
    }
  }, [sim]);

  useLayoutEffect(() => {
    const drawn = nodes.current;
    paint();
    return () => {
      for (const node of drawn.values()) node.group.remove();
      drawn.clear();
    };
  }, [paint]);

  useEffect(() => {
    if (!running || !inView) return;

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Clamp the step so a background tab does not fast-forward the room when it returns.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      sim.step(dt);
      paint();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, inView, sim, paint]);

  const tapTable = (id: string) => {
    setMessage(sim.tap(id));
    paint();
  };

  const toggleSignal = () => {
    sim.setSignal(!sim.signal);
    setMessage(
      sim.signal
        ? "Floor camera restored. Every table is being re-checked."
        : "Floor camera cut. Tables show no signal until it is back."
    );
    paint();
  };

  const onTableKey = (event: KeyboardEvent, index: number, id: string) => {
    const last = scene.tables.length - 1;
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = index === 0 ? last : index - 1;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      tapTable(id);
      return;
    } else return;

    event.preventDefault();
    setFocusIndex(next);
    tableRefs.current[next]?.focus();
  };

  const inUse = snap.tables.filter(
    t => t.state === "occupied" || t.state === "away"
  ).length;

  return (
    <figure ref={figureRef} className="border border-line bg-sheet">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-line-soft px-4 py-3 sm:px-5">
        <p className="t-meta">
          <span className="block font-semibold text-ink">
            Dinner service, simulated
          </span>
          <span className="tabular-nums">{snap.clock}</span>, running at 60×
          speed
        </p>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 sm:gap-x-8">
          <Readout label="In" value={snap.entries} />
          <Readout label="Out" value={snap.exits} />
          <Readout label="Inside" value={snap.inside} />
          <Readout
            label="Tables used"
            value={`${inUse}/${snap.tables.length}`}
          />
        </dl>
      </div>

      <svg
        className="plan"
        data-variant={scene.variant}
        viewBox={`0 0 ${scene.width} ${scene.height}`}
        role="group"
        aria-label="Floor plan of a simulated restaurant. Use the arrow keys to move between tables."
      >
        <defs>
          <pattern
            id="plan-hatch-ink"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line className="plan-hatch-ink" x1="0" y1="0" x2="0" y2="6" />
          </pattern>
          <pattern
            id="plan-hatch-soft"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line className="plan-hatch-soft" x1="0" y1="0" x2="0" y2="6" />
          </pattern>
        </defs>

        <PlanDrawing scene={scene} lineRef={lineRef} />

        {scene.tables.map((table, index) => {
          const view = snap.tables[index];
          return (
            <PlanTable
              key={table.id}
              table={table}
              view={view}
              signal={snap.signal}
              tabIndex={index === focusIndex ? 0 : -1}
              groupRef={element => {
                tableRefs.current[index] = element;
              }}
              onTap={() => tapTable(table.id)}
              onFocus={() => setFocusIndex(index)}
              onKeyDown={event => onTableKey(event, index, table.id)}
            />
          );
        })}

        <g ref={agentLayerRef} aria-hidden="true" />
      </svg>

      {/* Two lists, so the people key wraps as a pair and never leaves one item alone. */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 border-t border-line-soft px-4 py-3 text-[0.8438rem] sm:px-5">
        <ul
          className="flex flex-wrap gap-x-3 gap-y-1.5"
          aria-label="Table states"
        >
          {legend.map(state => (
            <li key={state} className="flex items-center gap-2">
              <span className="swatch" data-state={state} aria-hidden="true" />
              {stateNames[state]}
            </li>
          ))}
        </ul>
        <ul className="flex gap-x-3" aria-label="People">
          <li className="flex items-center gap-2">
            <span className="swatch" data-kind="guest" aria-hidden="true" />
            Guest
          </li>
          <li className="flex items-center gap-2">
            <span className="swatch" data-kind="staff" aria-hidden="true" />
            Staff
          </li>
        </ul>
      </div>

      <div className="grid gap-x-8 gap-y-4 border-t border-line-soft px-4 py-4 sm:grid-cols-[1fr_auto] sm:px-5">
        <ol
          className="t-meta min-h-[7.25rem] space-y-0.5"
          aria-label="Latest events"
        >
          {snap.log.map((entry, index) => (
            <li
              key={entry.id}
              className={index === 0 ? "font-semibold text-ink" : undefined}
            >
              <span className="mr-3 tabular-nums">{entry.clock}</span>
              {entry.text}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap content-start gap-2 sm:flex-col sm:items-stretch">
          <button
            type="button"
            className="btn btn-quiet btn-small"
            onClick={() => setRunning(value => !value)}
          >
            {running ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            className="btn btn-quiet btn-small"
            onClick={toggleSignal}
          >
            {snap.signal ? "Cut the floor camera" : "Restore the floor camera"}
          </button>
        </div>
      </div>

      <figcaption className="t-meta border-t border-line-soft px-4 py-3 sm:px-5">
        <span className="measure block">
          A simulation of the restaurant engine described below. The guests are
          synthetic, but the door count and every table state are worked out in
          your browser as you watch. Tap a free table to reserve it, or one that
          needs cleaning to mark it clean.
          {reducedMotion &&
            !running &&
            " It is paused because your device asks for less motion."}
        </span>
        <span
          className="mt-1 block min-h-[1.45em] font-semibold text-ink"
          role="status"
        >
          {message}
        </span>
      </figcaption>
    </figure>
  );
}

function Readout({label, value}: {label: string; value: number | string}) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="t-meta">{label}</dt>
      <dd className="t-figure">{value}</dd>
    </div>
  );
}

/** One guest or busser: a dot, plus the box and track ID a tracker would draw around it. */
function createAgentNode(agent: Agent): SVGGElement {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("class", "agent");
  group.dataset.role = agent.role;
  group.dataset.still = "0";

  const halo = document.createElementNS(SVG_NS, "circle");
  halo.setAttribute("class", "agent-halo");
  halo.setAttribute("r", "5.8");

  const box = document.createElementNS(SVG_NS, "rect");
  box.setAttribute("class", "agent-box");
  box.setAttribute("x", "-8.5");
  box.setAttribute("y", "-8.5");
  box.setAttribute("width", "17");
  box.setAttribute("height", "17");

  const dot = document.createElementNS(SVG_NS, "circle");
  dot.setAttribute("class", "agent-dot");
  dot.setAttribute("r", "4.6");

  const id = document.createElementNS(SVG_NS, "text");
  id.setAttribute("class", "agent-id");
  id.setAttribute("x", "10.5");
  id.setAttribute("y", "-10");
  id.textContent = String(agent.id);

  group.append(halo, box, dot, id);
  return group;
}

/** Everything on the plan that never changes: walls, door, cameras, zones, seats, the line. */
const PlanDrawing = memo(function PlanDrawing({
  scene,
  lineRef
}: {
  scene: SceneDef;
  lineRef: RefObject<SVGLineElement | null>;
}) {
  const {room, door, service, line, cameras, tables} = scene;
  const right = room.x + room.w;
  const bottom = room.y + room.h;
  const leaf = door.y2 - door.y1;
  const walls = [
    `M ${room.x} ${door.y1} V ${room.y} H ${right} V ${service.y1}`,
    `M ${right} ${service.y2} V ${bottom} H ${room.x} V ${door.y2}`
  ].join(" ");
  const entranceLabel = {x: room.x - 12, y: door.y1 - 14};

  return (
    <g aria-hidden="true">
      <path className="plan-wall" d={walls} />

      {/* Door leaf and its swing, as an architect would draw them. */}
      <path
        className="plan-thin"
        d={`M ${room.x} ${door.y1} h ${leaf} A ${leaf} ${leaf} 0 0 1 ${room.x} ${door.y2}`}
      />

      <text
        className="plan-label"
        x={entranceLabel.x}
        y={entranceLabel.y}
        transform={`rotate(-90 ${entranceLabel.x} ${entranceLabel.y})`}
      >
        Entrance
      </text>
      <text
        className="plan-label"
        x={right - 9}
        y={service.y1 - 9}
        textAnchor="end"
      >
        Kitchen
      </text>

      {cameras.map(camera => (
        <g key={camera.label}>
          <g
            transform={`translate(${camera.x} ${camera.y}) rotate(${camera.angle})`}
          >
            <line className="plan-view" x1="10" y1="0" x2="60" y2="-25" />
            <line className="plan-view" x1="10" y1="0" x2="60" y2="25" />
            <rect
              className="plan-camera"
              x="-7"
              y="-4.5"
              width="11"
              height="9"
              rx="1.5"
            />
            <path
              className="plan-camera"
              d="M 4 -2.5 L 9.5 -5.5 V 5.5 L 4 2.5 Z"
            />
          </g>
          <text
            className="plan-label"
            x={camera.labelAnchor === "start" ? room.x + 2 : right - 2}
            y={room.y - 5}
            textAnchor={camera.labelAnchor}
          >
            {camera.label}
          </text>
        </g>
      ))}

      <rect
        className="count-band"
        x={line.x - line.margin}
        y={line.y1}
        width={line.margin * 2}
        height={line.y2 - line.y1}
      />
      <line
        ref={lineRef}
        className="count-line"
        x1={line.x}
        y1={line.y1}
        x2={line.x}
        y2={line.y2}
      />
      <text
        className="plan-label"
        x={line.x}
        y={line.y1 - 9}
        textAnchor="middle"
      >
        Counting line
      </text>
      <path
        className="count-arrow"
        d={`M ${line.x - 3} ${line.y2 + 8} l 10 5.5 l -10 5.5 z`}
      />
      <text className="plan-label" x={line.x + 12} y={line.y2 + 17.5}>
        in
      </text>

      {tables.map(table => (
        <g key={table.id}>
          <rect
            className="plan-zone"
            x={table.zone.x}
            y={table.zone.y}
            width={table.zone.w}
            height={table.zone.h}
            rx="7"
          />
          {table.seats.map((seat, index) => (
            <rect
              key={index}
              className="plan-seat"
              x={seat.x - 7}
              y={seat.y - 7}
              width="14"
              height="14"
              rx="3.5"
            />
          ))}
        </g>
      ))}
    </g>
  );
});

function formatMinutes(minutes: number): string {
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

function tableNote(view: TableView, signal: boolean): string {
  if (!signal) return "No signal";
  switch (view.state) {
    case "occupied":
      return view.minutes === null ? "" : formatMinutes(view.minutes);
    case "away":
      return "Away";
    case "cleaning":
      return "To clean";
    case "reserved":
      return "Reserved";
    default:
      return "";
  }
}

function tableLabel(view: TableView, signal: boolean): string {
  const name = `Table ${view.number}`;
  if (!signal) return `${name}: no signal.`;
  switch (view.state) {
    case "available":
      return `${name}: available. Press Enter to reserve it.`;
    case "occupied": {
      const guests = `${view.people} ${view.people === 1 ? "guest" : "guests"} seated`;
      return `${name}: occupied, ${guests}, ${view.minutes ?? 0} minutes so far.`;
    }
    case "away":
      return `${name}: away. The visit is being held open.`;
    case "cleaning":
      return `${name}: needs cleaning. Press Enter to mark it clean.`;
    case "reserved":
      return `${name}: reserved. Press Enter to cancel the reservation.`;
  }
}

function PlanTable({
  table,
  view,
  signal,
  tabIndex,
  groupRef,
  onTap,
  onFocus,
  onKeyDown
}: {
  table: TableDef;
  view: TableView;
  signal: boolean;
  tabIndex: number;
  groupRef: (element: SVGGElement | null) => void;
  onTap: () => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
}) {
  const {x, y, w, h, kind} = table;
  const note = tableNote(view, signal);
  const round = kind === "round";
  // A plate behind the label, kept inside the table so the hatching still shows around it.
  const plate = Math.min(w - 8, 58);

  return (
    <g
      ref={groupRef}
      className="plan-table"
      data-state={view.state}
      data-signal={signal ? "on" : "off"}
      role="button"
      tabIndex={tabIndex}
      aria-label={tableLabel(view, signal)}
      onClick={onTap}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
    >
      {round ? (
        <>
          <circle className="plan-table-ring" cx={x} cy={y} r={w / 2 + 5} />
          <circle className="plan-table-shape" cx={x} cy={y} r={w / 2} />
        </>
      ) : (
        <>
          <rect
            className="plan-table-ring"
            x={x - w / 2 - 5}
            y={y - h / 2 - 5}
            width={w + 10}
            height={h + 10}
            rx="9"
          />
          <rect
            className="plan-table-shape"
            x={x - w / 2}
            y={y - h / 2}
            width={w}
            height={h}
            rx="5"
          />
        </>
      )}
      <rect
        className="plan-table-plate"
        x={x - plate / 2}
        y={y - 16}
        width={plate}
        height="32"
        rx="3"
      />
      <text
        className="plan-table-name"
        x={x}
        y={note ? y - 2 : y + 4.5}
        textAnchor="middle"
      >
        T{table.number}
      </text>
      {note && (
        <text className="plan-table-note" x={x} y={y + 12} textAnchor="middle">
          {note}
        </text>
      )}
    </g>
  );
}
