import { fitDeck } from "./analysis";
import { CARDS_BY_KEY } from "./catalog";
import { META_DECKS } from "./meta";
import { favoriteCards } from "./pairings";
import type {
  Battle,
  ClanProfile,
  DeckFit,
  PlayerProfile,
  Reason,
  RiverLogEntry,
  RiverParticipant,
  RiverRace,
} from "./types";
import { formatTag } from "../utils";

export type WarDeckPick = DeckFit & {
  warScore: number;
  usageNote: string;
};

export type WarAdvice = {
  title: string;
  tone: Reason["tone"];
  detail: string;
};

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
      detail: "Those members should switch to a war list they actually own at king level — open War on their row for four fitted decks.",
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
    detail: `${elders.map((e) => e.name).join(", ") || "Leaders"}: assign war decks before reset, pair a cycle player with a beatdown player on duels, and keep king-15+ on Colosseum boats.`,
  });

  return advice.slice(0, 6);
}

export function recommendWarDecks(player: PlayerProfile, battles: Battle[]): WarDeckPick[] {
  const favs = favoriteCards(battles, 16, player.currentDeck);
  const freq = new Map(favs.map((f) => [f.key, f.count / Math.max(1, f.of)]));
  const picks: WarDeckPick[] = META_DECKS.map((d) => {
    const fit = fitDeck(d, player);
    let bonus = 0;
    if (d.modes.includes("war")) bonus += 7;
    let used = 0;
    let ownedUsed = 0;
    for (const k of d.cards) {
      const f = freq.get(k) ?? 0;
      bonus += f * 10;
      used += f;
      if (player.cards.some((c) => c.key === k)) ownedUsed += f;
    }
    const usageNote =
      used > 1.2
        ? `Heavy in the last 25 (${favs
            .filter((f) => d.cards.includes(f.key))
            .slice(0, 3)
            .map((f) => CARDS_BY_KEY[f.key]?.name ?? f.key)
            .join(", ")})`
        : d.modes.includes("war")
          ? "War-tagged list · collection fit"
          : ownedUsed > 0
            ? "Cards you already cycle on ladder"
            : "Meta war option — train it this week";
    const warScore = Math.max(0, Math.min(99, Math.round(fit.score + bonus)));
    return { ...fit, warScore, usageNote };
  });
  picks.sort((a, b) => b.warScore - a.warScore || b.score - a.score);
  const chosen: WarDeckPick[] = [];
  const usedIds = new Set<string>();
  const usedArch = new Map<string, number>();
  for (const p of picks) {
    if (chosen.length >= 4) break;
    if (usedIds.has(p.deck.id)) continue;
    const archN = usedArch.get(p.deck.archetype) ?? 0;
    if (archN >= 2) continue;
    chosen.push(p);
    usedIds.add(p.deck.id);
    usedArch.set(p.deck.archetype, archN + 1);
  }
  return chosen.length ? chosen : picks.slice(0, 4);
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
