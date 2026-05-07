# Budget Analysis Builder

A new tab placed **after Tutorial** in the AgriJourney stepper (and reusable across the site). Inspired by Oracle's Financial Analysis "Subject Area → Filters → Columns → Pivot/Visualize → Save" workflow, but scoped to public-budget data we already have in `src/data/`.

The user assembles their own analysis: pick *what* to compare, *how* to slice it, *which years*, then visualise it as a table, bar, line, or treemap — and save the configuration as a shareable URL.

---

## 1. Mental model (Oracle parallel)

| Oracle FA concept | Our equivalent |
|---|---|
| Subject Area | **Dataset** — Ministries / Demands / Major Heads / Schemes / DDG line items |
| Dimensions | Group-by axes — Ministry, Demand, Section (Rev/Cap), Voted/Charged, Major Head, Scheme, State |
| Facts / Measures | Amount fields — Actuals 24-25, BE 25-26, RE 25-26, BE 26-27, YoY %, Share %, Recoveries, Net Provision |
| Filters | Slicers — Ministry list, FY, Section, Voted/Charged, Major Head code prefix, Scheme name search, Amount range |
| Views | Visualisations — Table, Pivot, Bar, Stacked Bar, Line (YoY), Treemap, Sankey |
| Saved Analysis | URL-encoded config + "My Analyses" in localStorage |

---

## 2. Builder layout

