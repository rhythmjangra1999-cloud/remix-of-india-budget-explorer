/**
 * LMMH — List of Major and Minor Heads of Account
 * Source: CGA, Ministry of Finance · Correction Slips up to No. 1081 (28-Jan-2026)
 * 5,567 head combinations · 462 major heads · 70 active object heads
 */

import headsRaw from "@/data/lmmh-heads.json";
import majorHeadsRaw from "@/data/lmmh-major-heads.json";
import objectHeadsRaw from "@/data/lmmh-object-heads.json";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccountSection =
  | "Revenue Receipt"
  | "Revenue Expenditure"
  | "Capital Expenditure"
  | "Loans & Advances"
  | "Public Account";

export interface LMMHHead {
  section: string;
  majorHead: string;       // 4-digit, e.g. "2202"
  majorHeadName: string;
  subMajorCode: string;    // 2-digit, "00" = none
  subMajorName: string | null;
  minorHead: string;       // 3-digit, e.g. "101"
  minorHeadName: string;
  canonicalCode: string;   // e.g. "2202-01-101"
  notes: string | null;
}

export interface LMMHMajorHead {
  section: string | null;
  code: string;            // 4-digit
  name: string;
  subMajorsUsed: string;
  minorHeadCount: number | null;
  status: string | null;
}

export interface LMMHObjectHead {
  code: string;            // 2-digit, zero-padded
  name: string;
  objectClass: string;
  revOrCapital: string;
  description: string;
  status: string;
}

// ─── Raw data ─────────────────────────────────────────────────────────────────

export const LMMH_HEADS = headsRaw as LMMHHead[];
export const LMMH_MAJOR_HEADS = majorHeadsRaw as LMMHMajorHead[];
export const LMMH_OBJECT_HEADS = objectHeadsRaw as LMMHObjectHead[];

// ─── Lookup maps (built once) ─────────────────────────────────────────────────

/** majorHead code → name  e.g. "2202" → "General Education" */
export const MAJOR_HEAD_NAME: Record<string, string> = Object.fromEntries(
  LMMH_MAJOR_HEADS.map(m => [m.code, m.name])
);

/** majorHead code → section */
export const MAJOR_HEAD_SECTION: Record<string, string> = Object.fromEntries(
  LMMH_MAJOR_HEADS.filter(m => m.section).map(m => [m.code, m.section!])
);

/** canonicalCode → LMMHHead  e.g. "2202-01-101" → { ... } */
export const HEAD_BY_CANONICAL: Record<string, LMMHHead> = Object.fromEntries(
  LMMH_HEADS.map(h => [h.canonicalCode, h])
);

/** objectHead code → LMMHObjectHead  e.g. "01" → { name: "Salaries", ... } */
export const OBJECT_HEAD_BY_CODE: Record<string, LMMHObjectHead> = Object.fromEntries(
  LMMH_OBJECT_HEADS.map(o => [o.code, o])
);

/** minorHead canonical code → name  e.g. "2202-01-101" → "Government Primary Schools" */
export const MINOR_HEAD_NAME: Record<string, string> = Object.fromEntries(
  LMMH_HEADS.map(h => [h.canonicalCode, h.minorHeadName])
);

// ─── Functional sector classification ────────────────────────────────────────

/**
 * The LMMH groups expenditure Major Heads into functional sectors.
 * First digit of major head: 2/3 = Revenue Exp, 4/5 = Capital Exp
 * Within those, the numeric ranges map to sectors below.
 */
export type FunctionalSector =
  | "General Services"
  | "Social Services"
  | "Economic Services"
  | "Grants-in-Aid"
  | "Other";

const SOCIAL_SERVICES_RANGE = [2202, 2251, 4202, 4251, 6202, 6251] as const;
const ECONOMIC_SERVICES_RANGE = [2401, 3475, 4401, 5475, 6401, 7475] as const;
const GRANTS_RANGE = [3601, 3606, 4601, 4606] as const;

