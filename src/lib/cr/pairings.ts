import { avgElixir, fitDeck, matchup, ownedMap } from "./analysis";
import { CARDS_BY_KEY, type Card } from "./catalog";
import { DUOS, META_DECKS } from "./meta";
import type { Battle, MetaDeck, OwnedCard, PlayerProfile } from "./types";

export type FavoriteCard = { key: string; count: number; of: number };

export type DeckCardNote = {
  key: string;
  name: string;
  elixir: number;
  use: string;
  evo: boolean;
  level?: number;
  champion: boolean;
};

export type StartPlan = {
  optimal: string;
  alternatives: string[];
};

export type PlayerDeckPlan = {
  playerName: string;
  playerTag: string;
  deckName: string;
  archetype: string;
  elixir: number;
  cards: DeckCardNote[];
  summary: string;
  interactions: string[];
  start: StartPlan;
  favoritesUsed: FavoriteCard[];
  evoNote: string;
  championNote?: string;
};

export type PairStrategy = {
  id: string;
  strategy: string;
  why: string;
  score: number;
  winRate: number;
  metaCover: string;
  a: PlayerDeckPlan;
  b: PlayerDeckPlan;
};

const ROLE_USE: Record<Card["roles"][number], string> = {
  wincon: "win condition",
  tank: "tank",
  "mini-tank": "mini-tank / soak",
  swarm: "swarm / distraction",
  splash: "splash / area damage",
  air: "air defense",
  building: "building / kite",
  "small-spell": "small spell",
  "big-spell": "large spell · area damage",
  cycle: "cycle / distraction",
  support: "support",
  champion: "champion",
  hero: "hero",
};

const CARD_USE: Record<string, string> = {
  "hog-rider": "win condition",
  "royal-hogs": "win condition",
  "goblin-barrel": "win condition · bait",
  balloon: "win condition",
  golem: "tank / win condition",
  "mega-knight": "tank-buster / splash",
  skeletons: "distraction / cycle",
  "ice-spirit": "cycle / freeze",
  "electro-spirit": "cycle / reset",
  "the-log": "small spell · knockback",
  fireball: "large spell · area damage",
  lightning: "large spell · reset",
  poison: "large spell · area damage",
  cannon: "kite building",
  tesla: "defensive building · air",
  "inferno-tower": "tank-buster building",
  musketeer: "air defense / support",
  princess: "chip / bait / splash",
  knight: "mini-tank / soak",
  valkyrie: "mini-tank / splash",
  "night-witch": "support / spawn",
  "baby-dragon": "splash / air defense",
  tornado: "pull / king activation",
  freeze: "freeze spell",
  miner: "win condition / chip",
  "battle-ram": "win condition / bridge",
  pekka: "tank-buster",
  zap: "small spell · reset",
  arrows: "small spell · swarm clear",
  bats: "distraction / air swarm",
  "goblin-gang": "swarm / bait",
  "ice-golem": "kite / cycle tank",
  earthquake: "building break / large spell",
  "royal-delivery": "defensive drop / small spell",
  "archer-queen": "champion · air / ability",
  "mighty-miner": "champion · mini-tank",
  goblinstein: "champion · support tank",
  lumberjack: "mini-tank / rage drop",
  "inferno-dragon": "air tank-buster",
  "magic-archer": "splash / chip",
  "electro-wizard": "stun / air defense",
  bandit: "bridge pressure",
  "royal-ghost": "invisible splash / support",
  "mega-minion": "air defense",
  bowler: "splash / knockback",
  mortar: "siege win condition",
  "x-bow": "siege win condition",
  "electro-giant": "tank / reflect win condition",
  "dark-prince": "charge / splash",
  "electro-dragon": "chain stun / air",
  "mother-witch": "splash / curse",
  "giant-skeleton": "bomb tank",
  fisherman: "hook / kite",
  zappies: "stun / swarm",
  "goblin-hut": "spawn / chip building",
  furnace: "spawn building / chip",
  mirror: "copy / tempo",
  rage: "tempo / push amplify",
  "elite-barbarians": "win condition / beatdown",
  "spear-goblins": "chip / bait",
  "skeleton-barrel": "win condition · bait",
  goblins: "distraction / cycle",
  bomber: "splash / area damage",
  firecracker: "splash / chip",
  archers: "air defense / chip",
  "barbarian-barrel": "small spell · mini-tank",
  vines: "root / small spell",
  "royal-giant": "win condition",
  witch: "splash / spawn",
  wizard: "splash / area damage",
  hunter: "point-blank / air",
  "skeleton-army": "swarm / distraction",
  minions: "air swarm / distraction",
  "minion-horde": "air swarm / punish",
  tombstone: "spawn building / kite",
  "goblin-cage": "kite building / brawler",
  prince: "charge win condition",
  "cannon-cart": "win condition / siege troop",
  "wall-breakers": "win condition / chip",
  "ice-wizard": "slow / kite / air",
  "dart-goblin": "chip / air poke",
  "skeleton-king": "champion · soul tank",
  monk: "champion · ability soak",
  "mini-pekka": "tank-buster / mini-tank",
  giant: "tank / win condition",
  guards: "distraction / kite",
};

