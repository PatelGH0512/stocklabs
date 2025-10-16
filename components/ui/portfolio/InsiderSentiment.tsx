"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

type InsiderSentimentItem = {
  symbol: string;
  year: number;
  month: number;
  change: number;
  mspr: number;
};

export type InsiderSentimentSummary = {
  symbol: string;
  mspr: number;
  signal:
    | "Strong Bullish"
    | "Bullish"
    | "Neutral"
    | "Bearish"
    | "Strong Bearish";
  trend:
    | "Increasing Insider Buys"
    | "Slight Increase in Buys"
    | "Balanced"
    | "Slight Increase in Sells"
    | "Heavy Insider Selling";
  latest: InsiderSentimentItem | null;
  previous: InsiderSentimentItem | null;
};

function msprColor(mspr: number) {
  if (mspr >= 20) return { dot: "bg-green-500", text: "text-green-600" };
  if (mspr <= -20) return { dot: "bg-red-500", text: "text-red-500" };
  return { dot: "bg-gray-400", text: "text-muted-foreground" };
}

function formatMonth(item?: InsiderSentimentItem | null) {
  if (!item) return "-";
  const date = new Date(item.year, (item.month || 1) - 1, 1);
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export default function InsiderSentiment({ symbols }: { symbols: string[] }) {
  const [data, setData] = useState<InsiderSentimentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uniqueSymbols = useMemo(
    () =>
      Array.from(
        new Set((symbols || []).map((s) => s?.toUpperCase()).filter(Boolean))
      ).slice(0, 8),
    [symbols]
  );

  useEffect(() => {
    const run = async () => {
      if (uniqueSymbols.length === 0) return;
      setLoading(true);
      setError(null);
      try {
        const url = `/api/insider-sentiment?symbols=${encodeURIComponent(
          uniqueSymbols.join(",")
        )}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load insider sentiment");
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } catch (e: any) {
        setError(e?.message || "Error");
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [uniqueSymbols.join(",")]);

  if (uniqueSymbols.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden border bg-card text-card-foreground mb-6 h-[420px] lg:h-[420px] flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <h2 className="text-xl font-semibold">Insider Sentiment</h2>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="What is Insider Sentiment?"
            >
              <Info className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>What is Insider Sentiment (MSPR)?</DialogTitle>
              <DialogDescription>
                Insider Sentiment measures how company insiders (executives,
                directors, key employees) feel about their company’s stock based
                on their own buying and selling activity.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm text-foreground p-4 flex-1 overflow-y-auto">
              <p>
                MSPR ranges from <strong>-100</strong> (most negative) to{" "}
                <strong>+100</strong> (most positive).
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>
                  <strong>+60 to +100</strong> Strong Bullish — heavy insider
                  buying.
                </li>
                <li>
                  <strong>+20 to +59</strong> Bullish — more buying than
                  selling.
                </li>
                <li>
                  <strong>-19 to +19</strong> Neutral — balanced buy/sell.
                </li>
                <li>
                  <strong>-59 to -20</strong> Bearish — more selling than
                  buying.
                </li>
                <li>
                  <strong>-100 to -60</strong> Strong Bearish — heavy insider
                  selling.
                </li>
              </ul>
              <p className="text-muted-foreground">
                The 30–90 day signal and trend summarize the latest MSPR level
                and its recent change.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-full flex-1 overflow-y-auto scrollbar-hide-default">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">
            Loading insider sentiment…
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-500">{error}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-muted text-muted-foreground text-sm">
              <tr>
                <th className="text-left p-4">Ticker</th>
                <th className="text-left p-4">Insider Sentiment (MSPR)</th>
                <th className="text-left p-4">30–90 Day Signal</th>
                <th className="text-left p-4">Insider Trend</th>
                <th className="text-left p-4">Latest Month</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const color = msprColor(row.mspr);
                const sign = row.mspr > 0 ? "+" : "";
                return (
                  <tr key={row.symbol} className="border-t border-border">
                    <td className="p-4 text-foreground font-medium">
                      {row.symbol}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn("h-2 w-2 rounded-full", color.dot)}
                        />
                        <span className={cn("text-sm font-medium", color.text)}>
                          {sign}
                          {Math.round(row.mspr)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-foreground">{row.signal}</td>
                    <td className="p-4 text-foreground">{row.trend}</td>
                    <td className="p-4 text-muted-foreground text-sm">
                      {formatMonth(row.latest)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
