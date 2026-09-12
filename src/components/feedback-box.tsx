import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { submitSuggestion } from "@/lib/ops/log";
import { cn } from "@/lib/utils";

export function FeedbackBox() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [kind, setKind] = useState<"suggestion" | "bug">("suggestion");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  function send() {
    const text = message.trim();
    if (text.length < 8) return;
    const entry = submitSuggestion({ kind, name, message: text, path: pathname || "/" });
    setMessage("");
    setSent(entry.issueUrl ?? "ok");
    if (entry.issueUrl) window.open(entry.issueUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Clan feedback</p>
          <h2 className="mt-1 font-display text-3xl leading-none">Report a bug or send a suggestion</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tickets land on the clan GitHub repo and on the Site Desk. Name is optional.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["suggestion", "bug"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                "h-11 rounded-sm px-4 text-sm capitalize",
                kind === k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              {k}
            </button>
          ))}
        </div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder={kind === "bug" ? "What broke, and what did you expect?" : "What should we add or change?"}
          className="w-full rounded-sm border border-input bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring/70"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={send} disabled={message.trim().length < 8}>
            Submit {kind}
          </Button>
          <Link to="/ops" className="text-sm text-muted-foreground hover:text-foreground">
            Open Site Desk
          </Link>
        </div>
        {sent ? (
          <p className="text-sm text-win">
            Logged. A GitHub issue draft opened so it is stored on the clan repo.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
