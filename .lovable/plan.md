# Methodology Page — "How the Money Works"

A visual-first, narrative-driven Methodology page that walks a non-expert through the entire lifecycle of public and private money in India: how do we earn, from your wallet, into the Consolidated Fund, Security fund, out through ministries and schemes, down to states and finally to delivery on the ground. It also explains what the Budget / DG / DDG documents are, who publishes them, and when. what is the formula for each state.

## Page structure (top to bottom)

### 1. Hero

- Title: *"How the Money Works"*
- Dek: *"you earned, then you paid X amount of tax, and from your tax rupee to what led to budget and then how to a school in a district — the full journey of India's Union Budget, in plain language."*
- Meta strip: reading time (~5 min) · last updated · "Jump to flowchart" anchor.

### 2. The big-picture flowchart (anchor view)

Money: Visual 1. Budget: Visual 2 (A single horizontal SVG flow diagram, full-bleed. Each node is clickable and scroll-jumps to its matching section below.)

```text
 SOURCES OF MONEY              POOLED              ALLOCATED               SPENT BY                    DELIVERED TO
 ─────────────────             ──────              ──────────              ──────────                  ─────────────
 Income Tax        ┐                                Ministries (102) ┐     Central schemes ┐
 GST (Centre)      │                                                 │     CSS (shared)    │           Citizens
 Corporate Tax     ├──►  Consolidated  ──► Union ──► Departments    ├──►  State transfers ├──►        States/UTs
 Customs / Excise  │      Fund of India   Budget    Autonomous bodies│     Salaries/Pensions│          Districts
 Borrowings        │                                                 │     Capital works    │          Frontline staff
 Non-tax (dividend,┘                                Statutory share  ┘     Subsidies        ┘
 spectrum, fees)                                    to States (FC)
```

Built as SVG (not raster) so labels stay crisp and clickable. Muted Explorer palette; arrow widths reflect proportional flow where data exists.

### 3. Section-by-section explainer (each ~150 words + one micro-visual)

**A. Where does the money come from?**
Stacked bar of FY26 receipts: Borrowings, GST, Income Tax, Corporate Tax, Customs, Excise, Non-tax, Dividends. Plain-English call-outs, e.g. *"~27 paise of every ₹1 spent is borrowed."* Source line: Receipt Budget, Feb 1.

**B. Where does it sit? — The three Funds**
Three side-by-side cards:

- **Consolidated Fund of India** — the main account; every in/out needs Parliament's nod.
- **Contingency Fund** — emergency float (₹30,000 Cr), at the President's disposal.
- **Public Account** — money the govt holds in trust (PF, small savings).

**C. Who decides what gets spent? — The Budget cycle**
A timeline strip across the year:

```text
 Sept–Nov     Dec–Jan        Feb 1            Feb–Mar         Apr 1        Through year
 ──────       ──────         ─────            ───────         ─────        ────────────
 Ministries   Finance Min.   Budget tabled    Demands voted   FY begins    CAG audits,
 send         consolidates,  in Parliament    (Lok Sabha),    (Apr–Mar)    Standing
 demands      PM signs off   (Union Budget)   Appropriation                Committees review
                                              Bill passed
```

**D. What documents are actually published? — Budget vs DG vs DDG**


| Document                                 | Published by            | When                     | Granularity                                            | Where in our site                                 |
| ---------------------------------------- | ----------------------- | ------------------------ | ------------------------------------------------------ | ------------------------------------------------- |
| Union Budget Speech & Budget at a Glance | Finance Minister        | Feb 1                    | Headline totals, deficit, key schemes                  | Landing page numbers                              |
| Demands for Grants (DGs)                 | Each ministry, via MoF  | Feb 1 onward             | Per-ministry, per-demand totals (Revenue + Capital)    | **Explorer — top two levels**                     |
| Detailed Demands for Grants (DDGs)       | Each ministry           | A few weeks after Budget | Object-head detail (Salaries, Subsidies, Major Works…) | **Explorer — drill-down (live for 3 ministries)** |
| Outcome Budget                           | NITI Aayog + ministries | With Budget              | Scheme outputs/outcomes                                | Linked from Findings                              |
| Receipt Budget                           | MoF                     | Feb 1                    | Tax & non-tax receipts                                 | Section A above                                   |
| Finance / Appropriation Accounts         | CAG                     | ~18 months later         | Actuals vs Budget                                      | Out of scope (link out)                           |


**E. The 6-level hierarchy — a worked example**
Re-use the existing MoPSW example, redesigned as a vertical "drill" graphic with each level visually nested, ending in the ₹1,820 Cr object head. Same mental model as the Explorer.

**F. Centre → State: how money actually reaches a district**
A small Sankey (re-uses SankeyView styling, hard-coded for one example like MGNREGS):

```text
 Union Budget ──► Ministry of Rural Dev ──► MGNREGS scheme ──► State govt ──► District ──► Wage payment
```

Plus a callout: **Why state-wise data is often missing** — many central schemes don't disclose state allocation in the DG; it's released via PFMS or Parliament replies. We flag every such row.

**G. What are our taxes actually buying? — The "rupee" diagram**  
Donut: "Where every ₹1 goes" — Interest payments, Defence, Subsidies, States' share, Central schemes, Pensions, Other. FY26 figures, one-line takeaway under each slice.

### 4. Footer of the page

- "How to cite this page" snippet.
- Link to source PDFs on indiabudget.gov.in.
- "Spot an error?" mailto link.

## Visual & UX rules

- Editorial layout: ~720px reading column for prose; full-bleed for the flowchart, timeline, and Sankey.
- Source Serif 4 for headings, Inter for body, JetBrains Mono for figures (existing design system).
- Every visual: one-line plain-English takeaway *above*, small grey source line *below*.
- Section headings get an anchor-link icon on hover; flowchart nodes deep-link to them.
- Sticky mini-ToC on the right (desktop) with sections A–G + K, scroll-spy highlighted. Mobile: collapses to a "Jump to" dropdown.

## Files touched

- `src/pages/Methodology.tsx` — full rewrite of structure; keep the existing coverage tracker section.
- `src/components/methodology/MoneyFlowChart.tsx` *(new)* — SVG hero flowchart, clickable nodes.
- `src/components/methodology/BudgetCycleTimeline.tsx` *(new)* — Sept→Mar timeline strip.
- `src/components/methodology/RupeeDonut.tsx` *(new)* — D3-based "where every ₹1 goes" donut.
- `src/components/methodology/HierarchyDrill.tsx` *(new)* — 6-level nested visual.
- `src/components/methodology/StickyToc.tsx` *(new)* — right-side scroll-spy ToC.
- `src/data/budget-flow.json` *(new)* — receipts breakdown, rupee-donut shares, doc-publishing calendar; small static file, easy to update each FY.

## Out of scope (this sprint)

- Confidence-level explainer, anomaly log, glossary (sections H/I/J).
- No interactive simulator; no PFMS / state-PDF integration; English only.
- No new Explorer ingestion — uses existing `/data` plus the new `budget-flow.json`.