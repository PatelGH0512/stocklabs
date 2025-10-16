'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { cache } from 'react';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

class FetchHTTPError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`Fetch failed ${status}: ${body}`);
    this.name = 'FetchHTTPError';
    this.status = status;
    this.body = body;
  }
}

export interface PerformanceItem { symbol: string; changePct: number }

function periodToUnixRange(period: '7d' | '1m' | '3m' | 'ytd') {
  const now = Math.floor(Date.now() / 1000);
  const d = new Date();
  let fromDate: Date;
  switch (period) {
    case '7d':
      fromDate = new Date(d.getTime() - 7 * 24 * 3600 * 1000);
      break;
    case '1m':
      fromDate = new Date(d);
      fromDate.setMonth(d.getMonth() - 1);
      break;
    case '3m':
      fromDate = new Date(d);
      fromDate.setMonth(d.getMonth() - 3);
      break;
    case 'ytd':
      fromDate = new Date(d.getFullYear(), 0, 1);
      break;
    default:
      fromDate = new Date(d.getTime() - 30 * 24 * 3600 * 1000);
  }
  const from = Math.floor(fromDate.getTime() / 1000);
  return { from, to: now };
}

export async function getPerformance(symbols: string[], period: '7d' | '1m' | '3m' | 'ytd' = '1m'): Promise<PerformanceItem[]> {
  const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!token) throw new Error('FINNHUB API key is not configured');
  const clean = (symbols || []).map((s) => s?.trim().toUpperCase()).filter(Boolean);
  if (clean.length === 0) return [];
  const { from, to } = periodToUnixRange(period);

  const out: PerformanceItem[] = [];
  await Promise.all(clean.map(async (sym) => {
    try {
      const url = `${FINNHUB_BASE_URL}/stock/candle?symbol=${encodeURIComponent(sym)}&resolution=D&from=${from}&to=${to}&token=${token}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        // Graceful fallback on 403/4xx/5xx
        console.warn('getPerformance non-ok response for', sym, res.status);
        out.push({ symbol: sym, changePct: 0 });
        return;
      }
      const data = await res.json() as { s?: string; o?: number[]; c?: number[] };
      if (data?.s !== 'ok' || !Array.isArray(data.o) || !Array.isArray(data.c) || data.o.length === 0 || data.c.length === 0) {
        out.push({ symbol: sym, changePct: 0 });
        return;
      }
      const firstOpen = Number(data.o[0]);
      const lastClose = Number(data.c[data.c.length - 1]);
      const changePct = firstOpen > 0 ? ((lastClose - firstOpen) / firstOpen) * 100 : 0;
      out.push({ symbol: sym, changePct });
    } catch (e) {
      console.error('getPerformance error for', sym, e);
      out.push({ symbol: sym, changePct: 0 });
    }
  }));
  return out;
}

export type RecommendationItem = {
  symbol: string;
  period: string; // e.g., 2024-09-01
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
};

export async function getRecommendationTrends(symbols: string[]): Promise<RecommendationItem[]> {
  const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!token) throw new Error('FINNHUB API key is not configured');

  const clean = (symbols || [])
    .map((s) => s?.trim().toUpperCase())
    .filter((s): s is string => Boolean(s));

  const results: RecommendationItem[] = [];
  await Promise.all(
    clean.map(async (sym) => {
      try {
        const url = `${FINNHUB_BASE_URL}/stock/recommendation?symbol=${encodeURIComponent(sym)}&token=${token}`;
        const arr = await fetchJSON<any[]>(url, 3600);
        // Finnhub returns an array sorted desc by period typically; take the first item as latest
        const latest = Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
        if (latest) {
          results.push({
            symbol: sym,
            period: String(latest.period || ''),
            strongBuy: Number(latest.strongBuy || latest.strong_buy || 0),
            buy: Number(latest.buy || 0),
            hold: Number(latest.hold || 0),
            sell: Number(latest.sell || 0),
            strongSell: Number(latest.strongSell || latest.strong_sell || 0),
          });
        } else {
          results.push({ symbol: sym, period: '', strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0 });
        }
      } catch (e) {
        console.error('getRecommendationTrends error for', sym, e);
        results.push({ symbol: sym, period: '', strongBuy: 0, buy: 0, hold: 0, sell: 0, strongSell: 0 });
      }
    })
  );
  return results;
}

export async function getQuotes(symbols: string[]): Promise<Record<string, number>> {
  const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!token) {
    throw new Error('FINNHUB API key is not configured');
  }
  const clean = (symbols || [])
    .map((s) => s?.trim().toUpperCase())
    .filter((s): s is string => Boolean(s));
  const out: Record<string, number> = {};
  await Promise.all(
    clean.map(async (sym) => {
      try {
        const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(sym)}&token=${token}`;
        const q = await fetchJSON<{ c?: number }>(url, 30);
        const c = Number(q?.c ?? 0);
        if (Number.isFinite(c) && c > 0) out[sym] = c;
      } catch (e) {
        console.error('getQuotes error for', sym, e);
      }
    })
  );
  return out;
}

