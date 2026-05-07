import { ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { getMinorHeadSummary, ddgYoY, hasDDG } from "@/lib/ddg";
import { formatCrore } from "@/lib/dg";

interface Props {
  demandNo: number;
  majorHead: string;
  majorHeadName: string;
  onOpenSheet: () => void;
}

function YoY({ v }: { v: number | null }) {
  if (v === null) return <span className="text-muted-foreground">—</span>;
  const pos = v >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${pos ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
      {pos ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
      {Math.abs(v).toFixed(1)}%
    </span>
  );
}

export function MinorHeadInline({ demandNo, majorHead, majorHeadName, onOpenSheet }: Props) {
  if (!hasDDG(demandNo, majorHead)) {
    return (
      <div className="px-4 py-3 bg-muted/20 text-xs text-muted-foreground italic">
        Detailed DG not yet parsed for this Major Head.
      </div>
    );
  }
  const rows = getMinorHeadSummary(demandNo, majorHead);
  const fmt = (v: number | null) => v !== null ? formatCrore(v, true) : "—";

  return (
    <div className="px-4 py-3 bg-muted/20 border-l-2 border-primary/40 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Minor heads under {majorHead} {majorHeadName} · {rows.length} groups
        </div>
        <button
          onClick={onOpenSheet}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          View full breakdown <ExternalLink className="h-3 w-3" />
        </button>
      </div>
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <table className="w-full text-[11px]">
          <thead className="bg-muted/40 text-muted-foreground text-[10px] uppercase tracking-wide">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">Section</th>
              <th className="px-2 py-1.5 text-left font-medium">Code</th>
              <th className="px-2 py-1.5 text-left font-medium">Minor Head</th>
              <th className="px-2 py-1.5 text-right font-medium">Actuals 24-25</th>
              <th className="px-2 py-1.5 text-right font-medium">BE 25-26</th>
              <th className="px-2 py-1.5 text-right font-medium">RE 25-26</th>
              <th className="px-2 py-1.5 text-right font-medium">BE 26-27</th>
              <th className="px-2 py-1.5 text-right font-medium">YoY</th>
              <th className="px-2 py-1.5 text-left font-medium w-24">Share of MH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => {
              const yoy = ddgYoY(r.be2627, r.be2526);
              return (
                <tr key={`${r.section}-${r.code}`} className="hover:bg-muted/30">
                  <td className="px-2 py-1.5 capitalize text-muted-foreground">{r.section}</td>
                  <td className="px-2 py-1.5 font-mono text-muted-foreground">{r.code}</td>
                  <td className="px-2 py-1.5 max-w-[260px] truncate" title={r.minorHeadName}>{r.minorHeadName}</td>
                  <td className="px-2 py-1.5 text-right tnum">{fmt(r.actuals2425)}</td>
                  <td className="px-2 py-1.5 text-right tnum">{fmt(r.be2526)}</td>
                  <td className="px-2 py-1.5 text-right tnum">{fmt(r.re2526)}</td>
                  <td className="px-2 py-1.5 text-right tnum font-semibold">{fmt(r.be2627)}</td>
                  <td className="px-2 py-1.5 text-right"><YoY v={yoy} /></td>
                  <td className="px-2 py-1.5">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary/60" style={{ width: `${Math.min(100, r.share * 100).toFixed(1)}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