const CRITICAL: Record<string, string[]> = {
  "hog-cycle": [
    "Count their Tesla/Cannon cycle before sending Hog — do not eat a fresh building.",
    "Fireball only when it tags tower plus a medium troop; never snipe a lone Musketeer.",
    "Evo Skeletons stall, they do not stack. Spread them so a spell cannot clear the lane.",
    "If Ice Golem is in hand with Hog, lead the Golem so the building retargets.",
  ],
  "log-bait": [
    "Hold Goblin Barrel until their Log/Delivery is spent — Princess and Gang exist to take that spell.",
    "Rocket a tower only after you have already forced a small-spell and they cannot punish.",
    "Inferno Tower on the first tank; do not drop it on a Knight.",
    "If they keep Log in hand, pressure with Princess at the opposite bridge, not Barrel.",
  ],
  "hog-miner": [
    "Earthquake the building the moment Hog connects, not preemptively on an empty tile.",
    "Mighty Miner ability through their tank, not as a panic drop on a spirit.",
    "Delivery is for Barrel/Goblin Gang, not for chip on the tower.",
  ],
  "hogs-queen": [
    "Queen ability after they spend a reset (Zap/E-Spirit). Do not cloak into a ready Zap.",
    "Evo Hogs go opposite the lane they just defended — never the same pocket twice.",
    "Earthquake only on buildings; the Queen handles swarms.",
  ],
  "hogs-stein": [
    "Stein monster tanks for the second Hogs push, not the first probe.",
    "Doctor ability is single-use — save it for the push that actually reaches.",
    "Archers Evo at range; do not drop them on top of a spellable stack.",
  ],
  "ram-pekka": [
    "PEKKA on their win condition, not as a bridge lead unless you already have Ram support.",
    "Magic Archer only with a tank in front or a pulled line — naked MArcher dies to Log.",
    "Zap the Inferno / Evo skeletons the moment Ram crosses the river.",
  ],
  "loon-control": [
    "Freeze when Balloon is on the tower, not on the way. Count their air-targeting troop.",
    "Tornado the kiting unit into the Balloon path, not toward their king unless it also tags.",
    "Bowler holds the ground lane while Balloon flies — do not both commit the same side.",
  ],
  "ram-witch": [
    "Vines the inferno or the kiting troop before Ram connects.",
    "Giant Skeleton death bomb is the win — walk it to the tower, do not drop it on defense unless desperate.",
    "Mother Witch on swarms, never on a single tank.",
  ],
  "miner-poison": [
    "Miner tanks Poison. Send them together once you have spell-cycled their swarm.",
    "Do not Poison a lone tower at even elixir; the chip is for a committed push.",
    "Valkyrie Evo on the pile, Cannon on the Hog — never the reverse.",
  ],
  xbow: [
    "Tesla in the pocket before X-Bow, not after they already have a tank on it.",
    "Fireball the supporting Musketeer/Queen, not the tank soaking the X-Bow.",
    "If the first X-Bow is pulled, cycle ice spirit and go again — do not overdefend.",
  ],
  golem: [
    "Golem at the back only when you can afford the first minute. Partner must cover the opposite lane.",
    "Night Witch behind the Golem after they spend a splash spell, never in front of it.",
    "Lightning the inferno plus a support — never a lone Musketeer.",
    "Tornado the kiting unit into the Golem, then let Night Witch spawn.",
  ],
  egiant: [
    "Tornado value is the deck. Pull swarms and a win condition into the E-Giant reflect.",
    "Do not drop E-Giant at the bridge unless double elixir and they are empty.",
    "Lightning the inferno the moment it locks.",
  ],
  "mk-bait": [
    "Mega Knight on top of a stacked push, not as a lonely tank at the bridge.",
    "Barrel the far tower the instant they Log the Goblin Gang.",
    "Inferno Dragon on their tank; Bats are the distraction, not the tank killer.",
  ],
  "mortar-bait": [
    "Mortar on the tower, not as a defensive building unless they have no tank.",
    "Hero Goblins chip while Mortar locks — do not both sit in the same pocket.",
    "Fireball the swarm that would reclear your Mortar, not a speculative tower shot.",
  ],
  "loon-miner": [
    "Miner tanks for Balloon on the second push; first Balloon can be a probe.",
    "Earthquake the building before Balloon crosses, not after it has already been pulled.",
  ],
  "hog-f2p": [
    "Valkyrie on the pile, Cannon on the Hog. Arrows for Bats/Gang, Fireball for mediums.",
    "If Hog is not in the opener, cycle Skeletons at the back and wait.",
  ],
};