// Internal helpers to construct TradingView-friendly symbols
function stripSuffixes(sym: string) {
  return sym.replace(/\.[A-Z]+$/, '');
}

function buildTradingViewSymbol(symbol: string, exchange?: string): string | undefined {
  const upper = (symbol || '').toUpperCase();
  if (!upper) return undefined;
  if (upper.includes(':')) return upper; // already prefixed

  // Common suffix patterns
  if (upper.endsWith('.NS')) return `NSE:${upper.replace('.NS', '')}`;
  if (upper.endsWith('.BO')) return `BSE:${upper.replace('.BO', '')}`;

  const ex = (exchange || '').toUpperCase();
  if (!ex) return undefined;
  // India
  if (ex.includes('NSE')) return `NSE:${stripSuffixes(upper)}`;
  if (ex.includes('BSE') || ex.includes('BOMBAY')) return `BSE:${stripSuffixes(upper)}`;
  // US & other major markets generally resolve without prefix
  if (ex.includes('NASDAQ') || ex.includes('NYSE') || ex.includes('AMEX') || ex.includes('CBOE')) return undefined;
  // Fallback: don't guess for other exchanges
  return undefined;
}

// Heuristic exchange guessing to avoid restricted profile2 calls
function guessExchangeFromSymbol(symbol: string): string | undefined {
  const upper = (symbol || '').toUpperCase();
  if (upper.endsWith('.NS')) return 'NSE'; // India
  if (upper.endsWith('.BO')) return 'BSE'; // India
  if (upper.endsWith('.TO')) return 'TSX'; // Canada
  if (upper.endsWith('.V')) return 'TSXV'; // Canada Venture
  if (upper.endsWith('.L')) return 'LSE'; // London
  if (upper.endsWith('.HK')) return 'HKEX'; // Hong Kong
  if (upper.endsWith('.AX')) return 'ASX'; // Australia
  if (upper.endsWith('.PA')) return 'EURONEXT PARIS'; // France
  if (upper.endsWith('.MC')) return 'BME'; // Spain
  if (upper.endsWith('.F')) return 'FWB'; // Frankfurt (heuristic)
  return undefined;
}

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
  const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
    ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
    : { cache: 'no-store' };

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new FetchHTTPError(res.status, text);
  }
  return (await res.json()) as T;
}

export { fetchJSON };

/**
 * Insider Sentiment (MSPR) helpers
 */
export type InsiderSentimentItem = {
  symbol: string;
  year: number;
  month: number;
  change: number;
  mspr: number;
};

