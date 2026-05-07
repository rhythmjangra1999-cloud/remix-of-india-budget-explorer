import ddgRaw from "@/data/ddgs/agri-ddg.json";

export type GapFlag = "DISCONTINUED" | "NEW" | "SMALL_BASE" | "TOKEN" | null;

export interface DDGLeaf {
  id: string;
  ministry: string;
  demandNo: number;
  section: "Revenue" | "Capital" | string;
  majorHead: string;
  majorHeadName: string;
  subMajor: string;
  minorHead: string;
  minorHeadName: string;
  subHead: string;
  detailedHead: string;
  subHeadName: string;
  objectHead: string;
  objectHeadName: string;
  actuals2425: number | null;
  be2526: number | null;
  re2526: number | null;
  be2627: number | null;
  gapFlag: GapFlag;
  gapReason: string | null;
}

export const DDG_LEAVES = ddgRaw as DDGLeaf[];

const KEYS = ["actuals2425", "be2526", "re2526", "be2627"] as const;
export type YearKey = typeof KEYS[number];

function sumKey(rows: DDGLeaf[], k: YearKey): number | null {
  let s = 0;
  let any = false;
  for (const r of rows) {
    const v = r[k];
    if (typeof v === "number") { s += v; any = true; }
  }
  return any ? s : null;
}

export function hasDDG(demandNo: number, majorHead: string): boolean {
  return DDG_LEAVES.some((r) => r.demandNo === demandNo && r.majorHead === majorHead);
}

export function getDDGLeaves(demandNo: number, majorHead: string): DDGLeaf[] {
  return DDG_LEAVES.filter((r) => r.demandNo === demandNo && r.majorHead === majorHead);
}

export interface MinorHeadRow {
  code: string; // "subMajor.minor", e.g. "00.103"
  subMajor: string;
  minorHead: string;
  minorHeadName: string;
  section: string;
  actuals2425: number | null;
  be2526: number | null;
  re2526: number | null;
  be2627: number | null;
  leafCount: number;
  share: number;
}

export function getMinorHeadSummary(demandNo: number, majorHead: string): MinorHeadRow[] {
  const leaves = getDDGLeaves(demandNo, majorHead);
  if (!leaves.length) return [];
  const mhTotal = sumKey(leaves, "be2627") ?? 0;
  const groups = new Map<string, DDGLeaf[]>();
  for (const r of leaves) {
    const key = `${r.section}::${r.subMajor}.${r.minorHead}::${r.minorHeadName}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  const rows: MinorHeadRow[] = [];
  for (const [key, rs] of groups) {
    const [section, code, minorHeadName] = key.split("::");
    const [subMajor, minorHead] = code.split(".");
    const be2627 = sumKey(rs, "be2627");
    rows.push({
      section,
      code,
      subMajor,
      minorHead,
      minorHeadName,
      actuals2425: sumKey(rs, "actuals2425"),
      be2526: sumKey(rs, "be2526"),
      re2526: sumKey(rs, "re2526"),
      be2627,
      leafCount: rs.length,
      share: mhTotal > 0 && be2627 ? be2627 / mhTotal : 0,
    });
  }
  rows.sort((a, b) => {
    if (a.section !== b.section) return a.section.localeCompare(b.section);
    return (b.be2627 ?? 0) - (a.be2627 ?? 0);
  });
  return rows;
}

// ── Tree structure ───────────────────────────────────────────────────────────
export interface DDGNode {
  level: "minor" | "subHead" | "object";
  code: string;
  name: string;
  fullCode: string;
  section: string;
  actuals2425: number | null;
  be2526: number | null;
  re2526: number | null;
  be2627: number | null;
  gapFlag?: GapFlag;
  gapReason?: string | null;
  children?: DDGNode[];
}

export function buildDDGTree(demandNo: number, majorHead: string): DDGNode[] {
  const leaves = getDDGLeaves(demandNo, majorHead);
  type Bucket = { rows: DDGLeaf[]; children: Map<string, Bucket>; name: string; section: string };
  const root = new Map<string, Bucket>();

  for (const r of leaves) {
    const path = [
      { code: `${r.subMajor}.${r.minorHead}`, name: r.minorHeadName || `Minor Head ${r.minorHead}` },
      { code: `${r.subHead}.${r.detailedHead}`, name: r.subHeadName || `Sub-Head ${r.subHead}.${r.detailedHead}` },
      { code: r.objectHead, name: r.objectHeadName || `Object ${r.objectHead}` },
    ];
    let level = root;
    for (let i = 0; i < path.length; i++) {
      const seg = path[i];
      const key = seg.code;
      if (!level.has(key)) level.set(key, { rows: [], children: new Map(), name: seg.name, section: r.section });
      const b = level.get(key)!;
      b.rows.push(r);
      level = b.children;
    }
  }

  const levels: DDGNode["level"][] = ["minor", "subHead", "object"];

  function build(map: Map<string, Bucket>, depth: number, parentCode: string): DDGNode[] {
    const nodes: DDGNode[] = [];
    for (const [code, b] of map) {
      const isLeaf = depth === levels.length - 1;
      const fullCode = parentCode ? `${parentCode}.${code}` : code;
      const leaf = isLeaf ? b.rows[0] : null;
      const node: DDGNode = {
        level: levels[depth],
        code,
        name: b.name,
        fullCode,
        section: b.section,
        actuals2425: sumKey(b.rows, "actuals2425"),
        be2526: sumKey(b.rows, "be2526"),
        re2526: sumKey(b.rows, "re2526"),
        be2627: sumKey(b.rows, "be2627"),
        gapFlag: leaf ? leaf.gapFlag : null,
        gapReason: leaf ? leaf.gapReason : null,
        children: isLeaf ? undefined : build(b.children, depth + 1, fullCode),
      };
      nodes.push(node);
    }
    nodes.sort((a, b) => (b.be2627 ?? 0) - (a.be2627 ?? 0));
    return nodes;
  }

  return build(root, 0, majorHead);
}

export interface GapCounts {
  DISCONTINUED: number;
  NEW: number;
  SMALL_BASE: number;
  TOKEN: number;
}

export function getGapCounts(leaves: DDGLeaf[]): GapCounts {
  const c: GapCounts = { DISCONTINUED: 0, NEW: 0, SMALL_BASE: 0, TOKEN: 0 };
  for (const r of leaves) if (r.gapFlag && c[r.gapFlag] !== undefined) c[r.gapFlag]++;
  return c;
}

export function ddgYoY(curr: number | null, prev: number | null): number | null {
  if (curr === null || prev === null || prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}
