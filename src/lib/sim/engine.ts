/**
 * A small restaurant, simulated.
 *
 * Synthetic guests walk in, sit, step away, leave, and a busser clears up after them. On top of
 * that world runs a miniature of the two engines from my restaurant platform:
 *
 *  - an entrance counter that only counts a crossing once a person is confirmed on one side of
 *    the line and then confirmed on the other, with a dead zone in between, and
 *  - a table state machine fed by how many people are sitting still inside each table's zone.
 *
 * The engines never read the guests' intentions. They only see positions, the way a camera does.
 */
import type {
  Agent,
  AgentRole,
  LogEntry,
  Rect,
  SceneDef,
  Snapshot,
  TableDef,
  TableKind,
  TableState,
  Vec
} from "./types";

/** Durations in seconds of real time. One real second plays as one simulated minute. */
export const TIMING = {
  /** A guest must stay put this long before they count as seated. */
  stationary: 0.45,
  /** Seated presence needed before a free table turns occupied. */
  enter: 0.6,
  /** Empty time before an occupied table shows as away. */
  gap: 0.5,
  /** Empty time before an away table is treated as finished. */
  absent: 6,
  /** How long a busser must be at the table for it to count as cleaned. */
  cleanActivity: 1.2,
  /** A table nobody was seen cleaning is assumed clean after this long. */
  cleanTimeout: 26,
  /** Time on the far side of the counting line before a crossing is confirmed. */
  lineConfirm: 0.1,
  /** How long a reserved table is held before the booking counts as a no-show. */
  reservationHold: 16,
  /** A cut camera feed comes back by itself after this long. */
  signalRestore: 10
} as const;

const OPENING_MINUTE = 19 * 60;
const LOG_LENGTH = 5;
const MAX_BUSSERS = 2;
/** Agents wait and leave here, just outside the left edge of the drawing. */
const OFF_CANVAS_X = -14;

interface TableRuntime {
  def: TableDef;
  state: TableState;
  /** When the current state began. */
  since: number;
  /** Guests seated right now, as observed. */
  people: number;
  presentFor: number;
  emptyFor: number;
  cleanFor: number;
  visitStart: number | null;
  reservedUntil: number;
  /** Set when a camera outage interrupted a visit, until the table is seen again. */
  resumed: boolean;
  /** A busser is already on the way, so a second one is not sent. */
  busserSent: boolean;
  // Ground truth the cameras cannot see: who the host gave the table to, and whether it has
  // actually been cleared.
  claimedBy: number | null;
  dirty: boolean;
}

interface Party {
  id: number;
  table: TableRuntime;
  size: number;
  members: Agent[];
  seated: number;
  countedIn: number;
  countedOut: number;
  phase: "arriving" | "seated" | "leaving";
  leaveAt: number;
  stepAwayAt: number;
}

