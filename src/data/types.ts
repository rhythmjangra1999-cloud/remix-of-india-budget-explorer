// Shared budget data types. All amounts in ₹ Crore unless noted.

export type ConfidenceLevel = "validated" | "parsed" | "ocr-needed";
export type FY = "FY26" | "FY27";

export interface Ministry {
  id: string;
  name: string;
  slug: string;
  short?: string;
  totals: Partial<Record<FY, number>>; // ₹ Cr
  ddgAvailable?: boolean;
}

export interface Demand {
  id: string;
  ministryId: string;
  number: number;
  title: string;
  amounts: Partial<Record<FY, number>>;
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
