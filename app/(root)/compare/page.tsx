"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import { BASELINE_WIDGET_CONFIG } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import {
  Clipboard as ClipboardIcon,
  Download as DownloadIcon,
  Sparkles as SparklesIcon,
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Circle,
} from "lucide-react";

/* ----------------------------- Types ---------------------------------- */
type SearchItem = {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  tvSymbol?: string | undefined;
  isInWatchlist?: boolean;
};

/* -------------------------- Utility helpers --------------------------- */
const safeJson = async (res: Response) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

/* ------------------------- Main Component ----------------------------- */
export default function ComparePage() {
  /* --------------------------- Search / Select ------------------------- */
  const [query, setQuery] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selected, setSelected] = useState<SearchItem[]>([]);

  /* ------------------------- AI report state -------------------------- */
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  /* TradingView widget script (kept same as original) */
  const scriptUrl =
    "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

  /* --------------------------- Debounce ref --------------------------- */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Debounced searching (no external deps like lodash) */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // empty query resets results
    if (!query.trim()) {
      setResults([]);
      setLoadingSearch(false);
      return;
    }

    // schedule search
    debounceRef.current = setTimeout(async () => {
      try {
        setLoadingSearch(true);
        const res = await fetch(
          `/api/stocks/search?q=${encodeURIComponent(query.trim())}`
        );
        if (!res.ok) {
          // don't throw raw; attempt to parse text
          const txt = await res.text();
          console.error("Search fail:", res.status, txt);
          setResults([]);
          return;
        }
        const data = (await safeJson(res)) as SearchItem[] | null;
        setResults(data ?? []);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Safely extract plain text from ReactMarkdown children
  const nodeToText = (node: any): string => {
    if (node == null) return "";
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map((n) => nodeToText(n)).join("");
    if (typeof node === "object" && "props" in node)
      return nodeToText((node as any).props?.children);
    return "";
  };

  // Custom ReactMarkdown renderers for a clearer, more spacious AI report
  const mdComponents = useMemo(() => {
    return {
      h1: ({ children }: any) => (
        <h1 className="text-2xl md:text-3xl font-bold mt-6 mb-3 tracking-tight">
          {children}
        </h1>
      ),
      h2: ({ children }: any) => (
        <h2 className="text-xl md:text-2xl font-semibold mt-6 mb-3 tracking-tight">
          {children}
        </h2>
      ),
      h3: ({ children }: any) => (
        <h3 className="text-lg md:text-xl font-semibold mt-5 mb-2">
          {children}
        </h3>
      ),
      p: ({ children }: any) => {
        const text = nodeToText(children);
        const match = text.match(/^\s*\[(BUY|SELL|HOLD)\]\s*(.*)/i);
        if (match) {
          const tag = match[1].toUpperCase();
          const rest = match[2];
          const Icon =
            tag === "BUY" ? TrendingUp : tag === "SELL" ? TrendingDown : Circle;
          const colorBadge =
            tag === "BUY"
              ? "text-green-400"
              : tag === "SELL"
              ? "text-red-400"
              : "text-yellow-400";
          const borderColor =
            tag === "BUY"
              ? "border-green-500/30"
              : tag === "SELL"
              ? "border-red-500/30"
              : "border-yellow-500/30";
          const bgColor =
            tag === "BUY"
              ? "bg-green-50/10"
              : tag === "SELL"
              ? "bg-red-50/10"
              : "bg-yellow-50/10";
          return (
            <div
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 my-3",
                bgColor,
                borderColor
              )}
            >
              <Icon className={cn("h-5 w-5 mt-0.5", colorBadge)} />
              <div>
                <div
                  className={cn(
                    "text-sm font-semibold uppercase tracking-wide",
                    colorBadge
                  )}
                >
                  {tag}
                </div>
                {rest && <p className="mt-1 leading-relaxed text-sm">{rest}</p>}
              </div>
            </div>
          );
        }
        return <p className="mt-3 leading-relaxed">{children}</p>;
      },
      ul: ({ children }: any) => (
        <ul className="mt-3 ml-5 list-disc space-y-2">{children}</ul>
      ),
      ol: ({ children }: any) => (
        <ol className="mt-3 ml-5 list-decimal space-y-2">{children}</ol>
      ),
      li: ({ children }: any) => {
        const text = nodeToText(children);
        const m = text.match(/\b(BUY|SELL|HOLD)\b/i);
        const badge = m?.[1]?.toUpperCase();
        const badgeBg =
          badge === "BUY"
            ? "bg-green-500/20"
            : badge === "SELL"
            ? "bg-red-500/20"
            : "bg-yellow-500/20";
        const badgeText =
          badge === "BUY"
            ? "text-green-400"
            : badge === "SELL"
            ? "text-red-400"
            : "text-yellow-400";
        return (
          <li className="leading-relaxed">
            {badge ? (
              <span
                className={cn(
                  "inline-flex items-center justify-center px-2 py-0.5 mr-2 rounded text-[11px] font-semibold",
                  badgeBg,
                  badgeText
                )}
              >
                {badge}
              </span>
            ) : null}
            {children}
          </li>
        );
      },
      blockquote: ({ children }: any) => (
        <blockquote className="mt-4 border-l-4 border-indigo-500/40 pl-4 italic text-muted-foreground">
          {children}
        </blockquote>
      ),
      code: ({ inline, children, className, ...props }: any) => {
        if (inline)
          return (
            <code
              className="px-1 py-0.5 rounded bg-gray-800/60 text-[13px]"
              {...props}
            >
              {children}
            </code>
          );
        return (
          <pre className="mt-3 rounded-lg p-3 bg-gray-900/70 overflow-auto text-[13px]">
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        );
      },
      a: ({ children, href }: any) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
        >
          {children}
        </a>
      ),
      strong: ({ children }: any) => (
        <strong className="text-gray-400 font-semibold">{children}</strong>
      ),
    } as const;
  }, []);

  /* ----------------------- Primary & comparison ----------------------- */
  const primary = selected[0];

  const compareSymbols = useMemo(() => {
    if (!primary) return [] as string[];
    return selected
      .slice(1)
      .map((s) => (s.tvSymbol ? s.tvSymbol : s.symbol?.toUpperCase()))
      .filter(Boolean) as string[];
  }, [selected, primary]);

  const chartConfig = useMemo(() => {
    if (!primary) return null;
    const cfg: any = {
      ...BASELINE_WIDGET_CONFIG(primary.tvSymbol || primary.symbol),
      compareSymbols,
      hide_top_toolbar: false,
      hide_legend: false,
      details: false,
      allow_symbol_change: true,
    };
    return cfg;
  }, [primary, compareSymbols]);

  /* -------------------------- Selection helpers ----------------------- */
  const addSymbol = (item: SearchItem) => {
    // prevent duplicates (by symbol)
    if (selected.find((s) => s.symbol === item.symbol)) return;
    setSelected((prev) => [...prev, item]);
    // clear input + results for quick re-add
    setQuery("");
    setResults([]);
  };

  const removeSymbol = (sym: string) => {
    setSelected((prev) => prev.filter((s) => s.symbol !== sym));
  };

  /* --------------------------- Analyze API ---------------------------- */
  const analyze = async () => {
    try {
      setError("");
      setReport("");
      setAnalyzing(true);
      const symbols = selected.map((s) => s.symbol);
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols }),
      });

      if (!res.ok) {
        // try to extract useful error body
        const txt = await res.text();
        console.error("Compare API error:", res.status, txt);
        throw new Error(txt || `Compare API failed: ${res.status}`);
      }

      const data = await safeJson(res);
      setReport((data && (data.report as string)) || "");
    } catch (e: any) {
      console.error("Analyze error:", e);
      setError(e?.message || "Failed to analyze");
    } finally {
      setAnalyzing(false);
    }
  };

  /* ---------------------------- Clipboard ----------------------------- */
  const copyReport = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
      setError("Unable to copy to clipboard.");
    }
  };

  /* --------------------------- Download file ------------------------- */
  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().split("T")[0];
    a.href = url;
    a.download = `investment-report-${selected
      .map((s) => s.symbol)
      .join("-")}-${date}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Compare Stocks
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile-only Analyze */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={() => setSelected([])}
                className="p-2 rounded-lg bg-gray-800/40 border border-gray-600/40"
                title="Clear"
              >
                Clear
              </button>
              <button
                onClick={analyze}
                disabled={!selected.length || analyzing}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-semibold",
                  !selected.length || analyzing
                    ? "bg-gray-700/40 text-gray-400 border border-gray-600/40"
                    : "yellow-btn"
                )}
              >
                {analyzing ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </div>
        </header>

        {/* ----- Add Symbols Card ----- */}
        <section className="tv-card relative z-50 p-4 md:p-6">
          <div className="tv-card-header !p-0 !mb-3">
            <h3 className="tv-card-title">Add Symbols</h3>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative w-full md:max-w-2xl">
                <Input
                  placeholder="Search by symbol or company name (e.g., AAPL, Tesla)"
                  value={query}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setQuery(e.target.value)
                  }
                  aria-label="Search stocks"
                  className="!bg-transparent"
                />

                {/* Search dropdown */}
                {query.trim() && (
                  <div
                    className={cn(
                      "absolute z-50 mt-2 w-full rounded-lg border border-border bg-popover/95 backdrop-blur p-1 shadow-xl backdrop-blur-md shadow-2xl",
                      loadingSearch ? "opacity-60" : "opacity-100"
                    )}
                    role="listbox"
                    aria-expanded="true"
                  >
                    {/* Loading */}
                    {loadingSearch && (
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                        <svg
                          className="animate-spin h-4 w-4 text-primary"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeOpacity="0.2"
                          />
                          <path
                            d="M22 12A10 10 0 0012 2"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                        Searching...
                      </div>
                    )}

                    {/* No results */}
                    {!loadingSearch && results.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No results
                      </div>
                    )}

                    {/* Results */}
                    {!loadingSearch &&
                      results.slice(0, 8).map((r) => (
                        <button
                          key={`${r.symbol}-${r.exchange}`}
                          onClick={() => addSymbol(r)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-800/30 rounded flex items-center justify-between transition-colors"
                          role="option"
                        >
                          <div>
                            <div className="text-sm font-semibold">
                              {r.symbol}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {r.name}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.exchange}
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Primary control group for desktop */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelected([]);
                    setReport("");
                    setError("");
                  }}
                  className="hidden md:inline-flex"
                >
                  Clear
                </Button>

                <Button
                  onClick={analyze}
                  disabled={!selected.length || analyzing}
                  className="md:inline-flex"
                >
                  {analyzing ? "Analyzing..." : "Analyze with AI"}
                </Button>
              </div>
            </div>

            {/* Selected chips */}
            <div className="flex flex-wrap gap-2">
              {selected.length === 0 && (
                <div className="text-sm text-muted-foreground px-2 py-1">
                  No symbols added yet — add one from the search above.
                </div>
              )}

              {selected.map((s, idx) => (
                <div
                  key={s.symbol}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm",
                    idx === 0
                      ? "bg-gradient-to-r from-primary/20 to-[#0033FF]/10 border border-primary/30"
                      : "bg-gray-800/40 border border-gray-600/40"
                  )}
                  title={`${s.name} (${s.exchange})`}
                >
                  <div className="flex flex-col mr-1">
                    <span className="text-sm font-semibold">{s.symbol}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {s.exchange}
                    </span>
                  </div>

                  <button
                    onClick={() => removeSymbol(s.symbol)}
                    aria-label={`Remove ${s.symbol}`}
                    className="p-1 rounded-full hover:bg-gray-700/40 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="tv-card relative overflow-hidden p-5 md:p-8 border border-gray-700/40 bg-black/40 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-500">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(174, 175, 217, 0.08),transparent_50%)] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight bg-black bg-clip-text text-transparent">
                  AI Investment Report
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Generated insights and analysis powered by AI.
                </p>
              </div>

              {/* Copy & Download Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={copyReport}
                  variant="ghost"
                  disabled={!report}
                  className="flex items-center gap-1 border border-gray-700/40 bg-gray-800/40 hover:bg-gray-700/50"
                >
                  <ClipboardIcon className="h-4 w-4" />
                  Copy
                </Button>
                <Button
                  onClick={downloadReport}
                  variant="ghost"
                  disabled={!report}
                  className="flex items-center gap-1 border border-gray-700/40 bg-gray-800/40 hover:bg-gray-700/50"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            {/* AI Analyzing State */}
            {analyzing && (
              <div className="p-6 rounded-lg border border-indigo-500/20 bg-gray-800 text-sm text-indigo-300 animate-pulse">
                <div className="flex items-center gap-3 mb-2">
                  <svg
                    className="animate-spin h-4 w-4 text-violet-400"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeOpacity="0.2"
                    />
                    <path
                      d="M22 12A10 10 0 0012 2"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="font-medium">Generating AI insights...</span>
                </div>
                <p className="text-muted-foreground">
                  Our AI is comparing company fundamentals, market trends, and
                  technical indicators to prepare your investment summary.
                </p>
              </div>
            )}

            {/* AI Error Message */}
            {error && !analyzing && (
              <div className="p-4 rounded-lg border border-red-500/20 bg-red-950/20 text-red-400">
                {error}
              </div>
            )}

            {/* AI Report Display */}
            {!analyzing && !error && report && (
              <div className="mt-6 prose prose-invert max-w-none leading-relaxed text-black/80 prose-headings:text-indigo-400 prose-strong:text-teal-300 prose-ul:marker:text-indigo-500">
                <ReactMarkdown components={mdComponents}>
                  {report}
                </ReactMarkdown>
              </div>
            )}

            {/* Empty State */}
            {!analyzing && !report && !error && (
              <div className="flex flex-col items-center justify-center text-center p-10 text-muted-foreground border border-dashed border-gray-700/40 rounded-xl bg-gray-900/30">
                <SparklesIcon className="w-8 h-8 text-indigo-400 mb-2" />
                <p className="text-sm">
                  No report generated yet. Select stocks and click{" "}
                  <span className="text-indigo-400 font-semibold">
                    “Analyze with AI”
                  </span>{" "}
                  to view insights here.
                </p>
              </div>
            )}
          </div>
        </section>
        <section className="tv-card p-5 md:p-8 border border-gray-700/40 bg-black backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight bg-black bg-clip-text text-transparent">
                Stock Performance Chart
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Visual comparison powered by TradingView — view how selected
                stocks perform over time.
              </p>
            </div>

            {/* Refresh / Rebuild chart if needed */}
            <Button
              variant="ghost"
              onClick={() => {
                setReport("");
                setError("");
              }}
              className="flex items-center gap-1 border border-gray-700/40 bg-gray-800/40 hover:bg-gray-700/50 text-sm"
            >
              Refresh
            </Button>
          </div>

          {/* Chart container */}
          <div className="relative mt-4 rounded-xl overflow-hidden border border-gray-700/40 bg-gray-900/30 h-[500px]">
            {selected.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <LineChartIcon className="h-8 w-8 text-indigo-400 mb-2" />
                <p className="text-sm">
                  Add symbols to see their performance chart here.
                </p>
              </div>
            ) : (
              <TradingViewWidget
                scriptUrl={scriptUrl}
                config={chartConfig as Record<string, unknown>}
                height={500}
              />
            )}
          </div>
        </section>

        {/* Footer spacing */}
        <div className="h-10" />
      </div>
    </div>
  );
}
