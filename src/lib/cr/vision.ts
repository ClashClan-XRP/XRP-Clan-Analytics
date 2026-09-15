import { artUrl } from "./catalog";
import { nameOf } from "./live";

export type RelRect = { x: number; y: number; w: number; h: number };
export type Signature = Float32Array;

const CELL = 8;
const SIG_LEN = CELL * CELL * 3;

/** Portrait Clash Royale hand row (phone / emulator). */
export const PHONE_HANDS: RelRect[] = [
  { x: 0.05, y: 0.75, w: 0.21, h: 0.21 },
  { x: 0.28, y: 0.75, w: 0.21, h: 0.21 },
  { x: 0.51, y: 0.75, w: 0.21, h: 0.21 },
  { x: 0.74, y: 0.75, w: 0.21, h: 0.21 },
];

export const PHONE_ELIXIR: RelRect = { x: 0.20, y: 0.955, w: 0.60, h: 0.035 };

export const MATCH_MAX = 38;

export function canShare(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getDisplayMedia);
}

export function canCamera(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

export async function startDisplayShare(): Promise<MediaStream> {
  const opts: DisplayMediaStreamOptions = {
    video: { frameRate: 8 },
    audio: false,
  };
  try {
    return await navigator.mediaDevices.getDisplayMedia({
      ...opts,
      // @ts-expect-error — Chromium extras
      preferCurrentTab: false,
      selfBrowserSurface: "exclude",
      surfaceSwitching: "include",
      monitorTypeSurfaces: "include",
    });
  } catch {
    return navigator.mediaDevices.getDisplayMedia(opts);
  }
}

export async function startCameraShare(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
}

export function signatureFromImageData(img: ImageData): Signature {
  const { width: w, height: h, data } = img;
  const out = new Float32Array(SIG_LEN);
  const counts = new Float32Array(CELL * CELL);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 24) continue;
      const cx = Math.min(CELL - 1, Math.floor((x / w) * CELL));
      const cy = Math.min(CELL - 1, Math.floor((y / h) * CELL));
      const j = (cy * CELL + cx) * 3;
      out[j] += data[i]!;
      out[j + 1] += data[i + 1]!;
      out[j + 2] += data[i + 2]!;
      counts[cy * CELL + cx] += 1;
    }
  }
  for (let c = 0; c < CELL * CELL; c++) {
    const n = counts[c] || 1;
    out[c * 3] /= n;
    out[c * 3 + 1] /= n;
    out[c * 3 + 2] /= n;
  }
  return out;
}

export function signatureDistance(a: Signature, b: Signature): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += Math.abs(a[i]! - b[i]!);
  return s / n;
}

let sampleCanvas: HTMLCanvasElement | null = null;

export function sampleVideo(video: HTMLVideoElement, rect: RelRect): ImageData | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;
  const x = Math.max(0, Math.floor(rect.x * vw));
  const y = Math.max(0, Math.floor(rect.y * vh));
  const w = Math.max(8, Math.min(vw - x, Math.floor(rect.w * vw)));
  const h = Math.max(8, Math.min(vh - y, Math.floor(rect.h * vh)));
  const canvas = sampleCanvas || (sampleCanvas = document.createElement("canvas"));
  canvas.width = 48;
  canvas.height = 64;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, x, y, w, h, 0, 0, 48, 64);
  return ctx.getImageData(0, 0, 48, 64);
}

export type CardHit = { key: string; dist: number };

export function bestMatch(sig: Signature, catalog: Map<string, Signature>, max = MATCH_MAX): CardHit | null {
  let hit: CardHit | null = null;
  for (const [key, other] of catalog) {
    const dist = signatureDistance(sig, other);
    if (dist > max) continue;
    if (!hit || dist < hit.dist) hit = { key, dist };
  }
  return hit;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

export async function loadCatalogSignatures(keys: string[]): Promise<Map<string, Signature>> {
  const map = new Map<string, Signature>();
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 64;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return map;
  await Promise.all(
    keys.map(async (key) => {
      try {
        const img = await loadImage(artUrl(key));
        ctx.clearRect(0, 0, 48, 64);
        ctx.drawImage(img, 0, 0, 48, 64);
        map.set(key, signatureFromImageData(ctx.getImageData(0, 0, 48, 64)));
      } catch {
        /* art missing */
      }
    }),
  );
  return map;
}

export function elixirFromBar(img: ImageData): number {
  const { data } = img;
  let mag = 0;
  let tot = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    if (data[i + 3]! < 20) continue;
    tot += 1;
    if (r > 150 && b > 90 && g < 130 && r > g + 30) mag += 1;
  }
  if (!tot) return 0;
  return Math.max(0, Math.min(10, (mag / tot) * 10));
}

export function scanFrame(
  video: HTMLVideoElement,
  catalog: Map<string, Signature>,
  rows = 5,
  cols = 4,
): CardHit[] {
  const hits: CardHit[] = [];
  const seen = new Set<string>();
  const rw = 1 / cols;
  const rh = 1 / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const img = sampleVideo(video, { x: c * rw + rw * 0.08, y: r * rh + rh * 0.08, w: rw * 0.84, h: rh * 0.84 });
      if (!img) continue;
      const hit = bestMatch(signatureFromImageData(img), catalog, MATCH_MAX);
      if (!hit || seen.has(hit.key)) continue;
      seen.add(hit.key);
      hits.push(hit);
    }
  }
  return hits.sort((a, b) => a.dist - b.dist);
}

export function describeHit(hit: CardHit): string {
  return `${nameOf(hit.key)} · ${(100 - hit.dist).toFixed(0)}%`;
}
