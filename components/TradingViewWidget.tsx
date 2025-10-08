'use client';

import React, { memo, useEffect, useState } from 'react';
import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import {cn} from "@/lib/utils";

interface TradingViewWidgetProps {
    title?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    className?: string;
}

const TradingViewWidget = ({ title, scriptUrl, config, height = 600, className }: TradingViewWidgetProps) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const isDark = document.documentElement.classList.contains('dark');
        setTheme(isDark ? 'dark' : 'light');

        const observer = new MutationObserver(() => {
            const isDark = document.documentElement.classList.contains('dark');
            setTheme(isDark ? 'dark' : 'light');
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    // Update config with current theme
    const themedConfig = {
        ...config,
        colorTheme: theme,
        backgroundColor: theme === 'dark' ? '#141414' : '#FFFFFF',
    };

    const containerRef = useTradingViewWidget(scriptUrl, themedConfig, height);

    if (!mounted) {
        return (
            <div className={cn("w-full tv-card animate-pulse", className)}>
                <div className="tv-card-body">
                    <div className="w-full bg-gray-700/20 rounded" style={{ height }} />
                </div>
            </div>
        );
    }

    return (
        <div className={cn("w-full tv-card group hover:shadow-xl hover:shadow-yellow-500/5 transition-all duration-300", className)}>
            {title && (
              <div className="tv-card-header">
                <h3 className="tv-card-title">{title}</h3>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Live Data" />
                </div>
              </div>
            )}
            <div className="tv-card-body">
              <div className={cn('tradingview-widget-container overflow-hidden')} ref={containerRef}>
                  <div className="tradingview-widget-container__widget" style={{ height, width: "100%" }} />
              </div>
            </div>
        </div>
    );
}

export default memo(TradingViewWidget);
