import { PLAYABLE, HEROES } from "./catalog";
import { DEFAULT_CLAN_NAME, DEFAULT_CLAN_TAG, DEFAULT_PLAYER_TAG } from "./defaults";
import type { Battle, ClanProfile, OwnedCard, PlayerProfile } from "./types";

const NOW = "2026-09-10T04:00:00.000Z";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function levelFor(key: string, seed: number, bias = 0): number {
  const r = (hash(key + seed) % 100) / 100;
  let lvl = 12 + Math.floor(r * 4) + bias;
  if (
    [
      "hog-rider",
      "musketeer",
      "cannon",
      "skeletons",
      "ice-spirit",
      "the-log",
      "fireball",
      "ice-golem",
      "knight",
      "zap",
      "valkyrie",
      "arrows",
      "royal-hogs",
      "barbarian-barrel",
    ].includes(key)
  )
    lvl = Math.max(lvl, 14);
  if (["golem", "night-witch", "lava-hound", "sparky"].includes(key)) lvl = Math.min(lvl, 12);
  return Math.max(9, Math.min(16, lvl));
}

export function makeCollection(seed: number, extraEvo: string[] = []): OwnedCard[] {
  const evoSet = new Set([
    "skeletons",
    "knight",
    "firecracker",
    "tesla",
    "cannon",
    "zap",
    "archers",
    "royal-hogs",
    "royal-ghost",
    "ice-wizard",
    "mega-minion",
    "pekka",
    "furnace",
    "hunter",
    "dart-goblin",
    ...extraEvo,
  ]);
  return PLAYABLE.map((c) => ({
    key: c.key,
    level: levelFor(c.key, seed, c.rarity === "common" ? 1 : c.rarity === "champion" ? -1 : 0),
    evolutionLevel: c.evo && evoSet.has(c.key) ? 1 : 0,
  }));
}

export const DEMO_PLAYER_TAG = DEFAULT_PLAYER_TAG;
export const DEMO_PARTNER_TAG = "#8QPUYCCQY";
export const DEMO_CLAN_TAG = DEFAULT_CLAN_TAG;

type MemberSeed = {
  tag: string;
  name: string;
  role: ClanProfile["members"][number]["role"];
  expLevel: number;
  trophies: number;
  donations: number;
  arena: string;
  deck: string[];
  evo: string[];
  extraEvo?: string[];
  champion?: string;
};

const MEMBERS: MemberSeed[] = [
  {
    tag: "#8Q8U9JLJL",
    name: "JusJohnny",
    role: "leader",
    expLevel: 16,
    trophies: 13644,
    donations: 16,
    arena: "Spirit Square",
    deck: ["royal-ghost", "ice-wizard", "royal-hogs", "skeletons", "zap", "barbarian-barrel", "goblin-hut", "lightning"],
    evo: ["royal-ghost", "ice-wizard", "royal-hogs", "skeletons", "zap", "barbarian-barrel"],
  },
  {
    tag: "#2QVYVP92R",
    name: "NILESHLUVSAARTI",
    role: "coLeader",
    expLevel: 16,
    trophies: 11553,
    donations: 0,
    arena: "Summit of Heroes",
    deck: ["mega-minion", "knight", "pekka", "fireball", "ice-spirit", "hog-rider", "zap", "electro-wizard"],
    evo: ["mega-minion", "knight", "pekka", "zap"],
  },
  {
    tag: "#8QPUYCCQY",
    name: "KrisBeeJörk",
    role: "elder",
    expLevel: 16,
    trophies: 11547,
    donations: 8,
    arena: "Summit of Heroes",
    deck: ["knight", "mega-minion", "musketeer", "skeletons", "hog-rider", "electro-spirit", "goblin-barrel", "barbarian-barrel"],
    evo: ["knight", "mega-minion", "musketeer", "skeletons"],
  },
  {
    tag: "#UU8YJGJ8V",
    name: "BigJonkers_$XRP",
    role: "elder",
    expLevel: 15,
    trophies: 10808,
    donations: 8,
    arena: "Royal Road",
    deck: ["furnace", "skeleton-king", "hunter", "dart-goblin", "hog-rider", "arrows", "goblin-gang", "electro-spirit"],
    evo: ["furnace", "hunter", "dart-goblin"],
    champion: "skeleton-king",
  },
  {
    tag: "#VG9PPJ9J",
    name: "Nitin_Agg24",
    role: "member",
    expLevel: 15,
    trophies: 10677,
    donations: 0,
    arena: "Royal Road",
    deck: ["mega-knight", "hog-rider", "firecracker", "skeletons", "bats", "cannon", "zap", "fireball"],
    evo: ["firecracker", "skeletons"],
  },
  {
    tag: "#U9GL8UURL",
    name: "eLJonkers",
    role: "elder",
    expLevel: 15,
    trophies: 10504,
    donations: 8,
    arena: "Royal Road",
    deck: ["royal-giant", "fisherman", "hunter", "monk", "royal-ghost", "skeletons", "electro-spirit", "barbarian-barrel"],
    evo: ["royal-giant", "hunter", "skeletons"],
    champion: "monk",
  },
  {
    tag: "#PLJPQCL9L",
    name: "SoniKronic",
    role: "elder",
    expLevel: 14,
    trophies: 8392,
    donations: 0,
    arena: "Clash Fest",
    deck: ["goblin-barrel", "princess", "goblin-gang", "inferno-tower", "knight", "ice-spirit", "the-log", "rocket"],
    evo: ["knight", "goblin-barrel"],
  },
  {
    tag: "#VRJ08JPU0",
    name: "eLJonks",
    role: "member",
    expLevel: 11,
    trophies: 2026,
    donations: 0,
    arena: "Royal Arena",
    deck: ["hog-rider", "musketeer", "valkyrie", "cannon", "skeletons", "ice-spirit", "arrows", "fireball"],
    evo: ["skeletons", "valkyrie"],
  },
  {
    tag: "#9GUL0890",
    name: "MEB",
    role: "member",
    expLevel: 10,
    trophies: 1300,
    donations: 0,
    arena: "Builder's Workshop",
    deck: ["giant", "witch", "mini-pekka", "musketeer", "fireball", "zap", "skeletons", "cannon"],
    evo: ["skeletons"],
  },
  {
    tag: "#VJYYLJR0C",
    name: "MadDeeJörk",
    role: "member",
    expLevel: 8,
    trophies: 123,
    donations: 0,
    arena: "Goblin Stadium",
    deck: ["knight", "archers", "goblins", "minions", "fireball", "zap", "cannon", "tombstone"],
    evo: [],
  },
];

