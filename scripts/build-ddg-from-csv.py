#!/usr/bin/env python3
"""
Build src/data/ddgs/all-ddg.json from a flat reconciled DDG CSV.

Usage:
    python3 scripts/build-ddg-from-csv.py path/to/DDG_Combined_v*.csv

The CSV is expected to have one row per (financial_year × full_code × demand).
Rows for FY 2025-26 and FY 2026-27 are merged on (demand_no, full_code) so each
JSON record carries the full 4-year history.

Values in the CSV are in ₹ thousands; JSON stores them in ₹ crores (÷10,000).
"""
import csv, json, sys
from collections import defaultdict
from pathlib import Path

SCALE = 10_000.0  # CSV ₹ thousands → JSON ₹ crores

def num(s):
    if s is None or s == "" or s == "nan": return None
    try:
        v = float(s)
        return round(v / SCALE, 4)
    except ValueError:
        return None

def clean_code(s, pad=0):
    """'2401.0' → '2401' ; '0.0' → '00' (padded) ; '' → ''"""
    if s is None or s == "" or s == "nan": return ""
    s = str(s).strip()
    if s.endswith(".0"): s = s[:-2]
    if pad and s.isdigit(): s = s.zfill(pad)
    return s

def norm(s):
    """Case- and whitespace-insensitive scheme-name normalization."""
    return (s or "").strip().upper()

def main(csv_path: str, out_path: str):
    # IMPORTANT: a (demand, full_code) can correspond to MULTIPLE distinct schemes
    # because the canonical code only captures Major-SubMajor-Minor-SubHead-Detailed-Object,
    # while the actual scheme identity is in `sub_head_name` + `detailed_head_name`.
    # So we key on the full identity tuple, allowing cross-FY rows to merge but
    # preserving distinct schemes that happen to share a full_code.
    by_key = {}  # (demand, full_code, sub_head_name, detailed_head_name) → record
    n_rows = 0

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            n_rows += 1
            full_code = row.get("full_code", "").strip()
            demand_no = row.get("demand_no", "").strip()
            if not full_code or not demand_no:
                continue

            key = (
                demand_no,
                full_code,
                norm(row.get("sub_head_name")),
                norm(row.get("detailed_head_name")),
            )
            fy = row.get("financial_year", "").strip()

            if key not in by_key:
                by_key[key] = {
                    "id": full_code,
                    "ministry": row.get("row_ministry") or row.get("ministry") or "",
                    "demandNo": int(demand_no),
                    "section": row.get("section", ""),
                    "majorHead": clean_code(row.get("major_head_code")),
                    "majorHeadName": row.get("major_head_name", ""),
                    "subMajor": clean_code(row.get("sub_major_head_code"), pad=2),
                    "minorHead": clean_code(row.get("minor_head_code"), pad=3),
                    "minorHeadName": row.get("minor_head_name", ""),
                    "subHead": clean_code(row.get("sub_head_code"), pad=2),
                    "detailedHead": clean_code(row.get("detailed_head_code"), pad=2),
                    "subHeadName": row.get("sub_head_name", ""),
                    "objectHead": clean_code(row.get("object_head_code"), pad=2),
                    "objectHeadName": row.get("object_head_name", ""),
                    "actuals2324": None,
                    "be2425": None,
                    "re2425": None,
                    "actuals2425": None,
                    "be2526": None,
                    "re2526": None,
                    "be2627": None,
                    "gapFlag": row.get("gap_flag") or None,
                    "gapReason": row.get("gap_reason") or None,
                }

            rec = by_key[key]
            # Take the most-populated value across FY rows.
            # FY 25-26 rows carry actuals_23_24, be_24_25, re_24_25, be_25_26
            # FY 26-27 rows carry actuals_24_25, be_25_26, re_25_26, be_26_27
            for csv_col, json_key in [
                ("actuals_2023_24", "actuals2324"),
                ("be_2024_25",      "be2425"),
                ("re_2024_25",      "re2425"),
                ("actuals_2024_25", "actuals2425"),
                ("be_2025_26",      "be2526"),
                ("re_2025_26",      "re2526"),
                ("be_2026_27",      "be2627"),
            ]:
                v = num(row.get(csv_col))
                if v is not None and rec[json_key] is None:
                    rec[json_key] = v

    # Ensure each record has a unique `id` — when multiple schemes share a full_code,
    # disambiguate by appending an index.
    out = list(by_key.values())
    id_count = {}
    for rec in out:
        base = rec["id"]
        n = id_count.get(base, 0)
        id_count[base] = n + 1
        if n > 0:
            rec["id"] = f"{base}#{n}"

    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    # Summary
    demands = {(r["demandNo"], r["ministry"]) for r in out}
    print(f"Read   {n_rows:>7,} CSV rows")
    print(f"Wrote  {len(out):>7,} JSON leaves → {out_path}")
    print(f"       {len(demands):>7,} unique demands · {len({r['ministry'] for r in out})} ministries")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 build-ddg-from-csv.py <csv> [out.json]")
        sys.exit(1)
    csv_path = sys.argv[1]
    out_path = sys.argv[2] if len(sys.argv) > 2 else "src/data/ddgs/all-ddg.json"
    main(csv_path, out_path)
