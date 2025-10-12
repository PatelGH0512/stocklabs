'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp, Bell, Search, BarChart3, Zap, Shield } from "lucide-react";
import { useEffect, useState } from "react";

const Landing = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const features = [
        {
            icon: TrendingUp,
            title: "Real-Time Market Data",
            description: "Track live stock prices, charts, and market movements instantly"
        },
        {
            icon: Bell,
            title: "Smart Alerts",
            description: "Get notified when stocks hit your target prices automatically"
        },
        {
            icon: BarChart3,
            title: "Advanced Analytics",
            description: "Technical analysis, company profiles, and financial insights"
        },
        {
            icon: Search,
            title: "Powerful Search",
            description: "Find and analyze thousands of stocks in seconds"
        },
        {
            icon: Zap,
            title: "Lightning Fast",
            description: "Blazing fast performance for real-time trading decisions"
        },
        {
            icon: Shield,
            title: "Secure & Reliable",
            description: "Enterprise-grade security for your data and watchlists"
        }
    ];

    const stats = [
        { label: "Stocks Tracked", value: "50K+" },
        { label: "Market Updates", value: "Real-Time" },
        { label: "AI-Powered", value: "Research" },
        { label: "Uptime", value: "99.9%" }
    ];

    return (
        <div className="relative overflow-hidden">
            {/* Hero Section */}
            <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 py-12">
                {/* Background moved to page wrapper to cover entire landing page */}

                <div className={`space-y-6 max-w-4xl mx-auto transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-sm">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-foreground">Your AI-Powered Stock Market Agent</span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                        Trade Smarter with
                        <span className="block mt-2 bg-clip-text text-transparent [background-image:var(--gradient-primary)]">
                            Real-Time Insights
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Monitor stocks, set intelligent alerts, and make data-driven decisions with advanced analytics and real-time market data.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                        <Link href="/dashboard">
                            <Button className="yellow-btn px-8 py-6 text-lg font-semibold group">
                                Get Started
                                <TrendingUp className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="/search">
                            <Button variant="outline" className="px-8 py-6 text-lg border-border hover:bg-muted/50 group">
                                Explore Stocks
                                <Search className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className={`mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center">
                            <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                            <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section className={`py-16 px-4 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                            Everything You Need to Succeed
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Powerful features designed for serious traders and investors
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group p-6 rounded-xl border border-gray-600/50 bg-gray-800/30 backdrop-blur-sm hover:bg-gray-800/50 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10 hover:-translate-y-1"
                            >
                                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 group-hover:from-yellow-500/30 group-hover:to-yellow-500/10 transition-all">
                                    <feature.icon className="h-6 w-6 text-yellow-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="p-8 md:p-12 rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent backdrop-blur-sm">
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                            Ready to Start Trading Smarter?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            Join thousands of traders using StockLabs to make better investment decisions
                        </p>
                        <Link href="/dashboard">
                            <Button className="yellow-btn px-10 py-6 text-lg font-semibold">
                                Launch Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Landing;
