import { CARDS, CARDS_BY_ID, CARDS_BY_NAME, type Card } from "./catalog";
import { DEFAULT_API_TOKEN, DEFAULT_CLAN_TAG, DEFAULT_PLAYER_TAG } from "./defaults";
import {
  DEMO_CLAN,
  DEMO_PLAYER,
  DEMO_PROFILES,
  DEMO_RIVER_LOG,
  DEMO_RIVER_RACE,
  isDemoTag,
  syntheticBattles,
} from "./demo";
import type {
  Battle,
  ClanProfile,
  LookupResult,
  OwnedCard,
  PlayerProfile,
  RiverClanStanding,
  RiverLogEntry,
  RiverParticipant,
  RiverRace,
} from "./types";
import { encodeTag, formatTag } from "../utils";

const PROXY = "https://proxy.royaleapi.dev/v1";

type OfficialCard = {
  name: string;
  id?: number;
  level?: number;
  maxLevel?: number;
  evolutionLevel?: number;
  iconUrls?: { medium?: string };
};

type OfficialPlayer = {
  tag: string;
  name: string;
  expLevel: number;
  kingTowerLevel?: number;
  trophies: number;
  bestTrophies?: number;
  wins?: number;
  losses?: number;
  battleCount?: number;
  threeCrownWins?: number;
  arena?: { name?: string };
  clan?: { tag: string; name: string };
  currentDeck?: OfficialCard[];
  currentFavouriteCard?: OfficialCard;
  cards?: OfficialCard[];
  supportCards?: OfficialCard[];
  currentDeckSupportCards?: OfficialCard[];
  currentPathOfLegendSeasonResult?: { trophies?: number; leagueNumber?: number };
};

type OfficialClan = {
  tag: string;
  name: string;
  description?: string;
  type?: string;
  clanScore?: number;
  clanWarTrophies?: number;
  requiredTrophies?: number;
  donationsPerWeek?: number;
  memberList?: Array<{
    tag: string;
    name: string;
    role: string;
    expLevel: number;
    trophies: number;
    donations?: number;
    arena?: { name?: string };
  }>;
};

type OfficialBattle = {
  type?: string;
  battleTime?: string;
  arena?: { name?: string };
  gameMode?: { name?: string };
  team?: Array<{ tag?: string; name?: string; crowns?: number; cards?: OfficialCard[] }>;
  opponent?: Array<{ tag?: string; name?: string; crowns?: number; cards?: OfficialCard[] }>;
};

type OfficialParticipant = {
  tag?: string;
  name?: string;
  fame?: number;
  repairPoints?: number;
  boatAttacks?: number;
  decksUsed?: number;
  decksUsedToday?: number;
};

type OfficialRiverClan = {
  tag?: string;
  name?: string;
  fame?: number;
  repairPoints?: number;
  clanScore?: number;
  participants?: OfficialParticipant[];
  finish?: number;
  periodPoints?: number;
};

type OfficialRiverRace = {
  state?: string;
  periodType?: string;
  periodIndex?: number;
  sectionIndex?: number;
  clan?: OfficialRiverClan;
  clans?: OfficialRiverClan[];
};

type OfficialRiverLog = {
  items?: Array<{
    seasonId?: number;
    sectionIndex?: number;
    createdDate?: string;
    standings?: Array<{ rank?: number; trophyChange?: number; clan?: OfficialRiverClan }>;
  }>;
};

