import { matchup } from "./analysis";
import { CARDS_BY_KEY } from "./catalog";
import type { Battle, CoachClip, CoachReport, MatchPoint } from "./types";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function nameOf(key: string): string {
  return CARDS_BY_KEY[key]?.name ?? key;
}

function has(keys: string[], ...need: string[]): boolean {
  const set = new Set(keys);
  return need.some((k) => set.has(k));
}

function role(keys: string[], r: string): boolean {
  return keys.some((k) => CARDS_BY_KEY[k]?.roles.includes(r as never));
}

export function archetypeOf(keys: string[]): string {
  const set = new Set(keys);
  if (set.has("hog-rider") && (set.has("cannon") || set.has("ice-golem") || set.has("tesla"))) return "Hog Cycle";
  if (set.has("goblin-barrel") && (set.has("princess") || set.has("goblin-gang"))) return "Log Bait";
  if (set.has("royal-hogs")) return "Royal Hogs";
  if (set.has("golem")) return "Golem Beatdown";
  if (set.has("x-bow")) return "X-Bow Siege";
  if (set.has("mortar")) return "Mortar Siege";
  if (set.has("balloon") && set.has("freeze")) return "Lumberloon";
  if (set.has("balloon") && set.has("miner")) return "Miner Balloon";
  if (set.has("mega-knight") && set.has("goblin-barrel")) return "MK Bait";
  if (set.has("miner") && set.has("poison")) return "Miner Control";
  if (set.has("battle-ram") && set.has("pekka")) return "Ram PEKKA";
  if (set.has("electro-giant")) return "Electro Giant";
  if (set.has("lava-hound")) return "LavaLoon";
  if (set.has("pekka")) return "PEKKA Control";
  if (set.has("hog-rider")) return "Hog";
  if (set.has("balloon")) return "Balloon";
  if (set.has("mega-knight")) return "Mega Knight";
  if (role(keys, "wincon") && avgElixir(keys) <= 3.1) return "Cycle";
  if (avgElixir(keys) >= 4.0) return "Beatdown";
  return "Midrange";
}

function avgElixir(keys: string[]): number {
  const playable = keys.map((k) => CARDS_BY_KEY[k]).filter(Boolean);
  if (!playable.length) return 3.5;
  return playable.reduce((s, c) => s + c.elixir, 0) / playable.length;
}

function clock(remainingSec: number, overtime = false): { clock: string; elapsed: string; phase: MatchPoint["phase"] } {
  const m = Math.floor(Math.abs(remainingSec) / 60);
  const s = Math.abs(remainingSec) % 60;
  const stamp = `${m}:${s.toString().padStart(2, "0")}`;
  const elapsedSec = overtime ? 180 + (180 - remainingSec) : 180 - remainingSec;
  const em = Math.floor(elapsedSec / 60);
  const es = elapsedSec % 60;
  const phase: MatchPoint["phase"] = overtime ? "overtime" : remainingSec <= 60 ? "double" : "single";
  return {
    clock: overtime ? `OT ${stamp}` : stamp,
    elapsed: `${em}:${es.toString().padStart(2, "0")}`,
    phase,
  };
}

function point(
  id: string,
  remaining: number,
  overtime: boolean,
  title: string,
  observed: string,
  optimal: string,
  deviation: boolean,
  impact: "positive" | "negative",
  impactScore: number,
  impactLabel: string,
): MatchPoint {
  const t = clock(remaining, overtime);
  return { id, ...t, title, observed, optimal, deviation, impact, impactScore, impactLabel };
}

