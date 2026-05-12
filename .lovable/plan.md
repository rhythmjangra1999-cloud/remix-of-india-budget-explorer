## Goal

Simplify the homepage "Start from a question" entry tiles from 3 → 2, and reframe the Scheme tile around the DDG-to-state linkage idea.

## Changes

**File:** `src/pages/Index.tsx` (lines 81–100)

1. Remove the `02 — State` tile entirely (the only place it appears).
2. Renumber the Scheme tile from `03` → `02`.
3. Change grid from `md:grid-cols-3` → `md:grid-cols-2`.
4. Update Scheme tile copy:

   > **Scheme**
   > A cross-cutting view of all centrally-funded schemes — outlays, the ministries that run them, and where the money lands. We're starting with Central Sector and Centrally-Sponsored schemes, mapping each one back to its ministry's DDG (major-head → object-head) and forward to estimated flows into state department budgets.

   Link target unchanged: `/explorer?view=schemes`.

## Cleanup of "State" elsewhere

Search confirms `SankeyView` is only imported by itself — it is **not** mounted in `Explorer.tsx`, the SiteHeader nav, or any route. So no Explorer-nav change is needed; removing the homepage tile fully removes the State entry point from the user-facing app.

The orphaned file `src/components/explorer/SankeyView.tsx` will be **deleted** to avoid dead code (it pulls in `d3-sankey` only for this unused view).

## Out of scope

- No changes to the Schemes table view, data files, or the actual scheme→state estimation logic. The new copy describes the analytical direction; building the state-flow estimator is a separate task.
- No removal of `transfers.json` or related data — kept for the future state-flow work.
