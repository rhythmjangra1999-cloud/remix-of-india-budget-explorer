## Goal

1. On the homepage, collapse the "Three ways in" section's two tiles down to a **single "Union Budget"** entry tile.
2. Add a new visual section to the homepage showing the **4-year Union Budget data (FY24 → FY27)** from the uploaded Excel, anchored by a **sunburst chart** (Union Budget → Ministry → Demand) with a year selector, plus a small supporting view.

## Files to add

- `src/data/union-4year.json` — generated from `India_Budget_4Year_FY24_to_FY27.xlsx`. Shape:
  ```ts
  {
    years: ["FY24","FY25","FY26","FY27"],
    yearLabels: { FY24: "BE 2023-24", ... },
    totals: { FY24: number, ... }, // ₹ Cr
    ministries: [{
      name: string,
      totals: { FY24, FY25, FY26, FY27 },
      revenue: { FY24, ... },
      capital: { FY24, ... },
      demands: [{ name, totals: {...}, revenue: {...}, capital: {...} }]
    }]
  }
  ```
  Built once via a small node script (`scripts/build-union-4year.ts`) from the workbook's "All Demands — 4 Years" sheet (161 rows, ministry headers in caps + numbered demand rows). Script committed; output JSON committed.

- `src/components/home/UnionBudget4Year.tsx` — section component containing:
  - Year toggle: FY24 / FY25 / FY26 / FY27 (FY27 default)
  - Headline stat strip: total budget for selected year + YoY delta vs previous year
  - **Sunburst** (D3, similar pattern to existing `SunburstView.tsx` / `AgriSunburst.tsx`): rings = Union Budget → Ministry → Demand. Hover shows name + ₹ Cr + % of Union Budget. Click a ministry slice → navigate to `/explorer?ministry=…` when an id mapping exists, else no-op.
  - Compact bar list to the right (or below on mobile): top 10 ministries for the selected year with revenue/capital split bars.
  - Footer caption: "Source: Union Budget Demands for Grants, FY 2023-24 to FY 2026-27. ₹ Crores, net of receipts & recoveries."

## Files to edit

- `src/pages/Index.tsx`:
  - In the "Three ways in" section, replace the 2-tile grid with a single full-width `EntryTile` for **Union Budget** (`/explorer`). Update kicker/title copy ("One way in" / keep "Start from a question" — TBD; default: keep title, change `sub` to single-path wording).
  - Insert `<UnionBudget4Year />` as a new section between the entry tile and the "six largest ministries" strip, on its own bordered band (similar visual treatment to `BudgetHistoryChart` block).

## Visualization details

- Sunburst sized responsively (max 560 px), 3 rings only for performance. Use existing `useChartTooltip` hook for tooltip consistency.
- Color scale: warm earth tones derived from existing `--primary` token (no hard-coded colors — use `hsl(var(--primary))` plus lightness mixing, matching `AgriSunburst` approach).
- Year toggle is a small segmented control built from existing button styles (no new shadcn component).
- All numbers via `formatCr()` from `@/lib/format`.

## Out of scope

- No changes to Explorer routing, schemes view, or the Excel-derived data feeding other pages. The new JSON is additive and only consumed by the homepage section.
