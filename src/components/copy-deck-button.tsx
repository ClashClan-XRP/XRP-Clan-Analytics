import { Check, Copy, Smartphone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { copyDeckDeepLink, copyDeckUrl } from "@/lib/cr/catalog";
import { track } from "@/lib/ops/log";
import { cn } from "@/lib/utils";

export function CopyDeckButton({
  cards,
  tower,
  label = "Royals",
  className,
  size = "sm",
}: {
  cards: string[];
  tower?: string;
  label?: string;
  className?: string;
  size?: "sm" | "default";
}) {
  const [copied, setCopied] = useState(false);
  const href = copyDeckUrl(cards, { tower, label });
  const deep = copyDeckDeepLink(cards, { tower, label });
  const ready = cards.filter(Boolean).length >= 8;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(deep);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  if (!ready) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Button
        asChild
        size={size}
        onClick={(e) => {
          e.stopPropagation();
          track("copy-deck");
        }}
      >
        <a href={href} target="_blank" rel="noreferrer">
          <Smartphone />
          Copy deck
        </a>
      </Button>
      <Button
        type="button"
        size={size}
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void copyLink();
        }}
        aria-label="Copy clashroyale:// link"
      >
        {copied ? <Check /> : <Copy />}
        {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  );
}
