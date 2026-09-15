import { matchup } from "./analysis";
import { CARDS_BY_KEY, PLAYABLE } from "./catalog";
import { archetypeOf } from "./coach";
import { META_DECKS } from "./meta";

export const REGULATION_SEC = 180;
export const OVERTIME_SEC = 120;
export const DOUBLE_AT = 60;
export const START_ELIXIR = 5;
export const MAX_ELIXIR = 10;
export const ELIXIR_SEC_1X = 2.8;
export const ELIXIR_SEC_2X = 1.4;

export type LiveSideId = "you" | "them";
export type LivePhase = "single" | "double" | "overtime";

export type LiveSide = {
  deck: string[];
  order: string[];
  elixir: number;
  revealed: number;
};

export type LiveAdvice = {
  id: string;
  t: number;
  text: string;
  speak: string;
  tone: "call" | "warn" | "good" | "info";
};

export type LiveEvent = {
  id: string;
  t: number;
  clock: string;
  side: LiveSideId;
  key: string;
  cost: number;
  corrected: boolean;
};

export type LiveMatch = {
  running: boolean;
  remaining: number;
  overtime: boolean;
  you: LiveSide;
  them: LiveSide;
  events: LiveEvent[];
  log: LiveAdvice[];
  startedAt: number;
};

export const COUNTERS: Record<string, string[]> = {
  "hog-rider": ["cannon", "tesla", "tombstone", "mini-pekka", "earthquake", "goblin-cage"],
  "royal-hogs": ["earthquake", "royal-delivery", "valkyrie", "barbarian-barrel", "cannon"],
  "goblin-barrel": ["the-log", "royal-delivery", "barbarian-barrel", "arrows", "giant-snowball"],
  balloon: ["tesla", "inferno-tower", "musketeer", "mega-minion", "executioner"],
  "mega-knight": ["pekka", "mini-pekka", "inferno-tower", "fisherman", "valkyrie"],
  miner: ["valkyrie", "knight", "skeletons", "guards", "goblin-gang"],
  "x-bow": ["royal-giant", "hog-rider", "earthquake", "royal-hogs", "goblin-barrel"],
  mortar: ["hog-rider", "royal-giant", "miner", "earthquake"],
  "battle-ram": ["pekka", "cannon", "tesla", "knight", "mini-pekka"],
  golem: ["inferno-tower", "pekka", "mini-pekka", "inferno-dragon"],
  "electro-giant": ["pekka", "inferno-tower", "mini-pekka", "cannon"],
  "lava-hound": ["inferno-dragon", "musketeer", "executioner", "tesla"],
  "graveyard": ["poison", "valkyrie", "archers", "wizard", "baby-dragon"],
  "royal-giant": ["pekka", "inferno-tower", "cannon", "tesla"],
  "wall-breakers": ["the-log", "zap", "cannon", "tombstone", "skeletons"],
  "skeleton-barrel": ["the-log", "arrows", "zap", "barbarian-barrel"],
  prince: ["tombstone", "cannon", "skeletons", "goblin-gang"],
  "dark-prince": ["valkyrie", "knight", "cannon"],
  sparky: ["zap", "electro-wizard", "electro-spirit", "lightning"],
  "inferno-tower": ["lightning", "electro-wizard", "zap", "electro-spirit", "earthquake"],
  "inferno-dragon": ["zap", "electro-wizard", "electro-spirit"],
  "minion-horde": ["arrows", "fireball", "wizard", "valkyrie"],
  "skeleton-army": ["the-log", "zap", "valkyrie", "bomber"],
  princess: ["the-log", "arrows", "barbarian-barrel", "giant-snowball"],
};

