import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FeedbackBox } from "@/components/feedback-box";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  GITHUB_FEEDBACK,
  GITHUB_FEEDBACK_OPEN,
  issueKind,
  loadGithubFeedback,
  type GithubIssue,
} from "@/lib/ops/log";
import { formatFetched } from "@/lib/utils";

export const Route = createFileRoute("/feedback")({ component: FeedbackPage });

type Filter = "open" | "all" | "bug" | "suggestion";

function FeedbackPage() {
  const [issues, setIssues] = useState<GithubIssue[] | null>(null);
  const [filter, setFilter] = useState<Filter>("open");

  useEffect(() => {
    void loadGithubFeedback().then(setIssues);
  }, []);

  const rows = useMemo(() => {
    const list = issues ?? [];
    return list.filter((issue) => {
      if (filter === "open") return issue.state === "open";
      if (filter === "bug") return issueKind(issue) === "bug";
      if (filter === "suggestion") return issueKind(issue) === "suggestion";
      return true;
    });
  }, [filter, issues]);

  const openCount = (issues ?? []).filter((i) => i.state === "open").length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Clan tickets</p>
        <h1 className="font-display text-5xl leading-none">Suggestions and bugs</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Submit below, then review the queue. Tickets are stored as GitHub issues labeled{" "}
          <span className="text-foreground">feedback</span> on the clan repo — comment there to follow a thread.
        </p>
        <p className="text-sm text-muted-foreground">
          <a href={GITHUB_FEEDBACK_OPEN} className="text-primary hover:underline" target="_blank" rel="noreferrer">
            Open tickets on GitHub
          </a>
          <span className="mx-2 text-subtle">·</span>
          <a href={GITHUB_FEEDBACK} className="text-primary hover:underline" target="_blank" rel="noreferrer">
            All tickets
          </a>
        </p>
      </header>

      <FeedbackBox showReview={false} />

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl">Review tickets</h2>
          <p className="text-sm text-muted-foreground">{issues ? `${openCount} open` : "Loading…"}</p>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {(["open", "all", "bug", "suggestion"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={
                filter === k
                  ? "h-11 rounded-sm bg-primary px-4 text-sm capitalize text-primary-foreground"
                  : "h-11 rounded-sm bg-secondary px-4 text-sm capitalize text-muted-foreground"
              }
            >
              {k}
            </button>
          ))}
        </div>
        <div className="grid gap-3">
          {issues === null ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">Loading tickets from GitHub…</p>
              </CardContent>
            </Card>
          ) : null}
          {rows.map((issue) => {
            const kind = issueKind(issue);
            return (
              <Card key={issue.number}>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={kind === "bug" ? "loss" : "cyan"}>{kind}</Badge>
                    <Badge variant={issue.state === "open" ? "warn" : "win"}>{issue.state}</Badge>
                    <span className="font-display text-xl leading-none">#{issue.number}</span>
                    <span className="text-sm text-muted-foreground">{issue.user?.login}</span>
                    <span className="text-xs text-muted-foreground">{formatFetched(issue.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground">{issue.title}</p>
                  {issue.body ? <p className="line-clamp-3 text-sm text-muted-foreground">{issue.body}</p> : null}
                  <a href={issue.html_url} className="text-sm text-primary hover:underline" target="_blank" rel="noreferrer">
                    Open ticket
                  </a>
                </CardContent>
              </Card>
            );
          })}
          {issues && rows.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No tickets in this filter yet. Submit one above — it lands here after you file the GitHub draft.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      <p className="text-sm text-muted-foreground">
        <Link to="/" className="text-primary hover:underline">
          Back to the board
        </Link>
      </p>
    </div>
  );
}
