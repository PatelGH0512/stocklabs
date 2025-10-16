"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RecommendationItem = {
  symbol: string;
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
};

export default function RecommendationTrends({ symbols }: { symbols: string[] }) {
  const uniqueSymbols = useMemo(
    () => Array.from(new Set((symbols || []).map((s) => s?.toUpperCase()).filter(Boolean))),
    [symbols]
  );

  const [data, setData] = useState<RecommendationItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (uniqueSymbols.length === 0) {
        setData([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/recommendations?symbols=${encodeURIComponent(uniqueSymbols.join(","))}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          setData([]);
          return;
        }
        const items: RecommendationItem[] = await res.json();
        const filtered = (items || []).filter((x) => x && x.symbol);
        setData(filtered);
        setIndex(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [uniqueSymbols.join(",")]);

  if (uniqueSymbols.length === 0) return null;

  const current = data[index] || null;
  const next = () => setIndex((i) => (data.length === 0 ? 0 : (i + 1) % data.length));
  const prev = () => setIndex((i) => (data.length === 0 ? 0 : (i - 1 + data.length) % data.length));

  return (
    <div className="rounded-xl overflow-hidden border bg-card text-card-foreground h-[420px] lg:h-[420px] flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="text-xl font-semibold">Recommendation Trends</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prev} disabled={loading || data.length <= 1} aria-label="Previous">
            ←
          </Button>
          <Button variant="outline" size="icon" onClick={next} disabled={loading || data.length <= 1} aria-label="Next">
            →
          </Button>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto scrollbar-hide-default">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : current ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-foreground font-medium">{current.symbol}</div>
                <div className="text-xs text-muted-foreground">Period: {current.period || "-"}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {index + 1} / {data.length}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Metric label="Strong Buy" value={current.strongBuy} tone="buy-strong" />
              <Metric label="Buy" value={current.buy} tone="buy" />
              <Metric label="Hold" value={current.hold} tone="hold" />
              <Metric label="Sell" value={current.sell} tone="sell" />
              <Metric label="Strong Sell" value={current.strongSell} tone="sell-strong" />
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No recommendations available.</div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "buy-strong" | "buy" | "hold" | "sell" | "sell-strong" }) {
  const toneClass =
    tone === "buy-strong"
      ? "bg-green-500/15 text-green-600"
      : tone === "buy"
      ? "bg-emerald-500/15 text-emerald-600"
      : tone === "hold"
      ? "bg-amber-500/15 text-amber-600"
      : tone === "sell"
      ? "bg-rose-500/15 text-rose-600"
      : "bg-red-500/15 text-red-600";
  return (
    <div className={cn("flex items-center justify-between rounded-lg px-3 py-2 border", "bg-muted/30")}> 
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold rounded px-2 py-0.5", toneClass)}>{Number(value || 0)}</span>
    </div>
  );
}
