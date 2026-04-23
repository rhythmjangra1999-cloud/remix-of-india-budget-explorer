import flow from "@/data/budget-flow.json";
import { formatCr } from "@/lib/format";

export function HierarchyDrill() {
  const ex = flow.hierarchyExample;
  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-mono">
          Worked example
        </div>
        <div className="font-serif text-lg font-semibold mt-1">{ex.ministry}</div>
        <div className="text-sm text-muted-foreground">
          Total outlay: <span className="font-mono tabular-nums">{formatCr(ex.totalCr)}</span>
        </div>
      </div>

      <div className="p-5 space-y-1">
        {ex.levels.map((lvl) => (
          <div
            key={lvl.n}
            className="flex items-stretch gap-3"
            style={{ paddingLeft: `${(lvl.n - 1) * 18}px` }}
          >
            <div className="w-6 shrink-0 flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-muted text-foreground/70 flex items-center justify-center text-xs font-mono">
                {lvl.n}
              </div>
              {lvl.n < 6 && <div className="flex-1 w-px bg-border my-1" />}
            </div>
            <div className="flex-1 pb-3">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">
                {lvl.name}
              </div>
              <div className="flex items-baseline justify-between gap-3 mt-0.5">
                <span className="font-serif text-base">{lvl.value}</span>
                {lvl.amountCr != null && (
                  <span className="font-mono text-sm tabular-nums text-foreground/80">
                    {formatCr(lvl.amountCr)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
        Every rupee in a Detailed Demand for Grants is classified under all six levels.
      </div>
    </div>
  );
}