const NICKNAMES: Record<string, string> = {
  hog: "hog-rider",
  hoggy: "hog-rider",
  log: "the-log",
  fb: "fireball",
  fireball: "fireball",
  skellies: "skeletons",
  skellys: "skeletons",
  skeles: "skeletons",
  skeletons: "skeletons",
  mk: "mega-knight",
  mega: "mega-knight",
  "mega knight": "mega-knight",
  loon: "balloon",
  balloon: "balloon",
  it: "inferno-tower",
  inferno: "inferno-tower",
  "inferno tower": "inferno-tower",
  idrag: "inferno-dragon",
  nado: "tornado",
  tornado: "tornado",
  eq: "earthquake",
  quake: "earthquake",
  rg: "royal-giant",
  hogs: "royal-hogs",
  "royal hogs": "royal-hogs",
  barrel: "goblin-barrel",
  "goblin barrel": "goblin-barrel",
  gang: "goblin-gang",
  wb: "wall-breakers",
  "wall breakers": "wall-breakers",
  ewiz: "electro-wizard",
  "e wiz": "electro-wizard",
  iwiz: "ice-wizard",
  "ice wiz": "ice-wizard",
  pump: "elixir-collector",
  collector: "elixir-collector",
  gy: "graveyard",
  graveyard: "graveyard",
  pekka: "pekka",
  peka: "pekka",
  "mini pekka": "mini-pekka",
  "mini p": "mini-pekka",
  musk: "musketeer",
  valk: "valkyrie",
  egiant: "electro-giant",
  "e giant": "electro-giant",
  lava: "lava-hound",
  hound: "lava-hound",
  ram: "battle-ram",
  "battle ram": "battle-ram",
  xbow: "x-bow",
  "x bow": "x-bow",
  zap: "zap",
  arrows: "arrows",
  snowball: "giant-snowball",
  delivery: "royal-delivery",
  "barb barrel": "barbarian-barrel",
  "barbs barrel": "barbarian-barrel",
  knight: "knight",
  cannon: "cannon",
  tesla: "tesla",
  miner: "miner",
  princess: "princess",
  bats: "bats",
  minions: "minions",
  horde: "minion-horde",
  poison: "poison",
  rocket: "rocket",
  lightning: "lightning",
  freeze: "freeze",
  rage: "rage",
  void: "void",
  "ice spirit": "ice-spirit",
  "e spirit": "electro-spirit",
  "electro spirit": "electro-spirit",
  "fire spirit": "fire-spirit",
  "heal spirit": "heal-spirit",
  "spear gobs": "spear-goblins",
  goblins: "goblins",
  "little prince": "little-prince",
  "golden knight": "golden-knight",
  "mighty miner": "mighty-miner",
  "skeleton king": "skeleton-king",
  "archer queen": "archer-queen",
  monk: "monk",
  furnace: "furnace",
  tombstone: "tombstone",
  cage: "goblin-cage",
  "goblin hut": "goblin-hut",
};

export function nameOf(key: string): string {
  return CARDS_BY_KEY[key]?.name ?? key;
}

export function costOf(key: string): number {
  return CARDS_BY_KEY[key]?.elixir ?? 0;
}

export function playableDeck(keys: string[]): string[] {
  return keys.filter((k) => {
    const c = CARDS_BY_KEY[k];
    return Boolean(c && c.type !== "tower" && !c.hero);
  }).slice(0, 8);
}

