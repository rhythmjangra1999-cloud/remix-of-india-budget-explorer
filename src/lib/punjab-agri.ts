// Punjab Agriculture selectors. Stored values are in ₹ Lakh; displayed as ₹ Crore (÷100).
import raw from "@/data/states/punjab/agriculture/ddgs.json";

export type Section = "Revenue" | "Capital";
export type GapFlag = "NEW" | "DISCONTINUED" | "SMALL_BASE";

export interface PBAgriRow {
  id: string;
  demandId: string;
  demandNo: number;
  demandTitle: string;
  section: Section;
  majorHead: number;
  majorHeadName: string;
  majorHeadNameHi: string;
  subMajor: string;
  subMajorHeadName: string;
  subMajorHeadNameHi: string;
  minorHead: number;
  minorHeadName: string;
  minorHeadNameHi: string;
  subHead: string;
  subHeadName: string;
  detailedHead: string;
  detailedHeadName: string;
  objectHead: number;
  objectHeadName: string;
  objectHeadNameHi: string;
  actuals2425: number | null;
  be2526: number | null;
  re2526: number | null;
  be2627: number | null;
  charged: boolean;
  sourcePdf: string;
  sourcePage: string;
  gapFlag: GapFlag | null;
  gapReason: string | null;
}

export const PB_AGRI_ALL: PBAgriRow[] = raw as PBAgriRow[];

export const PB_DEMANDS = Array.from(
  new Map(PB_AGRI_ALL.map((r) => [r.demandId, { id: r.demandId, no: r.demandNo, title: r.demandTitle }])).values()
).sort((a, b) => a.no - b.no);

export type DemandFilter = "all" | string;

export function filterRows(f: DemandFilter): PBAgriRow[] {
  return f === "all" ? PB_AGRI_ALL : PB_AGRI_ALL.filter((r) => r.demandId === f);
}

export function sum(rows: PBAgriRow[], k: "actuals2425" | "be2526" | "re2526" | "be2627") {
  return rows.reduce((s, r) => s + (r[k] ?? 0), 0);
}

export interface Kpis {
  totalLakh: number; prevLakh: number; yoyPct: number;
  revenueLakh: number; capitalLakh: number; revenueShare: number;
  rowCount: number; flaggedCount: number; newCount: number; discontinuedCount: number;
}

export function computeKpis(rows: PBAgriRow[]): Kpis {
  const totalLakh = sum(rows, "be2627");
  const prevLakh = sum(rows, "be2526");
  const revenueLakh = sum(rows.filter((r) => r.section === "Revenue"), "be2627");
  const capitalLakh = sum(rows.filter((r) => r.section === "Capital"), "be2627");
  return {
    totalLakh, prevLakh,
    yoyPct: prevLakh ? ((totalLakh - prevLakh) / prevLakh) * 100 : 0,
    revenueLakh, capitalLakh,
    revenueShare: totalLakh ? (revenueLakh / totalLakh) * 100 : 0,
    rowCount: rows.length,
    flaggedCount: rows.filter((r) => r.gapFlag).length,
    newCount: rows.filter((r) => r.gapFlag === "NEW").length,
    discontinuedCount: rows.filter((r) => r.gapFlag === "DISCONTINUED").length,
  };
}

export interface HierNode {
  key: string; name: string; nameHi?: string;
  value: number; prevValue: number;
  level: "major" | "minor" | "sub" | "object";
  children?: HierNode[]; rows?: PBAgriRow[];
}

export function buildHierarchy(rows: PBAgriRow[]): HierNode {
  const root: HierNode = { key: "root", name: "Punjab Agriculture", value: 0, prevValue: 0, level: "major", children: [] };
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
    major.value += v; major.prevValue += pv;

    const minorKey = `${majorKey}.${r.minorHead}`;
    let minor = major.children!.find((c) => c.key === minorKey);
    if (!minor) {
      minor = { key: minorKey, name: r.minorHeadName || `Minor ${r.minorHead}`, value: 0, prevValue: 0, level: "minor", children: [] };
      major.children!.push(minor);
    }
    minor.value += v; minor.prevValue += pv;

    const subKey = `${minorKey}.${r.subHead}.${r.detailedHead}`;
    let sub = minor.children!.find((c) => c.key === subKey);
    if (!sub) {
      sub = { key: subKey, name: r.subHeadName || r.detailedHeadName || `Sub-head ${r.subHead}`, value: 0, prevValue: 0, level: "sub", children: [], rows: [] };
      minor.children!.push(sub);
    }
    sub.value += v; sub.prevValue += pv;
    sub.rows!.push(r);
  }
  root.value = root.children!.reduce((s, c) => s + c.value, 0);
  root.prevValue = root.children!.reduce((s, c) => s + c.prevValue, 0);
  const sortRec = (n: HierNode) => { if (n.children) { n.children.sort((a, b) => b.value - a.value); n.children.forEach(sortRec); } };
  sortRec(root);
  return root;
}

