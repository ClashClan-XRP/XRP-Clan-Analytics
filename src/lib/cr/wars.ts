import { avgElixir, fitDeck, ownedMap } from "./analysis";
import { CARDS_BY_KEY, type Role } from "./catalog";
import { targetLevel } from "./economy";
import { CARD_META, META_DECKS, cardMeta } from "./meta";
import { favoriteCards } from "./pairings";
import type {
  Battle,
  ClanProfile,
  DeckFit,
  MetaDeck,
  OwnedCard,
  PlayerProfile,
  Reason,
  RiverLogEntry,
  RiverParticipant,
  RiverRace,
} from "./types";
import { formatTag } from "../utils";

export type WarSub = { from: string; to: string; why: string };

export type WarDeckPick = DeckFit & {
  warScore: number;
  usageNote: string;
  substitutions: WarSub[];
};

export type WarAdvice = {
  title: string;
  tone: Reason["tone"];
  detail: string;
};

const HOT_ANSWERS: Record<string, string[]> = {
  "hog-rider": ["cannon", "tesla", "earthquake", "tombstone", "mini-pekka"],
  "royal-hogs": ["earthquake", "royal-delivery", "valkyrie", "barbarian-barrel"],
  "goblin-barrel": ["the-log", "royal-delivery", "barbarian-barrel", "arrows"],
  balloon: ["tesla", "inferno-tower", "musketeer", "mega-minion"],
  "mega-knight": ["pekka", "mini-pekka", "inferno-tower", "fisherman"],
  miner: ["valkyrie", "knight", "skeletons", "guards"],
  "x-bow": ["royal-giant", "hog-rider", "earthquake", "royal-hogs"],
  "battle-ram": ["pekka", "cannon", "tesla", "knight"],
  golem: ["inferno-tower", "pekka", "mini-pekka"],
};

const ROLE_NEED: Role[] = [
  "wincon",
  "small-spell",
  "big-spell",
  "building",
  "air",
  "mini-tank",
  "splash",
  "cycle",
];

export function periodLabel(periodType: string, periodIndex: number): string {
  const t = periodType.toLowerCase();
  if (t.includes("train")) return "Training day";
  if (t.includes("colo")) return "Colosseum";
  if (t.includes("war")) return `War day ${((periodIndex % 4) + 1) || 1}`;
  if (t.includes("collection")) return "Collection day";
  return periodType || "River race";
}

export function raceRank(race: RiverRace): number {
  const ordered = [...race.clans].sort((a, b) => b.fame - a.fame);
  const idx = ordered.findIndex((c) => formatTag(c.tag) === formatTag(race.clan.tag));
  return idx >= 0 ? idx + 1 : 0;
}

export function unusedToday(race: RiverRace): RiverParticipant[] {
  return [...race.clan.participants].filter((p) => (p.decksUsedToday ?? 0) === 0).sort((a, b) => b.fame - a.fame);
}

