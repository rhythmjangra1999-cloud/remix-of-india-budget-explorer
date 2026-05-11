// Shared budget data types. All amounts in ₹ Crore unless noted.

export type ConfidenceLevel = "validated" | "parsed" | "ocr-needed";
export type FY = "FY26" | "FY27";

export interface Ministry {
  id: string;
  name: string;
  slug: string;
  short?: string;
  totals: Partial<Record<FY, number>>; // ₹ Cr — gross provision (incl. recoveries)
  /** Net of recoveries — BE 2026-27 (₹ Cr) */
  netFY27?: number;
  netRevenueFY27?: number;
  netCapitalFY27?: number;
  /** Net share of grand total (0–1) for BE 2026-27 */
  shareNetFY27?: number;
  ddgAvailable?: boolean;
}

export type DemandAmountKey =
  | FY
  | "FY26_RE"
  | "FY25_Actual"
  | "FY27_Revenue"
  | "FY27_Capital"
  | "FY27_Net"
  | "FY27_NetRevenue"
  | "FY27_NetCapital";

export interface Demand {
  id: string;
  ministryId: string;
  number: number;
  title: string;
  amounts: Partial<Record<DemandAmountKey, number>>;
  confidence: ConfidenceLevel;
  sourcePage?: number;
}

export interface DDGRow {
  ministryId: string;
  demandId: string;
  majorHead: string;
  subMajorHead?: string;
  minorHead?: string;
  subHead?: string;
  detailedHead?: string;
  objectHead: string;
  amounts: Partial<Record<FY, number>>;
  voted?: boolean; // voted vs charged
  revenue?: boolean; // revenue vs capital
  confidence: ConfidenceLevel;
}

export interface Transfer {
  ministryId: string;
  scheme: string;
  state?: string; // undefined = unallocated/unknown
  amount: number; // ₹ Cr, FY26
  unknown?: boolean;
}

export interface CoverageRow {
  ministryId: string;
  dgStatus: ConfidenceLevel | "missing";
  ddgStatus: ConfidenceLevel | "missing";
  notes?: string;
}

export interface Finding {
  id: string;
  title: string;
  ministryId: string;
  dek: string;
  body: string;
  date: string;
}

export interface BudgetMeta {
  fy: FY;
  totalUnionBudgetCr: number; // ₹ Cr
  ministriesCovered: number;
  ddgsLive: number;
  ddgsPlanned: number;
  sourceUrl?: string;
  lastUpdated: string;
}