export interface MajorHeadRow {
  mhCode: string; mhName: string; mhNameHi: string; section: Section;
  actuals2425: number | null; be2526: number | null; re2526: number | null; be2627: number | null;
}

export function getMajorHeads(rows: PBAgriRow[]): MajorHeadRow[] {
  const map = new Map<string, MajorHeadRow>();
  for (const r of rows) {
    const key = `${r.majorHead}|${r.section}`;
    let m = map.get(key);
    if (!m) {
      m = { mhCode: String(r.majorHead), mhName: r.majorHeadName, mhNameHi: r.majorHeadNameHi, section: r.section, actuals2425: null, be2526: null, re2526: null, be2627: null };
      map.set(key, m);
    }
    (["actuals2425", "be2526", "re2526", "be2627"] as const).forEach((y) => {
      const v = r[y]; if (v != null) m![y] = (m![y] ?? 0) + v;
    });
  }
  return Array.from(map.values()).sort((a, b) => (b.be2627 ?? 0) - (a.be2627 ?? 0));
}

export interface MoverRow {
  majorHeadName: string; minorHeadName: string;
  be2526: number; be2627: number; delta: number; pct: number;
}

export function topMovers(rows: PBAgriRow[], minBaseLakh = 1000): { hikes: MoverRow[]; cuts: MoverRow[] } {
  const map = new Map<string, MoverRow>();
  for (const r of rows) {
    const key = `${r.majorHead}.${r.minorHead}`;
    let m = map.get(key);
    if (!m) { m = { majorHeadName: r.majorHeadName, minorHeadName: r.minorHeadName, be2526: 0, be2627: 0, delta: 0, pct: 0 }; map.set(key, m); }
    m.be2526 += r.be2526 ?? 0; m.be2627 += r.be2627 ?? 0;
  }
  const list = Array.from(map.values()).filter((m) => m.be2526 >= minBaseLakh)
    .map((m) => ({ ...m, delta: m.be2627 - m.be2526, pct: m.be2526 ? ((m.be2627 - m.be2526) / m.be2526) * 100 : 0 }));
  return {
    hikes: [...list].sort((a, b) => b.delta - a.delta).slice(0, 5),
    cuts: [...list].sort((a, b) => a.delta - b.delta).slice(0, 5),
  };
}

export interface DemandSummary {
  id: string; no: number; title: string;
  actuals2425: number; be2526: number; re2526: number; be2627: number;
  revBe2627: number; capBe2627: number;
}

export function getDemandSummaries(): DemandSummary[] {
  return PB_DEMANDS.map((d) => {
    const rs = PB_AGRI_ALL.filter((r) => r.demandId === d.id);
    const rev = rs.filter((r) => r.section === "Revenue");
    const cap = rs.filter((r) => r.section === "Capital");
    return {
      id: d.id, no: d.no, title: d.title,
      actuals2425: sum(rs, "actuals2425"),
      be2526: sum(rs, "be2526"),
      re2526: sum(rs, "re2526"),
      be2627: sum(rs, "be2627"),
      revBe2627: sum(rev, "be2627"),
      capBe2627: sum(cap, "be2627"),
    };
  });
}

export function formatCr(lakh: number, compact = true): string {
  const cr = lakh / 100;
  if (compact && Math.abs(cr) >= 1000) return `₹${(cr / 1000).toFixed(2)} K Cr`;
  if (compact && Math.abs(cr) >= 1) return `₹${cr.toFixed(2)} Cr`;
  if (compact && Math.abs(cr) > 0) return `₹${(cr * 100).toFixed(0)} L`;
  return `₹${cr.toFixed(2)} Cr`;
}
