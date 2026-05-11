## Goal

In **Budget Analysis Builder**, allow the user to "Deep Dive" any row of the comparison table (and chart) into the full DDG hierarchy: **Ministry → Demand → Major Head → Minor Head → Sub/Detailed Head → Object Head**, with year values, share-of-demand, and YoY shown at every level.

Today, DDG drill is only available when a row's *Type* is set to `DDG` and a single demand is picked. The user wants drilling to be a one-click action on **any** row, regardless of how it was originally configured.

## UX

In the Comparison table, add a **"Deep dive"** action (chevron icon) at the end of every row. Clicking it expands an inline panel directly under that row (accordion style — only one open at a time) containing:

1. **Header strip** — Ministry • Demand (or "All demands") • Year (with prev-year toggle for YoY).
2. **Coverage notice** — if DDG isn't available for the demand(s), show "Object-head detail not yet ingested for this demand. Showing Major-head split from DG schedule instead." and fall back to `DG_MAJOR_HEADS` for the breakdown.
3. **Drill tree** (default expanded to Major Head level):

   ```text
   Major Head 2401 — Crop Husbandry        ₹12,345 Cr   23.1%   +4.2%
     └ Minor 00.001 — Direction & Admin     ₹  450 Cr    0.8%   +1.0%
        └ Sub 01.02 — PM-KISAN                ₹  300 Cr    0.6%   +0.5%
            └ Object 31 — Grants-in-aid        ₹  280 Cr    0.5%   +0.5%
   ```

   Each level: name, value (selected year), % of parent, YoY vs previous year. Collapsible rows (click to expand children). Each level also has a small "Add as new selection" button that pushes that exact slice into the comparison list.

4. **Year switcher + Section filter** local to the panel (defaults to the row's year + section, but the user can change without affecting the source row).

5. **Top-N bar** — a compact horizontal bar chart of the largest 10 children at the currently focused level, for quick visual scan.

6. **Export this view** — CSV of the expanded tree.

If the row's `demandNo === "all"` (ministry total), the deep dive opens at **Demand list** for that ministry, then continues into Major→…→Object once a demand is picked inline.

## Technical Notes

- New component: `src/components/builder/DeepDivePanel.tsx` — pure presentation, takes `{ ministry, demandNo, year, section, onAddSelection }`.
- Tree builder helper in same file: groups `DDG_LEAVES` (filtered by demandNo + section) into a nested `Node` tree keyed by `majorHead → subMajor.minorHead → subHead.detailedHead → objectHead`. Each node holds aggregated values for all 4 years so the local year switcher is instant.
- DG-only fallback: if no DDG leaves for the demand, build a single-level tree from `DG_MAJOR_HEADS` for that demand.
- In `ReportBuilder.tsx`:
  - Add `expandedId: string | null` state.
  - Add a chevron button per table row that toggles `expandedId`.
  - When expanded, render an extra `<tr><td colSpan=9><DeepDivePanel … /></td></tr>` directly below the row.
  - Wire `onAddSelection(partial)` to `setSels(prev => [...prev, { ...newSelection(), ...partial, type: "ddg" }])` so users can promote a drilled level into the main comparison.
- Reuse existing formatters (`fmtCr`, `fmtPct`) and `inputCls`/`Field`/`Stat` helpers — no new design tokens.
- No data changes; no other files touched besides `ReportBuilder.tsx` and the new `DeepDivePanel.tsx`.

## Out of Scope

- Cross-demand DDG aggregation when `demandNo === "all"` (we open the demand list first instead).
- Persisting expansion state to URL.
- Editing values; this is read-only analysis.
