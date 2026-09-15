import { Copy, Radio, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { startCameraShare } from "@/lib/cr/vision";
import {
  answerCalls,
  callHost,
  destroyPeer,
  joinPath,
  newRoomCode,
  openGuest,
  openHost,
} from "@/lib/cr/nearby";
import { track } from "@/lib/ops/log";
import type { Peer } from "peerjs";

type Props = {
  presetCode?: string;
  presetRole?: "host" | "spot";
  onStream: (stream: MediaStream) => void;
};

export function LiveNearby({ presetCode, presetRole, onStream }: Props) {
  const peerRef = useRef<Peer | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const stopAnswer = useRef<(() => void) | null>(null);
  const [code, setCode] = useState(presetCode?.toUpperCase() ?? "");
  const [role, setRole] = useState<"idle" | "host" | "spot">(presetRole === "spot" && presetCode ? "spot" : "idle");
  const [status, setStatus] = useState("Different Apple IDs are fine. Continuity is not.");
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    return () => {
      stopAnswer.current?.();
      localRef.current?.getTracks().forEach((t) => t.stop());
      destroyPeer(peerRef.current);
    };
  }, []);

  useEffect(() => {
    if (presetRole === "spot" && presetCode && role === "spot") {
      void becomeSpot(presetCode);
    }
    // one-shot from the join link
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function becomeHost() {
    setError(null);
    const next = newRoomCode();
    setCode(next);
    setRole("host");
    setStatus("Waiting for the clanmate’s camera… AirDrop them the join link.");
    try {
      destroyPeer(peerRef.current);
      const peer = await openHost(next);
      peerRef.current = peer;
      stopAnswer.current?.();
      stopAnswer.current = answerCalls(peer, (stream) => {
        setLinked(true);
        setStatus("Clanmate camera is live. Lock the hand when the four cards show.");
        track("nearby");
        onStream(stream);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not host.");
      setRole("idle");
    }
  }

  async function becomeSpot(raw?: string) {
    const room = (raw ?? code).trim().toUpperCase();
    if (room.length < 4) {
      setError("Need the 4-character room code.");
      return;
    }
    setError(null);
    setCode(room);
    setRole("spot");
    setStatus("Point this camera at their Clash Royale screen.");
    try {
      const cam = await startCameraShare();
      localRef.current = cam;
      onStream(cam);
      destroyPeer(peerRef.current);
      const peer = await openGuest();
      peerRef.current = peer;
      await callHost(peer, room, cam);
      setLinked(true);
      setStatus("Streaming to the host. Keep their hand row in frame.");
      track("nearby");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join.");
    }
  }

  function copyJoin() {
    const url = joinPath(code);
    void navigator.clipboard.writeText(url).then(
      () => setStatus("Join link copied. AirDrop it — works with their Apple ID."),
      () => setStatus(url),
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Nearby iPhone</p>
            <h2 className="font-display text-2xl leading-none">Clanmate camera</h2>
          </div>
          {linked ? <Badge variant="win">Linked</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Safari cannot capture Clash Royale on the same iPhone. A clanmate with their own Apple ID holds a second
          phone, opens this page, and points the camera at your match. Coach talks on that phone. AirDrop the link —
          Continuity / iPhone Mirroring will not work across accounts.
        </p>
        <p className="text-sm text-muted-foreground">
          FaceTime → Share My Screen also works across Apple IDs if you’d rather they watch in FaceTime and run Live
          on a tablet.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={role === "host" ? "default" : "outline"} onClick={() => void becomeHost()}>
            <Radio className="size-4" />
            Host on this phone
          </Button>
          <Button type="button" variant={role === "spot" ? "default" : "outline"} onClick={() => void becomeSpot()}>
            <Smartphone className="size-4" />
            I’m the camera
          </Button>
        </div>
        {role === "host" && code ? (
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-elevated px-3 py-2">
            <span className="font-display text-4xl tracking-[0.2em] text-primary">{code}</span>
            <Button type="button" variant="outline" size="sm" onClick={copyJoin}>
              <Copy className="size-4" />
              Copy join link
            </Button>
          </div>
        ) : null}
        {role !== "host" ? (
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Room code"
              className="max-w-40 font-display tracking-[0.2em]"
              maxLength={6}
            />
          </div>
        ) : null}
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <p className="text-sm text-muted-foreground">{status}</p>
      </CardContent>
    </Card>
  );
}
