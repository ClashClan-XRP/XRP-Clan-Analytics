import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CardTile } from "@/components/card-tile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { collectionHeat, recommendLadder, upgradePriorities } from "@/lib/cr/analysis";
import { goldToMax } from "@/lib/cr/economy";
import { DEMO_PLAYER } from "@/lib/cr/demo";
import { PlayerName } from "@/components/player-name";
import { useAppStore } from "@/lib/store";
import { formatInt } from "@/lib/utils";

export const Route = createFileRoute("/upgrades")({ component: UpgradesPage });

function UpgradesPage() {
  const player = useAppStore((s) => s.player) ?? DEMO_PLAYER;
  const goldBudget = useAppStore((s) => s.goldBudget);
  const setGoldBudget = useAppStore((s) => s.setGoldBudget);
  const patchCardLevel = useAppStore((s) => s.patchCardLevel);
  const toggleEvo = useAppStore((s) => s.toggleEvo);

  const picks = useMemo(() => upgradePriorities(player, goldBudget), [player, goldBudget]);
  const heat = collectionHeat(player);
  const best = recommendLadder(player)[0];
  const spent = picks.reduce((s, p) => s + p.gold, 0);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Upgrade lab</p>
        <h1 className="mt-1 font-display text-5xl leading-none">Spend gold where it wins</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Priority is a mix of meta usage, how often a card appears in{" "}
          <PlayerName name={player.name} tag={player.tag} className="text-foreground" />
          's best lists, evolution status, and the gap to king tower {player.expLevel}.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Gold budget</div>
            <div className="font-display text-4xl tabular">{formatInt(goldBudget)}</div>
            <input
              type="range"
              min={5000}
              max={400000}
              step={5000}
              value={goldBudget}
              onChange={(e) => setGoldBudget(Number(e.target.value))}
              className="mt-4 w-full accent-primary"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Suggested spend</div>
            <div className="font-display text-4xl tabular">{formatInt(spent)}</div>
            <div className="text-sm text-muted-foreground">{picks.length} upgrades in this path</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Best list to feed</div>
            <div className="font-display text-3xl leading-none">{best?.deck.name ?? "—"}</div>
            <div className="text-sm text-muted-foreground">Fit {best?.score ?? "—"}</div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 font-display text-3xl">Collection heat</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {Object.entries(heat).map(([rarity, b]) => (
            <Card key={rarity}>
              <CardContent>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{rarity}</div>
                <div className="font-display text-3xl tabular leading-none">{b.avg.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">
                  {b.n} cards · {b.evos} evo
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-3xl">Priority queue</h2>
        <div className="flex flex-col gap-2">
          {picks.map((p, i) => (
            <Card key={p.card.key}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="font-display text-2xl tabular text-muted-foreground">{String(i + 1).padStart(2, "0")}</div>
                  <CardTile
                    cardKey={p.card.key}
                    evo={player.cards.find((c) => c.key === p.card.key)?.evolutionLevel === 1}
                    level={p.from}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{p.card.name}</span>
                      <Badge variant="outline">
                        {p.from} → {p.to}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{p.why}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="mr-2 text-right">
                    <div className="font-display text-2xl tabular leading-none">{formatInt(p.gold)}</div>
                    <div className="text-[11px] text-muted-foreground">{formatInt(goldToMax(p.from))} to max</div>
                  </div>
                  <ButtonLike onClick={() => patchCardLevel(p.card.key, p.to)}>Mark done</ButtonLike>
                  {p.card.evo ? (
                    <ButtonLike onClick={() => toggleEvo(p.card.key)}>Evo</ButtonLike>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function ButtonLike({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-11 rounded-sm border border-border bg-secondary px-3 text-sm text-foreground hover:bg-secondary/80"
    >
      {children}
    </button>
  );
}
