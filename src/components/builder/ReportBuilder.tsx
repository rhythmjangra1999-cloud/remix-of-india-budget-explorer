import { Fragment, useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { DG_SUMMARY, DG_META, type YearKey } from "@/lib/dg";
import ddgsRaw from "@/data/ddgs.json";

// ---------- constants ----------
const GRAND = DG_META.grossBe2627Cr;

const YEAR_META: { key: YearKey; short: string; long: string; ddg: boolean }[] = [
  { key: "actuals2425", short: "Actuals 24-25", long: "FY24-25 Actuals", ddg: false },
  { key: "be2526",      short: "BE 25-26",      long: "FY25-26 BE",      ddg: true  }, // DDG FY26
  { key: "re2526",      short: "RE 25-26",      long: "FY25-26 RE",      ddg: false },
  { key: "be2627",      short: "BE 26-27",      long: "FY26-27 BE",      ddg: true  }, // DDG FY27
];

type Dataset = "expbudget" | "dgs" | "ddg";

const DATASETS: { key: Dataset; label: string; sub: string }[] = [
  { key: "expbudget", label: "Expenditure Budget", sub: "Ministry rollups" },
  { key: "dgs",       label: "Demands for Grants", sub: "102 demands" },
  { key: "ddg",       label: "Detailed DGs",       sub: "Object-head line items" },
];

// HSL palette (uses project tokens via direct hsl values matching index.css spirit)
const REV = "hsl(160 60% 38%)";
const CAP = "hsl(18 70% 52%)";
const TOT = "hsl(212 74% 37%)";
const PCT = "hsl(248 55% 65%)";

const MCOLORS = [
  "hsl(212 74% 37%)", "hsl(160 60% 38%)", "hsl(18 70% 52%)", "hsl(248 55% 65%)",
  "hsl(35 78% 41%)", "hsl(168 78% 25%)", "hsl(12 70% 36%)", "hsl(95 70% 25%)",
  "hsl(28 86% 28%)", "hsl(338 50% 41%)", "hsl(212 84% 27%)", "hsl(168 78% 18%)",
  "hsl(15 70% 18%)", "hsl(248 50% 25%)", "hsl(28 80% 22%)",
];

// ---------- types ----------
type Cell = { revenue: number; capital: number; total: number };
type Row = {
  key: string;
  no?: number;
  name: string;
  ministry: string;
  byYear: Partial<Record<YearKey, Cell>>;
};

// ---------- helpers ----------
const fmtNum = (v: number) => !v ? "—" : v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCompact = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(2)} L Cr` :
  v >= 1000   ? `₹${(v / 1000).toFixed(1)}K Cr` :
  `₹${fmtNum(v)} Cr`;

const cellOf = (s: { revenue: number | null; capital: number | null; total: number | null } | undefined): Cell =>
  ({ revenue: s?.revenue ?? 0, capital: s?.capital ?? 0, total: s?.total ?? 0 });

// ---------- dataset builders ----------
function buildExpBudget(): Row[] {
  const map = new Map<string, Row>();
  for (const d of DG_SUMMARY) {
    const r = map.get(d.ministry) ?? { key: d.ministry, name: d.ministry, ministry: d.ministry, byYear: {} };
    for (const y of YEAR_META) {
      const cur = r.byYear[y.key] ?? { revenue: 0, capital: 0, total: 0 };
      const c = cellOf(d[y.key]);
      r.byYear[y.key] = { revenue: cur.revenue + c.revenue, capital: cur.capital + c.capital, total: cur.total + c.total };
    }
    map.set(d.ministry, r);
  }
  return Array.from(map.values());
}

function buildDGs(): Row[] {
  return DG_SUMMARY.map(d => ({
    key: `D${d.demandNo}`,
    no: d.demandNo,
    name: d.demandDesc,
    ministry: d.ministry,
    byYear: Object.fromEntries(YEAR_META.map(y => [y.key, cellOf(d[y.key])])) as Row["byYear"],
  }));
}

// DDG only has FY26 / FY27. We aggregate by majorHead × demand for readability.
type DDG = {
  ministryId: string; demandId: string; majorHead: string; minorHead?: string;
  subHead?: string; objectHead: string; revenue?: boolean;
  amounts: { FY26?: number; FY27?: number };
};

function buildDDG(): Row[] {
  const ddgs = ddgsRaw as DDG[];
  // ministryId → display ministry name from DG_SUMMARY (best-effort match by demandId number)
  const demandToMinistry = new Map<number, string>();
  for (const d of DG_SUMMARY) demandToMinistry.set(d.demandNo, d.ministry);

  const map = new Map<string, Row>();
  for (const r of ddgs) {
    const demandNo = parseInt(r.demandId.replace(/^d0*/, ""), 10);
    const ministry = demandToMinistry.get(demandNo) ?? r.ministryId;
    const key = `${r.demandId}|${r.majorHead}|${r.minorHead ?? ""}|${r.subHead ?? ""}|${r.objectHead}`;
    const name = `${r.objectHead}${r.subHead ? " · " + r.subHead : ""}${r.minorHead ? " · " + r.minorHead : ""}`;
    const isRev = r.revenue !== false;
    const fy26 = r.amounts.FY26 ?? 0;
    const fy27 = r.amounts.FY27 ?? 0;
    const make = (v: number): Cell => isRev
      ? { revenue: v, capital: 0, total: v }
      : { revenue: 0, capital: v, total: v };
    map.set(key, {
      key, name: `${r.majorHead} → ${name}`, ministry,
      byYear: { be2526: make(fy26), be2627: make(fy27) },
    });
  }
  return Array.from(map.values());
}

// ---------- chart ----------
function BarChart({ data, primaryYear, splitRevCap }:
  { data: Row[]; primaryYear: YearKey; splitRevCap: boolean }) {
  const vals = data.map(d => d.byYear[primaryYear]?.total ?? 0);
  const maxVal = Math.max(...vals, 1);
  const barH = 18, gap = 4, labelW = 220, numW = 90, chartW = 460;
  const height = data.length * (barH + gap) + 20;
  return (
    <svg width="100%" viewBox={`0 0 ${labelW + chartW + numW} ${height}`} style={{ fontSize: 10 }}>
      {data.map((d, i) => {
        const cell = d.byYear[primaryYear] ?? { revenue: 0, capital: 0, total: 0 };
        const y = i * (barH + gap) + 10;
        const revW = splitRevCap ? (cell.revenue / maxVal) * chartW : 0;
        const capW = splitRevCap ? (cell.capital / maxVal) * chartW : 0;
        const totW = !splitRevCap ? (cell.total / maxVal) * chartW : 0;
        return (
          <g key={d.key}>
            <text x={labelW - 6} y={y + barH / 2 + 3} textAnchor="end" className="fill-muted-foreground" fontSize={10}>
              {d.name.length > 32 ? d.name.slice(0, 30) + "…" : d.name}
            </text>
            {splitRevCap && <rect x={labelW} y={y} width={Math.max(revW, 1)} height={barH * 0.5} fill={REV} rx={2} />}
            {splitRevCap && <rect x={labelW} y={y + barH * 0.5 + 1} width={Math.max(capW, 1)} height={barH * 0.5 - 1} fill={CAP} rx={2} />}
            {!splitRevCap && <rect x={labelW} y={y} width={Math.max(totW, 1)} height={barH} fill={TOT} rx={2} />}
            <text x={labelW + chartW + 6} y={y + barH / 2 + 3} className="fill-foreground" fontSize={10}>{fmtCompact(cell.total)}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------- main ----------
export default function ReportBuilder() {
  const [dataset, setDataset] = useState<Dataset>("dgs");
  const [years, setYears] = useState<Record<YearKey, boolean>>({
    actuals2425: false, be2526: false, re2526: false, be2627: true,
  });
  const [splitRevCap, setSplitRevCap] = useState(true);
  const [showPct, setShowPct] = useState(false);
  const [sortKey, setSortKey] = useState("primary_desc");
  const [search, setSearch] = useState("");
  const [showChart, setShowChart] = useState(true);

  // build rows for the chosen dataset
  const allRows: Row[] = useMemo(() => {
    if (dataset === "expbudget") return buildExpBudget();
    if (dataset === "ddg") return buildDDG();
    return buildDGs();
  }, [dataset]);

  // ministry list & per-row selection
  const ministryList = useMemo(
    () => Array.from(new Set(allRows.map(r => r.ministry))).sort(),
    [allRows]
  );
  const ministryColor: Record<string, string> = useMemo(
    () => Object.fromEntries(ministryList.map((m, i) => [m, MCOLORS[i % MCOLORS.length]])),
    [ministryList]
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  // initialize / reset selection when dataset changes
  useMemo(() => { setSelected(new Set(allRows.map(r => r.key))); }, [allRows]);

  const toggleRow = (k: string) => setSelected(prev => {
    const s = new Set(prev); s.has(k) ? s.delete(k) : s.add(k); return s;
  });
  const selectAll = (v: boolean) => setSelected(v ? new Set(allRows.map(r => r.key)) : new Set());

  // year availability per dataset
  const yearAvailable = (y: YearKey) => dataset === "ddg" ? YEAR_META.find(m => m.key === y)!.ddg : true;
  const activeYears = YEAR_META.filter(y => years[y.key] && yearAvailable(y.key));
  const primaryYear: YearKey = activeYears[activeYears.length - 1]?.key ?? "be2627";

  const sorted = useMemo(() => {
    const filtered = allRows
      .filter(r => selected.has(r.key))
      .filter(r => !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.ministry.toLowerCase().includes(search.toLowerCase()));
    const valOf = (r: Row, y: YearKey, k: keyof Cell = "total") => r.byYear[y]?.[k] ?? 0;
    if (sortKey === "primary_desc") filtered.sort((a, b) => valOf(b, primaryYear) - valOf(a, primaryYear));
    else if (sortKey === "primary_asc") filtered.sort((a, b) => valOf(a, primaryYear) - valOf(b, primaryYear));
    else if (sortKey === "rev_desc") filtered.sort((a, b) => valOf(b, primaryYear, "revenue") - valOf(a, primaryYear, "revenue"));
    else if (sortKey === "cap_desc") filtered.sort((a, b) => valOf(b, primaryYear, "capital") - valOf(a, primaryYear, "capital"));
    else if (sortKey === "name_asc") filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [allRows, selected, sortKey, search, primaryYear]);

  // totals across selected rows for each active year
  const totalsByYear: Record<string, Cell> = useMemo(() => {
    const out: Record<string, Cell> = {};
    for (const y of activeYears) {
      const acc: Cell = { revenue: 0, capital: 0, total: 0 };
      for (const r of sorted) {
        const c = r.byYear[y.key];
        if (!c) continue;
        acc.revenue += c.revenue; acc.capital += c.capital; acc.total += c.total;
      }
      out[y.key] = acc;
    }
    return out;
  }, [sorted, activeYears]);

  const primaryTotal = totalsByYear[primaryYear] ?? { revenue: 0, capital: 0, total: 0 };

  const exportCSV = () => {
    const head = ["Key", "Name", "Ministry"];
    for (const y of activeYears) {
      if (splitRevCap) { head.push(`${y.short} Rev`, `${y.short} Cap`); }
      head.push(`${y.short} Total`);
    }
    if (showPct) head.push(`% of Budget (${YEAR_META.find(m => m.key === primaryYear)!.short})`);
    const lines = [head.join(",")];
    for (const r of sorted) {
      const row = [r.key, `"${r.name.replace(/"/g, '""')}"`, r.ministry];
      for (const y of activeYears) {
        const c = r.byYear[y.key] ?? { revenue: 0, capital: 0, total: 0 };
        if (splitRevCap) row.push(String(c.revenue), String(c.capital));
        row.push(String(c.total));
      }
      if (showPct) {
        const t = r.byYear[primaryYear]?.total ?? 0;
        row.push(((t / GRAND) * 100).toFixed(4));
      }
      lines.push(row.join(","));
    }
    const b = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(b);
    a.download = `koshtha_${dataset}.csv`; a.click();
  };

  return (
    <div className="text-sm">
      {/* TOP BAR */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-medium">Report builder</span>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary">
            {DATASETS.find(d => d.key === dataset)!.label}
          </span>
          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
            {sorted.length} row{sorted.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {([
            ["primary_desc", `${YEAR_META.find(y=>y.key===primaryYear)!.short} ↓`],
            ["rev_desc", "Revenue ↓"],
            ["cap_desc", "Capital ↓"],
            ["name_asc", "Name A–Z"],
          ] as [string, string][]).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              className={`rounded-md border px-2.5 py-1 text-[11px] transition-colors ${
                sortKey === k
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >{l}</button>
          ))}
        </div>
      </div>

      {/* DATASET TABS */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        {DATASETS.map(d => {
          const on = dataset === d.key;
          return (
            <button
              key={d.key}
              onClick={() => setDataset(d.key)}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                on ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-accent"
              }`}
            >
              <div className={`text-[12px] font-medium ${on ? "text-primary" : "text-foreground"}`}>{d.label}</div>
              <div className="text-[10px] text-muted-foreground">{d.sub}</div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-[240px_1fr]">
        {/* LEFT */}
        <div className="space-y-2">
          {/* YEARS */}
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.07em] text-muted-foreground">Years</div>
            {YEAR_META.map(y => {
              const avail = yearAvailable(y.key);
              const on = years[y.key] && avail;
              return (
                <button
                  key={y.key}
                  disabled={!avail}
                  onClick={() => setYears(s => ({ ...s, [y.key]: !s[y.key] }))}
                  className={`mb-1 flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-[11px] transition-colors ${
                    on ? "border-primary bg-primary/10 text-primary" :
                    avail ? "border-border bg-transparent text-muted-foreground hover:bg-accent" :
                    "cursor-not-allowed border-dashed border-border bg-muted/40 text-muted-foreground/50"
                  }`}
                >
                  <span>{y.long}</span>
                  {!avail && <span className="text-[9px]">n/a</span>}
                </button>
              );
            })}
            <div className="mt-2 border-t border-border pt-2">
              <label className="mb-1 flex cursor-pointer items-center gap-2 text-[11px]">
                <input type="checkbox" checked={splitRevCap} onChange={() => setSplitRevCap(v => !v)} className="accent-primary" />
                Split Revenue / Capital
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-[11px]">
                <input type="checkbox" checked={showPct} onChange={() => setShowPct(v => !v)} className="accent-primary" />
                Show % of budget
              </label>
            </div>
          </div>

          {/* ROWS picker */}
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.07em] text-muted-foreground">
              {dataset === "expbudget" ? "Ministries" : dataset === "ddg" ? "Line items" : "Demands"}
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="mb-1.5 w-full rounded-md border border-border bg-background px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="mb-1.5 flex justify-between text-[10px]">
              <button onClick={() => selectAll(true)} className="text-primary hover:underline">Select all</button>
              <button onClick={() => selectAll(false)} className="text-primary hover:underline">Clear</button>
            </div>
            <div className="max-h-80 overflow-y-auto pr-1">
              {ministryList.map(m => {
                const ds = allRows.filter(r => r.ministry === m &&
                  (!search || r.name.toLowerCase().includes(search.toLowerCase()) || m.toLowerCase().includes(search.toLowerCase())));
                if (!ds.length) return null;
                return (
                  <div key={m}>
                    <div className="px-0 pb-0.5 pt-1 text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{m}</div>
                    {ds.map(r => (
                      <label key={r.key} className="flex cursor-pointer items-center gap-1.5 py-0.5 text-[11px] text-foreground">
                        <input type="checkbox" checked={selected.has(r.key)} onChange={() => toggleRow(r.key)} className="accent-primary" />
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ministryColor[m] }} />
                        <span className="leading-tight">{r.name}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div>
          {/* STATS */}
          <div className="mb-2.5 grid grid-cols-3 gap-2">
            {([["Revenue", primaryTotal.revenue, REV], ["Capital", primaryTotal.capital, CAP], ["Total", primaryTotal.total, TOT]] as const).map(([label, val, col]) => (
              <div key={label} className="rounded-lg bg-muted px-3 py-2.5">
                <div className="mb-0.5 text-[10px] uppercase tracking-[0.07em] text-muted-foreground">
                  {label} · {YEAR_META.find(y => y.key === primaryYear)!.short}
                </div>
                <div className="text-[17px] font-medium" style={{ color: col }}>{fmtCompact(val)}</div>
                {label === "Total" && (
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {((val / GRAND) * 100).toFixed(1)}% of Union Budget
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CHART */}
          <div className="mb-2.5 rounded-xl border border-border bg-card p-3">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex gap-3 text-[11px] text-foreground">
                <span className="text-muted-foreground">Chart year:</span>
                <strong>{YEAR_META.find(y => y.key === primaryYear)!.long}</strong>
                {splitRevCap ? (
                  <>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: REV }} />Revenue</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: CAP }} />Capital</span>
                  </>
                ) : (
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: TOT }} />Total</span>
                )}
              </div>
              <button
                onClick={() => setShowChart(x => !x)}
                className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
              >{showChart ? "Hide chart" : "Show chart"}</button>
            </div>
            {showChart && sorted.length > 0 && <BarChart data={sorted.slice(0, 20)} primaryYear={primaryYear} splitRevCap={splitRevCap} />}
            {showChart && sorted.length === 0 && (
              <div className="p-8 text-center text-[12px] text-muted-foreground">No rows selected</div>
            )}
          </div>

          {/* TABLE */}
          <div className="mb-2.5 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full border-collapse text-[11.5px]">
              <thead>
                <tr className="bg-muted">
                  <th className="border-b border-border px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Item</th>
                  {activeYears.map(y => (
                    <>
                      {splitRevCap && (
                        <>
                          <th key={y.key + "r"} className="border-b border-l border-border px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: REV }}>{y.short} Rev</th>
                          <th key={y.key + "c"} className="border-b border-border px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: CAP }}>{y.short} Cap</th>
                        </>
                      )}
                      <th key={y.key + "t"} className={`border-b border-border px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-[0.06em] ${splitRevCap ? "" : "border-l"}`} style={{ color: TOT }}>{y.short} Total</th>
                    </>
                  ))}
                  {showPct && <th className="border-b border-l border-border px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: PCT }}>% Budget</th>}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={1 + activeYears.length * (splitRevCap ? 3 : 1) + (showPct ? 1 : 0)} className="p-8 text-center text-muted-foreground">No rows selected</td></tr>
                ) : sorted.map(r => (
                  <tr key={r.key} className="border-b border-border last:border-0">
                    <td className="px-2 py-1.5">
                      <span className="mr-1.5 rounded px-1.5 py-px text-[10px] font-medium"
                            style={{ background: ministryColor[r.ministry] + "22", color: ministryColor[r.ministry] }}>
                        {r.ministry}
                      </span>
                      {r.name}
                    </td>
                    {activeYears.map(y => {
                      const c = r.byYear[y.key] ?? { revenue: 0, capital: 0, total: 0 };
                      return (
                        <>
                          {splitRevCap && (
                            <>
                              <td key={y.key + "r"} className="border-l border-border px-2 py-1.5 text-right">{fmtNum(c.revenue)}</td>
                              <td key={y.key + "c"} className="px-2 py-1.5 text-right">{fmtNum(c.capital)}</td>
                            </>
                          )}
                          <td key={y.key + "t"} className={`px-2 py-1.5 text-right font-medium ${splitRevCap ? "" : "border-l border-border"}`}>{fmtNum(c.total)}</td>
                        </>
                      );
                    })}
                    {showPct && (
                      <td className="border-l border-border px-2 py-1.5 text-right" style={{ color: PCT }}>
                        {(((r.byYear[primaryYear]?.total ?? 0) / GRAND) * 100).toFixed(3)}%
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* EXPORT */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={exportCSV} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-transparent px-3 py-1.5 text-[12px] hover:bg-accent">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-transparent px-3 py-1.5 text-[12px] hover:bg-accent">
              <Printer className="h-3.5 w-3.5" /> Print / PDF
            </button>
            <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: REV }} />
              Selected total ({YEAR_META.find(y => y.key === primaryYear)!.short}):
              <strong className="text-foreground">{fmtCompact(primaryTotal.total)}</strong>
              <span>({((primaryTotal.total / GRAND) * 100).toFixed(1)}% of {fmtCompact(GRAND)})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
