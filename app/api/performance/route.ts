import { NextRequest } from 'next/server';
import { getPerformance, getQuotes } from '@/lib/actions/finnhub.actions';
import { auth } from '@/lib/better-auth/auth';
import { connectToDatabase } from '@/database/mongoose';
import { Holding } from '@/database/models/holding.model';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols') || '';
    const periodParam = (searchParams.get('period') || '1m').toLowerCase();
    const period = (['7d','1m','3m','ytd'] as const).includes(periodParam as any) ? (periodParam as any) : '1m';

    const symbols = symbolsParam
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (symbols.length === 0) {
      return new Response(JSON.stringify({ error: 'symbols is required' }), { status: 400 });
    }

    // Primary: candle-based performance
    let data = await getPerformance(symbols, period);

    // Fallback: for any 0% entries likely due to restricted candles, compute using user's buyPrice vs current quote
    try {
      const session = await auth.api.getSession({ headers: req.headers });
      const userId = session?.user?.id;
      if (userId) {
        await connectToDatabase();
        const userHoldings = await Holding.find({ userId, symbol: { $in: symbols } }).lean();
        if (userHoldings && userHoldings.length) {
          const quotes = await getQuotes(symbols);
          data = data.map((item) => {
            if (Math.abs(item.changePct) > 0.0001) return item; // keep candle value if present
            const h = userHoldings.find((uh: any) => (uh.symbol || '').toUpperCase() === item.symbol);
            const buy = Number(h?.buyPrice || 0);
            const cur = Number(quotes[item.symbol] || 0);
            if (buy > 0 && cur > 0) {
              const pct = ((cur - buy) / buy) * 100;
              return { symbol: item.symbol, changePct: pct };
            }
            return item;
          });
        }
      }
    } catch (e) {
      // ignore fallback errors; return best-effort
    }

    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Performance API error', e);
    return new Response(JSON.stringify({ error: 'Failed to fetch performance' }), { status: 500 });
  }
}