function newId(): string {
  return `lv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function makeSide(deck: string[], hand?: string[]): LiveSide {
  const eight = playableDeck(deck);
  const opening = (hand ?? []).filter((k) => eight.includes(k)).slice(0, 4);
  const rest = eight.filter((k) => !opening.includes(k));
  const order = opening.length === 4 ? [...opening, ...rest] : [...eight];
  return { deck: eight, order, elixir: START_ELIXIR, revealed: opening.length === 4 ? 8 : 0 };
}

export function createMatch(you: string[], them: string[], hands?: { you?: string[]; them?: string[] }): LiveMatch {
  return {
    running: false,
    remaining: REGULATION_SEC,
    overtime: false,
    you: makeSide(you, hands?.you),
    them: makeSide(them, hands?.them),
    events: [],
    log: [],
    startedAt: 0,
  };
}

export function phaseOf(m: LiveMatch): LivePhase {
  if (m.overtime) return "overtime";
  if (m.remaining <= DOUBLE_AT) return "double";
  return "single";
}

export function elixirRate(phase: LivePhase): number {
  return phase === "single" ? 1 / ELIXIR_SEC_1X : 1 / ELIXIR_SEC_2X;
}

export function formatClock(m: LiveMatch): string {
  const sec = Math.max(0, Math.ceil(m.remaining));
  const mm = Math.floor(sec / 60);
  const ss = (sec % 60).toString().padStart(2, "0");
  return m.overtime ? `OT ${mm}:${ss}` : `${mm}:${ss}`;
}

export function inHand(side: LiveSide): string[] {
  return side.order.slice(0, 4);
}

export function inQueue(side: LiveSide): string[] {
  return side.order.slice(4, 8);
}

/** Plays until this card is in hand. 0 = already in hand. */
export function untilHand(side: LiveSide, key: string): number | null {
  const idx = side.order.indexOf(key);
  if (idx < 0) return null;
  if (idx < 4) return 0;
  return idx - 3;
}

export function elixirLead(m: LiveMatch): number {
  return m.you.elixir - m.them.elixir;
}

function pushAdvice(m: LiveMatch, tone: LiveAdvice["tone"], text: string, speak = text): LiveMatch {
  const last = m.log[0];
  if (last && last.text === text && m.startedAt && Date.now() - last.t < 8000) return m;
  const row: LiveAdvice = { id: newId(), t: Date.now(), text, speak, tone };
  return { ...m, log: [row, ...m.log].slice(0, 40) };
}

function cyclePlay(side: LiveSide, key: string): { side: LiveSide; corrected: boolean } | null {
  if (!side.deck.includes(key)) return null;
  const order = [...side.order];
  let corrected = false;
  let idx = order.indexOf(key);
  if (idx < 0) {
    if (order.length < 8) {
      order.push(key);
      idx = order.length - 1;
    } else return null;
  }
  if (idx >= 4) {
    const [card] = order.splice(idx, 1);
    order.splice(3, 0, card!);
    idx = 3;
    corrected = true;
  }
  const [played] = order.splice(idx, 1);
  order.push(played!);
  return {
    side: {
      ...side,
      order,
      elixir: Math.max(0, side.elixir - costOf(key)),
      revealed: Math.min(8, side.revealed + 1),
    },
    corrected,
  };
}

export function playCard(m: LiveMatch, sideId: LiveSideId, key: string): LiveMatch {
  const side = m[sideId];
  const next = cyclePlay(side, key);
  if (!next) return m;
  const event: LiveEvent = {
    id: newId(),
    t: Date.now(),
    clock: formatClock(m),
    side: sideId,
    key,
    cost: costOf(key),
    corrected: next.corrected,
  };
  let out: LiveMatch = {
    ...m,
    [sideId]: next.side,
    events: [event, ...m.events].slice(0, 80),
  };
  return advisePlay(out, event);
}

export function undoLast(m: LiveMatch): LiveMatch {
  const ev = m.events[0];
  if (!ev) return m;
  const side = m[ev.side];
  const order = [...side.order];
  const last = order.pop();
  if (last !== ev.key) return { ...m, events: m.events.slice(1) };
  order.splice(0, 0, last);
  const restored: LiveSide = {
    ...side,
    order,
    elixir: Math.min(MAX_ELIXIR, side.elixir + ev.cost),
    revealed: Math.max(0, side.revealed - 1),
  };
  return { ...m, [ev.side]: restored, events: m.events.slice(1) };
}

export function tick(m: LiveMatch, dtSec: number): LiveMatch {
  if (!m.running) return m;
  const phase = phaseOf(m);
  const rate = elixirRate(phase);
  let remaining = m.remaining - dtSec;
  let overtime = m.overtime;
  let you = { ...m.you, elixir: Math.min(MAX_ELIXIR, m.you.elixir + rate * dtSec) };
  let them = { ...m.them, elixir: Math.min(MAX_ELIXIR, m.them.elixir + rate * dtSec) };
  let out: LiveMatch = { ...m, remaining, overtime, you, them };

  if (!overtime && remaining <= 0) {
    out = { ...out, overtime: true, remaining: OVERTIME_SEC };
    out = pushAdvice(out, "warn", "Overtime. Only commit with +2 or their counter out of cycle.", "Overtime. Bank elixir. Opposite lane if they dump.");
  } else if (!overtime && m.remaining > DOUBLE_AT && remaining <= DOUBLE_AT) {
    out = pushAdvice(out, "call", "Double elixir. Count the tank. Don't leak.", "Double elixir. Count the tank.");
  } else if (overtime && remaining <= 0) {
    out = { ...out, running: false, remaining: 0 };
    out = pushAdvice(out, "info", "Clock's done. Lock in the count from here.", "Clock is done.");
  }

  const lead = elixirLead(out);
  if (out.them.elixir >= 9.85 && m.them.elixir < 9.85) {
    out = pushAdvice(out, "call", "They're full. Expect a dump.", "They're leaking. Expect a dump.");
  }
  if (out.you.elixir >= 9.85 && m.you.elixir < 9.85) {
    out = pushAdvice(out, "warn", "You're full. Spend — don't leak.", "You're leaking. Spend.");
  }
  if (lead >= 3.2 && elixirLead(m) < 3.2) {
    out = pushAdvice(out, "good", `+${lead.toFixed(0)} elixir. Opposite lane pressure.`, `Plus ${Math.floor(lead)}. Opposite lane.`);
  }
  return out;
}

export function startMatch(m: LiveMatch): LiveMatch {
  const mu = matchup(m.you.deck, m.them.deck);
  const youArch = archetypeOf(m.you.deck);
  const themArch = archetypeOf(m.them.deck);
  const note = mu.notes[0]?.label ?? "Play the king tower.";
  let out: LiveMatch = {
    ...m,
    running: true,
    remaining: REGULATION_SEC,
    overtime: false,
    startedAt: Date.now(),
    you: { ...m.you, elixir: START_ELIXIR },
    them: { ...m.them, elixir: START_ELIXIR },
  };
  const themWin = m.them.deck.find((k) => CARDS_BY_KEY[k]?.roles.includes("wincon"));
  const answers = themWin ? (COUNTERS[themWin] ?? []).filter((k) => m.you.deck.includes(k)) : [];
  const hold = themWin && answers[0] ? ` Hold ${nameOf(answers[0])} for ${nameOf(themWin)}.` : "";
  out = pushAdvice(
    out,
    "info",
    `${youArch} vs ${themArch}. ${note}${hold} Tap or say the card as it drops.`,
    `${themArch} on the other side.${hold}`,
  );
  return out;
}

function advisePlay(m: LiveMatch, ev: LiveEvent): LiveMatch {
  const key = ev.key;
  const card = nameOf(key);
  const roles = CARDS_BY_KEY[key]?.roles ?? [];
  if (ev.side === "them") {
    if (roles.includes("wincon")) {
      const answers = (COUNTERS[key] ?? []).filter((k) => m.you.deck.includes(k));
      const best = answers[0];
      const dist = best ? untilHand(m.you, best) : null;
      if (best && dist === 0) {
        return pushAdvice(m, "call", `${card} in. ${nameOf(best)} is in hand — drop it.`, `${card} in. ${nameOf(best)} in hand.`);
      }
      if (best && dist && dist > 0) {
        return pushAdvice(
          m,
          "warn",
          `${card} in. ${nameOf(best)} is ${dist} off. Cheap kite, don't overspend.`,
          `${card} in. ${nameOf(best)} is ${dist} off.`,
        );
      }
      return pushAdvice(m, "call", `${card} in. Kite and take the trade.`, `${card} in. Kite it.`);
    }
    if (roles.includes("small-spell")) {
      const bait = m.you.deck.find((k) => ["goblin-barrel", "princess", "goblin-gang", "skeleton-barrel"].includes(k));
      if (bait) {
        return pushAdvice(m, "good", `${card} spent. ${nameOf(bait)} is free this cycle.`, `${card} spent. ${nameOf(bait)} is free.`);
      }
      return pushAdvice(m, "info", `${card} spent. They are down a small spell.`, `${card} spent.`);
    }
    if (roles.includes("building")) {
      return pushAdvice(m, "call", `${card} down. Hold your wincon one cycle.`, `${card} down. Hold the hog.`);
    }
    if (ev.corrected) {
      return pushAdvice(m, "info", `Cycle corrected — they had ${card}.`, `They had ${card}.`);
    }
    const dist = untilHand(m.them, key);
    if (dist === 4) {
      return pushAdvice(m, "info", `${card} is 4 off. Window to pressure.`, `${card} is four off.`);
    }
    return m;
  }
  const lead = elixirLead(m);
  if (roles.includes("wincon") && m.them.order.slice(0, 4).some((k) => (COUNTERS[key] ?? []).includes(k))) {
    return pushAdvice(m, "warn", `${card} into their counter. Next cycle.`, `${card} into their counter.`);
  }
  if (lead <= -3) {
    return pushAdvice(m, "warn", `${card} down. You're -${Math.abs(Math.floor(lead))}. Defend.`, `Down ${Math.abs(Math.floor(lead))}. Defend.`);
  }
  return m;
}

