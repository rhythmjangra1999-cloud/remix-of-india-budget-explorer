# Data files

All app data lives in this folder as static JSON. To refresh data, replace these files with the same schema.

## Files

| File | Purpose |
|---|---|
| `meta.json` | Top-level FY, total Union Budget, coverage counts. |
| `ministries.json` | All 102 union ministries with totals per FY. |
| `demands.json` | Demands for Grants per ministry. |
| `ddgs.json` | Detailed DG rows (object-head granularity) for live ministries only. |
| `transfers.json` | Center → State / scheme flows (sparse — many flagged unknown). |
| `coverage.json` | Per-ministry parse / validation status. |
| `findings.json` | Editorial notes — short articles. |

## Schemas

See `src/data/types.ts` for canonical TypeScript types. Amounts are in **₹ Crore** unless noted.

## Confidence levels

- `validated` — manually checked against source PDF
- `parsed` — extracted programmatically, not yet reviewed
- `ocr-needed` — source PDF requires OCR; figures provisional or missing
