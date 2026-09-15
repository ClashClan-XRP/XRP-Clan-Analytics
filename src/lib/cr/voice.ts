type Recog = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function SpeechRec(): (new () => Recog) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recog; webkitSpeechRecognition?: new () => Recog };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function canListen(): boolean {
  return Boolean(SpeechRec());
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, interrupt = true) {
  if (!canSpeak() || !text.trim()) return;
  const synth = window.speechSynthesis;
  if (interrupt) synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.06;
  u.pitch = 1;
  u.lang = "en-US";
  const voices = synth.getVoices();
  const pick =
    voices.find((v) => /en-US/i.test(v.lang) && /google|neural|samantha|aria|jenny/i.test(v.name)) ??
    voices.find((v) => /en/i.test(v.lang));
  if (pick) u.voice = pick;
  synth.speak(u);
}

export function stopSpeak() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

export function startListen(handlers: {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}): () => void {
  const Ctor = SpeechRec();
  if (!Ctor) {
    handlers.onError?.("no-speech-api");
    return () => undefined;
  }
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.continuous = true;
  rec.interimResults = false;
  rec.onresult = (ev) => {
    const last = ev.results[ev.results.length - 1];
    if (!last || !last.isFinal) return;
    const t = last[0]?.transcript?.trim();
    if (t) handlers.onResult(t);
  };
  rec.onerror = (ev) => {
    if (ev.error === "no-speech" || ev.error === "aborted") return;
    handlers.onError?.(ev.error);
  };
  rec.onend = () => {
    try {
      rec.start();
    } catch {
      /* already stopped */
    }
  };
  try {
    rec.start();
  } catch (e) {
    handlers.onError?.(e instanceof Error ? e.message : "mic-start-failed");
  }
  return () => {
    rec.onend = null;
    try {
      rec.abort();
    } catch {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
  };
}