const STRATEGY: Record<string, { name: string; how: (a: string, b: string, da: string, db: string) => string }> = {
  "cycle-beatdown": {
    name: "Split-lane cycle + beatdown",
    how: (a, b, da, db) =>
      `${a} on ${da} keeps a cheap win condition in the opposite lane so ${b} can bank ${db} without eating a full-lane punish.`,
  },
  "bait-hogs": {
    name: "Spell-bait cross",
    how: (a, b, da, db) =>
      `${a} on ${da} forces their small spell. ${b} on ${db} walks the other lane the moment that spell is gone.`,
  },
  "loon-miner": {
    name: "Air lock + chip control",
    how: (a, b, da, db) =>
      `${a} on ${da} threatens a freeze lock while ${b} on ${db} holds ground and Poisons the swarm Freeze cannot cover.`,
  },
  "mk-hog": {
    name: "Mid-ladder stomp",
    how: (a, b, da, db) =>
      `${a} soaks with ${da} so ${b} can cycle ${db} the instant a spell or building is spent.`,
  },
  "siege-bridge": {
    name: "Siege lock + bridge spam",
    how: (a, b, da, db) =>
      `${a} locks a tower with ${da} while ${b} threatens the other with ${db}. Never both drop buildings on one side.`,
  },
  "egiant-cycle": {
    name: "Reflect tank + building break",
    how: (a, b, da, db) =>
      `${a} plays ${da} for Tornado value. ${b} on ${db} breaks buildings and defends the first 60 seconds.`,
  },
  "cycle-cycle": {
    name: "Dual cycle split",
    how: (a, b, da, db) =>
      `${a} and ${b} never stack the same lane. ${da} probes, ${db} punishes the spent building. First tower wins the game.`,
  },
  "bait-beatdown": {
    name: "Bait into tank",
    how: (a, b, da, db) =>
      `${a} on ${da} empties their small spell and swarm answers. ${b} walks ${db} the moment that answer is gone.`,
  },
};

export function isDuoBattle(b: Battle): boolean {
  return /2v2|team|trail|duel/i.test(`${b.gameMode} ${b.type}`);
}

export function favoriteCards(battles: Battle[], n = 8, fallbackDeck: string[] = []): FavoriteCard[] {
  const used = battles.slice(0, 25);
  const counts = new Map<string, number>();
  for (const b of used) {
    for (const k of b.deck) {
      if (!k) continue;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  if (!counts.size) {
    for (const k of fallbackDeck) counts.set(k, 1);
  }
  const of = used.length || 1;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count, of }));
}

export function duoRecord(battles: Battle[]): { wins: number; n: number; pct: number } | null {
  const duo = battles.filter(isDuoBattle).slice(0, 25);
  if (!duo.length) return null;
  const wins = duo.filter((b) => b.win).length;
  return { wins, n: duo.length, pct: (wins / duo.length) * 100 };
}

