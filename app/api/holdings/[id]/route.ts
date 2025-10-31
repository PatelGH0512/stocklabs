import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/database/mongoose';
import { Holding, IHolding } from '@/database/models/holding.model';
import { auth } from '@/lib/better-auth/auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const id = params.id;
    const body = await req.json();
    const { shares, buyPrice } = body || {};

    const doc = await Holding.findOneAndUpdate(
      { _id: id, userId },
      { $set: { shares: Math.max(0, Number(shares || 0)), buyPrice: Math.max(0, Number(buyPrice || 0)) } },
      { new: true }
    ).lean<IHolding>();

    if (!doc) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

    const res = {
      id: String(doc._id),
      symbol: doc.symbol,
      company: doc.company,
      shares: doc.shares,
      buyPrice: doc.buyPrice,
      currentPrice: doc.currentPrice ?? 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
    return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('PUT /api/holdings/:id error', e);
    return new Response(JSON.stringify({ error: 'Failed to update holding' }), { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: req.headers });
    const userId = session?.user?.id;
    if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const id = params.id;
    const result = await Holding.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error('DELETE /api/holdings/:id error', e);
    return new Response(JSON.stringify({ error: 'Failed to delete holding' }), { status: 500 });
  }
}
