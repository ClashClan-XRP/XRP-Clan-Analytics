import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FEATURES,
  GITHUB_ISSUES,
  GITHUB_REPO,
  loadCommittedLog,
  loadGithubFeedback,
  loadLocalLog,
  mergeFeatures,
  type GithubIssue,
  type OpsSuggestion,
  type OpsVisitor,
  type SiteLog,
} from "@/lib/ops/log";
import { formatFetched, formatInt } from "@/lib/utils";

export const Route = createFileRoute("/ops")({ component: OpsPage });

function OpsPage() {
  const [committed, setCommitted] = useState<SiteLog | null>(null);
  const [issues, setIssues] = useState<GithubIssue[]>([]);
  const local = useMemo(() => loadLocalLog(), []);

  useEffect(() => {
    void loadCommittedLog().then(setCommitted);
    void loadGithubFeedback().then(setIssues);
  }, []);

  const features = mergeFeatures(committed?.features ?? {}, local.features);
  const featureRows = FEATURES.map((k) => ({ key: k, n: features[k] ?? 0 })).sort((a, b) => b.n - a.n);
  const maxF = Math.max(1, ...featureRows.map((r) => r.n));
  const visitors: OpsVisitor[] = [
    local.visitor,
    ...(committed?.visitors ?? []).filter((v) => v.id !== local.visitor.id),
  ];
  const suggestions: OpsSuggestion[] = [
    ...local.suggestions,
    ...(committed?.suggestions ?? []).filter((s) => !local.suggestions.some((l) => l.id === s.id)),
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Site desk</p>
        <h1 className="font-display text-5xl leading-none">Ops, help desk, improvement</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Separate from the clan board. Merges the repo log, this device’s sessions, and GitHub tickets labeled{" "}
          <span className="text-foreground">feedback</span>. Full IP stays on this device; the public log stores city and a
          masked address.
        </p>
        <p className="text-xs text-muted-foreground">
          Shared log in the clan repo ·{" "}
          <a href={GITHUB_ISSUES} className="text-primary hover:underline" target="_blank" rel="noreferrer">
            {GITHUB_REPO} issues
          </a>
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Sessions on this desk" value={String(visitors.length)} hint={local.visitor.city || "geo pending"} />
        <Kpi
          label="Feature hits"
          value={formatInt(featureRows.reduce((s, r) => s + r.n, 0))}
          hint={`Top: ${featureRows[0]?.key ?? "—"}`}
        />
        <Kpi label="Local tickets" value={String(local.suggestions.length)} hint={`${local.suggestions.filter((s) => s.status === "open").length} open`} />
        <Kpi label="GitHub feedback" value={String(issues.length)} hint={`${issues.filter((i) => i.state === "open").length} open`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Functions used</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {featureRows.map((row) => (
              <div key={row.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="capitalize text-foreground">{row.key.replace("-", " ")}</span>
                  <span className="tabular text-muted-foreground">{row.n}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-sm bg-secondary">
                  <div
                    className="h-full rounded-sm bg-primary"
                    style={{ width: `${Math.max(row.n ? 6 : 0, (row.n / maxF) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>This session</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Row label="City" value={[local.visitor.city, local.visitor.region, local.visitor.country].filter(Boolean).join(", ") || "Locating…"} />
            <Row label="IP (this device)" value={local.visitor.ip || "—"} />
            <Row label="Masked (repo)" value={local.visitor.ipMasked || "—"} />
            <Row label="First seen" value={formatFetched(local.visitor.firstSeen)} />
            <Row label="Last seen" value={formatFetched(local.visitor.lastSeen)} />
            <Row label="Session" value={local.sessionId.slice(0, 8)} />
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 font-display text-3xl">Visitors</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">Top function</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((v) => {
                const top = Object.entries(v.features).sort((a, b) => b[1] - a[1])[0];
                return (
                  <tr key={v.id} className="border-t border-border">
                    <td className="px-4 py-2 text-muted-foreground">{formatFetched(v.lastSeen)}</td>
                    <td className="px-4 py-2">
                      {[v.city, v.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">{v.ip ?? v.ipMasked ?? "—"}</td>
                    <td className="px-4 py-2 capitalize text-muted-foreground">
                      {top && top[1] > 0 ? `${top[0]} · ${top[1]}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display text-3xl">Help desk</h2>
          <a href={GITHUB_ISSUES} className="text-sm text-primary hover:underline" target="_blank" rel="noreferrer">
            Open GitHub issues
          </a>
        </div>
        <div className="grid gap-3">
          {suggestions.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={s.kind === "bug" ? "loss" : "cyan"}>{s.kind}</Badge>
                  <span className="font-display text-xl leading-none">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{formatFetched(s.createdAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{s.message}</p>
                <p className="text-xs text-muted-foreground">
                  {[s.city, s.country].filter(Boolean).join(", ") || "Location unknown"} · {s.path}
                  {s.issueUrl ? (
                    <>
                      {" · "}
                      <a href={s.issueUrl} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                        GitHub draft
                      </a>
                    </>
                  ) : null}
                </p>
              </CardContent>
            </Card>
          ))}
          {issues.map((issue) => (
            <Card key={`gh-${issue.number}`}>
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={issue.state === "open" ? "warn" : "win"}>#{issue.number}</Badge>
                  <span className="font-display text-xl leading-none">{issue.title}</span>
                  <span className="text-xs text-muted-foreground">{issue.user?.login}</span>
                </div>
                <p className="line-clamp-3 text-sm text-muted-foreground">{issue.body || "No body"}</p>
                <a href={issue.html_url} className="text-sm text-primary hover:underline" target="_blank" rel="noreferrer">
                  Open ticket
                </a>
              </CardContent>
            </Card>
          ))}
          {!suggestions.length && !issues.length ? (
            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No tickets yet. The board has a suggestion box. Submit one to file it here and on GitHub.
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

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card>
      <CardContent>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="font-display text-4xl tabular leading-none">{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value}</span>
    </div>
  );
}
