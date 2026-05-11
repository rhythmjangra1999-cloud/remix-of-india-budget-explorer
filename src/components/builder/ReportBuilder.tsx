import { useMemo, useState } from "react";
import { Plus, Trash2, Download, Printer, Info } from "lucide-react";
import { DG_SUMMARY, type YearKey, type Section } from "@/lib/dg";
import ddgsRaw from "@/data/ddgs.json";
import demandsRaw from "@/data/demands.json";
import recoveriesRaw from "@/data/dg-recoveries.json";

// ---------- data plumbing ----------
type DDGRow = {
  ministryId: string; demandId: string; majorHead: string;
  minorHead?: string; subHead?: string; objectHead: string;
  amounts: { FY26?: number; FY27?: number };
  revenue?: boolean;
};
const DDGS = ddgsRaw as DDGRow[];
const DEMANDS_META = demandsRaw as Array<{ id: string; ministryId: string; number: number; title: string }>;
const RECOV = recoveriesRaw as Record<string, Partial<Record<YearKey, number>>>;

// demandNo -> demandId (for ddg lookup)
const demandIdByNo = new Map<number, string>();
for (const d of DEMANDS_META) demandIdByNo.set(d.number, d.id);

// ---------- year metadata ----------
type Type = "dg" | "eb" | "ddg";

const YEARS: { key: YearKey; label: string; ddg: boolean }[] = [
  { key: "actuals2425", label: "FY24-25 Actuals", ddg: false },
  { key: "be2526",      label: "FY25-26 BE",      ddg: true  },
  { key: "re2526",      label: "FY25-26 RE",      ddg: false },
  { key: "be2627",      label: "FY26-27 BE",      ddg: true  },
];
const YEAR_LABEL: Record<YearKey, string> = Object.fromEntries(YEARS.map(y => [y.key, y.label])) as Record<YearKey, string>;
const PREV_YEAR: Partial<Record<YearKey, YearKey>> = {
  be2526: "actuals2425",
  re2526: "be2526",
  be2627: "re2526",
};
function ddgYear(y: YearKey): "FY26" | "FY27" | null {
  if (y === "be2526") return "FY26";
  if (y === "be2627") return "FY27";
  return null;
}

const TYPES: { key: Type; label: string; help: string }[] = [
  { key: "dg",  label: "DG (Gross)",         help: "Gross provision in the Demand for Grants" },
  { key: "eb",  label: "Expenditure Budget", help: "Net of recoveries (DG − Recoveries)" },
  { key: "ddg", label: "DDG (Object-head)",  help: "Detailed line item from the DDG document" },
];

// ---------- ministries / demands ----------
const MINISTRIES = Array.from(new Set(DG_SUMMARY.map(d => d.ministry))).sort();
function demandsOf(min: string) {
  return DG_SUMMARY.filter(d => d.ministry === min).sort((a, b) => a.demandNo - b.demandNo);
}

// ---------- core calculations ----------
function grandTotalForYear(y: YearKey): number {
  return DG_SUMMARY.reduce((s, d) => s + (d[y].total ?? 0), 0);
}

// Returns numeric value for selection or null if not available
function calcValue(sel: Selection, year: YearKey): number | null {
  const { ministry, demandNo, type, section, ddgRowIdx } = sel;

  if (type === "ddg") {
    const dy = ddgYear(year);
    if (!dy) return null;
    if (demandNo === "all") return null; // require specific demand
    const did = demandIdByNo.get(demandNo);
    if (!did) return null;
    const rows = DDGS.filter(r => r.demandId === did);
    if (ddgRowIdx == null) {
      // sum filtered by section
      return rows
        .filter(r => section === "total" ? true : section === "revenue" ? r.revenue : !r.revenue)
        .reduce((s, r) => s + (r.amounts[dy] ?? 0), 0);
    }
    return rows[ddgRowIdx]?.amounts[dy] ?? null;
  }

  // DG / EB
  const demands = demandNo === "all"
    ? DG_SUMMARY.filter(d => d.ministry === ministry)
    : DG_SUMMARY.filter(d => d.ministry === ministry && d.demandNo === demandNo);
  if (!demands.length) return null;

  let val = demands.reduce((s, d) => s + (d[year][section] ?? 0), 0);
  if (type === "eb") {
    const rec = demands.reduce((s, d) => s + Math.abs(RECOV[String(d.demandNo)]?.[year] ?? 0), 0);
    // Apply recovery only on total (recoveries in DG_RECOV are total figures)
    if (section === "total") val -= rec;
  }
  return val;
}

// ---------- selection model ----------
interface Selection {
  id: string;
  ministry: string;
  demandNo: number | "all";
  type: Type;
  section: Section;
  year: YearKey;
  ddgRowIdx?: number; // for DDG: pick a specific object-head row, else sum
}