export type VoiceCommand =
  | { kind: "play"; side: LiveSideId; key: string }
  | { kind: "start" }
  | { kind: "pause" }
  | { kind: "undo" }
  | { kind: "mute" }
  | { kind: "unmute" }
  | { kind: "overtime" }
  | { kind: "unknown"; raw: string };

const ALIAS_LIST: Array<{ phrase: string; key: string }> = (() => {
  const rows: Array<{ phrase: string; key: string }> = [];
  const add = (phrase: string, key: string) => {
    const p = phrase.toLowerCase().trim();
    if (!p) return;
    rows.push({ phrase: p, key });
  };
  for (const c of PLAYABLE) {
    add(c.name, c.key);
    add(c.key.replace(/-/g, " "), c.key);
    add(c.name.replace(/^the /i, ""), c.key);
  }
  for (const [nick, key] of Object.entries(NICKNAMES)) add(nick, key);
  rows.sort((a, b) => b.phrase.length - a.phrase.length);
  return rows;
})();

export function parseVoice(raw: string, you: string[], them: string[]): VoiceCommand {
  const text = raw.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return { kind: "unknown", raw };
  if (/\b(start|begin|go|kick off)\b/.test(text)) return { kind: "start" };
  if (/\b(pause|stop clock|hold clock)\b/.test(text)) return { kind: "pause" };
  if (/\b(undo|back|scratch that)\b/.test(text)) return { kind: "undo" };
  if (/\b(unmute|sound on|talk)\b/.test(text)) return { kind: "unmute" };
  if (/\b(mute|quiet|silence)\b/.test(text)) return { kind: "mute" };
  if (/\b(overtime|ot)\b/.test(text)) return { kind: "overtime" };

  const themFirst = /\b(they|them|their|opponent|opp|enemy)\b/.test(text);
  const youFirst = /\b(i |i'm |my |we |our )\b/.test(text) || text.startsWith("i ");

  const inMatch = new Set([...you, ...them]);
  const hit = ALIAS_LIST.find((a) => {
    if (!inMatch.has(a.key) && !text.includes(a.phrase)) return false;
    const re = new RegExp(`(?:^|\\s)${a.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\s|$)`);
    return re.test(text);
  });
  if (!hit) return { kind: "unknown", raw };

  let side: LiveSideId;
  if (themFirst && !youFirst) side = "them";
  else if (youFirst && !themFirst) side = "you";
  else if (them.includes(hit.key) && !you.includes(hit.key)) side = "them";
  else if (you.includes(hit.key) && !them.includes(hit.key)) side = "you";
  else side = themFirst ? "them" : "them";

  return { kind: "play", side, key: hit.key };
}

export function matchupBrief(you: string[], them: string[]): { score: number; youArch: string; themArch: string; notes: string[] } {
  const mu = matchup(you, them);
  return {
    score: mu.score,
    youArch: archetypeOf(you),
    themArch: archetypeOf(them),
    notes: mu.notes.map((n) => n.label),
  };
}

export function metaChipDecks() {
  return META_DECKS.slice(0, 8);
}

export function heartbeat(m: LiveMatch): LiveMatch {
  if (!m.running) return m;
  const themWin = m.them.deck.find((k) => CARDS_BY_KEY[k]?.roles.includes("wincon"));
  if (!themWin) return m;
  const dist = untilHand(m.them, themWin);
  if (dist === 0) {
    return pushAdvice(m, "warn", `${nameOf(themWin)} is in their hand.`, `${nameOf(themWin)} is in their hand.`);
  }
  if (dist === 1) {
    return pushAdvice(m, "call", `${nameOf(themWin)} next. Have the answer ready.`, `${nameOf(themWin)} is next.`);
  }
  return m;
}
