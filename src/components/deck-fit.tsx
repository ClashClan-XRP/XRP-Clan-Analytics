import { CardTile, DeckStrip } from "@/components/card-tile";
import { CopyDeckButton } from "@/components/copy-deck-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CARDS_BY_KEY, deckUrl } from "@/lib/cr/catalog";
import type { DeckFit, Reason } from "@/lib/cr/types";
import { cn } from "@/lib/utils";

export function ReasonList({ reasons }: { reasons: Reason[] }) {
  return (
    <ul className="space-y-1.5">
      {reasons.map((r) => (
        <li key={r.label} className="flex items-start gap-2 text-sm">
          <span
            className={cn(
              "mt-1 size-1.5 shrink-0 rounded-full",
              r.tone === "good" && "bg-win",
              r.tone === "warn" && "bg-warn",
              r.tone === "bad" && "bg-loss",
              r.tone === "neutral" && "bg-subtle",
            )}
          />
          <span className="text-muted-foreground">{r.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function DeckFitCard({ fit }: { fit: DeckFit }) {
  const d = fit.deck;
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-2xl leading-none">{d.name}</h3>
              <Badge variant={fit.playable ? "win" : "warn"}>{fit.playable ? "Playable" : "Gaps"}</Badge>
              {d.f2p ? <Badge>F2P</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {d.archetype} · {d.elixir.toFixed(1)} elixir · {d.winRate.toFixed(1)}% win · {d.useRate.toFixed(1)}% use
            </p>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl tabular leading-none text-primary">{fit.score}</div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">fit</div>
          </div>
        </div>
        <Progress value={fit.score} />
        <DeckStrip cards={d.cards} evo={d.evo} />
        <CopyDeckButton cards={d.cards} label={d.name} />
        {d.hero || d.champion ? (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {d.hero ? (
              <span className="inline-flex items-center gap-1.5">
                <CardTile cardKey={d.hero} size="sm" />
                Hero {CARDS_BY_KEY[d.hero]?.name}
              </span>
            ) : null}
            {d.champion ? (
              <span className="inline-flex items-center gap-1.5">
                <CardTile cardKey={d.champion} size="sm" />
                {CARDS_BY_KEY[d.champion]?.name}
              </span>
            ) : null}
          </div>
        ) : null}
        <p className="text-sm text-muted-foreground">{d.notes}</p>
        <ReasonList reasons={fit.reasons} />
        <a
          href={deckUrl(d.cards)}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Open on RoyaleAPI
        </a>
      </CardContent>
    </Card>
  );
}