```text
┌───────────────────────────────────────────────────────────────────────┐
│  Budget Analysis Builder                          [Reset] [Save] [↗] │
├──────────────┬────────────────────────────────────────────────────────┤
│ 1. Dataset   │  ○ Ministries  ○ Demands  ● Major Heads  ○ Schemes    │
│ 2. Compare   │  Rows: [Ministry ▾]   Columns: [FY ▾]                  │
│ 3. Measure   │  [BE 26-27 ▾]  □ show YoY  □ show Share %              │
│ 4. Filters   │  Ministry: [Agri ×][Health ×] +                        │
│              │  Section:  ● All ○ Revenue ○ Capital                   │
│              │  Type:     ● All ○ Voted ○ Charged                     │
│              │  Major Head prefix: [24__]                             │
│              │  Min amount: [____] Cr   Max: [____] Cr                │
│ 5. View      │  [Table] [Pivot] [Bar] [Stacked] [Line YoY] [Treemap] │
├──────────────┴────────────────────────────────────────────────────────┤
│                       ── Visualisation area ──                        │
│                                                                       │
│  [Top-N selector]   [Sort: Value desc ▾]   [Export CSV] [Copy link]   │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 3. Filters in detail

**Scope filters** (define the rows that enter the analysis)
- **Ministry** — multi-select chips, "All 102", "DDG-available only", presets ("Top 10 by BE 26-27", "Social sector", "Infrastructure")
- **Demand** — multi-select, dependent on ministry
- **Major Head** — search by code (2401) or name; prefix match (24__ for Agri-related)
- **Scheme / Sub-scheme** — text search across `schemes.json`
- **State** — for `transfers.json` only

**Attribute filters** (refine the slice)
- **Section**: All / Revenue / Capital
- **Voted vs Charged**: All / Voted / Charged
- **Confidence**: validated / parsed / ocr-needed (inherited from data)
- **Has recoveries**: yes/no
- **Centrally Sponsored vs Central Sector** (where flagged)

**Quantitative filters**
- Amount range slider on the chosen measure
- YoY change band (e.g. only items with > +20% or < −10%)
- Share-of-parent threshold (e.g. > 1% of demand)

**Time filters**
- Year picker — multi-select across {Actuals 24-25, BE 25-26, RE 25-26, BE 26-27}
- "Compare two years" toggle → enables Δ and Δ% columns

---

## 4. Cross-ministry & cross-scheme flexibility

These are the "power moves" the builder unlocks that today's Explorer cannot do:

1. **Cross-ministry Major Head rollup** — pick MH 2401 and see every ministry that books to it, ranked.
2. **Scheme-name search across ministries** — e.g. "PMAY" returns Housing + Rural rows side-by-side.
3. **Ministry basket vs Ministry basket** — group A: {Agri, FAHD, Food Processing}; group B: {Rural, Jal Shakti}; compare totals & YoY.
4. **Recoveries leaderboard** — order any dataset by recoveries-as-% of gross.
5. **Capital-intensity ranking** — Capital ÷ Grand Total across selected ministries.
6. **YoY shock detector** — filter where |Δ| > X% between RE 25-26 and BE 26-27.
7. **State-share view** (when transfers data present) — pivot scheme × state.
8. **What-if scaler** — apply a "+5%" or "deflator" multiplier on a measure (read-only modelling).

---

## 5. Output / Visualisation

Same data, switchable:
- **Table** — sortable, sticky header, CSV export
- **Pivot** — rows × columns × measure (Excel-like)
- **Bar / Stacked Bar** — top-N with "Other" bucket
- **Line** — only when a year dimension is on an axis (YoY trend)
- **Treemap** — hierarchical share (Ministry → Demand → MH)
- **Sankey** — only when source+target dimensions chosen (Ministry → State, Scheme → MH)

Common controls: Top-N, sort, log scale toggle, "show as % of total".

---

## 6. Save & share

- **URL state**: every selection encoded as `?b=<base64-json>` so a link reproduces the exact analysis.
- **My Analyses** (localStorage): name + timestamp + config; list in a side drawer.
- **Export**: CSV of the current table; PNG of the current chart (html-to-image).
- **Embed snippet** (later) — readonly iframe of the view.

---

## 7. Technical sketch

New files:
- `src/pages/AnalysisBuilder.tsx` — standalone page at `/builder`
- `src/components/builder/` — `DatasetPicker.tsx`, `FilterPanel.tsx`, `MeasureBar.tsx`, `ViewSwitcher.tsx`, `ResultTable.tsx`, `ResultChart.tsx`, `SavedAnalyses.tsx`
- `src/lib/builder/` — `schema.ts` (typed config), `query.ts` (pure function: config + raw data → rows), `encode.ts` (URL ↔ config)
- `src/data/builder-presets.json` — curated starter analyses ("Top 10 ministries YoY", "MH 2401 across ministries", "Recoveries leaderboard")

Stepper integration:
- Add `"builder"` step id to `JourneyStepper.tsx` after `"tutorial"` (label: **Budget Analysis Builder**).
- In `AgriJourney.tsx`, render `<AnalysisBuilder embedded defaultDataset="majorHeads" defaultFilters={{ministry:["magri"]}} />` so the Agri journey opens the builder pre-scoped to Agri but the user can clear filters to go cross-ministry.

Data sources reused (no new backend):
- `ministries.json`, `demands.json`, `dg-summary` (via `lib/dg`), `ddgs.json`, `schemes.json`, `transfers.json`, `dg-recoveries.json`.

Pure-function `query()` keeps the UI dumb: filter → group → aggregate → sort → top-N. Same function powers Table/Pivot/Chart so the numbers always match.

---

## 8. Out of scope (v1)

- Joins across arbitrary datasets (e.g. DDG line items + transfers in one query) — limited to the chosen dataset
- Server-side persistence of saved analyses (localStorage only)
- PDF export, scheduled reports, role-based sharing
- AI/NL prompt-to-analysis (good v2)

---

## Open questions

1. **Entry point** — only inside Agri Journey stepper, or also a top-nav link `/builder` reachable from anywhere? (Recommend both.)
2. **Default dataset** when opened from Agri tab — Major Heads (current Agri context) or Demands?
3. **Presets** — want me to seed 5–6 curated analyses, or ship empty and let users build from scratch?
4. **Chart library** — reuse existing Recharts (already in repo) or add a pivot grid lib for the Pivot view?
