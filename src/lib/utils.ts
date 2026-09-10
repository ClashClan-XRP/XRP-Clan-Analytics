import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTag(raw: string): string {
  const t = raw.trim().toUpperCase().replace(/^#+/, "").replace(/\s+/g, "");
  return t ? `#${t}` : "";
}

export function encodeTag(tag: string): string {
  const t = formatTag(tag);
  return encodeURIComponent(t);
}

export function formatPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function formatInt(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function formatFetched(iso?: string): string {
  if (!iso) return "Just now";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Just now";
  const delta = Date.now() - d.getTime();
  if (delta < 15_000) return "Just now";
  if (delta < 60_000) return `${Math.floor(delta / 1000)}s ago`;
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
