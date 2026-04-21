import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { BUDGET_META, COVERAGE, demandsForMinistry, ddgsForDemand } from "@/lib/budget-data";
import { formatCr, formatPct, formatYoY } from "@/lib/format";
import type { Ministry, FY } from "@/data/types";

interface Props {
  ministry: Ministry | null;
  fy: FY;
}

export function MinistryDetailPanel({ ministry, fy }: Props) {
  if (!ministry) {
    return (
      <aside className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
        <div className="font-serif text-lg text-muted-foreground">
          Pick a ministry from the chart or list to see details.
        </div>
        <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto">
          Click a tile in the treemap, a ring in the sunburst, or a row in the table.
        </p>
      </aside>
    );
  }

  const demands = demandsForMinistry(ministry.id);
  const total = ministry.totals[fy] ?? 0;
  const yoy = formatYoY(ministry.totals.FY26, ministry.totals.FY27);
  const cov = COVERAGE.find((c) => c.ministryId === ministry.id);

  return (
    <aside className="rounded-sm border border-border bg-card p-6 space-y-6 animate-fade-in">
      <header>
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Ministry
        </div>
        <h3 className="mt-1 font-serif text-2xl font-semibold leading-tight">{ministry.name}</h3>
      </header>

      <div className="grid grid-cols-2 gap-px bg-border rounded-sm overflow-hidden border border-border">
        <Stat label={`${fy} outlay`} value={formatCr(total)} />
        <Stat label="Share of Union Budget" value={formatPct(total, BUDGET_META.totalUnionBudgetCr)} />
        <Stat
          label="YoY change"
          value={yoy.text}
          tone={yoy.positive === true ? "pos" : yoy.positive === false ? "neg" : undefined}
        />
        <Stat label="Demands" value={`${demands.length}`} />
      </div>

      {cov && (
        <div className="flex flex-wrap gap-2">
          <ConfidenceChip level={cov.dgStatus} />
          <ConfidenceChip level={cov.ddgStatus} />
        </div>
      )}

      <section>
        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground mb-3">
          Demands for Grants
        </div>
        <ul className="space-y-2">
          {demands.length === 0 && (
            <li className="text-sm text-muted-foreground italic">No DG breakdown available yet.</li>
          )}
          {demands.map((d) => {
            const rows = ddgsForDemand(d.id);
            const v = d.amounts[fy] ?? 0;
            return (
              <li
                key={d.id}
                className="rounded-sm border border-border bg-background/50 p-3"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-sm font-medium leading-tight">
                    <span className="text-muted-foreground font-mono text-xs mr-1.5">D{d.number}</span>
                    {d.title}
                  </div>
                  <div className="font-mono text-xs tnum whitespace-nowrap">{formatCr(v, { compact: true })}</div>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-sm overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(v / Math.max(total, 1)) * 100}%` }} />
                </div>
                {rows.length > 0 && (
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer text-primary hover:underline">
                      {rows.length} object-head rows
                    </summary>
                    <ul className="mt-2 space-y-1 pl-3 border-l border-border">
                      {rows.slice(0, 8).map((r, i) => (
                        <li key={i} className="flex justify-between gap-3 text-muted-foreground">
                          <span className="truncate">
                            {r.minorHead} · <span className="text-foreground">{r.objectHead}</span>
                          </span>
                          <span className="tnum whitespace-nowrap">
                            {formatCr(r.amounts[fy] ?? 0, { compact: true })}
                          </span>
                        </li>
                      ))}
                      {rows.length > 8 && (
                        <li className="text-muted-foreground italic">
                          + {rows.length - 8} more rows
                        </li>
                      )}
                    </ul>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <Link
        to="/methodology"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
      >
        How to read this <ExternalLink className="h-3 w-3" />
      </Link>
    </aside>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="bg-card p-4">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div
        className={`mt-1 font-serif text-lg font-semibold tnum ${
          tone === "pos" ? "text-conf-validated" : tone === "neg" ? "text-destructive" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
