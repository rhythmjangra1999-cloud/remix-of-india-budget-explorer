// Agriculture (DAFW + DARE) selectors and hierarchy builder.
// All amounts in ₹ Crore.

import dafwRaw from "@/data/agriculture/dafw-ddgs.json";
import dareRaw from "@/data/agriculture/dare-ddgs.json";

export type Section = "Revenue" | "Capital";
export type GapFlag = "NEW" | "DISCONTINUED" | "TOKEN" | "SMALL_BASE";

export interface AgriRow {
  id: string;
  demandId: "d001" | "d002";
  section: Section;
  majorHead: number;
  majorHeadName: string;
  subMajor: string;
  minorHead: number;
  minorHeadName: string;
  subHead: string;
  detailedHead: string;
  subHeadName: string;
  objectHead: number;
  objectHeadName: string;
  actuals2425: number | null;
  be2526: number | null;
  re2526: number | null;
  be2627: number | null;
  gapFlag: GapFlag | null;
  gapReason: string | null;
}

export const DAFW: AgriRow[] = dafwRaw as AgriRow[];
export const DARE: AgriRow[] = dareRaw as AgriRow[];
export const ALL_AGRI: AgriRow[] = [...DAFW, ...DARE];

export const DEMAND_LABEL: Record<string, string> = {
  d001: "DAFW · Department of Agriculture & Farmers Welfare",
  d002: "DARE · Department of Agricultural Research & Education",
};

export type DemandFilter = "all" | "d001" | "d002";

export function filterRows(filter: DemandFilter): AgriRow[] {
  if (filter === "all") return ALL_AGRI;
  return ALL_AGRI.filter((r) => r.demandId === filter);
}

export function sumBE(rows: AgriRow[], field: "be2627" | "be2526" | "actuals2425" = "be2627"): number {
  return rows.reduce((s, r) => s + (r[field] ?? 0), 0);
}

export interface Kpis {
  total: number;
  prev: number;
  yoyPct: number;
  revenue: number;
  capital: number;
  revenueShare: number;
  rowCount: number;
  flaggedCount: number;
  newCount: number;
  discontinuedCount: number;
}

export function computeKpis(rows: AgriRow[]): Kpis {
  const total = sumBE(rows, "be2627");
  const prev = sumBE(rows, "be2526");
  const revenue = sumBE(rows.filter((r) => r.section === "Revenue"), "be2627");
  const capital = sumBE(rows.filter((r) => r.section === "Capital"), "be2627");
  return {
    total,
    prev,
    yoyPct: prev ? ((total - prev) / prev) * 100 : 0,
    revenue,
    capital,
    revenueShare: total ? (revenue / total) * 100 : 0,
    rowCount: rows.length,
    flaggedCount: rows.filter((r) => r.gapFlag).length,
    newCount: rows.filter((r) => r.gapFlag === "NEW").length,
    discontinuedCount: rows.filter((r) => r.gapFlag === "DISCONTINUED").length,
  };
}

// Hierarchy: Major → Minor → SubHead → Object
export interface HierNode {
  key: string;
  name: string;
  value: number;
  prevValue: number;
  level: "major" | "minor" | "sub" | "object";
  children?: HierNode[];
  rows?: AgriRow[];
}

export function buildHierarchy(rows: AgriRow[]): HierNode {
  const root: HierNode = { key: "root", name: "Agriculture", value: 0, prevValue: 0, level: "major", children: [] };
  const majorMap = new Map<string, HierNode>();

  for (const r of rows) {
    const v = r.be2627 ?? 0;
    const pv = r.be2526 ?? 0;
    if (v === 0 && pv === 0) continue;

    const majorKey = `${r.majorHead}`;
    let major = majorMap.get(majorKey);
    if (!major) {
      major = { key: majorKey, name: `${r.majorHead} · ${r.majorHeadName}`, value: 0, prevValue: 0, level: "major", children: [] };
      majorMap.set(majorKey, major);
      root.children!.push(major);
    }
    major.value += v;
    major.prevValue += pv;

    const minorKey = `${majorKey}.${r.minorHead}`;
    let minor = major.children!.find((c) => c.key === minorKey);
    if (!minor) {
      minor = { key: minorKey, name: r.minorHeadName, value: 0, prevValue: 0, level: "minor", children: [] };
      major.children!.push(minor);
    }
    minor.value += v;
    minor.prevValue += pv;

    const subKey = `${minorKey}.${r.subHead}`;
    let sub = minor.children!.find((c) => c.key === subKey);
    if (!sub) {
      sub = { key: subKey, name: r.subHeadName, value: 0, prevValue: 0, level: "sub", children: [], rows: [] };
      minor.children!.push(sub);
    }
    sub.value += v;
    sub.prevValue += pv;
    sub.rows!.push(r);
  }

  root.value = root.children!.reduce((s, c) => s + c.value, 0);
  root.prevValue = root.children!.reduce((s, c) => s + c.prevValue, 0);

  // Sort by value desc at every level
  const sortRec = (n: HierNode) => {
    if (n.children) {
      n.children.sort((a, b) => b.value - a.value);
      n.children.forEach(sortRec);
    }
  };
  sortRec(root);
  return root;
}

export interface MoverRow {
  majorHeadName: string;
  minorHeadName: string;
  be2526: number;
  be2627: number;
  delta: number;
  pct: number;
}

export function topMovers(rows: AgriRow[], minBaseCr = 100): { hikes: MoverRow[]; cuts: MoverRow[] } {
  const map = new Map<string, MoverRow>();
  for (const r of rows) {
    const key = `${r.majorHead}.${r.minorHead}`;
    let m = map.get(key);
    if (!m) {
      m = { majorHeadName: r.majorHeadName, minorHeadName: r.minorHeadName, be2526: 0, be2627: 0, delta: 0, pct: 0 };
      map.set(key, m);
    }
    m.be2526 += r.be2526 ?? 0;
    m.be2627 += r.be2627 ?? 0;
  }
  const list = Array.from(map.values())
    .filter((m) => m.be2526 >= minBaseCr)
    .map((m) => ({ ...m, delta: m.be2627 - m.be2526, pct: m.be2526 ? ((m.be2627 - m.be2526) / m.be2526) * 100 : 0 }));
  return {
    hikes: [...list].sort((a, b) => b.delta - a.delta).slice(0, 5),
    cuts: [...list].sort((a, b) => a.delta - b.delta).slice(0, 5),
  };
}