export function cardUse(key: string): string {
  if (CARD_USE[key]) return CARD_USE[key];
  const card = CARDS_BY_KEY[key];
  if (!card) return "support";
  return ROLE_USE[card.roles[0]] ?? "support";
}

function nameOf(key: string): string {
  return CARDS_BY_KEY[key]?.name ?? key;
}

function startFor(deck: MetaDeck): StartPlan {
  const cheap = deck.cards
    .map((k) => CARDS_BY_KEY[k])
    .filter((c): c is Card => Boolean(c) && c.elixir <= 2)
    .sort((a, b) => a.elixir - b.elixir);
  const win = deck.cards.find((k) => CARDS_BY_KEY[k]?.roles.includes("wincon"));
  const tank = deck.cards.find((k) => CARDS_BY_KEY[k]?.roles.includes("tank") && k !== win);
  const building = deck.cards.find((k) => CARDS_BY_KEY[k]?.type === "building");
  const mini = deck.cards.find((k) => CARDS_BY_KEY[k]?.roles.includes("mini-tank"));
  const opener = cheap[0];
  const winName = win ? nameOf(win) : "your win condition";

  if (deck.archetype === "beatdown") {
    const tankName = nameOf(tank ?? win ?? deck.cards[0]!);
    return {
      optimal: `Bank to 7–8 and drop ${tankName} at the back. Support only after they commit a counter.`,
      alternatives: [
        `If they rush the bridge, defend with ${nameOf(mini ?? building ?? deck.cards[1]!)} and delay ${tankName} until you are even.`,
        opener
          ? `If ${tankName} is not in the opening hand, cycle ${opener.name} at the back — never dump support at the river first.`
          : `If ${tankName} is missing, play a support at the back and wait one rotation.`,
      ],
    };
  }

  if (deck.archetype === "bait") {
    const bait = deck.cards.find((k) =>
      ["goblin-barrel", "princess", "goblin-gang", "skeleton-barrel", "spear-goblins"].includes(k),
    );
    return {
      optimal: bait
        ? `Open ${nameOf(bait)} to test their small spell. Barrel the far tower the moment that spell is gone.`
        : `Open a bait troop at the opposite bridge and hold the win condition.`,
      alternatives: [
        mini
          ? `If no bait card is in hand, ${nameOf(mini)} at the back and wait — do not Rocket a tower on play one.`
          : "If the bait card is missing, cycle a cheap troop and hold the win condition.",
        building
          ? `If they lead a tank, ${nameOf(building)} first and save bait for the punished lane.`
          : "If they lead a tank, defend first and bait after you are even.",
      ],
    };
  }

  if (deck.archetype === "siege") {
    const siege = deck.cards.find((k) => ["mortar", "x-bow"].includes(k));
    return {
      optimal: siege
        ? `Place ${nameOf(siege)} when you can protect it. Tesla/Cannon in the pocket first if they have a fast win condition.`
        : "Lock the siege building with a defensive building already in cycle.",
      alternatives: [
        opener
          ? `If ${siege ? nameOf(siege) : "siege"} is not in hand, cycle ${opener.name} and hold the pocket.`
          : "If siege is not in hand, cycle cheap and do not overcommit a spell.",
        "If they rush both lanes, abandon the first lock and defend — a failed X-Bow/Mortar is worse than waiting.",
      ],
    };
  }

  if (deck.archetype === "bridge") {
    return {
      optimal: `Do not lead the bridge. Wait for them to spend elixir, then ${winName} plus a support on the same side.`,
      alternatives: [
        opener
          ? `If they idle, a single ${opener.name} at the opposite bridge is a probe — not a dump.`
          : "If they idle, probe one lane only.",
        mini
          ? `If ${winName} is not in hand, ${nameOf(mini)} at the back and look for the chain.`
          : `If ${winName} is missing, cycle and wait.`,
      ],
    };
  }

  return {
    optimal: opener
      ? `Open ${opener.name} at the back to cycle into ${winName}. Hold the second cheap card to react.`
      : `Bank into ${winName} and send opposite their first building.`,
    alternatives: [
      building
        ? `If ${opener?.name ?? "the cycle card"} is not in hand, drop ${nameOf(building)} on their first troop and wait one card.`
        : "If the opener is missing, defend with your mini-tank and do not panic-dump the win condition.",
      `If they lead a heavy tank at the back, punish opposite immediately with ${winName}${opener ? ` plus ${opener.name}` : ""}.`,
    ],
  };
}

