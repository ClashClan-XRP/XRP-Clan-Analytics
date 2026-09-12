import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FavoritesPanel, PairStrategyCard } from "@/components/pair-plan";
import { PlayerName } from "@/components/player-name";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { WarDecksPanel, WarStatus } from "@/components/war-board";
import { lookupBattles, lookupClan, lookupPairIntel, lookupPlayer, lookupRiverLog, lookupRiverRace } from "@/lib/cr/api";
import { DEFAULT_CLAN_TAG } from "@/lib/cr/defaults";
import { duoRecord, favoriteCards, recommendPairStrategies, type PairStrategy } from "@/lib/cr/pairings";
import { memberRaceLine, recommendWarDecks, type WarDeckPick } from "@/lib/cr/wars";
import { useAppStore } from "@/lib/store";
import { cn, formatInt, formatTag } from "@/lib/utils";
import type { Battle, ClanMember, PlayerProfile, RiverLogEntry, RiverRace } from "@/lib/cr/types";

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
  const [race, setRace] = useState<RiverRace | null>(null);
  const [log, setLog] = useState<RiverLogEntry[]>([]);
  const [warTag, setWarTag] = useState<string | null>(null);
  const [warPlayer, setWarPlayer] = useState<PlayerProfile | null>(null);
  const [warPicks, setWarPicks] = useState<WarDeckPick[]>([]);
  const [warBusy, setWarBusy] = useState(false);

  async function load(next: string) {
    setBusy(true);
    setError(null);
    setHint(null);
    const res = await lookupClan({ data: { tag: next, apiKey: apiKey || undefined } });
    if (!res.ok) {
      setBusy(false);
      setError(res.error);
      setHint(res.hint ?? null);
      return;
    }
    setClan(res.data);
    remember({ kind: "clan", tag: res.data.tag, name: res.data.name });
    setPick([]);
    setPlans([]);
    setPairPlayers(null);
    setWarTag(null);
    setWarPlayer(null);
    setWarPicks([]);
    const [raceRes, logRes] = await Promise.all([
      lookupRiverRace({ data: { tag: res.data.tag, apiKey: apiKey || undefined } }),
      lookupRiverLog({ data: { tag: res.data.tag, apiKey: apiKey || undefined } }),
    ]);
    setRace(raceRes.ok ? raceRes.data : null);
    setLog(logRes.ok ? logRes.data : []);
    setBusy(false);
  }

  useEffect(() => {
    const next = search.tag || clan?.tag || DEFAULT_CLAN_TAG;
    setTag(next);
    void load(next);
    // Fresh roster + river race on every visit.
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

  useEffect(() => {
    if (!warTag) {
      setWarPlayer(null);
      setWarPicks([]);
      return;
    }
    let cancelled = false;
    setWarBusy(true);
    void (async () => {
      const [p, b] = await Promise.all([
        lookupPlayer({ data: { tag: warTag, apiKey: apiKey || undefined } }),
        lookupBattles({ data: { tag: warTag, apiKey: apiKey || undefined } }),
      ]);
      if (cancelled) return;
      setWarBusy(false);
      if (!p.ok) {
        setWarPlayer(null);
        setWarPicks([]);
        return;
      }
      const battles = b.ok ? b.data : [];
      setWarPlayer(p.data);
      setWarPicks(recommendWarDecks(p.data, battles));
    })();
    return () => {
      cancelled = true;
    };
  }, [apiKey, warTag]);

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

  function openWar(memberTag: string) {
    setWarTag(memberTag);
    const el = document.getElementById("war-decks");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Clan module</p>
          <h1 className="mt-1 font-display text-5xl leading-none">Roster, wars, pairs</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Pair two clanmates for 2v2, or open War on a row for four fitted war decks. Scroll the table sideways — Pair,
            War, and name stay put.
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
            <h2 className="mb-3 font-display text-3xl">Clan wars</h2>
            <WarStatus clan={c} race={race} log={log} />
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-display text-3xl">Roster</h2>
              <p className="text-sm text-muted-foreground">
                {pick.length === 0 && "Pair two names for 2v2. War loads four war decks for that member."}
                {pick.length === 1 && "Select one more teammate."}
                {pick.length === 2 && "Two locked in — plans below."}
              </p>
            </div>
            <RosterTable
              members={c.members}
              pick={pick}
              warTag={warTag}
              race={race}
              onPair={togglePair}
              onWar={openWar}
            />
          </section>

          <section id="war-decks" className="flex flex-col gap-4">
            <WarDecksPanel player={warPlayer} picks={warPicks} busy={warBusy} />
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

function RosterTable({
  members,
  pick,
  warTag,
  race,
  onPair,
  onWar,
}: {
  members: ClanMember[];
  pick: string[];
  warTag: string | null;
  race: RiverRace | null;
  onPair: (tag: string) => void;
  onWar: (tag: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[52rem] border-separate border-spacing-0 text-left text-sm">
        <thead className="bg-secondary text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="sticky left-0 z-20 bg-secondary px-2 py-3 font-medium">Pair</th>
            <th className="sticky left-[4.75rem] z-20 bg-secondary px-2 py-3 font-medium">War</th>
            <th className="sticky left-[9.5rem] z-20 bg-secondary px-3 py-3 font-medium shadow-[2px_0_0_0_var(--color-border)]">
              Player
            </th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">King</th>
            <th className="px-4 py-3 font-medium">Trophies</th>
            <th className="px-4 py-3 font-medium">Donations</th>
            <th className="px-4 py-3 font-medium">Fame</th>
            <th className="px-4 py-3 font-medium">Today</th>
            <th className="px-4 py-3 font-medium">Arena</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const idx = pick.indexOf(m.tag);
            const warOn = warTag === m.tag;
            const line = memberRaceLine(race, m.tag);
            const hi = idx >= 0 || warOn;
            const sticky = hi ? "bg-elevated" : "bg-card";
            return (
              <tr key={m.tag} className={cn("border-t border-border", hi ? "bg-elevated" : "bg-card")}>
                <td className={cn("sticky left-0 z-10 w-[4.75rem] px-2 py-2", sticky)}>
                  <Button
                    size="sm"
                    variant={idx >= 0 ? "default" : "outline"}
                    onClick={() => onPair(m.tag)}
                    aria-pressed={idx >= 0}
                  >
                    {idx >= 0 ? `P${idx + 1}` : "Pair"}
                  </Button>
                </td>
                <td className={cn("sticky left-[4.75rem] z-10 w-[4.75rem] px-2 py-2", sticky)}>
                  <Button size="sm" variant={warOn ? "default" : "outline"} onClick={() => onWar(m.tag)} aria-pressed={warOn}>
                    War
                  </Button>
                </td>
                <td className={cn("sticky left-[9.5rem] z-10 min-w-[13rem] px-3 py-2 shadow-[2px_0_0_0_var(--color-border)]", sticky)}>
                  <div className="flex items-center gap-1.5">
                    <PlayerName name={m.name} tag={m.tag} className="text-foreground" />
                    <CopyTag tag={formatTag(m.tag)} />
                  </div>
                </td>
                <td className="px-4 py-2 capitalize text-muted-foreground">{m.role}</td>
                <td className="px-4 py-2 tabular">{m.expLevel > 0 ? m.expLevel : "—"}</td>
                <td className="px-4 py-2 tabular">{formatInt(m.trophies)}</td>
                <td className="px-4 py-2 tabular">{formatInt(m.donations)}</td>
                <td className="px-4 py-2 tabular">{line ? formatInt(line.fame) : "—"}</td>
                <td className="px-4 py-2 tabular">{line ? `${line.decksUsedToday}/4` : "—"}</td>
                <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">{m.arena || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CopyTag({ tag }: { tag: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      title={`Copy ${tag}`}
      aria-label={`Copy ${tag}`}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(tag);
          setOk(true);
          window.setTimeout(() => setOk(false), 1400);
        } catch {
          setOk(false);
        }
      }}
    >
      {ok ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}
