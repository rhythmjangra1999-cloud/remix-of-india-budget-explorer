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
          <div className="container py-20 md:py-24 text-sm font-serif font-normal">
            {/* Full-width heading + copy */}
            <div className="w-full">
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.04] tracking-tight">
                Trace the rupee. <span className="text-foreground/55">The pulse of public spending.</span>
              </h1>

              <div className="mt-8 w-full space-y-5 font-serif text-lg text-foreground/75 leading-relaxed">
                <p>
                  The Union Budget allocates <span className="text-foreground font-medium tnum">₹53.47 LCr</span> each year. Yet knowing how much any one ministry received tells you almost nothing about where the money goes. <span className="text-foreground font-medium">Koshtha</span> reads over one thousand government documents (the Demands for Grants, the Detailed Demands, and the scheme annexures published by each ministry) to trace public money from its allocation in Parliament, through the schemes it funds, to the states those schemes are meant to serve.
                </p>
              </div>
            </div>

            {/* History chart — full width, below heading */}
            <div className="mt-14 border-t border-border pt-10">
              <BudgetHistoryChart />
            </div>

            {/* Headline figure + CTAs — editorial ledger band */}
            <div className="mt-14">
              <div className="border-t-2 border-b border-foreground" />
              <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] bg-border gap-px">
                {/* Figure cell */}
                <div className="bg-card p-7 md:p-8 flex flex-col justify-center min-h-[140px]">
                  <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                    Union Budget · BE 2026 to 27
                  </span>
                  <div className="mt-3 font-serif text-4xl md:text-5xl font-semibold tnum text-foreground leading-none">
                    ₹53.47 <span className="text-2xl md:text-3xl font-normal text-foreground/75">LCr</span>
                  </div>
                </div>

                {/* Read Tutorial */}
                <Link
                  to="/methodology"
                  className="group relative overflow-hidden bg-primary/10 p-7 md:p-8 flex flex-col justify-center min-h-[140px] hover:bg-primary/15 transition-colors"
                >
                  <span className="font-serif italic text-sm text-primary/80">Getting started</span>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-serif text-2xl font-semibold text-foreground leading-tight">
                      Read Tutorial
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-primary transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                  <span aria-hidden className="pointer-events-none select-none absolute -bottom-6 -right-3 font-sans text-8xl font-black text-foreground/[0.05] transition-transform duration-700 group-hover:-translate-y-1">
                    01
                  </span>
                </Link>

                {/* Open Explorer */}
                <Link
                  to="/explorer"
                  className="group relative overflow-hidden bg-primary p-7 md:p-8 flex flex-col justify-center min-h-[140px] hover:bg-primary/90 transition-colors"
                >
                  <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-primary-foreground/70 font-medium">
                    DIVE DEEPER
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-sans text-xl font-bold uppercase tracking-tight text-primary-foreground leading-tight">
                      Open Explorer
                    </span>
                    <ArrowUpRight className="h-5 w-5 text-primary-foreground transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <span aria-hidden className="pointer-events-none select-none absolute -bottom-6 -right-3 font-sans text-8xl font-black text-primary-foreground/10 transition-transform duration-700 group-hover:-translate-y-1">
                    02
                  </span>
                </Link>
              </div>
              <div className="border-b-2 border-t border-foreground" />
            </div>
          </div>
        </section>

        {/* Problem statement */}
        <section className="border-b border-border bg-secondary/30">
          <div className="container py-14">
            <div className="uppercase tracking-[0.16em] text-primary text-2xl md:text-3xl font-serif font-bold">
              PROBLEM STATEMENT:
            </div>
            <p className="mt-6 w-full font-serif text-base leading-relaxed md:text-xl text-foreground/85">
              Every year, the Union Budget is announced and reported. But what gets covered is only the first layer  which is how much each ministry received. The actual flow of money lives in the documents that follow: the Demands for Grants, the Detailed Demands for Grants, and the scheme annexures that each ministry publishes. And further still, in how those schemes distribute their allocations across every state in the country. Taken together, these run to thousands of pages scattered across government portals. Koshtha brings them into one place so the full journey of public money becomes readable.
            </p>
          </div>
        </section>

        {/* Single entry tile */}
        <section className="container py-14">
          <div className="uppercase tracking-[0.16em] text-primary text-2xl md:text-3xl font-serif font-bold">
            SOLUTION: KOSHTHA
          </div>
          <p className="mt-6 w-full font-serif text-base leading-relaxed md:text-xl text-foreground/85">
            Koshtha opens the Union Budget at every level it is published. Start with the full picture and drill down until you reach the individual budget line that funds a specific activity in a specific state.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SubTile
              n="01"
              title="Union Budget"
              dek={`Browse all ${BUDGET_META.ministriesCovered} ministries across four fiscal years. Follow any allocation from its major head all the way down to the object head, with year on year changes shown at every level.`}
              to="/explorer?view=union"
            />
            <SubTile n="02" title="Ministry" dek="Open any of the 56 ministries and read its demands, major heads, and object heads the way the government published them, with four years of figures side by side." to="/explorer" />
            <SubTile n="03" title="Schemes" dek="Every Central Sector and Centrally Sponsored scheme, mapped from the ministry that funds it down to the states it is meant to serve." to="/explorer?view=schemes" badge="Rolling out" />
            <SubTile n="04" title="State" dek="See how central scheme allocations translate into actual flows of money into each state, traced from the ministry demand that carried them. Starting with Uttar Pradesh · Agriculture." to="/states" badge="Rolling out" />
          </div>
        </section>

        {/* Proof */}
        <ProofSection topMinistries={topMinistries} totalCr={BUDGET_META.totalUnionBudgetCr} />







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
                    <span className="font-serif">
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
                  <p className="mt-3 font-serif text-sm text-foreground/70 leading-relaxed">{f.dek}</p>
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

