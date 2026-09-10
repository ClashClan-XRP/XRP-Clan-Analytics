import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/** Player name with tag revealed on hover or tap. */
export function PlayerName({
  name,
  tag,
  className,
}: {
  name: string;
  tag: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const tipId = useId();

  function place() {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = 168;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    setPos({ top: r.bottom + 6, left });
  }

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onScroll() {
      place();
    }
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  return (
    <span className="relative inline-flex max-w-full">
      <button
        ref={btnRef}
        type="button"
        title={tag}
        aria-describedby={open ? tipId : undefined}
        aria-label={`${name}, tag ${tag}`}
        className={cn(
          "max-w-full truncate border-0 bg-transparent p-0 text-left font-inherit text-inherit underline decoration-dotted decoration-muted-foreground/50 underline-offset-4",
          className,
        )}
        onMouseEnter={() => {
          place();
          setOpen(true);
        }}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          place();
          setOpen((v) => !v);
        }}
      >
        {name}
      </button>
      {open
        ? createPortal(
            <span
              id={tipId}
              role="tooltip"
              className="pointer-events-none fixed z-50 whitespace-nowrap rounded-sm border border-border bg-popover px-2 py-1 font-mono text-xs text-popover-foreground shadow-[var(--shadow-panel)]"
              style={{ top: pos.top, left: pos.left }}
            >
              {tag}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
