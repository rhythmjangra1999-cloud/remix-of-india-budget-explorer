## Problem

The DDG drill-down currently renders **five** levels under each Major Head:

```text
Sub-Major (00) → Minor (103) → Sub (15) → Detailed (01) → Object (31)
```

This produces noisy, redundant rows like "Sub-Major 02 / Sub-Major 02" and "Detailed 02 / Detailed 02" because the source data only labels combined codes, not individual segments.

The correct CGA budget code hierarchy (from the rules you sent) is:

| Code pattern | Level | Example |
|---|---|---|
| `XXXX` | Major Head | `2401` Crop Husbandry |
| `XX.XXX` | Sub-Major + Minor (single level) | `00.103` Seeds |
| `XX.XX` | Sub-Head + Detailed (single level) | `15.01` Statutory Body |
| `XX.XX.XX` | Object Head (leaf) | `31` Grants-in-aid-General |

So the tree under a Major Head should be **3 levels deep**, not 5.

## Fix

### 1. `src/lib/ddg.ts` — rebuild tree as 3 levels

Replace the `buildDDGTree` grouping path:

```text
// before
[ subMajor, minor, sub, detailed, object ]

// after
[ `${subMajor}.${minor}` ,  `${sub}.${detailed}` ,  object ]
```

`DDGNode.level` becomes one of `"minor" | "subHead" | "object"` (renamed for clarity).

Node naming rules:
- Minor node → `code = "${subMajor}.${minor}"`, `name = minorHeadName` (e.g. `00.103 Seeds (Minor Head)`).
- Sub-Head node → `code = "${sub}.${detailed}"`, `name = subHeadName` (e.g. `15.01 Statutory Body`).
- Object node → `code = objectHead`, `name = objectHeadName`.

The `MinorHeadRow` summary used by Tier 1 stays one row per `subMajor.minor` group (already effectively the case; key changes from `minorHead` alone to `${subMajor}.${minorHead}` so two different sub-majors with the same minor code don't collide).

### 2. `MinorHeadInline.tsx` — show full `subMajor.minor` code

Display the prefixed code (`00.103`) instead of just `103`. No structural changes.

### 3. `DDGTreeNode.tsx` — drop the `subMajor` and `detailed` labels

- Update `LEVEL_LABELS` to the new three-level enum: `Minor`, `Sub-Head`, `Object`.
- Default expand depth: open Minor by default; Sub-Head and Object collapsed (the previous default of "expand to depth 2" remains correct for a 3-level tree).
- Search/`hideTokens` logic unchanged.

### 4. `DDGSheet.tsx` — header column unchanged

The column grid (`Hierarchy / Actuals / BE25 / RE25 / BE26 / YoY`) and totals are unchanged. Only the body uses the new node shape.

### 5. Re-verify the source data

The existing `src/data/ddgs/agri-ddg.json` already has the correct flat columns from the FY26-27 CSVs (`sub_major`, `minor_head`, `sub_head`, `detailed_head`, `object_head`, `sub_head_name`, etc.). It does **not** need to be regenerated — the bug is purely in how `buildDDGTree` groups it. After the change, the tree for `2401 / Demand 1` will look like:

```text
00.103  Seeds (Minor Head)              ₹ … 
  15.01  Statutory Body                  ₹ …
    31   Grants-in-aid-General           ₹ …
    35   Grants for creation of …        ₹ …
    36   Grants-in-aid-Salaries          ₹ …
  24.01  Establishment                   ₹ …
    01   Salaries                        ₹ …
    02   Wages                           ₹ …
    …
02.797  Transfer to Reserve Funds…       ₹ …
  02.00  Pradhan Mantri Fasal Bima Yojna ₹ …
    63   Inter Account Transfers         ₹ …
```

## Files

- edit — `src/lib/ddg.ts` (rewrite `buildDDGTree`, narrow `DDGNode["level"]` union, adjust `getMinorHeadSummary` key to `subMajor.minor`).
- edit — `src/components/explorer/ddg/DDGTreeNode.tsx` (new `LEVEL_LABELS`, no other behaviour change).
- edit — `src/components/explorer/ddg/MinorHeadInline.tsx` (display `subMajor.minor` code).
- no change — `DDGSheet.tsx`, `agri-ddg.json`, totals/aggregations.

## Acceptance

- Opening `2401 Crop Husbandry` no longer shows the duplicated "Sub-Major 02 / Sub-Major 02" or "Detailed 02 / Detailed 02" rows.
- Tree under each Major Head is exactly 3 levels deep (Minor → Sub-Head → Object).
- Codes shown match CGA convention: `00.103`, `15.01`, `31` etc.; `fullCode` on hover stays the dotted leaf code (`2401.00.103.15.01.31`).
- Subtotals at every level still equal the sum of their children.
