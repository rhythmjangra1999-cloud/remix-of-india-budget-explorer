import React, { useMemo, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Download, Search, ChevronRight, ChevronLeft, ChevronDown, ArrowLeft, ArrowUp, ArrowDown } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SchemeTableView } from "@/components/explorer/SchemeTableView";
import { MinorHeadInline } from "@/components/explorer/ddg/MinorHeadInline";
import { DDGSheet } from "@/components/explorer/ddg/DDGSheet";
import { hasDDG } from "@/lib/ddg";
import {
  DG_META, DG_SUMMARY, getMinistries, getDemandsForMinistry, getDemand,
  getMajorHeads, getValue, getMinistryTotal, computeYoY, formatCrore,
  getMHStatus, YEAR_LABELS,
  type YearKey, type Section, type DemandSummary, type MajorHeadRow,
} from "@/lib/dg";

// ── YoY pill ────────────────────────────────────────────────────────────────
function YoYPill({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">—</span>;
  const pos = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${pos ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
      {pos ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

// ── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: ReturnType<typeof getMHStatus> }) {
  if (!status) return null;
  const styles = {
    DISCONTINUED: "bg-rose-50 text-rose-700",
    SMALL_BASE:   "bg-amber-50 text-amber-700",
    NEW:          "bg-blue-50 text-blue-700",
  };
  return <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${styles[status]}`}>{status.replace("_", " ")}</span>;
}

// ── Mini 4-bar chart ─────────────────────────────────────────────────────────
function MiniBarChart({ demand, section }: { demand: DemandSummary; section: Section }) {
  const years: YearKey[] = ["actuals2425", "be2526", "re2526", "be2627"];
  const values = years.map((y) => getValue(demand, y, section));
  const max = Math.max(...values, 1);
  const colors = ["bg-slate-300", "bg-slate-400", "bg-slate-400", "bg-primary"];
  return (
    <div className="flex items-end gap-3 h-20">
      {years.map((y, i) => {
        const v = values[i];
        const h = Math.max(4, (v / max) * 72);
        return (
          <div key={y} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] text-muted-foreground tnum">{formatCrore(v, true)}</span>
            <div className={`w-full rounded-t-sm ${colors[i]}`} style={{ height: h }} />
            <span className="text-[9px] text-muted-foreground text-center leading-tight">{YEAR_LABELS[y].replace(" ", "\n")}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Sortable th helper ────────────────────────────────────────────────────────
function SortTh<K extends string>({
  label, k, sortKey, sortDir, onSort, right,
}: { label: string; k: K; sortKey: K; sortDir: "asc" | "desc"; onSort: (k: K) => void; right?: boolean }) {
  return (
    <th
      className={`px-3 py-2.5 font-medium cursor-pointer select-none hover:text-foreground whitespace-nowrap ${right ? "text-right" : "text-left"}`}
      onClick={() => onSort(k)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k && (sortDir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
      </span>
    </th>
  );
}

// ── Major heads table (Section · Code · Name · 4 yrs · YoY) ──────────────────
type MHSort = "section" | "mhCode" | "mhName" | "actuals2425" | "be2526" | "re2526" | "be2627" | "yoy";

function sectionRank(s: string): number {
  const v = (s || "").toLowerCase();
  if (v.startsWith("rev")) return 0;
  if (v.startsWith("cap")) return 1;
  return 2;
}

function sumField(rows: MajorHeadRow[], key: "actuals2425" | "be2526" | "re2526" | "be2627"): number | null {
  const vals = rows.map(r => r[key]).filter((v): v is number => typeof v === "number");
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0);
}

interface MHTableProps {
  rows: MajorHeadRow[];
  demandNo?: number;
  ministry?: string;
  demandDesc?: string;
}

function MajorHeadTable({ rows, demandNo, ministry, demandDesc }: MHTableProps) {
  const [sortKey, setSortKey] = useState<MHSort>("section");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [sheetMH, setSheetMH] = useState<MajorHeadRow | null>(null);
  const toggleExpand = (key: string) =>
    setExpanded((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

  const filtered = useMemo(() => {
    if (!filter.trim()) return rows;
    const lf = filter.toLowerCase();
    return rows.filter((r) => r.mhName.toLowerCase().includes(lf) || r.mhCode.includes(lf) || r.section.toLowerCase().includes(lf));
  }, [rows, filter]);

  // Group by section, sort within
  const grouped = useMemo(() => {
    const sorter = (a: MajorHeadRow, b: MajorHeadRow) => {
      let av: string | number = 0, bv: string | number = 0;
      if (sortKey === "section") { av = sectionRank(a.section); bv = sectionRank(b.section); }
      else if (sortKey === "mhCode") { av = a.mhCode; bv = b.mhCode; }
      else if (sortKey === "mhName") { av = a.mhName; bv = b.mhName; }
      else if (sortKey === "yoy")  {
        av = computeYoY(a.be2627, a.be2526) ?? -Infinity;
        bv = computeYoY(b.be2627, b.be2526) ?? -Infinity;
      }
      else { av = a[sortKey] ?? -Infinity; bv = b[sortKey] ?? -Infinity; }
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    };

    // Always group by section first (Revenue → Capital → Other), then apply chosen sort within
    const buckets = new Map<string, MajorHeadRow[]>();
    filtered.forEach(r => {
      const key = r.section || "Other";
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(r);
    });
    const sectionsOrdered = [...buckets.keys()].sort((a, b) => sectionRank(a) - sectionRank(b));
    return sectionsOrdered.map(sec => ({
      section: sec,
      rows: [...buckets.get(sec)!].sort(sorter),
      subtotal: {
        actuals2425: sumField(buckets.get(sec)!, "actuals2425"),
        be2526:      sumField(buckets.get(sec)!, "be2526"),
        re2526:      sumField(buckets.get(sec)!, "re2526"),
        be2627:      sumField(buckets.get(sec)!, "be2627"),
      },
    }));
  }, [filtered, sortKey, sortDir]);

  const grand = useMemo(() => ({
    actuals2425: sumField(filtered, "actuals2425"),
    be2526:      sumField(filtered, "be2526"),
    re2526:      sumField(filtered, "re2526"),
    be2627:      sumField(filtered, "be2627"),
  }), [filtered]);

  const toggleSort = (k: MHSort) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "section" || k === "mhCode" || k === "mhName" ? "asc" : "desc"); }
  };

  const exportCsv = () => {
    const hdr = "Section,Code,Major Head,Actuals 24-25,BE 25-26,RE 25-26,BE 26-27,YoY%\n";
    const lines: string[] = [];
    grouped.forEach(g => {
      g.rows.forEach(r => {
        const yoy = computeYoY(r.be2627, r.be2526);
        lines.push(`"${r.section}","${r.mhCode}","${r.mhName}",${r.actuals2425 ?? ""},${r.be2526 ?? ""},${r.re2526 ?? ""},${r.be2627 ?? ""},${yoy !== null ? yoy.toFixed(1) + "%" : ""}`);
      });
      const sy = computeYoY(g.subtotal.be2627, g.subtotal.be2526);
      lines.push(`"${g.section}","TOTAL","Total - ${g.section}",${g.subtotal.actuals2425 ?? ""},${g.subtotal.be2526 ?? ""},${g.subtotal.re2526 ?? ""},${g.subtotal.be2627 ?? ""},${sy !== null ? sy.toFixed(1) + "%" : ""}`);
    });
    const gy = computeYoY(grand.be2627, grand.be2526);
    lines.push(`"Total","TOTAL","Grand Total",${grand.actuals2425 ?? ""},${grand.be2526 ?? ""},${grand.re2526 ?? ""},${grand.be2627 ?? ""},${gy !== null ? gy.toFixed(1) + "%" : ""}`);
    const blob = new Blob([hdr + lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "major-heads.csv"; a.click();
  };

  const fmt = (v: number | null) => v !== null ? v.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter heads…" className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-background" />
        </div>
        <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted transition-colors">
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
        <span className="text-xs text-muted-foreground">{filtered.length} heads</span>
      </div>
      <div className="rounded-md border border-border overflow-hidden">
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-muted-foreground sticky top-0 z-10 text-[11px] uppercase tracking-wide">
              <tr>
                {demandNo !== undefined && <th className="w-6"></th>}
                <SortTh label="Section"      k="section"     sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortTh label="Code"         k="mhCode"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortTh label="Major Head"   k="mhName"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortTh label="Actuals 24-25" k="actuals2425" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} right />
                <SortTh label="BE 25-26"     k="be2526"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} right />
                <SortTh label="RE 25-26"     k="re2526"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} right />
                <SortTh label="BE 26-27"     k="be2627"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} right />
                <SortTh label="YoY %"        k="yoy"         sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} right />
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {grouped.map((g) => {
                const subYoY = computeYoY(g.subtotal.be2627, g.subtotal.be2526);
                return (
                  <React.Fragment key={g.section}>
                    {g.rows.map((r, i) => {
                      const yoy = computeYoY(r.be2627, r.be2526);
                      const status = getMHStatus(r);
                      const rowKey = `${g.section}-${r.mhCode}-${i}`;
                      const drillable = demandNo !== undefined && hasDDG(demandNo, r.mhCode);
                      const isOpen = expanded.has(rowKey);
                      const colSpan = (demandNo !== undefined ? 10 : 9);
                      return (
                        <React.Fragment key={rowKey}>
                          <tr className="hover:bg-muted/30 transition-colors">
                            {demandNo !== undefined && (
                              <td className="px-1 py-2 text-center">
                                {drillable ? (
                                  <button
                                    onClick={() => toggleExpand(rowKey)}
                                    className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                    aria-label={isOpen ? "Collapse" : "Expand"}
                                  >
                                    {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                  </button>
                                ) : (
                                  <span title="Detailed DG not yet parsed" className="text-muted-foreground/40 text-[10px]">·</span>
                                )}
                              </td>
                            )}
                            <td className="px-3 py-2 text-muted-foreground capitalize">{r.section}</td>
                            <td className="px-3 py-2 font-mono text-muted-foreground">{r.mhCode}</td>
                            <td className="px-3 py-2 font-medium max-w-[260px] truncate" title={r.mhName}>
                              {drillable ? (
                                <button onClick={() => setSheetMH(r)} className="hover:text-primary hover:underline text-left">
                                  {r.mhName}
                                </button>
                              ) : r.mhName}
                            </td>
                            <td className="px-3 py-2 text-right tnum">{fmt(r.actuals2425)}</td>
                            <td className="px-3 py-2 text-right tnum">{fmt(r.be2526)}</td>
                            <td className="px-3 py-2 text-right tnum">{fmt(r.re2526)}</td>
                            <td className="px-3 py-2 text-right tnum font-semibold">{fmt(r.be2627)}</td>
                            <td className="px-3 py-2 text-right"><YoYPill value={yoy} /></td>
                            <td className="px-3 py-2"><StatusPill status={status} /></td>
                          </tr>
                          {isOpen && demandNo !== undefined && drillable && (
                            <tr>
                              <td colSpan={colSpan} className="p-0">
                                <MinorHeadInline
                                  demandNo={demandNo}
                                  majorHead={r.mhCode}
                                  majorHeadName={r.mhName}
                                  onOpenSheet={() => setSheetMH(r)}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {/* Section subtotal */}
                    <tr className="bg-primary/5 border-t-2 border-primary/20 font-semibold">
                      {demandNo !== undefined && <td></td>}
                      <td className="px-3 py-2 capitalize">{g.section}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">TOTAL</td>
                      <td className="px-3 py-2">Total — {g.section}</td>
                      <td className="px-3 py-2 text-right tnum">{fmt(g.subtotal.actuals2425)}</td>
                      <td className="px-3 py-2 text-right tnum">{fmt(g.subtotal.be2526)}</td>
                      <td className="px-3 py-2 text-right tnum">{fmt(g.subtotal.re2526)}</td>
                      <td className="px-3 py-2 text-right tnum">{fmt(g.subtotal.be2627)}</td>
                      <td className="px-3 py-2 text-right"><YoYPill value={subYoY} /></td>
                      <td className="px-3 py-2"></td>
                    </tr>
                  </React.Fragment>
                );
              })}
              {/* Grand total */}
              {grouped.length > 0 && (
                <tr className="bg-foreground text-background font-bold border-t-2 border-foreground">
                  {demandNo !== undefined && <td></td>}
                  <td className="px-3 py-2.5">Total</td>
                  <td className="px-3 py-2.5 font-mono">TOTAL</td>
                  <td className="px-3 py-2.5">Grand Total</td>
                  <td className="px-3 py-2.5 text-right tnum">{fmt(grand.actuals2425)}</td>
                  <td className="px-3 py-2.5 text-right tnum">{fmt(grand.be2526)}</td>
                  <td className="px-3 py-2.5 text-right tnum">{fmt(grand.re2526)}</td>
                  <td className="px-3 py-2.5 text-right tnum">{fmt(grand.be2627)}</td>
                  <td className="px-3 py-2.5 text-right tnum">
                    {(() => {
                      const gy = computeYoY(grand.be2627, grand.be2526);
                      return gy !== null ? `${gy >= 0 ? "+" : ""}${gy.toFixed(1)}%` : "—";
                    })()}
                  </td>
                  <td className="px-3 py-2.5"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {sheetMH && demandNo !== undefined && (
        <DDGSheet
          open={!!sheetMH}
          onClose={() => setSheetMH(null)}
          demandNo={demandNo}
          majorHead={sheetMH.mhCode}
          majorHeadName={sheetMH.mhName}
          ministry={ministry ?? sheetMH.ministry}
          demandDesc={demandDesc ?? sheetMH.demandDesc}
        />
      )}
    </div>
  );
}




// ── All-demands overview table ───────────────────────────────────────────────
type OvSort = "demandNo" | "actuals2425" | "be2526" | "re2526" | "be2627" | "yoy";

const OV_PRESETS: { label: string; k: OvSort; dir: "asc" | "desc" }[] = [
  { label: "Demand No.",  k: "demandNo", dir: "asc"  },
  { label: "Demand Size", k: "be2627",   dir: "desc" },
  { label: "YoY %",       k: "yoy",      dir: "desc" },
];

function AllDemandsOverview({ section, onSelect }: { section: Section; onSelect: (n: number) => void }) {
  const [sortKey, setSortKey] = useState<OvSort>("demandNo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const rows = useMemo(() => {
    return [...DG_SUMMARY].sort((a, b) => {
      if (sortKey === "demandNo") return sortDir === "asc" ? a.demandNo - b.demandNo : b.demandNo - a.demandNo;
      if (sortKey === "yoy") {
        const ay = computeYoY(getValue(a, "be2627", section), getValue(a, "be2526", section)) ?? -Infinity;
        const by = computeYoY(getValue(b, "be2627", section), getValue(b, "be2526", section)) ?? -Infinity;
        return sortDir === "asc" ? ay - by : by - ay;
      }
      const av = getValue(a, sortKey as YearKey, section);
      const bv = getValue(b, sortKey as YearKey, section);
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [section, sortKey, sortDir]);

  const toggleSort = (k: OvSort) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "demandNo" ? "asc" : "desc"); }
  };

  const exportCsv = () => {
    const hdr = "No.,Ministry,Demand,Actuals 24-25,BE 25-26,RE 25-26,BE 26-27,YoY%\n";
    const body = rows.map((d) => {
      const yoy = computeYoY(getValue(d, "be2627", section), getValue(d, "be2526", section));
      return `${d.demandNo},"${d.ministry}","${d.demandDesc}",${getValue(d, "actuals2425", section)},${getValue(d, "be2526", section)},${getValue(d, "re2526", section)},${getValue(d, "be2627", section)},${yoy !== null ? yoy.toFixed(1) + "%" : ""}`;
    }).join("\n");
    const blob = new Blob([hdr + body], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "all-demands.csv"; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-serif font-semibold">All Demands · {section.charAt(0).toUpperCase() + section.slice(1)}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Click any row to see the Major Head breakdown. Click column headers to sort ↑↓.</p>
        </div>
        <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted transition-colors flex-shrink-0">
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
      </div>

      {/* Sort-filter pills */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sort by</span>
        {OV_PRESETS.map(p => {
          const active = sortKey === p.k;
          return (
            <button
              key={p.k}
              onClick={() => {
                if (active) {
                  setSortDir(d => d === "asc" ? "desc" : "asc");
                } else {
                  setSortKey(p.k);
                  setSortDir(p.dir);
                }
              }}
              className={`inline-flex items-center gap-1 rounded-sm px-3 py-1 text-xs font-medium border transition-colors ${
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {p.label}
              {active && (sortDir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
            </button>
          );
        })}
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <div className="max-h-[calc(100vh-260px)] overflow-y-auto overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-[11px] uppercase tracking-wide sticky top-0 z-10">
              <tr>
                <SortTh label="No."           k="demandNo"   sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-3 py-2.5 text-left font-medium">Ministry · Demand</th>
                <SortTh label="Actuals 24-25" k="actuals2425" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} right />
                <SortTh label="BE 25-26"      k="be2526"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} right />
                <SortTh label="RE 25-26"      k="re2526"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} right />
                <SortTh label="BE 26-27 ★"   k="be2627"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} right />
                <SortTh label="YoY"           k="yoy"         sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} right />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((d) => {
                const yoy = computeYoY(getValue(d, "be2627", section), getValue(d, "be2526", section));
                return (
                  <tr key={d.demandNo} onClick={() => onSelect(d.demandNo)} className="cursor-pointer hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground w-10">{d.demandNo}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-sm leading-snug">{d.demandDesc}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{d.ministry}</div>
                    </td>
                    <td className="px-3 py-3 text-right tnum text-muted-foreground">{formatCrore(getValue(d, "actuals2425", section), true)}</td>
                    <td className="px-3 py-3 text-right tnum text-muted-foreground">{formatCrore(getValue(d, "be2526", section), true)}</td>
                    <td className="px-3 py-3 text-right tnum text-muted-foreground">{formatCrore(getValue(d, "re2526", section), true)}</td>
                    <td className="px-3 py-3 text-right tnum font-semibold">{formatCrore(getValue(d, "be2627", section), true)}</td>
                    <td className="px-3 py-3 text-right"><YoYPill value={yoy} /></td>
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

// ── Demand detail panel ──────────────────────────────────────────────────────
function DemandSummaryCard({
  label, demand, section, accent,
}: { label: string; demand: DemandSummary; section: Section; accent?: boolean }) {
  const v = getValue(demand, "be2627", section);
  const prev = getValue(demand, "be2526", section);
  const yoy = computeYoY(v, prev);
  return (
    <div className={`rounded-md border p-4 ${accent ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={`font-serif text-2xl font-bold tnum ${accent ? "text-primary" : ""}`}>{formatCrore(v, true)}</span>
        <YoYPill value={yoy} />
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground tnum">
        BE 25-26: {formatCrore(prev, true)} · RE 25-26: {formatCrore(getValue(demand, "re2526", section), true)}
      </div>
    </div>
  );
}

function DemandDetail({ demandNo, section }: { demandNo: number; section: Section }) {
  const demand = getDemand(demandNo);
  if (!demand) return <div className="p-8 text-muted-foreground">Demand not found.</div>;

  const mhRows = getMajorHeads(demandNo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs text-muted-foreground">Demand No. {demand.demandNo} · {demand.ministry}</div>
        <h2 className="mt-1 font-serif text-2xl font-semibold leading-tight">{demand.demandDesc}</h2>
        <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          BE 2026-27 · current view: {section}
        </div>
      </div>

      {/* Section totals — Revenue · Capital · Overall */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DemandSummaryCard label="Total Revenue" demand={demand} section="revenue" accent={section === "revenue"} />
        <DemandSummaryCard label="Total Capital" demand={demand} section="capital" accent={section === "capital"} />
        <DemandSummaryCard label="Overall Total" demand={demand} section="total"   accent={section === "total"} />
      </div>

      {/* Major heads table (all heads under this demand) */}
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
          All Major Heads · {mhRows.length} heads under this demand · figures ₹ Cr · click column to sort
        </div>
        {mhRows.length > 0
          ? <MajorHeadTable rows={mhRows} />
          : <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Major head detail not yet available for this demand.
            </div>
        }
      </div>
    </div>
  );
}

// ── Ministry detail panel ────────────────────────────────────────────────────
type MDSort = "demandNo" | "actuals2425" | "be2526" | "re2526" | "be2627" | "yoy";

// Quick-sort presets shown as filter pills on the ministry landing
const MD_PRESETS: { label: string; k: MDSort; dir: "asc" | "desc" }[] = [
  { label: "Demand No.",   k: "demandNo", dir: "asc"  },
  { label: "Demand Size",  k: "be2627",   dir: "desc" },
  { label: "YoY %",        k: "yoy",      dir: "desc" },
];

function MinistryDetail({ ministry, section, onSelectDemand }: { ministry: string; section: Section; onSelectDemand: (n: number) => void }) {
  const [sortKey, setSortKey] = useState<MDSort>("be2627");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const demands = useMemo(() => getDemandsForMinistry(ministry), [ministry]);
  const total = getMinistryTotal(ministry, "be2627", section);
  const prevTotal = getMinistryTotal(ministry, "be2526", section);
  const yoy = computeYoY(total, prevTotal);

  const sorted = useMemo(() => {
    return [...demands].sort((a, b) => {
      if (sortKey === "demandNo") return sortDir === "asc" ? a.demandNo - b.demandNo : b.demandNo - a.demandNo;
      if (sortKey === "yoy") {
        const ay = computeYoY(getValue(a, "be2627", section), getValue(a, "be2526", section)) ?? -Infinity;
        const by = computeYoY(getValue(b, "be2627", section), getValue(b, "be2526", section)) ?? -Infinity;
        return sortDir === "asc" ? ay - by : by - ay;
      }
      const av = getValue(a, sortKey as YearKey, section);
      const bv = getValue(b, sortKey as YearKey, section);
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [demands, section, sortKey, sortDir]);

  const toggleSort = (k: MDSort) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "demandNo" ? "asc" : "desc"); }
  };

  const exportCsv = () => {
    const hdr = "D.No,Department,Actuals 24-25,BE 25-26,RE 25-26,BE 26-27,YoY%\n";
    const body = sorted.map((d) => {
      const y = computeYoY(getValue(d, "be2627", section), getValue(d, "be2526", section));
      return `${d.demandNo},"${d.demandDesc}",${getValue(d, "actuals2425", section)},${getValue(d, "be2526", section)},${getValue(d, "re2526", section)},${getValue(d, "be2627", section)},${y !== null ? y.toFixed(1) + "%" : ""}`;
    }).join("\n");
    const blob = new Blob([hdr + body], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${ministry.replace(/\s+/g, "-")}.csv`; a.click();
  };

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">BE 2026-27 · {section}</div>
          <h2 className="mt-1 font-serif text-2xl font-semibold">{ministry}</h2>
          <div className="mt-2 flex items-center gap-3">
            <span className="font-serif text-3xl font-bold tnum text-primary">{formatCrore(total, true)}</span>
            <YoYPill value={yoy} />
          </div>
        </div>
        <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted transition-colors flex-shrink-0">
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
      </div>

      {/* Sort-filter pills */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sort by</span>
        {MD_PRESETS.map(p => {
          const active = sortKey === p.k;
          return (
            <button
              key={p.k}
              onClick={() => {
                if (active) {
                  setSortDir(d => d === "asc" ? "desc" : "asc");
                } else {
                  setSortKey(p.k);
                  setSortDir(p.dir);
                }
              }}
              className={`inline-flex items-center gap-1 rounded-sm px-3 py-1 text-xs font-medium border transition-colors ${
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {p.label}
              {active && (sortDir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
            </button>
          );
        })}
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-[11px] uppercase tracking-wide sticky top-0 z-10">
              <tr>
                <SortTh label="D.No"          k="demandNo"   sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-3 py-2.5 text-left font-medium">Department</th>
                <SortTh label="Actuals 24-25" k="actuals2425" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} right />
                <SortTh label="BE 25-26"      k="be2526"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} right />
                <SortTh label="RE 25-26"      k="re2526"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} right />
                <SortTh label="BE 26-27 ★"   k="be2627"      sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} right />
                <SortTh label="YoY"           k="yoy"         sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} right />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((d) => {
                const yoyV = computeYoY(getValue(d, "be2627", section), getValue(d, "be2526", section));
                return (
                  <tr key={d.demandNo} onClick={() => onSelectDemand(d.demandNo)} className="cursor-pointer hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{d.demandNo}</td>
                    <td className="px-3 py-2.5 font-medium">{d.demandDesc}</td>
                    <td className="px-3 py-2.5 text-right tnum text-muted-foreground">{formatCrore(getValue(d, "actuals2425", section), true)}</td>
                    <td className="px-3 py-2.5 text-right tnum text-muted-foreground">{formatCrore(getValue(d, "be2526", section), true)}</td>
                    <td className="px-3 py-2.5 text-right tnum text-muted-foreground">{formatCrore(getValue(d, "re2526", section), true)}</td>
                    <td className="px-3 py-2.5 text-right tnum font-semibold">{formatCrore(getValue(d, "be2627", section), true)}</td>
                    <td className="px-3 py-2.5 text-right"><YoYPill value={yoyV} /></td>
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

// ── Main Explorer ────────────────────────────────────────────────────────────
const SECTIONS: Section[] = ["revenue", "capital", "total"];

type SelectionType = "none" | "ministry" | "demand";
interface Selection { type: SelectionType; value: string | number }

export default function Explorer() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const view = params.get("view") ?? "explorer";

  // Controls
  const [section, setSection] = useState<Section>((params.get("section") as Section) ?? "total");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Selection
  const initDemand = params.get("demand") ? parseInt(params.get("demand")!) : null;
  const initMinistry = params.get("ministry") ?? null;
  const [selection, setSelection] = useState<Selection>(
    initDemand ? { type: "demand", value: initDemand } :
    initMinistry ? { type: "ministry", value: initMinistry } :
    { type: "none", value: "" }
  );

  // Expand/collapse ministry tree
  const ministries = useMemo(() => getMinistries(), []);
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (initMinistry) s.add(initMinistry);
    if (initDemand) {
      const d = getDemand(initDemand);
      if (d) s.add(d.ministry);
    }
    return s;
  });

  const toggleMinistry = (m: string) =>
    setExpanded(prev => { const s = new Set(prev); s.has(m) ? s.delete(m) : s.add(m); return s; });

  const selectMinistry = (m: string) => {
    setSelection({ type: "ministry", value: m });
    setParams(p => { const n = new URLSearchParams(p); n.set("ministry", m); n.delete("demand"); return n; }, { replace: true });
  };

  const selectDemand = useCallback((no: number) => {
    const d = getDemand(no);
    if (d) setExpanded(prev => { const s = new Set(prev); s.add(d.ministry); return s; });
    setSelection({ type: "demand", value: no });
    setParams(p => { const n = new URLSearchParams(p); n.set("demand", String(no)); n.delete("ministry"); return n; }, { replace: true });
  }, [setParams]);

  // Filtered demand tree
  const filteredTree = useMemo(() => {
    const lq = q.trim().toLowerCase();
    return ministries.map(m => {
      const demands = getDemandsForMinistry(m).filter(d =>
        !lq || d.demandDesc.toLowerCase().includes(lq) || d.ministry.toLowerCase().includes(lq) || String(d.demandNo).includes(lq)
      ).sort((a, b) => a.demandNo - b.demandNo);
      return { ministry: m, demands };
    }).filter(m => m.demands.length > 0);
  }, [ministries, q]);

  if (view === "schemes") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1">
          <section className="border-b border-border">
            <div className="container py-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <button onClick={() => navigate("/")} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
                </button>
                <div className="text-xs uppercase tracking-[0.16em] text-primary font-medium">Explorer — Schemes</div>
                <h1 className="mt-2 font-serif text-3xl md:text-4xl font-semibold leading-tight">Government of India Schemes</h1>
                <p className="mt-2 text-sm text-muted-foreground">448 schemes · Central &amp; Centrally Sponsored</p>
              </div>
            </div>
          </section>
          <section className="container py-8"><SchemeTableView fy="FY27" /></section>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">

        {/* Headline strip */}
        <div className="border-b border-border bg-muted/30">
          <div className="container py-3 flex flex-wrap items-center gap-x-8 gap-y-1 text-sm">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1.5">NET BE 2026-27</span>
              <span className="font-serif font-bold text-lg tnum">{formatCrore(DG_META.netBe2627Cr, true)}</span>
            </div>
            <div className="text-muted-foreground">·</div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1.5">DEMANDS</span>
              <span className="font-mono font-semibold">102</span>
            </div>
            <div className="text-muted-foreground">·</div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1.5">MAJOR HEADS TRACKED</span>
              <span className="font-mono font-semibold">1,101</span>
            </div>
            <div className="text-muted-foreground">·</div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1.5">FY</span>
              <span className="font-mono font-semibold">2026-27</span>
            </div>
            <div className="text-muted-foreground hidden sm:block">·</div>
            <div className="hidden sm:block text-xs text-muted-foreground">Source: Union Budget 2026-27 · indiabudget.gov.in</div>
          </div>
        </div>

        {/* Toggle bar — Section only */}
        <div className="border-b border-border bg-card sticky top-0 z-20">
          <div className="container py-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Section</span>
              {SECTIONS.map(s => (
                <button key={s} onClick={() => setSection(s)} className={`px-2.5 py-1 rounded-sm font-medium capitalize transition-colors ${section === s ? "bg-foreground text-background" : "hover:bg-muted"}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="ml-auto text-[10px] text-muted-foreground hidden sm:block">
              All years shown as columns · click column headers to sort
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="container py-6">
          <div className="flex gap-6 items-start">

            {/* Left sidebar */}
            <aside className={`flex-shrink-0 sticky top-[89px] max-h-[calc(100vh-120px)] flex flex-col border border-border rounded-md bg-card overflow-hidden transition-all duration-200 ${sidebarCollapsed ? "w-9" : "w-64"}`}>

              {/* Collapse toggle + search */}
              <div className={`flex items-center border-b border-border flex-shrink-0 ${sidebarCollapsed ? "justify-center p-1.5" : "p-2 gap-2"}`}>
                <button
                  onClick={() => setSidebarCollapsed(c => !c)}
                  className="flex-shrink-0 p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                </button>
                {!sidebarCollapsed && (
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search ministry, demand…" className="w-full pl-8 pr-3 py-1.5 text-xs rounded-sm border border-input bg-background" />
                  </div>
                )}
              </div>

              {/* Ministry list */}
              {!sidebarCollapsed && (
                <div className="overflow-y-auto flex-1">
                  {filteredTree.map(({ ministry, demands }) => {
                    const isExpanded = expanded.has(ministry);
                    const mTotal = getMinistryTotal(ministry, "be2627", section);
                    const isSelected = selection.type === "ministry" && selection.value === ministry;
                    return (
                      <div key={ministry}>
                        <div className={`flex items-center hover:bg-muted/50 transition-colors ${isSelected ? "bg-muted" : ""}`}>
                          {/* Chevron — toggles expand/collapse only */}
                          <button
                            onClick={() => toggleMinistry(ministry)}
                            className="flex-shrink-0 px-2 py-2 text-muted-foreground hover:text-foreground"
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          </button>
                          {/* Ministry name — selects ministry */}
                          <button
                            onClick={() => selectMinistry(ministry)}
                            className="flex-1 flex items-center justify-between gap-1 pr-3 py-2 text-left min-w-0"
                          >
                            <span className="text-xs font-medium leading-tight truncate">{ministry}</span>
                            <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">{formatCrore(mTotal, true)}</span>
                          </button>
                        </div>
                        {isExpanded && demands.map(d => {
                          const isDSelected = selection.type === "demand" && selection.value === d.demandNo;
                          return (
                            <button
                              key={d.demandNo}
                              onClick={() => selectDemand(d.demandNo)}
                              className={`w-full flex items-center justify-between gap-1 pl-7 pr-3 py-1.5 text-left hover:bg-muted/50 transition-colors ${isDSelected ? "bg-primary/10 text-primary" : ""}`}
                            >
                              <span className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0 w-5">{d.demandNo}</span>
                                <span className={`text-xs leading-tight truncate ${isDSelected ? "font-semibold" : ""}`}>{d.demandDesc}</span>
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">{formatCrore(getValue(d, "be2627", section), true)}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </aside>

            {/* Right detail panel */}
            <div className="flex-1 min-w-0">
              {selection.type === "none" && (
                <AllDemandsOverview section={section} onSelect={selectDemand} />
              )}
              {selection.type === "ministry" && (
                <MinistryDetail
                  ministry={selection.value as string}
                  section={section}
                  onSelectDemand={selectDemand}
                />
              )}
              {selection.type === "demand" && (
                <DemandDetail demandNo={selection.value as number} section={section} />
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