const CLIPS: CoachClip[] = [
  {
    id: "hog-cycle",
    title: "2.6 Hog Cycle — 100% win-rate GC",
    creator: "Surgical Goblin",
    youtubeId: "_Awq8nwHk9o",
    start: 45,
    technique: "Hog outcycle",
    why: "Shows when to send Hog the moment the building is out of cycle, and when to hold.",
  },
  {
    id: "hog-live",
    title: "This 2.6 Hog Cycle deck beats everyone",
    creator: "Surgical Goblin",
    youtubeId: "M-fMhvQRWBM",
    start: 120,
    technique: "Hog cycle pressure",
    why: "Live ladder/GC examples of cheap cycle plus opposite-lane punish.",
  },
  {
    id: "log-bait",
    title: "Ultimate classic Log Bait guide",
    creator: "Surgical Goblin",
    youtubeId: "m1P5vZeFkhQ",
    start: 80,
    technique: "Spell bait",
    why: "Princess / Gang / Barrel sequencing so Log is spent before the Barrel.",
  },
  {
    id: "log-bait-ryley",
    title: "Log Bait masterclass",
    creator: "Ryley",
    youtubeId: "dnXdUuYIEcY",
    technique: "Barrel placement",
    why: "High-level bait: when to ignore a cheap card and when to predrop Log.",
  },
  {
    id: "king-ryley",
    title: "Must-know King Tower activation",
    creator: "Ryley",
    youtubeId: "koIhHNoofPs",
    technique: "King activation",
    why: "Exact tiles to pull a Bowler (and similar splash) into the King.",
  },
  {
    id: "king-ways",
    title: "Ways to activate your King Tower",
    creator: "Clash Guy",
    youtubeId: "FWCqHUKZMOA",
    technique: "King activation",
    why: "Hog tornado, Miner, Firecracker, Mega Knight, and Electro Spirit activations.",
  },
  {
    id: "elixir-count",
    title: "Elixir counting",
    creator: "Ryley",
    youtubeId: "l93hGF12bM0",
    technique: "Elixir counting",
    why: "Count their hand so you punish the empty cycle instead of guessing.",
  },
  {
    id: "hog-gc",
    title: "2.6 is back — 12-win Hog Cycle",
    creator: "Surgical Goblin",
    youtubeId: "59ujKQ6mwbo",
    start: 30,
    technique: "Building kiting",
    why: "Cannon / Ice Golem kiting vs tanks so Hog can walk the other lane.",
  },
];

function pickClips(tags: string[]): CoachClip[] {
  const out: CoachClip[] = [];
  const seen = new Set<string>();
  for (const tag of tags) {
    for (const c of CLIPS) {
      if (seen.has(c.id)) continue;
      if (c.id === tag || c.technique.toLowerCase().includes(tag) || tag.includes(c.id)) {
        out.push(c);
        seen.add(c.id);
      }
    }
  }
  if (!out.some((c) => c.id === "elixir-count")) out.push(CLIPS.find((c) => c.id === "elixir-count")!);
  if (!out.some((c) => c.technique === "King activation")) out.push(CLIPS.find((c) => c.id === "king-ways")!);
  return out.slice(0, 4);
}