export type InsiderSentimentSummary = {
  symbol: string;
  mspr: number; // latest MSPR
  signal: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
  trend: 'Increasing Insider Buys' | 'Slight Increase in Buys' | 'Balanced' | 'Slight Increase in Sells' | 'Heavy Insider Selling';
  latest: InsiderSentimentItem | null;
  previous: InsiderSentimentItem | null;
};

function msprToSignal(mspr: number): InsiderSentimentSummary['signal'] {
  if (mspr >= 60) return 'Strong Bullish';
  if (mspr >= 20) return 'Bullish';
  if (mspr > -20) return 'Neutral';
  if (mspr > -60) return 'Bearish';
  return 'Strong Bearish';
}

function trendFrom(last: InsiderSentimentItem | null, prev: InsiderSentimentItem | null): InsiderSentimentSummary['trend'] {
  if (!last || !prev) return 'Balanced';
  const delta = (last.mspr ?? 0) - (prev.mspr ?? 0);
  if (delta >= 20) return 'Increasing Insider Buys';
  if (delta > 5) return 'Slight Increase in Buys';
  if (delta > -5) return 'Balanced';
  if (delta > -20) return 'Slight Increase in Sells';
  return 'Heavy Insider Selling';
}

export async function getInsiderSentiments(symbols: string[], from: string, to: string): Promise<InsiderSentimentSummary[]> {
  const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!token) {
    throw new Error('FINNHUB API key is not configured');
  }

  const clean = (symbols || [])
    .map((s) => s?.trim().toUpperCase())
    .filter((s): s is string => Boolean(s));

  const results: InsiderSentimentSummary[] = [];

  await Promise.all(
    clean.map(async (sym) => {
      try {
        const url = `${FINNHUB_BASE_URL}/stock/insider-sentiment?symbol=${encodeURIComponent(sym)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&token=${token}`;
        const data = await fetchJSON<{ symbol?: string; data?: InsiderSentimentItem[] }>(url, 3600);
        const items = Array.isArray(data?.data) ? data!.data! : [];
        items.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
        const latest = items[items.length - 1] || null;
        const previous = items[items.length - 2] || null;
        const mspr = latest?.mspr ?? 0;
        results.push({
          symbol: sym,
          mspr,
          signal: msprToSignal(mspr),
          trend: trendFrom(latest, previous),
          latest,
          previous,
        });
      } catch (e) {
        console.error('getInsiderSentiments error for', sym, e);
        results.push({ symbol: sym, mspr: 0, signal: 'Neutral', trend: 'Balanced', latest: null, previous: null });
      }
    })
  );

  return results;
}

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    const range = getDateRange(5);
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      throw new Error('FINNHUB API key is not configured');
    }
    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    // If we have symbols, try to fetch company news per symbol and round-robin select
    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      await Promise.all(
        cleanSymbols.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
            const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
            perSymbolArticles[sym] = (articles || []).filter(validateArticle);
          } catch (e) {
            console.error('Error fetching company news for', sym, e);
            perSymbolArticles[sym] = [];
          }
        })
      );

      const collected: MarketNewsArticle[] = [];
      // Round-robin up to 6 picks
      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanSymbols.length; i++) {
          const sym = cleanSymbols[i];
          const list = perSymbolArticles[sym] || [];
          if (list.length === 0) continue;
          const article = list.shift();
          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, sym, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        // Sort by datetime desc
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
      // If none collected, fall through to general news
    }

    // General market news fallback or when no symbols provided
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= 20) break; // cap early before final slicing
    }

    const formatted = unique.slice(0, maxArticles).map((a, idx) => formatArticle(a, false, undefined, idx));
    return formatted;
  } catch (err) {
    console.error('getNews error:', err);
    throw new Error('Failed to fetch news');
  }
}

