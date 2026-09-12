import { CopyDeckButton } from "@/components/copy-deck-button";
import { DeckStrip } from "@/components/card-tile";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { youtubeEmbedUrl, youtubeWatchUrl } from "@/lib/cr/coach";
import type { Battle, CoachReport } from "@/lib/cr/types";
import { cn } from "@/lib/utils";

export function CoachReportView({ battle, report }: { battle: Battle; report: CoachReport }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Your eight</div>
              <Badge>{report.selfArchetype}</Badge>
            </div>
            <DeckStrip cards={battle.deck} />
            <CopyDeckButton cards={battle.deck} label={report.selfArchetype} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                {battle.opponentName} · {report.opponentArchetype}
              </div>
              <Badge variant={battle.win ? "win" : "loss"}>{battle.win ? "Win" : "Loss"} {battle.crowns}–{battle.opponentCrowns}</Badge>
            </div>
            <DeckStrip cards={battle.opponentDeck} />
            <CopyDeckButton cards={battle.opponentDeck} label={report.opponentArchetype} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Optimal line vs {report.opponentArchetype}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Matchup {report.matchupScore}/100 · reconstructed from the recorded replay (decks, crowns, result). Clash
            Royale does not publish frame-by-frame logs, so timestamps follow the elixir clock of this matchup.
          </p>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {report.optimalStrategy.map((line, i) => (
              <li key={line} className="flex gap-3 text-sm text-muted-foreground">
                <span className="font-display text-lg leading-none text-primary tabular">{i + 1}</span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 font-display text-3xl">Match points</h2>
        <ul className="flex flex-col gap-3">
          {report.points.map((p) => (
            <li key={p.id}>
              <Card>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm tabular text-primary">{p.clock}</span>
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {p.elapsed} elapsed · {p.phase}
                        </span>
                      </div>
                      <h3 className="mt-1 font-display text-2xl leading-none">{p.title}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={p.impact === "positive" ? "win" : "loss"}>
                        {p.impact === "positive" ? "Positive" : "Negative"}
                      </Badge>
                      {p.deviation ? (
                        <span className="text-[11px] uppercase tracking-wide text-warn">Deviation</span>
                      ) : (
                        <span className="text-[11px] uppercase tracking-wide text-win">On-plan</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{p.observed}</p>
                  <p className="text-sm text-muted-foreground">Optimal: {p.optimal}</p>
                  <p className={cn("text-sm tabular", p.impact === "positive" ? "text-win" : "text-loss")}>
                    {p.impactLabel}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Overall impact</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className={cn("font-display text-5xl tabular leading-none", report.overallImpact >= 0 ? "text-win" : "text-loss")}>
                {report.overallImpact >= 0 ? "+" : ""}
                {report.overallImpact}
              </div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Net match-point score</div>
            </div>
            <Badge variant={battle.win ? "win" : "loss"}>{battle.win ? "Win" : "Loss"}</Badge>
          </div>
          <p className="text-sm text-foreground">{report.overallLabel}</p>
          <p className="text-sm text-muted-foreground">{report.resultExplained}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course of action</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {report.coa.map((line, i) => (
              <li key={line} className="flex gap-3">
                <span className="font-display text-2xl leading-none text-primary tabular">{i + 1}</span>
                <span className="text-sm text-muted-foreground">{line}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-1 font-display text-3xl">Pro clips</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Technique clips from popular ladder players. Each card links the full video.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {report.clips.map((clip) => (
            <Card key={clip.id}>
              <CardContent className="flex flex-col gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-primary">{clip.technique}</div>
                  <h3 className="font-display text-2xl leading-none">{clip.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{clip.creator}</p>
                </div>
                <div className="overflow-hidden rounded-md border border-border bg-elevated">
                  <iframe
                    title={clip.title}
                    src={youtubeEmbedUrl(clip)}
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-muted-foreground">{clip.why}</p>
                <a
                  href={youtubeWatchUrl(clip)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Full video on YouTube
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
