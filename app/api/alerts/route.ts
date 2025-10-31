import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { Alert } from "@/database/models/alert.model";
import { inngest } from "@/lib/inngest/client";

// Ensure this API route is never statically pre-rendered during build
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const alerts = await Alert.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, alerts });
  } catch (e: any) {
    console.error("GET /api/alerts error", e);
    return NextResponse.json({ success: false, error: e?.message || "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      stockSymbol,
      stockName,
      alertName,
      condition, // '>' | '<' | '=' -> map to 'above' | 'below' | 'equal'
      targetPrice,
      frequency, // 'once' | 'daily' | 'realtime'
    } = body || {};

    if (!stockSymbol || !stockName || !condition || typeof targetPrice !== "number") {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const condMap: Record<string, 'above' | 'below' | 'equal'> = { '>': 'above', '<': 'below', '=': 'equal' };
    const mappedCondition = condMap[String(condition)] || 'above';

    const freqMap: Record<string, 'once' | 'hourly' | 'daily' | 'weekly' | 'realtime'> = {
      once: 'once',
      daily: 'daily',
      realtime: 'realtime',
    } as const;
    const mappedFreq = freqMap[String(frequency)] || 'once';

    await connectToDatabase();
    const doc = await Alert.create({
      userId: session.user.id,
      symbol: String(stockSymbol).toUpperCase(),
      company: stockName,
      type: 'price',
      condition: mappedCondition,
      value: Number(targetPrice),
      alertName: alertName || undefined,
      frequency: mappedFreq,
      active: true,
      triggered: false,
    });

    // Emit Inngest event for immediate evaluation
    await inngest.send({
      name: 'app/alert.created',
      data: {
        alertId: String(doc._id),
        userId: session.user.id,
        symbol: doc.symbol,
      },
    });

    return NextResponse.json({ success: true, alert: doc });
  } catch (e: any) {
    console.error("POST /api/alerts error", e);
    return NextResponse.json({ success: false, error: e?.message || "Failed to create alert" }, { status: 500 });
  }
}

