import { CARDS_BY_KEY, type Card } from "./catalog";
import { goldToNext, MAX_LEVEL, targetLevel } from "./economy";
import { CARD_META, cardMeta, DUOS, META_DECKS } from "./meta";
import type {
  DeckFit,
  DuoPairing,
  MetaDeck,
  OwnedCard,
  PlayerProfile,
  Reason,
  UpgradePick,
} from "./types";

export function avgElixir(keys: string[]): number {
  const playable = keys.map((k) => CARDS_BY_KEY[k]).filter(Boolean);
  if (!playable.length) return 0;
  return playable.reduce((s, c) => s + c.elixir, 0) / playable.length;
}

export function ownedMap(player: PlayerProfile): Map<string, OwnedCard> {
  return new Map(player.cards.map((c) => [c.key, c]));
}

function hasRole(keys: string[], role: Card["roles"][number]): boolean {
  return keys.some((k) => CARDS_BY_KEY[k]?.roles.includes(role));
}

export function coverage(keys: string[]): Reason[] {
  const reasons: Reason[] = [];
  const check = (ok: boolean, good: string, bad: string) =>
    reasons.push({ label: ok ? good : bad, tone: ok ? "good" : "warn" });
  check(hasRole(keys, "wincon"), "Win condition locked in", "No clear win condition");
  check(hasRole(keys, "small-spell"), "Small spell for swarms", "Missing a small spell");
  check(hasRole(keys, "big-spell"), "Big spell for tanks / buildings", "No big spell");
  check(hasRole(keys, "air"), "Air answers on the list", "Thin air defense");
  check(hasRole(keys, "building") || hasRole(keys, "mini-tank"), "Building or mini-tank to kite", "No kite building");
  const elixir = avgElixir(keys);
  if (elixir <= 3.2) reasons.push({ label: `Fast cycle · ${elixir.toFixed(1)} elixir`, tone: "good" });
  else if (elixir >= 4.1) reasons.push({ label: `Heavy beatdown · ${elixir.toFixed(1)} elixir`, tone: "neutral" });
  return reasons;
}

export function fitDeck(deck: MetaDeck, player: PlayerProfile): DeckFit {
  const owned = ownedMap(player);
  const kingTarget = targetLevel(player.expLevel);
  const missing: Card[] = [];
  const underleveled: DeckFit["underleveled"] = [];
  let levelGap = 0;

  for (const key of deck.cards) {
    const card = CARDS_BY_KEY[key];
    if (!card) continue;
    const have = owned.get(key);
    if (!have) {
      missing.push(card);
      continue;
    }
    const target = Math.min(MAX_LEVEL, kingTarget);
    if (have.level + 1 < target) {
      underleveled.push({ card, level: have.level, target });
      levelGap += target - have.level;
    }
  }

  const evoReady = deck.evo.filter((k) => (owned.get(k)?.evolutionLevel ?? 0) >= 1);
  const evoMissing = deck.evo.filter((k) => (owned.get(k)?.evolutionLevel ?? 0) < 1);
  const heroReady = !deck.hero || player.heroes.includes(deck.hero);
  const championReady = !deck.champion || owned.has(deck.champion);

  let score = 55 + (deck.winRate - 50) * 3 + Math.min(8, deck.useRate);
  score -= missing.length * 18;
  score -= levelGap * 2.4;
  score -= evoMissing.length * 6;
  if (!heroReady) score -= 10;
  if (!championReady) score -= 16;
  if (deck.f2p) score += 3;
  score = Math.max(0, Math.min(99, Math.round(score)));

  const reasons: Reason[] = [];
  if (missing.length === 0) reasons.push({ label: "Every card is unlocked", tone: "good" });
  else reasons.push({ label: `Missing ${missing.map((c) => c.name).join(", ")}`, tone: "bad" });
  if (underleveled.length === 0 && missing.length === 0)
    reasons.push({ label: "Levels keep up with king tower", tone: "good" });
  else if (underleveled.length)
    reasons.push({
      label: `${underleveled.length} card${underleveled.length > 1 ? "s" : ""} below even (${underleveled
        .slice(0, 3)
        .map((u) => u.card.name)
        .join(", ")})`,
      tone: "warn",
    });
  if (deck.evo.length) {
    if (evoReady.length)
      reasons.push({ label: `Evo ready: ${evoReady.map((k) => CARDS_BY_KEY[k]?.name ?? k).join(", ")}`, tone: "good" });
    if (evoMissing.length)
      reasons.push({
        label: `Evo not crafted: ${evoMissing.map((k) => CARDS_BY_KEY[k]?.name ?? k).join(", ")}`,
        tone: "warn",
      });
  }
  if (deck.hero) {
    reasons.push({
      label: heroReady ? `Hero slot: ${CARDS_BY_KEY[deck.hero]?.name}` : `Needs ${CARDS_BY_KEY[deck.hero]?.name ?? "hero"}`,
      tone: heroReady ? "good" : "warn",
    });
  }
  if (deck.champion) {
    reasons.push({
      label: championReady
        ? `Champion: ${CARDS_BY_KEY[deck.champion]?.name}`
        : `Needs ${CARDS_BY_KEY[deck.champion]?.name ?? "champion"}`,
      tone: championReady ? "good" : "bad",
    });
  }
  reasons.push({
    label: `${deck.winRate.toFixed(1)}% win · ${deck.useRate.toFixed(1)}% of ladder`,
    tone: "neutral",
  });

  return {
    deck,
    score,
    playable: missing.length === 0 && championReady,
    missing,
    underleveled,
    evoReady,
    evoMissing,
    heroReady,
    championReady,
    reasons,
  };
}

