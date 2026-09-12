export const OPS_STORAGE_KEY = "xrp-ops-log";
export const GITHUB_REPO = "ClashClan-XRP/XRP-Clan-Analytics";
export const GITHUB_ISSUES = `https://github.com/${GITHUB_REPO}/issues`;

export const FEATURES = [
  "board",
  "meta",
  "scout",
  "clan",
  "coach",
  "upgrades",
  "cards",
  "copy-deck",
  "pair",
  "war",
  "suggestion",
] as const;

export type FeatureKey = (typeof FEATURES)[number];

export type OpsVisitor = {
  id: string;
  firstSeen: string;
  lastSeen: string;
  ip?: string;
  ipMasked: string;
  city: string;
  region: string;
  country: string;
  features: Record<string, number>;
};

export type OpsSuggestion = {
  id: string;
  createdAt: string;
  kind: "bug" | "suggestion";
  name: string;
  message: string;
  city: string;
  country: string;
  path: string;
  issueUrl?: string;
  status: "open" | "done";
};

export type OpsEvent = {
  t: string;
  feature: string;
  path: string;
};

export type SiteLog = {
  version: number;
  repo: string;
  updatedAt: string;
  privacy: string;
  features: Record<string, number>;
  visitors: OpsVisitor[];
  suggestions: OpsSuggestion[];
};

export type LocalLog = {
  sessionId: string;
  visitor: OpsVisitor;
  features: Record<string, number>;
  events: OpsEvent[];
  suggestions: OpsSuggestion[];
  geoReady: boolean;
};

function emptyFeatures(): Record<string, number> {
  return Object.fromEntries(FEATURES.map((f) => [f, 0]));
}

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function maskIp(ip: string): string {
  if (!ip) return "";
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return `${parts.slice(0, 4).join(":")}::`;
  }
  return ip;
}

export function featureFromPath(pathname: string): FeatureKey | null {
  if (pathname === "/") return "board";
  if (pathname.startsWith("/meta")) return "meta";
  if (pathname.startsWith("/player")) return "scout";
  if (pathname.startsWith("/clan")) return "clan";
  if (pathname.startsWith("/coach")) return "coach";
  if (pathname.startsWith("/upgrades")) return "upgrades";
  if (pathname.startsWith("/cards")) return "cards";
  return null;
}

function blankVisitor(id: string, now: string): OpsVisitor {
  return {
    id,
    firstSeen: now,
    lastSeen: now,
    ipMasked: "",
    city: "",
    region: "",
    country: "",
    features: emptyFeatures(),
  };
}

function readLocal(): LocalLog {
  const now = new Date().toISOString();
  const fallback: LocalLog = {
    sessionId: newId(),
    visitor: blankVisitor("pending", now),
    features: emptyFeatures(),
    events: [],
    suggestions: [],
    geoReady: false,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(OPS_STORAGE_KEY);
    if (!raw) {
      fallback.visitor.id = fallback.sessionId;
      return fallback;
    }
    const parsed = JSON.parse(raw) as LocalLog;
    if (!parsed.sessionId) return fallback;
    parsed.features = { ...emptyFeatures(), ...parsed.features };
    parsed.events = parsed.events ?? [];
    parsed.suggestions = parsed.suggestions ?? [];
    parsed.visitor = parsed.visitor ?? blankVisitor(parsed.sessionId, now);
    parsed.visitor.features = { ...emptyFeatures(), ...parsed.visitor.features };
    return parsed;
  } catch {
    fallback.visitor.id = fallback.sessionId;
    return fallback;
  }
}

function writeLocal(log: LocalLog) {
  if (typeof window === "undefined") return;
  try {
    const events = log.events.slice(-400);
    window.localStorage.setItem(OPS_STORAGE_KEY, JSON.stringify({ ...log, events }));
  } catch {
    /* quota */
  }
}

export function loadLocalLog(): LocalLog {
  return readLocal();
}