function slugName(name: string): string {
  return name
    .toLowerCase()
    .replace(/p\.e\.k\.k\.a/g, "pekka")
    .replace(/mini p\.e\.k\.k\.a\.?/g, "mini-pekka")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveCard(c: OfficialCard): Card | undefined {
  if (c.id && CARDS_BY_ID[c.id]) return CARDS_BY_ID[c.id];
  const byName = CARDS_BY_NAME[c.name.toLowerCase()];
  if (byName) return byName;
  return CARDS.find((x) => x.key === slugName(c.name));
}

function mapLevel(level: number | undefined, maxLevel: number | undefined): number {
  const lvl = level ?? 1;
  const max = maxLevel ?? 14;
  if (max >= 14) return Math.min(16, lvl);
  if (max <= 4) return Math.min(16, lvl + 12);
  if (max <= 6) return Math.min(16, lvl + 10);
  if (max <= 8) return Math.min(16, lvl + 8);
  if (max <= 11) return Math.min(16, lvl + 5);
  if (max <= 12) return Math.min(16, lvl + 4);
  return Math.min(16, lvl);
}

function kingFrom(p: OfficialPlayer): number {
  if (p.kingTowerLevel && p.kingTowerLevel > 0) return Math.min(16, p.kingTowerLevel);
  if (p.expLevel > 0 && p.expLevel <= 16) return p.expLevel;
  if (p.trophies >= 9000) return 16;
  if (p.trophies >= 7000) return 15;
  if (p.trophies >= 5000) return 14;
  if (p.trophies >= 3000) return 12;
  if (p.trophies >= 1000) return 10;
  return 8;
}

function kingFromTrophies(trophies: number, expLevel: number): number {
  if (expLevel > 0 && expLevel <= 16) return expLevel;
  if (trophies >= 9000) return 16;
  if (trophies >= 7000) return 15;
  if (trophies >= 5000) return 14;
  if (trophies >= 3000) return 12;
  if (trophies >= 1000) return 10;
  return 8;
}

function mapPlayer(p: OfficialPlayer): PlayerProfile {
  const cards: OwnedCard[] = [];
  const seen = new Set<string>();
  for (const oc of p.cards ?? []) {
    const card = resolveCard(oc);
    if (!card || seen.has(card.key)) continue;
    seen.add(card.key);
    cards.push({
      key: card.key,
      level: mapLevel(oc.level, oc.maxLevel),
      evolutionLevel: oc.evolutionLevel && oc.evolutionLevel > 0 ? 1 : 0,
    });
  }
  const deck = (p.currentDeck ?? [])
    .map(resolveCard)
    .filter((c): c is Card => Boolean(c))
    .map((c) => c.key);
  const evo = (p.currentDeck ?? [])
    .filter((c) => (c.evolutionLevel ?? 0) > 0)
    .map(resolveCard)
    .filter((c): c is Card => Boolean(c))
    .map((c) => c.key);
  const champ = deck.find((k) => CARDS.find((c) => c.key === k)?.rarity === "champion");
  const tower =
    resolveCard((p.currentDeckSupportCards ?? p.supportCards ?? [])[0] ?? { name: "Tower Princess" })?.key ??
    "tower-princess";
  return {
    tag: formatTag(p.tag),
    name: p.name,
    expLevel: kingFrom(p),
    trophies: p.trophies,
    bestTrophies: p.bestTrophies ?? p.trophies,
    wins: p.wins ?? 0,
    losses: p.losses ?? 0,
    battleCount: p.battleCount ?? 0,
    threeCrownWins: p.threeCrownWins ?? 0,
    clan: p.clan ? { tag: formatTag(p.clan.tag), name: p.clan.name } : undefined,
    arena: p.arena?.name ?? "Arena",
    pathTrophies: p.currentPathOfLegendSeasonResult?.trophies,
    currentDeck: deck.slice(0, 8),
    currentEvo: evo,
    currentChampion: champ,
    towerTroop: tower,
    cards,
    heroes: cards.filter((c) => c.key.endsWith("-hero")).map((c) => c.key),
    source: "live",
    fetchedAt: new Date().toISOString(),
  };
}

function mapClan(c: OfficialClan): ClanProfile {
  const role = (r: string): ClanProfile["members"][number]["role"] => {
    if (r === "leader") return "leader";
    if (r === "coLeader") return "coLeader";
    if (r === "elder") return "elder";
    return "member";
  };
  return {
    tag: formatTag(c.tag),
    name: c.name,
    description: c.description ?? "",
    type: c.type ?? "open",
    clanScore: c.clanScore ?? 0,
    warTrophies: c.clanWarTrophies ?? 0,
    requiredTrophies: c.requiredTrophies ?? 0,
    donationsPerWeek: c.donationsPerWeek ?? 0,
    members: (c.memberList ?? []).map((m) => ({
      tag: formatTag(m.tag),
      name: m.name,
      role: role(m.role),
      expLevel: kingFromTrophies(m.trophies, m.expLevel),
      trophies: m.trophies,
      donations: m.donations ?? 0,
      arena: m.arena?.name ?? "",
    })),
    source: "live",
    fetchedAt: new Date().toISOString(),
  };
}

function parseCrTime(raw?: string): string | undefined {
  if (!raw) return undefined;
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!m) return raw;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.000Z`;
}

function mapBattles(raw: OfficialBattle[], playerTag: string): Battle[] {
  const tag = formatTag(playerTag);
  return raw.slice(0, 25).map((b) => {
    const team = b.team ?? [];
    const me = team.find((t) => formatTag(t.tag ?? "") === tag) ?? team[0];
    const opp = b.opponent?.[0];
    const myCrowns = me?.crowns ?? 0;
    const theirCrowns = opp?.crowns ?? 0;
    const mode = b.gameMode?.name ?? b.type ?? "Battle";
    return {
      type: b.type ?? "PvP",
      win: myCrowns > theirCrowns,
      crowns: myCrowns,
      opponentCrowns: theirCrowns,
      opponentName: opp?.name ?? "Opponent",
      opponentTag: opp?.tag ? formatTag(opp.tag) : undefined,
      opponentDeck: (opp?.cards ?? []).map(resolveCard).filter((c): c is Card => Boolean(c)).map((c) => c.key),
      deck: (me?.cards ?? []).map(resolveCard).filter((c): c is Card => Boolean(c)).map((c) => c.key),
      gameMode: mode,
      battleTime: parseCrTime(b.battleTime),
      arena: b.arena?.name,
    };
  });
}

function mapParticipant(p: OfficialParticipant): RiverParticipant {
  return {
    tag: formatTag(p.tag ?? ""),
    name: p.name ?? "Member",
    fame: p.fame ?? 0,
    repairPoints: p.repairPoints ?? 0,
    boatAttacks: p.boatAttacks ?? 0,
    decksUsed: p.decksUsed ?? 0,
    decksUsedToday: p.decksUsedToday ?? 0,
  };
}

function mapRiverClan(c: OfficialRiverClan): RiverClanStanding {
  return {
    tag: formatTag(c.tag ?? ""),
    name: c.name ?? "Clan",
    fame: c.fame ?? c.periodPoints ?? 0,
    repairPoints: c.repairPoints ?? 0,
    participants: (c.participants ?? []).map(mapParticipant),
    finish: c.finish,
  };
}

function mapRiverRace(raw: OfficialRiverRace, fallbackTag: string): RiverRace {
  const clan = raw.clan ? mapRiverClan(raw.clan) : mapRiverClan({ tag: fallbackTag, name: "Clan" });
  const others = (raw.clans ?? []).map(mapRiverClan);
  const clans = others.some((c) => c.tag === clan.tag) ? others : [clan, ...others];
  return {
    state: raw.state ?? "unknown",
    periodType: raw.periodType ?? "warDay",
    periodIndex: raw.periodIndex ?? 0,
    sectionIndex: raw.sectionIndex ?? 0,
    clan,
    clans,
    source: "live",
    fetchedAt: new Date().toISOString(),
  };
}

function mapRiverLog(raw: OfficialRiverLog | OfficialRiverLog["items"]): RiverLogEntry[] {
  const items = Array.isArray(raw) ? raw : (raw?.items ?? []);
  return items.slice(0, 6).map((e) => ({
    seasonId: e.seasonId ?? 0,
    sectionIndex: e.sectionIndex ?? 0,
    createdDate: e.createdDate ?? "",
    standings: (e.standings ?? []).map((s) => ({
      rank: s.rank ?? 0,
      trophyChange: s.trophyChange ?? 0,
      clan: s.clan ? mapRiverClan(s.clan) : { tag: "", name: "Clan", fame: 0, repairPoints: 0, participants: [] },
    })),
  }));
}

async function crFetch(path: string, apiKey: string): Promise<{ ok: true; json: unknown } | { ok: false; status: number; body: string }> {
  const res = await fetch(`${PROXY}${path}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Cache-Control": "no-cache",
    },
  });
  const body = await res.text();
  if (!res.ok) return { ok: false, status: res.status, body };
  try {
    return { ok: true, json: JSON.parse(body) as unknown };
  } catch {
    return { ok: false, status: res.status, body };
  }
}

