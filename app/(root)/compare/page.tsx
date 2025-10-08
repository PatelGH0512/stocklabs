"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import { BASELINE_WIDGET_CONFIG } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Types aligned with lib/actions/finnhub.actions.ts mapping
type SearchItem = {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  tvSymbol?: string | undefined;
  isInWatchlist?: boolean;
};

export default function ComparePage() {
  const [query, setQuery] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selected, setSelected] = useState<SearchItem[]>([]);

  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const scriptUrl = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

  // Debounced search without external deps
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setLoadingSearch(true);
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data: SearchItem[] = await res.json();
        setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

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
      // Ensure comparison symbols are applied
      compareSymbols,
      // Keep controls visible
      hide_top_toolbar: false,
      hide_legend: false,
      details: false,
      allow_symbol_change: true,
    };
    return cfg;
  }, [primary, compareSymbols]);

  const addSymbol = (item: SearchItem) => {
    // Avoid dupes
    if (selected.find((s) => s.symbol === item.symbol)) return;
    setSelected((prev) => [...prev, item]);
    setQuery("");
    setResults([]);
  };

  const removeSymbol = (sym: string) => {
    setSelected((prev) => prev.filter((s) => s.symbol !== sym));
  };

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
        const text = await res.text();
        throw new Error(text || `Compare API failed: ${res.status}`);
      }
      const data = await res.json();
      setReport(data?.report || "");
    } catch (e: any) {
      setError(e?.message || "Failed to analyze");
    } finally {
      setAnalyzing(false);
    }
  };

  const copyReport = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadReport = () => {
    if (report) {
      const blob = new Blob([report], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `investment-report-${selected.map(s => s.symbol).join('-')}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Toast notification */}
      {copied && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-md border border-green-500/30 rounded-lg px-4 py-2 shadow-lg">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-green-200 font-medium">Report copied to clipboard!</span>
          </div>
        </div>
      )}
      
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Compare Stocks</h1>
            <p className="text-sm text-muted-foreground">Search and add multiple symbols to compare performance and get AI insights.</p>
          </div>
        </header>

        <section className="tv-card p-4">
          <div className="tv-card-header !p-0 !mb-3">
            <h3 className="tv-card-title">Add Symbols</h3>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative w-full md:max-w-xl">
                <Input
                  placeholder="Search stocks by symbol or name"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <div className={cn(
                    "absolute z-20 mt-1 w-full rounded-md border border-gray-800 bg-black/70 backdrop-blur p-1",
                    loadingSearch ? "opacity-60" : ""
                  )}>
                    {results.length === 0 && !loadingSearch && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
                    )}
                    {results.slice(0, 8).map((r) => (
                      <button
                        key={`${r.symbol}-${r.exchange}`}
                        className="w-full text-left px-3 py-2 hover:bg-white/5 rounded"
                        onClick={() => addSymbol(r)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">{r.symbol}</div>
                            <div className="text-xs text-muted-foreground">{r.name}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{r.exchange}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="secondary" onClick={() => setSelected([])}>Clear</Button>
              <Button onClick={analyze} disabled={!selected.length || analyzing}>
                {analyzing ? "Analyzing..." : "Analyze with AI"}
              </Button>
            </div>

            {/* Selected chips */}
            <div className="flex flex-wrap gap-2">
              {selected.map((s) => (
                <div key={s.symbol} className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-sm">
                  <span className="font-medium">{s.symbol}</span>
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => removeSymbol(s.symbol)}
                    aria-label={`Remove ${s.symbol}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* AI Report - Redesigned */}
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-gray-900/50 backdrop-blur-sm border border-gray-800/50 shadow-2xl">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-purple-500/5 to-blue-500/5 animate-pulse" />
          
          <div className="relative z-10">
            {/* Header with gradient and icon */}
            <div className="border-b border-gray-800/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500/20 blur-xl animate-pulse" />
                    <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-600 p-2 rounded-lg">
                      <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black dark:text-white">AI Investment Report</h3>
                    <p className="text-sm text-gray-400 mb-0.5">Powered by Gemini AI</p>
                  </div>
                </div>
                {analyzing && (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-500 border-t-transparent" />
                    <span className="text-sm text-yellow-400 animate-pulse">Analyzing...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content area */}
            <div className="p-6">
              {error && (
                <div className="relative overflow-hidden rounded-lg border border-red-500/30 bg-gradient-to-r from-red-950/40 to-red-900/30 p-4 shadow-lg">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-400 to-red-600" />
                  <div className="flex items-start gap-3 pl-3">
                    <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                </div>
              )}

              {!report && !analyzing && !error && (
                <div className="text-center py-12">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-purple-400/20 blur-2xl" />
                    <svg className="relative w-20 h-20 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-200 mb-2">Ready to Analyze</h4>
                  <p className="text-sm text-gray-400 max-w-md mx-auto">
                    Add stocks above and click "Analyze with AI" to generate comprehensive investment insights and recommendations.
                  </p>
                </div>
              )}

              {analyzing && !error && (
                <div className="space-y-4 py-8">
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-yellow-500/20 blur-xl animate-pulse" />
                      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-8">
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-500/30 border-t-yellow-500" />
                            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-2 border-yellow-500/50" />
                          </div>
                          <div className="text-center">
                            <p className="text-yellow-400 font-medium">Analyzing Market Data</p>
                            <p className="text-xs text-gray-500 mt-1">This may take a few moments...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Loading skeleton */}
                  <div className="space-y-3 mt-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-800/50 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-800/30 rounded w-full" />
                        <div className="h-3 bg-gray-800/30 rounded w-5/6 mt-1" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report && !analyzing && (
                <div className="relative">
                  {/* Report content with styled sections */}
                  <div className="space-y-6">
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="report-content">
                        {report.split('\n\n').map((section, idx) => {
                          // Check if this is a header section
                          const isHeader = section.includes('Market') || section.includes('Summary') || 
                                         section.includes('Recommendation') || section.includes('Analysis');
                          
                          if (isHeader) {
                            return (
                              <div key={idx} className="mb-6">
                                <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-3">
                                  {section}
                                </h4>
                              </div>
                            );
                          }
                          
                          // Check if this is a stock-specific section
                          const stockMatch = section.match(/^([A-Z]+):/);
                          if (stockMatch) {
                            return (
                              <div key={idx} className="group relative overflow-hidden rounded-lg border border-gray-800/50 bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-4 mb-4 transition-all duration-300 hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/10">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-yellow-400 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 p-2 rounded-lg">
                                    <span className="text-yellow-400 font-bold text-sm">{stockMatch[1]}</span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                      {section.replace(/^[A-Z]+:/, '').trim()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          
                          // Check for bullet points
                          if (section.includes('•') || section.includes('-')) {
                            return (
                              <div key={idx} className="space-y-2 mb-4">
                                {section.split('\n').map((line, lineIdx) => {
                                  if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                                    return (
                                      <div key={lineIdx} className="flex items-start gap-2 group">
                                        <span className="text-yellow-400 mt-1 group-hover:scale-110 transition-transform">•</span>
                                        <p className="text-gray-300 text-sm flex-1 hover:text-gray-100 transition-colors">
                                          {line.replace(/^[•-]/, '').trim()}
                                        </p>
                                      </div>
                                    );
                                  }
                                  return <p key={lineIdx} className="text-gray-300 text-sm">{line}</p>;
                                })}
                              </div>
                            );
                          }
                          
                          // Regular paragraph
                          return (
                            <p key={idx} className="text-gray-300 text-sm leading-relaxed mb-4 hover:text-gray-100 transition-colors">
                              {section}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-6 pt-6 border-t border-gray-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={copyReport}
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all"
                      >
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-400 group-hover:text-gray-200">Copy Report</span>
                      </button>
                      <button 
                        onClick={downloadReport}
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all"
                      >
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="text-xs text-gray-400 group-hover:text-gray-200">Download</span>
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Generated at {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        {/* TradingView compare chart */}
        <section className="tv-card">
          <div className="tv-card-header">
            <h3 className="tv-card-title">Performance Comparison</h3>
          </div>
          <div className="tv-card-body">
            {!primary ? (
              <div className="h-64 grid place-items-center text-sm text-muted-foreground">
                Add at least one symbol to view the comparison chart.
              </div>
            ) : (
              <TradingViewWidget
                scriptUrl={scriptUrl}
                config={chartConfig as any}
                height={600}
                className="custom-chart"
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
