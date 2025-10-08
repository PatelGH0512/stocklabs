import TradingViewWidget from "@/components/TradingViewWidget";
import {
    HEATMAP_WIDGET_CONFIG,
    MARKET_DATA_WIDGET_CONFIG,
    MARKET_OVERVIEW_WIDGET_CONFIG,
    TOP_STORIES_WIDGET_CONFIG
} from "@/lib/constants";

const Dashboard = () => {
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">Market Dashboard</h1>
                <p className="text-muted-foreground">Real-time insights and analytics for informed trading decisions</p>
            </div>

            {/* Top Section - Market Overview & Heatmap */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                <div className="xl:col-span-1">
                    <TradingViewWidget
                        title="Market Overview"
                        scriptUrl={`${scriptUrl}market-overview.js`}
                        config={MARKET_OVERVIEW_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
                <div className="xl:col-span-2">
                    <TradingViewWidget
                        title="Stock Heatmap"
                        scriptUrl={`${scriptUrl}stock-heatmap.js`}
                        config={HEATMAP_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
            </section>

            {/* Bottom Section - News & Market Data */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                <div className="xl:col-span-1">
                    <TradingViewWidget
                        title="Market News"
                        scriptUrl={`${scriptUrl}timeline.js`}
                        config={TOP_STORIES_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
                <div className="xl:col-span-2">
                    <TradingViewWidget
                        title="Live Market Data"
                        scriptUrl={`${scriptUrl}market-quotes.js`}
                        config={MARKET_DATA_WIDGET_CONFIG}
                        height={600}
                    />
                </div>
            </section>
        </div>
    )
}

export default Dashboard;