function token(apiKey?: string): string {
  return apiKey?.trim() || DEFAULT_API_TOKEN;
}

function keyHint(status: number): string {
  if (status === 401 || status === 403) {
    return "Create a key at developer.clashroyale.com and whitelist IP 45.79.218.79 (RoyaleAPI proxy).";
  }
  if (status === 404) return "That tag was not found. Check the # and characters (0, 2, 8, 9, P, Y, L, Q, G, R, J, C, U, V).";
  if (status === 429) return "Official API rate limit — wait a moment and retry.";
  return "Live lookup failed. Snapshot data for CryptoClan-$XRP is still available.";
}

function fallbackPlayer(tag: string): PlayerProfile | undefined {
  const formatted = formatTag(tag);
  if (DEMO_PROFILES[formatted]) return DEMO_PROFILES[formatted];
  if (isDemoTag(formatted)) return DEMO_PLAYER;
  return undefined;
}

async function loadPlayer(tag: string, apiKey: string): Promise<LookupResult<PlayerProfile>> {
  const formatted = formatTag(tag);
  if (!formatted || formatted.length < 4) return { ok: false, error: "Enter a player tag like #8Q8U9JLJL." };
  if (isDemoTag(formatted)) return { ok: true, data: fallbackPlayer(formatted) ?? DEMO_PLAYER };
  const got = await crFetch(`/players/${encodeTag(formatted)}`, apiKey);
  if (!got.ok) {
    const demo = fallbackPlayer(formatted);
    if (demo) return { ok: true, data: demo };
    return { ok: false, error: `Player lookup failed (${got.status}).`, hint: keyHint(got.status) };
  }
  return { ok: true, data: mapPlayer(got.json as OfficialPlayer) };
}

