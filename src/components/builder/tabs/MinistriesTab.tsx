import { useMemo, useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import { DG_SUMMARY, getDemandsForMinistry, getMinistries, getMinistryTotal, type YearKey } from "@/lib/dg";
import { fmtCr, fmtPctChange, yoy, YEAR_PLAIN, PREV_YEAR, SECTION_PLAIN } from "@/lib/report";

export default function MinistriesTab() {
  const ministries = useMemo(() => getMinistries(), []);
  const [ministry, setMinistry] = useState<string>(ministries[0]);
  const [year, setYear] = useState<YearKey>("be2627");

  const demands = useMemo(() => getDemandsForMinistry(ministry), [ministry]);
  const total = getMinistryTotal(ministry, year, "total");
  const revenue = getMinistryTotal(ministry, year, "revenue");
  const capital = getMinistryTotal(ministry, year, "capital");

  const prevY = PREV_YEAR[year];
  const prevTotal = prevY ? getMinistryTotal(ministry, prevY, "total") : null;
  const yoyPct = yoy(total, prevTotal);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/20 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Pick the department you want to track.</span>{" "}
          See what they ask for, what they actually spend, and how it splits between day-to-day costs and long-term investments.
        </div>
      </div>

      {/* Picker */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium block mb-1">Ministry / Department</label>
          <select
            value={ministry}
            onChange={e => setMinistry(e.target.value)}
            className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ministries.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium block mb-1">Year</label>
          <select
            value={year}
            onChange={e => setYear(e.target.value as YearKey)}
            className="text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="actuals2425">{YEAR_PLAIN.actuals2425.short}</option>
            <option value="be2526">{YEAR_PLAIN.be2526.short}</option>
            <option value="re2526">{YEAR_PLAIN.re2526.short}</option>
            <option value="be2627">{YEAR_PLAIN.be2627.short}</option>
          </select>
        </div>
      </div>

      {/* Headline */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/10">
          <div className="text-xs uppercase tracking-wide text-primary font-medium">Ministry / Department</div>
          <h3 className="font-serif text-2xl font-semibold mt-1">{ministry}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {demands.length} budget request{demands.length === 1 ? "" : "s"} under this department · {YEAR_PLAIN[year].long}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border">
          <Stat label={`Total ${YEAR_PLAIN[year].short}`} value={fmtCr(total)} big />
          <Stat
            label="Change from last year"
            value={fmtPctChange(yoyPct)}
            sub={prevY ? `vs ${YEAR_PLAIN[prevY].short}` : "—"}
          />
          <Stat
            label={SECTION_PLAIN.revenue.short}
            value={fmtCr(revenue)}
            sub={total ? `${((revenue/total)*100).toFixed(0)}% of total` : undefined}
          />
          <Stat
            label={SECTION_PLAIN.capital.short}
            value={fmtCr(capital)}
            sub={total ? `${((capital/total)*100).toFixed(0)}% of total` : undefined}
          />
        </div>
      </div>

      {/* Demands table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <div className="text-sm font-medium">Budget requests under this ministry</div>
          <div className="text-xs text-muted-foreground">
            Each row is a separate "Demand for Grants" — the ministry's request to Parliament for funds.
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Request name</th>
                <th className="px-3 py-2 text-right">{YEAR_PLAIN[year].short}</th>
                <th className="px-3 py-2 text-right">Running costs</th>
                <th className="px-3 py-2 text-right">Long-term</th>
                <th className="px-3 py-2 text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {demands.map(d => {
                const v = d[year].total ?? 0;
                const rev = d[year].revenue ?? 0;
                const cap = d[year].capital ?? 0;
                const pv = prevY ? d[prevY].total ?? null : null;
                const ch = yoy(v, pv);
                return (
                  <tr key={d.demandNo} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{d.demandNo}</td>
                    <td className="px-3 py-2">{d.demandDesc}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">{fmtCr(v)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{fmtCr(rev)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{fmtCr(cap)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${(ch ?? 0) > 0 ? "text-emerald-600" : (ch ?? 0) < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {fmtPctChange(ch)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, big }: { label: string; value: string; sub?: string; big?: boolean }) {
  return (
    <div className="bg-card px-5 py-4">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
      <div className={`tabular-nums font-semibold mt-1 ${big ? "text-2xl" : "text-lg"}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
