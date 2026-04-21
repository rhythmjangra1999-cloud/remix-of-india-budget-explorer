
# India Budget Visualizer — Public Site Shell + DG Explorer

A public, editorial-styled site for journalists, researchers, and citizens to explore India's Union Budget at the Demand-for-Grants (DG) level across all 102 ministries, with the architecture ready to drill into Detailed Demands (DDGs) and object heads as that data lands.

## Pages

1. **Home / Landing**
   - Hero with one-line mission, current FY badge, total Union Budget headline number
   - Three entry tiles: *Explore by Ministry*, *Explore by Demand*, *Where money goes (Center → State)*
   - "Featured findings" strip (3 editorial cards pulled from MoPSW/MHA/DoPT)
   - Coverage status: "DGs live for 102 ministries · DDGs live for 3 of 10 planned"

2. **Explorer** (the core page)
   - Left rail: ministry list with search + budget-size sort
   - Main canvas with view-switcher tabs:
     - **Treemap** — ministries sized by allocation, click to drill into demands → major heads → (where available) object heads, with breadcrumb
     - **Sunburst** — full 6-level hierarchy at a glance
     - **Sankey** — Center → Ministry → Scheme/State flow (uses available data; clearly marks gaps)
     - **Table** — sortable, filterable, with inline bar magnitudes and CSV export
   - Right panel: selected node details (amount, YoY change, share of ministry, share of budget, link to source PDF page)
   - FY selector (FY26 / FY27 toggle as data grows)
   - "Data confidence" chip on every node (validated / parsed / OCR-needed)

3. **Methodology**
   - The 2-page note: what Budget / DGs / DDGs are, the 6-level hierarchy with a worked example, extraction process, known gaps (schemes, state transfers), how to read confidence levels
   - Coverage tracker table (which ministries are parsed, validated, live, OCR-pending)
   - Anomaly log

4. **Findings** (editorial)
   - Short articles surfacing object-head-level stories from the 3 live DDGs
   - Each piece embeds a live mini-visualization

5. **About** — team, contact, how to cite, changelog

## Data model (file-driven)

- You upload JSON/CSV; app reads them as static assets. Suggested files:
  - `ministries.json` — id, name, slug, total allocation per FY
  - `demands.json` — ministry_id → demands with major/minor head amounts
  - `ddgs.json` — full 6-level rows for live ministries (object-head detail)
  - `transfers.json` — center→state flows (sparse; unknowns flagged)
  - `coverage.json` — parse/validation status per ministry
  - `findings.md` — editorial notes
- A simple `/data` README explains the schema so re-uploads are drop-in
- Loader validates schema and shows a clear banner if a file is missing/malformed

## Visual design — editorial / data-journalism

- Serif display headings (e.g., Source Serif / Spectral), sans-serif body (Inter)
- Generous whitespace, max ~720px reading column on text pages, full-bleed on the explorer
- Muted palette: warm off-white background, deep ink text, a single accent for highlights, sequential color ramp for amounts (no rainbow)
- Charts: clean axes, direct labels, no chartjunk; tooltips with formatted ₹ Cr / ₹ Lakh Cr
- Mobile: explorer collapses to table + treemap; sunburst/sankey hidden behind "open on desktop" hint

## Tooltips & copy

- Plain-language tooltips on every jargon term (DG, DDG, Major Head, Object Head, Revenue vs Capital)
- Empty states drafted for: no DDG yet, no state-transfer data, OCR pending
- Footer disclaimer about data freshness and source PDFs

## Out of scope for this build (queued for later)

- Auth, comments, saved views
- Live PDF parsing pipeline
- Year-over-year time series beyond the FYs in uploaded data
- Internal data-ops dashboard (separate later sprint)

## What you'll need to provide after approval

- Sample/initial JSON or CSV for ministries + at least one ministry's DDG so the explorer renders with real data
- Logo or wordmark (optional — otherwise we'll set a clean type-only mark)
