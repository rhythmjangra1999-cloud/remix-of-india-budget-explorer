import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { BudgetHistoryChart } from "@/components/home/BudgetHistoryChart";
import { BUDGET_META, FINDINGS, MINISTRIES, ministryById } from "@/lib/budget-data";
import { formatCr } from "@/lib/format";

const Index = () => {
  // Exclude Finance because Repayment of Debt + Interest Payments dwarf everything
  // and aren't really "ministry spending" — they're balance-sheet flows.
  const topMinistries = [...MINISTRIES]
    .filter((m) => m.id !== "mof")
    .sort((a, b) => (b.totals.FY27 ?? 0) - (a.totals.FY27 ?? 0))
    .slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="paper border-b border-border">
          <div className="container py-20 md:py-24">
            {/* Full-width heading + copy */}
            <div className="w-full">
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.04] tracking-tight">
                Trace the rupee. <span className="text-2xl md:text-3xl lg:text-4xl text-foreground/55 align-middle font-normal">The pulse of public spending.</span>
              </h1>

              <div className="mt-8 w-full space-y-5 text-lg text-foreground/75 leading-relaxed">
                <p>
                  The Union Budget allocates <span className="text-foreground font-medium tnum">₹53.47 lakh crore</span>. But knowing how much a ministry received tells you almost nothing. <span className="text-foreground font-medium">Koshtha</span> parses over 1,000 government documents (Demands for Grants, Detailed Demands, and scheme annexures) to map money from a ministry demand, through the schemes it funds, all the way to the states those schemes reach.
                </p>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  to="/explorer"
                  className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Open Explorer <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/methodology"
                  className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Read Tutorial
                </Link>
              </div>
            </div>

            {/* History chart — full width, below heading */}
            <div className="mt-14 border-t border-border pt-10">
              <BudgetHistoryChart />
            </div>

            {/* Headline figures — 3 stats */}
            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-px bg-border rounded-sm overflow-hidden border border-border">
              <Stat label="Union Budget BE 2026-27" value="₹53.47 lakh crore" />
              <Stat label="Source documents parsed" value="Over 1,000" />
              <Stat label="From budget to ministry to scheme to state" value="Four layers deep" />
            </div>
          </div>
        </section>

        {/* Single entry tile */}
        <section className="container py-20">
          <SectionHeader
            kicker="Start here"
            title="One way in"
            sub="Open the Union Budget at its most granular published level — ministry, demand, major head, sub-head, all the way down to the object head."
          />
          <div className="mt-10">
            <EntryTile
              n="01"
              title="Union Budget"
              dek={`Browse all ${BUDGET_META.ministriesCovered} ministries through a 4-year sunburst (FY24 → FY27). Drill from major head → sub-major → minor → object head, with YoY and CAGR side-by-side.`}
              to="/explorer?view=union"
            />
          </div>

          {/* Sub-tabs after Union Budget */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <SubTile n="02" title="Ministry" dek="Drill into any of the 56 ministries — demands, major heads, object heads." to="/explorer" />
            <SubTile n="03" title="Schemes" dek="Central Sector & Centrally-Sponsored schemes mapped from each ministry's DDG." to="/explorer?view=schemes" badge="Rolling out" />
            <SubTile n="04" title="State" dek="Estimated flows of central scheme money into each state's department budgets." to="/explorer?view=state" badge="Coming soon" />
          </div>
        </section>




        {/* Largest ministries strip */}
        <section className="border-y border-border bg-secondary/30">
          <div className="container py-16">
            <SectionHeader
              kicker="At a glance"
              title="The six largest ministry allocations in BE 2026-27"
              sub="Excludes the Ministry of Finance, whose 13 demands include Interest Payments and Repayment of Debt — accounting flows that dwarf real-economy spending."
            />
            <div className="mt-8 grid gap-px bg-border rounded-sm overflow-hidden border border-border md:grid-cols-3">
              {topMinistries.map((m, i) => (
                <Link
                  key={m.id}
                  to={`/explorer?ministry=${m.id}`}
                  className="bg-card p-6 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="font-mono text-xs text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="text-right">
                      <div className="font-serif text-xl tnum font-semibold">
                        {formatCr(m.totals.FY27 ?? 0, { compact: true })}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Gross</div>
                    </div>
                  </div>
                  <div className="mt-3 font-serif text-lg leading-snug group-hover:text-primary transition-colors">
                    {m.name}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {(((m.totals.FY27 ?? 0) / BUDGET_META.totalUnionBudgetCr) * 100).toFixed(1)}% of Union Budget
                    </span>
                    {m.netFY27 != null && (
                      <span className="tnum font-mono">
                        Net {formatCr(m.netFY27, { compact: true })}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured findings */}
        <section className="container py-20">
          <div className="flex items-end justify-between gap-6 mb-10">
            <SectionHeader
              kicker="Featured findings"
              title="What the object-head data reveals"
              sub="Stories that only become visible when you drill below the Demand-for-Grants summary."
            />
            <Link to="/findings" className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline whitespace-nowrap">
              All findings <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {FINDINGS.map((f) => {
              const m = ministryById(f.ministryId);
              return (
                <Link
                  key={f.id}
                  to={`/findings#${f.id}`}
                  className="group block border-t-2 border-foreground pt-5 hover:border-primary transition-colors"
                >
                  <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {m?.short ?? m?.name}
                  </div>
                  <h3 className="mt-3 font-serif text-2xl leading-tight font-semibold group-hover:text-primary transition-colors">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-sm text-foreground/70 leading-relaxed">{f.dek}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Coverage status */}
        <section className="border-t border-border bg-card">
          <div className="container py-14 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
            <div className="max-w-2xl">
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Coverage</div>
              <p className="mt-2 font-serif text-2xl">
                <span className="text-primary">102</span> Demands across <span className="text-primary">{BUDGET_META.ministriesCovered}</span> ministries are live · Detailed DGs live for{" "}
                <span className="text-primary">{BUDGET_META.ddgsLive}</span> of {BUDGET_META.ddgsPlanned} planned.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ConfidenceChip level="validated" />
                <ConfidenceChip level="parsed" />
                <ConfidenceChip level="ocr-needed" />
              </div>
            </div>
            <Link
              to="/methodology"
              className="inline-flex items-center gap-2 rounded-sm border border-foreground px-5 py-3 text-sm font-medium hover:bg-foreground hover:text-background transition-colors"
            >
              See coverage tracker
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card p-5">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-serif text-2xl md:text-3xl font-semibold tnum">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function SectionHeader({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="max-w-2xl">
      <div className="text-xs uppercase tracking-[0.16em] text-primary font-medium">{kicker}</div>
      <h2 className="mt-3 font-serif text-3xl md:text-4xl font-semibold leading-tight">{title}</h2>
      {sub && <p className="mt-3 text-foreground/70 leading-relaxed">{sub}</p>}
    </div>
  );
}

function EntryTile({ n, title, dek, to, badge }: { n: string; title: string; dek: string; to: string; badge?: string }) {
  return (
    <Link
      to={to}
      className="group relative block border border-border bg-card p-7 hover:border-foreground transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs text-muted-foreground">{n}</div>
        {badge && (
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-primary/10 text-primary font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-4 font-serif text-2xl font-semibold leading-tight">{title}</h3>
      <p className="mt-3 text-sm text-foreground/70 leading-relaxed">{dek}</p>
      <ArrowUpRight className="absolute right-5 top-5 h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

function SubTile({ n, title, dek, to, badge }: { n: string; title: string; dek: string; to: string; badge?: string }) {
  return (
    <Link
      to={to}
      className="group relative block border border-border bg-card p-5 hover:border-foreground transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] text-muted-foreground">{n}</div>
        {badge && (
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground font-medium">
            {badge}
          </span>
        )}
      </div>
      <h3 className="mt-3 font-serif text-lg font-semibold leading-tight group-hover:text-primary transition-colors">{title}</h3>
      <p className="mt-2 text-xs text-foreground/65 leading-relaxed">{dek}</p>
    </Link>
  );
}

export default Index;
