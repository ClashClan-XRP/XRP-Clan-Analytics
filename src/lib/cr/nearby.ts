import type { MediaConnection, Peer } from "peerjs";

const ALPH = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function newRoomCode(): string {
  let out = "";
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  for (const n of buf) out += ALPH[n! % ALPH.length];
  return out;
}

export function peerIdFor(code: string): string {
  return `xrpclan-${code.trim().toUpperCase()}`;
}

export function joinPath(code: string): string {
  if (typeof window === "undefined") return `#/live?near=${code}`;
  const { origin, pathname, hash } = window.location;
  const q = `near=${encodeURIComponent(code.toUpperCase())}&as=spot`;
  if (hash.startsWith("#/")) return `${origin}${pathname}#/live?${q}`;
  return `${origin}/live?${q}`;
}

function waitOpen(peer: Peer): Promise<string> {
  return new Promise((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error("Nearby broker timed out.")), 12000);
    peer.on("open", (id) => {
      window.clearTimeout(t);
      resolve(id);
    });
    peer.on("error", (err) => {
      window.clearTimeout(t);
      reject(err);
    });
  });
}

export async function openHost(code: string): Promise<Peer> {
  const { Peer } = await import("peerjs");
  const peer = new Peer(peerIdFor(code));
  await waitOpen(peer);
  return peer;
}

export async function openGuest(): Promise<Peer> {
  const { Peer } = await import("peerjs");
  const peer = new Peer();
  await waitOpen(peer);
  return peer;
}

export function answerCalls(peer: Peer, onStream: (stream: MediaStream) => void): () => void {
  const calls: MediaConnection[] = [];
  const handler = (call: MediaConnection) => {
    call.answer();
    call.on("stream", onStream);
    calls.push(call);
  };
  peer.on("call", handler);
  return () => {
    calls.forEach((c) => c.close());
  };
}

export async function callHost(peer: Peer, code: string, stream: MediaStream, onStream?: (s: MediaStream) => void): Promise<MediaConnection> {
  const call = peer.call(peerIdFor(code), stream);
  if (onStream) call.on("stream", onStream);
  return call;
}

export function destroyPeer(peer: Peer | null) {
  try {
    peer?.destroy();
  } catch {
    /* already closed */
  }
}
