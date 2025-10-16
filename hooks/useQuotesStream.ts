"use client";

import { useEffect, useRef } from "react";

// A shared WebSocket connection to Finnhub for live trade prices across the app.
// - Reuses a single WS connection per browser tab
// - Deduplicates subscriptions
// - Automatically subscribes/unsubscribes on symbols change
// - Requires NEXT_PUBLIC_FINNHUB_API_KEY

let sharedWS: WebSocket | null = null;
let isOpen = false;
const pendingSubs = new Set<string>();
const activeSubs = new Set<string>();
const listeners = new Set<(s: string, p: number, t: number) => void>();
let token: string | undefined;

function ensureSocket() {
  if (sharedWS && (sharedWS.readyState === WebSocket.OPEN || sharedWS.readyState === WebSocket.CONNECTING)) {
    return sharedWS;
  }
  if (!token) return null;
  const url = `wss://ws.finnhub.io?token=${encodeURIComponent(token)}`;
  sharedWS = new WebSocket(url);
  isOpen = false;

  sharedWS.addEventListener("open", () => {
    isOpen = true;
    // flush pending subscriptions
    for (const sym of pendingSubs) {
      try {
        sharedWS?.send(JSON.stringify({ type: "subscribe", symbol: sym }));
        activeSubs.add(sym);
      } catch {}
    }
    pendingSubs.clear();
  });

  sharedWS.addEventListener("message", (evt) => {
    try {
      const payload = JSON.parse(evt.data);
      if (payload?.data && Array.isArray(payload.data)) {
        for (const d of payload.data) {
          const s = String(d?.s || "");
          const p = Number(d?.p);
          const t = Number(d?.t) || Date.now();
          if (s && Number.isFinite(p)) {
            for (const fn of listeners) fn(s, p, t);
          }
        }
      }
    } catch {}
  });

  sharedWS.addEventListener("close", () => {
    isOpen = false;
    activeSubs.clear();
    // attempt simple reconnect after short delay
    setTimeout(() => {
      if (!sharedWS || sharedWS.readyState === WebSocket.CLOSED) {
        ensureSocket();
        // re-queue symbols to subscribe after reconnect
        for (const sym of Array.from(activeSubs)) pendingSubs.add(sym);
      }
    }, 1500);
  });

  return sharedWS;
}

function subscribeSymbol(sym: string) {
  if (!sym) return;
  if (activeSubs.has(sym) || pendingSubs.has(sym)) return;
  if (isOpen && sharedWS) {
    try {
      sharedWS.send(JSON.stringify({ type: "subscribe", symbol: sym }));
      activeSubs.add(sym);
      return;
    } catch {}
  }
  pendingSubs.add(sym);
}

function unsubscribeSymbol(sym: string) {
  if (!sym) return;
  activeSubs.delete(sym);
  pendingSubs.delete(sym);
  if (isOpen && sharedWS) {
    try {
      sharedWS.send(JSON.stringify({ type: "unsubscribe", symbol: sym }));
    } catch {}
  }
}

export function useQuotesStream(
  symbols: string[],
  onPrice: (symbol: string, price: number, ts: number) => void
) {
  token = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

  // Register listener lifetime
  const cbRef = useRef(onPrice);
  cbRef.current = onPrice;

  useEffect(() => {
    const handler = (s: string, p: number, t: number) => cbRef.current(s, p, t);
    listeners.add(handler);
    ensureSocket();
    return () => {
      listeners.delete(handler);
    };
  }, []);

  // Manage symbol subscriptions
  useEffect(() => {
    const clean = Array.from(new Set((symbols || []).map((s) => s?.toUpperCase()).filter(Boolean)));
    if (!token || clean.length === 0) return;

    ensureSocket();
    const prev = new Set(activeSubs);

    // subscribe to new
    for (const s of clean) subscribeSymbol(s);
    // unsubscribe those not present anymore
    for (const s of prev) if (!clean.includes(s)) unsubscribeSymbol(s);

    return () => {
      // On unmount, we do not close the socket to allow reuse by other components.
      for (const s of clean) unsubscribeSymbol(s);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(Array.from(new Set((symbols || []).map((s) => s?.toUpperCase()).filter(Boolean))))]);
}
