import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DeckStrip } from "@/components/card-tile";
import { ReasonList } from "@/components/deck-fit";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { matchup } from "@/lib/cr/analysis";
import { deckUrl } from "@/lib/cr/catalog";
import { CARD_META, META_AS_OF, META_DECKS, META_LABEL } from "@/lib/cr/meta";
import { PLAYABLE } from "@/lib/cr/catalog";
import { formatInt } from "@/lib/utils";

export const Route = createFileRoute("/meta")({ component: MetaPage });

function MetaPage() {
  const [mode, setMode] = useState<"ladder" | "2v2" | "war">("ladder");
  const [f2p, setF2p] = useState(false);
  const [selected, setSelected] = useState(META_DECKS[0]?.id ?? "");
  const decks = META_DECKS.filter((d) => d.modes.includes(mode) && (!f2p || d.f2p)).sort(
    (a, b) => b.winRate - a.winRate,
  );
  const sel = decks.find((d) => d.id === selected) ?? decks[0];
  const vs = useMemo(() => {
    if (!sel) return [];
    return META_DECKS.filter((d) => d.id !== sel.id)
      .map((d) => ({ deck: d, ...matchup(sel.cards, d.cards) }))
      .sort((a, b) => b.score - a.score);
  }, [sel]);

  const hot = Object.values(CARD_META).sort((a, b) => b.usage - a.usage).slice(0, 12);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">{META_LABEL}</p>
        <h1 className="mt-1 font-display text-5xl leading-none">Meta lab</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Snapshot {META_AS_OF} from public ladder reports. Pick a list to see how it trades with the rest of the field.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {(["ladder", "2v2", "war"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`h-11 rounded-sm px-4 text-sm capitalize ${mode === m ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
          >
            {m}
          </button>
        ))}
        <button
          onClick={() => setF2p((v) => !v)}
          className={`h-11 rounded-sm px-4 text-sm ${f2p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
        >
          F2P only
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-3">
          {decks.map((d) => (
            <button key={d.id} onClick={() => setSelected(d.id)} className="text-left">
              <Card className={d.id === sel?.id ? "border-primary/50" : ""}>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-2xl leading-none">{d.name}</span>
                        <Badge>{d.archetype}</Badge>
                        {d.f2p ? <Badge variant="cyan">F2P</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{d.notes}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-3xl tabular leading-none text-win">{d.winRate.toFixed(1)}%</div>
                      <div className="text-[11px] text-muted-foreground">
                        {d.useRate.toFixed(1)}% use · {formatInt(d.sample)}
                      </div>
                    </div>
                  </div>
                  <DeckStrip cards={d.cards} evo={d.evo} />
                  <a
                    href={deckUrl(d.cards)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    RoyaleAPI deck stats
                  </a>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent>
              <div className="font-display text-2xl">Matchups</div>
              <p className="mb-3 text-sm text-muted-foreground">{sel?.name}</p>
              <div className="flex flex-col gap-2">
                {vs.slice(0, 8).map((m) => (
                  <div key={m.deck.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{m.deck.name}</span>
                      <span className="tabular text-muted-foreground">{m.score}</span>
                    </div>
                    {m.deck.id === vs[0]?.deck.id ? (
                      <div className="mt-2">
                        <ReasonList reasons={m.notes} />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="font-display text-2xl">Hottest cards</div>
              <ul className="mt-3 space-y-2">
                {hot.map((c) => {
                  const name = PLAYABLE.find((x) => x.key === c.key)?.name ?? c.key;
                  return (
                    <li key={c.key} className="flex items-center justify-between text-sm">
                      <span>
                        <Badge variant="outline" className="mr-2 normal-case">
                          {c.tier}
                        </Badge>
                        {name}
                      </span>
                      <span className="tabular text-muted-foreground">{c.usage.toFixed(1)}%</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
