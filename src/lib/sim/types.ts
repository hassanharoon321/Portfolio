export interface Vec {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What the occupancy engine believes about a table. */
export type TableState =
  "available" | "occupied" | "away" | "cleaning" | "reserved";

export type TableKind = "two" | "four" | "round";

export interface TableDef {
  id: string;
  /** Number shown to people: "Table 3". */
  number: number;
  kind: TableKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Seats in the order a party fills them. The first one is always on the wall side. */
  seats: Vec[];
  /** The table zone, as a manager would draw it on a camera snapshot. */
  zone: Rect;
  /** Vertical corridors on either side of the table that guests walk along. */
  lanes: number[];
  /** Where a busser stands to clear the table. */
  cleanSpot: Vec;
  /** Where the first guest goes to take a phone call: by the wall, outside the zone. */
  awaySpot: Vec;
}

export interface CameraDef extends Vec {
  /** Direction the camera points, in degrees (0 = right, 90 = down). */
  angle: number;
  label: string;
  labelAnchor: "start" | "end";
}

export interface SceneDef {
  variant: "wide" | "compact";
  width: number;
  height: number;
  room: Rect;
  aisleY: number;
  /** Gap in the left wall. */
  door: {x: number; y1: number; y2: number};
  /** Gap in the right wall that staff come through. */
  service: {x: number; y1: number; y2: number};
  /** Entrance counting line, with a dead zone of `margin` on either side. */
  line: {x: number; y1: number; y2: number; margin: number};
  /** Walking speed in scene units per second. */
  speed: number;
  tables: TableDef[];
  cameras: CameraDef[];
}

export type AgentRole = "guest" | "staff";

export type Step = {go: Vec[]} | {wait: number} | {run: () => void};

export interface Agent {
  /** Track ID, as a tracker would assign it. */
  id: number;
  role: AgentRole;
  x: number;
  y: number;
  speed: number;
  /** Seconds since the agent last moved. */
  still: number;
  /** Which side of the counting line the agent is confirmed on: -1 outside, 1 inside. */
  side: -1 | 0 | 1;
  candidate: -1 | 0 | 1;
  candidateFor: number;
  steps: Step[];
  gone: boolean;
}

export interface LogEntry {
  id: number;
  clock: string;
  text: string;
}

export interface TableView {
  id: string;
  number: number;
  state: TableState;
  /** Guests seated right now. */
  people: number;
  /** Minutes since the current visit started, or null when there is no visit. */
  minutes: number | null;
}

export interface Snapshot {
  clock: string;
  signal: boolean;
  entries: number;
  exits: number;
  inside: number;
  tables: TableView[];
  log: LogEntry[];
}
