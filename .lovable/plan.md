## Goal

Let users drill from a Major Head row inside a Demand all the way down to object-head detail (the same hierarchy as the uploaded `1.1.FY27.csv`: Major → Sub-Major → Minor → Sub-Head → Detailed → Object). Keep the current Demand page calm — no third nested table directly on the page.

## UX pattern — two tiers, no clutter

We keep the current Major Heads table exactly as it is (with Revenue/Capital subtotals + Grand Total). We add **two complementary entry points** off each Major Head row:

```text
[ Code | Major Head Name | Section | Actuals | BE25 | RE25 | BE26-27 | YoY | ▸ ]
                                                                            │
                  click ▸ on row  ──►  inline accordion expands underneath
                                       (Minor Head summary, ~5–15 rows)
                                       │
                                       └── "Open full breakdown ↗"  ──►  side sheet (Sheet/Drawer)
                                                                          full Major→Minor→Sub→Object tree
                                                                          with search, gap badges, CSV
```

### Tier 1 — Inline expand (Minor Head summary)
- Adds a chevron column to `MajorHeadTable`. Clicking expands an in-table row showing **only Minor Head subtotals** for that Major Head: code · name · 4 yrs · YoY · share-of-MH bar.
- Typical 3–15 rows per MH — small enough not to overwhelm.
- Multiple rows can be expanded; expand-all/collapse-all buttons in the toolbar.
- Subtotal/Grand Total rows are not expandable.

### Tier 2 — Side sheet (full DDG tree)
- A "View full breakdown ↗" link inside the expanded row, plus a clickable Major Head name, opens a right-side **Sheet** (existing `components/ui/sheet.tsx`).
- The sheet shows the full nested tree for that Major Head: **Sub-Major → Minor → Sub-Head → Detailed → Object**, with subtotals at every level.
- Sheet header: MH code + name, demand context, BE 26-27 with YoY pill, gap-flag count chips (DISCONTINUED · NEW · SMALL_BASE · TOKEN).
- Body: collapsible tree (default expanded to Minor; deeper levels lazy-expand). Each leaf shows object-head name, 4 years, YoY pill, full code (`2401.00.103.15.01.31`), and a gap badge if applicable.
- Sheet toolbar: search, "Hide token/small-base rows" toggle, CSV export of just this MH.
- Mobile: same Sheet slides up as bottom drawer.

This keeps the Demand page surface unchanged; depth is opt-in per MH.

## Coverage scope

DDG drill-down only lights up for Major Heads we have detailed data for. For others the chevron is replaced by a "—" with a tooltip "Detailed DG not yet parsed" — same pattern as the existing coverage chips. Initial coverage = Agriculture (DAFW Demand 1 + DARE Demand 2) from the uploaded CSVs.

## Data model

New file `src/data/ddgs/agri-ddg.json` produced by a one-off conversion of `1.1.FY27.csv` + `1.2.FY27.csv`. Each leaf row already exists in the CSV; we keep the flat shape and build the tree in-memory.

```ts
type DDGLeaf = {
  id: string;            // full_code, e.g. "2401.00.103.15.01.31"
  ministry: "DAFW" | "DARE" | string;
  demandNo: number;
  section: "Revenue" | "Capital";
  majorHead: string;     // "2401"
  majorHeadName: string;
  subMajor: string;      // "00"
  minorHead: string;     // "103"
  minorHeadName: string;
  subHead: string;       // "15"
  detailedHead: string;  // "01"
  subHeadName: string;
  objectHead: string;    // "31"
  objectHeadName: string;
  actuals2425: number | null;
  be2526: number | null;
  re2526: number | null;
  be2627: number | null;
  gapFlag: "DISCONTINUED" | "NEW" | "SMALL_BASE" | "TOKEN" | null;
  gapReason: string | null;
};
```

`src/lib/ddg.ts` exposes:
- `getDDGLeaves(demandNo, majorHead)` → flat leaves
- `buildDDGTree(leaves)` → nested SubMajor→Minor→Sub→Detailed→Object with subtotals at each node
- `getMinorHeadSummary(demandNo, majorHead)` → Tier-1 rows (one per Minor Head) with subtotals
- `hasDDG(demandNo, majorHead)` → boolean for chevron enable
- `getGapCounts(leaves)` → `{ DISCONTINUED, NEW, SMALL_BASE, TOKEN }`

Figures stay in ₹ Lakh inside the source rows (CSV uses lakh) and are converted to ₹ Cr at render via existing `formatCrore`. We'll divide by 100 once on load to keep a single unit (₹ Cr) across Tier 1, Tier 2, and CSV export so totals reconcile with the existing Major Head table.

## Files

- new — `src/data/ddgs/agri-ddg.json` (generated from the two CSVs)
- new — `src/lib/ddg.ts` (loaders + tree builder + aggregations)
- new — `src/components/explorer/ddg/MinorHeadInline.tsx` (Tier 1 row body)
- new — `src/components/explorer/ddg/DDGSheet.tsx` (Tier 2 side sheet with the recursive tree)
- new — `src/components/explorer/ddg/DDGTreeNode.tsx` (recursive node renderer)
- edit — `src/pages/Explorer.tsx` → `MajorHeadTable`: add chevron col, expanded state set, "View full breakdown" trigger, and selectedMH state to drive the sheet
- edit — `src/components/explorer/agri/MajorHeadTable.tsx` (mirror the same affordance for the dedicated Agriculture page so behaviour is consistent)

## What stays the same

- Demand header (3 summary cards: Revenue / Capital / Total) — unchanged.
- Major Head table rows, subtotals, Grand Total — unchanged.
- Sidebar, section toggle, sort chips, CSV export of MH table — unchanged.
- No new tab on the page; the deep view is a transient sheet.

## Acceptance

- Click the chevron on `2401 Crop Husbandry` (Demand 1, DAFW) → inline row reveals Minor Head subtotals (Seeds, Crop Insurance, etc.) with 4-yr figures + YoY.
- Click "View full breakdown ↗" → right sheet opens with the full Sub-Major→Minor→Sub→Object tree, gap badges, search, and CSV export limited to that MH.
- Major Heads without detailed data show a disabled chevron with tooltip — no broken state.
- Subtotals at every level reconcile to the parent figure within ±1 ₹ Cr (rounding).