export function track(feature: string, path?: string) {
  if (typeof window === "undefined") return;
  const log = readLocal();
  const now = new Date().toISOString();
  const pathname = path ?? (window.location.hash.replace(/^#/, "") || window.location.pathname || "/");
  log.features[feature] = (log.features[feature] ?? 0) + 1;
  log.visitor.features[feature] = (log.visitor.features[feature] ?? 0) + 1;
  log.visitor.lastSeen = now;
  log.events.push({ t: now, feature, path: pathname });
  writeLocal(log);
}

export async function initOpsSession(): Promise<void> {
  if (typeof window === "undefined") return;
  const log = readLocal();
  log.visitor.id = log.sessionId;
  if (!log.visitor.firstSeen) log.visitor.firstSeen = new Date().toISOString();
  log.visitor.lastSeen = new Date().toISOString();
  writeLocal(log);
  if (log.geoReady) return;
  if (window.sessionStorage.getItem("xrp-geo-tried")) {
    log.geoReady = true;
    writeLocal(log);
    return;
  }
  window.sessionStorage.setItem("xrp-geo-tried", "1");
  try {
    const res = await fetch("https://ipwho.is/", { cache: "no-store" });
    if (!res.ok) {
      const next = readLocal();
      next.geoReady = true;
      writeLocal(next);
      return;
    }
    const geo = (await res.json()) as {
      success?: boolean;
      ip?: string;
      city?: string;
      region?: string;
      country?: string;
    };
    if (geo.success === false) {
      const next = readLocal();
      next.geoReady = true;
      writeLocal(next);
      return;
    }
    const next = readLocal();
    next.visitor.ip = geo.ip ?? "";
    next.visitor.ipMasked = maskIp(geo.ip ?? "");
    next.visitor.city = geo.city ?? "";
    next.visitor.region = geo.region ?? "";
    next.visitor.country = geo.country ?? "";
    next.geoReady = true;
    writeLocal(next);
  } catch {
    const next = readLocal();
    next.geoReady = true;
    writeLocal(next);
  }
}

export function submitSuggestion(input: {
  kind: "bug" | "suggestion";
  name: string;
  message: string;
  path: string;
}): OpsSuggestion {
  const log = readLocal();
  const now = new Date().toISOString();
  const entry: OpsSuggestion = {
    id: newId(),
    createdAt: now,
    kind: input.kind,
    name: input.name.trim() || "Anonymous",
    message: input.message.trim(),
    city: log.visitor.city,
    country: log.visitor.country,
    path: input.path,
    status: "open",
  };
  const title = `[${input.kind}] ${entry.message.slice(0, 72)}`;
  const body = [
    entry.message,
    "",
    `Kind: ${entry.kind}`,
    `From: ${entry.name}`,
    `Path: ${entry.path}`,
    `Location: ${[entry.city, entry.country].filter(Boolean).join(", ") || "unknown"}`,
    `Session: ${log.sessionId.slice(0, 8)}`,
  ].join("\n");
  const labels = encodeURIComponent(`feedback,${entry.kind}`);
  entry.issueUrl = `${GITHUB_ISSUES}/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=${labels}`;
  log.suggestions = [entry, ...log.suggestions].slice(0, 80);
  writeLocal(log);
  track("suggestion", input.path);
  return entry;
}

export function siteLogUrl(): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}logs/site-log.json`.replace(/([^:])\/{2,}/g, "$1/");
}

export async function loadCommittedLog(): Promise<SiteLog | null> {
  try {
    const res = await fetch(siteLogUrl(), { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as SiteLog;
  } catch {
    return null;
  }
}

export type GithubIssue = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  created_at: string;
  labels: Array<{ name: string }>;
  user?: { login: string };
  body?: string | null;
};

export async function loadGithubFeedback(): Promise<GithubIssue[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues?state=all&labels=feedback&per_page=40`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as GithubIssue[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function mergeFeatures(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out = emptyFeatures();
  for (const k of new Set([...Object.keys(a), ...Object.keys(b), ...FEATURES])) {
    out[k] = (a[k] ?? 0) + (b[k] ?? 0);
  }
  return out;
}

export function publicVisitor(v: OpsVisitor): OpsVisitor {
  return {
    ...v,
    ip: undefined,
    ipMasked: v.ipMasked || maskIp(v.ip ?? ""),
  };
}