export function warAdvice(clan: ClanProfile, race: RiverRace): WarAdvice[] {
  const advice: WarAdvice[] = [];
  const rank = raceRank(race);
  const period = periodLabel(race.periodType, race.periodIndex);
  const unused = unusedToday(race);
  const decksToday = race.clan.participants.reduce((s, p) => s + (p.decksUsedToday ?? 0), 0);
  const cap = race.clan.participants.length * 4;
  const lowFame = [...race.clan.participants].filter((p) => p.fame < 800 && (p.decksUsed ?? 0) > 0);
  const ghosts = clan.members.filter((m) => !race.clan.participants.some((p) => formatTag(p.tag) === formatTag(m.tag)));

  if (rank === 1) {
    advice.push({
      title: `Holding 1st · ${period}`,
      tone: "good",
      detail: `${race.clan.fame.toLocaleString()} fame. Keep finishing unused decks so the boat does not get caught overnight.`,
    });
  } else if (rank > 0) {
    const leader = [...race.clans].sort((a, b) => b.fame - a.fame)[0];
    const gap = (leader?.fame ?? 0) - race.clan.fame;
    advice.push({
      title: `P${rank} · ${gap.toLocaleString()} fame behind ${leader?.name ?? "lead"}`,
      tone: rank <= 2 ? "warn" : "bad",
      detail: `Bank fame now. ${unused.length} members still have attacks today. Do not donate war decks to trophy pushing.`,
    });
  }

  if (unused.length) {
    advice.push({
      title: `${unused.length} unused attack${unused.length === 1 ? "" : "s"} today`,
      tone: unused.length >= 5 ? "bad" : "warn",
      detail: `Ping ${unused
        .slice(0, 4)
        .map((p) => p.name)
        .join(", ")}${unused.length > 4 ? ` +${unused.length - 4}` : ""}. Four war decks each, every war day.`,
    });
  } else {
    advice.push({
      title: "Attacks in",
      tone: "good",
      detail: `All tracked participants used at least one deck today (${decksToday}/${cap || decksToday} decks).`,
    });
  }

  if (lowFame.length >= 3) {
    advice.push({
      title: `${lowFame.length} low-fame attackers`,
      tone: "warn",
      detail: "Those members should switch to a war list they actually own at king level — open War on their row for four exclusive decks.",
    });
  }

  if (ghosts.length) {
    advice.push({
      title: `${ghosts.length} rostered, not in the race`,
      tone: "neutral",
      detail: "New joins or inactive tags. Kick or sit them before the next training day so a fighting account takes the slot.",
    });
  }

  const elders = clan.members.filter((m) => m.role === "leader" || m.role === "coLeader");
  advice.push({
    title: "Leadership pass",
    tone: "neutral",
    detail: `${elders.map((e) => e.name).join(", ") || "Leaders"}: assign the four exclusive war eights before reset. Cards never repeat across those lists.`,
  });

  return advice.slice(0, 6);
}

function playableKey(key: string): boolean {
  const c = CARDS_BY_KEY[key];
  return Boolean(c && c.type !== "tower" && !c.hero);
}

function nameOf(key: string): string {
  return CARDS_BY_KEY[key]?.name ?? key;
}

function hotKeys(): string[] {
  return Object.values(CARD_META)
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 8)
    .map((c) => c.key);
}

function answersHot(cards: string[]): number {
  const set = new Set(cards);
  let n = 0;
  for (const hot of hotKeys()) {
    const answers = HOT_ANSWERS[hot] ?? [];
    if (answers.some((k) => set.has(k))) n += 1;
  }
  return n;
}

function strength(
  key: string,
  owned: Map<string, OwnedCard>,
  freq: Map<string, number>,
  king: number,
): number {
  const have = owned.get(key);
  const meta = cardMeta(key);
  const card = CARDS_BY_KEY[key];
  if (!card) return -99;
  let s = (freq.get(key) ?? 0) * 36 + meta.usage * 0.5 + (meta.winRate - 50) * 1.4;
  if (!have) return s - 55;
  s += have.level * 2.2;
  const gap = targetLevel(king) - have.level;
  if (gap >= 2) s -= gap * 6;
  else if (gap > 0) s -= gap * 2;
  if (have.evolutionLevel >= 1) s += 9;
  return s;
}

