import { NextRequest } from 'next/server';

// Generates short AI commentary about performance items.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items: { symbol: string; changePct: number }[] = Array.isArray(body?.items) ? body.items : [];
    const period: string = String(body?.period || '1m');

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ comment: '' }), { status: 200 });
    }

    const key = process.env.GEMINI_API_KEY;
    const top = items[0];
    const worst = items[items.length - 1];

    // Fallback text generator
    const fallback = () => {
      const pLabel = periodLabel(period);
      const t = top ? `${top.symbol} led ${pLabel} (${fmt(top.changePct)}%)` : '';
      const w = worst && worst.symbol !== top.symbol ? `${worst.symbol} lagged (${fmt(worst.changePct)}%)` : '';
      return [t, w].filter(Boolean).join('. ');
    };

    if (!key) {
      return new Response(JSON.stringify({ comment: fallback() }), { status: 200 });
    }

    // Try Gemini generateContent API
    const prompt = buildPrompt(items, period);
    try {
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + encodeURIComponent(key),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
        }
      );
      if (!res.ok) {
        return new Response(JSON.stringify({ comment: fallback() }), { status: 200 });
      }
      const data = await res.json();
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || fallback();
      return new Response(JSON.stringify({ comment: text.trim() }), { status: 200 });
    } catch {
      return new Response(JSON.stringify({ comment: fallback() }), { status: 200 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ comment: '' }), { status: 200 });
  }
}

function fmt(n: number) {
  const sign = n >= 0 ? '' : '';
  return (Math.round(n * 10) / 10).toFixed(1);
}

function periodLabel(p: string) {
  switch (p) {
    case '7d':
      return 'this week';
    case '1m':
      return 'this month';
    case '3m':
      return 'the past 3 months';
    case 'ytd':
      return 'YTD';
    default:
      return 'recently';
  }
}

function buildPrompt(items: { symbol: string; changePct: number }[], period: string) {
  const pLabel = periodLabel(period);
  const ranked = items
    .slice(0)
    .sort((a, b) => b.changePct - a.changePct)
    .map((x, i) => `${i + 1}. ${x.symbol}: ${fmt(x.changePct)}%`)
    .join('\n');
  return `You are a concise portfolio assistant. Based on the performance over ${pLabel}, write one short sentence summarizing winners and laggards. Be neutral and precise.\n\nRanked performance:\n${ranked}`;
}
