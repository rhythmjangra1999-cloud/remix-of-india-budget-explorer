import map from "@/data/scheme-ddg-map.json";
import { DDG_LEAVES, type DDGLeaf, type DDGNode } from "@/lib/ddg";

export type ReconStatus = "match" | "close" | "off" | "unmatched";
export type MatchConfidence = "exact" | "fuzzy" | "none";

export interface SchemeDDGEntry {
  schemeCode: string;
  schemeName: string;
  schemeType: string;
  ministry: string;
  demandNo: number;
  outlayCr: number;
  sumMatchedBE2627: number | null;
  matchedAtLevel: "minor" | "subHead" | "object" | null;
  matchConfidence: MatchConfidence;
  matchedLeafIds: string[];
  matchedName: string | null;
  reconStatus: ReconStatus;
  ddgAvailableForDemand: boolean;
}

const ENTRIES = (map as { schemes: SchemeDDGEntry[] }).schemes;

const LEAF_BY_ID: Map<string, DDGLeaf> = (() => {
  const m = new Map<string, DDGLeaf>();
  for (const r of DDG_LEAVES) m.set(`${r.demandNo}::${r.id}`, r);
  return m;
})();

export function getSchemeMapping(schemeCode: string, demandNo: number): SchemeDDGEntry | undefined {
  return ENTRIES.find((e) => e.schemeCode === schemeCode && e.demandNo === demandNo);
}

export function getSchemeLeaves(entry: SchemeDDGEntry): DDGLeaf[] {
  const out: DDGLeaf[] = [];
  for (const id of entry.matchedLeafIds) {
    const r = LEAF_BY_ID.get(`${entry.demandNo}::${id}`);
    if (r) out.push(r);
  }
  return out;
}

function sumKey(rows: DDGLeaf[], k: keyof DDGLeaf): number | null {
  let s = 0, any = false;
  for (const r of rows) { const v = r[k]; if (typeof v === "number") { s += v; any = true; } }
  return any ? s : null;
}

/** Build a mini DDG tree (Major → SubMajor → Minor → SubHead/Detailed → Object)
 *  scoped to just the leaves matched to a scheme. Mirrors lib/ddg.buildDDGTree.
 */
export function buildSchemeTree(entry: SchemeDDGEntry): DDGNode[] {
  const leaves = getSchemeLeaves(entry);
  // Group by majorHead so the tree shows Major→Minor→SubHead→Object
  type Bucket = { rows: DDGLeaf[]; children: Map<string, Bucket>; name: string; section: string };
  const root = new Map<string, Bucket>();

  for (const r of leaves) {
    const path = [
      { code: r.majorHead, name: `${r.majorHead} · ${r.majorHeadName || ""}`.trim() },
      { code: `${r.subMajor}.${r.minorHead}`, name: r.minorHeadName || `Minor Head ${r.minorHead}` },
      { code: `${r.subHead}.${r.detailedHead}`, name: r.subHeadName || `Sub-Head ${r.subHead}.${r.detailedHead}` },
      { code: r.objectHead, name: r.objectHeadName || `Object ${r.objectHead}` },
    ];
    let level = root;
    for (const seg of path) {
      if (!level.has(seg.code)) level.set(seg.code, { rows: [], children: new Map(), name: seg.name, section: r.section });
      const b = level.get(seg.code)!;
      b.rows.push(r);
      level = b.children;
    }
  }

  const labels: DDGNode["level"][] = ["minor", "minor", "subHead", "object"];

  function build(map: Map<string, Bucket>, depth: number, parentCode: string): DDGNode[] {
    const nodes: DDGNode[] = [];
    for (const [code, b] of map) {
      const isLeaf = depth === labels.length - 1;
      const fullCode = parentCode ? `${parentCode}.${code}` : code;
      nodes.push({
        level: labels[depth],
        code,
        name: b.name,
        fullCode,
        section: b.section,
        actuals2324: sumKey(b.rows, "actuals2324"),
        be2425: sumKey(b.rows, "be2425"),
        re2425: sumKey(b.rows, "re2425"),
        actuals2425: sumKey(b.rows, "actuals2425"),
        be2526: sumKey(b.rows, "be2526"),
        re2526: sumKey(b.rows, "re2526"),
        be2627: sumKey(b.rows, "be2627"),
        gapFlag: isLeaf ? b.rows[0].gapFlag : null,
        gapReason: isLeaf ? b.rows[0].gapReason : null,
        children: isLeaf ? undefined : build(b.children, depth + 1, fullCode),
      });
    }
    nodes.sort((a, b) => (b.be2627 ?? 0) - (a.be2627 ?? 0));
    return nodes;
  }

  return build(root, 0, "");
}

export function reconColor(status: ReconStatus): string {
  switch (status) {
    case "match": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "close": return "bg-blue-50 text-blue-700 border-blue-200";
    case "off": return "bg-amber-50 text-amber-700 border-amber-200";
    case "unmatched": return "bg-muted text-muted-foreground border-border";
  }
}
