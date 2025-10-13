"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchStocks } from "@/lib/actions/finnhub.actions";

interface WatchlistItem {
  id: string;
  symbol: string;
  company: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  peRatio: number;
  addedAt: Date;
}

interface Alert {
  id: string;
  symbol: string;
  company: string;
  type: "price" | "change";
  condition: "above" | "below";
  value: number;
  currentPrice?: number;
  active: boolean;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);

  useEffect(() => {
    loadWatchlist();
    loadAlerts();
  }, []);

  const loadWatchlist = async () => {
    const mockData: WatchlistItem[] = [
      { id: "1", symbol: "AAPL", company: "Apple Inc", price: 233.19, change: 1.54, changePercent: 1.54, marketCap: "3.56T", peRatio: 35.5, addedAt: new Date() },
      { id: "2", symbol: "MSFT", company: "Microsoft Corp", price: 520.42, change: -0.24, changePercent: -0.24, marketCap: "3.76T", peRatio: 32.6, addedAt: new Date() },
      { id: "3", symbol: "GOOGL", company: "Alphabet Inc", price: 201.56, change: 2.65, changePercent: 2.65, marketCap: "2.52T", peRatio: 21.5, addedAt: new Date() },
    ];
    setWatchlist(mockData);
    setLoading(false);
  };

  const loadAlerts = async () => {
    const mockAlerts: Alert[] = [
      { id: "1", symbol: "AAPL", company: "Apple Inc.", type: "price", condition: "above", value: 240.6, currentPrice: 233.19, active: true },
    ];
    setAlerts(mockAlerts);
  };

  const searchStocksDebounced = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const results = await searchStocks(query);
    setSearchResults(results);
  };

  useEffect(() => {
    const timer = setTimeout(() => searchStocksDebounced(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddStock = async (stock: any) => {
    const newItem: WatchlistItem = {
      id: Date.now().toString(),
      symbol: stock.symbol,
      company: stock.name,
      price: Math.random() * 1000,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      marketCap: "1.0T",
      peRatio: Math.random() * 50,
      addedAt: new Date(),
    };
    setWatchlist((w) => [newItem, ...w]);
    setShowAddStock(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleCreateAlert = (alert: Partial<Alert>) => {
    const newAlert: Alert = {
      id: Date.now().toString(),
      symbol: alert.symbol || "",
      company: alert.company || "",
      type: alert.type || "price",
      condition: alert.condition || "above",
      value: alert.value || 0,
      active: true,
    };
    setAlerts((a) => [newAlert, ...a]);
    setShowCreateAlert(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="w-full">
        <div className="mb-6 rounded-xl border border-border bg-card text-card-foreground p-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My Watchlist</h1>
            <p className="text-sm text-muted-foreground mt-1">Track the stocks you care about</p>
          </div>
          <Button onClick={() => setShowAddStock(true)} className="bg-primary text-primary-foreground hover:brightness-110 px-6">Add Stock</Button>
        </div>

        <div className="rounded-xl overflow-hidden border bg-card text-card-foreground">
          <table className="w-full">
            <thead className="bg-muted text-muted-foreground text-sm">
              <tr>
                <th className="text-left p-4">Company</th>
                <th className="text-left p-4">Symbol</th>
                <th className="text-right p-4">Price</th>
                <th className="text-right p-4">Change</th>
                <th className="text-right p-4">Market Cap</th>
                <th className="text-right p-4">P/E Ratio</th>
                <th className="text-center p-4">Alert</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((item) => (
                <tr key={item.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                  <td className="p-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xs">
                      {item.symbol.charAt(0)}
                    </div>
                    <span className="text-foreground">{item.company}</span>
                  </td>
                  <td className="p-4 text-muted-foreground">{item.symbol}</td>
                  <td className="p-4 text-right text-foreground">${item.price.toFixed(2)}</td>
                  <td className={cn("p-4 text-right", item.changePercent >= 0 ? "text-green-500" : "text-red-500")}>
                    {item.changePercent >= 0 ? "+" : ""}
                    {item.changePercent.toFixed(2)}%
                  </td>
                  <td className="p-4 text-right text-muted-foreground">${item.marketCap}</td>
                  <td className="p-4 text-right text-muted-foreground">{item.peRatio.toFixed(1)}</td>
                  <td className="p-4 text-center">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedStock(item);
                        setShowCreateAlert(true);
                      }}
                      className="bg-muted hover:bg-muted/80 text-primary text-xs px-3 py-1"
                    >
                      Add Alert
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Stock Modal */}
        {showAddStock && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="rounded-xl p-6 w-full max-w-md border bg-card text-card-foreground">
              <h2 className="text-xl font-semibold mb-4">Add Stock to Watchlist</h2>
              <Input
                placeholder="Search for stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4 bg-background border-border"
              />
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleAddStock(stock)}
                    className="w-full text-left p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-foreground font-medium">{stock.symbol}</p>
                        <p className="text-muted-foreground text-sm">{stock.name}</p>
                      </div>
                      <span className="text-muted-foreground text-sm">{stock.exchange}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => { setShowAddStock(false); setSearchQuery(""); setSearchResults([]); }}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Alert Modal */}
        {showCreateAlert && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="rounded-xl p-6 w-full max-w-md border bg-card text-card-foreground">
              <h2 className="text-xl font-semibold mb-4">Create Price Alert</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-muted-foreground text-sm">Stock</label>
                  <Input value={selectedStock?.symbol || ""} disabled className="mt-1 bg-background border-border" />
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">Alert Type</label>
                  <select className="w-full mt-1 p-2 bg-background border border-border rounded-lg">
                    <option>Price Alert</option>
                    <option>Percentage Change</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">Condition</label>
                  <div className="flex gap-2 mt-1">
                    <button className="flex-1 p-2 bg-background border border-border rounded-lg hover:border-yellow-500">Above</button>
                    <button className="flex-1 p-2 bg-background border border-border rounded-lg hover:border-yellow-500">Below</button>
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">Price Target</label>
                  <Input type="number" placeholder="Enter price" className="mt-1 bg-background border-border" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => { setShowCreateAlert(false); setSelectedStock(null); }}>Cancel</Button>
                <Button className="bg-yellow-500 text-black hover:bg-yellow-600" onClick={() => { setShowCreateAlert(false); setSelectedStock(null); }}>Create Alert</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
