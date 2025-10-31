import { NextRequest, NextResponse } from 'next/server';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'general';
    const minId = searchParams.get('minId');

    const token = process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      return NextResponse.json({ error: 'FINNHUB API key is not configured' }, { status: 500 });
    }

    const url = new URL(`${FINNHUB_BASE_URL}/news`);
    url.searchParams.set('category', category);
    if (minId) url.searchParams.set('minId', String(minId));
    url.searchParams.set('token', token);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json({ error: `Upstream error ${res.status}: ${text}` }, { status: res.status });
    }
    const data = await res.json();

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