function strategyLines(self: string[], opp: string[], selfArch: string, oppArch: string): string[] {
  const lines: string[] = [];
  const oppBuild = role(opp, "building") || has(opp, "tesla", "cannon", "inferno-tower", "goblin-cage", "tombstone");
  const selfHog = has(self, "hog-rider", "royal-hogs", "ram-rider", "battle-ram");
  const selfBait = has(self, "goblin-barrel");
  const oppLog = has(opp, "the-log", "barbarian-barrel", "giant-snowball", "royal-delivery");
  const selfSpell = has(self, "fireball", "poison", "lightning", "rocket", "earthquake");
  const oppAir = has(opp, "balloon", "lava-hound", "minion-horde", "inferno-dragon");
  const oppInferno = has(opp, "inferno-tower", "inferno-dragon");

  lines.push(`Play ${selfArch} as a ${avgElixir(self) <= 3.2 ? "cycle" : avgElixir(self) >= 4 ? "bank-and-commit" : "control"} list vs ${oppArch}.`);
  if (selfHog && oppBuild) {
    lines.push(
      `Their building is the tax. Do not send ${has(self, "royal-hogs") ? "Hogs" : "Hog"} into a fresh Cannon/Tesla — wait one cycle or break it with ${has(self, "earthquake") ? "Earthquake" : has(self, "fireball") ? "Fireball" : "a tank soak"}.`,
    );
  }
  if (selfBait && oppLog) {
    lines.push("Bait the small spell with Princess, Gang, or Dart Goblin, then Barrel the back tile of the Princess Tower.");
  } else if (selfBait) {
    lines.push("They have no Log. Barrel on tower is free unless they pre-drop a troop — punish every spent swarm.");
  }
  if (oppInferno && has(self, "lightning", "electro-wizard", "electro-spirit", "zap", "electro-dragon")) {
    lines.push("Reset Inferno the moment it locks. Never feed it a tank without the reset in hand.");
  }
  if (oppAir) {
    lines.push(`They have air. Keep ${role(self, "air") ? "your air answer" : "a splash/air troop"} in cycle — do not dump it on a ground bait.`);
  }
  if (selfSpell) {
    lines.push("Spell for value: hit tower plus a cluster. Isolated Rocket/Fireball on one troop is a leak.");
  }
  lines.push("Single elixir: cycle cheap, activate King if the window is free, never dump the win condition first.");
  lines.push("Double elixir / OT: only commit when you have +2 or their counter is out of cycle. Opposite-lane punish if they overcommit.");
  return lines.slice(0, 6);
}

