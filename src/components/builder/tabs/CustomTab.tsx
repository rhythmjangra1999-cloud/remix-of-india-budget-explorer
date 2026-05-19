import { useMemo, useState } from "react";
import { Info, Download } from "lucide-react";
import { DG_SUMMARY, DG_MAJOR_HEADS, getMinistries, type YearKey } from "@/lib/dg";
import { DDG_LEAVES } from "@/lib/ddg";
import { TOPICS, getTopicForMajorHead, fmtCr, YEAR_PLAIN } from "@/lib/report";
import { MAJOR_HEAD_NAME, LMMH_OBJECT_HEADS, getFunctionalSector } from "@/lib/lmmh";

// Free-form pivot builder. Rows = the dimension, Columns = years.
type RowDim = "ministry" | "topic" | "majorHead" | "sector" | "objectHead";

const ROW_DIMS: { key: RowDim; label: string; help: string }[] = [
  { key: "ministry",   label: "Ministry / Department",  help: "One row per ministry" },
  { key: "topic",      label: "Topic",                  help: "Grouped into 14 plain-English topics (Education, Health, etc.)" },
  { key: "sector",     label: "Functional Sector",      help: "General / Social / Economic Services (official LMMH classification)" },
  { key: "majorHead",  label: "Major Head (Function)",  help: "Lowest-level accounting head with a name (e.g. General Education)" },
  { key: "objectHead", label: "Object Head (Spent on)", help: "What the money was spent on — Salaries, Subsidies, Grants etc. (DDG only)" },
];

const ALL_YEARS: YearKey[] = ["actuals2425","be2526","re2526","be2627"];

