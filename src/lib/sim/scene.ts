import type {Rect, SceneDef, TableDef, TableKind, Vec} from "./types";

interface TableSpec {
  number: number;
  kind: TableKind;
  x: number;
  y: number;
  /** Two-seat tables only: chairs to the left and right ("h") or above and below ("v"). */
  orient?: "h" | "v";
  lanes: [number, number];
}

const SEAT_GAP = 13;
const ROUND_RADIUS = 36;

/** Works out seats, zone and standing spots for one table from its position and kind. */
function buildTable(spec: TableSpec, room: Rect, aisleY: number): TableDef {
  const {x, y, kind} = spec;
  // Direction from the table to its nearest wall: up (-1) for the top row, down (+1) for the
  // bottom row. The aisle is always on the opposite side.
  const wall = y < aisleY ? -1 : 1;
  const wallY = wall < 0 ? room.y + 16 : room.y + room.h - 16;

  let w: number;
  let h: number;
  let seats: Vec[];
  let zone: Rect;
  let cleanSpot: Vec;

  if (kind === "two" && spec.orient === "v") {
    w = 50;
    h = 46;
    const reach = h / 2 + SEAT_GAP;
    seats = [
      {x, y: y + wall * reach},
      {x, y: y - wall * reach}
    ];
    zone = {x: x - 37, y: y - 48, w: 74, h: 96};
    cleanSpot = {x: x + w / 2 + 7, y: y - wall * 14};
  } else if (kind === "two") {
    w = 54;
    h = 48;
    const reach = w / 2 + SEAT_GAP;
    seats = [
      {x: x - reach, y},
      {x: x + reach, y}
    ];
    zone = {x: x - 52, y: y - 34, w: 104, h: 68};
    cleanSpot = {x, y: y - wall * (h / 2 + 9)};
  } else if (kind === "four") {
    w = 84;
    h = 50;
    const reach = h / 2 + SEAT_GAP;
    // Fill order alternates sides so a party of two sits face to face.
    seats = [
      {x: x - 20, y: y + wall * reach},
      {x: x - 20, y: y - wall * reach},
      {x: x + 20, y: y + wall * reach},
      {x: x + 20, y: y - wall * reach}
    ];
    zone = {x: x - 54, y: y - 50, w: 108, h: 100};
    cleanSpot = {x, y: y - wall * 34};
  } else {
    w = ROUND_RADIUS * 2;
    h = ROUND_RADIUS * 2;
    const reach = ROUND_RADIUS + SEAT_GAP;
    // Six seats, starting on the wall side and alternating across the table.
    const order = [0, 3, 1, 4, 5, 2];
    seats = order.map(i => {
      const angle = ((wall < 0 ? -90 : 90) + i * 60) * (Math.PI / 180);
      return {x: x + Math.cos(angle) * reach, y: y + Math.sin(angle) * reach};
    });
    zone = {x: x - 63, y: y - 63, w: 126, h: 126};
    cleanSpot = {x: x + 23.5, y: y - wall * 40.7};
  }

  return {
    id: `T${spec.number}`,
    number: spec.number,
    kind,
    x,
    y,
    w,
    h,
    seats,
    zone,
    lanes: spec.lanes,
    cleanSpot,
    awaySpot: {x: seats[0].x, y: wallY}
  };
}

function buildScene(
  base: Omit<SceneDef, "tables">,
  specs: TableSpec[]
): SceneDef {
  return {
    ...base,
    tables: specs.map(spec => buildTable(spec, base.room, base.aisleY))
  };
}

/** Seven tables and two cameras, for screens wide enough to show them. */
export const wideScene: SceneDef = buildScene(
  {
    variant: "wide",
    width: 720,
    height: 420,
    room: {x: 56, y: 16, w: 648, h: 388},
    aisleY: 214,
    door: {x: 56, y1: 184, y2: 244},
    service: {x: 704, y1: 188, y2: 240},
    line: {x: 132, y1: 174, y2: 254, margin: 10},
    speed: 118,
    cameras: [
      {
        x: 68,
        y: 28,
        angle: 72,
        label: "Camera 1, entrance",
        labelAnchor: "start"
      },
      {x: 692, y: 28, angle: 146, label: "Camera 2, floor", labelAnchor: "end"}
    ]
  },
  [
    {number: 1, kind: "two", orient: "h", x: 215, y: 106, lanes: [152, 279]},
    {number: 2, kind: "four", x: 345, y: 106, lanes: [279, 413]},
    {number: 3, kind: "round", x: 490, y: 106, lanes: [413, 561]},
    {number: 4, kind: "two", orient: "h", x: 620, y: 106, lanes: [561, 688]},
    {number: 5, kind: "four", x: 270, y: 322, lanes: [198, 350]},
    {number: 6, kind: "four", x: 430, y: 322, lanes: [350, 508]},
    {number: 7, kind: "two", orient: "h", x: 585, y: 322, lanes: [508, 656]}
  ]
);

/** Four tables, drawn larger, for phones. */
export const compactScene: SceneDef = buildScene(
  {
    variant: "compact",
    width: 360,
    height: 420,
    room: {x: 34, y: 16, w: 318, h: 392},
    aisleY: 211,
    door: {x: 34, y1: 184, y2: 238},
    service: {x: 352, y1: 187, y2: 235},
    line: {x: 78, y1: 176, y2: 246, margin: 9},
    speed: 82,
    cameras: [
      {x: 45, y: 27, angle: 76, label: "Camera 1", labelAnchor: "start"},
      {x: 341, y: 27, angle: 140, label: "Camera 2", labelAnchor: "end"}
    ]
  },
  [
    {number: 1, kind: "two", orient: "v", x: 140, y: 96, lanes: [96, 196]},
    {number: 2, kind: "four", x: 268, y: 96, lanes: [196, 337]},
    {number: 3, kind: "four", x: 160, y: 326, lanes: [98, 232]},
    {number: 4, kind: "two", orient: "v", x: 286, y: 326, lanes: [232, 337]}
  ]
);