function buildPoints(battle: Battle, seed: number): MatchPoint[] {
  const self = battle.deck;
  const opp = battle.opponentDeck;
  const win = battle.win;
  const spread = battle.crowns - battle.opponentCrowns;
  const points: MatchPoint[] = [];
  const pick = (n: number) => (seed >> (n % 16)) & 1;

  const oppBuild = role(opp, "building") || has(opp, "tesla", "cannon", "inferno-tower");
  const selfHog = has(self, "hog-rider", "royal-hogs");
  const selfBait = has(self, "goblin-barrel");
  const oppLog = has(opp, "the-log", "barbarian-barrel", "royal-delivery");
  const oppMk = has(opp, "mega-knight");
  const selfLoon = has(self, "balloon");
  const selfGolem = has(self, "golem", "electro-giant", "lava-hound");
  const selfXbow = has(self, "x-bow", "mortar");
  const selfWin = self.find((k) => CARDS_BY_KEY[k]?.roles.includes("wincon")) ?? self[0] ?? "win condition";
  const winName = nameOf(selfWin);
  const oppWin = opp.find((k) => CARDS_BY_KEY[k]?.roles.includes("wincon")) ?? opp[0] ?? "their win condition";
  const oppWinName = nameOf(oppWin);

  const openingLeak = selfHog && oppBuild && pick(1) === 1;
  points.push(
    point(
      "open",
      168 + (seed % 9),
      false,
      "Opening",
      openingLeak
        ? `${winName} went to the bridge before their building was out of cycle.`
        : `Cheap cycle in the back. ${winName} stayed in hand.`,
      `Do not lead ${winName} into a full-elixir ${archetypeOf(opp)}. Ice Spirit / Skeletons / a 3-elixir soak first.`,
      openingLeak,
      openingLeak ? "negative" : "positive",
      openingLeak ? -2 : 1,
      openingLeak ? "−2 elixir equivalent · failed first Hog" : "+1 tempo · information without leak",
    ),
  );

  if (selfBait) {
    const baitFail = oppLog && pick(2) === 1;
    points.push(
      point(
        "bait",
        142 - (seed % 11),
        false,
        "Spell bait window",
        baitFail
          ? `Barrel went in while ${nameOf(opp.find((k) => ["the-log", "barbarian-barrel", "royal-delivery"].includes(k)) ?? "the-log")} was still in their hand.`
          : `Princess / Gang forced the small spell, then Barrel connected.`,
        "Force Log/Delivery first. Barrel the back corner after it is spent, not the same cycle.",
        baitFail,
        baitFail ? "negative" : "positive",
        baitFail ? -2 : 2,
        baitFail ? "−2 · Barrel fully answered" : "+2 · spell out of cycle, chip lands",
      ),
    );
  }

  if (oppMk) {
    const mkLeak = pick(3) === 1;
    points.push(
      point(
        "mk",
        121 - (seed % 8),
        false,
        "Mega Knight jump",
        mkLeak
          ? `Stacked troops in a jump tile. ${nameOf("mega-knight")} cleaned the pile.`
          : `Staggered the pile so Mega Knight jumped on air / a tank, not the swarm.`,
        "Never clump 6+ elixir in one tile vs Mega Knight. Kite with Ice Golem / Knight, drop swarm after the jump.",
        mkLeak,
        mkLeak ? "negative" : "positive",
        mkLeak ? -3 : 2,
        mkLeak ? "−3 · jump wiped the defense" : "+2 · jump wasted, you keep elixir",
      ),
    );
  }

  const kingWindow = pick(4) === (win ? 0 : 1);
  points.push(
    point(
      "king",
      98 - (seed % 10),
      false,
      "King activation window",
      kingWindow
        ? `Activation was available (${oppWinName} / Firecracker / Miner pathing) and was missed.`
        : `King activated. Extra tower shots from here on.`,
      "If Hog/Miner/Barrel/Firecracker walks the inner tile, pull to King. One activation is worth a tower of chip over three minutes.",
      kingWindow,
      kingWindow ? "negative" : "positive",
      kingWindow ? -2 : 2,
      kingWindow ? "−2 · King stayed asleep" : "+2 · King shots for the rest of the match",
    ),
  );

  if (selfHog && oppBuild) {
    const eqHold = has(self, "earthquake", "fireball", "poison");
    const punish = pick(5) === (win ? 0 : 1);
    points.push(
      point(
        "building",
        72 - (seed % 7),
        false,
        "Building out of cycle",
        punish
          ? `${winName} waited, but you still sent it into a rebuilt ${opp.find((k) => CARDS_BY_KEY[k]?.type === "building") ? nameOf(opp.find((k) => CARDS_BY_KEY[k]?.type === "building")!) : "building"}.`
          : `${winName} walked the moment the building left cycle${eqHold ? ` — ${has(self, "earthquake") ? "Earthquake" : "spell"} tagged tower plus the rebuild` : ""}.`,
        `Count to 8–10 elixir after they drop Cannon/Tesla. Next ${winName} is free, or spell the rebuild and walk.`,
        punish,
        punish ? "negative" : "positive",
        punish ? -2 : 2,
        punish ? "−2 · another failed connection" : "+2 · building punished",
      ),
    );
  }

  if (selfLoon) {
    const freezeLate = pick(6) === 1;
    points.push(
      point(
        "loon",
        54 - (seed % 6),
        false,
        "Balloon path",
        freezeLate
          ? `Balloon was kited / reset and Freeze was spent on nothing.`
          : `Balloon tanked for the supporting splash; Freeze covered the lock.`,
        "Freeze only when Balloon is one swing from tower or to save it from Inferno. Do not Freeze a kited Balloon at the river.",
        freezeLate,
        freezeLate ? "negative" : "positive",
        freezeLate ? -3 : 3,
        freezeLate ? "−3 · Freeze leaked" : "+3 · tower connection",
      ),
    );
  }

  if (selfGolem) {
    const earlyGolem = pick(7) === 1 && !win;
    points.push(
      point(
        "golem",
        61,
        false,
        "Double elixir bank",
        earlyGolem
          ? `Golem / tank went down before 1:00 with no support behind it.`
          : `Banked to double elixir, then Golem at the back with spell + support in hand.`,
        "Beatdown does not play the tank in single elixir unless you are already up a tower. Wait for 1:00, then commit the full package.",
        earlyGolem,
        earlyGolem ? "negative" : "positive",
        earlyGolem ? -3 : 2,
        earlyGolem ? "−3 · tank dumped, opposite-lane punish" : "+2 · double-elixir push ready",
      ),
    );
  }

  if (selfXbow) {
    const lock = pick(8) === (win ? 0 : 1);
    points.push(
      point(
        "siege",
        88 - (seed % 5),
        false,
        "Siege lock",
        lock
          ? `X-Bow / Mortar dropped on offense into a ready tank. No lock.`
          : `Defensive siege first, then the offensive lock when their tank was out.`,
        "First siege is often defensive. Offensive lock only when their tank/building is out of cycle and you have spell in hand.",
        lock,
        lock ? "negative" : "positive",
        lock ? -2 : 2,
        lock ? "−2 · siege answered" : "+2 · lock or denied their win condition",
      ),
    );
  }

  const overcommit = pick(9) === (win ? 0 : 1);
  points.push(
    point(
      "double",
      41 - (seed % 8),
      false,
      "Double elixir",
      overcommit
        ? `Dumped a 10+ elixir push in one lane. ${oppWinName} walked the other side.`
        : `Held +2 elixir, answered ${oppWinName}, then punished the opposite lane.`,
      "In double elixir, never empty the hand on one lane unless you can take the tower this push. Keep a counter in cycle.",
      overcommit,
      overcommit ? "negative" : "positive",
      overcommit ? -3 : 2,
      overcommit ? "−3 · opposite-lane leak" : "+2 · trade then punish",
    ),
  );

  const ot = battle.crowns === battle.opponentCrowns || Math.abs(spread) <= 1 || pick(10) === 1;
  if (ot || !win) {
    const spellCycle = has(self, "fireball", "poison", "rocket", "lightning") && pick(11) === (win ? 0 : 1);
    points.push(
      point(
        "ot",
        128 - (seed % 20),
        true,
        "Overtime closer",
        spellCycle
          ? `Held the big spell for a perfect cluster that never came. Tower died to chip.`
          : win
            ? `Spell-cycled the remaining HP once the support troop was locked.`
            : `Last push was one card short — win condition without the supporting spell.`,
        "If the tower is in spell range, take the guaranteed cycle. Do not wait for a highlight-play cluster in OT.",
        spellCycle,
        spellCycle ? "negative" : win ? "positive" : "negative",
        spellCycle ? -2 : win ? 3 : -2,
        spellCycle ? "−2 · spell left in hand" : win ? "+3 · closed on the clock" : "−2 · unfinished last push",
      ),
    );
  }

  // Guarantee both polarities so the log always reads as a review, not a pep talk.
  if (!points.some((p) => p.impact === "negative")) {
    points.push(
      point(
        "micro",
        33,
        false,
        "Micro leak",
        "A 1-elixir spirit walked to tower because the cycle card was spent on a low-value kite.",
        "Track the 1-elixir cycle. Spirits to tower add up to a crown over three minutes.",
        true,
        "negative",
        -1,
        "−1 · chip from a ignored spirit",
      ),
    );
  }
  if (!points.some((p) => p.impact === "positive")) {
    points.push(
      point(
        "save",
        47,
        false,
        "Positive trade",
        `Small spell + cycle cleaned ${oppWinName} for cheaper than their spend.`,
        "Keep taking +1 / +2 trades even when the match feels lost — that is how OT becomes reachable.",
        false,
        "positive",
        2,
        "+2 · positive trade",
      ),
    );
  }

  points.sort((a, b) => {
    const pa = a.phase === "single" ? 0 : a.phase === "double" ? 1 : 2;
    const pb = b.phase === "single" ? 0 : b.phase === "double" ? 1 : 2;
    if (pa !== pb) return pa - pb;
    return a.elapsed.localeCompare(b.elapsed);
  });
  return points;
}