function interactionsFor(deck: MetaDeck, partnerDeck: MetaDeck, player: string, partner: string): string[] {
  const own = CRITICAL[deck.id] ?? [];
  const win = deck.cards.find((k) => CARDS_BY_KEY[k]?.roles.includes("wincon"));
  const pWin = partnerDeck.cards.find((k) => CARDS_BY_KEY[k]?.roles.includes("wincon"));
  const building = deck.cards.find((k) => CARDS_BY_KEY[k]?.type === "building");
  const pBuilding = partnerDeck.cards.find((k) => CARDS_BY_KEY[k]?.type === "building");
  const extra: string[] = [];
  if (win && pWin) {
    extra.push(
      `Do not send ${nameOf(win)} into the same lane as ${partner}'s ${nameOf(pWin)} unless you are stacking a king-tower take.`,
    );
  }
  if (building && pBuilding) {
    extra.push(`${player}: keep ${nameOf(building)} for your lane. ${partner} holds ${nameOf(pBuilding)} — two buildings on one side is a leak.`);
  }
  if (deck.archetype === "cycle" && partnerDeck.archetype === "beatdown") {
    extra.push(`Cover the opposite lane for the first minute so ${partner} can afford the tank. Chip, do not greed a tower.`);
  }
  if (deck.champion) {
    extra.push(`Hold ${nameOf(deck.champion)} ability until a reset is spent or a stack is walking in.`);
  }
  return [...own.slice(0, 4), ...extra].slice(0, 6);
}

function evoNote(player: PlayerProfile, deck: MetaDeck): string {
  const owned = ownedMap(player);
  const ready = deck.evo.filter((k) => (owned.get(k)?.evolutionLevel ?? 0) >= 1).map(nameOf);
  const missing = deck.evo.filter((k) => (owned.get(k)?.evolutionLevel ?? 0) < 1).map(nameOf);
  const unused = player.cards
    .filter((c) => c.evolutionLevel >= 1 && !deck.cards.includes(c.key) && CARDS_BY_KEY[c.key]?.evo)
    .map((c) => nameOf(c.key))
    .slice(0, 3);
  const parts: string[] = [];
  if (ready.length) parts.push(`Play evo ${ready.join(" / ")} — that is the efficient slot.`);
  if (missing.length) parts.push(`${missing.join(" / ")} evo is not crafted; the list still works without it.`);
  if (unused.length) parts.push(`You also have evo ${unused.join(", ")} — leave those for another list.`);
  return parts.join(" ") || "No evolution required on this list.";
}

function championNote(player: PlayerProfile, deck: MetaDeck): string | undefined {
  if (!deck.champion) {
    const ownedChamp = player.cards.filter((c) => CARDS_BY_KEY[c.key]?.rarity === "champion");
    if (!ownedChamp.length) return undefined;
    return "No champion on this list — do not sneak one in and break the cycle.";
  }
  const have = player.cards.find((c) => c.key === deck.champion);
  const name = nameOf(deck.champion);
  if (!have) return `Needs ${name}. Do not substitute a different champion.`;
  return `${name} is the champion slot (lv ${have.level}). Ability is once per life — spend it on a committed push.`;
}

function favoritesOverlap(fav: FavoriteCard[], cards: string[]): FavoriteCard[] {
  const set = new Set(cards);
  return fav.filter((f) => set.has(f.key));
}