export default function CustomTab() {
  const [rowDim, setRowDim] = useState<RowDim>("topic");
  const [yearsShown, setYearsShown] = useState<YearKey[]>(["be2526","re2526","be2627"]);
  const [ministryFilter, setMinistryFilter] = useState<string>("");
  const [topicFilter, setTopicFilter] = useState<string>("");
  const [objectHeadFilter, setObjectHeadFilter] = useState<string>("");

  const ministries = useMemo(() => getMinistries(), []);
  const objectHeads = LMMH_OBJECT_HEADS;

  // If the user filters by object head OR groups by it, we MUST use DDG (it's the only
  // table that carries object-head info).
  const useDDG = rowDim === "objectHead" || !!objectHeadFilter;

  const pivot = useMemo(() => buildPivot(rowDim, {
    ministry: ministryFilter || undefined,
    topicId: topicFilter || undefined,
    objectHead: objectHeadFilter || undefined,
  }), [rowDim, ministryFilter, topicFilter, objectHeadFilter]);

  function toggleYear(y: YearKey) {
    setYearsShown(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y].sort((a, b) => ALL_YEARS.indexOf(a) - ALL_YEARS.indexOf(b)));
  }

  function exportCSV() {
    const head = ["Row", ...yearsShown.map(y => YEAR_PLAIN[y].short)];
    const lines = [head.join(",")];
    for (const r of pivot) {
      lines.push([`"${r.label.replace(/"/g, '""')}"`, ...yearsShown.map(y => r.values[y]?.toFixed(2) ?? "")].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "custom-report.csv";
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/20 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">For power users.</span>{" "}
          Build your own pivot table. Pick what each row should represent, which years to show as columns, and add optional filters.
          {useDDG && (
            <span className="block mt-1 text-amber-700 dark:text-amber-400">
              ⓘ Using detailed (DDG) data — coverage is currently {ddgDemandCount()} demands across {ddgMinistryCount()} ministries.
            </span>
          )}
        </div>
      </div>

      {/* Builder */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Each row should be a…">
            <select value={rowDim} onChange={e => setRowDim(e.target.value as RowDim)} className={inputCls}>
              {ROW_DIMS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
            <div className="text-[11px] text-muted-foreground mt-1">
              {ROW_DIMS.find(d => d.key === rowDim)?.help}
            </div>
          </Field>

          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5">
              Show these years as columns
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_YEARS.map(y => (
                <label key={y} className={`px-3 py-1.5 rounded-md border text-xs cursor-pointer transition-colors
                  ${yearsShown.includes(y) ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted/40"}`}>
                  <input type="checkbox" checked={yearsShown.includes(y)} onChange={() => toggleYear(y)} className="sr-only" />
                  {YEAR_PLAIN[y].short}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
            Filters (all optional, combine freely)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Ministry">
              <select value={ministryFilter} onChange={e => setMinistryFilter(e.target.value)} className={inputCls}>
                <option value="">All ministries</option>
                {ministries.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>

            <Field label="Topic">
              <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)} className={inputCls}>
                <option value="">All topics</option>
                {TOPICS.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
              </select>
            </Field>

            <Field label="Spent on (Object Head)">
              <select value={objectHeadFilter} onChange={e => setObjectHeadFilter(e.target.value)} className={inputCls}>
                <option value="">All categories of spending</option>
                {/* Group by Object Class */}
                {Array.from(groupByClass(objectHeads).entries()).map(([cls, items]) => (
                  <optgroup key={cls} label={cls}>
                    {items.map(o => (
                      <option key={o.code} value={o.code}>{o.name} ({o.code})</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {objectHeadFilter && (
                <div className="text-[11px] text-muted-foreground mt-1 italic">
                  Filter active — only rows that include this object head.
                </div>
              )}
            </Field>
          </div>
        </div>
      </div>

      {/* Results */}
      {pivot.length > 0 ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Report</div>
              <div className="text-xs text-muted-foreground">{pivot.length} rows · {yearsShown.length} year column{yearsShown.length === 1 ? "" : "s"}</div>
            </div>
            <button onClick={exportCSV} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">{ROW_DIMS.find(d => d.key === rowDim)?.label}</th>
                  {yearsShown.map(y => (
                    <th key={y} className="px-3 py-2 text-right">{YEAR_PLAIN[y].short}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pivot.map(r => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <div>{r.label}</div>
                      {r.sub && <div className="text-[11px] text-muted-foreground">{r.sub}</div>}
                    </td>
                    {yearsShown.map(y => (
                      <td key={y} className="px-3 py-2 text-right tabular-nums">{fmtCr(r.values[y] ?? 0)}</td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                  <td className="px-3 py-2">Total</td>
                  {yearsShown.map(y => {
                    const t = pivot.reduce((s, r) => s + (r.values[y] ?? 0), 0);
                    return <td key={y} className="px-3 py-2 text-right tabular-nums">{fmtCr(t)}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No data for the current selection. Try removing some filters.
        </div>
      )}
    </div>
  );
}

// ─── Pivot builder ───────────────────────────────────────────────────────────

interface PivotRow {
  id: string;
  label: string;
  sub?: string;
  values: Partial<Record<YearKey, number>>;
}

interface PivotFilter {
  ministry?: string;
  topicId?: string;
  objectHead?: string;
}

function buildPivot(dim: RowDim, filter: PivotFilter): PivotRow[] {
  const useDDG = dim === "objectHead" || !!filter.objectHead;
  return useDDG ? buildPivotFromDDG(dim, filter) : buildPivotFromMH(dim, filter);
}

/** Pivot built from DG_MAJOR_HEADS (no object-head info) */
function buildPivotFromMH(dim: RowDim, filter: PivotFilter): PivotRow[] {
  let demandSet: Set<number> | null = null;
  if (filter.ministry) {
    demandSet = new Set(DG_SUMMARY.filter(d => d.ministry === filter.ministry).map(d => d.demandNo));
  }
  const topic = filter.topicId ? TOPICS.find(t => t.id === filter.topicId) : null;
  const matches = (r: { demandNo: number; mhCode: string }) => {
    if (demandSet && !demandSet.has(r.demandNo)) return false;
    if (topic && !topic.majorHeadCodes.includes(r.mhCode)) return false;
    return true;
  };

  if (dim === "ministry") {
    const map = new Map<string, PivotRow>();
    for (const d of DG_SUMMARY) {
      if (demandSet && !demandSet.has(d.demandNo)) continue;
      if (!map.has(d.ministry)) map.set(d.ministry, emptyRow(d.ministry, d.ministry));
      const row = map.get(d.ministry)!;
      ALL_YEARS.forEach(y => { row.values[y] = (row.values[y] ?? 0) + (d[y].total ?? 0); });
    }
    return sortByLatest(Array.from(map.values()));
  }

  const map = new Map<string, PivotRow>();
  for (const r of DG_MAJOR_HEADS) {
    if (r.mhCode.startsWith("TOTAL")) continue;
    if (!matches(r)) continue;

    let key = "", label = "", sub: string | undefined;
    if (dim === "topic") {
      const t = getTopicForMajorHead(r.mhCode);
      key = t ? t.id : "other";
      label = t ? `${t.emoji} ${t.name}` : "Other / Uncategorised";
    } else if (dim === "sector") {
      key = label = getFunctionalSector(r.mhCode);
    } else if (dim === "majorHead") {
      key = r.mhCode;
      label = MAJOR_HEAD_NAME[r.mhCode] ?? r.mhName;
      sub = `Code ${r.mhCode}`;
    }

    if (!map.has(key)) map.set(key, emptyRow(key, label, sub));
    const row = map.get(key)!;
    ALL_YEARS.forEach(y => { row.values[y] = (row.values[y] ?? 0) + (r[y] ?? 0); });
  }
  const out = sortByLatest(Array.from(map.values()));
  return dim === "majorHead" ? out.slice(0, 50) : out;
}

/** Pivot built from DDG_LEAVES (object-head granularity) */
function buildPivotFromDDG(dim: RowDim, filter: PivotFilter): PivotRow[] {
  let demandSet: Set<number> | null = null;
  if (filter.ministry) {
    demandSet = new Set(DG_SUMMARY.filter(d => d.ministry === filter.ministry).map(d => d.demandNo));
  }
  const topic = filter.topicId ? TOPICS.find(t => t.id === filter.topicId) : null;
  const objCode = filter.objectHead ? filter.objectHead.padStart(2, "0") : null;

  const matches = (r: typeof DDG_LEAVES[number]) => {
    if (demandSet && !demandSet.has(r.demandNo)) return false;
    if (topic && !topic.majorHeadCodes.includes(r.majorHead)) return false;
    if (objCode && r.objectHead.padStart(2, "0") !== objCode) return false;
    return true;
  };

  // demand → ministry lookup (for richer labels)
  const demandToMin = new Map<number, string>(DG_SUMMARY.map(d => [d.demandNo, d.ministry]));

  const map = new Map<string, PivotRow>();
  for (const r of DDG_LEAVES) {
    if (!matches(r)) continue;

    let key = "", label = "", sub: string | undefined;
    if (dim === "objectHead") {
      key = r.objectHead.padStart(2, "0");
      label = r.objectHeadName || `Object Head ${key}`;
      sub = `Code ${key}`;
    } else if (dim === "ministry") {
      key = label = demandToMin.get(r.demandNo) ?? r.ministry;
    } else if (dim === "topic") {
      const t = getTopicForMajorHead(r.majorHead);
      key = t ? t.id : "other";
      label = t ? `${t.emoji} ${t.name}` : "Other / Uncategorised";
    } else if (dim === "sector") {
      key = label = getFunctionalSector(r.majorHead);
    } else if (dim === "majorHead") {
      key = r.majorHead;
      label = MAJOR_HEAD_NAME[r.majorHead] ?? r.majorHeadName;
      sub = `Code ${r.majorHead}`;
    }

    if (!map.has(key)) map.set(key, emptyRow(key, label, sub));
    const row = map.get(key)!;
    ALL_YEARS.forEach(y => {
      const v = r[y];
      if (typeof v === "number") row.values[y] = (row.values[y] ?? 0) + v;
    });
  }
  const out = sortByLatest(Array.from(map.values()));
  return dim === "majorHead" ? out.slice(0, 50) : out;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptyRow(id: string, label: string, sub?: string): PivotRow {
  return { id, label, sub, values: { actuals2425: 0, be2526: 0, re2526: 0, be2627: 0 } };
}
function sortByLatest(rows: PivotRow[]): PivotRow[] {
  return rows.sort((a, b) => (b.values.be2627 ?? 0) - (a.values.be2627 ?? 0));
}

function groupByClass(items: typeof LMMH_OBJECT_HEADS): Map<string, typeof LMMH_OBJECT_HEADS> {
  const m = new Map<string, typeof LMMH_OBJECT_HEADS>();
  for (const o of items) {
    if (!m.has(o.objectClass)) m.set(o.objectClass, []);
    m.get(o.objectClass)!.push(o);
  }
  return m;
}

function ddgDemandCount(): number {
  return new Set(DDG_LEAVES.map(r => r.demandNo)).size;
}
function ddgMinistryCount(): number {
  return new Set(DDG_LEAVES.map(r => r.ministry)).size;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full text-sm rounded-md border border-input bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring";
