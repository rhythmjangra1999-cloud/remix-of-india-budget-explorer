import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { BUDGET_META, COVERAGE, demandsForMinistry, ddgsForDemand } from "@/lib/budget-data";
import { formatCr, formatPct, formatYoY } from "@/lib/format";
import type { Demand, Ministry, FY } from "@/data/types";

interface Props {
  ministry: Ministry | null;
  fy: FY;
}

export function MinistryDetailPanel({ ministry, fy }: Props) {
  const [openDemand, setOpenDemand] = useState<string | null>(null);

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
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Demands for Grants
          </div>
          <div className="text-[10px] text-muted-foreground">Click a row to expand</div>
        </div>
        <ul className="space-y-2">
          {demands.length === 0 && (
            <li className="text-sm text-muted-foreground italic">No DG breakdown available yet.</li>
          )}
          {demands.map((d) => (
            <DemandRow
              key={d.id}
              demand={d}
              fy={fy}
              total={total}
              isOpen={openDemand === d.id}
              onToggle={() => setOpenDemand(openDemand === d.id ? null : d.id)}
            />
          ))}
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

function DemandRow({
  demand,
  fy,
  total,
  isOpen,
  onToggle,
}: {
  demand: Demand;
  fy: FY;
  total: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const v = demand.amounts[fy] ?? 0;
  const rows = ddgsForDemand(demand.id);
  const a = demand.amounts as Record<string, number | undefined>;

  // Pull all fields we may have for this DG.
  const fy27Rev = a.FY27_Revenue;
  const fy27Cap = a.FY27_Capital;
  const fy26Re = a.FY26_RE;
  const fy25Act = a.FY25_Actual;
  const yoy = formatYoY(a.FY26, a.FY27);

  // Capital share for the ribbon
  const capPct =
    fy27Rev != null && fy27Cap != null && fy27Rev + fy27Cap > 0
      ? (fy27Cap / (fy27Rev + fy27Cap)) * 100
      : null;

  return (
    <li className="rounded-sm border border-border bg-background/50">
      <button
        onClick={onToggle}
        className="w-full text-left p-3 hover:bg-muted/30 transition-colors rounded-sm"
        aria-expanded={isOpen}
      >
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-sm font-medium leading-tight flex items-baseline gap-1.5 min-w-0">
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 self-center" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 self-center" />
            )}
            <span className="text-muted-foreground font-mono text-xs">D{demand.number}</span>
            <span className="truncate">{demand.title}</span>
          </div>
          <div className="font-mono text-xs tnum whitespace-nowrap">
            {formatCr(v, { compact: true })}
          </div>
        </div>
        <div className="mt-2 h-1.5 bg-muted rounded-sm overflow-hidden flex">
          <div
            className="h-full bg-primary"
            style={{ width: `${(v / Math.max(total, 1)) * 100}%` }}
          />
        </div>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-1 space-y-3 animate-fade-in">
          {/* Year-by-year micro table */}
          <div className="grid grid-cols-4 gap-px bg-border rounded-sm overflow-hidden border border-border text-[10px]">
            <MicroStat label="FY25 Actual" value={fy25Act} />
            <MicroStat label="FY26 BE" value={a.FY26} />
            <MicroStat label="FY26 RE" value={fy26Re} />
            <MicroStat label="FY27 BE" value={a.FY27} highlight />
          </div>

          {/* Revenue vs Capital ribbon */}
          {fy27Rev != null && fy27Cap != null && (
            <div>
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                <span>Revenue vs Capital · FY27</span>
                {capPct != null && <span className="tnum">{capPct.toFixed(1)}% capital</span>}
              </div>
              <div className="h-2 bg-muted rounded-sm overflow-hidden flex">
                <div
                  className="h-full bg-primary/70"
                  style={{ width: `${(fy27Rev / (fy27Rev + fy27Cap)) * 100}%` }}
                  title={`Revenue: ${formatCr(fy27Rev, { compact: true })}`}
                />
                <div
                  className="h-full bg-foreground/70"
                  style={{ width: `${(fy27Cap / (fy27Rev + fy27Cap)) * 100}%` }}
                  title={`Capital: ${formatCr(fy27Cap, { compact: true })}`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1 tnum">
                <span>Revenue {formatCr(fy27Rev, { compact: true })}</span>
                <span>Capital {formatCr(fy27Cap, { compact: true })}</span>
              </div>
            </div>
          )}

          {/* YoY */}
          {yoy.text !== "—" && (
            <div className="flex items-baseline justify-between text-xs border-t border-border pt-2">
              <span className="text-muted-foreground">YoY (FY26 BE → FY27 BE)</span>
              <span
                className={`tnum font-medium ${
                  yoy.positive ? "text-conf-validated" : "text-destructive"
                }`}
              >
                {yoy.text}
              </span>
            </div>
          )}

          {/* DDG object-head rows when available */}
          {rows.length > 0 ? (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Object-head detail · {rows.length} rows
              </div>
              <ul className="space-y-1 pl-3 border-l border-border text-xs">
                {rows.slice(0, 12).map((r, i) => (
                  <li key={i} className="flex justify-between gap-3 text-muted-foreground">
                    <span className="truncate">
                      {r.minorHead} · <span className="text-foreground">{r.objectHead}</span>
                      {r.revenue === false && (
                        <span className="ml-1 text-[9px] uppercase text-primary/70">cap</span>
                      )}
                    </span>
                    <span className="tnum whitespace-nowrap">
                      {formatCr(r.amounts[fy] ?? 0, { compact: true })}
                    </span>
                  </li>
                ))}
                {rows.length > 12 && (
                  <li className="text-muted-foreground italic">
                    + {rows.length - 12} more rows
                  </li>
                )}
              </ul>
            </div>
          ) : (
            <div className="rounded-sm border border-dashed border-border bg-muted/20 p-3 text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Object-head detail pending.</span>{" "}
              The Detailed Demands for Grants (DDGs) for this ministry have not yet been parsed.
              Only Revenue/Capital totals are available so far.
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function MicroStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: number;
  highlight?: boolean;
}) {
  return (
    <div className={`p-2 ${highlight ? "bg-primary/5" : "bg-card"}`}>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground leading-tight">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[11px] tnum font-medium">
        {value != null ? formatCr(value, { compact: true }) : "—"}
      </div>
    </div>
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
