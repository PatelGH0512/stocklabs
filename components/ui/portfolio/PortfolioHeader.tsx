"use client";
import { cn } from "@/lib/utils";

interface PortfolioHeaderProps {
  marketStatus: any;
  marketLoading: boolean;
}

export default function PortfolioHeader({ marketStatus, marketLoading }: PortfolioHeaderProps) {
  const tz = marketStatus?.timezone || "UTC";
  const ts = typeof marketStatus?.t === "number" ? marketStatus.t * 1000 : Date.now();
  const d = new Date(ts);
  const day = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: tz }).format(d);
  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", timeZone: tz }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true, timeZone: tz }).format(d);
  const open = marketStatus?.isOpen === true || marketStatus?.open === true || marketStatus?.marketState === "open";
  const session = marketStatus?.session ?? null;
  const exchange = marketStatus?.exchange ?? "US";
  const holiday = marketStatus?.holiday ?? null;

  return (
    <div className="mb-6 rounded-xl border border-border bg-card text-card-foreground p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfolio Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your investments and market performance</p>
        </div>

        <div
          className="shrink-0 rounded-lg bg-muted px-3 py-2 border border-border text-sm text-foreground"
          aria-label={`Exchange ${exchange}. ${open ? "Open" : "Closed"}${session ? `, ${session}` : ""}${holiday ? `, Holiday: ${holiday}` : ""}. ${day}, ${date} ${time} ${tz}`}
        >
          <div className="flex-col items-center gap-3">
            <div className="rounded-full border border-border bg-card px-3 py-1 text-xs text-card-foreground flex items-center gap-2">
              <span className={cn("inline-block h-2 w-2 rounded-full", marketLoading ? "bg-muted-foreground" : open ? "bg-green-500" : "bg-red-500")} />
              <span className="text-muted-foreground">US Market:</span>
              <span className="font-medium">{marketLoading ? "Loading..." : open ? "Open" : "Closed"}</span>
            </div>
            <div className="text-sm ml-1 text-muted-foreground">{day}, {date}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
