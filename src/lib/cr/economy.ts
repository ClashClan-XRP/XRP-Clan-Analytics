/** Gold to upgrade FROM this level to the next. Index = current level. Max is 16. */
export const MAX_LEVEL = 16;

export const GOLD_TO_NEXT: number[] = [
  0, 5, 20, 50, 150, 400, 1000, 2000, 4000, 8000, 20000, 35000, 50000, 75000, 100000, 150000,
];

export const COPIES_TO_NEXT: Record<string, number[]> = {
  common: [0, 2, 4, 10, 20, 50, 100, 200, 400, 800, 1000, 1500, 2000, 3000, 4000, 5000],
  rare: [0, 2, 4, 10, 20, 50, 100, 200, 400, 500, 750, 1000, 1250, 1500, 2000, 2500],
  epic: [0, 2, 4, 10, 20, 50, 100, 200, 250, 300, 350, 400, 500, 600, 700, 800],
  legendary: [0, 1, 1, 1, 2, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
  champion: [0, 1, 1, 1, 2, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
};

export function goldToNext(level: number): number {
  if (level >= MAX_LEVEL) return 0;
  return GOLD_TO_NEXT[level] ?? 0;
}

export function goldToMax(level: number): number {
  let total = 0;
  for (let l = level; l < MAX_LEVEL; l++) total += goldToNext(l);
  return total;
}

/** Ladder playability target — cards at king+0 feel even. */
export function targetLevel(kingLevel: number): number {
  return Math.min(MAX_LEVEL, Math.max(11, kingLevel));
}
