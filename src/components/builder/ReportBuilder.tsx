import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";

const GRAND = 5347314.81;

type Demand = { no: number; name: string; ministry: string; revenue: number; capital: number; total: number };

const DEMANDS: Demand[] = [
  { no: 1, name: "Dept. of Agriculture & Farmers Welfare", ministry: "Agriculture", revenue: 130451.62, capital: 109.76, total: 130561.38 },
  { no: 2, name: "Dept. of Agricultural Research & Education", ministry: "Agriculture", revenue: 9964.95, capital: 2.45, total: 9967.40 },
  { no: 3, name: "Atomic Energy", ministry: "Atomic Energy", revenue: 14157.51, capital: 9966.41, total: 24123.92 },
  { no: 4, name: "Ministry of Ayush", ministry: "Ayush", revenue: 4381.86, capital: 27.07, total: 4408.93 },
  { no: 6, name: "Dept. of Fertilisers", ministry: "Chemicals", revenue: 170935.64, capital: 8.89, total: 170944.53 },
  { no: 7, name: "Dept. of Pharmaceuticals", ministry: "Chemicals", revenue: 5929.42, capital: 1.80, total: 5931.22 },
  { no: 13, name: "Dept. of Telecommunications", ministry: "Communications", revenue: 26716.02, capital: 47274.92, total: 73990.94 },
  { no: 15, name: "Dept. of Food & Public Distribution", ministry: "Consumer Affairs", revenue: 235024.58, capital: 22.62, total: 235047.20 },
  { no: 19, name: "Ministry of Defence (Civil)", ministry: "Defence", revenue: 16851.36, capital: 11703.25, total: 28554.61 },
  { no: 20, name: "Defence Services (Revenue)", ministry: "Defence", revenue: 365478.98, capital: 0, total: 365478.98 },
  { no: 21, name: "Capital Outlay on Defence", ministry: "Defence", revenue: 0, capital: 219306.47, total: 219306.47 },
  { no: 22, name: "Defence Pensions", ministry: "Defence", revenue: 171338.22, capital: 0, total: 171338.22 },
  { no: 25, name: "Dept. of School Education & Literacy", ministry: "Education", revenue: 83561.41, capital: 0.85, total: 83562.26 },
  { no: 26, name: "Dept. of Higher Education", ministry: "Education", revenue: 55724.54, capital: 2.68, total: 55727.22 },
  { no: 27, name: "Ministry of Electronics & IT", ministry: "MEITY", revenue: 21234.15, capital: 398.81, total: 21632.96 },
  { no: 29, name: "Ministry of External Affairs", ministry: "External Affairs", revenue: 20706.20, capital: 1412.77, total: 22118.97 },
  { no: 39, name: "Interest Payments", ministry: "Finance", revenue: 1403971.79, capital: 0, total: 1403971.79 },
  { no: 41, name: "Pensions", ministry: "Finance", revenue: 97500.00, capital: 0, total: 97500.00 },
  { no: 42, name: "Transfers to States", ministry: "Finance", revenue: 167801.61, capital: 226381.91, total: 394183.52 },
  { no: 46, name: "Dept. of Health & Family Welfare", ministry: "Health", revenue: 98780.91, capital: 2928.30, total: 101709.21 },
  { no: 51, name: "Police", ministry: "Home Affairs", revenue: 152530.06, capital: 21272.47, total: 173802.53 },
  { no: 58, name: "Transfers to J&K", ministry: "Home Affairs", revenue: 43290.29, capital: 0, total: 43290.29 },
  { no: 60, name: "Ministry of Housing & Urban Affairs", ministry: "Housing", revenue: 50714.32, capital: 34808.07, total: 85522.39 },
  { no: 63, name: "Dept. of Drinking Water & Sanitation", ministry: "Jal Shakti", revenue: 74893.66, capital: 1.20, total: 74894.86 },
  { no: 64, name: "Ministry of Labour & Employment", ministry: "Labour", revenue: 32625.33, capital: 40.98, total: 32666.31 },
  { no: 68, name: "Ministry of MSME", ministry: "MSME", revenue: 22647.26, capital: 1919.01, total: 24566.27 },
  { no: 71, name: "Ministry of Renewable Energy", ministry: "Renewable Energy", revenue: 32911.14, capital: 3.53, total: 32914.67 },
  { no: 76, name: "Ministry of Petroleum & Natural Gas", ministry: "Petroleum", revenue: 30204.77, capital: 238.45, total: 30443.22 },
  { no: 79, name: "Ministry of Power", ministry: "Power", revenue: 29635.83, capital: 361.02, total: 29996.85 },
  { no: 85, name: "Ministry of Railways", ministry: "Railways", revenue: 3547.32, capital: 277830.00, total: 281377.32 },
  { no: 86, name: "Ministry of Road Transport & Highways", ministry: "Roads", revenue: 15707.85, capital: 294167.45, total: 309875.30 },
  { no: 87, name: "Dept. of Rural Development", ministry: "Rural Dev.", revenue: 194364.18, capital: 4.63, total: 194368.81 },
  { no: 89, name: "Dept. of Science & Technology", ministry: "Science & Tech", revenue: 7963.94, capital: 20085.38, total: 28049.32 },
  { no: 95, name: "Dept. of Space", ministry: "Space", revenue: 7329.71, capital: 6375.92, total: 13705.63 },
  { no: 100, name: "Ministry of Tribal Affairs", ministry: "Tribal Affairs", revenue: 15389.54, capital: 32.43, total: 15421.97 },
  { no: 101, name: "Ministry of Women & Child Development", ministry: "WCD", revenue: 28177.42, capital: 5.64, total: 28183.06 },
  { no: 102, name: "Ministry of Youth Affairs & Sports", ministry: "Youth & Sports", revenue: 4461.51, capital: 18.37, total: 4479.88 },
];

