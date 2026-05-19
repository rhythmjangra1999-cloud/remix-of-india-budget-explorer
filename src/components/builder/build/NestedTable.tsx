import { useState } from "react";
import { ChevronDown, ChevronRight, FileText, AlertTriangle } from "lucide-react";
import { formatAmount, fmtPctChange, yoy, PREV_YEAR, type Currency, type Scale } from "@/lib/report";
import { type YearKey } from "@/lib/dg";
import { type DDGLeaf } from "@/lib/ddg";
import { canonicalObjectHead, MAJOR_HEAD_NAME } from "@/lib/lmmh";

export interface TreeNode {
  key: string;
  label: string;
  sublabel?: string;
  values: Partial<Record<YearKey, number>>;
  children?: TreeNode[];
  rawRows?: DDGLeaf[];
  path: string;
}

const RAW_ROW_LIMIT = 200;

interface Props {
  rows: TreeNode[];
  yearsShown: YearKey[];
  primaryYear: YearKey;
  groupingLabels: string[];
  showShareColumn?: boolean;
  currency?: Currency;
  rate?: number;
  scale?: Scale;
}

export default function NestedTable({ rows, yearsShown, primaryYear, groupingLabels, showShareColumn = true, currency = "INR", rate, scale = "smart" }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(path: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  const grandTotal = rows.reduce((s, r) => s + (r.values[primaryYear] ?? 0), 0);
  const prevY = PREV_YEAR[primaryYear];
  const fmt = (v: number | null | undefined) => formatAmount(v, currency, rate, scale);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left">{groupingLabels.join(" → ")}</th>
            {yearsShown.map(y => (
              <th key={y} className="px-3 py-2 text-right">
                <div>{YEAR_HEAD(y)}</div>
                {PREV_YEAR[y] && <div className="text-[9px] font-normal normal-case text-muted-foreground/70">value · Δ vs prev</div>}
              </th>
            ))}
            {showShareColumn && <th className="px-3 py-2 text-right">% of view</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <RowSubtree
              key={row.key}
              node={row}
              depth={0}
              expanded={expanded}
              onToggle={toggle}
              yearsShown={yearsShown}
              primaryYear={primaryYear}
              grandTotal={grandTotal}
              showShareColumn={showShareColumn}
              fmt={fmt}
            />
          ))}
          <tr className="border-t-2 border-border bg-muted/40 font-semibold">
            <td className="px-3 py-2">Total</td>
            {yearsShown.map(y => {
              const t = rows.reduce((s, r) => s + (r.values[y] ?? 0), 0);
              const prevY = PREV_YEAR[y];
              const prevT = prevY ? rows.reduce((s, r) => s + (r.values[prevY] ?? 0), 0) : null;
              const ch = prevY ? yoy(t, prevT) : null;
              return <ValueCell key={y} value={t} change={ch} fmt={fmt} bold />;
            })}
            {showShareColumn && <td className="px-3 py-2 text-right tabular-nums">100%</td>}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

type Fmt = (v: number | null | undefined) => string;

function ValueCell({ value, change, fmt, bold }: { value: number | null; change: number | null; fmt: Fmt; bold?: boolean }) {
  const cls = (change ?? 0) > 0 ? "text-emerald-600" : (change ?? 0) < 0 ? "text-destructive" : "text-muted-foreground";
  return (
    <td className="px-3 py-1.5 text-right tabular-nums">
      <div className={bold ? "font-semibold" : ""}>{fmt(value ?? 0)}</div>
      {change != null && <div className={`text-[10px] ${cls}`}>{fmtPctChange(change)}</div>}
    </td>
  );
}

