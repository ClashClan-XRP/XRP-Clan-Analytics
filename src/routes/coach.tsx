import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CoachReportView } from "@/components/coach-report";
import { DeckStrip } from "@/components/card-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { lookupBattles, lookupPlayer } from "@/lib/cr/api";
import { analyzeReplay, archetypeOf } from "@/lib/cr/coach";
import { DEFAULT_PLAYER_TAG } from "@/lib/cr/defaults";
import type { Battle, PlayerProfile } from "@/lib/cr/types";
import { useAppStore } from "@/lib/store";
import { formatFetched } from "@/lib/utils";

type Search = { tag?: string };

export const Route = createFileRoute("/coach")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    tag: typeof s.tag === "string" ? s.tag : undefined,
  }),
  component: CoachPage,
});

function CoachPage() {
  const search = Route.useSearch();
  const apiKey = useAppStore((s) => s.apiKey);
  const stored = useAppStore((s) => s.player);
  const setPlayer = useAppStore((s) => s.setPlayer);
  const remember = useAppStore((s) => s.remember);
  const [tag, setTag] = useState(search.tag ?? stored?.tag ?? DEFAULT_PLAYER_TAG);
  const [player, setLocal] = useState<PlayerProfile | null>(null);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState(0);

  async function load(next: string) {
    setBusy(true);
    setError(null);
    const [p, b] = await Promise.all([
      lookupPlayer({ data: { tag: next, apiKey: apiKey || undefined } }),
      lookupBattles({ data: { tag: next, apiKey: apiKey || undefined } }),
    ]);
    setBusy(false);
    if (!p.ok) {
      setError(p.error);
      return;
    }
    setLocal(p.data);
    setPlayer(p.data);
    remember({ kind: "player", tag: p.data.tag, name: p.data.name });
    setBattles(b.ok ? b.data : []);
    setSelected(0);
  }

  useEffect(() => {
    const next = search.tag || stored?.tag || DEFAULT_PLAYER_TAG;
    setTag(next);
    void load(next);
    // Fresh battle log on every visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.tag]);

  const battle = battles[selected];
  const report = useMemo(() => (battle ? analyzeReplay(battle) : null), [battle]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Replay coach</p>
          <h1 className="mt-1 font-display text-5xl leading-none">VOD the last 25</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Optimal line vs their eight, timestamped deviations, impact on the result, a course of action, and pro clips
            of the technique.
          </p>
        </div>
        <form
          className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto"
          onSubmit={(e) => {
            e.preventDefault();
            void load(tag);
          }}
        >
          <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="#PLAYER" className="sm:w-56" />
          <div className="flex gap-2">
            <Button type="submit" disabled={busy} className="flex-1 sm:flex-none">
              {busy ? "Loading…" : "Load replays"}
            </Button>
            <Button type="button" variant="secondary" disabled={busy} aria-label="Refresh" onClick={() => void load(tag)}>
              <RefreshCw className={busy ? "animate-spin" : undefined} />
            </Button>
          </div>
        </form>
      </header>

      {error ? (
        <Card>
          <CardContent>
            <p className="text-sm text-loss">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      {player ? (
        <p className="text-sm text-muted-foreground">
          {player.name} · {player.tag} · {battles.length} replays · {formatFetched(player.fetchedAt)}
        </p>
      ) : null}

      {busy && !battles.length ? (
        <div className="grid gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-64" />
        </div>
      ) : null}

      {battles.length ? (
        <section>
          <h2 className="mb-3 font-display text-3xl">Replays</h2>
          <div className="max-h-72 overflow-y-auto rounded-xl border border-border">
            <div className="flex flex-col">
              {battles.map((b, i) => {
                const active = i === selected;
                return (
                  <button
                    key={`${b.battleTime ?? i}-${b.opponentName}`}
                    type="button"
                    onClick={() => setSelected(i)}
                    className={`border-b border-border px-4 py-3 text-left last:border-b-0 ${active ? "bg-elevated" : "hover:bg-secondary/60"}`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={b.win ? "win" : "loss"}>{b.win ? "Win" : "Loss"}</Badge>
                          <span className="font-display text-xl leading-none">
                            {b.crowns}–{b.opponentCrowns} vs {b.opponentName}
                          </span>
                          <span className="text-xs text-muted-foreground">{b.gameMode}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {archetypeOf(b.deck)} vs {archetypeOf(b.opponentDeck)}
                          {b.battleTime ? ` · ${new Date(b.battleTime).toLocaleString()}` : ""}
                        </p>
                      </div>
                      <DeckStrip cards={b.opponentDeck} size="sm" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : !busy ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">No battle log on this tag. Scout a live player.</p>
          </CardContent>
        </Card>
      ) : null}

      {battle && report ? <CoachReportView battle={battle} report={report} /> : null}
    </div>
  );
}
