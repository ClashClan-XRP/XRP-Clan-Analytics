export const GITHUB_REPO = "ClashClan-XRP/XRP-Clan-Analytics";
export const GITHUB_ISSUES = `https://github.com/${GITHUB_REPO}/issues`;
export const GITHUB_FEEDBACK = `${GITHUB_ISSUES}?q=is%3Aissue+label%3Afeedback`;
export const GITHUB_FEEDBACK_OPEN = `${GITHUB_ISSUES}?q=is%3Aissue+label%3Afeedback+is%3Aopen`;

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
  "tickets",
] as const;

export type FeatureKey = (typeof FEATURES)[number];

const OPS_STORAGE_KEY = "xrp-ops-log";

export function featureFromPath(pathname: string): FeatureKey | null {
  if (pathname === "/") return "board";
  if (pathname.startsWith("/meta")) return "meta";
  if (pathname.startsWith("/player")) return "scout";
  if (pathname.startsWith("/clan")) return "clan";
  if (pathname.startsWith("/coach")) return "coach";
  if (pathname.startsWith("/upgrades")) return "upgrades";
  if (pathname.startsWith("/cards")) return "cards";
  if (pathname.startsWith("/feedback")) return "tickets";
  return null;
}

export function track(feature: string, path?: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(OPS_STORAGE_KEY);
    const now = new Date().toISOString();
    const pathname = path ?? (window.location.hash.replace(/^#/, "") || window.location.pathname || "/");
    const parsed = raw ? (JSON.parse(raw) as { features?: Record<string, number>; events?: Array<{ t: string; feature: string; path: string }> }) : {};
    const features = parsed.features ?? {};
    features[feature] = (features[feature] ?? 0) + 1;
    const events = [...(parsed.events ?? []), { t: now, feature, path: pathname }].slice(-400);
    window.localStorage.setItem(OPS_STORAGE_KEY, JSON.stringify({ features, events }));
  } catch {
    /* quota / private mode */
  }
}

export function newIssueUrl(input: { kind: "bug" | "suggestion"; name?: string; message: string; path?: string }): string {
  const title = `[${input.kind}] ${input.message.trim().slice(0, 72)}`;
  const body = [
    input.message.trim(),
    "",
    `Kind: ${input.kind}`,
    `From: ${input.name?.trim() || "Anonymous"}`,
    `Path: ${input.path || "/"}`,
  ].join("\n");
  const labels = encodeURIComponent(`feedback,${input.kind}`);
  return `${GITHUB_ISSUES}/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=${labels}`;
}

export function submitSuggestion(input: {
  kind: "bug" | "suggestion";
  name: string;
  message: string;
  path: string;
}): { issueUrl: string } {
  const issueUrl = newIssueUrl(input);
  track("suggestion", input.path);
  return { issueUrl };
}

export type GithubIssue = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  created_at: string;
  updated_at?: string;
  labels: Array<{ name: string }>;
  user?: { login: string };
  body?: string | null;
  comments?: number;
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

export function issueKind(issue: GithubIssue): "bug" | "suggestion" | "feedback" {
  const names = issue.labels.map((l) => l.name.toLowerCase());
  if (names.includes("bug")) return "bug";
  if (names.includes("suggestion")) return "suggestion";
  return "feedback";
}
