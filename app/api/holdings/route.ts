import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/database/mongoose';
import { Holding } from '@/database/models/holding.model';
import { auth } from '@/lib/better-auth/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const docs = await Holding.find({ userId }).sort({ updatedAt: -1 }).lean();
    const data = docs.map((d: any) => ({
      id: d._id.toString(),
      symbol: d.symbol,
      company: d.company,
      shares: d.shares,
      buyPrice: d.buyPrice,
      currentPrice: d.currentPrice ?? 0,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('GET /api/holdings error', e);
    return new Response(JSON.stringify({ error: 'Failed to fetch holdings' }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const body = await req.json();
    const { symbol, company, shares, buyPrice, currentPrice } = body || {};
    if (!symbol || !company) return new Response(JSON.stringify({ error: 'symbol and company required' }), { status: 400 });

    const doc = await Holding.create({ userId, symbol, company, shares: Math.max(0, Number(shares || 0)), buyPrice: Math.max(0, Number(buyPrice || 0)), currentPrice: Number(currentPrice || 0) });
    const res = {
      id: doc._id.toString(),
      symbol: doc.symbol,
      company: doc.company,
      shares: doc.shares,
      buyPrice: doc.buyPrice,
      currentPrice: doc.currentPrice ?? 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
    return new Response(JSON.stringify(res), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('POST /api/holdings error', e);
    return new Response(JSON.stringify({ error: 'Failed to create holding' }), { status: 500 });
  }
}
