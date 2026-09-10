import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FavoritesPanel, PairStrategyCard } from "@/components/pair-plan";
import { PlayerName } from "@/components/player-name";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { lookupClan, lookupPairIntel } from "@/lib/cr/api";
import { DEFAULT_CLAN_TAG } from "@/lib/cr/defaults";
import { duoRecord, favoriteCards, recommendPairStrategies, type PairStrategy } from "@/lib/cr/pairings";
import { useAppStore } from "@/lib/store";
import { formatInt } from "@/lib/utils";
import type { Battle, PlayerProfile } from "@/lib/cr/types";

type Search = { tag?: string };

export const Route = createFileRoute("/clan")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    tag: typeof s.tag === "string" ? s.tag : undefined,
  }),
  component: ClanPage,
});

function ClanPage() {
  const search = Route.useSearch();
  const apiKey = useAppStore((s) => s.apiKey);
  const clan = useAppStore((s) => s.clan);
  const setClan = useAppStore((s) => s.setClan);
  const remember = useAppStore((s) => s.remember);
  const [tag, setTag] = useState(search.tag ?? clan?.tag ?? DEFAULT_CLAN_TAG);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [pick, setPick] = useState<string[]>([]);
  const [pairBusy, setPairBusy] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);
  const [pairPlayers, setPairPlayers] = useState<{
    a: PlayerProfile;
    b: PlayerProfile;
    battlesA: Battle[];
    battlesB: Battle[];
  } | null>(null);
  const [plans, setPlans] = useState<PairStrategy[]>([]);

  async function load(next: string) {
    setBusy(true);
    setError(null);
    setHint(null);
    const res = await lookupClan({ data: { tag: next, apiKey: apiKey || undefined } });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      setHint(res.hint ?? null);
      return;
    }
    setClan(res.data);
    remember({ kind: "clan", tag: res.data.tag, name: res.data.name });
    setPick([]);
    setPlans([]);
    setPairPlayers(null);
  }

  useEffect(() => {
    if (search.tag) {
      setTag(search.tag);
      void load(search.tag);
    } else if (!clan) {
      void load(DEFAULT_CLAN_TAG);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.tag]);

  useEffect(() => {
    if (pick.length !== 2) {
      setPlans([]);
      setPairPlayers(null);
      setPairError(null);
      return;
    }
    let cancelled = false;
    setPairBusy(true);
    setPairError(null);
    void (async () => {
      const res = await lookupPairIntel({
        data: { tagA: pick[0]!, tagB: pick[1]!, apiKey: apiKey || undefined },
      });
      if (cancelled) return;
      setPairBusy(false);
      if (!res.ok) {
        setPairError(res.error);
        return;
      }
      setPairPlayers({
        a: res.data.playerA,
        b: res.data.playerB,
        battlesA: res.data.battlesA,
        battlesB: res.data.battlesB,
      });
      setPlans(recommendPairStrategies(res.data.playerA, res.data.playerB, res.data.battlesA, res.data.battlesB));
    })();
    return () => {
      cancelled = true;
    };
  }, [apiKey, pick]);

  const c = clan;
  const favA = useMemo(() => (pairPlayers ? favoriteCards(pairPlayers.battlesA) : []), [pairPlayers]);
  const favB = useMemo(() => (pairPlayers ? favoriteCards(pairPlayers.battlesB) : []), [pairPlayers]);

  function togglePair(memberTag: string) {
    setPick((prev) => {
      if (prev.includes(memberTag)) return prev.filter((t) => t !== memberTag);
      if (prev.length < 2) return [...prev, memberTag];
      return [prev[1]!, memberTag];
    });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">2v2 module</p>
          <h1 className="mt-1 font-display text-5xl leading-none">Pair the right two</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Toggle Pair on two clanmates. Plans use collections, levels, evos, champions, last-25 favorites, and this
            week's 2v2 meta.
          </p>
        </div>
        <form
          className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto"
          onSubmit={(e) => {
            e.preventDefault();
            void load(tag);
          }}
        >
          <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="#CLAN" className="sm:w-56" />
          <Button type="submit" disabled={busy}>
            {busy ? "Loading…" : "Load clan"}
          </Button>
        </form>
      </header>

      {error ? (
        <Card>
          <CardContent>
            <p className="text-sm text-loss">{error}</p>
            {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      {!c ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32 md:col-span-2" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <Card className="md:col-span-2">
              <CardContent>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-4xl leading-none">{c.name}</div>
                    <div className="text-sm text-muted-foreground">{c.tag}</div>
                  </div>
                  <Badge variant="cyan">{c.source}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Clan score</div>
                <div className="font-display text-4xl tabular">{formatInt(c.clanScore)}</div>
                <div className="text-sm text-muted-foreground">{formatInt(c.warTrophies)} war trophies</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Donations / week</div>
                <div className="font-display text-4xl tabular">{formatInt(c.donationsPerWeek)}</div>
                <div className="text-sm text-muted-foreground">{c.members.length} members</div>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-display text-3xl">Roster</h2>
              <p className="text-sm text-muted-foreground">
                {pick.length === 0 && "Toggle two names to generate pair-up plans. Hover or tap a name for the tag."}
                {pick.length === 1 && "Select one more teammate."}
                {pick.length === 2 && "Two locked in — plans below."}
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-secondary text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Player</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">King</th>
                    <th className="px-4 py-3 font-medium">Trophies</th>
                    <th className="px-4 py-3 font-medium">Donations</th>
                    <th className="px-4 py-3 font-medium">2v2</th>
                  </tr>
                </thead>
                <tbody>
                  {c.members.map((m) => {
                    const idx = pick.indexOf(m.tag);
                    return (
                      <tr key={m.tag} className={`border-t border-border ${idx >= 0 ? "bg-primary/8" : ""}`}>
                        <td className="px-4 py-3">
                          <PlayerName name={m.name} tag={m.tag} className="text-foreground" />
                        </td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">{m.role}</td>
                        <td className="px-4 py-3 tabular">{m.expLevel > 0 ? m.expLevel : "—"}</td>
                        <td className="px-4 py-3 tabular">{formatInt(m.trophies)}</td>
                        <td className="px-4 py-3 tabular">{formatInt(m.donations)}</td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant={idx >= 0 ? "default" : "outline"}
                            onClick={() => togglePair(m.tag)}
                            aria-pressed={idx >= 0}
                          >
                            {idx >= 0 ? `P${idx + 1}` : "Pair"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="font-display text-3xl">Pair-up plans</h2>
            {pick.length < 2 ? (
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Toggle Pair on two members. Each plan splits by strategy: how both of you implement it, every card’s
                    job, critical interactions, and opening lines if the start cycle is wrong.
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {pairBusy ? (
              <div className="grid gap-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-96" />
              </div>
            ) : null}

            {pairError ? (
              <Card>
                <CardContent>
                  <p className="text-sm text-loss">{pairError}</p>
                </CardContent>
              </Card>
            ) : null}

            {pairPlayers && !pairBusy ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FavoritesPanel
                  name={pairPlayers.a.name}
                  tag={pairPlayers.a.tag}
                  favs={favA}
                  duo={duoRecord(pairPlayers.battlesA)}
                />
                <FavoritesPanel
                  name={pairPlayers.b.name}
                  tag={pairPlayers.b.tag}
                  favs={favB}
                  duo={duoRecord(pairPlayers.battlesB)}
                />
              </div>
            ) : null}

            {plans.map((plan) => (
              <PairStrategyCard key={plan.id} plan={plan} />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
