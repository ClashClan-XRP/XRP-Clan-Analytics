import type { Card } from "./catalog";

export type OwnedCard = {
  key: string;
  level: number;
  evolutionLevel: number;
};

export type PlayerProfile = {
  tag: string;
  name: string;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  wins: number;
  losses: number;
  battleCount: number;
  threeCrownWins: number;
  clan?: { tag: string; name: string };
  arena: string;
  pathTrophies?: number;
  league?: string;
  currentDeck: string[];
  currentEvo: string[];
  currentHero?: string;
  currentChampion?: string;
  towerTroop: string;
  cards: OwnedCard[];
  heroes: string[];
  source: "live" | "demo" | "manual";
  fetchedAt: string;
};

export type ClanMember = {
  tag: string;
  name: string;
  role: "leader" | "coLeader" | "elder" | "member";
  expLevel: number;
  trophies: number;
  donations: number;
  arena: string;
};

export type ClanProfile = {
  tag: string;
  name: string;
  description: string;
  type: string;
  clanScore: number;
  warTrophies: number;
  requiredTrophies: number;
  donationsPerWeek: number;
  members: ClanMember[];
  source: "live" | "demo";
  fetchedAt: string;
};

export type Battle = {
  type: string;
  win: boolean;
  crowns: number;
  opponentCrowns: number;
  opponentName: string;
  opponentTag?: string;
  opponentDeck: string[];
  deck: string[];
  gameMode: string;
  battleTime?: string;
  arena?: string;
};

export type MetaDeck = {
  id: string;
  name: string;
  archetype: "cycle" | "control" | "beatdown" | "siege" | "bait" | "bridge" | "midrange";
  modes: Array<"ladder" | "2v2" | "war">;
  cards: string[];
  evo: string[];
  hero?: string;
  champion?: string;
  elixir: number;
  winRate: number;
  useRate: number;
  sample: number;
  notes: string;
  f2p: boolean;
};

export type DuoPairing = {
  id: string;
  name: string;
  deckA: string;
  deckB: string;
  winRate: number;
  notes: string;
};

export type CardMeta = {
  key: string;
  usage: number;
  winRate: number;
  tier: "S+" | "S" | "A" | "B" | "C" | "D";
  trend: "up" | "down" | "flat";
};

export type Reason = { label: string; tone: "good" | "warn" | "bad" | "neutral" };

export type DeckFit = {
  deck: MetaDeck;
  score: number;
  playable: boolean;
  missing: Card[];
  underleveled: Array<{ card: Card; level: number; target: number }>;
  evoReady: string[];
  evoMissing: string[];
  heroReady: boolean;
  championReady: boolean;
  reasons: Reason[];
};

export type UpgradePick = {
  card: Card;
  from: number;
  to: number;
  gold: number;
  impact: number;
  why: string;
};

export type LookupResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; hint?: string };

export type RiverParticipant = {
  tag: string;
  name: string;
  fame: number;
  repairPoints: number;
  boatAttacks: number;
  decksUsed: number;
  decksUsedToday: number;
};

export type RiverClanStanding = {
  tag: string;
  name: string;
  fame: number;
  repairPoints: number;
  participants: RiverParticipant[];
  finish?: number;
  trophyChange?: number;
};

export type RiverRace = {
  state: string;
  periodType: string;
  periodIndex: number;
  sectionIndex: number;
  clan: RiverClanStanding;
  clans: RiverClanStanding[];
  source: "live" | "demo";
  fetchedAt: string;
};

export type RiverLogEntry = {
  seasonId: number;
  sectionIndex: number;
  createdDate: string;
  standings: Array<{ rank: number; trophyChange: number; clan: RiverClanStanding }>;
};

export type MatchPoint = {
  id: string;
  clock: string;
  elapsed: string;
  phase: "single" | "double" | "overtime";
  title: string;
  observed: string;
  optimal: string;
  deviation: boolean;
  impact: "positive" | "negative";
  impactScore: number;
  impactLabel: string;
};

export type CoachClip = {
  id: string;
  title: string;
  creator: string;
  youtubeId: string;
  start?: number;
  technique: string;
  why: string;
};

export type CoachReport = {
  opponentArchetype: string;
  selfArchetype: string;
  matchupScore: number;
  optimalStrategy: string[];
  points: MatchPoint[];
  overallImpact: number;
  overallLabel: string;
  resultExplained: string;
  coa: string[];
  clips: CoachClip[];
};
