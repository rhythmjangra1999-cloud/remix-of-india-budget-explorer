import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { COVERAGE, MINISTRIES, ministryById } from "@/lib/budget-data";
import { formatCr } from "@/lib/format";
import { MoneyFlowChart } from "@/components/methodology/MoneyFlowChart";
import { BudgetCycleTimeline } from "@/components/methodology/BudgetCycleTimeline";
import { RupeeDonut } from "@/components/methodology/RupeeDonut";
import { HierarchyDrill } from "@/components/methodology/HierarchyDrill";
import { StickyToc } from "@/components/methodology/StickyToc";
import flow from "@/data/budget-flow.json";
import { ArrowRight, Hash } from "lucide-react";

const SECTIONS = [
  { id: "flowchart", label: "The big picture" },
  { id: "sec-a", label: "A · Where money comes from" },
  { id: "sec-b", label: "B · Where it sits" },
  { id: "sec-c", label: "C · The Budget cycle" },
  { id: "sec-d", label: "D · Budget vs DG vs DDG" },
  { id: "sec-e", label: "E · The 6-level hierarchy" },
  { id: "sec-f", label: "F · Centre → State" },
  { id: "sec-g", label: "G · The rupee diagram" },
  { id: "coverage", label: "Coverage tracker" },
];

function AnchorH2({ id, children, eyebrow }: { id: string; children: React.ReactNode; eyebrow?: string }) {
  return (
    <div id={id} className="scroll-mt-24 group">
      {eyebrow && (
        <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-mono font-medium">
          {eyebrow}
        </div>
      )}
      <h2 className="mt-1 font-serif text-3xl font-semibold flex items-center gap-2">
        {children}
        <a
          href={`#${id}`}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity"
          aria-label="Anchor link"
        >
          <Hash className="h-4 w-4" />
        </a>
      </h2>
    </div>
  );
}

function Takeaway({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-foreground/80 italic font-serif border-l-2 border-primary/40 pl-3 mb-3">
      {children}
    </div>
  );
}

function SourceLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-mono">
      Source · {children}
    </div>
  );
}

