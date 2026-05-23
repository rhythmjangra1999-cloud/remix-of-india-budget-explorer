#!/usr/bin/env python3
"""Build Punjab Agriculture ddgs.json from the combined DDG CSV.

Source values appear to be in ₹ Thousand. We convert to ₹ Lakh (÷100) on the
way out so the existing formatCr helper (Lakh → Cr) works unchanged.
"""
import csv, json, os, glob
from collections import defaultdict

RAW_GLOB = "src/data/states/punjab/agriculture/raw/*.csv"
OUT = "src/data/states/punjab/agriculture/ddgs.json"

def num_thousand_to_lakh(v):
    if v is None: return None
    s = str(v).strip()
    if s == "" or s == "-": return None
    try: return float(s.replace(",", "")) / 100.0  # Thousand → Lakh
    except: return None

def gap_flag(prev, curr):
    p = prev or 0; c = curr or 0
    if p == 0 and c > 0: return ("NEW", "No allocation in BE 25-26")
    if p > 0 and c == 0: return ("DISCONTINUED", "Allocated in BE 25-26 but zero in BE 26-27")
    if 0 < p < 10: return ("SMALL_BASE", "Tiny base, % swings misleading")
    return (None, None)

def to_int(s):
    s = (s or "").strip()
    if s.isdigit(): return int(s)
    try: return int(float(s))
    except: return 0

rows_out = []
for path in sorted(glob.glob(RAW_GLOB)):
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, r in enumerate(reader):
            demand_no = to_int(r.get("demand_no"))
            demand_id = f"d{demand_no:03d}"
            be2526 = num_thousand_to_lakh(r.get("total_be_2025_26"))
            be2627 = num_thousand_to_lakh(r.get("total_be_2026_27"))
            flag, reason = gap_flag(be2526, be2627)
            rows_out.append({
                "id": f"{demand_id}-{i:05d}",
                "demandId": demand_id,
                "demandNo": demand_no,
                "demandTitle": (r.get("demand_name") or "").strip(),
                "section": (r.get("section") or "Revenue").strip() or "Revenue",
                "majorHead": to_int(r.get("major_head_code")),
                "majorHeadName": (r.get("major_head_name") or "").strip(),
                "majorHeadNameHi": "",
                "subMajor": (r.get("sub_major_head_code") or "").strip(),
                "subMajorHeadName": "",
                "subMajorHeadNameHi": "",
                "minorHead": to_int(r.get("minor_head_code")),
                "minorHeadName": (r.get("minor_head_name") or "").strip(),
                "minorHeadNameHi": "",
                "subHead": (r.get("sub_head_code") or "").strip(),
                "subHeadName": (r.get("sub_head_name") or "").strip(),
                "detailedHead": (r.get("detailed_head_code") or "").strip(),
                "detailedHeadName": (r.get("detailed_head_name") or "").strip(),
                "objectHead": to_int(r.get("object_head_code")),
                "objectHeadName": (r.get("object_head_name") or "").strip(),
                "objectHeadNameHi": "",
                "actuals2425": num_thousand_to_lakh(r.get("total_actuals_2024_25")),
                "be2526": be2526,
                "re2526": num_thousand_to_lakh(r.get("total_re_2025_26")),
                "be2627": be2627,
                "charged": (num_thousand_to_lakh(r.get("charged_be_2026_27")) or 0) > 0,
                "sourcePdf": (r.get("source_pdf") or "").strip(),
                "sourcePage": str(r.get("source_page") or "").strip(),
                "gapFlag": flag,
                "gapReason": reason,
            })

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(rows_out, f, ensure_ascii=False, separators=(",", ":"))
print(f"Wrote {len(rows_out)} rows → {OUT}")

by_d = defaultdict(lambda: {"be2627": 0, "be2526": 0, "n": 0, "title": ""})
for r in rows_out:
    d = by_d[r["demandNo"]]
    d["be2627"] += r["be2627"] or 0
    d["be2526"] += r["be2526"] or 0
    d["n"] += 1
    d["title"] = r["demandTitle"]
for no in sorted(by_d):
    d = by_d[no]
    # values are in Lakh; show as Cr (÷100)
    print(f"  D{no:03d}  rows={d['n']:4d}  BE26-27=₹{d['be2627']/100:>10,.2f} Cr  {d['title']}")
