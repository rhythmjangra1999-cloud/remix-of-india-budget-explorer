import { useState } from "react";
import { ChevronRight, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";
import type { DDGNode } from "@/lib/ddg";
import { ddgYoY } from "@/lib/ddg";
import { formatCrore } from "@/lib/dg";

interface Props {
  node: DDGNode;
  depth: number;
  defaultExpandLevel: number; // expand by default down to this depth
  hideTokens: boolean;
  search: string;
}

const LEVEL_LABELS: Record<DDGNode["level"], string> = {
  minor: "Minor",
  subHead: "Sub-Head",
  object: "Object",
};

function YoY({ v }: { v: number | null }) {
  if (v === null) return <span className="text-muted-foreground text-[10px]">—</span>;
  const pos = v >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-sm px-1 py-0.5 text-[10px] font-medium tabular-nums ${pos ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
      {pos ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
      {Math.abs(v).toFixed(1)}%
    </span>
  );
}

function GapBadge({ flag }: { flag?: string | null }) {
  if (!flag || flag === "SMALL_BASE" || flag === "TOKEN") return null;
  const styles: Record<string, string> = {
    DISCONTINUED: "bg-rose-50 text-rose-700",
    NEW: "bg-blue-50 text-blue-700",
    TOKEN: "bg-slate-100 text-slate-600",
  };
  return <span className={`rounded-sm px-1 py-0.5 text-[9px] font-medium uppercase tracking-wider ${styles[flag] ?? ""}`}>{flag.replace("_", " ")}</span>;
}

function matchesSearch(node: DDGNode, q: string): boolean {
  if (!q) return true;
  const lq = q.toLowerCase();
  if (node.name.toLowerCase().includes(lq) || node.fullCode.includes(lq)) return true;
  return !!node.children?.some((c) => matchesSearch(c, lq));
}

export function DDGTreeNode({ node, depth, defaultExpandLevel, hideTokens, search }: Props) {
  const [open, setOpen] = useState(depth < defaultExpandLevel);
  const isLeaf = !node.children || node.children.length === 0;
  const yoy = ddgYoY(node.be2627, node.be2526);
  const fmt = (v: number | null) => v !== null ? formatCrore(v, true) : "—";

  if (hideTokens && isLeaf && (node.gapFlag === "TOKEN" || node.gapFlag === "SMALL_BASE")) return null;
  if (search && !matchesSearch(node, search)) return null;

  return (
    <div>
      <div
        className={`grid grid-cols-[1fr_70px_70px_70px_80px_60px] gap-2 items-center px-2 py-1.5 text-[11px] hover:bg-muted/30 ${depth === 0 ? "bg-muted/40 font-semibold" : ""}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {!isLeaf ? (
            <button onClick={() => setOpen((o) => !o)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
              {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          ) : (
            <span className="w-3 h-3 flex-shrink-0" />
          )}
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground flex-shrink-0">{LEVEL_LABELS[node.level]}</span>
          <span className="font-mono text-muted-foreground flex-shrink-0">{node.code}</span>
          <span className="truncate" title={`${node.name} · ${node.fullCode}`}>{node.name}</span>
          <GapBadge flag={node.gapFlag} />
        </div>
        <div className="text-right tnum text-muted-foreground">{fmt(node.actuals2425)}</div>
        <div className="text-right tnum text-muted-foreground">{fmt(node.be2526)}</div>
        <div className="text-right tnum text-muted-foreground">{fmt(node.re2526)}</div>
        <div className="text-right tnum font-semibold">{fmt(node.be2627)}</div>
        <div className="text-right"><YoY v={yoy} /></div>
      </div>
      {open && node.children && node.children.map((c) => (
        <DDGTreeNode key={c.fullCode} node={c} depth={depth + 1} defaultExpandLevel={defaultExpandLevel} hideTokens={hideTokens} search={search} />
      ))}
    </div>
  );
}