async function loadClan(tag: string, apiKey: string): Promise<LookupResult<ClanProfile>> {
  const formatted = formatTag(tag);
  if (!formatted || formatted.length < 4) return { ok: false, error: "Enter a clan tag." };
  const got = await crFetch(`/clans/${encodeTag(formatted)}`, apiKey);
  if (!got.ok) {
    if (formatted === DEFAULT_CLAN_TAG || formatted === DEMO_CLAN.tag) {
      return { ok: true, data: DEMO_CLAN };
    }
    return { ok: false, error: `Clan lookup failed (${got.status}).`, hint: keyHint(got.status) };
  }
  return { ok: true, data: mapClan(got.json as OfficialClan) };
}

async function loadBattles(tag: string, apiKey: string): Promise<LookupResult<Battle[]>> {
  const formatted = formatTag(tag);
  if (isDemoTag(formatted)) return { ok: true, data: syntheticBattles(fallbackPlayer(formatted) ?? DEMO_PLAYER) };
  const got = await crFetch(`/players/${encodeTag(formatted)}/battlelog`, apiKey);
  if (!got.ok) {
    const demo = fallbackPlayer(formatted);
    return { ok: true, data: demo ? syntheticBattles(demo) : [] };
  }
  return { ok: true, data: mapBattles(got.json as OfficialBattle[], formatted) };
}

export async function lookupPlayer(input: {
  data: { tag: string; apiKey?: string };
}): Promise<LookupResult<PlayerProfile>> {
  return loadPlayer(input.data.tag, token(input.data.apiKey));
}

export async function lookupClan(input: {
  data: { tag: string; apiKey?: string };
}): Promise<LookupResult<ClanProfile>> {
  return loadClan(input.data.tag, token(input.data.apiKey));
}

export async function lookupBattles(input: {
  data: { tag: string; apiKey?: string };
}): Promise<LookupResult<Battle[]>> {
  return loadBattles(input.data.tag, token(input.data.apiKey));
}

