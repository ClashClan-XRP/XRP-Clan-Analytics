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
