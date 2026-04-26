import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import historyData from "@/data/budget-history.json";
import { formatCr } from "@/lib/format";

type Row = {
  year: number;
  totalCr: number;
  note?: string;
  estimated?: boolean;
  interpolated?: boolean;
};

const ROWS: Row[] = (historyData as { rows: Row[] }).rows;

const X_TICKS = [1860, 1900, 1947, 1971, 1991, 2014, 2026];

const ERA_MARKERS: { year: number; label: string }[] = [
  { year: 1947, label: "Independence" },
  { year: 1991, label: "Liberalisation" },
  { year: 2017, label: "Rail merge" },
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="rounded-sm border border-border bg-card/95 px-3 py-2 shadow-sm backdrop-blur">
      <div className="font-mono text-[11px] text-muted-foreground tnum">
        FY {r.year}-{String((r.year + 1) % 100).padStart(2, "0")}
        {r.estimated && <span className="ml-1.5 italic">· est.</span>}
        {r.interpolated && <span className="ml-1.5 italic">· interp.</span>}
      </div>
      <div className="mt-1 font-serif text-base font-semibold tnum">
        {formatCr(r.totalCr)}
      </div>
      {r.note && (
        <div className="mt-1 max-w-[200px] text-xs text-foreground/70 leading-snug">
          {r.note}
        </div>
      )}
    </div>
  );
}

export function BudgetHistoryChart() {
  const data = ROWS;
  const latest = useMemo(() => data[data.length - 1], [data]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Total Union Budget · {ROWS[0].year}–{latest.year}
          </div>
          <div className="mt-1 font-serif text-sm text-foreground/70">
            Annual outlay, log scale
          </div>
        </div>
        <div className="text-right">
          <div className="font-serif text-2xl font-semibold tnum text-primary">
            {formatCr(latest.totalCr)}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            BE {latest.year}-{String((latest.year + 1) % 100).padStart(2, "0")}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-5 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 24, right: 16, left: 0, bottom: 8 }}
          >
            <defs>
              <linearGradient id="historyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="year"
              type="number"
              domain={[ROWS[0].year, latest.year]}
              ticks={X_TICKS}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "var(--font-mono, ui-monospace)" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              dataKey="totalCr"
              scale="log"
              domain={[0.3, "dataMax"]}
              hide
            />

            {ERA_MARKERS.map((m) => (
              <ReferenceLine
                key={m.year}
                x={m.year}
                stroke="hsl(var(--border))"
                strokeDasharray="2 3"
                label={{
                  value: m.label,
                  position: "top",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 9,
                  fontFamily: "var(--font-mono, ui-monospace)",
                  offset: 6,
                }}
              />
            ))}

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "2 3" }}
            />

            <Area
              type="monotone"
              dataKey="totalCr"
              stroke="hsl(var(--primary))"
              strokeWidth={1.75}
              fill="url(#historyFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footnote */}
      <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
        Total expenditure across {ROWS.length} budgets. Log scale — without it, the colonial-era figures
        (₹0.5 Cr in 1860) would vanish next to today's ₹55 Lakh Cr. Pre-1947 values reconstructed from
        Government of India records; post-1947 from indiabudget.gov.in archive, PIB and RBI Handbook of Statistics.
      </p>
    </div>
  );
}
