import summaryRaw from "@/data/dg-summary.json";
import majorHeadsRaw from "@/data/dg-major-heads.json";
import metaRaw from "@/data/dg-meta.json";

export type Section = "revenue" | "capital" | "total";
export type YearKey = "actuals2425" | "be2526" | "re2526" | "be2627";

export interface DemandSummary {
  ministry: string;
  demandNo: number;
  demandDesc: string;
  actuals2425: { revenue: number | null; capital: number | null; total: number | null };
  be2526:      { revenue: number | null; capital: number | null; total: number | null };
  re2526:      { revenue: number | null; capital: number | null; total: number | null };
  be2627:      { revenue: number | null; capital: number | null; total: number | null };
}

export interface MajorHeadRow {
  ministry: string;
  demandNo: number;
  demandDesc: string;
  section: string;
  mhCode: string;
  mhName: string;
  actuals2425: number | null;
  be2526: number | null;
  re2526: number | null;
  be2627: number | null;
}

export interface DGMeta {
  fy: string;
  grossBe2627Cr: number;
  netBe2627Cr: number;
  recoveriesCr: number;
  totalDemands: number;
  source: string;
  generatedAt: string;
}

export const DG_SUMMARY = summaryRaw as DemandSummary[];
export const DG_MAJOR_HEADS = majorHeadsRaw as MajorHeadRow[];
export const DG_META = metaRaw as DGMeta;

export const YEAR_LABELS: Record<YearKey, string> = {
  actuals2425: "Actuals 24-25",
  be2526:      "BE 25-26",
  re2526:      "RE 25-26",
  be2627:      "BE 26-27",
};

export function getMinistries(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const d of DG_SUMMARY) {
    if (!seen.has(d.ministry)) { seen.add(d.ministry); out.push(d.ministry); }
  }
  return out.sort();
}

export function getDemandsForMinistry(ministry: string): DemandSummary[] {
  return DG_SUMMARY.filter((d) => d.ministry === ministry).sort((a, b) => a.demandNo - b.demandNo);
}

export function getDemand(demandNo: number): DemandSummary | undefined {
  return DG_SUMMARY.find((d) => d.demandNo === demandNo);
}

export function getMajorHeads(demandNo: number): MajorHeadRow[] {
  return DG_MAJOR_HEADS.filter((r) => r.demandNo === demandNo);
}

export function getValue(d: DemandSummary, year: YearKey, section: Section): number {
  return d[year][section] ?? 0;
}

export function getMinistryTotal(ministry: string, year: YearKey, section: Section): number {
  return getDemandsForMinistry(ministry).reduce((s, d) => s + getValue(d, year, section), 0);
}

export function computeYoY(current: number | null, prev: number | null): number | null {
  if (!current || !prev || prev === 0) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
}

export function formatCrore(v: number | null | undefined, compact = false): string {
  if (v === null || v === undefined) return "—";
  const lakh = v / 100000;
  if (compact && Math.abs(lakh) >= 0.01) {
    if (Math.abs(lakh) >= 1) return `₹${lakh.toFixed(2)} L Cr`;
    return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
  }
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
}

export function getMHStatus(row: MajorHeadRow): "DISCONTINUED" | "SMALL_BASE" | "NEW" | null {
  const prev = row.be2526;
  const curr = row.be2627;
  if (prev && prev > 0 && (!curr || curr === 0)) return "DISCONTINUED";
  if (!prev || prev === 0) return "NEW";
  if (curr && curr < 10) return "SMALL_BASE";
  return null;
}
