## Goal

Replace the Proof section's static "Top ministries by allocation" snapshot with an **interactive Agriculture case-study infographic** on the left and a synced **4–5 key insights** column on the right. The two panels stay interlinked: clicking a view on the left updates which insights are emphasized on the right.

## Left panel — Agriculture infographic (tabbed)

A small tab strip at the top lets the reader switch between four views, all sourced from data already in the project:

1. **Demands** — DAFW (D001) + DARE (D002), BE 2026-27 vs 2025-26. Two-bar comparison + total. Source: `src/lib/agri.ts` (`ALL_AGRI`, `computeKpis`, `filterRows`).
2. **Major → Object** — Top Major Heads under Agriculture (e.g., 2401 Crop Husbandry, 2415 Agri Research) with the largest Object Head inside each shown as a sub-bar. Source: `src/lib/agri.ts` hierarchy helpers (already used in `AgriJourney`).
3. **Schemes** — Top 6 agriculture schemes by BE 26-27 (PM-KISAN, PMFBY, etc.). Source: `src/data/schemes.json` filtered to DAFW/DARE demand IDs (logic mirrors `Builder` scheme preset).
4. **States — UP & Punjab** — Side-by-side bars: UP Agriculture total (9 demands) vs Punjab Agriculture total (Demands 1 + 34), BE 26-27. Source: `src/lib/up-agri.ts` and `src/lib/punjab-agri.ts` (`computeKpis`).

Each view keeps the existing visual language: numbered rows, thin horizontal bars, ₹ Cr in mono, share %, and a footer line "Source · Demands for Grants 2026-27" with an **Open in Builder / Open case study** deep link that changes per tab (e.g. → `/ministry/agriculture`, `/states/uttar-pradesh/agriculture`, `/states/punjab/agriculture`, `/builder?preset=schemes-pm`).

## Right panel — 4–5 key insights (synced)

A single "Suggested insights" column with 4–5 cards. The card relevant to the active left-tab is highlighted (primary border / tag color); the others stay visible but muted. Draft copy (numbers will be computed live from the same selectors so they always match the left):

1. **Agri envelope** — "DAFW + DARE together get ₹X k Cr in BE 26-27, Y% of the Union Budget." (active on Demands tab)
2. **Where it concentrates** — "Crop Husbandry (MH 2401) alone absorbs Z% of the agri outlay; within it, one object head — Grants-in-Aid / Subsidies — dominates." (active on Major→Object tab)
3. **Scheme gravity** — "Top 3 schemes (PM-KISAN, PMFBY, Modified Interest Subvention) account for N% of all agri scheme spend." (active on Schemes tab)
4. **State transfers** — "UP's own Agriculture envelope (₹A Cr) is ~M× Punjab's (₹B Cr) — sub-national budgets reveal what Union aggregates hide." (active on States tab)
5. **Reproducible** — "Every number above traces back to a Demand-for-Grants page; open the same view in the case study or Builder." (always visible, neutral)

## Technical notes

- Edit only `src/pages/Index.tsx` `ProofSection` (lines 312–445). No new pages, no data changes.
- New small components live inside the same file (or a single new `src/components/home/ProofAgriInfographic.tsx` if it grows past ~150 lines).
- Reuse selectors: `computeKpis`, `filterRows` from `@/lib/agri`, `@/lib/up-agri`, `@/lib/punjab-agri`; scheme totals from `@/data/schemes.json` filtered by `demandId ∈ {d001, d002}`.
- Reuse `formatCr` from `@/lib/format`.
- Tab state via `useState<"demands" | "heads" | "schemes" | "states">`; right-panel highlighting derived from the same state.
- Keep all text **left-aligned** and use semantic tokens only (per project memory). No new colors.
- The old `topMinistries` / `totalCr` props become unused; remove from the `ProofSection` call site at line 133.

## Out of scope

- No changes to `AgriJourney`, `Builder`, `States`, or any data files.
- No new routes or nav entries.
- No animation beyond existing hover transitions.