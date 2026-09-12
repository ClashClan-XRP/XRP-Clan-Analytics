import { DeckFitCard } from "@/components/deck-fit";
import { PlayerName } from "@/components/player-name";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CARDS_BY_KEY } from "@/lib/cr/catalog";
import { lastRaceFinish, periodLabel, raceRank, uniqueWarCards, unusedToday, warAdvice, type WarDeckPick } from "@/lib/cr/wars";
import type { ClanProfile, PlayerProfile, RiverLogEntry, RiverRace } from "@/lib/cr/types";
import { formatInt } from "@/lib/utils";

export function WarStatus({
  clan,
  race,
  log,
}: {
  clan: ClanProfile;
  race: RiverRace | null;
  log: RiverLogEntry[];
}) {
  if (!race) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No river race on file. If the clan is between seasons, check back on the next training day.
          </p>
        </CardContent>
      </Card>
    );
  }

  const rank = raceRank(race);
  const unused = unusedToday(race);
  const last = lastRaceFinish(log, clan.tag);
  const advice = warAdvice(clan, race);
  const ordered = [...race.clans].sort((a, b) => b.fame - a.fame);

  return (
    <div className="flex flex-col gap-4">
      <section className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2">
          <CardContent>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Clan wars</div>
                <div className="font-display text-4xl leading-none">{periodLabel(race.periodType, race.periodIndex)}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {race.state} · week {race.sectionIndex + 1}
                </p>
              </div>
              <Badge variant="cyan">{race.source}</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Fame</div>
            <div className="font-display text-4xl tabular">{formatInt(race.clan.fame)}</div>
            <div className="text-sm text-muted-foreground">{rank ? `P${rank} of ${ordered.length}` : "Unranked"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Attacks left today</div>
            <div className="font-display text-4xl tabular">{unused.length}</div>
            <div className="text-sm text-muted-foreground">
              {last ? `Last week P${last.rank} (${last.trophyChange >= 0 ? "+" : ""}${last.trophyChange})` : "No prior week"}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Race standings</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">#</th>
                <th className="pb-2 font-medium">Clan</th>
                <th className="pb-2 font-medium">Fame</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((c, i) => {
                const mine = c.tag === race.clan.tag;
                return (
                  <tr key={c.tag || i} className={mine ? "text-foreground" : "text-muted-foreground"}>
                    <td className="py-1.5 tabular">{i + 1}</td>
                    <td className="py-1.5">{c.name}</td>
                    <td className="py-1.5 tabular">{formatInt(c.fame)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <section>
        <h3 className="mb-3 font-display text-2xl">Team improvement</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {advice.map((a) => (
            <Card key={a.title}>
              <CardContent>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-display text-xl leading-none">{a.title}</div>
                  <Badge variant={a.tone === "good" ? "win" : a.tone === "bad" ? "loss" : a.tone === "warn" ? "warn" : "default"}>
                    {a.tone}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{a.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export function WarDecksPanel({
  player,
  picks,
  busy,
}: {
  player: PlayerProfile | null;
  picks: WarDeckPick[];
  busy: boolean;
}) {
  if (busy) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (!player) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tap War on a roster row to load that member’s collection, last-25 usage, and four war lists.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-display text-3xl">
          Four war decks · <PlayerName name={player.name} tag={player.tag} />
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {uniqueWarCards(picks).length} unique cards across four lists — no repeats. Fitted for usage, levels, synergies,
          and this week’s meta holes. Substitutions replace low-level, missing evo, or missing champion slots.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {picks.map((fit) => (
          <div key={fit.deck.id} className="flex flex-col gap-2">
            <DeckFitCard fit={fit} />
            <p className="px-1 text-xs text-muted-foreground">
              War score {fit.warScore} · {fit.usageNote}
            </p>
            {fit.substitutions.length ? (
              <ul className="px-1 text-xs text-muted-foreground">
                {fit.substitutions.map((s) => (
                  <li key={`${s.from}-${s.to}`}>
                    {CARDS_BY_KEY[s.from]?.name ?? s.from} → {CARDS_BY_KEY[s.to]?.name ?? s.to} · {s.why}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
