import { NextRequest, NextResponse } from "next/server";
import { searchStocks } from "@/lib/actions/finnhub.actions";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get("q") || "";
        const list = await searchStocks(q);
        return NextResponse.json(list, { status: 200 });
    } catch (e: any) {
        console.error("/api/stocks/search error", e);
        return NextResponse.json({ error: e?.message || "Search failed" }, { status: 500 });
    }
}