export function recommendLadder(player: PlayerProfile, mode: MetaDeck["modes"][number] = "ladder"): DeckFit[] {
  return META_DECKS.filter((d) => d.modes.includes(mode))
    .map((d) => fitDeck(d, player))
    .sort((a, b) => b.score - a.score);
}

export function recommendDuos(
  a: PlayerProfile,
  b: PlayerProfile,
): Array<{ pair: DuoPairing; score: number; fitA: DeckFit; fitB: DeckFit; swapped: boolean; reasons: Reason[] }> {
  const out = [];
  for (const pair of DUOS) {
    const deckA = META_DECKS.find((d) => d.id === pair.deckA);
    const deckB = META_DECKS.find((d) => d.id === pair.deckB);
    if (!deckA || !deckB) continue;
    const aOnA = fitDeck(deckA, a);
    const bOnB = fitDeck(deckB, b);
    const aOnB = fitDeck(deckB, a);
    const bOnA = fitDeck(deckA, b);
    const straight = (aOnA.score + bOnB.score) / 2;
    const swapped = (aOnB.score + bOnA.score) / 2;
    const useSwap = swapped > straight + 2;
    const score = Math.round((useSwap ? swapped : straight) + (pair.winRate - 50));
    const fitA = useSwap ? aOnB : aOnA;
    const fitB = useSwap ? bOnA : bOnB;
    const reasons: Reason[] = [
      { label: pair.notes, tone: "neutral" },
      {
        label: `${a.name} on ${fitA.deck.name} · fit ${fitA.score}`,
        tone: fitA.playable ? "good" : "warn",
      },
      {
        label: `${b.name} on ${fitB.deck.name} · fit ${fitB.score}`,
        tone: fitB.playable ? "good" : "warn",
      },
    ];
    out.push({ pair, score, fitA, fitB, swapped: useSwap, reasons });
  }
  return out.sort((x, y) => y.score - x.score);
}

export function upgradePriorities(player: PlayerProfile, goldBudget = 100000): UpgradePick[] {
  const owned = ownedMap(player);
  const ladder = recommendLadder(player);
  const weight = new Map<string, number>();
  ladder.slice(0, 6).forEach((fit, i) => {
    const w = (6 - i) * (fit.playable ? 1.4 : 0.9);
    for (const key of fit.deck.cards) weight.set(key, (weight.get(key) ?? 0) + w);
  });

  const picks: UpgradePick[] = [];
  for (const have of player.cards) {
    if (have.level >= MAX_LEVEL) continue;
    const card = CARDS_BY_KEY[have.key];
    if (!card || card.hero || card.type === "tower") continue;
    const gold = goldToNext(have.level);
    if (!gold) continue;
    const meta = cardMeta(have.key);
    const deckW = weight.get(have.key) ?? 0.4;
    const evoBonus = card.evo && have.evolutionLevel >= 1 ? 1.25 : 1;
    const gap = Math.max(0, targetLevel(player.expLevel) - have.level);
    const impact = (deckW * 12 + meta.usage * 0.8 + (56 - Math.min(56, meta.winRate)) * -0.3 + gap * 4) * evoBonus;
    const whyParts = [];
    if (deckW > 3) whyParts.push("core of your best decks");
    else if (deckW > 1) whyParts.push("shows up in recommended lists");
    if (card.evo && have.evolutionLevel >= 1) whyParts.push("evolution is already crafted");
    if (gap >= 2) whyParts.push(`underleveled vs king ${player.expLevel}`);
    if (meta.tier === "S+" || meta.tier === "S") whyParts.push(`${meta.tier} meta card`);
    picks.push({
      card,
      from: have.level,
      to: have.level + 1,
      gold,
      impact: impact / Math.sqrt(gold / 1000),
      why: whyParts.join(" · ") || "General collection strength",
    });
  }

  picks.sort((a, b) => b.impact - a.impact);
  const chosen: UpgradePick[] = [];
  let spent = 0;
  for (const p of picks) {
    if (chosen.length >= 12) break;
    if (spent && spent + p.gold > goldBudget * 1.4) continue;
    chosen.push(p);
    spent += p.gold;
  }
  return chosen.length ? chosen : picks.slice(0, 8);
}

