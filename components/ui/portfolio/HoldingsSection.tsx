"use client";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { useQuotesStream } from "@/hooks/useQuotesStream";

interface HoldingItem {
  id: string;
  symbol: string;
  company: string;
  shares: number;
  buyPrice: number;
  currentPrice: number;
}

export default function HoldingsSection({
  onHoldingsChange,
}: {
  onHoldingsChange?: (symbols: string[]) => void;
}) {
  const [holdings, setHoldings] = useState<HoldingItem[]>([]);
  const [showAddHolding, setShowAddHolding] = useState(false);
  const [holdingSearchQuery, setHoldingSearchQuery] = useState("");
  const [holdingSearchResults, setHoldingSearchResults] = useState<any[]>([]);
  const [holdingSelectedStock, setHoldingSelectedStock] = useState<any>(null);
  const [holdingShares, setHoldingShares] = useState<number>(1);
  const [holdingBuyPrice, setHoldingBuyPrice] = useState<number>(0);
  const [showEditHolding, setShowEditHolding] = useState(false);
  const [editingHolding, setEditingHolding] = useState<HoldingItem | null>(null);
  const [editShares, setEditShares] = useState<number>(0);
  const [editBuyPrice, setEditBuyPrice] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/holdings', { cache: 'no-store' });
        if (!res.ok) return;
        const data: any[] = await res.json();
        setHoldings(data.map((d) => ({
          id: d.id,
          symbol: d.symbol,
          company: d.company,
          shares: d.shares,
          buyPrice: d.buyPrice,
          currentPrice: Number(d.currentPrice || 0),
        })));
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    onHoldingsChange?.(holdings.map((h) => h.symbol));
  }, [holdings, onHoldingsChange]);

  const symbolsKey = useMemo(() => holdings.map((h) => h.symbol).sort().join(","), [holdings]);

  useEffect(() => {
    const fetchQuotes = async () => {
      const symbols = holdings.map((h) => h.symbol).filter(Boolean);
      if (symbols.length === 0) return;
      try {
        const url = `/api/quotes?symbols=${encodeURIComponent(symbols.join(","))}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const data: Record<string, number> = await res.json();
        setHoldings((prev) => prev.map((h) => ({ ...h, currentPrice: data[h.symbol] ?? h.currentPrice })));
      } catch {}
    };
    fetchQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  const handleOpenEdit = (h: HoldingItem) => {
    setEditingHolding(h);
    setEditShares(h.shares);
    setEditBuyPrice(h.buyPrice);
    setShowEditHolding(true);
  };

  const handleConfirmEditHolding = async () => {
    if (!editingHolding) return;
    try {
      const res = await fetch(`/api/holdings/${editingHolding.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shares: editShares, buyPrice: editBuyPrice }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setHoldings((prev) => prev.map((h) => (h.id === editingHolding.id ? { ...h, shares: updated.shares, buyPrice: updated.buyPrice } : h)));
      setShowEditHolding(false);
      setEditingHolding(null);
    } catch {}
  };

  // Realtime updates via shared Finnhub WebSocket
  useQuotesStream(
    holdings.map((h) => h.symbol),
    (symbol, price) => {
      setHoldings((prev) =>
        prev.map((h) => (h.symbol === symbol ? { ...h, currentPrice: price } : h))
      );
    }
  );

  const searchHoldingStocksDebounced = async (query: string) => {
    if (query.length < 2) {
      setHoldingSearchResults([]);
      return;
    }
    const results = await searchStocks(query);
    setHoldingSearchResults(results);
  };

  useEffect(() => {
    const t = setTimeout(
      () => searchHoldingStocksDebounced(holdingSearchQuery),
      300
    );
    return () => clearTimeout(t);
  }, [holdingSearchQuery]);

  const handleDeleteHolding = async (id: string) => {
    try {
      const res = await fetch(`/api/holdings/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) return;
      setHoldings((prev) => prev.filter((h) => h.id !== id));
    } catch {}
  };

  const handleConfirmAddHolding = async () => {
    if (!holdingSelectedStock || holdingShares <= 0) return;
    try {
      const res = await fetch('/api/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: holdingSelectedStock.symbol,
          company: holdingSelectedStock.name,
          shares: holdingShares,
          buyPrice: holdingBuyPrice || 0,
          currentPrice: 0,
        }),
      });
      if (!res.ok) return;
      const created = await res.json();
      const added: HoldingItem = {
        id: created.id,
        symbol: created.symbol,
        company: created.company,
        shares: created.shares,
        buyPrice: created.buyPrice,
        currentPrice: Number(created.currentPrice || 0),
      };
      setHoldings((prev) => [added, ...prev]);
      setShowAddHolding(false);
      setHoldingSearchQuery("");
      setHoldingSearchResults([]);
      setHoldingSelectedStock(null);
      setHoldingShares(1);
      setHoldingBuyPrice(0);
    } catch {}
  };

  return (
    <div className="rounded-xl overflow-hidden border bg-card text-card-foreground mb-6 h-[420px] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-xl font-semibold">My Holdings</h2>
        <Button
          onClick={() => setShowAddHolding(true)}
          className="bg-primary text-primary-foreground hover:brightness-110 px-6"
        >
          Add Stocks
        </Button>
      </div>
      <div className="w-full flex-1 overflow-y-auto scrollbar-hide-default">
        <table className="w-full">
          <thead className="bg-muted text-muted-foreground text-sm">
            <tr>
              <th className="text-left p-4">Stock</th>
              <th className="text-left p-4">Current Price</th>
              <th className="text-left p-4">Holdings</th>
              <th className="text-left p-4">Total Value</th>
              <th className="text-left p-4">Return</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const totalValue = h.currentPrice * h.shares;
              const costBasis = h.buyPrice * h.shares;
              const pnl = totalValue - costBasis;
              const pct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
              const positive = pct >= 0;
              return (
                <tr key={h.id} className="border-t border-border">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-foreground font-medium">
                        {h.company}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {h.symbol}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-foreground">
                    ${h.currentPrice.toFixed(2)}
                  </td>
                  <td className="p-4 text-foreground">
                    {h.shares} {h.shares === 1 ? "share" : "shares"}
                    <span className="text-xs text-muted-foreground ml-1">
                      @ ${h.buyPrice.toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4 text-foreground">
                    ${totalValue.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          positive ? "text-green-600" : "text-red-500"
                        )}
                      >
                        {positive ? "+" : ""}
                        {pct.toFixed(2)}%
                      </span>
                      <div className="h-2 w-28 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-2",
                            positive ? "bg-green-200" : "bg-red-200"
                          )}
                          style={{ width: `${Math.min(Math.abs(pct), 100)}%` }}
                        />
                      </div>
                    </div>
                    <div
                      className={cn(
                        "text-xs",
                        positive ? "text-green-600" : "text-red-500"
                      )}
                    >
                      {positive ? "+" : ""}${Math.abs(pnl).toFixed(2)}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(h)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Edit"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteHolding(h.id)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                        aria-label="Delete"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddHolding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-md border bg-card text-card-foreground">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-xl font-semibold">Add New Stock</h2>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setShowAddHolding(false);
                  setHoldingSearchQuery("");
                  setHoldingSearchResults([]);
                  setHoldingSelectedStock(null);
                  setHoldingShares(1);
                  setHoldingBuyPrice(0);
                }}
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mt-2">
              <div>
                <label className="text-muted-foreground text-sm">
                  Search Stock
                </label>
                <Input
                  placeholder="Search for a stock (e.g., AAPL, Apple)"
                  value={holdingSearchQuery}
                  onChange={(e) => {
                    setHoldingSearchQuery(e.target.value);
                    setHoldingSelectedStock(null);
                  }}
                  className="mt-1 bg-background border-border"
                />
                <div className="space-y-1 max-h-48 overflow-y-auto mt-2 scrollbar-hide-default">
                  {holdingSearchResults.map((s) => (
                    <button
                      key={s.symbol}
                      onClick={() => {
                        setHoldingSelectedStock(s);
                        setHoldingSearchQuery(`${s.symbol} — ${s.name}`);
                        setHoldingSearchResults([]);
                      }}
                      className="w-full text-left p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-foreground text-sm font-medium">
                            {s.symbol}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {s.name}
                          </p>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {s.exchange}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground text-sm">
                  Number of Shares
                </label>
                <Input
                  type="number"
                  min={0}
                  value={holdingShares}
                  onChange={(e) =>
                    setHoldingShares(parseFloat(e.target.value) || 0)
                  }
                  className="mt-1 bg-background border-border"
                />
              </div>

              <div>
                <label className="text-muted-foreground text-sm">
                  Buy Price
                </label>
                <Input
                  type="number"
                  min={0}
                  value={holdingBuyPrice}
                  onChange={(e) =>
                    setHoldingBuyPrice(parseFloat(e.target.value) || 0)
                  }
                  className="mt-1 bg-background border-border"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddHolding(false);
                  setHoldingSearchQuery("");
                  setHoldingSearchResults([]);
                  setHoldingSelectedStock(null);
                  setHoldingShares(1);
                  setHoldingBuyPrice(0);
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:brightness-110"
                onClick={handleConfirmAddHolding}
                disabled={!holdingSelectedStock || holdingShares <= 0}
              >
                Add Stock
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEditHolding && editingHolding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-full max-w-md border bg-card text-card-foreground">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-xl font-semibold">Edit Holding</h2>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setShowEditHolding(false);
                  setEditingHolding(null);
                }}
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="space-y-4 mt-2">
              <div>
                <label className="text-muted-foreground text-sm">Stock</label>
                <div className="mt-1 text-sm text-foreground">{editingHolding.company} <span className="text-xs text-muted-foreground">({editingHolding.symbol})</span></div>
              </div>

              <div>
                <label className="text-muted-foreground text-sm">Number of Shares</label>
                <Input type="number" min={0} value={editShares} onChange={(e) => setEditShares(parseFloat(e.target.value) || 0)} className="mt-1 bg-background border-border" />
              </div>

              <div>
                <label className="text-muted-foreground text-sm">Buy Price</label>
                <Input type="number" min={0} value={editBuyPrice} onChange={(e) => setEditBuyPrice(parseFloat(e.target.value) || 0)} className="mt-1 bg-background border-border" />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditHolding(false);
                  setEditingHolding(null);
                }}
              >
                Cancel
              </Button>
              <Button className="bg-primary text-primary-foreground hover:brightness-110" onClick={handleConfirmEditHolding}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