function newSelection(): Selection {
  return {
    id: Math.random().toString(36).slice(2, 9),
    ministry: MINISTRIES[0],
    demandNo: "all",
    type: "dg",
    section: "total",
    year: "be2627",
  };
}

// ---------- formatters ----------
function fmtCr(v: number | null): string {
  if (v == null || isNaN(v)) return "—";
  if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(2)} L Cr`;
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
}
function fmtPct(v: number | null): string {
  if (v == null || isNaN(v) || !isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

// ---------- UI ----------
export default function ReportBuilder() {
  const [sels, setSels] = useState<Selection[]>(() => [newSelection(), { ...newSelection(), year: "be2526" }]);

  function update(id: string, patch: Partial<Selection>) {
    setSels(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }
  function remove(id: string) {
    setSels(prev => prev.filter(s => s.id !== id));
  }
  function add() {
    setSels(prev => [...prev, newSelection()]);
  }

  // computed rows
  const computed = useMemo(() => sels.map(s => {
    const value = calcValue(s, s.year);
    const grand = grandTotalForYear(s.year);
    const share = value != null && grand ? (value / grand) * 100 : null;
    const prevY = PREV_YEAR[s.year];
    const prevVal = prevY ? calcValue(s, prevY) : null;
    const yoy = (value != null && prevVal != null && prevVal !== 0)
      ? ((value - prevVal) / Math.abs(prevVal)) * 100
      : null;
    return { sel: s, value, share, yoy, prevYear: prevY, prevVal };
  }), [sels]);

  const maxVal = Math.max(0, ...computed.map(c => Math.abs(c.value ?? 0)));

  function exportCSV() {
    const head = ["#", "Ministry", "Demand", "Type", "Section", "Year", "Value (₹ Cr)", "% of Union Budget", "YoY %"];
    const lines = [head.join(",")];
    computed.forEach((c, i) => {
      const dem = c.sel.demandNo === "all" ? "All" : `D${c.sel.demandNo}`;
      lines.push([
        i + 1, `"${c.sel.ministry}"`, dem, c.sel.type.toUpperCase(),
        c.sel.section, YEAR_LABEL[c.sel.year],
        c.value?.toFixed(2) ?? "", c.share?.toFixed(2) ?? "", c.yoy?.toFixed(2) ?? ""
      ].join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "budget-comparison.csv";
    a.click();
  }

  return (
    <div className="space-y-6">
      {/* Flow help */}
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex gap-3 text-xs">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="text-muted-foreground leading-relaxed">
          <span className="text-foreground font-medium">How to read:</span>{" "}
          Ministries submit <strong>Demands for Grants (DG)</strong> → the <strong>Expenditure Budget</strong> nets out recoveries → in-year, departments publish the <strong>Detailed DG (DDG)</strong> with object-head detail.
          Pick a Ministry, Demand, Type and Year for each row, then compare.
        </div>
      </div>

      {/* Selections */}
      <div className="space-y-3">
        {sels.map((s, idx) => {
          const c = computed[idx];
          const ddgDisabled = s.type === "ddg" && !ddgYear(s.year);
          const dems = demandsOf(s.ministry);
          const did = s.demandNo !== "all" ? demandIdByNo.get(s.demandNo) : null;
          const ddgRows = did ? DDGS.filter(r => r.demandId === did) : [];

          return (
            <div key={s.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">{idx + 1}</div>
                  <div className="text-xs text-muted-foreground">Selection {idx + 1}</div>
                </div>
                {sels.length > 1 && (
                  <button onClick={() => remove(s.id)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Ministry */}
                <Field label="Ministry">
                  <select value={s.ministry}
                    onChange={e => update(s.id, { ministry: e.target.value, demandNo: "all", ddgRowIdx: undefined })}
                    className={inputCls}>
                    {MINISTRIES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>

                {/* Demand */}
                <Field label="Demand">
                  <select value={String(s.demandNo)}
                    onChange={e => {
                      const v = e.target.value;
                      update(s.id, { demandNo: v === "all" ? "all" : Number(v), ddgRowIdx: undefined });
                    }}
                    className={inputCls}>
                    <option value="all">All demands (ministry total)</option>
                    {dems.map(d => <option key={d.demandNo} value={d.demandNo}>D{d.demandNo} · {d.demandDesc}</option>)}
                  </select>
                </Field>

                {/* Type */}
                <Field label="Type">
                  <select value={s.type}
                    onChange={e => update(s.id, { type: e.target.value as Type, ddgRowIdx: undefined })}
                    className={inputCls}>
                    {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </Field>

                {/* Section */}
                <Field label="Section">
                  <select value={s.section}
                    onChange={e => update(s.id, { section: e.target.value as Section })}
                    className={inputCls}>
                    <option value="total">Total</option>
                    <option value="revenue">Revenue</option>
                    <option value="capital">Capital</option>
                  </select>
                </Field>

                {/* Year */}
                <Field label="Year">
                  <select value={s.year}
                    onChange={e => update(s.id, { year: e.target.value as YearKey })}
                    className={inputCls}>
                    {YEARS.map(y => (
                      <option key={y.key} value={y.key} disabled={s.type === "ddg" && !y.ddg}>
                        {y.label}{s.type === "ddg" && !y.ddg ? " (no DDG)" : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* DDG row picker */}
                {s.type === "ddg" && (
                  <Field label="DDG line (optional)" className="md:col-span-2 lg:col-span-5">
                    {ddgRows.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic px-2 py-1.5">
                        DDG not yet available for this demand. (Currently covered: Police, J&K Transfers, DoPPG, Ports & Shipping.)
                      </div>
                    ) : (
                      <select value={s.ddgRowIdx == null ? "all" : String(s.ddgRowIdx)}
                        onChange={e => update(s.id, { ddgRowIdx: e.target.value === "all" ? undefined : Number(e.target.value) })}
                        className={inputCls}>
                        <option value="all">Sum of all object-heads (filtered by section)</option>
                        {ddgRows.map((r, i) => (
                          <option key={i} value={i}>
                            {r.majorHead} → {r.objectHead} ({r.revenue ? "Rev" : "Cap"})
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                )}
              </div>

              {/* result chip */}
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                <Stat label="Value" value={fmtCr(c.value)} accent />
                <Stat label="% of Union Budget" value={c.share == null ? "—" : `${c.share.toFixed(3)}%`} sub={`grand: ${fmtCr(grandTotalForYear(s.year))}`} />
                <Stat label={`YoY vs ${c.prevYear ? YEAR_LABEL[c.prevYear] : "—"}`} value={fmtPct(c.yoy)} sub={c.prevVal != null ? `prev: ${fmtCr(c.prevVal)}` : undefined} />
                {ddgDisabled && <span className="text-destructive">DDG unavailable for this year</span>}
              </div>
            </div>
          );
        })}

        <button onClick={add} className="w-full rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 px-4 py-3 text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-2 transition-colors">
          <Plus className="h-4 w-4" /> Add another selection to compare
        </button>
      </div>

      {/* Comparison table + chart */}
      {sels.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-semibold">Comparison</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Side-by-side trends across {sels.length} selection{sels.length > 1 ? "s" : ""}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
              <button onClick={() => window.print()} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted flex items-center gap-1.5">
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
            </div>
          </div>

          {/* mini bar chart */}
          <div className="px-4 py-4 border-b border-border space-y-2">
            {computed.map((c, i) => {
              const w = c.value != null && maxVal ? (Math.abs(c.value) / maxVal) * 100 : 0;
              return (
                <div key={c.sel.id} className="flex items-center gap-3">
                  <div className="w-6 text-xs text-muted-foreground tabular-nums">#{i + 1}</div>
                  <div className="flex-1 h-6 bg-muted/40 rounded relative overflow-hidden">
                    <div className="h-full rounded bg-primary/80" style={{ width: `${w}%` }} />
                    <div className="absolute inset-0 flex items-center px-2 text-xs font-medium">
                      {fmtCr(c.value)}
                    </div>
                  </div>
                  <div className="w-24 text-xs text-right text-muted-foreground">
                    {c.share == null ? "—" : `${c.share.toFixed(2)}%`}
                  </div>
                  <div className={`w-20 text-xs text-right tabular-nums ${(c.yoy ?? 0) > 0 ? "text-emerald-600" : (c.yoy ?? 0) < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {fmtPct(c.yoy)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Ministry</th>
                  <th className="px-3 py-2 text-left">Demand</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Section</th>
                  <th className="px-3 py-2 text-left">Year</th>
                  <th className="px-3 py-2 text-right">Value</th>
                  <th className="px-3 py-2 text-right">% Union Budget</th>
                  <th className="px-3 py-2 text-right">YoY</th>
                </tr>
              </thead>
              <tbody>
                {computed.map((c, i) => (
                  <tr key={c.sel.id} className="border-t border-border">
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 max-w-[18rem] truncate" title={c.sel.ministry}>{c.sel.ministry}</td>
                    <td className="px-3 py-2">{c.sel.demandNo === "all" ? "All" : `D${c.sel.demandNo}`}</td>
                    <td className="px-3 py-2 uppercase text-xs tracking-wide">{c.sel.type}</td>
                    <td className="px-3 py-2 capitalize">{c.sel.section}</td>
                    <td className="px-3 py-2">{YEAR_LABEL[c.sel.year]}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">{fmtCr(c.value)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{c.share == null ? "—" : `${c.share.toFixed(3)}%`}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${(c.yoy ?? 0) > 0 ? "text-emerald-600" : (c.yoy ?? 0) < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {fmtPct(c.yoy)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- small UI helpers ----------
const inputCls = "w-full text-sm rounded-md border border-input bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`text-sm tabular-nums ${accent ? "font-semibold text-foreground" : "text-foreground"}`}>{value}</span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </div>
  );
}
