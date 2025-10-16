import { NextRequest } from 'next/server';
import { getQuoteDetails } from '@/lib/actions/finnhub.actions';

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

    const data = await getQuoteDetails(symbols);
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Quote details API error', e);
    return new Response(JSON.stringify({ error: 'Failed to fetch quote details' }), { status: 500 });
  }
}