export async function lookupPairIntel(input: {
  data: { tagA: string; tagB: string; apiKey?: string };
}): Promise<
  LookupResult<{ playerA: PlayerProfile; playerB: PlayerProfile; battlesA: Battle[]; battlesB: Battle[] }>
> {
  const key = token(input.data.apiKey);
  const [playerA, playerB, battlesA, battlesB] = await Promise.all([
    loadPlayer(input.data.tagA, key),
    loadPlayer(input.data.tagB, key),
    loadBattles(input.data.tagA, key),
    loadBattles(input.data.tagB, key),
  ]);
  if (!playerA.ok) return playerA;
  if (!playerB.ok) return playerB;
  return {
    ok: true,
    data: {
      playerA: playerA.data,
      playerB: playerB.data,
      battlesA: battlesA.ok ? battlesA.data : [],
      battlesB: battlesB.ok ? battlesB.data : [],
    },
  };
}

export async function bootstrapDefaults(input: {
  data: { apiKey?: string; playerTag?: string };
}): Promise<LookupResult<{ clan: ClanProfile; player: PlayerProfile }>> {
  const key = token(input.data.apiKey);
  const clan = await loadClan(DEFAULT_CLAN_TAG, key);
  const preferred = input.data.playerTag?.trim() || DEFAULT_PLAYER_TAG;
  if (!clan.ok) {
    const player = await loadPlayer(preferred, key);
    return {
      ok: true,
      data: {
        clan: DEMO_CLAN,
        player: player.ok ? player.data : (fallbackPlayer(preferred) ?? DEMO_PLAYER),
      },
    };
  }
  const player = await loadPlayer(preferred, key);
  if (player.ok) return { ok: true, data: { clan: clan.data, player: player.data } };
  const pick = clan.data.members[0];
  if (!pick) return { ok: true, data: { clan: clan.data, player: DEMO_PLAYER } };
  const fallback = await loadPlayer(pick.tag, key);
  return {
    ok: true,
    data: {
      clan: clan.data,
      player: fallback.ok ? fallback.data : (fallbackPlayer(pick.tag) ?? DEMO_PLAYER),
    },
  };
}

export async function lookupRiverRace(input: {
  data: { tag: string; apiKey?: string };
}): Promise<LookupResult<RiverRace>> {
  const key = token(input.data.apiKey);
  const formatted = formatTag(input.data.tag);
  if (!formatted || formatted.length < 4) return { ok: false, error: "Enter a clan tag." };
  const got = await crFetch(`/clans/${encodeTag(formatted)}/currentriverrace`, key);
  if (!got.ok) {
    if (formatted === DEFAULT_CLAN_TAG || formatted === DEMO_CLAN.tag) {
      return { ok: true, data: { ...DEMO_RIVER_RACE, fetchedAt: new Date().toISOString() } };
    }
    return { ok: false, error: `River race lookup failed (${got.status}).`, hint: keyHint(got.status) };
  }
  return { ok: true, data: mapRiverRace(got.json as OfficialRiverRace, formatted) };
}

export async function lookupRiverLog(input: {
  data: { tag: string; apiKey?: string };
}): Promise<LookupResult<RiverLogEntry[]>> {
  const key = token(input.data.apiKey);
  const formatted = formatTag(input.data.tag);
  if (!formatted || formatted.length < 4) return { ok: false, error: "Enter a clan tag." };
  const got = await crFetch(`/clans/${encodeTag(formatted)}/riverracelog?limit=5`, key);
  if (!got.ok) {
    if (formatted === DEFAULT_CLAN_TAG || formatted === DEMO_CLAN.tag) {
      return { ok: true, data: DEMO_RIVER_LOG };
    }
    return { ok: true, data: [] };
  }
  return { ok: true, data: mapRiverLog(got.json as OfficialRiverLog) };
}

export async function askCoach(_input: {
  data: { prompt: string };
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  return {
    ok: false,
    error: "Open Coach and pick a replay. Analysis runs from the battle log on this device.",
  };
}
