import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Layers3, Library, Settings2, Sparkles, Swords, Users } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useBootstrap } from "@/lib/use-bootstrap";
import { SettingsSheet } from "./settings-sheet";

const NAV = [
  { to: "/", label: "Board", icon: LayoutGrid },
  { to: "/meta", label: "Meta", icon: Layers3 },
  { to: "/player", label: "Scout", icon: Swords },
  { to: "/clan", label: "Clan", icon: Users },
  { to: "/upgrades", label: "Upgrades", icon: Sparkles },
  { to: "/cards", label: "Cards", icon: Library },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [settings, setSettings] = useState(false);
  useBootstrap();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border bg-card/60 md:flex">
        <div className="px-5 pb-6 pt-7">
          <Link to="/" className="block">
            <div className="font-display text-3xl leading-none tracking-wide text-foreground">XRP CLAN</div>
            <div className="font-display text-2xl leading-none tracking-wide text-primary">ANALYTICS</div>
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">Season 87 snapshot</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
                  active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-8">
          <Link to="/" className="md:hidden">
            <span className="font-display text-2xl leading-none text-foreground">XRP CLAN</span>
            <span className="font-display text-2xl leading-none text-primary"> ANALYTICS</span>
          </Link>
          <p className="hidden text-sm text-muted-foreground md:block">
            Meta decks, upgrade paths, and 2v2 pairings for CryptoClan-$XRP
          </p>
          <button
            onClick={() => setSettings(true)}
            className="inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Settings"
          >
            <Settings2 className="size-4" />
            <span className="hidden sm:inline">Live API</span>
          </button>
        </header>
        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 md:hidden">
        {NAV.slice(0, 5).map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
    </div>
  );
}