function RowSubtree({ node, depth, expanded, onToggle, yearsShown, primaryYear, grandTotal, showShareColumn, fmt }: {
  node: TreeNode; depth: number; expanded: Set<string>; onToggle: (path: string) => void;
  yearsShown: YearKey[]; primaryYear: YearKey; grandTotal: number; showShareColumn: boolean;
  fmt: Fmt;
}) {
  const isOpen = expanded.has(node.path);
  const hasChildren = !!node.children?.length;
  const hasRawRows  = !!node.rawRows?.length;
  const canExpand   = hasChildren || hasRawRows;
  const v = node.values[primaryYear] ?? 0;
  const share = grandTotal ? (v / grandTotal) * 100 : null;

  return (
    <>
      <tr className="border-t border-border hover:bg-muted/15">
        <td className="px-3 py-1.5">
          <div className="flex items-center" style={{ paddingLeft: `${depth * 18}px` }}>
            {canExpand ? (
              <button onClick={() => onToggle(node.path)} className="text-muted-foreground hover:text-foreground p-0.5 mr-1">
                {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : <span className="w-5 inline-block" />}
            <div className="min-w-0 flex-1">
              <div className="truncate">{node.label}</div>
              {node.sublabel && <div className="text-[10px] text-muted-foreground">{node.sublabel}</div>}
            </div>
            {hasRawRows && !hasChildren && (
              <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                {node.rawRows!.length} line{node.rawRows!.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </td>
        {yearsShown.map(y => {
          const val = node.values[y] ?? 0;
          const prevYear = PREV_YEAR[y];
          const prevVal = prevYear ? node.values[prevYear] ?? null : null;
          const change = prevYear ? yoy(val, prevVal) : null;
          return <ValueCell key={y} value={val} change={change} fmt={fmt} />;
        })}
        {showShareColumn && (
          <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
            {share == null ? "—" : `${share.toFixed(2)}%`}
          </td>
        )}
      </tr>
      {isOpen && hasChildren && node.children!.map(c => (
        <RowSubtree key={c.key} node={c} depth={depth + 1} expanded={expanded} onToggle={onToggle}
          yearsShown={yearsShown} primaryYear={primaryYear} grandTotal={grandTotal}
          showShareColumn={showShareColumn} fmt={fmt} />
      ))}
      {isOpen && !hasChildren && hasRawRows && (
        <RawRowsBlock rows={node.rawRows!} depth={depth + 1} yearsShown={yearsShown}
          primaryYear={primaryYear} showShareColumn={showShareColumn} fmt={fmt} />
      )}
    </>
  );
}

function RawRowsBlock({ rows, depth, yearsShown, primaryYear, showShareColumn, fmt }: {
  rows: DDGLeaf[]; depth: number; yearsShown: YearKey[]; primaryYear: YearKey; showShareColumn: boolean; fmt: Fmt;
}) {
  const sorted = [...rows].sort((a, b) => (b[primaryYear] ?? 0) - (a[primaryYear] ?? 0));
  const shown = sorted.slice(0, RAW_ROW_LIMIT);
  const truncated = sorted.length - shown.length;

  const colSpan = yearsShown.length + (showShareColumn ? 2 : 1);
  return (
    <>
      <tr className="bg-muted/10 border-t border-border">
        <td colSpan={colSpan} className="px-3 py-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground" style={{ paddingLeft: `${depth * 18}px` }}>
            <FileText className="h-3 w-3" />
            <span className="uppercase tracking-wide font-medium">Underlying budget lines · {sorted.length} record{sorted.length === 1 ? "" : "s"}{truncated > 0 ? ` · showing top ${RAW_ROW_LIMIT}` : ""}</span>
          </div>
        </td>
      </tr>
      {shown.map(r => (
        <RawRow key={r.id + "|" + r.demandNo} r={r} depth={depth} yearsShown={yearsShown}
          primaryYear={primaryYear} showShareColumn={showShareColumn} fmt={fmt} />
      ))}
      {truncated > 0 && (
        <tr className="bg-muted/5">
          <td colSpan={colSpan} className="px-3 py-1.5 italic text-[11px] text-muted-foreground"
            style={{ paddingLeft: `${(depth + 1) * 18}px` }}>
            + {truncated.toLocaleString()} more line item{truncated === 1 ? "" : "s"} — refine filters or add a deeper breakdown
          </td>
        </tr>
      )}
    </>
  );
}

function RawRow({ r, depth, yearsShown, showShareColumn, fmt }: {
  r: DDGLeaf; depth: number; yearsShown: YearKey[]; primaryYear: YearKey; showShareColumn: boolean; fmt: Fmt;
}) {
  const mhName = MAJOR_HEAD_NAME[r.majorHead] ?? r.majorHeadName;
  const oh = canonicalObjectHead(r.objectHead, r.objectHeadName);
  const fullCode = `${r.majorHead}-${(r.subMajor || "00").padStart(2,"0")}-${r.minorHead}-${(r.subHead || "").padStart(2,"0")}-${(r.detailedHead || "").padStart(2,"0")}-${oh.code}`;
  const primary = r.subHeadName || r.minorHeadName || mhName || "(unnamed)";

  return (
    <tr className="border-t border-border hover:bg-muted/10 bg-muted/[0.02]">
      <td className="px-3 py-1.5">
        <div style={{ paddingLeft: `${depth * 18 + 18}px` }}>
          <div className="text-[13px] flex items-center gap-2">
            <span>{primary}</span>
            {r.gapFlag && <GapBadge flag={r.gapFlag} reason={r.gapReason} />}
          </div>
          <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
            <span title="Major Head"><span className="text-foreground/70">{mhName}</span> ({r.majorHead})</span>
            {r.minorHeadName && r.minorHeadName !== primary && (
              <span title="Minor Head">· {r.minorHeadName} ({r.minorHead})</span>
            )}
            <span title="Object Head">· spent on: <span className="text-foreground/70">{oh.name}</span> ({oh.code})</span>
            <span title="Section">· {r.section}</span>
            <span title="Full canonical code" className="font-mono">· {fullCode}</span>
          </div>
        </div>
      </td>
      {yearsShown.map(y => {
        const val = r[y] ?? 0;
        const prevYear = PREV_YEAR[y];
        const prevVal = prevYear ? r[prevYear] ?? null : null;
        const change = prevYear ? yoy(val, prevVal) : null;
        return <ValueCell key={y} value={val} change={change} fmt={fmt} />;
      })}
      {showShareColumn && <td className="px-3 py-1.5"></td>}
    </tr>
  );
}

function GapBadge({ flag, reason }: { flag: string; reason?: string | null }) {
  const c =
    flag === "DISCONTINUED" ? "bg-destructive/10 text-destructive border-destructive/30" :
    flag === "NEW"          ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300" :
    flag === "TOKEN"        ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300" :
                              "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400";
  return (
    <span title={reason ?? flag} className={`inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wide px-1.5 py-[1px] rounded border ${c}`}>
      <AlertTriangle className="h-2.5 w-2.5" />
      {flag.toLowerCase().replace("_", " ")}
    </span>
  );
}

const YEAR_HEAD = (y: YearKey) => ({
  actuals2425: "Spent 24-25",
  be2526:      "Planned 25-26",
  re2526:      "Revised 25-26",
  be2627:      "Planned 26-27",
})[y];
