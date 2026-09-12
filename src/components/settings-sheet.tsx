import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_API_TOKEN, DEFAULT_CLAN_NAME, DEFAULT_CLAN_TAG } from "@/lib/cr/defaults";
import { useAppStore } from "@/lib/store";

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const apiKey = useAppStore((s) => s.apiKey);
  const setApiKey = useAppStore((s) => s.setApiKey);
  const [draft, setDraft] = useState(apiKey || DEFAULT_API_TOKEN);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button className="absolute inset-0 bg-background/70" aria-label="Close settings" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-t-xl border border-border bg-card p-5 shadow-[var(--shadow-panel)] sm:rounded-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl">Live data</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Live player and clan lookups go through the official Clash Royale API via the RoyaleAPI proxy. A token for{" "}
          {DEFAULT_CLAN_NAME} ({DEFAULT_CLAN_TAG}) is already loaded.
        </p>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Official API token
        </label>
        <Input
          type="password"
          autoComplete="off"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="eyJhbGciOi…"
        />
        <ol className="mt-4 list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
          <li>
            Create a key at{" "}
            <a className="text-primary underline-offset-2 hover:underline" href="https://developer.clashroyale.com" target="_blank" rel="noreferrer">
              developer.clashroyale.com
            </a>
          </li>
          <li>Whitelist IP 45.79.218.79 so the RoyaleAPI proxy can reach it.</li>
          <li>Paste a replacement token here if this one expires. It stays on this device only.</li>
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">
          <Link to="/feedback" className="text-primary hover:underline" onClick={onClose}>
            Tickets
          </Link>{" "}
          — submit or review suggestions and bugs.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setApiKey(draft.trim() || DEFAULT_API_TOKEN);
              onClose();
            }}
          >
            Save token
          </Button>
        </div>
      </div>
    </div>
  );
}