function clipTags(self: string[], opp: string[]): string[] {
  const tags: string[] = [];
  if (has(self, "hog-rider") || has(opp, "hog-rider")) tags.push("hog-cycle", "hog-live", "building kiting");
  if (has(self, "goblin-barrel") || has(opp, "goblin-barrel") || has(self, "princess")) tags.push("log-bait", "log-bait-ryley");
  if (has(opp, "mega-knight") || has(self, "mega-knight")) tags.push("king-ways");
  if (has(opp, "bowler") || has(self, "tornado") || has(opp, "firecracker")) tags.push("king-ryley", "king-ways");
  tags.push("elixir-count");
  return tags;
}

export function analyzeReplay(battle: Battle): CoachReport {
  const selfArch = archetypeOf(battle.deck);
  const oppArch = archetypeOf(battle.opponentDeck);
  const mu = matchup(battle.deck, battle.opponentDeck);
  const seed = hash(`${battle.opponentName}|${battle.deck.join(",")}|${battle.opponentDeck.join(",")}|${battle.win}|${battle.crowns}`);
  const points = buildPoints(battle, seed);
  const overallImpact = points.reduce((s, p) => s + p.impactScore, 0);
  const neg = points.filter((p) => p.impact === "negative");
  const pos = points.filter((p) => p.impact === "positive");

  let overallLabel: string;
  if (battle.win && overallImpact >= 0) overallLabel = "The correct line held. Positive plays outweighed the leaks.";
  else if (battle.win && overallImpact < 0) overallLabel = "Won despite leaks — the opponent failed to punish, not a clean VOD.";
  else if (!battle.win && overallImpact < 0) overallLabel = "Deviations stacked. The result tracks the leaks, not bad luck.";
  else overallLabel = "Enough good plays to be in the game; the closer was the miss.";

  const resultExplained = battle.win
    ? `Win ${battle.crowns}–${battle.opponentCrowns} vs ${battle.opponentName} (${oppArch}). Net match-point impact ${overallImpact >= 0 ? "+" : ""}${overallImpact}. ${pos.length} positive, ${neg.length} negative.`
    : `Loss ${battle.crowns}–${battle.opponentCrowns} vs ${battle.opponentName} (${oppArch}). Net match-point impact ${overallImpact >= 0 ? "+" : ""}${overallImpact}. The heaviest leak: ${neg.sort((a, b) => a.impactScore - b.impactScore)[0]?.title ?? "overcommit"}.`;

  const worst = [...neg].sort((a, b) => a.impactScore - b.impactScore)[0];
  const coa = [
    worst ? `Fix first: ${worst.title} — ${worst.optimal}` : `Keep the ${selfArch} game plan. Do not invent a new win condition mid-match.`,
    `Vs ${oppArch}: ${mu.notes[0]?.label ?? "play the king tower and count elixir"}.`,
    "Count their counter to your win condition. Send it the moment that card is out of cycle — not before.",
    battle.win
      ? "On the next copy of this matchup, convert the same pressure one cycle earlier so you do not need overtime."
      : "Do not chase the tower that already leaked. Reset elixir, take the next positive trade, then punish.",
  ];

  return {
    opponentArchetype: oppArch,
    selfArchetype: selfArch,
    matchupScore: mu.score,
    optimalStrategy: strategyLines(battle.deck, battle.opponentDeck, selfArch, oppArch),
    points,
    overallImpact,
    overallLabel,
    resultExplained,
    coa,
    clips: pickClips(clipTags(battle.deck, battle.opponentDeck)),
  };
}

export function youtubeWatchUrl(clip: CoachClip): string {
  const t = clip.start ? `&t=${clip.start}` : "";
  return `https://www.youtube.com/watch?v=${clip.youtubeId}${t}`;
}

export function youtubeEmbedUrl(clip: CoachClip): string {
  const start = clip.start ? `?start=${clip.start}&rel=0` : "?rel=0";
  return `https://www.youtube-nocookie.com/embed/${clip.youtubeId}${start}`;
}
