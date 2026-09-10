import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CardTile } from "@/components/card-tile";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cardMeta } from "@/lib/cr/meta";
import { META_DECKS } from "@/lib/cr/meta";
import { PLAYABLE, type Card, type CardType, type Rarity } from "@/lib/cr/catalog";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/cards")({ component: CardsPage });

const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary", "champion"];
const TYPES: CardType[] = ["troop", "spell", "building"];

function CardsPage() {
  const player = useAppStore((s) => s.player);
  const patchCardLevel = useAppStore((s) => s.patchCardLevel);
  const toggleEvo = useAppStore((s) => s.toggleEvo);
  const [q, setQ] = useState("");
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const [type, setType] = useState<CardType | "all">("all");
  const [onlyEvo, setOnlyEvo] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return PLAYABLE.filter((c) => {
      if (query && !c.name.toLowerCase().includes(query) && !c.key.includes(query)) return false;
      if (rarity !== "all" && c.rarity !== rarity) return false;
      if (type !== "all" && c.type !== type) return false;
      if (onlyEvo && !c.evo) return false;
      return true;
    });
  }, [q, rarity, type, onlyEvo]);

  const selected = PLAYABLE.find((c) => c.key === picked) ?? list[0];
  const owned = player?.cards.find((c) => c.key === selected?.key);
  const decks = selected ? META_DECKS.filter((d) => d.cards.includes(selected.key)) : [];
  const meta = selected ? cardMeta(selected.key) : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Card intel</p>
        <h1 className="mt-1 font-display text-5xl leading-none">Every card, scored</h1>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cards" className="sm:max-w-xs" />
        <div className="flex flex-wrap gap-2">
          <Chip on={rarity === "all"} onClick={() => setRarity("all")}>
            All rarities
          </Chip>
          {RARITIES.map((r) => (
            <Chip key={r} on={rarity === r} onClick={() => setRarity(r)}>
              {r}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <Chip key={t} on={type === t} onClick={() => setType(type === t ? "all" : t)}>
            {t}
          </Chip>
        ))}
        <Chip on={onlyEvo} onClick={() => setOnlyEvo((v) => !v)}>
          Evolutions
        </Chip>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {list.map((c) => (
            <button key={c.key} onClick={() => setPicked(c.key)} className="flex flex-col items-center gap-1">
              <CardTile cardKey={c.key} evo={c.evo} className={picked === c.key ? "ring-2 ring-primary" : ""} />
              <span className="line-clamp-2 w-full text-center text-[10px] leading-tight text-muted-foreground">{c.name}</span>
            </button>
          ))}
        </div>
        {selected && meta ? (
          <Detail
            card={selected}
            meta={meta}
            owned={owned}
            decks={decks.map((d) => d.name)}
            onLevel={(n) => patchCardLevel(selected.key, n)}
            onEvo={() => toggleEvo(selected.key)}
          />
        ) : null}
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-11 rounded-sm px-3 text-sm capitalize ${on ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
    >
      {children}
    </button>
  );
}

function Detail({
  card,
  meta,
  owned,
  decks,
  onLevel,
  onEvo,
}: {
  card: Card;
  meta: ReturnType<typeof cardMeta>;
  owned?: { level: number; evolutionLevel: number };
  decks: string[];
  onLevel: (n: number) => void;
  onEvo: () => void;
}) {
  return (
    <aside className="h-fit rounded-xl border border-border bg-card p-5">
      <div className="flex gap-3">
        <CardTile cardKey={card.key} evo={owned?.evolutionLevel === 1} size="lg" level={owned?.level} />
        <div>
          <div className="font-display text-3xl leading-none">{card.name}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            <Badge className="normal-case">{card.rarity}</Badge>
            <Badge variant="outline">{card.elixir} elixir</Badge>
            <Badge variant="cyan">{meta.tier}</Badge>
          </div>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Usage</dt>
          <dd className="font-display text-2xl tabular">{meta.usage.toFixed(1)}%</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Win</dt>
          <dd className="font-display text-2xl tabular">{meta.winRate.toFixed(1)}%</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-muted-foreground">
        {card.evo ? `Evolution · ${card.evoCycles ?? 2} cycle` : "No evolution"}
        {card.roles.length ? ` · ${card.roles.join(", ")}` : ""}
      </p>
      {owned ? (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Your level</div>
          <input
            type="range"
            min={1}
            max={16}
            value={owned.level}
            onChange={(e) => onLevel(Number(e.target.value))}
            className="mt-2 w-full accent-primary"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="tabular">{owned.level} / 16</span>
            {card.evo ? (
              <button onClick={onEvo} className="text-primary hover:underline">
                {owned.evolutionLevel ? "Evo crafted" : "Mark evo"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="mt-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">On these lists</div>
        <p className="mt-1 text-sm text-muted-foreground">{decks.length ? decks.join(" · ") : "Outside the tracked snapshot"}</p>
      </div>
    </aside>
  );
}
