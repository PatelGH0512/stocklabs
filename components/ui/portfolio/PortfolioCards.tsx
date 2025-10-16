"use client";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { HiTrendingUp, HiTrendingDown, HiCurrencyDollar, HiScale } from "react-icons/hi";

interface WatchlistLite {
  id: string;
  symbol: string;
  company: string;
}

interface PortfolioCardsProps {
  watchlist: WatchlistLite[];
  alerts: { id: string; active: boolean }[];
}

interface HoldingItem {
  id: string;
  symbol: string;
  company: string;
  shares: number;
  buyPrice: number;
  currentPrice: number;
}

export default function PortfolioCards({ watchlist, alerts }: PortfolioCardsProps) {
  const [holdings, setHoldings] = useState<HoldingItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/holdings", { cache: "no-store" });
        if (!res.ok) return;
        const data: any[] = await res.json();
        setHoldings(
          data.map((d) => ({
            id: d.id,
            symbol: d.symbol,
            company: d.company,
            shares: d.shares,
            buyPrice: d.buyPrice,
            currentPrice: Number(d.currentPrice || 0),
          }))
        );
      } catch {}
    };
    load();
  }, []);

  const symbolsKey = useMemo(
    () => holdings.map((h) => h.symbol).sort().join(","),
    [holdings]
  );

  useEffect(() => {
    const fetchQuotes = async () => {
      const symbols = holdings.map((h) => h.symbol).filter(Boolean);
      if (symbols.length === 0) return;
      try {
        const url = `/api/quotes?symbols=${encodeURIComponent(symbols.join(","))}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const data: Record<string, number> = await res.json();
        setHoldings((prev) =>
          prev.map((h) => ({
            ...h,
            currentPrice: data[h.symbol] ?? h.currentPrice,
          }))
        );
      } catch {}
    };
    fetchQuotes();
  }, [symbolsKey]);

  const {
    totalShares,
    avgCurrentPrice,
    totalValue,
    costBasis,
    valueChange,
    gainLossPct,
    isUp,
  } = useMemo(() => {
    const totalShares = holdings.reduce((acc, h) => acc + (h.shares || 0), 0);
    const totalValue = holdings.reduce(
      (acc, h) => acc + (h.currentPrice || 0) * (h.shares || 0),
      0
    );
    const costBasis = holdings.reduce(
      (acc, h) => acc + (h.buyPrice || 0) * (h.shares || 0),
      0
    );
    const valueChange = totalValue - costBasis;
    const gainLossPct = costBasis > 0 ? (valueChange / costBasis) * 100 : 0;
    const isUp = gainLossPct >= 0;
    const avgCurrentPrice = totalShares > 0 ? totalValue / totalShares : 0;
    return {
      totalShares,
      avgCurrentPrice,
      totalValue,
      costBasis,
      valueChange,
      gainLossPct,
      isUp,
    };
  }, [holdings]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {[
        {
          label: "Current Price",
          value: `$${avgCurrentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          change: `${gainLossPct.toFixed(2)}%`,
          trend: isUp ? "up" as const : "down" as const,
          icon: HiCurrencyDollar,
          color: isUp ? "emerald" : "red",
        },
        {
          label: "Total Value",
          value: `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          icon: HiScale,
          color: "blue",
        },
        {
          label: "Gain/Loss",
          value: `${isUp ? "+" : ""}${gainLossPct.toFixed(2)}%`,
          subValue: `$${Math.abs(valueChange).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          icon: isUp ? HiTrendingUp : HiTrendingDown,
          color: isUp ? "emerald" : "red",
        },
      ].map((stat, index) => (
        <div
          key={index}
          className={cn(
            "relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground p-5"
          )}
        >
          <div className="flex items-start justify-between">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center",
              stat.color === "emerald" && "bg-emerald-500/15 text-emerald-600",
              stat.color === "red" && "bg-red-500/15 text-red-600",
              stat.color === "blue" && "bg-blue-500/15 text-blue-600"
            )}>
              <stat.icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <div className="text-2xl font-semibold">{stat.value}</div>
            {"change" in stat && (stat as any).change && (
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-md",
                  (stat as any).trend === "up" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                )}
              >
                {(stat as any).change}
              </span>
            )}
          </div>
          {"subValue" in stat && (stat as any).subValue && (
            <div className={cn("mt-1 text-xs",
              stat.color === "emerald" ? "text-emerald-600" : stat.color === "red" ? "text-red-600" : "text-muted-foreground"
            )}>
              {(stat as any).subValue}
            </div>
          )}
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l to-transparent",
              stat.color === "emerald" && "from-emerald-500/10",
              stat.color === "red" && "from-red-500/10",
              stat.color === "blue" && "from-blue-500/10"
            )}
          />
        </div>
      ))}

      <div className="relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground p-5">
        <div className="flex items-start justify-between">
          <div className="h-8 w-8 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11 21a1 1 0 0 1-1-1v-6H6l7-11v7h4l-6 11h0Z"/></svg>
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">Quick Stats</div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <div className="text-muted-foreground">In Watchlist</div>
          <div className="font-medium">{watchlist.length}</div>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <div className="text-muted-foreground">Active Alerts</div>
          <div className="font-medium">{alerts.filter((a) => a.active).length}</div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-amber-500/10 to-transparent"/>
      </div>
    </div>
  );
}
