import { CARDS_BY_KEY } from "./catalog";
import { keyFromPhrase, type LiveSideId } from "./live";

/** StormHacks ClashQuant / ERA public YOLO (CC BY 4.0, rohinsprojects). Eight-card set. */
export const DEFAULT_QUANT_MODEL = "clashquant-nvnzk/4";

export type Detection = {
  key: string;
  x: number;
  y: number;
  conf: number;
};

export type QuantPlay = { side: LiveSideId; key: string };

export type QuantTrack = {
  key: string;
  side: LiveSideId;
  lastSeen: number;
  hits: number;
  emitted: boolean;
  x: number;
  y: number;
};

export type QuantState = {
  frame: number;
  tracks: QuantTrack[];
  lastPlay: Record<string, number>;
};

const THEM_MAX_Y = 0.52;
const YOU_MIN_Y = 0.58;
const PERSIST = 2;
const LIVE_FRAMES = 12;
const COOLDOWN = 12;

export function createQuant(): QuantState {
  return { frame: 0, tracks: [], lastPlay: {} };
}

export function sideOfY(y: number): LiveSideId | null {
  if (y < THEM_MAX_Y) return "them";
  if (y > YOU_MIN_Y) return "you";
  return null;
}

/**
 * ClashQuant/ERA GameState: a detection is not a play.
 * A card newly appearing on one half, persisting two frames, with cooldown, is a play.
 */
export function ingestQuant(
  state: QuantState,
  detections: Detection[],
  youDeck: string[],
  themDeck: string[],
  watch: LiveSideId[] = ["them"],
): { state: QuantState; plays: QuantPlay[] } {
  const frame = state.frame + 1;
  const tracks = state.tracks.map((t) => ({ ...t }));
  const lastPlay = { ...state.lastPlay };
  const plays: QuantPlay[] = [];
  const youSet = new Set(youDeck);
  const themSet = new Set(themDeck);

  for (const det of detections) {
    const side = sideOfY(det.y);
    if (!side || !watch.includes(side)) continue;
    const allowed = side === "them" ? themSet : youSet;
    if (!allowed.has(det.key)) continue;
    let track = tracks.find((t) => t.key === det.key && t.side === side && frame - t.lastSeen <= LIVE_FRAMES);
    if (!track) {
      track = { key: det.key, side, lastSeen: frame, hits: 0, emitted: false, x: det.x, y: det.y };
      tracks.push(track);
    }
    track.lastSeen = frame;
    track.hits += 1;
    track.x = det.x;
    track.y = det.y;
    const coolKey = `${side}:${det.key}`;
    if (!track.emitted && track.hits >= PERSIST && frame - (lastPlay[coolKey] ?? -999) >= COOLDOWN) {
      track.emitted = true;
      lastPlay[coolKey] = frame;
      plays.push({ side, key: det.key });
    }
  }

  return {
    state: { frame, tracks: tracks.filter((t) => frame - t.lastSeen <= LIVE_FRAMES), lastPlay },
    plays,
  };
}

export function labelToKey(label: string): string | null {
  const cleaned = label.replace(/^a-/i, "").replace(/[_]+/g, " ").trim();
  const fromPhrase = keyFromPhrase(cleaned);
  if (fromPhrase) return fromPhrase;
  const slug = cleaned.toLowerCase().replace(/\s+/g, "-");
  return CARDS_BY_KEY[slug] ? slug : null;
}

type RoboflowPred = {
  class?: string;
  confidence?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

let roboCanvas: HTMLCanvasElement | null = null;

export async function inferRoboflow(
  video: HTMLVideoElement,
  apiKey: string,
  modelId = DEFAULT_QUANT_MODEL,
): Promise<Detection[]> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh || !apiKey.trim()) return [];
  const canvas = roboCanvas || (roboCanvas = document.createElement("canvas"));
  const w = 384;
  const h = Math.round((vh / vw) * w) || 512;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(video, 0, 0, w, h);
  const body = canvas.toDataURL("image/jpeg", 0.55).split(",")[1] ?? "";
  const model = modelId.trim() || DEFAULT_QUANT_MODEL;
  const url = `https://detect.roboflow.com/${model}?api_key=${encodeURIComponent(apiKey.trim())}&confidence=35&overlap=40`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Roboflow ${res.status}`);
  const json = (await res.json()) as { predictions?: RoboflowPred[] };
  const preds = json.predictions ?? [];
  const out: Detection[] = [];
  for (const p of preds) {
    const key = labelToKey(p.class ?? "");
    if (!key) continue;
    out.push({
      key,
      x: (p.x ?? 0) / w,
      y: (p.y ?? 0) / h,
      conf: p.confidence ?? 0,
    });
  }
  return out;
}
