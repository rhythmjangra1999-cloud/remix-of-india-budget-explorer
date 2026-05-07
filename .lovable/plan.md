## Goal

Build a guided "explore Agriculture end-to-end" flow so a first-time visitor can travel from the Ministry overview, down to Demands (DAFW/DARE), into Major Heads, and onward to Schemes — with a dedicated **Insights** tab and a step-by-step **Tutorial** overlay anchored to real Agri data.

---

## 1. User journey (the spine)

A persistent **JourneyStepper** at the top of `MinistryAgri` and the related Explorer views, showing where the user is:

```text
[1 Ministry] → [2 Demands] → [3 Major Heads] → [4 Schemes] → [5 Insights]
```

- Each step is a clickable chip. Active step is highlighted; completed steps get a check.
- State is held in the URL (`?step=demands&demand=1`) so the tutorial and deep links work.
- A "Next →" / "← Back" pair sits at the bottom of each step's content.

### Step content
1. **Ministry** — current `MinistryAgri` hero + KPIs + DemandsOverview cards.
2. **Demands** — DAFW vs DARE side-by-side: Grand Total, Revenue/Capital split, Recoveries, Expenditure Provision (the four cards already on Explorer, reused).
3. **Major Heads** — `MajorHeadTable` filtered to the chosen demand, with a "Top contributors" mini-bar above.
4. **Schemes** — scheme/transfer view (reuse `SchemeTableView`) scoped to Agriculture.
5. **Insights** — new tab (see §2).

---

## 2. Insights tab (the analytical payoff)

A new `AgriInsights` component rendered as the final step. Five insight cards, each with a one-line takeaway, a small chart/number, and a "Read more" expand:

1. **Charged vs Voted**
   - Definition block (Charged = non-votable, e.g. interest, court decrees; Voted = Parliament-approved).
   - Show the Charged/Voted split for DAFW and DARE.
   - Commentary: typical drivers (debt servicing, statutory transfers, salaries of constitutional posts).

2. **Revenue vs Capital — YoY delta**
   - Bars: BE 25-26 vs BE 26-27 for Revenue and Capital, per demand.
   - Auto-generated narrative: "Capital outlay rose X% — typically signals push on irrigation/infra; Revenue dipped Y% — usually subsidy rationalisation."
   - "Related coverage" panel: 3 curated article links (PIB / The Hindu / Indian Express on Agri budget). Stored in `src/data/agri-insights-links.json` for now; future Perplexity hook noted.

3. **Recoveries as % of Grand Total**
   - Big number: `Recoveries / Grand Total` for the ministry and per demand.
   - Threshold band: <2% normal · 2-10% watch · >10% high (interpretation: high recoveries with high gross outlay can signal churn / low net delivery).
   - Sparkline across Actuals 24-25 → BE 25-26 → RE 25-26 → BE 26-27.

4. **Major Head contribution**
   - Horizontal bar of top 8 Major Heads by BE 26-27 share of demand total.
   - Toggle: "Share this year" vs "YoY change in share" (which heads are gaining/losing weight).

5. **Expenditure Provision arithmetic**
   - Visual equation: `Grand Total − Recoveries = Expenditure Provision`, populated with live Agri numbers.
   - Comparison strip: same equation for Union total vs Agri, so the user sees scale.

---

## 3. Tutorial overlay

A lightweight, dismissible coach-mark tour using Agri as the example. Triggered by:
- A "Take the tour" button in the Ministry header.
- First-visit auto-open (stored in `localStorage: agri-tour-seen`).

### Tour stops (8 steps)
1. Ministry header — "This is the ministry-level view…"
2. KPI strip — what BE / YoY / Revenue / Capital mean.
3. JourneyStepper — "You'll move through these 5 steps."
4. Demands cards — Grand Total composition.
5. **Expenditure Budget card** — explain `Total − Recoveries` with the live Agri numbers.
6. Major Heads table — sorting, status pills, codes.
7. Schemes view — how money reaches states/beneficiaries.
8. Insights tab — what to look for.

Implementation: a small custom `<TourProvider>` (no new dep) that renders a fixed overlay with a spotlight rectangle around `data-tour="step-id"` targets. Keyboard: `→`/`←`/`Esc`.

---

## 4. Definitions / glossary

Add a `<Definition>` inline component (hover/tap popover) used wherever these terms appear: **Charged**, **Voted**, **Revenue Section**, **Capital Section**, **Grand Total**, **Recoveries**, **Expenditure Provision**, **Major Head**, **DDG**. Definitions stored in `src/data/glossary.json`.

---

## Technical details

- **Routing**: keep `/explorer/agri` (or `/ministry/agriculture`) as the journey root; sub-steps via `?step=` so deep-links + tutorial both work.
- **New files**:
  - `src/components/agri/JourneyStepper.tsx`
  - `src/components/agri/AgriInsights.tsx` (+ small subcomponents per insight)
  - `src/components/agri/Definition.tsx`
  - `src/components/tour/TourProvider.tsx`, `TourSpotlight.tsx`
  - `src/data/glossary.json`, `src/data/agri-insights-links.json`
- **Reuse**: `DemandsOverview`, `MajorHeadTable`, `SchemeTableView`, `ExpenditureBudgetCard` (lift from `Explorer.tsx` into `src/components/explorer/ExpenditureBudgetCard.tsx` so both Explorer and Insights share it).
- **Data**: Charged/Voted split is not in our JSONs yet — add a `voted`/`charged` aggregate per demand in `src/data/agri-charged-voted.json` (you'll provide the numbers, or we estimate from existing rows where `voted` flag exists).
- **No backend** required for v1. Article links are static; we can wire Perplexity later for live "related coverage".

---

## Out of scope (v1)

- Live news fetch (Perplexity/Firecrawl) — stub with curated links.
- Charged/Voted interactive drill — only summary numbers in v1.
- Mobile tour polish beyond basic responsive — desktop-first.

---

## Open questions

1. Charged/Voted numbers — do you have a source sheet, or should we derive from the existing DDG `voted` flag where present?
2. For "related coverage", okay with 3 hand-picked links per insight for v1, then add Perplexity later?
3. Should the journey replace the current `MinistryAgri` page, or live alongside it at `/ministry/agriculture/journey`?