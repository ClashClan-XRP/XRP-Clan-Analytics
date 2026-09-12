import { CardTile, DeckStrip } from "@/components/card-tile";
import { CopyDeckButton } from "@/components/copy-deck-button";
import { PlayerName } from "@/components/player-name";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { FavoriteCard, PairStrategy, PlayerDeckPlan } from "@/lib/cr/pairings";
import { formatPct } from "@/lib/utils";

function FavStrip({ favs }: { favs: FavoriteCard[] }) {
  if (!favs.length) return <p className="text-sm text-muted-foreground">No battle log in the last 25 games.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {favs.map((f) => (
        <div key={f.key} className="flex items-center gap-1.5">
          <CardTile cardKey={f.key} size="sm" />
          <span className="text-[11px] tabular text-muted-foreground">
            {f.count}/{f.of}
          </span>
        </div>
      ))}
    </div>
  );
}

function PlayerPlan({ plan }: { plan: PlayerDeckPlan }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="font-display text-2xl leading-none">
          <PlayerName name={plan.playerName} tag={plan.playerTag} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {plan.deckName} · {plan.archetype} · {plan.elixir.toFixed(1)} elixir
        </p>
      </div>
      <p className="text-sm text-muted-foreground">{plan.summary}</p>
      <DeckStrip
        cards={plan.cards.map((c) => c.key)}
        evo={plan.cards.filter((c) => c.evo).map((c) => c.key)}
        levels={Object.fromEntries(plan.cards.filter((c) => typeof c.level === "number").map((c) => [c.key, c.level!]))}
      />
      <CopyDeckButton cards={plan.cards.map((c) => c.key)} label={plan.deckName} />
      <ul className="grid gap-2 sm:grid-cols-2">
        {plan.cards.map((c) => (
          <li key={c.key} className="flex items-center gap-2">
            <CardTile cardKey={c.key} evo={c.evo} level={c.level} size="sm" />
            <div className="min-w-0">
              <div className="truncate text-sm text-foreground">
                {c.name}
                {c.evo ? " · evo" : ""}
                {c.champion ? " · champ" : ""}
                {typeof c.level === "number" ? ` · ${c.level}` : ""}
              </div>
              <div className="truncate text-xs text-muted-foreground">Intended use: {c.use}</div>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{plan.evoNote}</p>
      {plan.championNote ? <p className="text-xs text-muted-foreground">{plan.championNote}</p> : null}

      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Critical plays</h4>
        <ul className="mt-2 space-y-1.5">
          {plan.interactions.map((line) => (
            <li key={line} className="flex gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Opening</h4>
        <p className="mt-2 text-sm text-foreground">{plan.start.optimal}</p>
        <ul className="mt-2 space-y-1.5">
          {plan.start.alternatives.map((line) => (
            <li key={line} className="text-sm text-muted-foreground">
              Alt: {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PairStrategyCard({ plan }: { plan: PairStrategy }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-3xl leading-none">{plan.strategy}</h3>
              <Badge variant="cyan">2v2</Badge>
            </div>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{plan.why}</p>
          </div>
          <div className="text-right">
            <div className="font-display text-4xl tabular leading-none text-primary">{plan.score}</div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {formatPct(plan.winRate)} duo snapshot
            </div>
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <PlayerPlan plan={plan.a} />
          <PlayerPlan plan={plan.b} />
        </div>
      </CardContent>
    </Card>
  );
}

export function FavoritesPanel({
  name,
  tag,
  favs,
  duo,
}: {
  name: string;
  tag: string;
  favs: FavoriteCard[];
  duo: { wins: number; n: number; pct: number } | null;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Last 25 favorites</div>
            <div className="font-display text-2xl leading-none">
              <PlayerName name={name} tag={tag} />
            </div>
          </div>
          {duo ? (
            <div className="text-right text-xs text-muted-foreground">
              2v2 {duo.wins}/{duo.n} · {formatPct(duo.pct, 0)}
            </div>
          ) : null}
        </div>
        <FavStrip favs={favs} />
      </CardContent>
    </Card>
  );
}
