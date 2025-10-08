"use client";

import { useState, useEffect } from "react";
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
  logo?: string;
  type: 'price' | 'change';
  condition: 'above' | 'below';
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

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'alerts'>('watchlist');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [selectedStock, setSelectedStock] = useState<any>(null);

  // Mock data for demonstration - replace with real API calls
  useEffect(() => {
    loadWatchlist();
    loadAlerts();
    loadNews();
  }, []);

  const loadWatchlist = async () => {
    // Mock data - replace with actual API call
    const mockData: WatchlistItem[] = [
      { id: '1', symbol: 'AAPL', company: 'Apple Inc', price: 233.19, change: 1.54, changePercent: 1.54, marketCap: '3.56T', peRatio: 35.5, addedAt: new Date() },
      { id: '2', symbol: 'MSFT', company: 'Microsoft Corp', price: 520.42, change: -0.24, changePercent: -0.24, marketCap: '3.76T', peRatio: 32.6, addedAt: new Date() },
      { id: '3', symbol: 'GOOGL', company: 'Alphabet Inc', price: 201.56, change: 2.65, changePercent: 2.65, marketCap: '2.52T', peRatio: 21.5, addedAt: new Date() },
      { id: '4', symbol: 'AMZN', company: 'Amazon.com Inc', price: 244.16, change: -1.53, changePercent: -1.53, marketCap: '1.48T', peRatio: 33.5, addedAt: new Date() },
      { id: '5', symbol: 'TSLA', company: 'Tesla Inc', price: 339.62, change: 1.72, changePercent: 1.72, marketCap: '1.56T', peRatio: 161.2, addedAt: new Date() },
      { id: '6', symbol: 'META', company: 'Meta Platforms Inc', price: 762.86, change: -2.54, changePercent: -2.54, marketCap: '2.63T', peRatio: 45.6, addedAt: new Date() },
      { id: '7', symbol: 'NVDA', company: 'NVIDIA Corp', price: 181.46, change: 2.21, changePercent: 2.21, marketCap: '1.36T', peRatio: 16.8, addedAt: new Date() },
      { id: '8', symbol: 'NFLX', company: 'Netflix Inc', price: 1214.45, change: -2.62, changePercent: -2.62, marketCap: '4.74T', peRatio: 45.9, addedAt: new Date() },
    ];
    setWatchlist(mockData);
    setLoading(false);
  };

  const loadAlerts = async () => {
    // Mock data - replace with actual API call
    const mockAlerts: Alert[] = [
      { id: '1', symbol: 'AAPL', company: 'Apple Inc.', type: 'price', condition: 'above', value: 240.60, currentPrice: 233.19, active: true },
      { id: '2', symbol: 'TSLA', company: 'Tesla, Inc.', type: 'price', condition: 'below', value: 300.80, currentPrice: 339.62, active: true },
      { id: '3', symbol: 'META', company: 'Meta Platforms Inc.', type: 'price', condition: 'above', value: 700.40, currentPrice: 762.86, active: true },
      { id: '4', symbol: 'MSFT', company: 'Microsoft Corporation', type: 'price', condition: 'above', value: 540.13, currentPrice: 520.42, active: true },
    ];
    setAlerts(mockAlerts);
  };

  const loadNews = async () => {
    // Mock data - replace with actual API call
    const mockNews: NewsItem[] = [
      {
        id: '1',
        category: 'GOOGL',
        headline: 'If Alphabet Missed The AI Boat, What Does That Mean For Microsoft?',
        summary: 'Nearly three years after the launch of ChatGPT, major investors like MSFT are still waiting for returns to GOOGL on their tens of billions of dollars in AI investments.',
        datetime: '24 minutes ago',
        source: 'The Wall Street Journal',
        url: '#'
      },
      {
        id: '2',
        category: 'AAPL',
        headline: 'Apple Prepares Major iPhone Redesign for 2025',
        summary: 'Analysts suggest Apple is betting on foldable displays, a move that could boost sales as smartphone sales iPhone market.',
        datetime: '24 minutes ago',
        source: 'Reuters',
        url: '#'
      },
      {
        id: '3',
        category: 'TSLA',
        headline: 'Tesla Announces Affordable EV Model for Global Markets',
        summary: 'Elon Musk confirms a sub-$25,000 electric vehicle aimed at emerging economies, with production expected to start in 2025.',
        datetime: '37 minutes ago',
        source: 'CNBC',
        url: '#'
      },
      {
        id: '4',
        category: 'NVDA',
        headline: 'Nvidia Faces Growing Competition In AI Chips',
        summary: 'While Nvidia dominates the GPU market, rivals are catching up with new architectures that could challenge its supremacy.',
        datetime: '37 minutes ago',
        source: 'The Wall Street Journal',
        url: '#'
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
      marketCap: '1.0T',
      peRatio: Math.random() * 50,
      addedAt: new Date()
    };
    setWatchlist([...watchlist, newItem]);
    setShowAddStock(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveStock = (id: string) => {
    setWatchlist(watchlist.filter(item => item.id !== id));
  };

  const handleCreateAlert = (alert: Partial<Alert>) => {
    const newAlert: Alert = {
      id: Date.now().toString(),
      symbol: alert.symbol || '',
      company: alert.company || '',
      type: alert.type || 'price',
      condition: alert.condition || 'above',
      value: alert.value || 0,
      active: true
    };
    setAlerts([...alerts, newAlert]);
    setShowCreateAlert(false);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
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

  useEffect(() => {
    const timer = setTimeout(() => {
      searchStocksDebounced(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Watchlist</h1>
          <div className="flex gap-4">
            <Button
              onClick={() => setShowAddStock(true)}
              className="bg-yellow-500 text-black hover:bg-yellow-600 px-6"
            >
              Add Stock
            </Button>
            <div className="flex bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('watchlist')}
                className={cn(
                  "px-4 py-2 rounded-md transition-all",
                  activeTab === 'watchlist' 
                    ? "bg-yellow-500 text-black" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                Watchlist
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={cn(
                  "px-4 py-2 rounded-md transition-all",
                  activeTab === 'alerts' 
                    ? "bg-yellow-500 text-black" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                Alerts
              </button>
            </div>
            <Button
              onClick={() => setShowCreateAlert(true)}
              className="bg-transparent border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black px-6"
            >
              Create Alert
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'watchlist' ? (
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-800 text-gray-400 text-sm">
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
                    {watchlist.map((item, index) => (
                      <tr key={item.id} className="border-t border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <td className="p-4 flex items-center gap-2">
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xs">
                            {item.symbol.charAt(0)}
                          </div>
                          <span className="text-white">{item.company}</span>
                        </td>
                        <td className="p-4 text-gray-300">{item.symbol}</td>
                        <td className="p-4 text-right text-white">${item.price.toFixed(2)}</td>
                        <td className={cn(
                          "p-4 text-right",
                          item.changePercent >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </td>
                        <td className="p-4 text-right text-gray-300">${item.marketCap}</td>
                        <td className="p-4 text-right text-gray-300">{item.peRatio.toFixed(1)}</td>
                        <td className="p-4 text-center">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedStock(item);
                              setShowCreateAlert(true);
                            }}
                            className="bg-gray-700 hover:bg-gray-600 text-yellow-500 text-xs px-3 py-1"
                          >
                            Add Alert
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="bg-gray-900 rounded-xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-yellow-500 font-bold">{alert.symbol.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{alert.company}</h3>
                        <p className="text-gray-400 text-sm">{alert.symbol}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400 text-sm">Alert:</p>
                      <p className="text-white">
                        Price {alert.condition} ${alert.value.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-sm">Once per day</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alerts Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Alerts</h2>
              <div className="space-y-4">
                {alerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-yellow-500 font-bold text-sm">{alert.symbol.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{alert.symbol}</p>
                          <p className="text-gray-400 text-xs">${alert.currentPrice?.toFixed(2)}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded",
                        alert.currentPrice && alert.currentPrice > 0 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                      )}>
                        {alert.currentPrice && alert.currentPrice > 0 ? '+1.4%' : '-2.53%'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-400 text-xs">Alert:</p>
                      <p className="text-white text-sm">Price = ${alert.value.toFixed(2)}</p>
                    </div>
                    <button className="text-yellow-500 text-xs mt-2 hover:underline">
                      Once per hour
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* News Section */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">News</h2>
              <div className="space-y-4">
                {news.map((item) => (
                  <div key={item.id} className="border-b border-gray-800 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded">
                        {item.category}
                      </span>
                      <span className="text-gray-500 text-xs">{item.datetime}</span>
                    </div>
                    <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">
                      {item.headline}
                    </h3>
                    <p className="text-gray-400 text-xs line-clamp-2 mb-2">
                      {item.summary}
                    </p>
                    <a href={item.url} className="text-yellow-500 text-xs hover:underline">
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
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Add Stock to Watchlist</h2>
              <Input
                placeholder="Search for stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4 bg-gray-800 border-gray-700"
              />
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleAddStock(stock)}
                    className="w-full text-left p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{stock.symbol}</p>
                        <p className="text-gray-400 text-sm">{stock.name}</p>
                      </div>
                      <span className="text-gray-500 text-sm">{stock.exchange}</span>
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
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create Price Alert</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Stock</label>
                  <Input
                    value={selectedStock?.symbol || ''}
                    disabled
                    className="mt-1 bg-gray-800 border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Alert Type</label>
                  <select className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-lg">
                    <option>Price Alert</option>
                    <option>Percentage Change</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Condition</label>
                  <div className="flex gap-2 mt-1">
                    <button className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-lg hover:border-yellow-500">
                      Above
                    </button>
                    <button className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-lg hover:border-yellow-500">
                      Below
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Price Target</label>
                  <Input
                    type="number"
                    placeholder="Enter price"
                    className="mt-1 bg-gray-800 border-gray-700"
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
