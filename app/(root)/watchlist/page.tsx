"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { Newspaper } from "lucide-react";

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
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editPe, setEditPe] = useState<number>(0);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsVisibleCount, setNewsVisibleCount] = useState<number>(6);
  const [badImageIds, setBadImageIds] = useState<Set<number>>(new Set());

  interface NewsItem {
    category: string;
    datetime: number;
    headline: string;
    id: number;
    image: string;
    related: string;
    source: string;
    summary: string;
    url: string;
  }

  const isValidNewsImage = (url?: string, source?: string, id?: number) => {
    if (id && badImageIds.has(id)) return false;
    if (!url) return false;
    const u = url.toLowerCase();
    const s = (source || '').toLowerCase();
    // Common placeholders or logos that should not be shown as article thumbnails
    const badPatterns = [
      'marketwatch',
      'images.mktw.net',
      'mw3.wsj.net',
      'mktw',
      'placeholder',
      'default',
      'logo',
      'sprite',
      'icon',
      'favicon',
    ];
    if (badPatterns.some((p) => u.includes(p))) return false;
    // If the article source is MarketWatch, always hide the image (logos are often used)
    if (s.includes('marketwatch')) return false;
    return true;
  };

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

  const handleOpenEdit = (item: WatchlistItem) => {
    setEditingItem(item);
    setEditPrice(item.price);
    setEditPe(item.peRatio);
    setShowEditItem(true);
  };

  const handleConfirmEdit = () => {
    if (!editingItem) return;
    setWatchlist((prev) =>
      prev.map((w) =>
        w.id === editingItem.id ? { ...w, price: editPrice, peRatio: editPe } : w
      )
    );
    setShowEditItem(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    setWatchlist((prev) => prev.filter((w) => w.id !== id));
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

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setNewsLoading(true);
        setNewsError(null);
        const res = await fetch('/api/news?category=general');
        if (!res.ok) throw new Error('Failed to load news');
        const data: NewsItem[] = await res.json();
        setNews(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setNewsError(e?.message || 'Failed to load news');
        setNews([]);
      } finally {
        setNewsLoading(false);
      }
    };
    fetchNews();
  }, []);

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
                <th className="text-left p-4">Stock</th>
                <th className="text-left p-4">Symbol</th>
                <th className="text-left p-4">Added</th>
                <th className="text-left p-4">Market Cap</th>
                <th className="text-left p-4">P/E</th>
                <th className="text-left p-4">Price</th>
                <th className="text-left p-4">Change</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((item) => {
                const positive = item.changePercent >= 0;
                return (
                  <tr key={item.id} className="border-t border-border">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">{item.company}</span>
                        <span className="text-xs text-muted-foreground">{item.symbol}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{item.symbol}</td>
                    <td className="p-4 text-foreground text-sm">{item.addedAt.toLocaleDateString()}</td>
                    <td className="p-4 text-muted-foreground">${item.marketCap}</td>
                    <td className="p-4 text-muted-foreground">{item.peRatio.toFixed(1)}</td>
                    <td className="p-4 text-foreground">${item.price.toFixed(2)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-medium", positive ? "text-green-600" : "text-red-500")}>{positive ? "+" : ""}{item.changePercent.toFixed(2)}%</span>
                        <div className="h-2 w-28 rounded-full bg-muted overflow-hidden">
                          <div className={cn("h-2", positive ? "bg-green-200" : "bg-red-200")} style={{ width: `${Math.min(Math.abs(item.changePercent), 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                          aria-label="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <Button
                          size="sm"
                          onClick={() => { setSelectedStock(item); setShowCreateAlert(true); }}
                          className="bg-muted hover:bg-muted/80 text-primary text-xs px-3 py-1"
                        >
                          Add Alert
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Market News</h2>
            <div className="text-sm text-muted-foreground">Latest updates</div>
          </div>
          {newsLoading ? (
            <div className="border bg-card text-card-foreground rounded-xl p-6 text-sm text-muted-foreground">Loading news...</div>
          ) : newsError ? (
            <div className="border bg-card text-card-foreground rounded-xl p-6 text-sm text-red-500">{newsError}</div>
          ) : news.length === 0 ? (
            <div className="border bg-card text-card-foreground rounded-xl p-6 text-sm text-muted-foreground">No news available.</div>
          ) : (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.slice(0, newsVisibleCount).map((item) => (
                <div key={item.id} className="group rounded-xl overflow-hidden border bg-card text-card-foreground flex flex-col">
                  {isValidNewsImage(item.image, item.source, item.id) ? (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.headline}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        onError={() => setBadImageIds((prev) => {
                          const next = new Set(prev);
                          next.add(item.id);
                          return next;
                        })}
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-muted flex items-center justify-center">
                      <div className="flex flex-col items-center text-muted-foreground">
                        <Newspaper className="h-8 w-8" />
                      </div>
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="text-xs text-muted-foreground mb-2 flex items-center justify-between">
                      <span className="truncate">{item.source}</span>
                      <span>{new Date(item.datetime * 1000).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-base font-medium leading-snug line-clamp-3">{item.headline}</h3>
                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
                      >
                        Read More
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {newsVisibleCount < news.length && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => setNewsVisibleCount((c) => Math.min(c + 6, news.length))}
                  className="px-6"
                  variant="outline"
                >
                  More News
                </Button>
              </div>
            )}
            </>
          )}
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
                    <button className="flex-1 p-2 bg-background border border-border rounded-lg hover:border-primary">Above</button>
                    <button className="flex-1 p-2 bg-background border border-border rounded-lg hover:border-primary">Below</button>
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">Price Target</label>
                  <Input type="number" placeholder="Enter price" className="mt-1 bg-background border-border" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => { setShowCreateAlert(false); setSelectedStock(null); }}>Cancel</Button>
                <Button className="bg-primary text-primary-foreground hover:brightness-110" onClick={() => { setShowCreateAlert(false); setSelectedStock(null); }}>Create Alert</Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Watchlist Item Modal */}
        {showEditItem && editingItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="rounded-xl p-6 w-full max-w-md border bg-card text-card-foreground">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl font-semibold">Edit Watchlist Item</h2>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => { setShowEditItem(false); setEditingItem(null); }}
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-muted-foreground text-sm">Stock</label>
                  <div className="mt-1 text-sm text-foreground">{editingItem.company} <span className="text-xs text-muted-foreground">({editingItem.symbol})</span></div>
                </div>

                <div>
                  <label className="text-muted-foreground text-sm">Price</label>
                  <Input type="number" min={0} value={editPrice} onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)} className="mt-1 bg-background border-border" />
                </div>

                <div>
                  <label className="text-muted-foreground text-sm">P/E Ratio</label>
                  <Input type="number" min={0} value={editPe} onChange={(e) => setEditPe(parseFloat(e.target.value) || 0)} className="mt-1 bg-background border-border" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => { setShowEditItem(false); setEditingItem(null); }}>Cancel</Button>
                <Button className="bg-primary text-primary-foreground hover:brightness-110" onClick={handleConfirmEdit}>Save Changes</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
