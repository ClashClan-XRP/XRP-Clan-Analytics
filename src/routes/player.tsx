import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DeckStrip } from "@/components/card-tile";
import { DeckFitCard, ReasonList } from "@/components/deck-fit";
import { PlayerName } from "@/components/player-name";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { lookupPlayer, askCoach } from "@/lib/cr/api";
import { currentDeckAnalysis, recommendLadder } from "@/lib/cr/analysis";
import { CARDS_BY_KEY } from "@/lib/cr/catalog";
import { DEFAULT_CLAN_TAG, DEFAULT_PLAYER_TAG } from "@/lib/cr/defaults";
import { useAppStore } from "@/lib/store";
import { formatInt, formatPct } from "@/lib/utils";

type Search = { tag?: string };

export const Route = createFileRoute("/player")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    tag: typeof s.tag === "string" ? s.tag : undefined,
  }),
  component: PlayerPage,
});

function PlayerPage() {
  const search = Route.useSearch();
  const apiKey = useAppStore((s) => s.apiKey);
  const player = useAppStore((s) => s.player);
  const setPlayer = useAppStore((s) => s.setPlayer);
  const remember = useAppStore((s) => s.remember);
  const [tag, setTag] = useState(search.tag ?? player?.tag ?? DEFAULT_PLAYER_TAG);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [coach, setCoach] = useState<string | null>(null);
  const [coachBusy, setCoachBusy] = useState(false);

  async function scout(nextTag: string) {
    setBusy(true);
    setError(null);
    setHint(null);
    const res = await lookupPlayer({ data: { tag: nextTag, apiKey: apiKey || undefined } });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      setHint(res.hint ?? null);
      return;
    }
    setPlayer(res.data);
    remember({ kind: "player", tag: res.data.tag, name: res.data.name });
  }

  useEffect(() => {
    if (search.tag) {
      setTag(search.tag);
      void scout(search.tag);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.tag]);

  useEffect(() => {
    if (!search.tag && player?.tag && tag === DEFAULT_PLAYER_TAG && player.tag !== DEFAULT_PLAYER_TAG) {
      setTag(player.tag);
    }
  }, [player?.tag, search.tag, tag]);

  const p = player;
  const ladder = useMemo(() => (p ? recommendLadder(p) : []), [p]);
  const current = useMemo(() => (p ? currentDeckAnalysis(p) : null), [p]);
  const battlesNote = p?.source === "demo" ? "Snapshot collection · live lookup unavailable for this tag" : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Player scout</p>
          <h1 className="mt-1 font-display text-5xl leading-none">Collection vs meta</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Levels, evolutions, heroes, and champions decide which ladder eight you should actually upgrade toward.
          </p>
        </div>
        <form
          className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto"
          onSubmit={(e) => {
            e.preventDefault();
            void scout(tag);
          }}
        >
          <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="#PLAYER" className="sm:w-56" />
          <Button type="submit" disabled={busy}>
            {busy ? "Scouting…" : "Scout"}
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

      {p ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <Card className="md:col-span-2">
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-4xl leading-none">
                      <PlayerName name={p.name} tag={p.tag} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {p.arena}
                      {p.clan ? ` · ${p.clan.name}` : ""}
                    </div>
                  </div>
                  <Badge variant="cyan">{p.source}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Trophies" value={formatInt(p.trophies)} />
                  <Stat label="Best" value={formatInt(p.bestTrophies)} />
                  <Stat label="King" value={String(p.expLevel)} />
                  <Stat label="Win rate" value={p.battleCount ? formatPct((p.wins / p.battleCount) * 100, 0) : "—"} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Path trophies</div>
                <div className="font-display text-4xl tabular">{formatInt(p.pathTrophies ?? 0)}</div>
                <div className="text-sm text-muted-foreground">{p.league ?? "Unranked season"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Heroes unlocked</div>
                <div className="font-display text-4xl tabular">{p.heroes.length}</div>
                <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {p.heroes.map((h) => CARDS_BY_KEY[h]?.name ?? h).join(" · ") || "None marked"}
                </div>
              </CardContent>
            </Card>
          </section>

          {current ? (
            <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Queued eight</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <DeckStrip cards={p.currentDeck} evo={p.currentEvo} size="lg" />
                  <p className="text-sm text-muted-foreground">
                    {current.deck.elixir.toFixed(1)} average elixir
                    {p.currentHero ? ` · ${CARDS_BY_KEY[p.currentHero]?.name}` : ""}
                    {p.currentChampion ? ` · ${CARDS_BY_KEY[p.currentChampion]?.name}` : ""}
                  </p>
                  <ReasonList reasons={current.coverage} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Vs this week's meta</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {current.vsMeta.slice(0, 6).map((m) => (
                    <div key={m.deck.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-foreground">{m.deck.name}</span>
                      <span className={m.score >= 54 ? "tabular text-win" : m.score <= 44 ? "tabular text-loss" : "tabular text-muted-foreground"}>
                        {m.score}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ) : null}

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-3xl">Ladder recommendations</h2>
              <Button
                variant="secondary"
                disabled={coachBusy}
                onClick={async () => {
                  setCoachBusy(true);
                  const top = ladder.slice(0, 4).map((f) => `${f.deck.name} (fit ${f.score})`).join(", ");
                  const res = await askCoach({
                    data: {
                      prompt: `Player ${p.name}, king ${p.expLevel}, trophies ${p.trophies}, heroes ${p.heroes.join("/") || "none"}. Best engine fits: ${top}. Current deck: ${p.currentDeck.join(", ")}. Give a short plan: 1 ladder deck to main, 1 backup, 3 upgrade targets, and a 2v2 partner style. No preamble.`,
                    },
                  });
                  setCoachBusy(false);
                  setCoach(res.ok ? res.text : res.error);
                }}
              >
                {coachBusy ? "Asking coach…" : "Ask coach"}
              </Button>
            </div>
            {coach ? (
              <Card className="mb-4">
                <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">{coach}</CardContent>
              </Card>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-2">
              {ladder.slice(0, 4).map((fit) => (
                <DeckFitCard key={fit.deck.id} fit={fit} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-1 font-display text-3xl">2v2 pair-up</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Pair{" "}
              <PlayerName name={p.name} tag={p.tag} className="text-foreground" /> with a clanmate on the Clan page.
              Toggle two names to generate strategy-split lists from collections, levels, evos, champions, and the last
              25 games.
            </p>
            <Button asChild>
              <Link to="/clan" search={{ tag: p.clan?.tag ?? DEFAULT_CLAN_TAG }}>
                Open 2v2 module
              </Link>
            </Button>
          </section>

          {battlesNote ? <p className="text-xs text-muted-foreground">{battlesNote}</p> : null}
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-2xl tabular leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
