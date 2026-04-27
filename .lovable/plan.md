## Goal

Replace every number in the 1860 → 2026-27 Union Budget series with values that match official records (PIB, indiabudget.gov.in expenditure tables, RBI Handbook of Statistics, PRS India). Today the series is mostly **log-linear interpolated** between sparse anchors, and a few real anchors are also off (most importantly: FY 2026-27 shows ₹55 lakh cr — the official BE is ₹53.47 lakh cr; FY 1991 is duplicated; FY 2014 BE is overstated by ~₹2 lakh cr; and `meta.json` shows ₹162 lakh cr, ~3× the real budget).

## Fact-check before changes

Verified against PIB / indiabudget.gov.in / PRS India / RBI Handbook:

- **FY 2026-27 BE**: ₹53,47,315 cr (≈ ₹53.47 lakh cr) — *not ₹55 lakh cr, and certainly not ₹150 lakh cr.*
- **FY 2025-26 BE**: ₹50,65,345 cr.
- **FY 1947-48** (first free-India budget, Shanmukham Chetty): ₹197.39 cr ✓ (already correct).
- "₹150 lakh crore" intuition aligns with **India's nominal GDP** (~₹3.5 trn USD) or roughly Centre+States combined, not the Union Budget alone.

## Source-of-truth anchors (FY → Total Expenditure BE, ₹ crore)

These will be the only **hard** rows. Every year between two anchors is log-linear interpolated and flagged `interpolated: true`.

```text
Pre-Independence (sparse, reconstructed — flagged "estimated")
  1860 → 0.5            (Wilson's first budget, ~₹50 lakh)
  1870 → 3.55           (user-cited figure)
  1900 → ~80
  1921 → ~130           (Railway Budget separated)
  1939 → ~170
  1946 → ~200           (last colonial budget)

Post-Independence (annual, hard values from official records)
  1947 → 197.39         (first free-India budget)
  1950 → 347
  1960 → 1,127
  1970 → 3,981
  1980 → 23,259
  1990 → 1,13,422
  2000 → 3,38,487
  2010 → 11,08,749
  2014 → 17,94,892      (keep — matches 2014-15 BE)
  2015 → 17,77,477
  2016 → 19,78,060
  2017 → 21,46,735      (Rail Budget merged)
  2018 → 24,42,213
  2019 → 27,86,349
  2020 → 30,42,230      (COVID stimulus)
  2021 → 34,83,236
  2022 → 39,44,909
  2023 → 45,03,097
  2024 → 48,20,512
  2025 → 50,65,345      (BE 2025-26, was 50,54,097 — slightly off, looked like RE)
  2026 → 53,47,315      (BE 2026-27, was 55,00,000 — too high)
```

## What changes

### 1. `src/data/budget-history.json` — rewrite all 167 rows
- Lock the anchors above as exact values with `note` where editorial.
- Re-interpolate every year *between* two consecutive anchors with **log-linear** growth (matches the chart's log Y-axis so the line stays visually smooth).
- Flag pre-1947 non-anchor years as `interpolated: true` and pre-1947 anchors as `estimated: true`. Post-1947 years between two real anchors stay `interpolated: true`; years that *are* anchors carry no flag.
- Fix two structural bugs already in the file:
  - **1990 and 1991 both show ₹1,13,422 cr** (1991-92 BE is actually ~₹1,17,114 cr; 1990 should be the prior year's BE).
  - **2015 < 2014** (₹17.77 L cr < ₹17.94 L cr). Real BE for 2015-16 was ₹17,77,477 cr after the new accounting classification; keep that, but add a `note` so the visual dip is explained on hover.
- Update the top `_about` field to list the corrected provenance.

### 2. `src/data/meta.json` — fix the headline total
- `totalUnionBudgetCr`: `16284130.06` → **`5347315`** (BE 2026-27)
- `totalUnionBudgetPrevCr`: `15477959.08` → **`5065345`** (BE 2025-26)

This single change auto-corrects the hero "Gross Union Budget" stat and every "% of gross Union Budget" share calculation that consumes `BUDGET_META.totalUnionBudgetCr`.

### 3. `src/components/home/BudgetHistoryChart.tsx` — copy tweak
- Footnote currently says *"today's ₹55 Lakh Cr"* → change to *"today's ₹53 Lakh Cr"*. The pinned right-edge label and tooltip already read from JSON so they auto-update.

### 4. `src/pages/Index.tsx` — hero copy
- Replace the literal string *"₹55 lakh crore in 2026"* with *"₹53.47 lakh crore in 2026"*.

## Execution

A short Python script (run once via `code--exec`, output written straight to `src/data/budget-history.json`) takes the anchor table above, log-linearly interpolates every gap, attaches the editorial `note`s, and emits the JSON. Deterministic, easy to re-run if any anchor needs another correction later. No new dependencies; pure stdlib.

## Out of scope

- No new chart features (no inflation-adjustment, no GDP-share toggle).
- No changes to ministry/demand totals (`ministries.json`, `demands.json`) — those come from a different source and look internally consistent.
- No backend / DB.

## Files touched

- `src/data/budget-history.json` *(rewrite)*
- `src/data/meta.json` *(2 numbers)*
- `src/components/home/BudgetHistoryChart.tsx` *(footnote string)*
- `src/pages/Index.tsx` *(hero copy string)*