function substitute(
  needed: string,
  player: PlayerProfile,
  owned: Map<string, OwnedCard>,
  freq: Map<string, number>,
  blocked: Set<string>,
  preferEvo: boolean,
): { key: string; why: string } | null {
  const card = CARDS_BY_KEY[needed];
  if (!card) return null;
  const king = player.expLevel;
  const roles = new Set(card.roles);
  let best: { key: string; score: number; why: string } | null = null;
  for (const have of player.cards) {
    if (!playableKey(have.key) || blocked.has(have.key) || have.key === needed) continue;
    const cand = CARDS_BY_KEY[have.key];
    if (!cand) continue;
    const overlap = cand.roles.filter((r) => roles.has(r)).length;
    if (!overlap && cand.type !== card.type) continue;
    let score = strength(have.key, owned, freq, king) + overlap * 8;
    if (preferEvo && cand.evo && have.evolutionLevel >= 1) score += 14;
    if (card.rarity === "champion" && cand.rarity === "champion") score += 12;
    if (cand.type === card.type) score += 4;
    const whyParts: string[] = [];
    if (overlap) whyParts.push(cand.roles.find((r) => roles.has(r)) ?? "same job");
    if (preferEvo && cand.evo && have.evolutionLevel >= 1) whyParts.push("evo ready");
    if (have.level >= targetLevel(king) - 1) whyParts.push(`lvl ${have.level}`);
    const why = whyParts.join(" · ") || "collection fit";
    if (!best || score > best.score) best = { key: have.key, score, why };
  }
  if (!best) return null;
  return { key: best.key, why: best.why };
}

function shouldReplace(
  key: string,
  deck: MetaDeck,
  owned: Map<string, OwnedCard>,
  king: number,
  blocked: Set<string>,
): { replace: boolean; optional: boolean; why: string } {
  if (blocked.has(key)) return { replace: true, optional: false, why: "already used in another war deck" };
  const have = owned.get(key);
  if (!have) {
    if (deck.champion === key) return { replace: true, optional: false, why: "champion not unlocked" };
    return { replace: true, optional: false, why: "not in collection" };
  }
  const gap = targetLevel(king) - have.level;
  if (gap >= 2) return { replace: false, optional: true, why: `underleveled (${have.level} vs king ${king})` };
  if (deck.evo.includes(key) && have.evolutionLevel < 1) {
    return { replace: false, optional: true, why: "evo not crafted" };
  }
  return { replace: false, optional: false, why: "" };
}

function adaptDeck(
  deck: MetaDeck,
  player: PlayerProfile,
  owned: Map<string, OwnedCard>,
  freq: Map<string, number>,
  blocked: Set<string>,
): { cards: string[]; evo: string[]; champion?: string; subs: WarSub[] } | null {
  const king = player.expLevel;
  const cards: string[] = [];
  const subs: WarSub[] = [];
  const local = new Set(blocked);
  for (const key of deck.cards) {
    const check = shouldReplace(key, deck, owned, king, local);
    const wantEvo = deck.evo.includes(key);
    const have = owned.get(key);
    let chosen = key;
    const primary = CARDS_BY_KEY[key]?.roles[0];
    if (check.replace) {
      const sub = substitute(key, player, owned, freq, local, wantEvo);
      if (!sub) return null;
      chosen = sub.key;
      subs.push({ from: key, to: sub.key, why: `${check.why} · ${sub.why}` });
    } else if (check.optional) {
      const sub = substitute(key, player, owned, freq, local, wantEvo);
      const subCard = sub ? CARDS_BY_KEY[sub.key] : undefined;
      const subHave = sub ? owned.get(sub.key) : undefined;
      const sameJob = Boolean(primary && subCard?.roles.includes(primary));
      const better =
        subHave && have && (subHave.level > have.level + 1 || (wantEvo && subHave.evolutionLevel >= 1 && have.evolutionLevel < 1));
      if (sub && sameJob && better) {
        chosen = sub.key;
        subs.push({ from: key, to: sub.key, why: `${check.why} · ${sub.why}` });
      }
    }
    if (local.has(chosen) || cards.includes(chosen)) {
      const again = substitute(chosen, player, owned, freq, local, wantEvo);
      if (!again || cards.includes(again.key) || local.has(again.key)) return null;
      if (again.key !== key) subs.push({ from: key, to: again.key, why: again.why });
      chosen = again.key;
    }
    cards.push(chosen);
    local.add(chosen);
  }
  if (cards.length !== 8 || new Set(cards).size !== 8) return null;
  const evo = cards.filter((k) => {
    const have = owned.get(k);
    return Boolean(CARDS_BY_KEY[k]?.evo && have && have.evolutionLevel >= 1);
  });
  const champion = cards.find((k) => CARDS_BY_KEY[k]?.rarity === "champion");
  return { cards, evo, champion, subs };
}

