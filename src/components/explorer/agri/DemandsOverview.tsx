import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  type DemandSummary,
  type YearKey,
  YEAR_LABELS,
  computeYoY,
  getDemandSummaries,
} from "@/lib/agri";
import { formatCr } from "@/lib/format";

type Section = "all" | "Revenue" | "Capital";

function getValue(d: DemandSummary, year: YearKey, section: Section): number {
  if (section === "all") return d[year];
  if (section === "Revenue") return d[`rev${year[0].toUpperCase()}${year.slice(1)}` as keyof DemandSummary] as number;
  return d[`cap${year[0].toUpperCase()}${year.slice(1)}` as keyof DemandSummary] as number;
}

function YoYPill({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground tnum text-xs">—</span>;
  const pos = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[11px] tnum font-mono ${
        pos
          ? "bg-green-500/10 text-green-700 dark:text-green-400"
          : "bg-red-500/10 text-red-700 dark:text-red-400"
      }`}
    >
      {pos ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function MiniBarChart({ demand, section }: { demand: DemandSummary; section: Section }) {
  const years: YearKey[] = ["actuals2425", "be2526", "re2526", "be2627"];
  const values = years.map((y) => getValue(demand, y, section));
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {years.map((y, i) => {
        const v = values[i];
        const h = Math.max(4, (v / max) * 64);
        const isLast = i === years.length - 1;
        return (
          <div key={y} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div className="text-[9px] tnum font-mono text-muted-foreground whitespace-nowrap">
              {formatCr(v, { compact: true })}
            </div>
            <div
              className={`w-full rounded-sm ${isLast ? "bg-primary" : "bg-muted-foreground/40"}`}
              style={{ height: `${h}px` }}
              title={`${YEAR_LABELS[y]}: ${formatCr(v)}`}
            />
            <div className="text-[9px] text-muted-foreground text-center leading-tight">
              {YEAR_LABELS[y].split(" ")[0]}
              <br />
              <span className="text-[8px]">{YEAR_LABELS[y].split(" ")[1]}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DemandsOverview({ section }: { section: Section }) {
  const demands = useMemo(() => getDemandSummaries(), []);
  const [sortKey, setSortKey] = useState<"demandNo" | "be2627" | "yoy">("demandNo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    return [...demands].sort((a, b) => {
      let av = 0;
      let bv = 0;
      if (sortKey === "demandNo") {
        av = a.demandNo; bv = b.demandNo;
      } else if (sortKey === "be2627") {
        av = getValue(a, "be2627", section);
        bv = getValue(b, "be2627", section);
      } else {
        av = computeYoY(getValue(a, "be2627", section), getValue(a, "be2526", section)) ?? -Infinity;
        bv = computeYoY(getValue(b, "be2627", section), getValue(b, "be2526", section)) ?? -Infinity;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [demands, section, sortKey, sortDir]);

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "demandNo" ? "asc" : "desc");
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sorted.map((d) => {
        const curr = getValue(d, "be2627", section);
        const prev = getValue(d, "be2526", section);
        const yoy = computeYoY(curr, prev);
        return (
          <div key={d.demandId} className="rounded-sm border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Demand {d.demandNo} · {d.short}
                </div>
                <div className="font-medium leading-tight mt-0.5">{d.title}</div>
              </div>
              <YoYPill value={yoy} />
            </div>
            <div className="flex items-baseline gap-3 mb-4">
              <div className="font-serif text-2xl font-semibold tnum">{formatCr(curr)}</div>
              <div className="text-xs text-muted-foreground">
                BE 26-27 · {section === "all" ? "Total" : section}
              </div>
            </div>
            <MiniBarChart demand={d} section={section} />
          </div>
        );
      })}

      <div className="md:col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Sort:</span>
        {(["demandNo", "be2627", "yoy"] as const).map((k) => (
          <button
            key={k}
            onClick={() => toggleSort(k)}
            className={`px-2 py-1 rounded-sm border transition-colors ${
              sortKey === k ? "border-foreground text-foreground" : "border-border hover:bg-muted"
            }`}
          >
            {k === "demandNo" ? "Demand #" : k === "be2627" ? "BE 26-27" : "YoY %"}
            {sortKey === k && (sortDir === "desc" ? " ↓" : " ↑")}
          </button>
        ))}
      </div>
    </div>
  );
}