/* ---------------- Receipts stacked bar (Section A) ---------------- */
function ReceiptsBar() {
  const receipts = flow.receipts;
  const total = receipts.reduce((s, r) => s + r.paise, 0);
  const RAMP = ["ramp-6", "ramp-5", "ramp-4", "ramp-3", "ramp-2", "ramp-1", "accent", "primary"];
  return (
    <div>
      <div className="flex h-12 w-full rounded-sm overflow-hidden border border-border">
        {receipts.map((r, i) => (
          <div
            key={r.id}
            title={`${r.label}: ${r.paise}p · ${formatCr(r.amountCr)}`}
            className="relative group flex items-center justify-center transition-opacity hover:opacity-90"
            style={{
              width: `${(r.paise / total) * 100}%`,
              background: `hsl(var(--${RAMP[i % RAMP.length]}))`,
            }}
          >
            {r.paise >= 8 && (
              <span className="text-[11px] font-mono tabular-nums text-foreground/80">
                {r.paise}p
              </span>
            )}
          </div>
        ))}
      </div>
      <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {receipts.map((r, i) => (
          <li key={r.id} className="flex items-baseline gap-2">
            <span
              className="w-3 h-3 rounded-sm shrink-0 translate-y-0.5"
              style={{ background: `hsl(var(--${RAMP[i % RAMP.length]}))` }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-serif">{r.label}</span>
                <span className="font-mono tabular-nums text-foreground/70 text-xs">
                  {r.paise}p · {formatCr(r.amountCr, { compact: true })}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{r.note}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Three Funds cards (Section B) ---------------- */
function FundsCards() {
  const funds = [
    {
      title: "Consolidated Fund of India",
      art: "Article 266(1)",
      body: "The main account. All revenue, all loans raised, all repayments. Every rupee in or out needs Parliament's nod via the Appropriation Act.",
      tone: "primary",
    },
    {
      title: "Contingency Fund",
      art: "Article 267",
      body: "An emergency float of ₹30,000 Cr at the disposal of the President. Used for unforeseen spending; recouped from the Consolidated Fund later.",
      tone: "accent",
    },
    {
      title: "Public Account",
      art: "Article 266(2)",
      body: "Money the government holds in trust — Provident Funds, small savings, deposits. Government is the banker, not the owner.",
      tone: "muted",
    },
  ];
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {funds.map((f) => (
        <div key={f.title} className="rounded-sm border border-border bg-card p-5">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-mono">
            {f.art}
          </div>
          <h3 className="mt-1 font-serif text-lg font-semibold">{f.title}</h3>
          <div
            className="mt-3 h-0.5 w-10 rounded"
            style={{ background: `hsl(var(--${f.tone}))` }}
          />
          <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{f.body}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Documents table (Section D) ---------------- */
function DocumentsTable() {
  return (
    <div className="overflow-x-auto rounded-sm border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th className="px-4 py-3 font-medium">Document</th>
            <th className="px-4 py-3 font-medium">Published by</th>
            <th className="px-4 py-3 font-medium">When</th>
            <th className="px-4 py-3 font-medium">Granularity</th>
            <th className="px-4 py-3 font-medium">Where in our site</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {flow.documents.map((d) => (
            <tr key={d.doc} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-serif font-medium">{d.doc}</td>
              <td className="px-4 py-3 text-foreground/80">{d.publisher}</td>
              <td className="px-4 py-3 font-mono text-xs">{d.when}</td>
              <td className="px-4 py-3 text-foreground/80">{d.granularity}</td>
              <td className="px-4 py-3 text-foreground/80">{d.site}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Centre → State Sankey-ish flow (Section F) ---------------- */
function StateFlow() {
  const sf = flow.stateFlow;
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-mono">
        Worked example
      </div>
      <div className="font-serif text-lg font-semibold mt-1">{sf.scheme}</div>
      <div className="text-sm text-muted-foreground">
        FY26 outlay:{" "}
        <span className="font-mono tabular-nums">{formatCr(sf.fy26AllocationCr)}</span>
      </div>

      <div className="mt-6 flex flex-col md:flex-row md:items-stretch gap-2 md:gap-0">
        {sf.steps.map((step, i) => (
          <div key={step.id} className="flex-1 flex md:items-stretch gap-2">
            <div className="flex-1 rounded-sm border border-border bg-background p-3 min-w-0">
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">
                Step {i + 1}
              </div>
              <div className="font-serif text-sm font-semibold mt-1 leading-tight">{step.label}</div>
              <div className="mt-1 text-xs text-foreground/70 leading-snug">{step.detail}</div>
            </div>
            {i < sf.steps.length - 1 && (
              <div className="flex items-center justify-center text-muted-foreground shrink-0 md:px-1">
                <ArrowRight className="h-4 w-4 hidden md:block" />
                <ArrowRight className="h-4 w-4 md:hidden rotate-90" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================ */

const Methodology = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="container pt-16 pb-10">
          <div className="reading mx-auto">
            <div className="text-xs uppercase tracking-[0.16em] text-primary font-mono font-medium">
              Methodology · How the money works
            </div>
            <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight">
              From your tax rupee to a school in a district.
            </h1>
            <p className="mt-6 text-lg text-foreground/75 leading-relaxed">
              You earned, then you paid some tax. That rupee enters a national pool, gets sliced
              by the Union Budget, flows through ministries and schemes, and finally lands as a
              wage payment, a textbook, or a bridge. Here's the full journey, in plain language.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground font-mono uppercase tracking-[0.14em]">
              <span>~6 min read</span>
              <span className="opacity-50">·</span>
              <span>Updated for FY26</span>
              <span className="opacity-50">·</span>
              <a href="#flowchart" className="text-primary hover:underline">
                Jump to flowchart →
              </a>
            </div>
          </div>
        </section>

        {/* Two-column layout: content + sticky ToC */}
        <section className="container pb-24">
          <div className="flex gap-12">
            <div className="flex-1 min-w-0">
              {/* The big-picture flowchart */}
              <div id="flowchart" className="scroll-mt-24">
                <Takeaway>
                  Five stations the money passes through — click any to jump to that section.
                </Takeaway>
                <MoneyFlowChart />
                <SourceLine>
                  Compiled from Budget at a Glance &amp; Receipt Budget, FY26.
                </SourceLine>
              </div>

              {/* A. Where money comes from */}
              <section className="mt-20">
                <AnchorH2 id="sec-a" eyebrow="Section A">
                  Where does the money come from?
                </AnchorH2>
                <div className="reading mt-4">
                  <p>
                    The Government of India funds itself from a mix of taxes, non-tax receipts and
                    borrowings. The single biggest source is not a tax at all — it is{" "}
                    <strong>borrowings</strong>, which finance the fiscal deficit. Roughly{" "}
                    <strong>27 paise of every ₹1 spent</strong> is borrowed and added to the
                    public debt.
                  </p>
                </div>
                <div className="mt-8">
                  <Takeaway>Of every ₹1 the Centre spends in FY26, this is where it came from.</Takeaway>
                  <ReceiptsBar />
                  <SourceLine>Receipt Budget FY26 · Statement I, Budget at a Glance.</SourceLine>
                </div>
              </section>

              {/* B. Where it sits */}
              <section className="mt-20">
                <AnchorH2 id="sec-b" eyebrow="Section B">
                  Where does it sit? — The three Funds
                </AnchorH2>
                <div className="reading mt-4">
                  <p>
                    The Constitution carves up government money into three accounts. The
                    Consolidated Fund is the workhorse; the Contingency Fund is for emergencies;
                    the Public Account is money the government merely holds for someone else.
                  </p>
                </div>
                <div className="mt-8">
                  <FundsCards />
                  <SourceLine>Articles 266 &amp; 267, Constitution of India.</SourceLine>
                </div>
              </section>

              {/* C. Budget cycle */}
              <section className="mt-20">
                <AnchorH2 id="sec-c" eyebrow="Section C">
                  Who decides what gets spent? — The Budget cycle
                </AnchorH2>
                <div className="reading mt-4">
                  <p>
                    The Union Budget is not a single event on Feb 1 — it is the visible peak of a
                    six-month process that begins in autumn and runs all year through audit.
                  </p>
                </div>
                <div className="mt-8">
                  <Takeaway>The annual budget calendar, in six phases.</Takeaway>
                  <BudgetCycleTimeline />
                  <SourceLine>
                    Department of Economic Affairs, Ministry of Finance — Budget Circular.
                  </SourceLine>
                </div>
              </section>

              {/* D. Documents */}
              <section className="mt-20">
                <AnchorH2 id="sec-d" eyebrow="Section D">
                  What documents are actually published?
                </AnchorH2>
                <div className="reading mt-4">
                  <p>
                    "The Budget" is colloquially one number, but the government publishes more
                    than a dozen documents on Budget day and in the weeks after. These are the
                    five that matter for tracking money — and where each plugs into our Explorer.
                  </p>
                </div>
                <div className="mt-8">
                  <Takeaway>The Budget you read, and the documents underneath it.</Takeaway>
                  <DocumentsTable />
                  <SourceLine>indiabudget.gov.in — Budget Documents 2025-26.</SourceLine>
                </div>
              </section>

              {/* E. Hierarchy */}
              <section className="mt-20">
                <AnchorH2 id="sec-e" eyebrow="Section E">
                  The 6-level hierarchy — a worked example
                </AnchorH2>
                <div className="reading mt-4">
                  <p>
                    Every rupee in a Detailed Demand for Grants is classified through six nested
                    levels — from the broad <em>Major Head</em> down to the specific{" "}
                    <em>Object Head</em> like "Salaries" or "Major Works". This is the same drill
                    you'll meet in our Explorer.
                  </p>
                </div>
                <div className="mt-8">
                  <Takeaway>How ₹27,000 Cr of Ports &amp; Shipping gets all the way down to one line.</Takeaway>
                  <HierarchyDrill />
                  <SourceLine>
                    DDG of MoPSW FY26 · Controller General of Accounts head structure.
                  </SourceLine>
                </div>
              </section>

              {/* F. Centre → State */}
              <section className="mt-20">
                <AnchorH2 id="sec-f" eyebrow="Section F">
                  Centre → State: how money reaches a district
                </AnchorH2>
                <div className="reading mt-4">
                  <p>
                    For a centrally-sponsored scheme like MGNREGS, the rupee makes six handoffs
                    before it reaches a worker's bank account. Most of this trail lives outside
                    the Budget itself — in PFMS, in scheme dashboards, and in answers tabled in
                    Parliament.
                  </p>
                </div>
                <div className="mt-8">
                  <StateFlow />

                  <div className="mt-6 rounded-sm border-l-4 border-conf-ocr bg-card p-4">
                    <div className="text-[10px] uppercase tracking-[0.16em] text-conf-ocr font-mono font-medium">
                      Known gap
                    </div>
                    <div className="font-serif text-base font-semibold mt-1">
                      Why state-wise data is often missing
                    </div>
                    <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                      The Demands for Grants only show the Centre's outlay per scheme — not the
                      state-wise split. That information lives on the Public Financial Management
                      System (PFMS) portal or in replies tabled in Parliament. We flag every
                      scheme where state-wise allocation is unavailable in red.
                    </p>
                  </div>
                  <SourceLine>
                    Demand No. 86 (Rural Development) FY26 · MoRD operational guidelines for
                    MGNREGS.
                  </SourceLine>
                </div>
              </section>

              {/* G. Rupee diagram */}
              <section className="mt-20">
                <AnchorH2 id="sec-g" eyebrow="Section G">
                  What are our taxes actually buying?
                </AnchorH2>
                <div className="reading mt-4">
                  <p>
                    The classic Budget infographic — every rupee, broken into where it goes.
                    Hover any slice to highlight it.
                  </p>
                </div>
                <div className="mt-8">
                  <Takeaway>
                    Of every ₹1 the Centre spends, the largest single line is interest on past
                    borrowings.
                  </Takeaway>
                  <RupeeDonut />
                  <SourceLine>Budget at a Glance FY26 · Rupee Comes From / Rupee Goes To.</SourceLine>
                </div>
              </section>

              {/* Coverage tracker (kept) */}
              <section id="coverage" className="mt-24 scroll-mt-24">
                <AnchorH2 id="coverage-h" eyebrow="Tracker">
                  Coverage tracker
                </AnchorH2>
                <p className="mt-2 text-foreground/70 max-w-2xl">
                  Per-ministry status. As more DDGs are validated, this table updates.
                </p>
                <div className="mt-6 overflow-x-auto rounded-sm border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left">
                        <th className="px-4 py-3 font-medium">Ministry</th>
                        <th className="px-4 py-3 font-medium tnum text-right">FY26 outlay</th>
                        <th className="px-4 py-3 font-medium">DG status</th>
                        <th className="px-4 py-3 font-medium">DDG status</th>
                        <th className="px-4 py-3 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {COVERAGE.map((c) => {
                        const m = ministryById(c.ministryId);
                        if (!m) return null;
                        return (
                          <tr key={c.ministryId} className="hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium">{m.name}</td>
                            <td className="px-4 py-3 tnum text-right">
                              {formatCr(m.totals.FY26 ?? 0, { compact: true })}
                            </td>
                            <td className="px-4 py-3"><ConfidenceChip level={c.dgStatus} /></td>
                            <td className="px-4 py-3"><ConfidenceChip level={c.ddgStatus} /></td>
                            <td className="px-4 py-3 text-muted-foreground">{c.notes ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Showing {COVERAGE.length} ministries of {MINISTRIES.length}; remainder are
                  DG-validated, DDG not yet attempted.
                </p>
              </section>

              {/* Footer block */}
              <section className="mt-24 border-t border-border pt-10">
                <h2 className="font-serif text-2xl font-semibold">How to cite this page</h2>
                <pre className="mt-3 rounded-sm border border-border bg-muted/40 p-4 text-xs font-mono whitespace-pre-wrap">
{`India Budget Explorer (2026). "How the Money Works — Methodology." Retrieved ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}.`}
                </pre>
                <div className="mt-6 flex flex-wrap gap-6 text-sm">
                  <a
                    href="https://www.indiabudget.gov.in/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline underline-offset-4"
                  >
                    Source PDFs · indiabudget.gov.in →
                  </a>
                  <a
                    href="mailto:hello@example.com?subject=Methodology%20correction"
                    className="text-foreground/70 hover:text-primary"
                  >
                    Spot an error? Email us →
                  </a>
                </div>
              </section>
            </div>

            {/* Sticky right ToC */}
            <StickyToc items={SECTIONS} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Methodology;