function SectionHeader({ kicker, title, sub }: { kicker: string | React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="w-full text-left">
      <div className="uppercase tracking-[0.16em] text-primary text-xs md:text-sm font-sans font-medium">{kicker}</div>
      <h2 className="mt-3 font-serif text-3xl md:text-4xl font-semibold leading-tight">{title}</h2>
      {sub && <p className="mt-3 w-full font-serif text-base md:text-lg text-foreground/75 leading-relaxed">{sub}</p>}
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
      <p className="mt-3 font-serif text-sm text-foreground/70 leading-relaxed">{dek}</p>
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
      <p className="mt-2 font-serif text-xs text-foreground/65 leading-relaxed">{dek}</p>
    </Link>
  );
}

function ProofSection({ topMinistries, totalCr }: { topMinistries: typeof MINISTRIES; totalCr: number }) {
  const rows = topMinistries.slice(0, 6).map((m) => ({
    id: m.id,
    name: m.short ?? m.name,
    cr: m.totals.FY27 ?? 0,
    share: ((m.totals.FY27 ?? 0) / totalCr) * 100,
  }));
  const max = Math.max(...rows.map((r) => r.cr));
  const top = rows[0];
  const sumTop6 = rows.reduce((s, r) => s + r.cr, 0);
  const top6Share = (sumTop6 / totalCr) * 100;

  const insights = [
    {
      k: "Concentration",
      t: `Top 6 ministries hold ${top6Share.toFixed(1)}% of the Union Budget`,
      d: `Excluding Finance (debt servicing), just six ministries account for ${formatCr(sumTop6, { compact: true })} of the ${formatCr(totalCr, { compact: true })} allocation in BE 2026-27.`,
      tag: "01",
    },
    {
      k: "Largest line",
      t: `${top?.name} leads at ${formatCr(top?.cr ?? 0, { compact: true })}`,
      d: `That is ${top?.share.toFixed(1)}% of the Union Budget — visible only after stripping Finance's accounting flows from the league table.`,
      tag: "02",
    },
    {
      k: "Reproducible",
      t: "Every number traces back to a source document",
      d: "Open the same view in the Report Builder. Every cell links to the Demand for Grants page it was parsed from. No black box.",
      tag: "03",
    },
  ];

  return (
    <section className="border-y border-border bg-card">
      <div className="container py-16">
        <div className="uppercase tracking-[0.16em] text-primary text-2xl md:text-3xl font-serif font-bold">
          PROOF:
        </div>
        <p className="mt-4 w-full font-serif text-base leading-relaxed md:text-xl text-foreground/85">
          Build your case with all the numbers. Every chart on Koshtha is reproducible in the Report Builder — pick a dimension, pick a year, see what the data says, and read what it implies.
        </p>

        <div className="mt-10 grid gap-px bg-border border border-border rounded-sm overflow-hidden lg:grid-cols-[1.4fr_1fr]">
          {/* LEFT — Report Builder snapshot */}
          <div className="bg-card p-6 md:p-8">
            <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Report Builder · snapshot
                </div>
                <div className="mt-1 font-serif text-base font-semibold">
                  Top ministries by allocation · BE 2026-27
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="px-1.5 py-0.5 border border-border">groupBy: ministry</span>
                <span className="px-1.5 py-0.5 border border-border">measure: be2627</span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {rows.map((r, i) => (
                <Link
                  key={r.id}
                  to={`/builder?b=ministry&y=be2627`}
                  className="group block"
                >
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      <span className="font-serif text-sm truncate group-hover:text-primary transition-colors">
                        {r.name}
                      </span>
                    </div>
                    <div className="font-mono tnum text-foreground/80 shrink-0">
                      {formatCr(r.cr, { compact: true })}
                      <span className="ml-2 text-muted-foreground">{r.share.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="mt-1.5 h-2 w-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full bg-primary/80 group-hover:bg-primary transition-colors"
                      style={{ width: `${(r.cr / max) * 100}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
              <span className="font-mono text-muted-foreground">
                Source · Demands for Grants 2026-27
              </span>
              <Link
                to="/builder"
                className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
              >
                Open in Builder <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* RIGHT — Insights tied to the chart */}
          <div className="bg-card p-6 md:p-8">
            <div className="border-b border-border pb-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Suggested insights
              </div>
              <div className="mt-1 font-serif text-base font-semibold">
                What the chart on the left actually says
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {insights.map((ins) => (
                <div key={ins.tag} className="border-t border-border/70 pt-4 first:border-t-0 first:pt-0">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[10px] text-muted-foreground">{ins.tag}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                      {ins.k}
                    </span>
                  </div>
                  <h4 className="mt-2 font-serif text-base font-semibold leading-snug">{ins.t}</h4>
                  <p className="mt-1.5 font-serif text-xs text-foreground/70 leading-relaxed">{ins.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Index;

