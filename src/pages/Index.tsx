import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { BudgetHistoryChart } from "@/components/home/BudgetHistoryChart";
import { ProofAgriInfographic } from "@/components/home/ProofAgriInfographic";
import { BUDGET_META, FINDINGS, MINISTRIES, ministryById } from "@/lib/budget-data";
import { formatCr } from "@/lib/format";

function NextPage({ to, label }: { to: string; label: string }) {
  return (
    <div className="mt-12 flex justify-end">
      <a
        href={`#${to}`}
        className="group inline-flex items-center gap-2 border-t border-foreground pt-3 pl-6 font-sans text-[11px] uppercase tracking-[0.2em] text-foreground/70 hover:text-foreground transition-colors"
      >
        <span>{label}</span>
        <ArrowDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5" />
      </a>
    </div>
  );
}

const Index = () => {
  const topMinistries = [...MINISTRIES]
    .filter((m) => m.id !== "mof")
    .sort((a, b) => (b.totals.FY27 ?? 0) - (a.totals.FY27 ?? 0))
    .slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* PAGE 1 — Hero heading + history chart */}
        <section id="page-1" className="paper border-b border-border min-h-screen flex flex-col scroll-mt-16">
          <div className="container py-20 md:py-24 text-sm font-serif font-normal flex-1 flex flex-col">
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

            <div className="mt-14 border-t border-border pt-10">
              <BudgetHistoryChart />
            </div>

            <NextPage to="page-2" label="Next · Open Explorer" />
          </div>
        </section>

        {/* PAGE 2 — Ledger band CTAs */}
        <section id="page-2" className="paper border-b border-border min-h-screen flex flex-col scroll-mt-16">
          <div className="container py-20 md:py-24 flex-1 flex flex-col justify-center">
            <div className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
              Page 2 · Start exploring
            </div>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl font-semibold leading-tight">
              The headline figure — and two ways in.
            </h2>
            <div className="mt-10">
              <div className="border-t-2 border-b border-foreground" />
              <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] bg-border gap-px">
                <div className="bg-card p-7 md:p-8 flex flex-col justify-center min-h-[140px]">
                  <span className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
                    Union Budget · BE 2026 to 27
                  </span>
                  <div className="mt-3 font-serif text-4xl md:text-5xl font-semibold tnum text-foreground leading-none">
                    ₹53.47 <span className="text-2xl md:text-3xl font-normal text-foreground/75">LCr</span>
                  </div>
                </div>

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

            <NextPage to="page-3" label="Next · Problem statement" />
          </div>
        </section>

        {/* PAGE 3 — Problem statement */}
        <section id="page-3" className="border-b border-border bg-secondary/30 min-h-screen flex flex-col scroll-mt-16">
          <div className="container py-20 md:py-24 flex-1 flex flex-col justify-center">
            <div className="uppercase tracking-[0.16em] text-primary text-2xl md:text-3xl font-serif font-bold">
              PROBLEM STATEMENT:
            </div>
            <p className="mt-6 w-full font-serif text-base leading-relaxed md:text-xl text-foreground/85">
              Every year, the Union Budget is announced and reported. But what gets covered is only the first layer  which is how much each ministry received. The actual flow of money lives in the documents that follow: the Demands for Grants, the Detailed Demands for Grants, and the scheme annexures that each ministry publishes. And further still, in how those schemes distribute their allocations across every state in the country. Taken together, these run to thousands of pages scattered across government portals. Koshtha brings them into one place so the full journey of public money becomes readable.
            </p>
            <NextPage to="page-4" label="Next · Solution" />
          </div>
        </section>

        {/* PAGE 4 — Solution */}
        <section id="page-4" className="border-b border-border min-h-screen flex flex-col scroll-mt-16">
          <div className="container py-20 md:py-24 flex-1 flex flex-col justify-center">
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
            <NextPage to="page-5" label="Next · Proof" />
          </div>
        </section>

        {/* PAGE 5 — Proof */}
        <section id="page-5" className="bg-card min-h-screen flex flex-col scroll-mt-16">
          <ProofSection />
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

function ProofSection() {
  return (
    <section className="border-y border-border bg-card">
      <div className="container py-16">
        <div className="uppercase tracking-[0.16em] text-primary text-2xl md:text-3xl font-serif font-bold">
          PROOF:
        </div>
        <p className="mt-4 w-full font-serif text-base leading-relaxed md:text-xl text-foreground/85">
          Build your case with all the numbers. Take Agriculture as the worked example — trace the envelope from two Union demands down to schemes, then watch the same sector get budgeted differently in UP and Punjab. Every chart on the left is mirrored by an insight on the right.
        </p>
        <ProofAgriInfographic />
      </div>
    </section>
  );
}

export default Index;