function assignmentScore(
  player: PlayerProfile,
  deck: MetaDeck,
  fav: FavoriteCard[],
): { fit: ReturnType<typeof fitDeck>; bonus: number } {
  const fit = fitDeck(deck, player);
  const owned = ownedMap(player);
  let bonus = 0;
  const overlap = favoritesOverlap(fav, deck.cards);
  bonus += Math.min(14, overlap.reduce((s, f) => s + Math.min(4, f.count), 0));
  for (const k of deck.evo) {
    if ((owned.get(k)?.evolutionLevel ?? 0) >= 1) bonus += 4;
  }
  if (deck.champion && owned.has(deck.champion)) bonus += 6;
  else if (deck.champion) bonus -= 8;
  const win = deck.cards.find((k) => CARDS_BY_KEY[k]?.roles.includes("wincon"));
  if (win && fav.some((f) => f.key === win)) bonus += 6;
  return { fit, bonus };
}

function metaCover(deckA: MetaDeck, deckB: MetaDeck): string {
  const top = [...META_DECKS].filter((d) => d.modes.includes("ladder")).sort((a, b) => b.useRate - a.useRate).slice(0, 5);
  const rows = top.map((d) => {
    const s = (matchup(deckA.cards, d.cards).score + matchup(deckB.cards, d.cards).score) / 2;
    return { name: d.name, s };
  });
  const strong = rows.filter((r) => r.s >= 54).map((r) => r.name);
  const weak = rows.filter((r) => r.s <= 46).map((r) => r.name);
  const parts: string[] = [];
  if (strong.length) parts.push(`Covers ${strong.join(", ")}.`);
  if (weak.length) parts.push(`Soft vs ${weak.join(", ")} — keep a building or spell in cycle for those.`);
  if (!parts.length) parts.push("Even into this week's most-used ladder lists.");
  return parts.join(" ");
}

function buildPlan(
  player: PlayerProfile,
  deck: MetaDeck,
  partner: PlayerProfile,
  partnerDeck: MetaDeck,
  fav: FavoriteCard[],
  how: string,
): PlayerDeckPlan {
  const owned = ownedMap(player);
  const cards: DeckCardNote[] = deck.cards.map((key) => {
    const card = CARDS_BY_KEY[key];
    const have = owned.get(key);
    return {
      key,
      name: card?.name ?? key,
      elixir: card?.elixir ?? 0,
      use: cardUse(key),
      evo: deck.evo.includes(key) && (have?.evolutionLevel ?? 0) >= 1,
      level: have?.level,
      champion: card?.rarity === "champion",
    };
  });
  const usedFav = favoritesOverlap(fav, deck.cards);
  const favLine = usedFav.length
    ? ` Last 25 games already lean on ${usedFav.map((f) => `${nameOf(f.key)} (${f.count}/${f.of})`).join(", ")}.`
    : "";
  return {
    playerName: player.name,
    playerTag: player.tag,
    deckName: deck.name,
    archetype: deck.archetype,
    elixir: deck.elixir || avgElixir(deck.cards),
    cards,
    summary: `${how}${favLine}`,
    interactions: interactionsFor(deck, partnerDeck, player.name, partner.name),
    start: startFor(deck),
    favoritesUsed: usedFav,
    evoNote: evoNote(player, deck),
    championNote: championNote(player, deck),
  };
}

function pushPair(
  out: PairStrategy[],
  seen: Set<string>,
  a: PlayerProfile,
  b: PlayerProfile,
  deckA: MetaDeck,
  deckB: MetaDeck,
  favA: FavoriteCard[],
  favB: FavoriteCard[],
  pairId: string,
  pairName: string,
  notes: string,
  winRate: number,
) {
  const aOnA = assignmentScore(a, deckA, favA);
  const bOnB = assignmentScore(b, deckB, favB);
  const aOnB = assignmentScore(a, deckB, favA);
  const bOnA = assignmentScore(b, deckA, favB);
  const straight = aOnA.fit.score + bOnB.fit.score + aOnA.bonus + bOnB.bonus;
  const swapped = aOnB.fit.score + bOnA.fit.score + aOnB.bonus + bOnA.bonus;
  const useSwap = swapped > straight + 3;
  const leftDeck = useSwap ? deckB : deckA;
  const rightDeck = useSwap ? deckA : deckB;
  const left = useSwap ? aOnB : aOnA;
  const right = useSwap ? bOnA : bOnB;
  const key = [leftDeck.id, rightDeck.id].sort().join(":");
  if (seen.has(key)) return;
  seen.add(key);
  const strat = STRATEGY[pairId];
  const howA = strat?.how(a.name, b.name, leftDeck.name, rightDeck.name) ?? notes;
  const howB = strat?.how(b.name, a.name, rightDeck.name, leftDeck.name) ?? notes;
  const cover = metaCover(leftDeck, rightDeck);
  const score = Math.max(
    0,
    Math.min(
      99,
      Math.round((left.fit.score + right.fit.score) / 2 + (winRate - 50) + (left.bonus + right.bonus) / 4),
    ),
  );
  out.push({
    id: `${pairId}-${leftDeck.id}-${rightDeck.id}`,
    strategy: strat?.name ?? pairName,
    why: `${notes} ${cover}`,
    score,
    winRate,
    metaCover: cover,
    a: buildPlan(a, leftDeck, b, rightDeck, favA, howA),
    b: buildPlan(b, rightDeck, a, leftDeck, favB, howB),
  });
}

