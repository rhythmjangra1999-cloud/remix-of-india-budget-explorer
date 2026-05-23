
## Goal

Open up a new "States & UTs" axis of analysis, parallel to the existing Union explorer, and seed it with the first live dataset: **Uttar Pradesh · Agriculture & Allied** (9 demands, grants 010–018).

Note: The upload contains **9 CSVs (grants 010–018)**, not 10. I'll treat that as the canonical demand list for UP Agriculture unless you tell me otherwise.

## What gets built

### 1. States & UTs index page — `/states`
- Route + nav entry ("States" in `SiteHeader`).
- Editorial intro in the same serious/left-aligned ledger style as `/` (Problem → Solution).
- Grid of all 28 states + 8 UTs as cards. Each card: state name, short code, status chip.
  - **UP** → status `live · agriculture`, links to `/states/uttar-pradesh`.
  - All others → status `placeholder`, card is non-interactive (or routes to a stub "coming soon" page).

### 2. Uttar Pradesh state page — `/states/uttar-pradesh`
- Header: "Uttar Pradesh · State Budget 2026-27", kicker, methodology note.
- "Ministries / Departments" section — placeholder grid of UP's ~56 departments (same look as the states grid).
  - **Agriculture & Allied** → `live`, links to `/states/uttar-pradesh/agriculture`.
  - All others → `placeholder` chips, no link.
- A short list of all UP departments hard-coded from a static `up-ministries.json` (names only, no totals). We can replace this list later; the names are just labels for now.

### 3. UP Agriculture explorer — `/states/uttar-pradesh/agriculture`
Mirrors the existing Union Agriculture journey (`AgriJourney.tsx` + `components/explorer/agri/*`), but driven by the 9 UP CSVs.

- **Data ingestion** (build-time, static JSON in repo — no backend):
  - Script `scripts/build-up-agri.py` reads `src/data/states/uttar-pradesh/agriculture/raw/up_grant_0{10..18}.csv`.
  - Emits one normalized JSON: `src/data/states/uttar-pradesh/agriculture/ddgs.json`.
  - Row shape mirrors `AgriRow` in `src/lib/agri.ts`, extended with:
    - `demandId: "d010" … "d018"`
    - `demandNo: 10…18`
    - `demandTitle` (English from `ministry` column)
    - bilingual fields: `majorHeadNameHi`, `subMajorHeadNameHi`, `minorHeadNameHi`, `objectHeadNameHi`, `subHeadName` (already Hindi in source — kept as-is).
  - Numeric fields: `actuals2425`, `be2526`, `re2526`, `be2627`.
  - Gap flags computed same way as Union (NEW / DISCONTINUED / SMALL_BASE).

- **Selectors lib** `src/lib/up-agri.ts`:
  - `UP_AGRI_ALL`, `UP_DEMANDS` (id, no, titleEn), `filterRows`, `computeKpis`, `buildHierarchy`, `topMovers`, `getMajorHeads`, `getDemandSummaries` — same API surface as `src/lib/agri.ts` so existing components can be re-used with minimal forking.

- **Page composition** — copy of `AgriJourney` adapted to UP:
  1. Demands overview (9 cards, EN title + Hindi short, BE 26-27 total, YoY).
  2. Demand filter (All · 010 … 018).
  3. KPI strip (total BE, YoY, revenue/capital split, row count, flagged count).
  4. Major-head table.
  5. Sunburst + linked hierarchy table (Major → Minor → SubHead → Object), with Hindi names shown under English where present.
  6. Top movers (hikes / cuts).
  7. Source footer pointing to the original PDFs (`source_pdf` column).

- Hindi handling: render Hindi name as a smaller second line under the English label (e.g. in table rows and sunburst tooltips). No transliteration; preserved verbatim from CSV.

### 4. Cross-links
- Home page (`/`): add a thin "States & UTs" entry in the existing nav grid (without restructuring the page).
- Union Agriculture page: small footer link "See state-level: Uttar Pradesh →".

## Out of scope (this round)
- Other states' data (placeholders only).
- Other UP departments beyond Agriculture (placeholders only).
- Center→State transfer reconciliation between Union and UP figures.
- Search/global index updates for UP rows.

## Technical notes

```
src/
  data/states/
    states-index.json                 # 28 states + 8 UTs, status per state
    uttar-pradesh/
      up-ministries.json              # ~56 dept names, status per dept
      agriculture/
        raw/up_grant_010_rows.csv …   # checked-in source
        ddgs.json                     # normalized, built by script
  lib/
    up-agri.ts                        # selectors mirroring agri.ts
  pages/
    States.tsx                        # /states
    StateUttarPradesh.tsx             # /states/uttar-pradesh
    UPAgriJourney.tsx                 # /states/uttar-pradesh/agriculture
  components/states/
    StateCard.tsx
    DepartmentCard.tsx
scripts/
  build-up-agri.py                    # CSVs → ddgs.json
```

Routes registered in `src/App.tsx`. `SiteHeader` gets one new top-level link: **States**.

## Open questions

1. The upload has **9 demands (010–018)**, not 10. Proceed with 9, or are you expecting a 10th file?
2. For the ~56 UP department placeholders, do you have a canonical list, or should I generate one from a standard UP Budget department list?
