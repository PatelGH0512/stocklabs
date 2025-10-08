'use client';

import { useState, useEffect } from "react";
import { Search, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { useDebounce } from "@/hooks/useDebounce";

const SearchPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load initial popular stocks
        const loadInitialStocks = async () => {
            try {
                const results = await searchStocks();
                setStocks(results);
            } catch (error) {
                console.error('Failed to load initial stocks:', error);
            }
        };
        loadInitialStocks();
    }, []);

    const isSearchMode = !!searchTerm.trim();
    const displayStocks = isSearchMode ? stocks : stocks.slice(0, 12);

    const handleSearch = async () => {
        if (!isSearchMode) {
            // Reset to popular stocks
            try {
                const results = await searchStocks();
                setStocks(results);
            } catch {
                setStocks([]);
            }
            return;
        }

        setLoading(true);
        try {
            const results = await searchStocks(searchTerm.trim());
            setStocks(results);
        } catch {
            setStocks([]);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useDebounce(handleSearch, 300);

    useEffect(() => {
        if (mounted) {
            debouncedSearch();
        }
    }, [searchTerm, mounted]);

    return (
        <div className={`space-y-12 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            {/* Hero Search Section */}
            <section className="relative min-h-[40vh] flex flex-col items-center justify-center text-center px-4">
                {/* Background Elements */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-10 left-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-10 right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                </div>

                <div className="w-full max-w-3xl space-y-6">
                    {/* Header */}
                    <div className="space-y-3">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
                            Search Stocks
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground">
                            Find detailed insights on thousands of stocks worldwide
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                        <div className="relative flex items-center bg-gray-800/60 backdrop-blur-md border border-gray-600/50 rounded-2xl shadow-xl hover:border-gray-600/80 transition-all">
                            <Search className="absolute left-5 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by company name or ticker symbol..."
                                className="w-full py-5 md:py-6 pl-14 pr-12 bg-transparent text-foreground placeholder:text-gray-500 text-base md:text-lg focus:outline-none"
                            />
                            {loading && (
                                <Loader2 className="absolute right-5 h-5 w-5 text-yellow-500 animate-spin" />
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span>Live Data</span>
                        </div>
                        <div>50K+ Stocks</div>
                        <div>Real-Time Updates</div>
                    </div>
                </div>
            </section>

            {/* Results Section */}
            <section className="space-y-6">
                {/* Results Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-foreground">
                        {isSearchMode ? 'Search Results' : 'Popular Stocks'}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                        {displayStocks.length} {displayStocks.length === 1 ? 'stock' : 'stocks'}
                    </span>
                </div>

                {/* Results Grid */}
                {loading && !stocks.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-800/30 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : displayStocks.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50 mb-4">
                            <Search className="h-8 w-8 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            {isSearchMode ? 'No stocks found' : 'No stocks available'}
                        </h3>
                        <p className="text-muted-foreground">
                            {isSearchMode ? 'Try searching with a different term' : 'Check back later'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayStocks.map((stock) => (
                            <Link
                                key={stock.symbol}
                                href={`/stocks/${encodeURIComponent(stock.tvSymbol ?? stock.symbol)}`}
                                className="group p-5 rounded-xl border border-gray-600/50 bg-gray-800/30 backdrop-blur-sm hover:bg-gray-800/50 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10 hover:-translate-y-1"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 flex items-center justify-center group-hover:from-yellow-500/30 group-hover:to-yellow-500/10 transition-all">
                                        <TrendingUp className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-semibold text-foreground truncate mb-1">
                                            {stock.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="font-mono font-medium">{stock.symbol}</span>
                                            <span>•</span>
                                            <span className="truncate">{stock.exchange}</span>
                                        </div>
                                        <div className="mt-2">
                                            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-700/50 text-gray-400">
                                                {stock.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default SearchPage;
