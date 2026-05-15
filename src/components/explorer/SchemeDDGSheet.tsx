import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DDGTreeNode } from "./ddg/DDGTreeNode";
import { buildSchemeTree, getSchemeLeaves, reconColor, type SchemeDDGEntry } from "@/lib/scheme-ddg";
import { formatCrore } from "@/lib/dg";

interface Props {
  open: boolean;
  onClose: () => void;
  entry: SchemeDDGEntry | null;
}

export function SchemeDDGSheet({ open, onClose, entry }: Props) {
  const tree = useMemo(() => (entry ? buildSchemeTree(entry) : []), [entry]);
  const leaves = useMemo(() => (entry ? getSchemeLeaves(entry) : []), [entry]);

  const fmt = (v: number | null) => (v !== null ? formatCrore(v, true) : "—");

  if (!entry) return null;

  const sumBE = entry.sumMatchedBE2627;
  const diff = sumBE !== null ? sumBE - entry.outlayCr : null;
  const diffPct = sumBE !== null && entry.outlayCr ? (diff! / entry.outlayCr) * 100 : null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-5xl overflow-y-auto p-0">
        <SheetHeader className="px-5 py-4 border-b border-border bg-muted/30 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {entry.ministry} · Demand {entry.demandNo} · {entry.schemeType}
          </div>
          <SheetTitle className="font-serif text-xl">
            {entry.schemeName}
            <span className="ml-2 text-xs font-mono text-muted-foreground">#{entry.schemeCode}</span>
          </SheetTitle>

          <div className="flex flex-wrap items-end gap-5 pt-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Recorded outlay</div>
              <div className="font-serif text-2xl font-bold tnum">{fmt(entry.outlayCr)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sum of matched DDG (BE 26-27)</div>
              <div className="font-serif text-2xl font-bold tnum text-primary">{fmt(sumBE)}</div>
            </div>
            {diff !== null && (
              <div className={`rounded-sm border px-2 py-1 text-xs font-medium ${reconColor(entry.reconStatus)}`}>
                Δ {diff >= 0 ? "+" : ""}{fmt(diff)}
                {diffPct !== null && <span className="ml-1 opacity-70">({diffPct >= 0 ? "+" : ""}{diffPct.toFixed(1)}%)</span>}
              </div>
            )}
            <div className="ml-auto text-right space-y-1">
              <div className={`inline-block rounded-sm border px-2 py-1 text-[10px] uppercase tracking-wider font-medium ${
                entry.matchConfidence === "exact" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : entry.matchConfidence === "fuzzy" ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-muted text-muted-foreground border-border"
              }`}>
                {entry.matchConfidence} match
              </div>
              {entry.matchedAtLevel && (
                <div className="text-[10px] text-muted-foreground">
                  matched at {entry.matchedAtLevel} · {leaves.length} object-head row{leaves.length === 1 ? "" : "s"}
                </div>
              )}
            </div>
          </div>
          {entry.matchedName && (
            <div className="text-[11px] text-muted-foreground italic">
              DDG name: "{entry.matchedName}"
            </div>
          )}
        </SheetHeader>

        {/* Tree header */}
        <div className="px-2 py-2 border-b border-border bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground grid grid-cols-[1fr_60px_60px_60px_60px_60px_60px_70px_56px] gap-1.5">
          <div>Major → Minor → Sub-Head → Object</div>
          <div className="text-right">Act 23-24</div>
          <div className="text-right">BE 24-25</div>
          <div className="text-right">RE 24-25</div>
          <div className="text-right">Act 24-25</div>
          <div className="text-right">BE 25-26</div>
          <div className="text-right">RE 25-26</div>
          <div className="text-right">BE 26-27</div>
          <div className="text-right">YoY</div>
        </div>

        <div className="pb-8">
          {tree.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {entry.ddgAvailableForDemand
                ? "No DDG entry could be matched to this scheme name. The scheme may sit under a generic head — try opening the demand's full DDG."
                : "Detailed DDG data is not yet loaded for this demand."}
            </div>
          ) : (
            tree.map((n) => (
              <DDGTreeNode key={n.fullCode} node={n} depth={0} defaultExpandLevel={4} hideTokens={false} search="" />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
