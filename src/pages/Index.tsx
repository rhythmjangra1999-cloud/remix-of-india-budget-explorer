import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ConfidenceChip } from "@/components/ConfidenceChip";
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
          <div className="container py-20 md:py-28 max-w-5xl">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Budget Estimates 2026-27
              </span>
              <span>Government of India</span>
            </div>
            <h1 className="mt-6 font-serif text-5xl md:text-7xl font-semibold leading-[1.05] tracking-tight">
              See where every rupee of the Union Budget goes.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-foreground/75 leading-relaxed">
              A public, editorial tool to explore India's{" "}
              <span className="text-foreground font-medium">102 Demands for Grants</span>{" "}
              across {BUDGET_META.ministriesCovered} union ministries and departments —
              with object-head detail for the live ministries and an honest account of
              what's missing.
            </p>

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
                Read Methodology
              </Link>
            </div>

            {/* Headline figures */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-sm overflow-hidden border border-border">
              <Stat label="Gross Union Budget" value={formatCr(BUDGET_META.totalUnionBudgetCr)} sub="incl. debt repayment" />
              <Stat label="Demands for Grants" value="102" sub={`across ${BUDGET_META.ministriesCovered} ministries`} />
              <Stat
                label="DDGs live"
                value={`${BUDGET_META.ddgsLive}`}
                sub={`of ${BUDGET_META.ddgsPlanned} planned`}
              />
              <Stat label="Fiscal year" value="2026-27" sub={`updated ${BUDGET_META.lastUpdated}`} />
            </div>
          </div>
        </section>

        {/* Three entry tiles */}
        <section className="container py-20">
          <SectionHeader
            kicker="Three ways in"
            title="Start from a question"
            sub="Most people come to the Budget with a question. Pick a starting point — every path leads to the same underlying data."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <EntryTile
              n="01"
              title="Explore by Ministry"
              dek={`Browse ${BUDGET_META.ministriesCovered} ministries and departments. Sort by size, search by name, drill into demands and (where available) object-head detail.`}
              to="/explorer?view=treemap"
            />
            <EntryTile
              n="02"
              title="Explore by Demand"
              dek="Skip the ministry layer. Look at every Demand for Grants in a sortable table — useful for cross-cutting comparisons."
              to="/explorer?view=table"
            />
            <EntryTile
              n="03"
              title="Where money goes (Centre → State)"
              dek="Trace flows from the Centre to states and union territories. Sparse — many transfers are not disclosed at this level."
              to="/explorer?view=sankey"
            />
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
                    <div className="font-serif text-xl tnum font-semibold">
                      {formatCr(m.totals.FY27 ?? 0, { compact: true })}
                    </div>
                  </div>
                  <div className="mt-3 font-serif text-lg leading-snug group-hover:text-primary transition-colors">
                    {m.name}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {(((m.totals.FY27 ?? 0) / BUDGET_META.totalUnionBudgetCr) * 100).toFixed(1)}% of gross Union Budget
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

function EntryTile({ n, title, dek, to }: { n: string; title: string; dek: string; to: string }) {
  return (
    <Link
      to={to}
      className="group relative block border border-border bg-card p-7 hover:border-foreground transition-all"
    >
      <div className="font-mono text-xs text-muted-foreground">{n}</div>
      <h3 className="mt-4 font-serif text-2xl font-semibold leading-tight">{title}</h3>
      <p className="mt-3 text-sm text-foreground/70 leading-relaxed">{dek}</p>
      <ArrowUpRight className="absolute right-5 top-5 h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

export default Index;