function pickForRole(
  role: Role,
  player: PlayerProfile,
  owned: Map<string, OwnedCard>,
  freq: Map<string, number>,
  blocked: Set<string>,
): string | null {
  let best: { key: string; score: number } | null = null;
  for (const have of player.cards) {
    if (!playableKey(have.key) || blocked.has(have.key)) continue;
    const card = CARDS_BY_KEY[have.key];
    if (!card?.roles.includes(role)) continue;
    const score = strength(have.key, owned, freq, player.expLevel);
    if (!best || score > best.score) best = { key: have.key, score };
  }
  return best?.key ?? null;
}

function buildFromPool(
  player: PlayerProfile,
  owned: Map<string, OwnedCard>,
  freq: Map<string, number>,
  blocked: Set<string>,
  index: number,
): { cards: string[]; evo: string[]; champion?: string; name: string; archetype: MetaDeck["archetype"] } | null {
  const cards: string[] = [];
  const local = new Set(blocked);
  for (const role of ROLE_NEED) {
    if (cards.length >= 8) break;
    const key = pickForRole(role, player, owned, freq, local);
    if (!key) continue;
    cards.push(key);
    local.add(key);
  }
  const leftovers = player.cards
    .filter((c) => playableKey(c.key) && !local.has(c.key))
    .map((c) => ({ key: c.key, score: strength(c.key, owned, freq, player.expLevel) }))
    .sort((a, b) => b.score - a.score);
  for (const row of leftovers) {
    if (cards.length >= 8) break;
    cards.push(row.key);
    local.add(row.key);
  }
  if (cards.length < 8) return null;
  const eight = cards.slice(0, 8);
  const evo = eight.filter((k) => {
    const have = owned.get(k);
    return Boolean(CARDS_BY_KEY[k]?.evo && have && have.evolutionLevel >= 1);
  });
  const champion = eight.find((k) => CARDS_BY_KEY[k]?.rarity === "champion");
  const elixir = avgElixir(eight);
  const archetype: MetaDeck["archetype"] =
    elixir <= 3.1 ? "cycle" : elixir >= 4.1 ? "beatdown" : eight.some((k) => CARDS_BY_KEY[k]?.roles.includes("wincon") && (k.includes("barrel") || k.includes("bait"))) ? "bait" : "midrange";
  return { cards: eight, evo, champion, name: `War list ${index + 1}`, archetype };
}

function toPick(
  deck: MetaDeck,
  player: PlayerProfile,
  freq: Map<string, number>,
  subs: WarSub[],
): WarDeckPick {
  const fit = fitDeck(deck, player);
  let bonus = 0;
  if (deck.modes.includes("war")) bonus += 6;
  const usedFavs: string[] = [];
  for (const k of deck.cards) {
    const f = freq.get(k) ?? 0;
    bonus += f * 9;
    if (f > 0.15) usedFavs.push(nameOf(k));
  }
  bonus += answersHot(deck.cards) * 3;
  bonus -= subs.length * 2;
  const usageNote =
    usedFavs.length > 0
      ? `Last-25 favorites: ${usedFavs.slice(0, 3).join(", ")}`
      : deck.modes.includes("war")
        ? "War-tagged core, fitted to this collection"
        : "Built to cover this week's meta holes";
  const extra: Reason[] = subs.slice(0, 4).map((s) => ({
    label: `${nameOf(s.from)} → ${nameOf(s.to)} (${s.why})`,
    tone: "warn" as const,
  }));
  return {
    ...fit,
    reasons: [...fit.reasons, ...extra],
    warScore: Math.max(0, Math.min(99, Math.round(fit.score + bonus))),
    usageNote,
    substitutions: subs,
  };
}

