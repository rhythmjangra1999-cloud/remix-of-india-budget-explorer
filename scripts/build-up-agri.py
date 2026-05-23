#!/usr/bin/env python3
"""Build UP Agriculture ddgs.json from raw grant CSVs."""
import csv, json, os, glob, re

RAW = "src/data/states/uttar-pradesh/agriculture/raw"
OUT = "src/data/states/uttar-pradesh/agriculture/ddgs.json"

def num(v):
    if v is None or v == "" or v.strip() == "-": return None
    try: return float(str(v).replace(",", ""))
    except: return None

def gap_flag(prev, curr):
    p = prev or 0; c = curr or 0
    if p == 0 and c > 0: return ("NEW", "No allocation in BE 25-26")
    if p > 0 and c == 0: return ("DISCONTINUED", "Allocated in BE 25-26 but zero in BE 26-27")
    if 0 < p < 10: return ("SMALL_BASE", "Tiny base, % swings misleading")
    return (None, None)

rows_out = []
for path in sorted(glob.glob(f"{RAW}/up_grant_*.csv")):
    m = re.search(r"up_grant_(\d+)_rows", path)
    demand_no = int(m.group(1))
    demand_id = f"d{demand_no:03d}"
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, r in enumerate(reader):
            be2526 = num(r.get("be_2025_26"))
            be2627 = num(r.get("be_2026_27"))
            flag, reason = gap_flag(be2526, be2627)
            rows_out.append({
                "id": f"{demand_id}-{i:05d}",
                "demandId": demand_id,
                "demandNo": demand_no,
                "demandTitle": r.get("ministry","").strip(),
                "section": r.get("section","").strip() or "Revenue",
                "majorHead": int(r["major_head"]) if r.get("major_head","").strip().isdigit() else 0,
                "majorHeadName": r.get("major_head_name","").strip(),
                "majorHeadNameHi": r.get("major_head_name_hi","").strip(),
                "subMajor": r.get("sub_major","").strip(),
                "subMajorHeadName": r.get("sub_major_head_name","").strip(),
                "subMajorHeadNameHi": r.get("sub_major_head_name_hi","").strip(),
                "minorHead": int(r["minor_head"]) if r.get("minor_head","").strip().isdigit() else 0,
                "minorHeadName": r.get("minor_head_name","").strip(),
                "minorHeadNameHi": r.get("minor_head_name_hi","").strip(),
                "subHead": r.get("sub_head","").strip(),
                "subHeadName": r.get("sub_head_name","").strip(),
                "detailedHead": r.get("detailed_head","").strip(),
                "detailedHeadName": r.get("detailed_head_name","").strip(),
                "objectHead": int(r["object_head"]) if r.get("object_head","").strip().isdigit() else 0,
                "objectHeadName": r.get("object_head_name","").strip(),
                "objectHeadNameHi": r.get("object_head_name_hi","").strip(),
                "actuals2425": num(r.get("actuals_2024_25")),
                "be2526": be2526,
                "re2526": num(r.get("re_2025_26")),
                "be2627": be2627,
                "charged": r.get("charged","false").lower() == "true",
                "sourcePdf": r.get("source_pdf","").strip(),
                "sourcePage": r.get("source_page","").strip(),
                "gapFlag": flag,
                "gapReason": reason,
            })

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(rows_out, f, ensure_ascii=False, separators=(",", ":"))
print(f"Wrote {len(rows_out)} rows → {OUT}")

# Summary
from collections import defaultdict
by_d = defaultdict(lambda: {"be2627": 0, "be2526": 0, "n": 0, "title": ""})
for r in rows_out:
    d = by_d[r["demandNo"]]
    d["be2627"] += r["be2627"] or 0
    d["be2526"] += r["be2526"] or 0
    d["n"] += 1
    d["title"] = r["demandTitle"]
for no in sorted(by_d):
    d = by_d[no]
    print(f"  D{no:03d}  rows={d['n']:4d}  BE26-27={d['be2627']:>14,.2f}  {d['title']}")
