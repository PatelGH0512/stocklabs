import { NextRequest } from 'next/server';
import { getInsiderSentiments } from '@/lib/actions/finnhub.actions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get('symbols') || '';
    const symbols = symbolsParam
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (symbols.length === 0) {
      return new Response(JSON.stringify({ error: 'symbols is required' }), { status: 400 });
    }

    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 12);
    const to = toDate.toISOString().split('T')[0];
    const from = fromDate.toISOString().split('T')[0];

    const data = await getInsiderSentiments(symbols, from, to);
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('Insider sentiment API error', e);
    return new Response(JSON.stringify({ error: 'Failed to fetch insider sentiment' }), { status: 500 });
  }
}
