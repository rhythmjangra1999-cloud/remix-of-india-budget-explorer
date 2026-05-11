import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown, Plus, Download } from "lucide-react";
import { DDG_LEAVES, type DDGLeaf } from "@/lib/ddg";
import { DG_MAJOR_HEADS, DG_SUMMARY, type YearKey, type Section } from "@/lib/dg";

const YEARS: { key: YearKey; label: string }[] = [
  { key: "actuals2425", label: "FY24-25 Actuals" },
  { key: "be2526",      label: "FY25-26 BE"      },
  { key: "re2526",      label: "FY25-26 RE"      },
  { key: "be2627",      label: "FY26-27 BE"      },
];
const PREV_YEAR: Partial<Record<YearKey, YearKey>> = {
  be2526: "actuals2425",
  re2526: "be2526",
  be2627: "re2526",
};

type Vals = Partial<Record<YearKey, number>>;

interface Node {
  key: string;
  label: string;
  level: "major" | "minor" | "sub" | "object";
  vals: Vals;
  children?: Node[];
  // payload to promote into a Selection
  promote: {
    majorHead?: string;
    minorHead?: string;
    subHead?: string;
    objectHead?: string;
  };
}

function fmtCr(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return "—";
  if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(2)} L Cr`;
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
}
function fmtPct(v: number | null): string {
  if (v == null || isNaN(v) || !isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}
function addVals(a: Vals, r: Pick<DDGLeaf, "actuals2425" | "be2526" | "re2526" | "be2627">) {
  for (const k of ["actuals2425", "be2526", "re2526", "be2627"] as YearKey[]) {
    const v = r[k];
    if (typeof v === "number") a[k] = (a[k] ?? 0) + v;
  }
}

function buildDDGTree(rows: DDGLeaf[]): Node[] {
  const majors = new Map<string, Node>();
  for (const r of rows) {
    const mhKey = r.majorHead;
    let mh = majors.get(mhKey);
    if (!mh) {
      mh = {
        key: mhKey, label: `${r.majorHead} — ${r.majorHeadName}`,
        level: "major", vals: {}, children: [],
        promote: { majorHead: r.majorHead },
      };
      majors.set(mhKey, mh);
    }
    addVals(mh.vals, r);

    const minorKey = `${r.subMajor}.${r.minorHead}`;
    let mn = mh.children!.find(c => c.key === minorKey);
    if (!mn) {
      mn = {
        key: minorKey, label: `${minorKey} — ${r.minorHeadName || "—"}`,
        level: "minor", vals: {}, children: [],
        promote: { majorHead: r.majorHead, minorHead: minorKey },
      };
      mh.children!.push(mn);
    }
    addVals(mn.vals, r);

    const subKey = `${r.subHead}.${r.detailedHead}`;
    let sb = mn.children!.find(c => c.key === subKey);
    if (!sb) {
      sb = {
        key: subKey, label: `${subKey} — ${r.subHeadName || "—"}`,
        level: "sub", vals: {}, children: [],
        promote: { majorHead: r.majorHead, minorHead: minorKey, subHead: subKey },
      };
      mn.children!.push(sb);
    }
    addVals(sb.vals, r);

    const objKey = r.objectHead;
    let ob = sb.children!.find(c => c.key === objKey);
    if (!ob) {
      ob = {
        key: objKey, label: `${objKey} — ${r.objectHeadName}`,
        level: "object", vals: {}, children: undefined,
        promote: { majorHead: r.majorHead, minorHead: minorKey, subHead: subKey, objectHead: objKey },
      };
      sb.children!.push(ob);
    }
    addVals(ob.vals, r);
  }
  return Array.from(majors.values());
}

function buildDGMHTree(demandNo: number, section: Section): Node[] {
  const rows = DG_MAJOR_HEADS.filter(r => r.demandNo === demandNo && !r.mhCode.startsWith("TOTAL"));
  const filtered = section === "total" ? rows : rows.filter(r => r.section.toLowerCase() === section);
  return filtered.map(r => ({
    key: r.mhCode,
    label: `${r.mhCode} — ${r.mhName}`,
    level: "major" as const,
    vals: {
      actuals2425: r.actuals2425 ?? undefined,
      be2526: r.be2526 ?? undefined,
      re2526: r.re2526 ?? undefined,
      be2627: r.be2627 ?? undefined,
    } as Vals,
    promote: { majorHead: r.mhCode },
  }));
}

interface Props {
  ministry: string;
  demandNo: number | "all";
  year: YearKey;
  section: Section;
  onAddSelection: (partial: { ministry: string; demandNo: number; majorHead?: string; minorHead?: string; subHead?: string; objectHead?: string; section: Section }) => void;
  onPickDemand?: (demandNo: number) => void;
}

export default function DeepDivePanel(props: Props) {
  const [year, setYear] = useState<YearKey>(props.year);
  const [section, setSection] = useState<Section>(props.section);

  // ministry-total: show demand list to pick from
  if (props.demandNo === "all") {
    const dems = DG_SUMMARY.filter(d => d.ministry === props.ministry).sort((a,b) => a.demandNo - b.demandNo);
    const total = dems.reduce((s, d) => s + (d[year][section] ?? 0), 0);
    return (
      <div className="bg-muted/20 border-t border-border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">{props.ministry}</span> · pick a demand to drill into Major → Object head
          </div>
          <YearSectionPicker year={year} section={section} onYear={setYear} onSection={setSection} />
        </div>
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Demand</th>
                <th className="px-3 py-2 text-right">Value</th>
                <th className="px-3 py-2 text-right">% of Ministry</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {dems.map(d => {
                const v = d[year][section] ?? 0;
                const pct = total ? (v / total) * 100 : 0;
                return (
                  <tr key={d.demandNo} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-2">D{d.demandNo} · {d.demandDesc}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtCr(v)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{pct.toFixed(2)}%</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => props.onPickDemand?.(d.demandNo)}
                        className="text-xs px-2 py-1 rounded border border-border hover:bg-primary/10 hover:text-primary hover:border-primary inline-flex items-center gap-1">
                        Drill <ChevronRight className="h-3 w-3" />
                      </button>
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

  const demandNo = props.demandNo;
  const sectionFilter = (s: string) =>
    section === "total" ? true : section === "revenue" ? s === "Revenue" : s === "Capital";
  const ddgRows = DDG_LEAVES.filter(r => r.demandNo === demandNo && sectionFilter(r.section));
  const usingDDG = ddgRows.length > 0;

  const tree = useMemo<Node[]>(() => {
    return usingDDG ? buildDDGTree(ddgRows) : buildDGMHTree(demandNo, section);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demandNo, section, usingDDG, ddgRows.length]);

  const total = tree.reduce((s, n) => s + (n.vals[year] ?? 0), 0);
  const prevY = PREV_YEAR[year];

  function exportCSV() {
    const lines = ["Level,Code,Label,Value,Share of demand %,YoY %"];
    function walk(n: Node, depth: number) {
      const v = n.vals[year];
      const share = total && v != null ? (v / total) * 100 : null;
      const pv = prevY ? n.vals[prevY] : undefined;
      const yoy = (v != null && pv != null && pv !== 0) ? ((v - pv) / Math.abs(pv)) * 100 : null;
      lines.push([
        n.level, n.key, `"${n.label.replace(/"/g, '""')}"`,
        v?.toFixed(2) ?? "", share?.toFixed(2) ?? "", yoy?.toFixed(2) ?? "",
      ].join(","));
      n.children?.forEach(c => walk(c, depth + 1));
    }
    tree.forEach(n => walk(n, 0));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `deepdive-D${demandNo}-${year}.csv`;
    a.click();
  }

  // Top-N for bar chart
  const topN = [...tree].sort((a, b) => (b.vals[year] ?? 0) - (a.vals[year] ?? 0)).slice(0, 10);
  const maxVal = Math.max(0, ...topN.map(n => Math.abs(n.vals[year] ?? 0)));

  const dem = DG_SUMMARY.find(d => d.demandNo === demandNo);

  return (
    <div className="bg-muted/20 border-t border-border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-muted-foreground">
          <span className="text-foreground font-medium">{props.ministry}</span>
          {" · "}<span className="text-foreground">D{demandNo} {dem?.demandDesc}</span>
          {" · "}Total: <span className="text-foreground font-medium tabular-nums">{fmtCr(total)}</span>
        </div>
        <div className="flex items-center gap-2">
          <YearSectionPicker year={year} section={section} onYear={setYear} onSection={setSection} />
          <button onClick={exportCSV}
            className="text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-muted inline-flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
      </div>

      {!usingDDG && (
        <div className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md px-3 py-2">
          Object-head detail not yet ingested for this demand. Showing Major-head split from the DG schedule instead.
        </div>
      )}

      {/* Top-N bar */}
      {topN.length > 0 && (
        <div className="rounded-md border border-border bg-card p-3 space-y-1.5">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Top {topN.length} {usingDDG ? "Major Heads" : "Heads"}</div>
          {topN.map(n => {
            const v = n.vals[year] ?? 0;
            const w = maxVal ? (Math.abs(v) / maxVal) * 100 : 0;
            return (
              <div key={n.key} className="flex items-center gap-2 text-xs">
                <div className="w-48 truncate text-muted-foreground" title={n.label}>{n.label}</div>
                <div className="flex-1 h-4 bg-muted/40 rounded overflow-hidden relative">
                  <div className="h-full bg-primary/70" style={{ width: `${w}%` }} />
                </div>
                <div className="w-24 text-right tabular-nums">{fmtCr(v)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tree */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-3 py-2 bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
          <div>Head</div>
          <div className="text-right w-28">Value</div>
          <div className="text-right w-20">% Demand</div>
          <div className="text-right w-20">YoY</div>
          <div className="w-8"></div>
        </div>
        <div className="divide-y divide-border">
          {tree
            .sort((a, b) => (b.vals[year] ?? 0) - (a.vals[year] ?? 0))
            .map(n => (
              <TreeRow key={n.key} node={n} depth={0} year={year} prevY={prevY} parentTotal={total}
                onAdd={(p) => props.onAddSelection({ ministry: props.ministry, demandNo, section, ...p })} />
            ))}
        </div>
      </div>
    </div>
  );
}

function TreeRow({ node, depth, year, prevY, parentTotal, onAdd }: {
  node: Node; depth: number; year: YearKey; prevY: YearKey | undefined; parentTotal: number;
  onAdd: (p: { majorHead?: string; minorHead?: string; subHead?: string; objectHead?: string }) => void;
}) {
  const [open, setOpen] = useState(depth === 0 ? false : false);
  const v = node.vals[year];
  const share = parentTotal && v != null ? (v / parentTotal) * 100 : null;
  const pv = prevY ? node.vals[prevY] : undefined;
  const yoy = (v != null && pv != null && pv !== 0) ? ((v - pv) / Math.abs(pv)) * 100 : null;
  const hasChildren = !!node.children?.length;
  const childTotal = hasChildren ? node.children!.reduce((s, c) => s + (c.vals[year] ?? 0), 0) : 0;

  return (
    <>
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-3 px-3 py-1.5 items-center text-sm hover:bg-muted/20"
        style={{ paddingLeft: `${12 + depth * 16}px` }}>
        <div className="flex items-center gap-1 min-w-0">
          {hasChildren ? (
            <button onClick={() => setOpen(o => !o)} className="text-muted-foreground hover:text-foreground p-0.5">
              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : <span className="w-4 inline-block" />}
          <span className="truncate" title={node.label}>{node.label}</span>
          <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">{node.level}</span>
        </div>
        <div className="text-right tabular-nums w-28 font-medium">{fmtCr(v)}</div>
        <div className="text-right tabular-nums w-20 text-muted-foreground">{share == null ? "—" : `${share.toFixed(1)}%`}</div>
        <div className={`text-right tabular-nums w-20 ${(yoy ?? 0) > 0 ? "text-emerald-600" : (yoy ?? 0) < 0 ? "text-destructive" : "text-muted-foreground"}`}>{fmtPct(yoy)}</div>
        <button title="Add as new selection in comparison"
          onClick={() => onAdd(node.promote)}
          className="w-8 h-6 flex items-center justify-center rounded hover:bg-primary/10 hover:text-primary text-muted-foreground">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {open && hasChildren && node.children!
        .sort((a, b) => (b.vals[year] ?? 0) - (a.vals[year] ?? 0))
        .map(c => (
          <TreeRow key={c.key} node={c} depth={depth + 1} year={year} prevY={prevY} parentTotal={childTotal} onAdd={onAdd} />
        ))}
    </>
  );
}

function YearSectionPicker({ year, section, onYear, onSection }: {
  year: YearKey; section: Section; onYear: (y: YearKey) => void; onSection: (s: Section) => void;
}) {
  const cls = "text-xs rounded-md border border-input bg-background px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <div className="flex items-center gap-2">
      <select value={section} onChange={e => onSection(e.target.value as Section)} className={cls}>
        <option value="total">Total</option>
        <option value="revenue">Revenue</option>
        <option value="capital">Capital</option>
      </select>
      <select value={year} onChange={e => onYear(e.target.value as YearKey)} className={cls}>
        {YEARS.map(y => <option key={y.key} value={y.key}>{y.label}</option>)}
      </select>
    </div>
  );
}
