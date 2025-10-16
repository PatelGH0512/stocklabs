"use client";

import { useEffect, useRef } from "react";

// Streams last trade prices from Finnhub WS for the given symbols.
// Uses NEXT_PUBLIC_FINNHUB_API_KEY. One connection per hook instance.
export function useFinnhubWS(
  symbols: string[],
  onPrice: (symbol: string, price: number, ts: number) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const token = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

  useEffect(() => {
    const clean = Array.from(new Set((symbols || []).map((s) => s?.toUpperCase()).filter(Boolean)));
    if (!token || clean.length === 0) {
      return; // nothing to do
    }

    const url = `wss://ws.finnhub.io?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    const subscribe = (sym: string) => {
      const msg = JSON.stringify({ type: "subscribe", symbol: sym });
      try { ws.send(msg); } catch {}
    };
    const unsubscribe = (sym: string) => {
      const msg = JSON.stringify({ type: "unsubscribe", symbol: sym });
      try { ws.send(msg); } catch {}
    };

    const onOpen = () => {
      clean.forEach(subscribe);
    };

    const onMessage = (evt: MessageEvent) => {
      try {
        const payload = JSON.parse(evt.data);
        // Expected: { type: 'trade', data: [{ s, p, t, v, c } ... ] }
        if (payload?.data && Array.isArray(payload.data)) {
          for (const d of payload.data) {
            const s = String(d?.s || "");
            const p = Number(d?.p);
            const t = Number(d?.t);
            if (s && Number.isFinite(p)) onPrice(s, p, t || Date.now());
          }
        }
      } catch {}
    };

    const onError = () => {
      // No-op: avoid console noise; consumers can fallback to HTTP quotes.
    };

    ws.addEventListener("open", onOpen);
    ws.addEventListener("message", onMessage);
    ws.addEventListener("error", onError);

    return () => {
      try {
        clean.forEach(unsubscribe);
      } catch {}
      try { ws.close(); } catch {}
      wsRef.current = null;
    };
    // We intentionally do not put onPrice in deps to avoid re-creating socket on each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    token,
    JSON.stringify(
      Array.from(new Set((symbols || []).map((s) => s?.toUpperCase()).filter(Boolean)))
    ),
  ]);
}
