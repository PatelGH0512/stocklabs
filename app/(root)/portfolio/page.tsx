"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import PortfolioHeader from "@/components/ui/portfolio/PortfolioHeader";
import PortfolioCards from "@/components/ui/portfolio/PortfolioCards";
import HoldingsSection from "@/components/ui/portfolio/HoldingsSection";
import InsiderSentiment from "@/components/ui/portfolio/InsiderSentiment";

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
  logo?: string;
  type: "price" | "change";
  condition: "above" | "below";
  value: number;
  currentPrice?: number;
  active: boolean;
}

interface NewsItem {
  id: string;
  category: string;
  headline: string;
  summary: string;
  datetime: string;
  source: string;
  url: string;
}

// Holdings handled by components/ui/portfolio/HoldingsSection

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<"watchlist" | "alerts">(
    "watchlist"
  );
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [marketStatus, setMarketStatus] = useState<any>(null);
  const [marketLoading, setMarketLoading] = useState<boolean>(true);
  const [holdingSymbols, setHoldingSymbols] = useState<string[]>([]);

  // Mock data for demonstration - replace with real API calls
  useEffect(() => {
    loadWatchlist();
    loadAlerts();
    loadNews();
    fetchMarketStatus();
  }, []);

  const loadWatchlist = async () => {
    // Mock data - replace with actual API call
    const mockData: WatchlistItem[] = [
      {
        id: "1",
        symbol: "AAPL",
        company: "Apple Inc",
        price: 233.19,
        change: 1.54,
        changePercent: 1.54,
        marketCap: "3.56T",
        peRatio: 35.5,
        addedAt: new Date(),
      },
      {
        id: "2",
        symbol: "MSFT",
        company: "Microsoft Corp",
        price: 520.42,
        change: -0.24,
        changePercent: -0.24,
        marketCap: "3.76T",
        peRatio: 32.6,
        addedAt: new Date(),
      },
      {
        id: "3",
        symbol: "GOOGL",
        company: "Alphabet Inc",
        price: 201.56,
        change: 2.65,
        changePercent: 2.65,
        marketCap: "2.52T",
        peRatio: 21.5,
        addedAt: new Date(),
      },
      {
        id: "4",
        symbol: "AMZN",
        company: "Amazon.com Inc",
        price: 244.16,
        change: -1.53,
        changePercent: -1.53,
        marketCap: "1.48T",
        peRatio: 33.5,
        addedAt: new Date(),
      },
      {
        id: "5",
        symbol: "TSLA",
        company: "Tesla Inc",
        price: 339.62,
        change: 1.72,
        changePercent: 1.72,
        marketCap: "1.56T",
        peRatio: 161.2,
        addedAt: new Date(),
      },
      {
        id: "6",
        symbol: "META",
        company: "Meta Platforms Inc",
        price: 762.86,
        change: -2.54,
        changePercent: -2.54,
        marketCap: "2.63T",
        peRatio: 45.6,
        addedAt: new Date(),
      },
      {
        id: "7",
        symbol: "NVDA",
        company: "NVIDIA Corp",
        price: 181.46,
        change: 2.21,
        changePercent: 2.21,
        marketCap: "1.36T",
        peRatio: 16.8,
        addedAt: new Date(),
      },
      {
        id: "8",
        symbol: "NFLX",
        company: "Netflix Inc",
        price: 1214.45,
        change: -2.62,
        changePercent: -2.62,
        marketCap: "4.74T",
        peRatio: 45.9,
        addedAt: new Date(),
      },
    ];
    setWatchlist(mockData);
    setLoading(false);
  };

  const loadAlerts = async () => {
    // Mock data - replace with actual API call
    const mockAlerts: Alert[] = [
      {
        id: "1",
        symbol: "AAPL",
        company: "Apple Inc.",
        type: "price",
        condition: "above",
        value: 240.6,
        currentPrice: 233.19,
        active: true,
      },
      {
        id: "2",
        symbol: "TSLA",
        company: "Tesla, Inc.",
        type: "price",
        condition: "below",
        value: 300.8,
        currentPrice: 339.62,
        active: true,
      },
      {
        id: "3",
        symbol: "META",
        company: "Meta Platforms Inc.",
        type: "price",
        condition: "above",
        value: 700.4,
        currentPrice: 762.86,
        active: true,
      },
      {
        id: "4",
        symbol: "MSFT",
        company: "Microsoft Corporation",
        type: "price",
        condition: "above",
        value: 540.13,
        currentPrice: 520.42,
        active: true,
      },
    ];
    setAlerts(mockAlerts);
  };

  const loadNews = async () => {
    // Mock data - replace with actual API call
    const mockNews: NewsItem[] = [
      {
        id: "1",
        category: "GOOGL",
        headline:
          "If Alphabet Missed The AI Boat, What Does That Mean For Microsoft?",
        summary:
          "Nearly three years after the launch of ChatGPT, major investors like MSFT are still waiting for returns to GOOGL on their tens of billions of dollars in AI investments.",
        datetime: "24 minutes ago",
        source: "The Wall Street Journal",
        url: "#",
      },
      {
        id: "2",
        category: "AAPL",
        headline: "Apple Prepares Major iPhone Redesign for 2025",
        summary:
          "Analysts suggest Apple is betting on foldable displays, a move that could boost sales as smartphone sales iPhone market.",
        datetime: "24 minutes ago",
        source: "Reuters",
        url: "#",
      },
      {
        id: "3",
        category: "TSLA",
        headline: "Tesla Announces Affordable EV Model for Global Markets",
        summary:
          "Elon Musk confirms a sub-$25,000 electric vehicle aimed at emerging economies, with production expected to start in 2025.",
        datetime: "37 minutes ago",
        source: "CNBC",
        url: "#",
      },
      {
        id: "4",
        category: "NVDA",
        headline: "Nvidia Faces Growing Competition In AI Chips",
        summary:
          "While Nvidia dominates the GPU market, rivals are catching up with new architectures that could challenge its supremacy.",
        datetime: "37 minutes ago",
        source: "The Wall Street Journal",
        url: "#",
      },
    ];
    setNews(mockNews);
  };

  const handleAddStock = async (stock: any) => {
    // Add stock to watchlist
    const newItem: WatchlistItem = {
      id: Date.now().toString(),
      symbol: stock.symbol,
      company: stock.name,
      price: Math.random() * 1000, // Mock price
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      marketCap: "1.0T",
      peRatio: Math.random() * 50,
      addedAt: new Date(),
    };
    setWatchlist([...watchlist, newItem]);
    setShowAddStock(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveStock = (id: string) => {
    setWatchlist(watchlist.filter((item) => item.id !== id));
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
    setAlerts([...alerts, newAlert]);
    setShowCreateAlert(false);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== id));
  };

  const searchStocksDebounced = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    // Mock search - replace with actual API call
    const results = await searchStocks(query);
    setSearchResults(results);
  };

  const fetchMarketStatus = async () => {
    try {
      setMarketLoading(true);
      const res = await fetch(`/api/market-status?exchange=US`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load market status");
      const data = await res.json();
      setMarketStatus(data);
    } catch (e) {
      console.error("Market status fetch error", e);
      setMarketStatus(null);
    } finally {
      setMarketLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchStocksDebounced(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // holdings logic moved into HoldingsSection component

  return (
    <div className="min-h-screen bg-background dark:bg-background text-foreground p-6">
      <div className="w-full">
        <PortfolioHeader
          marketStatus={marketStatus}
          marketLoading={marketLoading}
        />
        <PortfolioCards watchlist={watchlist} alerts={alerts} />
        <HoldingsSection onHoldingsChange={setHoldingSymbols} />
        <InsiderSentiment symbols={holdingSymbols} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}

          <div className="space-y-6">
            {/* News Section */}
            <div className="rounded-xl p-6 border bg-card text-card-foreground">
              <h2 className="text-xl font-semibold mb-4">News</h2>
              <div className="space-y-4">
                {news.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-border pb-4 last:border-0"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded">
                        {item.category}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {item.datetime}
                      </span>
                    </div>
                    <h3 className="text-foreground font-medium text-sm mb-1 line-clamp-2">
                      {item.headline}
                    </h3>
                    <p className="text-muted-foreground text-xs line-clamp-2 mb-2">
                      {item.summary}
                    </p>
                    <a
                      href={item.url}
                      className="text-yellow-500 text-xs hover:underline"
                    >
                      Read More →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Add Stock Modal */}
        {showAddStock && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="rounded-xl p-6 w-full max-w-md border bg-card text-card-foreground">
              <h2 className="text-xl font-semibold mb-4">
                Add Stock to Watchlist
              </h2>
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
                        <p className="text-foreground font-medium">
                          {stock.symbol}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {stock.name}
                        </p>
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {stock.exchange}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddStock(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  Cancel
                </Button>
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
                  <Input
                    value={selectedStock?.symbol || ""}
                    disabled
                    className="mt-1 bg-background border-border"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">
                    Alert Type
                  </label>
                  <select className="w-full mt-1 p-2 bg-background border border-border rounded-lg">
                    <option>Price Alert</option>
                    <option>Percentage Change</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">
                    Condition
                  </label>
                  <div className="flex gap-2 mt-1">
                    <button className="flex-1 p-2 bg-background border border-border rounded-lg hover:border-yellow-500">
                      Above
                    </button>
                    <button className="flex-1 p-2 bg-background border border-border rounded-lg hover:border-yellow-500">
                      Below
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">
                    Price Target
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter price"
                    className="mt-1 bg-background border-border"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateAlert(false);
                    setSelectedStock(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-yellow-500 text-black hover:bg-yellow-600"
                  onClick={() => {
                    // Handle alert creation
                    setShowCreateAlert(false);
                    setSelectedStock(null);
                  }}
                >
                  Create Alert
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