// Use HSL colors aligned with project palette (chart-1..5 + accent oranges/purples)
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
const ministryList = Array.from(new Set(DEMANDS.map(d => d.ministry))).sort();
const ministryColor: Record<string, string> = Object.fromEntries(
  ministryList.map((m, i) => [m, MCOLORS[i % MCOLORS.length]])
);

const fmtNum = (v: number) => !v ? "—" : v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCompact = (v: number) => v >= 100000 ? `₹${(v / 100000).toFixed(2)} L Cr` : v >= 1000 ? `₹${(v / 1000).toFixed(1)}K Cr` : `₹${fmtNum(v)} Cr`;

type Metrics = { rev: boolean; cap: boolean; tot: boolean; pct: boolean };

function BarChart({ data, metrics }: { data: Demand[]; metrics: Metrics }) {
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const barH = 18, gap = 4, labelW = 200, numW = 90;
  const chartW = 460;
  const height = data.length * (barH + gap) + 20;
  return (
    <svg width="100%" viewBox={`0 0 ${labelW + chartW + numW} ${height}`} style={{ fontSize: 10 }}>
      {data.map((d, i) => {
        const y = i * (barH + gap) + 10;
        const showSplit = metrics.rev || metrics.cap;
        const revW = metrics.rev ? (d.revenue / maxVal) * chartW : 0;
        const capW = metrics.cap ? (d.capital / maxVal) * chartW : 0;
        const totW = (!showSplit && metrics.tot) ? (d.total / maxVal) * chartW : 0;
        return (
          <g key={d.no}>
            <text x={labelW - 6} y={y + barH / 2 + 3} textAnchor="end" className="fill-muted-foreground" fontSize={10}>
              {d.name.length > 30 ? d.name.slice(0, 28) + "…" : d.name}
            </text>
            {metrics.rev && <rect x={labelW} y={y} width={Math.max(revW, 1)} height={barH * 0.5} fill={REV} rx={2} />}
            {metrics.cap && <rect x={labelW} y={y + barH * 0.5 + 1} width={Math.max(capW, 1)} height={barH * 0.5 - 1} fill={CAP} rx={2} />}
            {totW > 0 && <rect x={labelW} y={y} width={Math.max(totW, 1)} height={barH} fill={TOT} rx={2} />}
            <text x={labelW + chartW + 6} y={y + barH / 2 + 3} className="fill-foreground" fontSize={10}>{fmtCompact(d.total)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function ReportBuilder() {
  const [selected, setSelected] = useState<Set<number>>(new Set(DEMANDS.map(d => d.no)));
  const [metrics, setMetrics] = useState<Metrics>({ rev: true, cap: true, tot: true, pct: false });
  const [sortKey, setSortKey] = useState("total_desc");
  const [search, setSearch] = useState("");
  const [showChart, setShowChart] = useState(true);

  const toggleDemand = (no: number) => setSelected(prev => {
    const s = new Set(prev); s.has(no) ? s.delete(no) : s.add(no); return s;
  });
  const selectAll = (v: boolean) => setSelected(v ? new Set(DEMANDS.map(d => d.no)) : new Set());
  const toggleMetric = (k: keyof Metrics) => setMetrics(m => ({ ...m, [k]: !m[k] }));

  const sorted = useMemo(() => {
    const ds = DEMANDS.filter(d => selected.has(d.no));
    if (sortKey === "total_desc") ds.sort((a, b) => b.total - a.total);
    else if (sortKey === "total_asc") ds.sort((a, b) => a.total - b.total);
    else if (sortKey === "revenue_desc") ds.sort((a, b) => b.revenue - a.revenue);
    else if (sortKey === "capital_desc") ds.sort((a, b) => b.capital - a.capital);
    else if (sortKey === "name_asc") ds.sort((a, b) => a.name.localeCompare(b.name));
    return ds;
  }, [selected, sortKey]);

  const totR = sorted.reduce((a, d) => a + d.revenue, 0);
  const totC = sorted.reduce((a, d) => a + d.capital, 0);
  const totT = sorted.reduce((a, d) => a + d.total, 0);
  const maxT = Math.max(...sorted.map(d => d.total), 1);

  const filteredList = useMemo(() =>
    DEMANDS.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.ministry.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const exportCSV = () => {
    const cols = ["No", "Demand", "Ministry", "Revenue (₹ Cr)", "Capital (₹ Cr)", "Total (₹ Cr)", "% of Budget"];
    const rows = [cols.join(","), ...sorted.map(d =>
      [d.no, `"${d.name}"`, d.ministry, d.revenue, d.capital, d.total, ((d.total / GRAND) * 100).toFixed(4)].join(",")
    )];
    const b = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(b);
    a.download = "koshtha_BE2026-27.csv"; a.click();
  };

  const sortBtns: [string, string][] = [
    ["total_desc", "Total ↓"], ["revenue_desc", "Revenue ↓"], ["capital_desc", "Capital ↓"], ["name_asc", "Name A–Z"],
  ];
  const metricCfg: [keyof Metrics, string, string][] = [
    ["rev", REV, "Revenue"], ["cap", CAP, "Capital"], ["tot", TOT, "Total"], ["pct", PCT, "% of budget"],
  ];

  return (
    <div className="text-sm">
      {/* Header */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-medium">Report builder</span>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary">BE 2026-27</span>
          <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
            {sorted.length} demand{sorted.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex gap-1.5">
          {sortBtns.map(([k, l]) => (
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

      <div className="grid gap-3 md:grid-cols-[220px_1fr]">
        {/* LEFT */}
        <div className="space-y-2">
          {/* Columns */}
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.07em] text-muted-foreground">Columns</div>
            {metricCfg.map(([k, c, l]) => {
              const on = metrics[k];
              return (
                <button
                  key={k}
                  onClick={() => toggleMetric(k)}
                  className="mb-1 flex w-full items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] transition-colors"
                  style={{
                    borderColor: on ? c : "hsl(var(--border))",
                    background: on ? c + "22" : "transparent",
                    color: on ? c : "hsl(var(--muted-foreground))",
                  }}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-sm" style={{ background: c }} />
                  {l}
                </button>
              );
            })}
          </div>

          {/* Demand selector */}
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.07em] text-muted-foreground">Demands</div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="mb-1.5 w-full rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="mb-1.5 flex justify-between text-[10px]">
              <button onClick={() => selectAll(true)} className="text-primary hover:underline">Select all</button>
              <button onClick={() => selectAll(false)} className="text-primary hover:underline">Clear</button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {ministryList.map(m => {
                const ds = filteredList.filter(d => d.ministry === m);
                if (!ds.length) return null;
                return (
                  <div key={m}>
                    <div className="px-0 pb-0.5 pt-1 text-[9.5px] font-medium uppercase tracking-[0.06em] text-muted-foreground">{m}</div>
                    {ds.map(d => (
                      <label key={d.no} className="flex cursor-pointer items-center gap-1.5 py-0.5 text-[11px] text-foreground">
                        <input
                          type="checkbox"
                          checked={selected.has(d.no)}
                          onChange={() => toggleDemand(d.no)}
                          className="cursor-pointer accent-primary"
                        />
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ministryColor[m] }} />
                        <span className="leading-tight">{d.name}</span>
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
          {/* Stats */}
          <div className="mb-2.5 grid grid-cols-3 gap-2">
            {([["Revenue", fmtCompact(totR), REV], ["Capital", fmtCompact(totC), CAP], ["Total", fmtCompact(totT), TOT]] as const).map(([label, val, col]) => (
              <div key={label} className="rounded-lg bg-muted px-3 py-2.5">
                <div className="mb-0.5 text-[10px] uppercase tracking-[0.07em] text-muted-foreground">{label}</div>
                <div className="text-[17px] font-medium" style={{ color: col }}>{val}</div>
                {label === "Total" && (
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {((totT / GRAND) * 100).toFixed(1)}% of Union Budget
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="mb-2.5 rounded-xl border border-border bg-card p-3">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex gap-2 text-[11px] text-foreground">
                {metrics.rev && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: REV }} />Revenue</span>}
                {metrics.cap && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ background: CAP }} />Capital</span>}
              </div>
              <button
                onClick={() => setShowChart(x => !x)}
                className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {showChart ? "Hide chart" : "Show chart"}
              </button>
            </div>
            {showChart && sorted.length > 0 && <BarChart data={sorted.slice(0, 20)} metrics={metrics} />}
            {showChart && sorted.length === 0 && (
              <div className="p-8 text-center text-[12px] text-muted-foreground">No demands selected</div>
            )}
          </div>

          {/* Table */}
          <div className="mb-2.5 overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full table-fixed border-collapse text-[11.5px]">
              <thead>
                <tr className="bg-muted">
                  <th className="w-8 border-b border-border px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">#</th>
                  <th className="border-b border-border px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">Demand</th>
                  {metrics.rev && <th className="w-28 border-b border-border px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: REV }}>Revenue ₹ Cr</th>}
                  {metrics.cap && <th className="w-28 border-b border-border px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: CAP }}>Capital ₹ Cr</th>}
                  {metrics.tot && <th className="w-28 border-b border-border px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: TOT }}>Total ₹ Cr</th>}
                  {metrics.pct && <th className="w-20 border-b border-border px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-[0.06em]" style={{ color: PCT }}>% Budget</th>}
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No demands selected</td></tr>
                ) : sorted.map(d => (
                  <tr key={d.no} className="border-b border-border last:border-0">
                    <td className="px-2 py-1.5 text-right text-[10px] text-muted-foreground">{d.no}</td>
                    <td className="px-2 py-1.5 text-foreground">
                      <span
                        className="mr-1.5 rounded px-1.5 py-px text-[10px] font-medium"
                        style={{ background: ministryColor[d.ministry] + "22", color: ministryColor[d.ministry] }}
                      >{d.ministry}</span>
                      {d.name}
                    </td>
                    {metrics.rev && (
                      <td className="px-2 py-1.5 text-right">
                        {fmtNum(d.revenue)}
                        <span className="ml-1 inline-block h-1 rounded-sm align-middle opacity-60" style={{ background: REV, width: Math.round((d.revenue / maxT) * 40) + "px" }} />
                      </td>
                    )}
                    {metrics.cap && (
                      <td className="px-2 py-1.5 text-right">
                        {fmtNum(d.capital)}
                        <span className="ml-1 inline-block h-1 rounded-sm align-middle opacity-60" style={{ background: CAP, width: Math.round((d.capital / maxT) * 40) + "px" }} />
                      </td>
                    )}
                    {metrics.tot && <td className="px-2 py-1.5 text-right font-medium">{fmtNum(d.total)}</td>}
                    {metrics.pct && <td className="px-2 py-1.5 text-right" style={{ color: PCT }}>{((d.total / GRAND) * 100).toFixed(3)}%</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Export */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-transparent px-3 py-1.5 text-[12px] text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-transparent px-3 py-1.5 text-[12px] text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Printer className="h-3.5 w-3.5" /> Print / PDF
            </button>
            <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: REV }} />
              Selected total: <strong className="text-foreground">{fmtCompact(totT)}</strong>
              <span className="ml-1">({((totT / GRAND) * 100).toFixed(1)}% of ₹53.47 L Cr budget)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
