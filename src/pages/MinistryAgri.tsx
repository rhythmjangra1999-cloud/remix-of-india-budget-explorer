import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Sparkles, XOctagon } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AgriSunburst } from "@/components/explorer/agri/AgriSunburst";
import { AgriTable } from "@/components/explorer/agri/AgriTable";
import { MajorHeadTable } from "@/components/explorer/agri/MajorHeadTable";
import { DemandsOverview } from "@/components/explorer/agri/DemandsOverview";
import {
  ALL_AGRI,
  buildHierarchy,
  computeKpis,
  filterRows,
  getMajorHeads,
  topMovers,
  type DemandFilter,
} from "@/lib/agri";
import { formatCr } from "@/lib/format";

const MinistryAgri = () => {
  const [demand, setDemand] = useState<DemandFilter>("all");
  const [section, setSection] = useState<"all" | "Revenue" | "Capital">("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const rows = useMemo(() => {
    const base = filterRows(demand);
    return section === "all" ? base : base.filter((r) => r.section === section);
  }, [demand, section]);

  const kpis = useMemo(() => computeKpis(rows), [rows]);
  const root = useMemo(() => buildHierarchy(rows), [rows]);
  const movers = useMemo(() => topMovers(rows), [rows]);
  const majorHeads = useMemo(() => getMajorHeads(rows), [rows]);

  const flagged = useMemo(() => ALL_AGRI.filter((r) => r.gapFlag), []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-border">
          <div className="container py-8">
            <Link to="/explorer" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Explorer
            </Link>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-primary font-medium">Ministry · Agriculture</div>
                <h1 className="mt-2 font-serif text-3xl md:text-4xl font-semibold leading-tight">
                  Ministry of Agriculture & Farmers Welfare
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  BE 2026-27 · DAFW + DARE · object-head level · {ALL_AGRI.length} budget lines validated
                </p>
              </div>

              {/* Filter chips */}
              <div className="flex flex-wrap items-center gap-2">
                <FilterChip active={demand === "all"} onClick={() => setDemand("all")}>Both depts</FilterChip>
                <FilterChip active={demand === "d001"} onClick={() => setDemand("d001")}>DAFW</FilterChip>
                <FilterChip active={demand === "d002"} onClick={() => setDemand("d002")}>DARE</FilterChip>
                <span className="mx-2 h-4 w-px bg-border" />
                <FilterChip active={section === "all"} onClick={() => setSection("all")}>All</FilterChip>
                <FilterChip active={section === "Revenue"} onClick={() => setSection("Revenue")}>Revenue</FilterChip>
                <FilterChip active={section === "Capital"} onClick={() => setSection("Capital")}>Capital</FilterChip>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="border-b border-border bg-card">
          <div className="container py-6 grid grid-cols-2 md:grid-cols-5 gap-px bg-border rounded-sm overflow-hidden border border-border">
            <Kpi label="Total BE 26-27" value={formatCr(kpis.total)} sub={`${kpis.rowCount} lines`} />
            <Kpi label="YoY vs BE 25-26" value={`${kpis.yoyPct >= 0 ? "+" : ""}${kpis.yoyPct.toFixed(1)}%`} sub={`prev ${formatCr(kpis.prev, { compact: true })}`} positive={kpis.yoyPct >= 0} />
            <Kpi label="Revenue" value={formatCr(kpis.revenue, { compact: true })} sub={`${kpis.revenueShare.toFixed(1)}%`} />
            <Kpi label="Capital" value={formatCr(kpis.capital, { compact: true })} sub={`${(100 - kpis.revenueShare).toFixed(1)}%`} />
            <Kpi label="Data flags" value={String(kpis.flaggedCount)} sub={`${kpis.newCount} new · ${kpis.discontinuedCount} discontinued`} />
          </div>
        </section>

        {/* Main content */}
        <section className="container py-8">
          <Tabs defaultValue="explore">
            <TabsList className="bg-secondary/60">
              <TabsTrigger value="explore">Sunburst + Table</TabsTrigger>
              <TabsTrigger value="demands">Demands overview</TabsTrigger>
              <TabsTrigger value="major">Major heads</TabsTrigger>
              <TabsTrigger value="movers">Top movers</TabsTrigger>
              <TabsTrigger value="quality">Data quality</TabsTrigger>
            </TabsList>

            {/* Explore */}
            <TabsContent value="explore" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="rounded-sm border border-border bg-card p-4 flex items-center justify-center">
                  <AgriSunburst root={root} selectedKey={selectedKey} onSelect={setSelectedKey} />
                </div>
                <div className="min-h-[560px] flex flex-col">
                  <AgriTable root={root} selectedKey={selectedKey} onSelect={setSelectedKey} />
                </div>
              </div>
            </TabsContent>

            {/* Demands overview — 4-year mini-bars per demand */}
            <TabsContent value="demands" className="mt-6">
              <DemandsOverview section={section} />
              <p className="mt-4 text-xs text-muted-foreground">
                4-year trajectory per demand. Bars: Actuals 24-25 · BE 25-26 · RE 25-26 · BE 26-27 (highlighted).
                YoY % compares BE 26-27 vs BE 25-26.
              </p>
            </TabsContent>

            {/* Major heads — sortable, filterable, CSV export */}
            <TabsContent value="major" className="mt-6">
              <MajorHeadTable rows={majorHeads} />
              <p className="mt-3 text-xs text-muted-foreground">
                Aggregated to Major Head × Section. Click column headers to sort. Use the search to filter.
              </p>
            </TabsContent>

            {/* Movers */}
            <TabsContent value="movers" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <MoversCard title="Largest hikes" tone="up" rows={movers.hikes} />
                <MoversCard title="Largest cuts" tone="down" rows={movers.cuts} />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Aggregated at the Minor-Head level. Bases below ₹100 cr excluded — small-base YoY % is unstable.
              </p>
            </TabsContent>

            {/* Data quality */}
            <TabsContent value="quality" className="mt-6">
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <FlagCard icon={Sparkles} label="NEW lines" count={ALL_AGRI.filter((r) => r.gapFlag === "NEW").length} dek="Created in BE 2026-27 with no prior allocation." tone="success" />
                <FlagCard icon={XOctagon} label="DISCONTINUED" count={ALL_AGRI.filter((r) => r.gapFlag === "DISCONTINUED").length} dek="No BE 2026-27 despite prior allocation." tone="danger" />
                
                <FlagCard icon={AlertTriangle} label="TOKEN" count={ALL_AGRI.filter((r) => r.gapFlag === "TOKEN").length} dek="Base < ₹10 lakh — placeholder allocation." tone="warn" />
              </div>

              <div className="rounded-sm border border-border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Flag</th>
                      <th className="text-left px-3 py-2 font-medium">Code</th>
                      <th className="text-left px-3 py-2 font-medium">Description</th>
                      <th className="text-right px-3 py-2 font-medium">BE 25-26</th>
                      <th className="text-right px-3 py-2 font-medium">BE 26-27</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {flagged.slice(0, 50).map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30">
                        <td className="px-3 py-1.5">
                          <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                            r.gapFlag === "NEW" ? "bg-green-500/15 text-green-700 dark:text-green-400" :
                            r.gapFlag === "DISCONTINUED" ? "bg-red-500/15 text-red-700 dark:text-red-400" :
                            "bg-muted text-muted-foreground"
                          }`}>{r.gapFlag?.toLowerCase()}</span>
                        </td>
                        <td className="px-3 py-1.5 font-mono text-[11px] text-muted-foreground">{r.id}</td>
                        <td className="px-3 py-1.5">{r.subHeadName} <span className="text-muted-foreground">· {r.objectHeadName}</span></td>
                        <td className="px-3 py-1.5 text-right tnum font-mono text-xs">{r.be2526 != null ? formatCr(r.be2526, { compact: true }) : "—"}</td>
                        <td className="px-3 py-1.5 text-right tnum font-mono text-xs">{r.be2627 != null ? formatCr(r.be2627, { compact: true }) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {flagged.length > 50 && (
                  <div className="p-3 text-xs text-muted-foreground text-center border-t border-border">
                    Showing 50 of {flagged.length} flagged lines.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-sm border transition-colors ${
        active ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Kpi({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="bg-card p-4">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={`mt-1 font-serif text-xl md:text-2xl font-semibold tnum ${
        positive === true ? "text-green-700 dark:text-green-400" :
        positive === false ? "text-red-700 dark:text-red-400" : ""
      }`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function MoversCard({ title, tone, rows }: { title: string; tone: "up" | "down"; rows: ReturnType<typeof topMovers>["hikes"] }) {
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{title}</div>
      <ul className="mt-4 divide-y divide-border">
        {rows.map((r, i) => (
          <li key={i} className="py-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium leading-tight">{r.minorHeadName}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{r.majorHeadName}</div>
            </div>
            <div className="text-right shrink-0">
              <div className={`font-mono text-sm tnum ${tone === "up" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                {tone === "up" ? "+" : ""}{formatCr(Math.round(r.delta), { compact: true })}
              </div>
              <div className="text-[10px] text-muted-foreground tnum">{r.pct >= 0 ? "+" : ""}{r.pct.toFixed(1)}%</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FlagCard({ icon: Icon, label, count, dek, tone }: { icon: typeof AlertTriangle; label: string; count: number; dek: string; tone: "success" | "danger" | "warn" }) {
  const colors = tone === "success" ? "text-green-700 dark:text-green-400 bg-green-500/10" :
    tone === "danger" ? "text-red-700 dark:text-red-400 bg-red-500/10" :
    "text-amber-700 dark:text-amber-400 bg-amber-500/10";
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <div className={`inline-flex items-center justify-center h-8 w-8 rounded-sm ${colors}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 font-serif text-2xl font-semibold tnum">{count}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
      <div className="text-xs text-foreground/70 mt-2 leading-relaxed">{dek}</div>
    </div>
  );
}

export default MinistryAgri;
