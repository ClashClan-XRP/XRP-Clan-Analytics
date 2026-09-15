import { Camera, Monitor, ScanSearch } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { nameOf } from "@/lib/cr/live";
import {
  DEFAULT_QUANT_MODEL,
  createQuant,
  inferRoboflow,
  ingestQuant,
  type QuantState,
} from "@/lib/cr/quant";
import {
  PHONE_ELIXIR,
  PHONE_HANDS,
  bestMatch,
  canCamera,
  canShare,
  elixirFromBar,
  loadCatalogSignatures,
  sampleVideo,
  scanFrame,
  scanHalf,
  signatureFromImageData,
  slotMoved,
  startCameraShare,
  startDisplayShare,
  type RelRect,
  type Signature,
} from "@/lib/cr/vision";
import { track } from "@/lib/ops/log";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Props = {
  youDeck: string[];
  themDeck: string[];
  youHand: string[];
  mode: "setup" | "match";
  onYouPlay: (key: string) => void;
  onThemPlay: (key: string) => void;
  onElixir?: (n: number) => void;
  onDecks?: (you: string[], them: string[]) => void;
  incoming?: MediaStream | null;
};

export function LiveShare(props: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const catalogRef = useRef<Map<string, Signature>>(new Map());
  const liveSigRef = useRef<Map<string, Signature>>(new Map());
  const stableRef = useRef<(string | null)[]>([null, null, null, null]);
  const pendingRef = useRef<number[]>([0, 0, 0, 0]);
  const lastPlayRef = useRef(0);
  const lastSigsRef = useRef<Array<Signature | null>>([null, null, null, null]);
  const quantRef = useRef<QuantState>(createQuant());
  const youDeckRef = useRef(props.youDeck);
  const themDeckRef = useRef(props.themDeck);
  const modeRef = useRef(props.mode);
  const lockedRef = useRef(false);
  const rfBusyRef = useRef(false);
  youDeckRef.current = props.youDeck;
  themDeckRef.current = props.themDeck;
  modeRef.current = props.mode;
  const youPlayRef = useRef(props.onYouPlay);
  const themPlayRef = useRef(props.onThemPlay);
  const elixirRef = useRef(props.onElixir);
  const decksRef = useRef(props.onDecks);
  youPlayRef.current = props.onYouPlay;
  themPlayRef.current = props.onThemPlay;
  elixirRef.current = props.onElixir;
  decksRef.current = props.onDecks;

  const [live, setLive] = useState(false);
  const [source, setSource] = useState<"screen" | "camera" | null>(null);
  const wakeRef = useRef<WakeLockSentinel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Share the emulator or a phone-mirror window.");
  const [slots, setSlots] = useState<Array<string | null>>([null, null, null, null]);
  const [locked, setLocked] = useState(false);
  lockedRef.current = locked;
  const [quantOn, setQuantOn] = useState(true);
  const [boxes, setBoxes] = useState<Array<{ key: string; x: number; y: number }>>([]);
  const [rfBusy, setRfBusy] = useState(false);
  const rfLast = useRef(0);
  const roboflowKey = useAppStore((s) => s.roboflowKey);
  const roboflowModel = useAppStore((s) => s.roboflowModel);

  const [caps, setCaps] = useState({ share: true, camera: true });

  const keys = [...props.youDeck, ...props.themDeck];

  useEffect(() => {
    setCaps({ share: canShare(), camera: canCamera() });
  }, []);

  const keyList = keys.join(",");
  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    void loadCatalogSignatures(keys).then((map) => {
      if (!cancelled) catalogRef.current = map;
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, keyList]);

  useEffect(() => {
    return () => stopShare();
  }, []);

  useEffect(() => {
    const stream = props.incoming;
    if (!stream) return;
    streamRef.current = stream;
    const v = videoRef.current;
    if (v) {
      v.srcObject = stream;
      void v.play().catch(() => undefined);
    }
    setLive(true);
    setSource("camera");
    track("spectator");
    if (navigator.wakeLock) {
      void navigator.wakeLock.request("screen").then((lock) => {
        wakeRef.current = lock;
      }).catch(() => undefined);
    }
    setStatus("Nearby camera attached. Lock the hand when the four cards show.");
  }, [props.incoming]);

  function stopShare() {
    if (streamRef.current && streamRef.current !== props.incoming) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    streamRef.current = null;
    const v = videoRef.current;
    if (v) v.srcObject = null;
    wakeRef.current?.release().catch(() => undefined);
    wakeRef.current = null;
    setLive(false);
    setSource(null);
    setLocked(false);
    quantRef.current = createQuant();
    setBoxes([]);
  }

  async function begin(kind: "screen" | "camera") {
    setError(null);
    try {
      const stream = kind === "screen" ? await startDisplayShare() : await startCameraShare();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = stream;
      stream.getVideoTracks()[0]?.addEventListener("ended", stopShare);
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play().catch(() => undefined);
      }
      setLive(true);
      setSource(kind);
      track(kind === "camera" ? "spectator" : "share");
      if (kind === "camera" && navigator.wakeLock) {
        void navigator.wakeLock.request("screen").then((lock) => {
          wakeRef.current = lock;
        }).catch(() => undefined);
      }
      setStatus(
        kind === "screen"
          ? "Watching the share. Lock the hand when the four cards are visible."
          : "Spectator cam is on. Point this phone at the other screen. You stay in Live; they stay in the match.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Share was blocked.");
      setLive(false);
    }
  }

  function catalog(): Map<string, Signature> {
    const merged = new Map(catalogRef.current);
    for (const [k, s] of liveSigRef.current) merged.set(k, s);
    return merged;
  }

  function lockHand() {
    const v = videoRef.current;
    if (!v) return;
    const next = new Map(liveSigRef.current);
    const stable: Array<string | null> = [];
    props.youHand.forEach((key, i) => {
      const img = sampleVideo(v, PHONE_HANDS[i]!);
      if (!img) return;
      next.set(key, signatureFromImageData(img));
      stable[i] = key;
    });
    liveSigRef.current = next;
    stableRef.current = [stable[0] ?? null, stable[1] ?? null, stable[2] ?? null, stable[3] ?? null];
    pendingRef.current = [0, 0, 0, 0];
    setSlots([...stableRef.current]);
    setLocked(true);
    setStatus(`Locked ${props.youHand.map(nameOf).join(", ")}. Plays on those slots are called for you.`);
  }

  function scanDecks() {
    const v = videoRef.current;
    if (!v) return;
    const hits = scanFrame(v, catalogRef.current);
    const youSet = new Set(props.youDeck);
    const themHits = hits.filter((h) => !youSet.has(h.key)).map((h) => h.key);
    const youHits = hits.filter((h) => youSet.has(h.key)).map((h) => h.key);
    if (themHits.length >= 4 && decksRef.current) {
      const them = [...themHits, ...props.themDeck.filter((k) => !themHits.includes(k))].slice(0, 8);
      const you = youHits.length >= 4 ? [...youHits, ...props.youDeck.filter((k) => !youHits.includes(k))].slice(0, 8) : props.youDeck;
      decksRef.current(you, them);
      setStatus(`Scan found ${hits.length} cards. Opponent list updated.`);
    } else {
      setStatus(hits.length ? `Saw ${hits.map((h) => nameOf(h.key)).join(", ")}. Need a clearer deck screen.` : "No card portraits in this frame. Share the battle-start eights.");
    }
  }

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      const v = videoRef.current;
      if (!v || !v.videoWidth) return;
      const book = catalog();
      if (!book.size) return;
      const seen: Array<string | null> = [];
      PHONE_HANDS.forEach((rect, i) => {
        const img = sampleVideo(v, rect);
        if (!img) {
          seen[i] = stableRef.current[i] ?? null;
          return;
        }
        const sig = signatureFromImageData(img);
        if (!slotMoved(lastSigsRef.current[i] ?? null, sig)) {
          seen[i] = stableRef.current[i] ?? null;
          return;
        }
        lastSigsRef.current[i] = sig;
        const hit = bestMatch(sig, book);
        seen[i] = hit?.key ?? null;
        if (modeRef.current !== "match" || !lockedRef.current) return;
        const prev = stableRef.current[i];
        if (!hit) {
          pendingRef.current[i] = 0;
          return;
        }
        if (hit.key === prev) {
          pendingRef.current[i] = 0;
          return;
        }
        pendingRef.current[i] += 1;
        if (pendingRef.current[i] < 2) return;
        pendingRef.current[i] = 0;
        if (prev && Date.now() - lastPlayRef.current > 450) {
          lastPlayRef.current = Date.now();
          youPlayRef.current(prev);
          setStatus(`You played ${nameOf(prev)}.`);
        }
        stableRef.current[i] = hit.key;
      });
      setSlots(seen);
      if (elixirRef.current) {
        const bar = sampleVideo(v, PHONE_ELIXIR);
        if (bar) elixirRef.current(elixirFromBar(bar));
      }

      if (modeRef.current === "match" && quantOn) {
        const themBook = new Map([...book].filter(([k]) => themDeckRef.current.includes(k)));
        const local = scanHalf(v, themBook, "them");
        let detections = local;
        const key = useAppStore.getState().roboflowKey;
        const model = useAppStore.getState().roboflowModel || DEFAULT_QUANT_MODEL;
        if (key && Date.now() - rfLast.current > 800 && !rfBusyRef.current) {
          rfLast.current = Date.now();
          rfBusyRef.current = true;
          setRfBusy(true);
          void inferRoboflow(v, key, model)
            .then((preds) => {
              const { state, plays } = ingestQuant(quantRef.current, preds, youDeckRef.current, themDeckRef.current, ["them"]);
              quantRef.current = state;
              setBoxes(state.tracks.map((t) => ({ key: t.key, x: t.x, y: t.y })));
              for (const play of plays) {
                if (play.side === "them") {
                  themPlayRef.current(play.key);
                  setStatus(`Quant: they played ${nameOf(play.key)}.`);
                }
              }
            })
            .catch((e) => setStatus(e instanceof Error ? e.message : "Roboflow failed"))
            .finally(() => {
              rfBusyRef.current = false;
              setRfBusy(false);
            });
        } else {
          const { state, plays } = ingestQuant(quantRef.current, detections, youDeckRef.current, themDeckRef.current, ["them"]);
          quantRef.current = state;
          setBoxes(state.tracks.map((t) => ({ key: t.key, x: t.x, y: t.y })));
          for (const play of plays) {
            if (play.side === "them") {
              themPlayRef.current(play.key);
              setStatus(`Quant: they played ${nameOf(play.key)}.`);
            }
          }
        }
      }
    }, 220);
    return () => window.clearInterval(id);
  }, [live, quantOn]);

  function clickVideo(e: React.MouseEvent<HTMLVideoElement>) {
    if (props.mode !== "match") return;
    const v = e.currentTarget;
    const box = v.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    const rect: RelRect = { x: x - 0.07, y: y - 0.09, w: 0.14, h: 0.18 };
    const img = sampleVideo(v, rect);
    if (!img) return;
    const themBook = new Map([...catalog()].filter(([k]) => props.themDeck.includes(k)));
    const youBook = new Map([...catalog()].filter(([k]) => props.youDeck.includes(k)));
    const themHit = bestMatch(signatureFromImageData(img), themBook, 46);
    const youHit = bestMatch(signatureFromImageData(img), youBook, 46);
    const hit =
      themHit && youHit ? (themHit.dist <= youHit.dist ? themHit : youHit) : (themHit ?? youHit);
    if (!hit) {
      setStatus("No card match at that tap. Lock the hand or tap closer to the portrait.");
      return;
    }
    if (props.themDeck.includes(hit.key)) {
      themPlayRef.current(hit.key);
      setStatus(`They played ${nameOf(hit.key)}.`);
    } else {
      youPlayRef.current(hit.key);
      setStatus(`You played ${nameOf(hit.key)}.`);
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Watch the game</p>
            <h2 className="font-display text-2xl leading-none">Screen share</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant={source === "screen" ? "default" : "outline"} onClick={() => void begin("screen")} disabled={!caps.share}>
              <Monitor className="size-4" />
              Share window
            </Button>
            <Button type="button" variant={source === "camera" ? "default" : "outline"} onClick={() => void begin("camera")} disabled={!caps.camera}>
              <Camera className="size-4" />
              Spectator cam
            </Button>
            {live ? (
              <Button type="button" variant="ghost" onClick={stopShare}>
                Stop
              </Button>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Yes — this phone can be the spectator. Open Live here, tap Spectator cam, and point it at the other iPhone
          (playing or spectating in Clash Royale). Quant, cycle, elixir, and the spoken coach all stay on this device.
          Nearby is only if you need to send the camera to a third phone.
        </p>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <div
          className={cn(
            "relative mx-auto overflow-hidden rounded-md border border-border bg-elevated",
            live ? "aspect-[9/16] max-h-80 w-full max-w-xs" : "flex min-h-16 w-full items-center",
          )}
        >
          <video
            ref={videoRef}
            muted
            playsInline
            className={cn("size-full object-cover", !live && "hidden")}
            onClick={clickVideo}
          />
          {live
            ? PHONE_HANDS.map((r, i) => (
                <div
                  key={i}
                  className="pointer-events-none absolute rounded-sm border border-primary/70"
                  style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }}
                >
                  <span className="absolute left-0.5 top-0.5 bg-background/80 px-1 text-xs text-primary">
                    {slots[i] ? nameOf(slots[i]!) : "—"}
                  </span>
                </div>
              ))
            : null}
          {live
            ? boxes.map((b, i) => (
                <div
                  key={`q-${b.key}-${i}`}
                  className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-loss bg-loss/40"
                  style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%` }}
                  title={nameOf(b.key)}
                />
              ))
            : null}
          {!live ? (
            <div className="flex size-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
              {caps.share
                ? "Pick Share window, then choose the Clash Royale emulator or mirror."
                : "This browser cannot share a window. Use Chrome on the computer that is mirroring the match."}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {props.mode === "match" ? (
            <Button type="button" onClick={lockHand} disabled={!live}>
              Lock my hand
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={scanDecks} disabled={!live}>
              <ScanSearch className="size-4" />
              Scan this frame
            </Button>
          )}
          <Button type="button" variant={quantOn ? "default" : "outline"} onClick={() => setQuantOn((v) => !v)} disabled={!live}>
            Quant {quantOn ? "on" : "off"}
          </Button>
          {locked ? <Badge variant="win">Hand locked</Badge> : null}
          {source === "camera" && live ? <Badge variant="win">Spectator</Badge> : null}
          {quantOn && live ? <Badge variant="win">GameState</Badge> : null}
          {roboflowKey && live ? <Badge variant="cyan">{rfBusy ? "YOLO…" : "YOLO"}</Badge> : null}
          {live ? <Badge variant="cyan">{source === "camera" ? "Camera" : "Share"}</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">{status}</p>
        <p className="text-xs text-muted-foreground">
          Detector credit: ClashQuant / ERA (StormHacks 2025, CC BY 4.0). Default model {roboflowModel || DEFAULT_QUANT_MODEL}. Paste a Roboflow key in Settings to run their YOLO; otherwise we match portraits locally.
        </p>
      </CardContent>
    </Card>
  );
}