export function matchup(self: string[], opp: string[]): { score: number; notes: Reason[] } {
  const notes: Reason[] = [];
  let score = 50;
  const selfSet = new Set(self);
  const oppSet = new Set(opp);

  const selfSplash = hasRole(self, "splash");
  const oppSwarm = hasRole(opp, "swarm") || oppSet.has("goblin-barrel") || oppSet.has("skeleton-army");
  if (selfSplash && oppSwarm) {
    score += 8;
    notes.push({ label: "Your splash answers their swarms", tone: "good" });
  } else if (oppSwarm && !selfSplash) {
    score -= 8;
    notes.push({ label: "Bait / swarm will leak without splash", tone: "bad" });
  }

  const oppAir = opp.some((k) => ["balloon", "lava-hound", "minion-horde", "inferno-dragon", "minion-giant"].includes(k));
  if (oppAir && hasRole(self, "air")) {
    score += 6;
    notes.push({ label: "Air defense is on the list", tone: "good" });
  } else if (oppAir) {
    score -= 10;
    notes.push({ label: "They have air; you do not answer it well", tone: "bad" });
  }

  const oppBuilding = hasRole(opp, "building") || oppSet.has("tesla") || oppSet.has("cannon") || oppSet.has("inferno-tower");
  const selfHog = selfSet.has("hog-rider") || selfSet.has("royal-hogs") || selfSet.has("ram-rider");
  if (selfHog && oppBuilding) {
    score -= 5;
    notes.push({ label: "Buildings tax your win condition", tone: "warn" });
  }
  if (selfSet.has("earthquake") && oppBuilding) {
    score += 6;
    notes.push({ label: "Earthquake breaks their buildings", tone: "good" });
  }

  const selfLog = selfSet.has("the-log") || selfSet.has("barbarian-barrel") || selfSet.has("royal-delivery");
  if (oppSet.has("goblin-barrel") && selfLog) {
    score += 5;
    notes.push({ label: "Small spell covers Goblin Barrel", tone: "good" });
  } else if (oppSet.has("goblin-barrel") && !selfLog) {
    score -= 7;
    notes.push({ label: "No Log/Delivery for Barrel", tone: "bad" });
  }

  if (!notes.length) notes.push({ label: "Even matchup — play the king tower", tone: "neutral" });
  return { score: Math.max(18, Math.min(86, score)), notes };
}

export function currentDeckAnalysis(player: PlayerProfile) {
  const fake: MetaDeck = {
    id: "current",
    name: "Current deck",
    archetype: "midrange",
    modes: ["ladder"],
    cards: player.currentDeck,
    evo: player.currentEvo,
    hero: player.currentHero,
    champion: player.currentChampion,
    elixir: avgElixir(player.currentDeck),
    winRate: 50,
    useRate: 0,
    sample: 0,
    notes: "The eight you last queued with.",
    f2p: false,
  };
  const vsMeta = META_DECKS.map((d) => ({ deck: d, ...matchup(player.currentDeck, d.cards) })).sort(
    (a, b) => b.score - a.score,
  );
  return { deck: fake, coverage: coverage(player.currentDeck), vsMeta };
}

export function collectionHeat(player: PlayerProfile) {
  const byRarity: Record<string, { n: number; avg: number; evos: number }> = {};
  for (const c of player.cards) {
    const card = CARDS_BY_KEY[c.key];
    if (!card || card.hero || card.type === "tower") continue;
    const bucket = (byRarity[card.rarity] ??= { n: 0, avg: 0, evos: 0 });
    bucket.n += 1;
    bucket.avg += c.level;
    if (c.evolutionLevel >= 1) bucket.evos += 1;
  }
  for (const b of Object.values(byRarity)) b.avg = b.n ? b.avg / b.n : 0;
  return byRarity;
}

export { CARD_META };
