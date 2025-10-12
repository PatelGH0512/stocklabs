import { NextRequest, NextResponse } from "next/server";
import { getMarketStatus } from "@/lib/actions/finnhub.actions";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const exchange = searchParams.get("exchange") || "US";
    const data = await getMarketStatus(exchange);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    console.error("/api/market-status error", e);
    return NextResponse.json({ error: e?.message || "Market status failed" }, { status: 500 });
  }
}
