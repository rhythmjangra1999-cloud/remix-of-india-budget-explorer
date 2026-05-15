# Scheme → DDG Mapping & Drill-Down

## Goal

For every Centrally Sponsored / Central Sector scheme in `schemes.json`, find where it appears inside the demand's DDG (Major Head → Sub-Major → Minor → Sub-Head/Detailed → Object Head) using fuzzy name matching. Show users a per-scheme breakdown of every DDG leaf row (with all year columns) that maps to it, and a total reconciliation against the scheme's recorded outlay.

## Approach

### 1. Build a static mapping file (one-time, offline)

Script: `scripts/build-scheme-ddg-map.ts` (run via Python in sandbox, output JSON).

For each scheme:
- Filter DDG leaves to the same demand number (`grantCode === demandNo`).
- Search DDG leaves where any of `minorHeadName`, `subHeadName`, `detailedHead`name, or `objectHeadName` substring-matches the scheme name (after normalization: lowercase, strip punctuation, collapse spaces, drop common stopwords like "scheme", "programme", "mission", "national", "pradhan mantri" only when both sides have them).
- Use a **two-pass strategy**:
  1. Exact normalized match on a sub-head/detailed-head/minor-head node → take **all descendant leaves** under that node.
  2. Token-overlap fallback (Jaccard ≥ 0.6 on significant tokens, min 2 shared significant tokens) → take matching leaves.
- Record for each scheme: `matchedLeafIds[]`, `matchKey` (which name level matched), `matchConfidence` ("exact" | "fuzzy" | "none"), and the **summed total** across matched leaves for BE 2026-27.
- Compute `reconciliation = sumMatchedBE2627 - scheme.outlayCr` and a `reconStatus` ("match" within ±1 Cr, "close" within ±5%, "off", "unmatched").

Output: `src/data/scheme-ddg-map.json` shape:
```ts
{
  schemes: [{
    schemeCode, schemeName, schemeType, ministry, demandNo,
    outlayCr, sumMatchedBE2627, reconStatus,
    matchedLeafIds: string[],   // leaf.id values from all-ddg.json
    matchedAtLevel: "minor" | "subHead" | "object" | null,
    matchConfidence: "exact" | "fuzzy" | "none"
  }]
}
```

### 2. Loader: `src/lib/scheme-ddg.ts`

Exports `getSchemeDDGMap(schemeCode)` returning the mapping entry plus the resolved `DDGLeaf[]` rows from `all-ddg.json`. Also `getSchemeDDGTree(schemeCode)` that builds a mini DDGNode tree (reuses the existing `buildDDGTree` grouping logic, scoped to the matched leaves only).

### 3. UI: scheme drill-down

- **Where:** `src/components/explorer/SchemeTableView.tsx` already lists schemes. Add a chevron / "View in DDG" affordance on each row for CSS and Central Sector schemes that have a mapping.
- **Component:** `src/components/explorer/SchemeDDGSheet.tsx` — a `<Sheet>` (mirrors `DDGSheet.tsx`) opened when a scheme is clicked. Contents:
  - Header: scheme name, type chip, ministry, demand no.
  - Stat row: Recorded outlay (from schemes.json), Sum of matched DDG leaves (BE 26-27), Δ with color-coded reconciliation badge.
  - Match-confidence badge ("Exact name match at Sub-Head" / "Fuzzy match — review").
  - Tree: same `DDGTreeNode` rows as the existing DDG sheet, scoped to matched leaves, with full Major→Object path visible. All year columns (Act 23-24 → BE 26-27 + YoY) shown so totals can be verified.
  - "Open full demand DDG" link to existing `DDGSheet`.
- **Unmatched schemes:** show a muted "No DDG mapping found" with a "Report" hint instead of the chevron.

## Files

**Created:**
- `scripts/build-scheme-ddg-map.py` (build script, sandbox-run, not bundled)
- `src/data/scheme-ddg-map.json`
- `src/lib/scheme-ddg.ts`
- `src/components/explorer/SchemeDDGSheet.tsx`

**Edited:**
- `src/components/explorer/SchemeTableView.tsx` — add row click → open sheet, render reconciliation chip per row.

## Out of scope

- No edits to ministry/demand pages, sunburst, or homepage.
- No editorial overrides for unmatched schemes — those will show as "unmatched" until a manual override file is added later (can be a follow-up: `src/data/scheme-ddg-overrides.json`).
- No backend / Lovable Cloud changes — fully static.

## Notes for matching quality

- Expect ~50–70% auto-match coverage given the name-quality variance. Reconciliation status will surface mismatches so you can see where the heuristic missed (e.g., schemes that sit under a generic Minor like "0.789 Special Component Plan").
- After first build I'll print a coverage report (matched / fuzzy / unmatched counts by ministry) so you can decide whether to add manual overrides.