export function getFunctionalSector(majorHeadCode: string): FunctionalSector {
  const n = parseInt(majorHeadCode, 10);
  if (isNaN(n)) return "Other";

  // Revenue/Capital expenditure ranges (2xxx, 3xxx, 4xxx, 5xxx)
  if ((n >= 2011 && n <= 2080) || (n >= 4011 && n <= 4080)) return "General Services";
  if ((n >= 2202 && n <= 2251) || (n >= 4202 && n <= 4251) || (n >= 6202 && n <= 6251)) return "Social Services";
  if ((n >= 2401 && n <= 3475) || (n >= 4401 && n <= 5475) || (n >= 6401 && n <= 7475)) return "Economic Services";
  if ((n >= 3601 && n <= 3606) || (n >= 4601 && n <= 4606)) return "Grants-in-Aid";

  return "Other";
}

/**
 * Social Services sub-sectors for major heads in the 22xx / 42xx range
 */
export function getSocialSubSector(majorHeadCode: string): string | null {
  const n = parseInt(majorHeadCode, 10);
  const base = n % 2000; // normalize 4202 → 2202
  if (base >= 2202 && base <= 2205) return "Education, Sports, Art & Culture";
  if (base === 2210 || base === 2211) return "Health & Family Welfare";
  if (base >= 2215 && base <= 2217) return "Water, Sanitation & Urban Dev";
  if (base === 2220 || base === 2221) return "Information & Broadcasting";
  if (base === 2225) return "Welfare of SC/ST & OBC";
  if (base === 2230) return "Labour & Employment";
  if (base >= 2235 && base <= 2236) return "Social Welfare & Nutrition";
  if (base === 2245) return "Relief – Natural Calamities";
  if (base === 2250 || base === 2251) return "Other Social Services";
  return null;
}

/**
 * Economic Services sub-sectors
 */
export function getEconomicSubSector(majorHeadCode: string): string | null {
  const n = parseInt(majorHeadCode, 10);
  const base = n % 2000;
  if (base >= 2401 && base <= 2435) return "Agriculture & Allied Activities";
  if (base >= 2501 && base <= 2515) return "Rural Development";
  if (base >= 2551 && base <= 2575) return "Special Area Programmes";
  if (base >= 2700 && base <= 2711) return "Irrigation & Flood Control";
  if (base >= 2801 && base <= 2810) return "Energy";
  if (base >= 2851 && base <= 2885) return "Industry & Minerals";
  if (base >= 3001 && base <= 3075) return "Transport";
  if (base >= 3201 && base <= 3275) return "Communications";
  if (base >= 3401 && base <= 3435) return "Science, Technology & Environment";
  if (base >= 3451 && base <= 3475) return "General Economic Services";
  return null;
}

// ─── Helper: look up minor head name from DDG leaf data ──────────────────────

/**
 * Given a major head + sub-major + minor head, return the LMMH name.
 * Falls back gracefully if not found.
 */
export function lookupMinorHeadName(
  majorHead: string,
  subMajor: string,
  minorHead: string
): string {
  const canonical = `${majorHead}-${subMajor.padStart(2, "0")}-${minorHead}`;
  return HEAD_BY_CANONICAL[canonical]?.minorHeadName ?? minorHead;
}

/**
 * Given an object head code, return its name. e.g. "31" → "Grants-in-Aid-General"
 */
export function lookupObjectHeadName(code: string): string {
  return OBJECT_HEAD_BY_CODE[code.padStart(2, "0")]?.name ?? code;
}

/**
 * Canonicalize an object head — collapses spelling variants
 *   "31 Grants-in-aid-General" + "31 Grants-in-Aid General" → "31 / Grants-in-Aid-General"
 * Always pads code to 2 digits and looks up the canonical name from LMMH.
 */
export function canonicalObjectHead(code: string | number, fallbackName?: string): { code: string; name: string } {
  const c = String(code).padStart(2, "0");
  const meta = OBJECT_HEAD_BY_CODE[c];
  return {
    code: c,
    name: meta?.name ?? fallbackName ?? `Object Head ${c}`,
  };
}

/**
 * Given a major head code, return its full label for display.
 * e.g. "2202" → "2202 — General Education"
 */
export function majorHeadLabel(code: string): string {
  const name = MAJOR_HEAD_NAME[code];
  return name ? `${code} — ${name}` : code;
}
