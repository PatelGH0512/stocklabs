"use client";
import { cn } from "@/lib/utils";

interface WatchlistLite {
  id: string;
  symbol: string;
  company: string;
}

interface PortfolioCardsProps {
  watchlist: WatchlistLite[];
  alerts: { id: string; active: boolean }[];
}

export default function PortfolioCards({ watchlist, alerts }: PortfolioCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <div className="relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1Zm1 17.5h-2v-2h2v2Zm2.07-7.75-.9.92c-.72.73-1.17 1.23-1.17 2.33h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26a2 2 0 1 0-2.83-2.83 2.02 2.02 0 0 0-.59 1.41H6.99A4.99 4.99 0 0 1 14 5.09c1.33 1.33 1.33 3.49 0 4.82Z"/></svg>
            </div>
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">Total Value</div>
        <div className="text-2xl font-semibold">$4,700.42</div>
        <div className="mt-1 text-xs text-muted-foreground">Avg. Cost Basis: $46.44</div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-blue-500/10 to-transparent"/>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground p-5">
        <div className="flex items-start justify-between">
          <div className="h-8 w-8 rounded-full bg-green-500/15 text-green-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17h2l3.29-3.29 3.3 3.3L20 9.59l1.41 1.41L12.59 20 8.29 15.71 5 19V17zM3 5h18v2H3z"/></svg>
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">Total Gain/Loss</div>
        <div className="text-2xl font-semibold text-green-600">+532.63%</div>
        <div className="mt-1 text-xs text-muted-foreground">($3,567.42) · Daily Change: 275.28%</div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-green-500/10 to-transparent"/>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground p-5">
        <div className="flex items-start justify-between">
          <div className="h-8 w-8 rounded-full bg-purple-500/15 text-purple-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10.012 10.012 0 0 0 12 2Zm1 17.93V20h-2v-.07A8.006 8.006 0 0 1 4.07 13H4v-2h.07A8.006 8.006 0 0 1 11 4.07V4h2v.07A8.006 8.006 0 0 1 19.93 11H20v2h-.07A8.006 8.006 0 0 1 13 19.93Z"/></svg>
          </div>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">Portfolio Analytics</div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="text-muted-foreground">Holdings</div>
          <div className="text-purple-500 font-medium">{watchlist.length} stocks</div>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <div className="text-muted-foreground">Top Performer</div>
          <div className="text-purple-500 font-medium">{watchlist[0]?.symbol || "—"}</div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-purple-500/10 to-transparent"/>
      </div>

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
