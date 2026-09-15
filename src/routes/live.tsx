import { createFileRoute } from "@tanstack/react-router";
import { Mic, MicOff, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CardTile } from "@/components/card-tile";
import { LiveNearby } from "@/components/live-nearby";
import { LiveShare } from "@/components/live-share";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { lookupBattles, lookupPlayer } from "@/lib/cr/api";
import { PLAYABLE } from "@/lib/cr/catalog";
import {
  createMatch,
  formatClock,
  heartbeat,
  inHand,
  inQueue,
  matchupBrief,
  metaChipDecks,
  parseVoice,
  phaseOf,
  playCard,
  playableDeck,
  setElixir,
  startMatch,
  tick,
  undoLast,
  untilHand,
  type LiveMatch,
  type LiveSide,
  type LiveSideId,
} from "@/lib/cr/live";
import { META_DECKS } from "@/lib/cr/meta";
import { canListen, canSpeak, speak, startListen, stopSpeak } from "@/lib/cr/voice";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Search = { you?: string; them?: string; near?: string; as?: string };

function splitDeck(raw?: string): string[] {
  if (!raw) return [];
  return playableDeck(raw.split(/[,;+\s]+/).filter(Boolean));
}

export const Route = createFileRoute("/live")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    you: typeof s.you === "string" ? s.you : undefined,
    them: typeof s.them === "string" ? s.them : undefined,
    near: typeof s.near === "string" ? s.near : undefined,
    as: typeof s.as === "string" ? s.as : undefined,
  }),
  component: LivePage,
});

