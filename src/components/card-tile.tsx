import { useState } from "react";
import { artUrl, CARDS_BY_KEY } from "@/lib/cr/catalog";
import { cn } from "@/lib/utils";

const RARITY_BAR: Record<string, string> = {
  common: "bg-muted-foreground",
  rare: "bg-warn",
  epic: "bg-primary",
  legendary: "bg-win",
  champion: "bg-loss",
};

export function CardTile({
  cardKey,
  evo = false,
  level,
  size = "md",
  className,
}: {
  cardKey: string;
  evo?: boolean;
  level?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const card = CARDS_BY_KEY[cardKey];
  const [failed, setFailed] = useState(false);
  const dims = size === "sm" ? "w-10 h-[3.25rem]" : size === "lg" ? "w-16 h-[5.25rem]" : "w-12 h-16";
  const src = artUrl(evo && card?.evo ? cardKey : cardKey, Boolean(evo && card?.evo));

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm border border-border bg-elevated",
        dims,
        className,
      )}
      title={card?.name ?? cardKey}
    >
      {!failed ? (
        <img
          src={src}
          alt={card?.name ?? cardKey}
          className="size-full object-cover object-top"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-0.5 px-0.5 text-center">
          <span className="font-display text-[11px] leading-none text-foreground">{card?.elixir ?? "?"}</span>
          <span className="line-clamp-2 text-[8px] leading-tight text-muted-foreground">{card?.name ?? cardKey}</span>
        </div>
      )}
      {card ? (
        <span className={cn("absolute inset-x-0 bottom-0 h-0.5", RARITY_BAR[card.rarity])} />
      ) : null}
      {typeof card?.elixir === "number" && card.elixir > 0 ? (
        <span className="absolute left-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-background/80 font-display text-[10px] leading-none text-primary">
          {card.elixir}
        </span>
      ) : null}
      {evo ? (
        <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-primary" title="Evolution" />
      ) : null}
      {typeof level === "number" ? (
        <span className="absolute bottom-1 right-0.5 rounded-[2px] bg-background/80 px-0.5 font-display text-[9px] tabular text-foreground">
          {level}
        </span>
      ) : null}
    </div>
  );
}

export function DeckStrip({
  cards,
  evo = [],
  levels,
  size = "md",
}: {
  cards: string[];
  evo?: string[];
  levels?: Record<string, number>;
  size?: "sm" | "md" | "lg";
}) {
  const evoSet = new Set(evo);
  return (
    <div className="flex flex-wrap gap-1">
      {cards.map((k) => (
        <CardTile key={k} cardKey={k} evo={evoSet.has(k)} level={levels?.[k]} size={size} />
      ))}
    </div>
  );
}
