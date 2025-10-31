import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const symbols: string[] = Array.isArray(body?.symbols) ? body.symbols : [];
        if (!symbols.length) {
            return NextResponse.json({ error: "symbols array is required" }, { status: 400 });
        }

        const base = process.env.PY_SERVICE_URL;
        if (!base) {
            return NextResponse.json({ error: "PY_SERVICE_URL is not configured" }, { status: 500 });
        }

        const url = `${base.replace(/\/$/, "")}/compare`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ symbols }),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            return NextResponse.json({ error: text || `Python service error ${res.status}` }, { status: res.status });
        }

        const data = await res.json().catch(() => ({}));
        return NextResponse.json(data, { status: 200 });
    } catch (e: any) {
        console.error("/api/compare error", e);
        return NextResponse.json({ error: e?.message || "Compare proxy failed" }, { status: 500 });
    }
}