function LivePage() {
  const search = Route.useSearch();
  const player = useAppStore((s) => s.player);
  const apiKey = useAppStore((s) => s.apiKey);
  const [you, setYou] = useState<string[]>(() => splitDeck(search.you).length === 8 ? splitDeck(search.you) : player?.currentDeck ?? META_DECKS[0]!.cards);
  const [them, setThem] = useState<string[]>(() => (splitDeck(search.them).length === 8 ? splitDeck(search.them) : META_DECKS[1]!.cards));
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [voiceOn, setVoiceOn] = useState(false);
  const [speakOn, setSpeakOn] = useState(true);
  const [heard, setHeard] = useState("");
  const [chat, setChat] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [oppTag, setOppTag] = useState("");
  const [oppBusy, setOppBusy] = useState(false);
  const [incoming, setIncoming] = useState<MediaStream | null>(null);
  const spoken = useRef<string>("");
  const matchRef = useRef(match);
  matchRef.current = match;

  const brief = useMemo(() => (you.length === 8 && them.length === 8 ? matchupBrief(you, them) : null), [them, you]);

  useEffect(() => {
    if (search.you && splitDeck(search.you).length === 8) setYou(splitDeck(search.you));
    if (search.them && splitDeck(search.them).length === 8) setThem(splitDeck(search.them));
  }, [search.them, search.you]);

  useEffect(() => {
    if (player?.currentDeck?.length === 8 && splitDeck(search.you).length !== 8) {
      setYou(player.currentDeck);
    }
  }, [player, search.you]);

  useEffect(() => {
    if (!match?.running) return;
    const id = window.setInterval(() => {
      setMatch((m) => (m ? tick(m, 0.1) : m));
    }, 100);
    const beat = window.setInterval(() => {
      setMatch((m) => (m ? heartbeat(m) : m));
    }, 14000);
    return () => {
      window.clearInterval(id);
      window.clearInterval(beat);
    };
  }, [match?.running]);

  useEffect(() => {
    const line = match?.log[0];
    if (!line || !speakOn || !canSpeak()) return;
    if (spoken.current === line.id) return;
    spoken.current = line.id;
    speak(line.speak);
  }, [match?.log, speakOn]);

  const applyVoice = useCallback(
    (transcript: string) => {
      setHeard(transcript);
      const m = matchRef.current;
      const cmd = parseVoice(transcript, m?.you.deck ?? you, m?.them.deck ?? them);
      if (cmd.kind === "unknown") return;
      if (cmd.kind === "start") {
        setMatch((cur) => startMatch(cur ?? createMatch(you, them)));
        return;
      }
      if (cmd.kind === "pause") {
        setMatch((cur) => (cur ? { ...cur, running: false } : cur));
        return;
      }
      if (cmd.kind === "undo") {
        setMatch((cur) => (cur ? undoLast(cur) : cur));
        return;
      }
      if (cmd.kind === "mute") {
        setSpeakOn(false);
        stopSpeak();
        return;
      }
      if (cmd.kind === "unmute") {
        setSpeakOn(true);
        return;
      }
      if (cmd.kind === "overtime") {
        setMatch((cur) => (cur ? { ...cur, overtime: true, remaining: Math.max(cur.remaining, 1) } : cur));
        return;
      }
      if (cmd.kind === "play") {
        setMatch((cur) => {
          const base = cur ?? startMatch(createMatch(you, them));
          return playCard(base, cmd.side, cmd.key);
        });
      }
    },
    [them, you],
  );

  useEffect(() => {
    if (!voiceOn) return;
    if (!canListen()) {
      setMicError("Voice in needs Chrome or Safari on this device.");
      setVoiceOn(false);
      return;
    }
    setMicError(null);
    const stop = startListen({
      onResult: applyVoice,
      onError: (e) => {
        if (e === "not-allowed") setMicError("Mic blocked. Allow microphone, then tap Voice in again.");
      },
    });
    return () => stop();
  }, [applyVoice, voiceOn]);

  async function loadOpponent(tag: string) {
    setOppBusy(true);
    const [p, b] = await Promise.all([
      lookupPlayer({ data: { tag, apiKey: apiKey || undefined } }),
      lookupBattles({ data: { tag: player?.tag ?? tag, apiKey: apiKey || undefined } }),
    ]);
    setOppBusy(false);
    if (p.ok && p.data.currentDeck.length === 8) {
      setThem(p.data.currentDeck);
      return;
    }
    const last = b.ok ? b.data[0] : null;
    if (last?.opponentDeck?.length === 8) setThem(last.opponentDeck);
  }

  async function loadLastOpponent() {
    if (!player?.tag) return;
    setOppBusy(true);
    const b = await lookupBattles({ data: { tag: player.tag, apiKey: apiKey || undefined } });
    setOppBusy(false);
    const last = b.ok ? b.data[0] : null;
    if (last?.opponentDeck?.length === 8) setThem(last.opponentDeck);
    if (last?.deck?.length === 8) setYou(last.deck);
  }

  function begin() {
    const next = startMatch(createMatch(you, them));
    spoken.current = "";
    setMatch(next);
  }

  if (match) {
    return (
      <LiveHud
        match={match}
        voiceOn={voiceOn}
        speakOn={speakOn}
        heard={heard}
        chat={chat}
        onChat={setChat}
        onChatSend={(text) => {
          applyVoice(text);
          setChat("");
        }}
        micError={micError}
        onPlay={(side, key) => setMatch((m) => (m ? playCard(m, side, key) : m))}
        onUndo={() => setMatch((m) => (m ? undoLast(m) : m))}
        onToggleRun={() =>
          setMatch((m) => {
            if (!m) return m;
            return m.running ? { ...m, running: false } : m.startedAt ? { ...m, running: true } : startMatch(m);
          })
        }
        onVoice={() => setVoiceOn((v) => !v)}
        onSpeak={() => {
          setSpeakOn((v) => {
            if (v) stopSpeak();
            return !v;
          });
        }}
        onReset={() => {
          stopSpeak();
          setMatch(null);
          setVoiceOn(false);
        }}
        onElixir={(n) => setMatch((m) => (m ? setElixir(m, "you", n) : m))}
        incoming={incoming}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Live coach</p>
          <h1 className="mt-1 font-display text-5xl leading-none">Call the match</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Set both eights. A clanmate’s nearby iPhone (their own Apple ID) can be the camera. Share a window on a
            computer, or tap their cards. Clash Royale does not stream live plays.
          </p>
        </div>
        <Button onClick={begin} disabled={you.length !== 8 || them.length !== 8} className="h-12 px-6">
          Start live match
        </Button>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <DeckBuilder title="Your eight" deck={you} onChange={setYou} />
        <DeckBuilder title="Opponent eight" deck={them} onChange={setThem} />
      </section>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="font-display text-2xl">Load a list</div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => player?.currentDeck && setYou(player.currentDeck)} disabled={!player}>
              My current deck
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void loadLastOpponent()} disabled={oppBusy}>
              Last replay opponent
            </Button>
            {metaChipDecks().map((d) => (
              <Button key={d.id} type="button" variant="outline" size="sm" onClick={() => setThem(d.cards)}>
                Them: {d.name}
              </Button>
            ))}
          </div>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (oppTag.trim()) void loadOpponent(oppTag);
            }}
          >
            <Input value={oppTag} onChange={(e) => setOppTag(e.target.value)} placeholder="#OPPONENT" className="sm:w-56" />
            <Button type="submit" variant="outline" disabled={oppBusy}>
              {oppBusy ? "Loading…" : "Scout their current deck"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <LiveShare
        mode="setup"
        youDeck={you}
        themDeck={them}
        youHand={you.slice(0, 4)}
        onYouPlay={() => undefined}
        onThemPlay={() => undefined}
        onDecks={(a, b) => {
          if (a.length === 8) setYou(a);
          if (b.length === 8) setThem(b);
        }}
        incoming={incoming}
      />

      <LiveNearby
        presetCode={search.near}
        presetRole={search.as === "spot" ? "spot" : search.as === "host" ? "host" : undefined}
        onStream={setIncoming}
      />

      {brief ? (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="cyan">Matchup {brief.score}</Badge>
              <span className="font-display text-2xl leading-none">
                {brief.youArch} vs {brief.themArch}
              </span>
            </div>
            <ul className="grid gap-1 text-sm text-muted-foreground md:grid-cols-2">
              {brief.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Pick eight cards on each side to unlock the matchup sheet.</p>
      )}
    </div>
  );
}

