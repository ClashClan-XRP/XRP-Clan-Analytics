import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { DeckStrip } from "@/components/card-tile";
import { PlayerName } from "@/components/player-name";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { recommendLadder } from "@/lib/cr/analysis";
import { APP_NAME, DEFAULT_CLAN_NAME, DEFAULT_CLAN_TAG, DEFAULT_PLAYER_TAG } from "@/lib/cr/defaults";
import { META_AS_OF, META_DECKS, META_LABEL } from "@/lib/cr/meta";
import { useAppStore } from "@/lib/store";
import { formatFetched, formatInt } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const navigate = useNavigate();
  const player = useAppStore((s) => s.player);
  const bootstrapped = useAppStore((s) => s.bootstrapped);
  const recents = useAppStore((s) => s.recents);
  const [tag, setTag] = useState("");
  const fits = player ? recommendLadder(player).slice(0, 3) : [];
  const top = [...META_DECKS]
    .sort((a, b) => b.winRate * Math.log10(b.sample) - a.winRate * Math.log10(a.sample))
    .slice(0, 3);
  const placeholder = player?.tag ?? DEFAULT_PLAYER_TAG;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">{META_LABEL}</p>
          <h1 className="mt-3 font-display text-5xl leading-[0.9] text-foreground sm:text-6xl md:text-7xl">
            Know the meta.
            <br />
            Field the right eight.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            {APP_NAME} scores {DEFAULT_CLAN_NAME} collections against the current ladder, ranks upgrades by gold
            efficiency, and pairs clanmates for 2v2. Snapshot {META_AS_OF}.
          </p>
          <form
            className="mt-6 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              const t = tag.trim() || player?.tag || DEFAULT_PLAYER_TAG;
              void navigate({ to: "/player", search: { tag: t } });
            }}
          >
            <Input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder={`Player tag · ${placeholder}`}
              className="sm:max-w-xs"
            />
            <Button type="submit">
              Scout player
              <ArrowRight />
            </Button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => void navigate({ to: "/player", search: { tag: player?.tag ?? DEFAULT_PLAYER_TAG } })}
            >
              Scout loaded member
            </Button>
            <Button variant="ghost" onClick={() => void navigate({ to: "/clan", search: { tag: DEFAULT_CLAN_TAG } })}>
              {DEFAULT_CLAN_NAME}
            </Button>
          </div>
        </div>
        {!player && !bootstrapped ? (
          <Skeleton className="h-64" />
        ) : player ? (
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Loaded member</div>
                  <div className="font-display text-3xl leading-none">
                    <PlayerName name={player.name} tag={player.tag} />
                  </div>
                  <div className="text-sm text-muted-foreground">{player.clan?.name ?? DEFAULT_CLAN_NAME}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={player.source === "live" ? "cyan" : "secondary"}>{player.source}</Badge>
                  <span className="text-[11px] text-muted-foreground">{formatFetched(player.fetchedAt)}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Trophies" value={formatInt(player.trophies)} />
                <Stat label="King" value={String(player.expLevel)} />
                <Stat label="Wins" value={formatInt(player.wins)} />
              </div>
              <DeckStrip cards={player.currentDeck} evo={player.currentEvo} />
              <p className="text-sm text-muted-foreground">
                Best current fit: <span className="text-foreground">{fits[0]?.deck.name}</span> · score {fits[0]?.score}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Could not load {DEFAULT_CLAN_NAME}. Scout a tag or open the clan roster.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <h2 className="font-display text-2xl leading-none md:text-3xl">This week's ladder</h2>
          <Link to="/meta" className="text-sm text-primary hover:underline">
            Full meta lab
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {top.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-2xl leading-none">{d.name}</div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{d.archetype}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl tabular text-win">{d.winRate.toFixed(1)}%</div>
                    <div className="text-[11px] text-muted-foreground">win rate</div>
                  </div>
                </div>
                <DeckStrip cards={d.cards} evo={d.evo} size="sm" />
                <p className="text-sm text-muted-foreground">{d.notes}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link to="/upgrades" className="block">
          <Card className="h-full transition-colors duration-150 hover:border-primary/40">
            <CardContent>
              <div className="font-display text-2xl">Upgrade path</div>
              <p className="mt-1 text-sm text-muted-foreground">Spend gold on the cards that actually move your best decks.</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/clan" className="block">
          <Card className="h-full transition-colors duration-150 hover:border-primary/40">
            <CardContent>
              <div className="font-display text-2xl">2v2 pairings</div>
              <p className="mt-1 text-sm text-muted-foreground">Toggle Pair on two clanmates for strategy-split lists and openings.</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/cards" className="block">
          <Card className="h-full transition-colors duration-150 hover:border-primary/40">
            <CardContent>
              <div className="font-display text-2xl">Card intel</div>
              <p className="mt-1 text-sm text-muted-foreground">Usage, win rate, evolutions, and which meta lists a card belongs on.</p>
            </CardContent>
          </Card>
        </Link>
      </section>

      {recents.length ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>Recent</span>
          {recents.map((r) =>
            r.kind === "player" ? (
              <PlayerName key={`${r.kind}-${r.tag}`} name={r.name} tag={r.tag} />
            ) : (
              <span key={`${r.kind}-${r.tag}`}>
                {r.name} {r.tag}
              </span>
            ),
          )}
        </p>
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
