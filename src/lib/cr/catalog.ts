export type Rarity = "common" | "rare" | "epic" | "legendary" | "champion";
export type CardType = "troop" | "spell" | "building" | "tower";
export type Role =
  | "wincon"
  | "tank"
  | "mini-tank"
  | "swarm"
  | "splash"
  | "air"
  | "building"
  | "small-spell"
  | "big-spell"
  | "cycle"
  | "support"
  | "champion"
  | "hero";

export type Card = {
  key: string;
  name: string;
  elixir: number;
  type: CardType;
  rarity: Rarity;
  id: number;
  evo: boolean;
  evoCycles?: number;
  hero?: boolean;
  heroOf?: string;
  roles: Role[];
};

export const CARDS: Card[] = [
  { key: "cannoneer", name: "Cannoneer", elixir: 0, type: "tower", rarity: "common", id: 27000021, evo: false, roles: ["support"] },
  { key: "dagger-duchess", name: "Dagger Duchess", elixir: 0, type: "tower", rarity: "common", id: 27000022, evo: false, roles: ["support"] },
  { key: "royal-chef", name: "Royal Chef", elixir: 0, type: "tower", rarity: "common", id: 27000023, evo: false, roles: ["support"] },
  { key: "tower-princess", name: "Tower Princess", elixir: 0, type: "tower", rarity: "common", id: 27000020, evo: false, roles: ["support"] },
  { key: "electro-spirit", name: "Electro Spirit", elixir: 1, type: "troop", rarity: "common", id: 26000084, evo: false, roles: ["cycle"] },
  { key: "fire-spirit", name: "Fire Spirit", elixir: 1, type: "troop", rarity: "common", id: 26000031, evo: false, roles: ["cycle"] },
  { key: "heal-spirit", name: "Heal Spirit", elixir: 1, type: "troop", rarity: "rare", id: 28000016, evo: false, roles: ["cycle"] },
  { key: "ice-spirit", name: "Ice Spirit", elixir: 1, type: "troop", rarity: "common", id: 26000030, evo: true, evoCycles: 2, roles: ["cycle"] },
  { key: "skeletons", name: "Skeletons", elixir: 1, type: "troop", rarity: "common", id: 26000010, evo: true, evoCycles: 2, roles: ["swarm", "cycle"] },
  { key: "bats", name: "Bats", elixir: 2, type: "troop", rarity: "common", id: 26000049, evo: true, evoCycles: 2, roles: ["swarm", "air", "cycle"] },
  { key: "berserker", name: "Berserker", elixir: 2, type: "troop", rarity: "common", id: 26000096, evo: false, roles: ["mini-tank", "cycle"] },
  { key: "bomber", name: "Bomber", elixir: 2, type: "troop", rarity: "common", id: 26000013, evo: true, evoCycles: 2, roles: ["splash"] },
  { key: "goblins", name: "Goblins", elixir: 2, type: "troop", rarity: "common", id: 26000002, evo: false, roles: ["swarm", "cycle"] },
  { key: "berserker-hero", name: "Hero Berserker", elixir: 2, type: "troop", rarity: "common", id: 26000213, evo: false, hero: true, heroOf: "berserker", roles: ["mini-tank", "cycle", "hero"] },
  { key: "goblins-hero", name: "Hero Goblins", elixir: 2, type: "troop", rarity: "common", id: 26000208, evo: false, hero: true, heroOf: "goblins", roles: ["swarm", "cycle", "hero"] },
  { key: "ice-golem-hero", name: "Hero Ice Golem", elixir: 2, type: "troop", rarity: "rare", id: 26000209, evo: false, hero: true, heroOf: "ice-golem", roles: ["mini-tank", "cycle", "hero"] },
  { key: "ice-golem", name: "Ice Golem", elixir: 2, type: "troop", rarity: "rare", id: 26000038, evo: true, evoCycles: 2, roles: ["mini-tank", "cycle"] },
  { key: "spear-goblins", name: "Spear Goblins", elixir: 2, type: "troop", rarity: "common", id: 26000019, evo: false, roles: ["swarm"] },
  { key: "suspicious-bush", name: "Suspicious Bush", elixir: 2, type: "troop", rarity: "rare", id: 26000103, evo: false, roles: ["wincon", "cycle"] },
  { key: "wall-breakers", name: "Wall Breakers", elixir: 2, type: "troop", rarity: "epic", id: 26000058, evo: true, evoCycles: 2, roles: ["wincon"] },
  { key: "archers", name: "Archers", elixir: 3, type: "troop", rarity: "common", id: 26000001, evo: true, evoCycles: 2, roles: ["air"] },
  { key: "bandit", name: "Bandit", elixir: 3, type: "troop", rarity: "legendary", id: 26000046, evo: false, roles: ["mini-tank"] },
  { key: "dart-goblin", name: "Dart Goblin", elixir: 3, type: "troop", rarity: "rare", id: 26000040, evo: true, evoCycles: 2, roles: ["support"] },
  { key: "elixir-golem", name: "Elixir Golem", elixir: 3, type: "troop", rarity: "rare", id: 26000067, evo: false, roles: ["wincon", "tank"] },
  { key: "firecracker", name: "Firecracker", elixir: 3, type: "troop", rarity: "common", id: 26000064, evo: true, evoCycles: 2, roles: ["splash"] },
  { key: "fisherman", name: "Fisherman", elixir: 3, type: "troop", rarity: "legendary", id: 26000061, evo: false, roles: ["support"] },
  { key: "goblin-gang", name: "Goblin Gang", elixir: 3, type: "troop", rarity: "common", id: 26000041, evo: false, roles: ["swarm"] },
  { key: "guards", name: "Guards", elixir: 3, type: "troop", rarity: "epic", id: 26000025, evo: false, roles: ["swarm"] },
  { key: "ice-wizard-hero", name: "Hero Ice Wizard", elixir: 3, type: "troop", rarity: "legendary", id: 26000212, evo: false, hero: true, heroOf: "ice-wizard", roles: ["support", "hero"] },
  { key: "knight-hero", name: "Hero Knight", elixir: 3, type: "troop", rarity: "common", id: 26000200, evo: false, hero: true, heroOf: "knight", roles: ["mini-tank", "cycle", "hero"] },
  { key: "mega-minion-hero", name: "Hero Mega Minion", elixir: 3, type: "troop", rarity: "rare", id: 26000206, evo: false, hero: true, heroOf: "mega-minion", roles: ["air", "hero"] },
  { key: "ice-wizard", name: "Ice Wizard", elixir: 3, type: "troop", rarity: "legendary", id: 26000023, evo: false, roles: ["support"] },
  { key: "knight", name: "Knight", elixir: 3, type: "troop", rarity: "common", id: 26000000, evo: true, evoCycles: 2, roles: ["mini-tank", "cycle"] },
  { key: "little-prince", name: "Little Prince", elixir: 3, type: "troop", rarity: "champion", id: 26000093, evo: false, roles: ["support", "champion"] },
  { key: "mega-minion", name: "Mega Minion", elixir: 3, type: "troop", rarity: "rare", id: 26000039, evo: false, roles: ["air"] },
  { key: "miner", name: "Miner", elixir: 3, type: "troop", rarity: "legendary", id: 26000032, evo: false, roles: ["wincon"] },
  { key: "minions", name: "Minions", elixir: 3, type: "troop", rarity: "common", id: 26000005, evo: false, roles: ["swarm", "air"] },
  { key: "princess", name: "Princess", elixir: 3, type: "troop", rarity: "legendary", id: 26000026, evo: true, evoCycles: 2, roles: ["splash"] },
  { key: "royal-ghost", name: "Royal Ghost", elixir: 3, type: "troop", rarity: "legendary", id: 26000050, evo: true, evoCycles: 2, roles: ["support"] },
  { key: "skeleton-army", name: "Skeleton Army", elixir: 3, type: "troop", rarity: "epic", id: 26000012, evo: true, evoCycles: 2, roles: ["swarm"] },
  { key: "skeleton-barrel", name: "Skeleton Barrel", elixir: 3, type: "troop", rarity: "common", id: 26000056, evo: true, evoCycles: 2, roles: ["wincon"] },
  { key: "baby-dragon", name: "Baby Dragon", elixir: 4, type: "troop", rarity: "epic", id: 26000015, evo: true, evoCycles: 2, roles: ["splash", "air"] },
  { key: "battle-healer", name: "Battle Healer", elixir: 4, type: "troop", rarity: "rare", id: 26000068, evo: false, roles: ["mini-tank"] },
  { key: "battle-ram", name: "Battle Ram", elixir: 4, type: "troop", rarity: "rare", id: 26000036, evo: true, evoCycles: 2, roles: ["wincon"] },
  { key: "dark-prince", name: "Dark Prince", elixir: 4, type: "troop", rarity: "epic", id: 26000027, evo: false, roles: ["wincon", "mini-tank"] },
  { key: "electro-wizard", name: "Electro Wizard", elixir: 4, type: "troop", rarity: "legendary", id: 26000042, evo: false, roles: ["support"] },
  { key: "flying-machine", name: "Flying Machine", elixir: 4, type: "troop", rarity: "rare", id: 26000057, evo: false, roles: ["air"] },
  { key: "goblin-demolisher", name: "Goblin Demolisher", elixir: 4, type: "troop", rarity: "rare", id: 26000097, evo: false, roles: ["support", "splash"] },
  { key: "golden-knight", name: "Golden Knight", elixir: 4, type: "troop", rarity: "champion", id: 26000074, evo: false, roles: ["mini-tank", "champion"] },
  { key: "dark-prince-hero", name: "Hero Dark Prince", elixir: 4, type: "troop", rarity: "epic", id: 26000211, evo: false, hero: true, heroOf: "dark-prince", roles: ["wincon", "mini-tank", "hero"] },
  { key: "magic-archer-hero", name: "Hero Magic Archer", elixir: 4, type: "troop", rarity: "legendary", id: 26000205, evo: false, hero: true, heroOf: "magic-archer", roles: ["splash", "hero"] },
  { key: "mini-pekka-hero", name: "Hero Mini P.E.K.K.A.", elixir: 4, type: "troop", rarity: "rare", id: 26000202, evo: false, hero: true, heroOf: "mini-pekka", roles: ["mini-tank", "hero"] },
  { key: "musketeer-hero", name: "Hero Musketeer", elixir: 4, type: "troop", rarity: "rare", id: 26000203, evo: false, hero: true, heroOf: "musketeer", roles: ["air", "hero"] },
  { key: "valkyrie-hero", name: "Hero Valkyrie", elixir: 4, type: "troop", rarity: "rare", id: 26000214, evo: false, hero: true, heroOf: "valkyrie", roles: ["mini-tank", "splash", "hero"] },
  { key: "hog-rider", name: "Hog Rider", elixir: 4, type: "troop", rarity: "rare", id: 26000021, evo: false, roles: ["wincon"] },
  { key: "hunter", name: "Hunter", elixir: 4, type: "troop", rarity: "epic", id: 26000044, evo: true, evoCycles: 2, roles: ["support"] },
  { key: "inferno-dragon", name: "Inferno Dragon", elixir: 4, type: "troop", rarity: "legendary", id: 26000037, evo: true, evoCycles: 2, roles: ["air"] },
  { key: "lumberjack", name: "Lumberjack", elixir: 4, type: "troop", rarity: "legendary", id: 26000035, evo: true, evoCycles: 2, roles: ["mini-tank"] },
  { key: "magic-archer", name: "Magic Archer", elixir: 4, type: "troop", rarity: "legendary", id: 26000062, evo: false, roles: ["splash"] },
  { key: "mighty-miner", name: "Mighty Miner", elixir: 4, type: "troop", rarity: "champion", id: 26000065, evo: false, roles: ["mini-tank", "champion"] },
  { key: "mini-pekka", name: "Mini P.E.K.K.A", elixir: 4, type: "troop", rarity: "rare", id: 26000018, evo: false, roles: ["mini-tank"] },
  { key: "minion-giant", name: "Minion Giant", elixir: 4, type: "troop", rarity: "rare", id: 26000102, evo: false, roles: ["wincon", "tank", "air"] },
  { key: "mother-witch", name: "Mother Witch", elixir: 4, type: "troop", rarity: "legendary", id: 26000083, evo: false, roles: ["splash"] },
  { key: "musketeer", name: "Musketeer", elixir: 4, type: "troop", rarity: "rare", id: 26000014, evo: true, evoCycles: 2, roles: ["air"] },
  { key: "night-witch", name: "Night Witch", elixir: 4, type: "troop", rarity: "legendary", id: 26000048, evo: false, roles: ["support"] },
  { key: "phoenix", name: "Phoenix", elixir: 4, type: "troop", rarity: "legendary", id: 26000087, evo: false, roles: ["air"] },
  { key: "rune-giant", name: "Rune Giant", elixir: 4, type: "troop", rarity: "rare", id: 26000099, evo: false, roles: ["wincon", "tank"] },
  { key: "skeleton-dragons", name: "Skeleton Dragons", elixir: 4, type: "troop", rarity: "common", id: 26000080, evo: false, roles: ["splash", "air"] },
  { key: "skeleton-king", name: "Skeleton King", elixir: 4, type: "troop", rarity: "champion", id: 26000069, evo: false, roles: ["champion"] },
  { key: "valkyrie", name: "Valkyrie", elixir: 4, type: "troop", rarity: "rare", id: 26000011, evo: true, evoCycles: 2, roles: ["mini-tank", "splash"] },
  { key: "zappies", name: "Zappies", elixir: 4, type: "troop", rarity: "rare", id: 26000052, evo: false, roles: ["support"] },
  { key: "archer-queen", name: "Archer Queen", elixir: 5, type: "troop", rarity: "champion", id: 26000072, evo: false, roles: ["air", "champion"] },
  { key: "balloon", name: "Balloon", elixir: 5, type: "troop", rarity: "epic", id: 26000006, evo: false, roles: ["wincon"] },
  { key: "barbarians", name: "Barbarians", elixir: 5, type: "troop", rarity: "common", id: 26000008, evo: true, evoCycles: 1, roles: ["swarm"] },
  { key: "bowler", name: "Bowler", elixir: 5, type: "troop", rarity: "epic", id: 26000034, evo: false, roles: ["splash"] },
  { key: "cannon-cart", name: "Cannon Cart", elixir: 5, type: "troop", rarity: "epic", id: 26000054, evo: false, roles: ["wincon"] },
  { key: "electro-dragon", name: "Electro Dragon", elixir: 5, type: "troop", rarity: "epic", id: 26000063, evo: true, evoCycles: 2, roles: ["splash", "air"] },
  { key: "executioner", name: "Executioner", elixir: 5, type: "troop", rarity: "epic", id: 26000045, evo: true, evoCycles: 2, roles: ["splash"] },
  { key: "giant", name: "Giant", elixir: 5, type: "troop", rarity: "rare", id: 26000003, evo: false, roles: ["wincon", "tank"] },
  { key: "goblin-machine", name: "Goblin Machine", elixir: 5, type: "troop", rarity: "epic", id: 26000098, evo: false, roles: ["wincon", "support"] },
  { key: "goblinstein", name: "Goblinstein", elixir: 5, type: "troop", rarity: "champion", id: 26000094, evo: false, roles: ["wincon", "support", "champion"] },
  { key: "balloon-hero", name: "Hero Balloon", elixir: 5, type: "troop", rarity: "epic", id: 26000216, evo: false, hero: true, heroOf: "balloon", roles: ["wincon", "hero"] },
  { key: "bowler-hero", name: "Hero Bowler", elixir: 5, type: "troop", rarity: "epic", id: 26000210, evo: false, hero: true, heroOf: "bowler", roles: ["splash", "hero"] },
  { key: "giant-hero", name: "Hero Giant", elixir: 5, type: "troop", rarity: "rare", id: 26000201, evo: false, hero: true, heroOf: "giant", roles: ["wincon", "tank", "hero"] },
  { key: "wizard-hero", name: "Hero Wizard", elixir: 5, type: "troop", rarity: "rare", id: 26000204, evo: false, hero: true, heroOf: "wizard", roles: ["splash", "hero"] },
  { key: "minion-horde", name: "Minion Horde", elixir: 5, type: "troop", rarity: "common", id: 26000022, evo: true, evoCycles: 2, roles: ["swarm", "air"] },
  { key: "monk", name: "Monk", elixir: 5, type: "troop", rarity: "champion", id: 26000077, evo: false, roles: ["mini-tank", "champion"] },
  { key: "prince", name: "Prince", elixir: 5, type: "troop", rarity: "epic", id: 26000016, evo: false, roles: ["wincon", "mini-tank"] },
  { key: "ram-rider", name: "Ram Rider", elixir: 5, type: "troop", rarity: "legendary", id: 26000051, evo: false, roles: ["wincon"] },
  { key: "rascals", name: "Rascals", elixir: 5, type: "troop", rarity: "common", id: 26000053, evo: false, roles: ["swarm"] },
  { key: "ronin", name: "Ronin", elixir: 5, type: "troop", rarity: "legendary", id: 26000101, evo: false, roles: ["mini-tank", "support"] },
  { key: "royal-hogs", name: "Royal Hogs", elixir: 5, type: "troop", rarity: "rare", id: 26000059, evo: true, evoCycles: 2, roles: ["wincon"] },
  { key: "witch", name: "Witch", elixir: 5, type: "troop", rarity: "epic", id: 26000007, evo: true, evoCycles: 2, roles: ["splash"] },
  { key: "wizard", name: "Wizard", elixir: 5, type: "troop", rarity: "rare", id: 26000017, evo: true, evoCycles: 1, roles: ["splash"] },
  { key: "boss-bandit", name: "Boss Bandit", elixir: 6, type: "troop", rarity: "champion", id: 26000095, evo: false, roles: ["wincon", "mini-tank", "champion"] },
  { key: "elite-barbarians", name: "Elite Barbarians", elixir: 6, type: "troop", rarity: "common", id: 26000043, evo: true, evoCycles: 1, roles: ["wincon"] },
  { key: "giant-skeleton", name: "Giant Skeleton", elixir: 6, type: "troop", rarity: "epic", id: 26000020, evo: false, roles: ["tank"] },
  { key: "goblin-giant", name: "Goblin Giant", elixir: 6, type: "troop", rarity: "epic", id: 26000060, evo: true, evoCycles: 1, roles: ["wincon", "tank"] },
  { key: "royal-giant", name: "Royal Giant", elixir: 6, type: "troop", rarity: "common", id: 26000024, evo: true, evoCycles: 1, roles: ["wincon", "tank"] },
  { key: "sparky", name: "Sparky", elixir: 6, type: "troop", rarity: "legendary", id: 26000033, evo: false, roles: ["wincon"] },
  { key: "spirit-empress", name: "Spirit Empress", elixir: 6, type: "troop", rarity: "legendary", id: 26000100, evo: false, roles: ["splash", "support"] },
  { key: "electro-giant", name: "Electro Giant", elixir: 7, type: "troop", rarity: "epic", id: 26000085, evo: false, roles: ["wincon", "tank"] },
  { key: "lava-hound", name: "Lava Hound", elixir: 7, type: "troop", rarity: "legendary", id: 26000029, evo: false, roles: ["wincon", "tank"] },
  { key: "mega-knight", name: "Mega Knight", elixir: 7, type: "troop", rarity: "legendary", id: 26000055, evo: true, evoCycles: 1, roles: ["tank"] },
  { key: "pekka", name: "P.E.K.K.A", elixir: 7, type: "troop", rarity: "epic", id: 26000004, evo: true, evoCycles: 1, roles: ["tank"] },
  { key: "royal-recruits", name: "Royal Recruits", elixir: 7, type: "troop", rarity: "common", id: 26000047, evo: true, evoCycles: 1, roles: ["swarm"] },
  { key: "golem", name: "Golem", elixir: 8, type: "troop", rarity: "epic", id: 26000009, evo: false, roles: ["wincon", "tank"] },
  { key: "three-musketeers", name: "Three Musketeers", elixir: 9, type: "troop", rarity: "rare", id: 26000028, evo: false, roles: ["wincon"] },
  { key: "cannon", name: "Cannon", elixir: 3, type: "building", rarity: "common", id: 27000000, evo: true, evoCycles: 2, roles: ["cycle", "building"] },
  { key: "tombstone-hero", name: "Hero Tombstone", elixir: 3, type: "building", rarity: "rare", id: 26000215, evo: false, hero: true, heroOf: "tombstone", roles: ["building", "hero"] },
  { key: "tombstone", name: "Tombstone", elixir: 3, type: "building", rarity: "rare", id: 27000009, evo: false, roles: ["building"] },
  { key: "bomb-tower", name: "Bomb Tower", elixir: 4, type: "building", rarity: "rare", id: 27000004, evo: false, roles: ["building"] },
  { key: "furnace", name: "Furnace", elixir: 4, type: "building", rarity: "rare", id: 27000010, evo: true, evoCycles: 2, roles: ["building"] },
  { key: "goblin-cage", name: "Goblin Cage", elixir: 4, type: "building", rarity: "rare", id: 27000012, evo: true, evoCycles: 2, roles: ["building"] },
  { key: "goblin-drill", name: "Goblin Drill", elixir: 4, type: "building", rarity: "epic", id: 27000013, evo: true, evoCycles: 2, roles: ["wincon", "building"] },
  { key: "mortar", name: "Mortar", elixir: 4, type: "building", rarity: "common", id: 27000002, evo: true, evoCycles: 2, roles: ["wincon", "building"] },
  { key: "tesla", name: "Tesla", elixir: 4, type: "building", rarity: "common", id: 27000006, evo: true, evoCycles: 2, roles: ["air", "cycle", "building"] },
  { key: "goblin-hut", name: "Goblin Hut", elixir: 5, type: "building", rarity: "rare", id: 27000001, evo: false, roles: ["building"] },
  { key: "inferno-tower", name: "Inferno Tower", elixir: 5, type: "building", rarity: "rare", id: 27000003, evo: false, roles: ["building"] },
  { key: "barbarian-hut", name: "Barbarian Hut", elixir: 6, type: "building", rarity: "rare", id: 27000005, evo: false, roles: ["building"] },
  { key: "elixir-collector", name: "Elixir Collector", elixir: 6, type: "building", rarity: "rare", id: 27000007, evo: false, roles: ["building"] },
  { key: "x-bow", name: "X-Bow", elixir: 6, type: "building", rarity: "epic", id: 27000008, evo: false, roles: ["wincon", "building"] },
  { key: "mirror", name: "Mirror", elixir: 1, type: "spell", rarity: "epic", id: 28000006, evo: false, roles: ["support"] },
  { key: "barbarian-barrel", name: "Barbarian Barrel", elixir: 2, type: "spell", rarity: "epic", id: 28000015, evo: false, roles: ["small-spell"] },
  { key: "giant-snowball", name: "Giant Snowball", elixir: 2, type: "spell", rarity: "common", id: 28000017, evo: true, evoCycles: 2, roles: ["small-spell"] },
  { key: "goblin-curse", name: "Goblin Curse", elixir: 2, type: "spell", rarity: "epic", id: 28000022, evo: false, roles: ["small-spell"] },
  { key: "barbarian-barrel-hero", name: "Hero Barbarian Barrel", elixir: 2, type: "spell", rarity: "epic", id: 26000207, evo: false, hero: true, heroOf: "barbarian-barrel", roles: ["small-spell", "hero"] },
  { key: "rage", name: "Rage", elixir: 2, type: "spell", rarity: "epic", id: 28000002, evo: false, roles: ["small-spell"] },
  { key: "the-log", name: "The Log", elixir: 2, type: "spell", rarity: "legendary", id: 28000011, evo: false, roles: ["small-spell", "cycle"] },
  { key: "zap", name: "Zap", elixir: 2, type: "spell", rarity: "common", id: 28000008, evo: true, evoCycles: 2, roles: ["small-spell", "cycle"] },
  { key: "arrows", name: "Arrows", elixir: 3, type: "spell", rarity: "common", id: 28000001, evo: false, roles: ["small-spell"] },
  { key: "clone", name: "Clone", elixir: 3, type: "spell", rarity: "epic", id: 28000013, evo: false, roles: ["small-spell"] },
  { key: "earthquake", name: "Earthquake", elixir: 3, type: "spell", rarity: "rare", id: 28000014, evo: false, roles: ["big-spell"] },
  { key: "goblin-barrel", name: "Goblin Barrel", elixir: 3, type: "spell", rarity: "epic", id: 28000004, evo: true, evoCycles: 2, roles: ["wincon", "big-spell"] },
  { key: "royal-delivery", name: "Royal Delivery", elixir: 3, type: "spell", rarity: "common", id: 28000018, evo: false, roles: ["small-spell"] },
  { key: "tornado", name: "Tornado", elixir: 3, type: "spell", rarity: "epic", id: 28000012, evo: false, roles: ["big-spell"] },
  { key: "vines", name: "Vines", elixir: 3, type: "spell", rarity: "epic", id: 28000023, evo: false, roles: ["small-spell"] },
  { key: "fireball", name: "Fireball", elixir: 4, type: "spell", rarity: "rare", id: 28000000, evo: false, roles: ["big-spell"] },
  { key: "freeze", name: "Freeze", elixir: 4, type: "spell", rarity: "epic", id: 28000005, evo: false, roles: ["big-spell"] },
  { key: "poison", name: "Poison", elixir: 4, type: "spell", rarity: "epic", id: 28000009, evo: false, roles: ["big-spell"] },
  { key: "graveyard", name: "Graveyard", elixir: 5, type: "spell", rarity: "legendary", id: 28000010, evo: false, roles: ["wincon", "big-spell"] },
  { key: "void", name: "Void", elixir: 5, type: "spell", rarity: "epic", id: 28000021, evo: false, roles: ["big-spell"] },
  { key: "lightning", name: "Lightning", elixir: 6, type: "spell", rarity: "epic", id: 28000007, evo: false, roles: ["big-spell"] },
  { key: "rocket", name: "Rocket", elixir: 6, type: "spell", rarity: "rare", id: 28000003, evo: false, roles: ["big-spell"] },
];

