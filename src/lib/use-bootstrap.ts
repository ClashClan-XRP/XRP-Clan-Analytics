import { useEffect } from "react";
import { bootstrapDefaults } from "@/lib/cr/api";
import { useAppStore } from "@/lib/store";

/** Load CryptoClan-$XRP and a random member once per session. */
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
      const res = await bootstrapDefaults({ data: { apiKey: apiKey || undefined } });
      if (cancelled) return;
      if (res.ok) {
        const state = useAppStore.getState();
        if (!state.clan) {
          setClan(res.data.clan);
          remember({ kind: "clan", tag: res.data.clan.tag, name: res.data.clan.name });
        }
        if (!state.player) {
          setPlayer(res.data.player);
          remember({ kind: "player", tag: res.data.player.tag, name: res.data.player.name });
        }
      }
      setBootstrapped(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [apiKey, bootstrapped, remember, setBootstrapped, setClan, setPlayer]);
}
