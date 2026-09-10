import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_API_TOKEN, DEFAULT_CLAN_NAME, DEFAULT_CLAN_TAG } from "./cr/defaults";
import type { ClanProfile, PlayerProfile } from "./cr/types";

type Recent = { kind: "player" | "clan"; tag: string; name: string };

type AppState = {
  apiKey: string;
  setApiKey: (k: string) => void;
  goldBudget: number;
  setGoldBudget: (n: number) => void;
  player: PlayerProfile | null;
  clan: ClanProfile | null;
  setPlayer: (p: PlayerProfile | null) => void;
  setClan: (c: ClanProfile | null) => void;
  bootstrapped: boolean;
  setBootstrapped: (v: boolean) => void;
  patchCardLevel: (key: string, level: number) => void;
  toggleEvo: (key: string) => void;
  toggleHero: (key: string) => void;
  recents: Recent[];
  remember: (r: Recent) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      apiKey: DEFAULT_API_TOKEN,
      setApiKey: (apiKey) => set({ apiKey }),
      goldBudget: 80000,
      setGoldBudget: (goldBudget) => set({ goldBudget }),
      player: null,
      clan: null,
      bootstrapped: false,
      setBootstrapped: (bootstrapped) => set({ bootstrapped }),
      setPlayer: (player) => set({ player }),
      setClan: (clan) => set({ clan }),
      patchCardLevel: (key, level) => {
        const player = get().player;
        if (!player) return;
        const cards = player.cards.map((c) => (c.key === key ? { ...c, level } : c));
        set({ player: { ...player, cards, source: "manual" } });
      },
      toggleEvo: (key) => {
        const player = get().player;
        if (!player) return;
        const cards = player.cards.map((c) =>
          c.key === key ? { ...c, evolutionLevel: c.evolutionLevel ? 0 : 1 } : c,
        );
        set({ player: { ...player, cards, source: "manual" } });
      },
      toggleHero: (key) => {
        const player = get().player;
        if (!player) return;
        const has = player.heroes.includes(key);
        const heroes = has ? player.heroes.filter((h) => h !== key) : [...player.heroes, key];
        set({ player: { ...player, heroes, source: "manual" } });
      },
      recents: [{ kind: "clan", tag: DEFAULT_CLAN_TAG, name: DEFAULT_CLAN_NAME }],
      remember: (r) =>
        set({
          recents: [r, ...get().recents.filter((x) => !(x.kind === r.kind && x.tag === r.tag))].slice(0, 8),
        }),
    }),
    {
      name: "xrp-clan-analytics",
      partialize: (s) => ({
        apiKey: s.apiKey,
        goldBudget: s.goldBudget,
        recents: s.recents,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          apiKey: p.apiKey?.trim() ? p.apiKey : DEFAULT_API_TOKEN,
        };
      },
    },
  ),
);