export async function getMarketStatus(exchange: string = 'US') {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      throw new Error('FINNHUB API key is not configured');
    }
    const url = `${FINNHUB_BASE_URL}/stock/market-status?exchange=${encodeURIComponent(exchange)}&token=${token}`;
    const data = await fetchJSON<any>(url, 60);
    return data;
  } catch (err) {
    console.error('getMarketStatus error:', err);
    throw new Error('Failed to fetch market status');
  }
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      // If no token, log and return empty to avoid throwing per requirements
      console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
      return [];
    }

    const trimmed = typeof query === 'string' ? query.trim() : '';

    let results: FinnhubSearchResult[] = [];
    // Map of symbol -> exchange (from profile2 enrichment)
    const exchangeMap = new Map<string, string | undefined>();

    if (!trimmed) {
      // Fetch top 10 popular symbols' profiles
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
      const profiles = await Promise.all(
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
            // Revalidate every hour
            const profile = await fetchJSON<any>(url, 3600);
            exchangeMap.set(sym.toUpperCase(), profile?.exchange);
            return { sym, profile } as { sym: string; profile: any };
          } catch (e) {
            const is403 = (e as any)?.status === 403 || /Fetch failed 403/.test(String((e as any)?.message || ''));
            const msg = is403 ? 'Access denied (403) fetching profile2 for' : 'Error fetching profile2 for';
            // Downgrade 403 to warn to reduce noise
            (is403 ? console.warn : console.error)(msg, sym, e);
            exchangeMap.set(sym.toUpperCase(), undefined);
            return { sym, profile: null } as { sym: string; profile: any };
          }
        })
      );

      results = profiles
        .map(({ sym, profile }) => {
          const symbol = sym.toUpperCase();
          const name: string | undefined = profile?.name || profile?.ticker || undefined;
          const exchange: string | undefined = profile?.exchange || undefined;
          if (!name) return undefined;
          const r: FinnhubSearchResult = {
            symbol,
            description: name,
            displaySymbol: symbol,
            type: 'Common Stock',
          };
          // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
          // To keep pipeline simple, attach exchange via closure map stage
          // We'll reconstruct exchange when mapping to final type
          (r as any).__exchange = exchange; // internal only
          return r;
        })
        .filter((x): x is FinnhubSearchResult => Boolean(x));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
      const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
      results = Array.isArray(data?.result) ? data.result : [];
      // Enrich top 10 with profile2 to obtain exchange information
      const topResults = results.slice(0, 10);
      await Promise.all(topResults.map(async (r) => {
        const sym = (r.symbol || '').toUpperCase();
        // First try to infer exchange from symbol suffix to avoid restricted calls
        const guessed = guessExchangeFromSymbol(sym);
        if (guessed) {
          exchangeMap.set(sym, guessed);
          return;
        }
        try {
          const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
          const profile = await fetchJSON<any>(url, 3600);
          exchangeMap.set(sym, profile?.exchange);
        } catch (e) {
          const is403 = (e as any)?.status === 403 || /Fetch failed 403/.test(String((e as any)?.message || ''));
          const msg = is403 ? 'Access denied (403) fetching profile2 for' : 'Error fetching profile2 for';
          (is403 ? console.warn : console.error)(msg, sym, e);
          exchangeMap.set(sym, undefined);
        }
      }));
    }

    const mapped: StockWithWatchlistStatus[] = results
      .map((r) => {
        const upper = (r.symbol || '').toUpperCase();
        const name = r.description || upper;
        // Prefer enriched profile2 exchange info
        const exchangeFromProfile = exchangeMap.get(upper) || (r as any).__exchange as string | undefined;
        const exchange = exchangeFromProfile || 'US';
        const type = r.type || 'Stock';
        const tvSymbol = buildTradingViewSymbol(upper, exchange);
        const item: StockWithWatchlistStatus = {
          symbol: upper,
          name,
          exchange,
          type,
          tvSymbol,
          isInWatchlist: false,
        };
        return item;
      })
      .slice(0, 15);

    return mapped;
  } catch (err) {
    console.error('Error in stock search:', err);
    return [];
  }
});