/** Deterministic random numbers, so the plan opens on the same scene every time. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inside(point: Vec, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  );
}

function nearestLane(lanes: number[], x: number): number {
  return lanes.reduce((best, lane) =>
    Math.abs(lane - x) < Math.abs(best - x) ? lane : best
  );
}

export class Sim {
  readonly scene: SceneDef;
  time = 0;
  agents: Agent[] = [];
  signal = true;
  entries = 0;
  exits = 0;
  /** Goes up whenever something the interface shows has changed. */
  version = 0;
  /** Goes up on every counted crossing, so the interface can flash the line. */
  crossings = 0;

  private readonly tables: TableRuntime[];
  private readonly random: () => number;
  private parties: Party[] = [];
  private partyOf = new Map<number, Party>();
  private bookings: {table: TableRuntime; at: number}[] = [];
  private log: LogEntry[] = [];
  private nextTrackId = 11;
  private nextPartyId = 1;
  private nextLogId = 1;
  private nextArrival = 0.6;
  private nextBooking = 20;
  private bussersOut = 0;
  private signalLostAt = 0;

  constructor(scene: SceneDef, seed = 20261115) {
    this.scene = scene;
    this.random = mulberry32(seed);
    this.tables = scene.tables.map(def => ({
      def,
      state: "available",
      since: 0,
      people: 0,
      presentFor: 0,
      emptyFor: 0,
      cleanFor: 0,
      visitStart: null,
      reservedUntil: 0,
      resumed: false,
      busserSent: false,
      claimedBy: null,
      dirty: false
    }));
  }

  /** Runs the simulation ahead without drawing, so the plan opens mid-service. */
  warmUp(seconds: number): void {
    const dt = 1 / 30;
    for (let t = 0; t < seconds; t += dt) this.step(dt);
  }

  step(dt: number): void {
    this.time += dt;
    this.runHost();
    this.runParties();

    for (const agent of this.agents) {
      this.advance(agent, dt);
      this.watchLine(agent, dt);
    }
    if (this.agents.some(agent => agent.gone)) {
      this.agents = this.agents.filter(agent => !agent.gone);
    }

    if (this.signal) {
      for (const table of this.tables) this.watchTable(table, dt);
      this.dispatchBusser();
    } else if (this.time - this.signalLostAt >= TIMING.signalRestore) {
      this.setSignal(true);
    }
  }

  /** Cuts or restores the floor camera. The entrance camera keeps counting either way. */
  setSignal(on: boolean): void {
    if (on === this.signal) return;
    this.signal = on;

    if (!on) {
      this.signalLostAt = this.time;
      this.note("Floor camera offline: tables show no signal");
    } else {
      for (const table of this.tables) {
        table.presentFor = 0;
        table.emptyFor = 0;
        // A visit that was running is neither confirmed nor ended. It resumes as away: back to
        // occupied if guests are still seated, or on to cleaning once the absence timer runs out.
        if (table.state === "occupied") {
          table.state = "away";
          table.resumed = true;
        }
      }
      this.note("Floor camera back: every table re-checked");
    }
    this.version++;
  }

  /** A person taps a table on the plan. Returns a sentence saying what happened. */
  tap(id: string): string {
    const table = this.tables.find(t => t.def.id === id);
    if (!table) return "";
    const n = table.def.number;

    if (!this.signal)
      return `Table ${n} has no signal. Restore the camera feed to change it.`;

    switch (table.state) {
      case "cleaning":
        table.dirty = false;
        this.setState(table, "available");
        this.note(`Table ${n} marked clean by you`);
        return `Table ${n} marked clean.`;
      case "available":
        if (!this.isFree(table)) return `Table ${n} is about to be seated.`;
        this.reserve(table, true);
        return `Table ${n} reserved. A booked party is on its way.`;
      case "reserved":
        this.bookings = this.bookings.filter(b => b.table !== table);
        this.setState(table, "available");
        this.note(`Table ${n}: reservation cancelled by you`);
        return `Reservation for table ${n} cancelled.`;
      case "away":
        return `Table ${n} is being held for a guest who stepped away.`;
      default:
        return `Table ${n} is occupied. Nothing to change.`;
    }
  }

  snapshot(): Snapshot {
    return {
      clock: this.clock(),
      signal: this.signal,
      entries: this.entries,
      exits: this.exits,
      inside: Math.max(this.entries - this.exits, 0),
      tables: this.tables.map(table => ({
        id: table.def.id,
        number: table.def.number,
        state: table.state,
        people: table.people,
        minutes:
          table.visitStart === null
            ? null
            : Math.floor(this.time - table.visitStart)
      })),
      log: this.log
    };
  }

  // ---------------------------------------------------------------------------------------
  // The world: a host seating parties, guests coming and going, a busser clearing tables.
  // ---------------------------------------------------------------------------------------

  private runHost(): void {
    if (this.bookings.some(b => this.time >= b.at)) {
      for (const booking of this.bookings) {
        if (this.time < booking.at) continue;
        const {table} = booking;
        if (table.state === "reserved" && this.isFree(table))
          this.seatParty(table);
      }
      this.bookings = this.bookings.filter(b => this.time < b.at);
    }

    if (this.time >= this.nextBooking) {
      const free = this.walkInTables();
      const alreadyHolding = this.tables.some(t => t.state === "reserved");
      if (this.signal && free.length >= 2 && !alreadyHolding) {
        this.reserve(this.pick(free), false);
        this.nextBooking = this.time + this.between(34, 52);
      } else {
        // The room is too full to hold a table right now. Look again shortly.
        this.nextBooking = this.time + 4;
      }
    }

    if (this.time >= this.nextArrival) {
      const free = this.walkInTables();
      if (free.length) {
        this.seatParty(this.pick(free));
        // Fewer tables means fewer walk-ins, so a small room is not permanently full.
        const pace = 7 / this.tables.length;
        this.nextArrival = this.time + this.between(4.5, 8.5) * pace;
      } else {
        this.nextArrival = this.time + 1.5;
      }
    }
  }

  private isFree(table: TableRuntime): boolean {
    return table.claimedBy === null && !table.dirty;
  }

  private walkInTables(): TableRuntime[] {
    return this.tables.filter(t => this.isFree(t) && t.state === "available");
  }

  private partySize(kind: TableKind): number {
    const r = this.random();
    if (kind === "two") return r < 0.45 ? 1 : 2;
    if (kind === "four") return r < 0.3 ? 2 : r < 0.65 ? 3 : 4;
    return 3 + Math.floor(r * 4);
  }

  private seatParty(table: TableRuntime): void {
    const {aisleY} = this.scene;
    const size = this.partySize(table.def.kind);
    const party: Party = {
      id: this.nextPartyId++,
      table,
      size,
      members: [],
      seated: 0,
      countedIn: 0,
      countedOut: 0,
      phase: "arriving",
      leaveAt: Infinity,
      stepAwayAt: Infinity
    };
    table.claimedBy = party.id;

    for (let i = 0; i < size; i++) {
      const seat = table.def.seats[i];
      const lane = nearestLane(table.def.lanes, seat.x);
      // People walking in keep to the upper half of the aisle, people leaving to the lower.
      const y = aisleY - 3 - this.random() * 7;
      const agent = this.spawn("guest", OFF_CANVAS_X, y);
      agent.steps = [
        {wait: i * 0.3 + this.random() * 0.12},
        {go: [{x: lane, y}, {x: lane, y: seat.y}, seat]},
        {
          run: () => {
            party.seated++;
            if (party.seated === size) this.settle(party);
          }
        }
      ];
      party.members.push(agent);
      this.partyOf.set(agent.id, party);
    }
    this.parties.push(party);
  }

  private settle(party: Party): void {
    party.phase = "seated";
    party.leaveAt = this.time + this.between(16, 32);
    // Solo diners often step out for a call. It is the case the state machine exists for.
    const chance = party.size === 1 ? 0.75 : 0.3;
    if (this.random() < chance) {
      party.stepAwayAt = this.time + this.between(4, 8);
      party.leaveAt = Math.max(party.leaveAt, party.stepAwayAt + 9);
    }
  }

  private runParties(): void {
    for (const party of this.parties) {
      if (party.phase !== "seated") continue;

      if (this.time >= party.stepAwayAt) {
        party.stepAwayAt = Infinity;
        const {awaySpot, seats} = party.table.def;
        party.members[0].steps = [
          {go: [awaySpot]},
          {wait: this.between(2.2, 3.1)},
          {go: [seats[0]]}
        ];
      }

      if (this.time >= party.leaveAt) this.leave(party);
    }

    if (this.parties.some(p => p.members.every(a => a.gone))) {
      for (const party of this.parties) {
        if (party.members.every(a => a.gone)) {
          for (const agent of party.members) this.partyOf.delete(agent.id);
        }
      }
      this.parties = this.parties.filter(p => !p.members.every(a => a.gone));
    }
  }

  private leave(party: Party): void {
    const {aisleY} = this.scene;
    party.phase = "leaving";
    party.table.claimedBy = null;
    party.table.dirty = true;

    party.members.forEach((agent, i) => {
      const seat = party.table.def.seats[i];
      const lane = nearestLane(party.table.def.lanes, seat.x);
      const y = aisleY + 3 + this.random() * 7;
      agent.steps = [
        {wait: i * 0.26},
        {
          go: [
            {x: lane, y: seat.y},
            {x: lane, y},
            {x: OFF_CANVAS_X, y}
          ]
        },
        {
          run: () => {
            agent.gone = true;
          }
        }
      ];
    });
  }

  private dispatchBusser(): void {
    if (this.bussersOut >= MAX_BUSSERS) return;

    // The table that has been waiting longest goes first.
    let target: TableRuntime | null = null;
    for (const table of this.tables) {
      if (table.state !== "cleaning" || table.busserSent) continue;
      if (this.time - table.since < 1.4) continue;
      if (!target || table.since < target.since) target = table;
    }
    if (!target) return;

    const table = target;
    const {service, aisleY} = this.scene;
    const y = aisleY + 14;
    const home = {x: service.x + 6, y};
    const spot = table.def.cleanSpot;
    const turn = {x: spot.x, y};
    const busser = this.spawn("staff", home.x, home.y);

    this.bussersOut++;
    table.busserSent = true;
    busser.steps = [
      {go: [turn, spot]},
      {
        run: () => {
          // Someone may have marked the table clean while the busser was walking over.
          if (!table.dirty && table.state !== "cleaning") return;
          busser.steps.unshift(
            {wait: 1.9},
            {
              run: () => {
                table.dirty = false;
              }
            }
          );
        }
      },
      {go: [turn, home]},
      {
        run: () => {
          busser.gone = true;
          this.bussersOut--;
        }
      }
    ];
  }

  private spawn(role: AgentRole, x: number, y: number): Agent {
    const agent: Agent = {
      id: this.nextTrackId++,
      role,
      x,
      y,
      speed:
        this.scene.speed *
        (role === "staff" ? 1.3 : 0.94 + this.random() * 0.12),
      still: 0,
      side: 0,
      candidate: 0,
      candidateFor: 0,
      steps: [],
      gone: false
    };
    this.agents.push(agent);
    return agent;
  }

  /** Moves one agent through its script: walk, wait, or run a callback. */
  private advance(agent: Agent, dt: number): void {
    let budget = dt;
    let moved = false;

    while (budget > 1e-6 && agent.steps.length && !agent.gone) {
      const step = agent.steps[0];

      if ("run" in step) {
        agent.steps.shift();
        step.run();
        continue;
      }

      if ("wait" in step) {
        const used = Math.min(step.wait, budget);
        step.wait -= used;
        budget -= used;
        if (step.wait <= 1e-6) agent.steps.shift();
        continue;
      }

      const target = step.go[0];
      if (!target) {
        agent.steps.shift();
        continue;
      }
      const dx = target.x - agent.x;
      const dy = target.y - agent.y;
      const distance = Math.hypot(dx, dy);
      const reach = agent.speed * budget;

      if (distance <= reach) {
        agent.x = target.x;
        agent.y = target.y;
        step.go.shift();
        budget -= distance / agent.speed;
        moved = moved || distance > 0;
      } else {
        agent.x += (dx / distance) * reach;
        agent.y += (dy / distance) * reach;
        budget = 0;
        moved = true;
      }
    }

    agent.still = moved ? 0 : agent.still + dt;
  }

  // ---------------------------------------------------------------------------------------
  // What the cameras work out: entrance counts and table states.
  // ---------------------------------------------------------------------------------------

  /**
   * Entrance counting with a dead zone. A crossing counts only when a track that was confirmed
   * on one side has spent `lineConfirm` on the other. Hovering on the line produces nothing.
   */
  private watchLine(agent: Agent, dt: number): void {
    const line = this.scene.line;
    const offset = agent.x - line.x;
    const inRange =
      agent.y >= line.y1 - line.margin && agent.y <= line.y2 + line.margin;

    if (!inRange || Math.abs(offset) < line.margin) {
      agent.candidate = 0;
      agent.candidateFor = 0;
      return;
    }

    const side = offset > 0 ? 1 : -1;
    if (side === agent.side) {
      agent.candidate = 0;
      agent.candidateFor = 0;
      return;
    }

    if (agent.candidate !== side) {
      agent.candidate = side;
      agent.candidateFor = 0;
    }
    agent.candidateFor += dt;
    if (agent.candidateFor < TIMING.lineConfirm) return;

    const firstSighting = agent.side === 0;
    agent.side = side;
    agent.candidate = 0;
    agent.candidateFor = 0;
    // A track that has only ever been seen on one side has not crossed anything yet.
    if (firstSighting) return;

    const party = this.partyOf.get(agent.id);
    if (side === 1) {
      this.entries++;
      if (party && ++party.countedIn === party.size)
        this.note(this.countedText(party, "in"));
    } else {
      this.exits++;
      if (party && ++party.countedOut === party.size)
        this.note(this.countedText(party, "out"));
    }
    this.crossings++;
    this.version++;
  }

  private countedText(party: Party, direction: "in" | "out"): string {
    return party.size === 1
      ? `1 guest counted ${direction}`
      : `Party of ${party.size} counted ${direction}`;
  }

  /** Table occupancy: count who is sitting still in the zone, then run the state machine. */
  private watchTable(table: TableRuntime, dt: number): void {
    const zone = table.def.zone;
    const n = table.def.number;

    let seated = 0;
    let busserHere = false;
    for (const agent of this.agents) {
      if (!inside(agent, zone)) continue;
      if (agent.role === "staff") busserHere = busserHere || agent.still >= 0.2;
      else if (agent.still >= TIMING.stationary) seated++;
    }

    if (seated !== table.people) {
      table.people = seated;
      this.version++;
    }
    if (seated > 0) {
      table.presentFor += dt;
      table.emptyFor = 0;
    } else {
      table.emptyFor += dt;
      table.presentFor = 0;
    }

    switch (table.state) {
      case "available":
      case "reserved":
      case "cleaning": {
        if (table.presentFor >= TIMING.enter) {
          const wasReserved = table.state === "reserved";
          // Backdated to the first sighting, so dwell time is not short by the entry delay.
          table.visitStart = this.time - table.presentFor;
          this.setState(table, "occupied");
          this.note(
            wasReserved
              ? `Table ${n}: booked party seated`
              : `Table ${n} occupied`
          );
          break;
        }
        if (table.state === "cleaning") {
          if (busserHere) {
            table.cleanFor += dt;
          } else if (table.cleanFor >= TIMING.cleanActivity) {
            this.setState(table, "available");
            this.note(`Table ${n} cleaned`);
          } else if (this.time - table.since >= TIMING.cleanTimeout) {
            table.dirty = false;
            this.setState(table, "available");
            this.note(`Table ${n} assumed clean after timeout`);
          }
        } else if (
          table.state === "reserved" &&
          this.time >= table.reservedUntil
        ) {
          this.setState(table, "available");
          this.note(`Table ${n}: no-show, reservation released`);
        }
        break;
      }

      case "occupied":
        if (table.emptyFor >= TIMING.gap) {
          this.setState(table, "away");
          this.note(`Table ${n} away: visit kept open`);
        }
        break;

      case "away":
        if (table.presentFor >= 0.25) {
          const text = table.resumed
            ? `Table ${n}: guests still seated, visit continues`
            : `Table ${n}: guest back, same visit`;
          this.setState(table, "occupied");
          this.note(text);
        } else if (table.emptyFor >= TIMING.absent) {
          table.visitStart = null;
          table.cleanFor = 0;
          this.setState(table, "cleaning");
          this.note(`Table ${n} needs cleaning`);
        }
        break;
    }
  }

  private reserve(table: TableRuntime, byVisitor: boolean): void {
    const n = table.def.number;
    table.reservedUntil = this.time + TIMING.reservationHold;
    this.setState(table, "reserved");
    this.note(
      byVisitor
        ? `Table ${n} reserved by you`
        : `Table ${n} reserved for a booking`
    );
    // Bookings made by the simulation sometimes do not turn up, so the no-show path runs too.
    if (byVisitor || this.random() > 0.15) {
      this.bookings.push({table, at: this.time + this.between(5, 8)});
    }
  }

  private setState(table: TableRuntime, state: TableState): void {
    table.state = state;
    table.since = this.time;
    table.resumed = false;
    table.busserSent = false;
    this.version++;
  }

  private note(text: string): void {
    this.log = [
      {id: this.nextLogId++, clock: this.clock(), text},
      ...this.log
    ].slice(0, LOG_LENGTH);
    this.version++;
  }

  private clock(): string {
    const minute = (OPENING_MINUTE + Math.floor(this.time)) % (24 * 60);
    const hh = String(Math.floor(minute / 60)).padStart(2, "0");
    const mm = String(minute % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  private between(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  private pick<T>(items: T[]): T {
    return items[Math.floor(this.random() * items.length)];
  }
}
