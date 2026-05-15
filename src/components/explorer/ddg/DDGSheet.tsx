import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { buildDDGTree, getDDGLeaves, getGapCounts, ddgYoY } from "@/lib/ddg";
import { formatCrore } from "@/lib/dg";
import { DDGTreeNode } from "./DDGTreeNode";

interface Props {
  open: boolean;
  onClose: () => void;
  demandNo: number;
  majorHead: string;
  majorHeadName: string;
  ministry: string;
  demandDesc: string;
}

export function DDGSheet({ open, onClose, demandNo, majorHead, majorHeadName, ministry, demandDesc }: Props) {
  const [search, setSearch] = useState("");
  const [hideTokens, setHideTokens] = useState(false);

  const tree = useMemo(() => buildDDGTree(demandNo, majorHead), [demandNo, majorHead]);
  const leaves = useMemo(() => getDDGLeaves(demandNo, majorHead), [demandNo, majorHead]);
  const gaps = useMemo(() => getGapCounts(leaves), [leaves]);
  const totals = useMemo(() => {
    const sum = (k: "actuals2324" | "be2425" | "re2425" | "actuals2425" | "be2526" | "re2526" | "be2627") => {
      let s = 0, any = false;
      for (const r of leaves) { const v = r[k]; if (typeof v === "number") { s += v; any = true; } }
      return any ? s : null;
    };
    return { actuals2324: sum("actuals2324"), be2425: sum("be2425"), re2425: sum("re2425"), actuals2425: sum("actuals2425"), be2526: sum("be2526"), re2526: sum("re2526"), be2627: sum("be2627") };
  }, [leaves]);
  const yoy = ddgYoY(totals.be2627, totals.be2526);

  const exportCsv = () => {
    const hdr = "Full Code,Section,Sub-Major,Minor,Minor Name,Sub,Detailed,Sub Name,Object,Object Name,Actuals 23-24,BE 24-25,RE 24-25,Actuals 24-25,BE 25-26,RE 25-26,BE 26-27,Gap\n";
    const body = leaves.map((r) =>
      [r.id, r.section, r.subMajor, r.minorHead, `"${r.minorHeadName}"`, r.subHead, r.detailedHead, `"${r.subHeadName}"`, r.objectHead, `"${r.objectHeadName}"`, r.actuals2324 ?? "", r.be2425 ?? "", r.re2425 ?? "", r.actuals2425 ?? "", r.be2526 ?? "", r.re2526 ?? "", r.be2627 ?? "", r.gapFlag ?? ""].join(",")
    ).join("\n");
    const blob = new Blob([hdr + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ddg-d${demandNo}-mh${majorHead}.csv`;
    a.click();
  };

  const fmt = (v: number | null) => v !== null ? formatCrore(v, true) : "—";

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto p-0">
        <SheetHeader className="px-5 py-4 border-b border-border bg-muted/30">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {ministry} · Demand {demandNo} · {demandDesc}
          </div>
          <SheetTitle className="font-serif text-xl flex items-baseline gap-2">
            <span className="font-mono text-muted-foreground text-base">{majorHead}</span>
            {majorHeadName}
          </SheetTitle>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">BE 26-27</div>
              <div className="font-serif text-2xl font-bold tnum text-primary">{fmt(totals.be2627)}</div>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>RE 25-26: <span className="tnum">{fmt(totals.re2526)}</span></div>
              <div>BE 25-26: <span className="tnum">{fmt(totals.be2526)}</span></div>
              <div>Act 24-25: <span className="tnum">{fmt(totals.actuals2425)}</span></div>
              <div>RE 24-25: <span className="tnum">{fmt(totals.re2425)}</span></div>
              <div>BE 24-25: <span className="tnum">{fmt(totals.be2425)}</span></div>
              <div>Act 23-24: <span className="tnum">{fmt(totals.actuals2324)}</span></div>
            </div>
            {yoy !== null && (
              <div className={`rounded-sm px-2 py-1 text-xs font-medium ${yoy >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                YoY {yoy >= 0 ? "+" : ""}{yoy.toFixed(1)}%
              </div>
            )}
            <div className="ml-auto flex flex-wrap gap-1">
              {gaps.DISCONTINUED > 0 && <span className="rounded-sm bg-rose-50 text-rose-700 px-1.5 py-0.5 text-[10px] font-medium">{gaps.DISCONTINUED} discontinued</span>}
              {gaps.NEW > 0 && <span className="rounded-sm bg-blue-50 text-blue-700 px-1.5 py-0.5 text-[10px] font-medium">{gaps.NEW} new</span>}
              
            </div>
          </div>
        </SheetHeader>

        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or name…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-input bg-background"
            />
          </div>
        </div>

        {/* Tree header row */}
        <div className="px-2 py-2 border-b border-border bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground grid grid-cols-[1fr_70px_70px_70px_80px_60px] gap-2">
          <div>Hierarchy</div>
          <div className="text-right">Actuals 24-25</div>
          <div className="text-right">BE 25-26</div>
          <div className="text-right">RE 25-26</div>
          <div className="text-right">BE 26-27</div>
          <div className="text-right">YoY</div>
        </div>

        {/* Tree */}
        <div className="pb-8">
          {tree.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No detailed data available.</div>
          ) : (
            tree.map((n) => (
              <DDGTreeNode
                key={n.fullCode}
                node={n}
                depth={0}
                defaultExpandLevel={2}
                hideTokens={hideTokens}
                search={search}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
