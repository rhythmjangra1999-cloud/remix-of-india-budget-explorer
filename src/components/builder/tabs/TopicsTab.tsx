import { useMemo, useState } from "react";
import { ArrowRight, Info, TrendingUp, TrendingDown } from "lucide-react";
import { TOPICS, aggregateTopic, fmtCr, fmtPctChange, yoy, YEAR_PLAIN, PREV_YEAR, type Topic } from "@/lib/report";
import { type YearKey } from "@/lib/dg";

export default function TopicsTab() {
  const [selectedId, setSelectedId] = useState<string>(TOPICS[0].id);
  const [year, setYear] = useState<YearKey>("be2627");

  const selected = TOPICS.find(t => t.id === selectedId)!;
  const agg = useMemo(() => aggregateTopic(selected, year), [selected, year]);

  const prevY = PREV_YEAR[year];
  const prevVal = prevY ? agg.byYear[prevY] : null;
  const yoyPct = yoy(agg.byYear[year], prevVal);
  const grandTotal = (agg.bySection.revenue + agg.bySection.capital + agg.bySection.loans) || 1;

  // 4-year sparkline data
  const yearOrder: YearKey[] = ["actuals2425","be2526","re2526","be2627"];
  const maxYearVal = Math.max(...yearOrder.map(y => agg.byYear[y]));

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="rounded-lg border border-border bg-muted/20 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Start with a topic.</span>{" "}
          We've grouped India's budget into 14 plain-English topics. Pick one to see how much the government spends on it, who spends it, and how it has changed over time.
        </div>
      </div>

      {/* Topic chips */}
      <div className="flex flex-wrap gap-2">
        {TOPICS.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedId(t.id)}
            className={`px-3 py-2 rounded-full border text-sm transition-all flex items-center gap-1.5
              ${selectedId === t.id
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card hover:bg-muted/50 border-border"}`}
          >
            <span>{t.emoji}</span>
            <span>{t.name}</span>
          </button>
        ))}
      </div>

      {/* Detail card */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selected.emoji}</span>
              <h3 className="font-serif text-2xl font-semibold">{selected.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
          </div>
          <YearPicker year={year} onChange={setYear} />
        </div>

        {/* Headline stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border">
          <Stat
            label={YEAR_PLAIN[year].short}
            value={fmtCr(agg.byYear[year])}
            sub={`${agg.rowCount} budget lines across ${agg.byMinistry.length} ministries`}
            big
          />
          <Stat
            label="Change from last year"
            value={fmtPctChange(yoyPct)}
            sub={prevY ? `vs ${YEAR_PLAIN[prevY].short}` : "—"}
            trend={yoyPct == null ? null : yoyPct > 0 ? "up" : "down"}
          />
          <Stat
            label="Running costs"
            value={fmtCr(agg.bySection.revenue)}
            sub={`${((agg.bySection.revenue/grandTotal)*100).toFixed(0)}% of topic`}
          />
          <Stat
            label="Long-term investments"
            value={fmtCr(agg.bySection.capital + agg.bySection.loans)}
            sub={agg.bySection.loans > 0
              ? `incl. ${fmtCr(agg.bySection.loans)} in loans`
              : "Capital outlay"}
          />
        </div>

        {/* 4-year trend */}
        <div className="px-5 py-4 border-t border-border">
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-3">
            4-year trend
          </div>
          <div className="grid grid-cols-4 gap-2">
            {yearOrder.map(y => {
              const v = agg.byYear[y];
              const h = maxYearVal ? (v / maxYearVal) * 100 : 0;
              const isCurrent = y === year;
              return (
                <div key={y} className="flex flex-col items-center gap-1">
                  <div className="text-xs tabular-nums font-medium">{fmtCr(v)}</div>
                  <div className="w-full h-24 bg-muted/20 rounded flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t transition-all ${isCurrent ? "bg-primary" : "bg-primary/40"}`}
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-muted-foreground">{YEAR_PLAIN[y].short}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top ministries */}
        <div className="px-5 py-4 border-t border-border">
          <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-3">
            Who spends on this — top 8 ministries ({YEAR_PLAIN[year].short})
          </div>
          {agg.byMinistry.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">No data for this topic in this year.</div>
          ) : (
            <div className="space-y-1.5">
              {agg.byMinistry.slice(0, 8).map(({ ministry, value }) => {
                const pct = (value / agg.byYear[year]) * 100;
                return (
                  <div key={ministry} className="flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0 truncate" title={ministry}>{ministry}</div>
                    <div className="flex-1 h-4 bg-muted/40 rounded overflow-hidden">
                      <div className="h-full bg-primary/70" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                    <div className="w-24 text-right tabular-nums text-xs font-medium">{fmtCr(value)}</div>
                    <div className="w-12 text-right tabular-nums text-xs text-muted-foreground">{pct.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          )}
          {agg.byMinistry.length > 8 && (
            <div className="text-xs text-muted-foreground mt-2 italic">
              + {agg.byMinistry.length - 8} more ministries contribute smaller amounts
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-muted-foreground italic">
        Topic groupings combine Major Heads across Revenue, Capital and Loans accounts. Sources: Demand for Grants 2026-27, LMMHA (CGA).
      </div>
    </div>
  );
}

function Stat({ label, value, sub, big, trend }: {
  label: string; value: string; sub?: string; big?: boolean; trend?: "up" | "down" | null;
}) {
  return (
    <div className="bg-card px-5 py-4">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
      <div className={`tabular-nums font-semibold mt-1 flex items-center gap-1.5
        ${big ? "text-2xl" : "text-lg"}
        ${trend === "up" ? "text-emerald-600" : trend === "down" ? "text-destructive" : "text-foreground"}`}>
        {trend === "up" && <TrendingUp className="h-4 w-4" />}
        {trend === "down" && <TrendingDown className="h-4 w-4" />}
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function YearPicker({ year, onChange }: { year: YearKey; onChange: (y: YearKey) => void }) {
  return (
    <select
      value={year}
      onChange={e => onChange(e.target.value as YearKey)}
      className="text-sm rounded-md border border-input bg-background px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="actuals2425">{YEAR_PLAIN.actuals2425.short}</option>
      <option value="be2526">{YEAR_PLAIN.be2526.short}</option>
      <option value="re2526">{YEAR_PLAIN.re2526.short}</option>
      <option value="be2627">{YEAR_PLAIN.be2627.short}</option>
    </select>
  );
}
