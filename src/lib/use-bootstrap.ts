import { useEffect } from "react";
import { bootstrapDefaults } from "@/lib/cr/api";
import { DEFAULT_PLAYER_TAG } from "@/lib/cr/defaults";
import { useAppStore } from "@/lib/store";

/** Fresh clan + player lookup on every visit (not a cached snapshot). */
export function useBootstrap() {
  const apiKey = useAppStore((s) => s.apiKey);
  const bootstrapped = useAppStore((s) => s.bootstrapped);
  const setBootstrapped = useAppStore((s) => s.setBootstrapped);
  const setPlayer = useAppStore((s) => s.setPlayer);
  const setClan = useAppStore((s) => s.setClan);
  const remember = useAppStore((s) => s.remember);

  useEffect(() => {
    if (bootstrapped) return;
    let cancelled = false;
    void (async () => {
      const recents = useAppStore.getState().recents;
      const lastPlayer = recents.find((r) => r.kind === "player")?.tag ?? DEFAULT_PLAYER_TAG;
      const res = await bootstrapDefaults({
        data: { apiKey: apiKey || undefined, playerTag: lastPlayer },
      });
      if (cancelled) return;
      if (res.ok) {
        setClan(res.data.clan);
        setPlayer(res.data.player);
        remember({ kind: "clan", tag: res.data.clan.tag, name: res.data.clan.name });
        remember({ kind: "player", tag: res.data.player.tag, name: res.data.player.name });
      }
      setBootstrapped(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [apiKey, bootstrapped, remember, setBootstrapped, setClan, setPlayer]);
}