function complementaryId(a: MetaDeck, b: MetaDeck): { id: string; name: string; notes: string } {
  const pair = [a.archetype, b.archetype].sort().join("+");
  if (pair === "beatdown+cycle") {
    return { id: "cycle-beatdown", name: "Split-lane cycle + beatdown", notes: "Cheap pressure while the tank partner banks." };
  }
  if (pair === "bait+cycle") {
    return { id: "bait-hogs", name: "Spell-bait cross", notes: "Bait empties the small spell; cycle walks the other lane." };
  }
  if (pair === "bait+beatdown") {
    return { id: "bait-beatdown", name: "Bait into tank", notes: "Force the swarm answer, then walk the tank." };
  }
  if (pair === "bridge+siege") {
    return { id: "siege-bridge", name: "Siege lock + bridge spam", notes: "One lock, one threat. Never both buildings one side." };
  }
  if (a.archetype === "cycle" && b.archetype === "cycle") {
    return { id: "cycle-cycle", name: "Dual cycle split", notes: "Split lanes. First tower is the game." };
  }
  return {
    id: `${a.archetype}-${b.archetype}`,
    name: `${a.archetype} + ${b.archetype}`,
    notes: "Assigned from collections, last-25 favorites, and this week's 2v2 snapshot.",
  };
}

export function recommendPairStrategies(
  a: PlayerProfile,
  b: PlayerProfile,
  battlesA: Battle[],
  battlesB: Battle[],
): PairStrategy[] {
  const favA = favoriteCards(battlesA, 8, a.currentDeck);
  const favB = favoriteCards(battlesB, 8, b.currentDeck);
  const out: PairStrategy[] = [];
  const seen = new Set<string>();

  for (const pair of DUOS) {
    const deckA = META_DECKS.find((d) => d.id === pair.deckA);
    const deckB = META_DECKS.find((d) => d.id === pair.deckB);
    if (!deckA || !deckB) continue;
    pushPair(out, seen, a, b, deckA, deckB, favA, favB, pair.id, pair.name, pair.notes, pair.winRate);
  }

  const twoV2 = META_DECKS.filter((d) => d.modes.includes("2v2"));
  const scoredA = twoV2
    .map((d) => ({ d, ...assignmentScore(a, d, favA) }))
    .sort((x, y) => y.fit.score + y.bonus - (x.fit.score + x.bonus));
  const scoredB = twoV2
    .map((d) => ({ d, ...assignmentScore(b, d, favB) }))
    .sort((x, y) => y.fit.score + y.bonus - (x.fit.score + x.bonus));

  for (const left of scoredA.slice(0, 3)) {
    const partner =
      scoredB.find((r) => r.d.id !== left.d.id && r.d.archetype !== left.d.archetype) ??
      scoredB.find((r) => r.d.id !== left.d.id);
    if (!partner) continue;
    const meta = complementaryId(left.d, partner.d);
    const wr = Math.round(((left.d.winRate + partner.d.winRate) / 2) * 10) / 10;
    pushPair(out, seen, a, b, left.d, partner.d, favA, favB, meta.id, meta.name, meta.notes, wr);
  }

  return out.sort((x, y) => y.score - x.score).slice(0, 5);
}

export function ownedLevel(player: PlayerProfile, key: string): OwnedCard | undefined {
  return player.cards.find((c) => c.key === key);
}
