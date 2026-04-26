## Add a "1860 → 2026" Union Budget history chart to the hero

Replace the 5-row text timeline on the right side of the homepage hero with a real, interactive line chart of total Union Budget expenditure across ~165 years — same minimalist red-area style as the reference image, but tuned to our editorial design system.

### What the user sees

```text
Trace the rupee.                       │  ┌──────────────────────────────────┐
The pulse of public spending.          │  │  Total Union Budget · ₹ crore    │
                                       │  │                                  │
[copy paragraphs]                      │  │                          ╭──     │
                                       │  │                       ╭──╯       │
[Open Explorer] [Read Tutorial]        │  │                   ╭───╯          │
                                       │  │  ──────────╴╴╴╴╴╴╴╯ 55,00,000 Cr │
                                       │  │  1860   1900   1947  1991  2026  │
                                       │  └──────────────────────────────────┘
                                       │  Hover any year for the figure +
                                       │  what was happening that year
```

- **Single line + soft area fill** in the brand primary (terracotta), on `paper` background. No gridlines except a faint baseline.
- **Log scale Y axis** (essential — 1860's ₹50 lakh next to 2026's ₹55 lakh crore is otherwise invisible). Y-axis labels suppressed; instead show the latest value pinned at the line's right edge (like the reference).
- **X axis**: sparse year ticks at 1860, 1900, 1947, 1971, 1991, 2014, 2026.
- **Hover tooltip**: year, total expenditure (formatted ₹X Lakh Cr / ₹Y Cr), and a 1-line caption for marquee years (e.g. 1947 "First budget of free India", 1991 "Liberalisation", 2017 "Rail Budget merged").
- **Era markers**: 4 thin vertical reference lines for 1947 (Independence), 1991 (Reforms), 2017 (Rail merge), with tiny labels along the top of the chart.
- Below the chart, a one-line caption: *"Total expenditure across 165 budgets. Log scale. Sources: indiabudget.gov.in archive, PIB, RBI Handbook of Statistics."*

### Data

Create `src/data/budget-history.json` — annual rows `{ year, totalCr, note? }` from FY 1860-61 through FY 2026-27. Strategy:

- **Pre-Independence anchor points** (4–6 rows, sparse): 1860 (₹50 lakh, Wilson's first budget), 1870 (~₹3.55 lakh — figure user cited), 1900, 1921 (Railway budget separated), 1939, 1946-47 (last colonial budget). Interpolate linearly between anchors so the line is continuous but honest — flagged in `note` field.
- **Post-Independence (1947-48 → 2026-27)**: full annual series. Sources: PIB "Story of India's Union Budgets", indiabudget.gov.in expenditure tables, Wikipedia "Union budget of India", RBI Handbook. Use **Total Expenditure (BE)** consistently. Notable anchor values: 1947-48 ₹197 Cr, 1950-51 ₹347 Cr, 1960-61 ₹1,127 Cr, 1970-71 ₹3,981 Cr, 1980-81 ₹23,259 Cr, 1990-91 ₹1,13,422 Cr, 2000-01 ₹3,38,487 Cr, 2010-11 ₹11,08,749 Cr, 2020-21 ₹30,42,230 Cr, 2026-27 ₹55,00,000 Cr (from existing meta).
- ~12 of the 165 rows carry an editorial `note` (e.g. "Independence", "Bank nationalisation", "Liberalisation", "GST rollout", "COVID stimulus", "Rail merge"). Only these notes appear in the tooltip and as marker labels.

The JSON is the single source of truth — easy to correct/extend later. A short `README` block at top of the file lists the source per era.

### Components

- **`src/components/home/BudgetHistoryChart.tsx`** *(new)* — built with **Recharts** (already pinned in the project; used by `RupeeDonut`/etc.). `<ResponsiveContainer>` + `<AreaChart>` + log-scale Y. ~120 LOC. Exposes a `compact?: boolean` prop so we can reuse it elsewhere later.
- Tooltip is a custom component reading the `note` field; year markers via `<ReferenceLine>`.

### Hero integration (`src/pages/Index.tsx`)

- Replace the right-rail `<aside>` (lines ~67–95, the 5-item `<ol>`) with the chart component inside the same `lg:col-span-5 lg:pl-8 lg:border-l` container.
- Kicker stays: *"165 years of the Union Budget"* (updated from 156).
- Footnote line below the chart replaces the current "Figures shown at the scale they were published in." copy.
- Everything else on the page is untouched.

### Out of scope

- No inflation-adjusted toggle, no GDP-share toggle, no zoom/brush. Single, calm view.
- No new route or page — the chart only appears in the hero (we may reuse it on Tutorial later, separate task).
- No backend / Cloud — pure static JSON, ships with the bundle (~3 KB gzipped).

### Files touched

- `src/data/budget-history.json` *(new)*
- `src/components/home/BudgetHistoryChart.tsx` *(new)*
- `src/pages/Index.tsx` *(edit hero right-column only)*