export const CARDS_BY_KEY: Record<string, Card> = Object.fromEntries(
  CARDS.map((c) => [c.key, c]),
);

export const CARDS_BY_ID: Record<number, Card> = Object.fromEntries(
  CARDS.map((c) => [c.id, c]),
);

export const CARDS_BY_NAME: Record<string, Card> = Object.fromEntries(
  CARDS.map((c) => [c.name.toLowerCase(), c]),
);


export const PLAYABLE = CARDS.filter((c) => c.type !== "tower" && !c.hero);
export const HEROES = CARDS.filter((c) => c.hero);
export const TOWER_TROOPS = CARDS.filter((c) => c.type === "tower");
export const EVO_CARDS = CARDS.filter((c) => c.evo);

export const ART_BASE = "https://royaleapi.github.io/cr-api-assets/cards";

export function artUrl(key: string, evo = false): string {
  const file = evo ? `${key}-ev1.png` : `${key}.png`;
  return `${ART_BASE}/${file}`;
}

export function deckUrl(keys: string[]): string {
  return `https://royaleapi.com/decks/stats/${keys.join(",")}`;
}

/** Clash Royale in-game copy-deck deep link (RoyaleAPI / official copyDeck format). */
export function copyDeckDeepLink(
  keys: string[],
  opts?: { tower?: string; label?: string },
): string {
  const ids = keys
    .map((k) => CARDS_BY_KEY[k]?.id)
    .filter((id): id is number => typeof id === "number")
    .slice(0, 8);
  const parts = [`deck=${ids.join(";")}`];
  if (opts?.label) parts.push(`l=${encodeURIComponent(opts.label)}`);
  const tt = opts?.tower ? CARDS_BY_KEY[opts.tower]?.id : undefined;
  if (tt) parts.push(`tt=${tt}`);
  return `clashroyale://copyDeck?${parts.join("&")}`;
}

/** HTTPS wrapper that opens Clash Royale (or the store) — same pattern as RoyaleAPI. */
export function copyDeckUrl(keys: string[], opts?: { tower?: string; label?: string }): string {
  return `https://link.clashroyale.com/en/?${copyDeckDeepLink(keys, opts)}`;
}


