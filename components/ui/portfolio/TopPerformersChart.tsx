"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { useTheme } from "next-themes";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title
);

type PerformanceItem = { symbol: string; changePct: number };

type Period = "7d" | "1m" | "3m" | "ytd";

export default function TopPerformersChart({ symbols }: { symbols: string[] }) {
  const { resolvedTheme, theme } = useTheme();
  const isDark =
    ((resolvedTheme || theme || "") as string).toLowerCase() === "dark";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    // Set global default color so any text not explicitly styled uses theme-appropriate color
    ChartJS.defaults.color = isDark ? "#ffffff" : "#111111";
  }, [isDark]);
  const uniqueSymbols = useMemo(
    () =>
      Array.from(
        new Set((symbols || []).map((s) => s?.toUpperCase()).filter(Boolean))
      ),
    [symbols]
  );

  const [period, setPeriod] = useState<Period>("1m");
  const [data, setData] = useState<PerformanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentary, setCommentary] = useState<string>("");

  const load = async () => {
    if (uniqueSymbols.length === 0) {
      setData([]);
      setCommentary("");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/performance?symbols=${encodeURIComponent(
          uniqueSymbols.join(",")
        )}&period=${period}`,
        { cache: "no-store" }
      );
      const items: PerformanceItem[] = res.ok ? await res.json() : [];
      const sorted = (items || [])
        .slice()
        .sort((a, b) => b.changePct - a.changePct);
      setData(sorted);

      // Ask AI commentary (best effort)
      try {
        const cres = await fetch(`/api/commentary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: sorted, period }),
        });
        if (cres.ok) {
          const json = await cres.json();
          setCommentary(String(json.comment || ""));
        } else {
          setCommentary(defaultCommentary(sorted, period));
        }
      } catch {
        setCommentary(defaultCommentary(sorted, period));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, uniqueSymbols.join(",")]);

  const labels = data.map((d) => d.symbol);
  const chartData = {
    labels,
    datasets: [
      {
        label: "Performance (%)",
        data: data.map((d) => d.changePct),
        backgroundColor: data.map((d) =>
          d.changePct >= 0 ? "rgba(34,197,94,0.8)" : "rgba(239,68,68,0.8)"
        ),
        borderRadius: 8,
        barThickness: 70,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    layout: { padding: { left: 12, right: 8, top: 4, bottom: 4 } },
    plugins: {
      title: {
        display: true,
        text: titleForPeriod(period),
        color: isDark ? "#fff" : "#111",
        font: { size: 16, weight: "bold" },
      },
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${Number(ctx.parsed.x ?? 0).toFixed(2)}%`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: isDark ? "#FFFFFF" : "#333",
          font: { size: 11, weight: "600" as const },
          padding: 4,
        },
        grid: {
          display: true,
          color: isDark
            ? "rgba(235, 230, 230, 0.1)"
            : "rgba(234, 228, 228, 0.08)",
        },
      },
      y: {
        ticks: {
          color: isDark ? "#FFFFFF" : "#111111",
          font: { size: 14, weight: "800" as const },
          padding: 6,
        },
        grid: {
          display: true,
          color: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
      },
    },
  };

  if (!mounted) return null;

  return (
    <div className="rounded-xl overflow-hidden border bg-card text-card-foreground p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold ">Top Performers</h2>
        <div className="inline-flex rounded-md shadow-sm isolate border border-border">
          <PeriodButton
            label="7D"
            value="7d"
            active={period === "7d"}
            onClick={() => setPeriod("7d")}
          />
          <PeriodButton
            label="1M"
            value="1m"
            active={period === "1m"}
            onClick={() => setPeriod("1m")}
          />
          <PeriodButton
            label="3M"
            value="3m"
            active={period === "3m"}
            onClick={() => setPeriod("3m")}
          />
          <PeriodButton
            label="YTD"
            value="ytd"
            active={period === "ytd"}
            onClick={() => setPeriod("ytd")}
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-2xl shadow-lg dark:bg-gray-800">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <Bar data={chartData as any} options={options as any} height={250} />
        )}
      </div>

      <div className="mt-3 text-sm text-muted-foreground">
        {commentary && <p>{commentary}</p>}
      </div>
    </div>
  );
}

function PeriodButton({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: Period;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      className={active ? "rounded-none" : "rounded-none bg-transparent"}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function titleForPeriod(p: Period) {
  switch (p) {
    case "7d":
      return "Top Performers (Past 7 Days)";
    case "1m":
      return "Top Performers (Past 1 Month)";
    case "3m":
      return "Top Performers (Past 3 Months)";
    case "ytd":
      return "Top Performers (YTD)";
    default:
      return "Top Performers";
  }
}

function defaultCommentary(items: PerformanceItem[], period: Period) {
  if (!items || items.length === 0) return "";
  const top = items[0];
  const worst = items[items.length - 1];
  const pLabel = {
    "7d": "past week",
    "1m": "past month",
    "3m": "past 3 months",
    ytd: "YTD",
  }[period];
  const t = top
    ? `${top.symbol} led your portfolio (${top.changePct.toFixed(1)}%)`
    : "";
  const w =
    worst && worst !== top
      ? `${worst.symbol} lagged (${worst.changePct.toFixed(1)}%)`
      : "";
  return [t, w].filter(Boolean).join(". ");
}