function profileFrom(m: MemberSeed): PlayerProfile {
  const seed = hash(m.tag);
  return {
    tag: m.tag,
    name: m.name,
    expLevel: m.expLevel,
    trophies: m.trophies,
    bestTrophies: m.trophies + (seed % 220),
    wins: 1200 + (seed % 6000),
    losses: 1100 + (seed % 5000),
    battleCount: 2800 + (seed % 14000),
    threeCrownWins: 200 + (seed % 1800),
    clan: { tag: DEFAULT_CLAN_TAG, name: DEFAULT_CLAN_NAME },
    arena: m.arena,
    pathTrophies: Math.max(0, m.trophies - 9000),
    currentDeck: m.deck.slice(0, 8),
    currentEvo: m.evo,
    currentChampion: m.champion,
    towerTroop: "tower-princess",
    cards: makeCollection(seed, [...m.evo, ...(m.extraEvo ?? [])]),
    heroes: HEROES.filter((_, i) => (seed + i) % 5 === 0)
      .slice(0, 2)
      .map((h) => h.key),
    source: "demo",
    fetchedAt: NOW,
  };
}

export const DEMO_CLAN: ClanProfile = {
  tag: DEFAULT_CLAN_TAG,
  name: DEFAULT_CLAN_NAME,
  description:
    "Crypto = Chaos / Clash = Chill… XRP??? i dont know about the $10,000 prediction but fingers crossed… code: RoyaleAPI",
  type: "open",
  clanScore: 40285,
  warTrophies: 136,
  requiredTrophies: 0,
  donationsPerWeek: 40,
  members: MEMBERS.map((m) => ({
    tag: m.tag,
    name: m.name,
    role: m.role,
    expLevel: m.expLevel,
    trophies: m.trophies,
    donations: m.donations,
    arena: m.arena,
  })),
  source: "demo",
  fetchedAt: NOW,
};

export const DEMO_PROFILES: Record<string, PlayerProfile> = Object.fromEntries(
  MEMBERS.map((m) => [m.tag, profileFrom(m)]),
);

export const DEMO_PLAYER = DEMO_PROFILES[DEMO_PLAYER_TAG]!;
export const DEMO_PARTNER = DEMO_PROFILES[DEMO_PARTNER_TAG]!;

const OPPONENTS = [
  ["Lars", ["goblin-barrel", "princess", "goblin-gang", "inferno-tower", "knight", "ice-spirit", "the-log", "rocket"]],
  ["Nico", ["royal-hogs", "archer-queen", "cannon", "skeletons", "ice-spirit", "the-log", "earthquake", "royal-delivery"]],
  ["Vera", ["mega-knight", "goblin-barrel", "goblin-gang", "spear-goblins", "bats", "inferno-dragon", "fireball", "zap"]],
  ["João", ["golem", "night-witch", "baby-dragon", "mega-minion", "lumberjack", "lightning", "tornado", "barbarian-barrel"]],
  ["Mila", ["x-bow", "tesla", "archers", "knight", "skeletons", "ice-spirit", "the-log", "fireball"]],
  ["KoldfuR1a", ["battle-ram", "pekka", "electro-wizard", "bandit", "royal-ghost", "magic-archer", "fireball", "zap"]],
] as const;

export function syntheticBattles(player: PlayerProfile): Battle[] {
  const seed = hash(player.tag + "battles");
  const out: Battle[] = [];
  for (let i = 0; i < 25; i++) {
    const opp = OPPONENTS[i % OPPONENTS.length]!;
    const duo = i % 5 !== 1;
    const rotate = i % 4 === 3;
    const deck = rotate
      ? [...player.currentDeck.slice(1), player.currentDeck[0] ?? "knight"]
      : player.currentDeck;
    out.push({
      type: duo ? "trail" : "PvP",
      win: ((seed >> (i % 16)) & 1) === (i % 3 === 0 ? 0 : 1),
      crowns: 1 + (i % 3 === 0 ? 1 : 0),
      opponentCrowns: i % 4 === 2 ? 2 : 0,
      opponentName: opp[0],
      opponentDeck: [...opp[1]],
      deck: deck.filter(Boolean).slice(0, 8),
      gameMode: duo ? "TeamVsTeam" : "Ladder",
    });
  }
  return out;
}

export const DEMO_BATTLES = syntheticBattles(DEMO_PLAYER);

export function isDemoTag(tag: string): boolean {
  const t = tag.trim().toUpperCase().replace(/^#/, "");
  return t === "DEMO" || t === "MIZUKI" || t === "8L9R8UL8";
}