function DeckBuilder({ title, deck, onChange }: { title: string; deck: string[]; onChange: (keys: string[]) => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return PLAYABLE.filter((c) => !query || c.name.toLowerCase().includes(query) || c.key.includes(query)).slice(0, 24);
  }, [q]);

  function toggle(key: string) {
    if (deck.includes(key)) onChange(deck.filter((k) => k !== key));
    else if (deck.length < 8) onChange([...deck, key]);
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-3xl leading-none">{title}</h2>
          <span className="text-sm tabular text-muted-foreground">{deck.length}/8</span>
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-16">
          {deck.map((k) => (
            <button key={k} type="button" onClick={() => toggle(k)} className="rounded-sm" title="Remove">
              <CardTile cardKey={k} size="md" />
            </button>
          ))}
        </div>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search to add a card" />
        {q.trim() ? (
          <div className="flex flex-wrap gap-1.5">
            {list.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => toggle(c.key)}
                className={cn("rounded-sm", deck.includes(c.key) && "ring-2 ring-primary")}
              >
                <CardTile cardKey={c.key} size="sm" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Search to swap a card. Tap a slot above to remove it.</p>
        )}
      </CardContent>
    </Card>
  );
}

function LiveHud({
  match,
  voiceOn,
  speakOn,
  heard,
  chat,
  onChat,
  onChatSend,
  micError,
  onPlay,
  onUndo,
  onToggleRun,
  onVoice,
  onSpeak,
  onReset,
  onElixir,
  incoming,
}: {
  match: LiveMatch;
  voiceOn: boolean;
  speakOn: boolean;
  heard: string;
  chat: string;
  onChat: (v: string) => void;
  onChatSend: (text: string) => void;
  micError: string | null;
  onPlay: (side: LiveSideId, key: string) => void;
  onUndo: () => void;
  onToggleRun: () => void;
  onVoice: () => void;
  onSpeak: () => void;
  onReset: () => void;
  onElixir: (n: number) => void;
  incoming: MediaStream | null;
}) {
  const phase = phaseOf(match);
  const lead = match.you.elixir - match.them.elixir;
  const latest = match.log[0];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Live</p>
          <div className="flex items-end gap-3">
            <h1 className="font-display text-5xl leading-none tabular">{formatClock(match)}</h1>
            <Badge variant={phase === "single" ? "default" : "warn"}>{phase} elixir</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onToggleRun}>
            {match.running ? <Pause className="size-4" /> : <Play className="size-4" />}
            {match.running ? "Pause" : "Resume"}
          </Button>
          <Button type="button" variant="outline" onClick={onUndo} disabled={!match.events.length}>
            <RotateCcw className="size-4" />
            Undo
          </Button>
          <Button type="button" variant={voiceOn ? "default" : "outline"} onClick={onVoice}>
            {voiceOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
            Voice in
          </Button>
          <Button type="button" variant={speakOn ? "default" : "outline"} onClick={onSpeak}>
            {speakOn ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            Coach out
          </Button>
          <Button type="button" variant="ghost" onClick={onReset}>
            End
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ElixirMeter label="You" value={match.you.elixir} tone="you" />
        <ElixirMeter label="Them" value={match.them.elixir} tone="them" />
      </div>
      <p className="text-sm text-muted-foreground">
        Elixir lead{" "}
        <span className={cn("tabular text-foreground", lead >= 2 && "text-win", lead <= -2 && "text-loss")}>
          {lead >= 0 ? "+" : ""}
          {lead.toFixed(1)}
        </span>
        {heard ? <span className="ml-3 text-primary">Heard: {heard}</span> : null}
        {micError ? <span className="ml-3 text-loss">{micError}</span> : null}
      </p>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (chat.trim()) onChatSend(chat.trim());
        }}
      >
        <Input
          value={chat}
          onChange={(e) => onChat(e.target.value)}
          placeholder="Chat the coach: they hog · I log · undo"
        />
        <Button type="submit" variant="outline">
          Send
        </Button>
      </form>

      <Card className="border-primary/30">
        <CardContent>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Coach</p>
          <p className="mt-1 font-display text-3xl leading-none text-foreground">{latest?.text ?? "Clock’s running. Call the first card."}</p>
        </CardContent>
      </Card>

      <LiveShare
        mode="match"
        youDeck={match.you.deck}
        themDeck={match.them.deck}
        youHand={inHand(match.you)}
        onYouPlay={(k) => onPlay("you", k)}
        onThemPlay={(k) => onPlay("them", k)}
        onElixir={onElixir}
        incoming={incoming}
      />

      <SideBoard title="Opponent — tap what they drop" side={match.them} onPlay={(k) => onPlay("them", k)} danger />
      <SideBoard title="You — tap what you drop" side={match.you} onPlay={(k) => onPlay("you", k)} />

      {match.log.length > 1 ? (
        <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto text-sm text-muted-foreground">
          {match.log.slice(1, 8).map((row) => (
            <li key={row.id}>{row.text}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ElixirMeter({ label, value, tone }: { label: string; value: number; tone: "you" | "them" }) {
  const pct = Math.min(100, (value / 10) * 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="font-display text-3xl tabular leading-none">{value.toFixed(1)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-sm bg-secondary">
        <div
          className={cn("h-full rounded-sm", tone === "you" ? "bg-primary" : "bg-warn")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SideBoard({
  title,
  side,
  onPlay,
  danger,
}: {
  title: string;
  side: LiveSide;
  onPlay: (key: string) => void;
  danger?: boolean;
}) {
  const hand = inHand(side);
  const queue = inQueue(side);
  return (
    <section>
      <h2 className="mb-2 font-display text-2xl">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {hand.map((k) => (
          <button
            key={`h-${k}`}
            type="button"
            onClick={() => onPlay(k)}
            className={cn(
              "flex min-h-11 flex-col items-center gap-1 rounded-md border border-border bg-card p-1.5",
              danger && "border-loss/40",
            )}
          >
            <CardTile cardKey={k} size="lg" />
            <span className="text-[10px] uppercase tracking-wide text-win">Hand</span>
          </button>
        ))}
        {queue.map((k) => (
          <button
            key={`q-${k}`}
            type="button"
            onClick={() => onPlay(k)}
            className="flex min-h-11 flex-col items-center gap-1 rounded-md border border-border bg-card/50 p-1.5"
          >
            <CardTile cardKey={k} size="md" />
            <span className="text-[10px] tabular text-muted-foreground">{untilHand(side, k)} off</span>
          </button>
        ))}
      </div>
    </section>
  );
}
