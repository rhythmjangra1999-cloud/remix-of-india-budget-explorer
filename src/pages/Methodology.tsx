import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ConfidenceChip } from "@/components/ConfidenceChip";
import { COVERAGE, MINISTRIES, ministryById } from "@/lib/budget-data";
import { formatCr } from "@/lib/format";

const Methodology = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <article className="container py-20">
          <header className="reading mx-auto">
            <div className="text-xs uppercase tracking-[0.16em] text-primary font-medium">Methodology</div>
            <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight">
              How this data was assembled — and what's missing.
            </h1>
            <p className="mt-6 text-lg text-foreground/75 leading-relaxed">
              A short, plain-language note on what the Union Budget actually contains, how
              we extracted it, the six-level hierarchy you'll meet in the Explorer, and
              the gaps you should know about before citing any figure.
            </p>
          </header>

          <div className="reading mx-auto mt-12">
            <h2>What is the Union Budget?</h2>
            <p>
              The Union Budget is the Government of India's annual statement of receipts
              and expenditure, presented to Parliament. The expenditure side is organised
              as a series of <em>Demands for Grants</em> (DGs) — typically one or more
              per ministry, voted on by the Lok Sabha.
            </p>

            <h2>DG vs DDG</h2>
            <p>
              A <strong>Demand for Grants</strong> shows aggregate allocations per
              ministry, broken into a few major heads. A <strong>Detailed Demand for
              Grants</strong> (DDG) is a much longer document that breaks the same money
              down to the <em>object-head</em> level — i.e. the specific economic
              category of spend (Salaries, Office Expenses, Major Works, Subsidies,
              Grants-in-aid, etc.).
            </p>

            <h2>The six-level hierarchy</h2>
            <p>
              Every rupee in the DDG can be traced through six nested classifications.
              Here's a worked example from the Ministry of Ports, Shipping and
              Waterways:
            </p>
            <div className="mt-6 rounded-sm border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {[
                    ["1. Major Head", "5051 — Capital Outlay on Ports"],
                    ["2. Sub-major Head", "(none in this case)"],
                    ["3. Minor Head", "Inland Water Transport"],
                    ["4. Sub-head", "Sagarmala"],
                    ["5. Detailed Head", "(grouped at sub-head)"],
                    ["6. Object Head", "Major Works — ₹1,820 Cr"],
                  ].map(([k, v]) => (
                    <tr key={k}>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground w-48">{k}</td>
                      <td className="px-4 py-3">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2>Extraction process</h2>
            <ul>
              <li>DG documents are downloaded from indiabudget.gov.in for each ministry.</li>
              <li>Tables are parsed programmatically; figures are reconciled to ministry totals.</li>
              <li>DDG documents (much longer, often 100–300 pages) are parsed where machine-readable, and OCR is queued where they are scans.</li>
              <li>Validated rows have been cross-checked manually against the source PDF.</li>
            </ul>

            <h2>Known gaps</h2>
            <ul>
              <li><strong>Schemes are not consistently named</strong> across DGs and DDGs. There are roughly 200 central schemes and 102 centrally-sponsored / state schemes, but their treatment is inconsistent.</li>
              <li><strong>State-wise transfers are largely unavailable</strong> at the object-head level. For schemes like MGNREGS, PM-KISAN and PMAY, the Budget does not disclose how much goes to each state.</li>
              <li><strong>Railways</strong> uses a separate accounting framework; cross-mapping is in progress.</li>
              <li><strong>Some DDGs are scanned PDFs</strong> requiring OCR — figures from these are flagged.</li>
            </ul>

            <h2>How to read the confidence chip</h2>
            <p>Every node in the Explorer carries one of three labels:</p>
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-4"><ConfidenceChip level="validated" /><span className="text-sm text-foreground/80">Manually checked against the source PDF. Cite with confidence.</span></div>
              <div className="flex items-start gap-4"><ConfidenceChip level="parsed" /><span className="text-sm text-foreground/80">Extracted programmatically; not yet manually reviewed. Sense-check before citing.</span></div>
              <div className="flex items-start gap-4"><ConfidenceChip level="ocr-needed" /><span className="text-sm text-foreground/80">Source requires OCR; figures are provisional or absent.</span></div>
            </div>
          </div>

          {/* Coverage tracker */}
          <section className="mt-20">
            <h2 className="font-serif text-3xl font-semibold">Coverage tracker</h2>
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
                        <td className="px-4 py-3 tnum text-right">{formatCr(m.totals.FY26 ?? 0, { compact: true })}</td>
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
              Showing {COVERAGE.length} ministries of {MINISTRIES.length}; remainder are DG-validated, DDG not yet attempted.
            </p>
          </section>

          {/* Anomaly log */}
          <section className="mt-20 reading mx-auto">
            <h2 className="font-serif text-3xl font-semibold">Anomaly log</h2>
            <ul>
              <li>MoPSW: A small reconciliation difference (~₹3 Cr) between the DG total and sum of object heads — under review.</li>
              <li>MHA: The "Other Expenditure" demand contains some lines whose ministry attribution is ambiguous in the source PDF.</li>
              <li>DoPT: Mission Karmayogi outlays moved between sub-heads in FY26 vs FY25 — cross-year comparisons should be made carefully.</li>
            </ul>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Methodology;