/** Four war decks, exclusive eights (cards never repeat). Substitutes missing / used / optional low-level pieces. */
export function recommendWarDecks(player: PlayerProfile, battles: Battle[]): WarDeckPick[] {
  const owned = ownedMap(player);
  const favs = favoriteCards(battles, 16, player.currentDeck);
  const freq = new Map(favs.map((f) => [f.key, f.count / Math.max(1, f.of)]));
  const ranked = [...META_DECKS].sort((a, b) => {
    const sa = fitDeck(a, player).score + (a.modes.includes("war") ? 8 : 0);
    const sb = fitDeck(b, player).score + (b.modes.includes("war") ? 8 : 0);
    return sb - sa;
  });

  const blocked = new Set<string>();
  const chosen: WarDeckPick[] = [];
  const usedArch = new Map<string, number>();

  for (const meta of ranked) {
    if (chosen.length >= 4) break;
    const archN = usedArch.get(meta.archetype) ?? 0;
    if (archN >= 2 && chosen.length < 3) continue;
    const adapted = adaptDeck(meta, player, owned, freq, blocked);
    if (!adapted) continue;
    if (adapted.subs.length > 5 && chosen.length === 0) {
      // still take a heavily fitted first list if it is the only playable option
    } else if (adapted.subs.length > 5) continue;
    const deck: MetaDeck = {
      ...meta,
      id: `${meta.id}-war${chosen.length + 1}`,
      name: adapted.subs.length ? `${meta.name} (fitted)` : meta.name,
      cards: adapted.cards,
      evo: adapted.evo,
      champion: adapted.champion,
      elixir: avgElixir(adapted.cards),
      notes: adapted.subs.length
        ? `Fitted off ${meta.name}. ${adapted.subs.map((s) => `${nameOf(s.from)}→${nameOf(s.to)}`).join("; ")}.`
        : meta.notes,
    };
    const pick = toPick(deck, player, freq, adapted.subs);
    chosen.push(pick);
    adapted.cards.forEach((k) => blocked.add(k));
    usedArch.set(meta.archetype, archN + 1);
  }

  while (chosen.length < 4) {
    const built = buildFromPool(player, owned, freq, blocked, chosen.length);
    if (!built) break;
    const deck: MetaDeck = {
      id: `custom-war-${chosen.length + 1}`,
      name: built.name,
      archetype: built.archetype,
      modes: ["war"],
      cards: built.cards,
      evo: built.evo,
      champion: built.champion,
      elixir: avgElixir(built.cards),
      winRate: 51,
      useRate: 0,
      sample: 0,
      notes: "Assembled from leftover collection to keep exclusive eights and cover current meta answers.",
      f2p: built.cards.every((k) => {
        const r = CARDS_BY_KEY[k]?.rarity;
        return r === "common" || r === "rare" || r === "epic";
      }),
    };
    chosen.push(toPick(deck, player, freq, []));
    built.cards.forEach((k) => blocked.add(k));
  }

  return chosen.slice(0, 4);
}

export function uniqueWarCards(picks: WarDeckPick[]): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const p of picks) {
    for (const k of p.deck.cards) {
      if (seen.has(k)) continue;
      seen.add(k);
      keys.push(k);
    }
  }
  return keys;
}

export function memberRaceLine(race: RiverRace | null, tag: string): RiverParticipant | undefined {
  if (!race) return undefined;
  const t = formatTag(tag);
  return race.clan.participants.find((p) => formatTag(p.tag) === t);
}

export function lastRaceFinish(log: RiverLogEntry[], clanTag: string): { rank: number; trophyChange: number } | null {
  const last = log[0];
  if (!last) return null;
  const t = formatTag(clanTag);
  const row = last.standings.find((s) => formatTag(s.clan.tag) === t);
  if (!row) return null;
  return { rank: row.rank, trophyChange: row.trophyChange };
}
