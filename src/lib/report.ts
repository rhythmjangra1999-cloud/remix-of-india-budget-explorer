/**
 * Plain-English helpers for the journalist-facing Report Builder.
 * - Translates accounting jargon into reader-friendly labels.
 * - Provides a curated Topic catalog mapping plain-English topics to Major Head codes.
 * - Aggregation helpers that join DG data + LMMH semantic layer.
 */

import { DG_SUMMARY, DG_MAJOR_HEADS, type YearKey, type Section, type MajorHeadRow } from "./dg";
import { DDG_LEAVES, type DDGLeaf } from "./ddg";
import { LMMH_OBJECT_HEADS, OBJECT_HEAD_BY_CODE, getFunctionalSector, getSocialSubSector, getEconomicSubSector } from "./lmmh";

// ─── Plain-English labels ────────────────────────────────────────────────────

export const YEAR_PLAIN: Record<YearKey, { short: string; long: string }> = {
  actuals2425: { short: "Spent 2024-25",    long: "Actually spent in 2024-25" },
  be2526:      { short: "Planned 2025-26",  long: "Planned for 2025-26 (Budget Estimate)" },
  re2526:      { short: "Revised 2025-26",  long: "Revised mid-year estimate for 2025-26" },
  be2627:      { short: "Planned 2026-27",  long: "Planned for 2026-27 (Budget Estimate)" },
};

export const SECTION_PLAIN: Record<Section, { short: string; long: string }> = {
  total:   { short: "Total",               long: "All spending (running costs + investments)" },
  revenue: { short: "Running costs",       long: "Day-to-day running costs (salaries, supplies, interest)" },
  capital: { short: "Long-term investment", long: "One-time investments (buildings, equipment, infrastructure)" },
};

export const TYPE_PLAIN = {
  dg:  { short: "Total budget request",  long: "Total demand for grants before any recoveries" },
  eb:  { short: "Net spending",          long: "Net of recoveries (Total request − recoveries)" },
  ddg: { short: "Detailed breakdown",    long: "Drill down to object-head level (Salaries, Subsidies etc.)" },
} as const;

// ─── Topic catalog — hand-curated plain-English topics ───────────────────────

export interface Topic {
  id: string;
  name: string;                 // "Education"
  emoji: string;                // visual marker
  description: string;
  majorHeadCodes: string[];     // codes that roll up to this topic
}

export const TOPICS: Topic[] = [
  {
    id: "education",
    name: "Education",
    emoji: "📚",
    description: "Schools, universities, technical education, sports, arts and culture",
    majorHeadCodes: ["2202","2203","2204","2205","4202","4203","4204","4205","6202"],
  },
  {
    id: "health",
    name: "Health & Family Welfare",
    emoji: "🏥",
    description: "Hospitals, medical services, family welfare, public health",
    majorHeadCodes: ["2210","2211","4210","4211","6210","6211"],
  },
  {
    id: "agriculture",
    name: "Agriculture & Allied",
    emoji: "🌾",
    description: "Crops, animal husbandry, fisheries, food storage, agri research",
    majorHeadCodes: ["2401","2402","2403","2404","2405","2406","2407","2408","2415","2416","2425","2435",
                     "4401","4402","4403","4404","4405","4406","4407","4408","4415","4416","4425","4435",
                     "6401","6402","6403","6404","6405","6406","6407","6408","6416","6425","6435"],
  },
  {
    id: "defence",
    name: "Defence",
    emoji: "🛡️",
    description: "Army, Navy, Air Force, ordnance, R&D",
    majorHeadCodes: ["2076","2077","2078","2079","2080","4076"],
  },
  {
    id: "rural-dev",
    name: "Rural Development",
    emoji: "🏘️",
    description: "Rural employment, land reforms, rural programmes",
    majorHeadCodes: ["2501","2505","2506","2515","4515","6505","6506","6515"],
  },
  {
    id: "water-housing",
    name: "Water, Housing & Urban",
    emoji: "🏗️",
    description: "Water supply, sanitation, housing, urban development",
    majorHeadCodes: ["2215","2216","2217","4215","4216","4217","6215","6216","6217"],
  },
  {
    id: "transport",
    name: "Transport",
    emoji: "🚆",
    description: "Railways, roads, shipping, civil aviation, ports",
    majorHeadCodes: ["3001","3002","3003","3004","3005","3006","3007","3051","3052","3053","3054","3055","3056","3075",
                     "5002","5003","5051","5052","5053","5054","5055","5056","5075",
                     "7002","7051","7052","7053","7055","7056","7075"],
  },
  {
    id: "energy",
    name: "Energy",
    emoji: "⚡",
    description: "Power, petroleum, coal, renewable energy",
    majorHeadCodes: ["2801","2802","2803","2810","4801","4802","4803","4810","6801","6802","6803","6810"],
  },
  {
    id: "communications",
    name: "Communications & IT",
    emoji: "📡",
    description: "Postal, telecom, satellite systems",
    majorHeadCodes: ["3201","3225","3252","3275","5201","5225","5252","5275","7225","7275"],
  },
  {
    id: "social-welfare",
    name: "Social Welfare",
    emoji: "🤝",
    description: "SC/ST/OBC welfare, social security, nutrition, women & child",
    majorHeadCodes: ["2225","2230","2235","2236","2245","4225","4235","4236","6225","6235"],
  },
  {
    id: "science-tech",
    name: "Science & Technology",
    emoji: "🔬",
    description: "Atomic energy, space research, scientific research, environment",
    majorHeadCodes: ["3401","3402","3403","3425","3435","5401","5402","5403","5425","7425"],
  },
  {
    id: "interest-debt",
    name: "Interest & Debt Servicing",
    emoji: "💸",
    description: "Interest payments on government borrowing",
    majorHeadCodes: ["2048","2049"],
  },
  {
    id: "pensions",
    name: "Pensions",
    emoji: "👴",
    description: "Pensions and other retirement benefits",
    majorHeadCodes: ["2071"],
  },
  {
    id: "police-justice",
    name: "Police & Justice",
    emoji: "⚖️",
    description: "Police, jails, administration of justice, elections",
    majorHeadCodes: ["2014","2015","2055","2056","4055"],
  },
];

export function getTopicById(id: string): Topic | undefined {
  return TOPICS.find(t => t.id === id);
}

/** Reverse lookup: given a major head code, which topic does it belong to? */
const MH_TO_TOPIC = (() => {
  const map: Record<string, Topic> = {};
  for (const t of TOPICS) for (const c of t.majorHeadCodes) map[c] = t;
  return map;
})();
export function getTopicForMajorHead(code: string): Topic | undefined {
  return MH_TO_TOPIC[code];
}

// ─── Aggregations ────────────────────────────────────────────────────────────

export interface TopicAggregate {
  topic: Topic;
  byYear: Record<YearKey, number>;
  byMinistry: { ministry: string; value: number }[]; // top contributors for the current year
  bySection: { revenue: number; capital: number; loans: number }; // for the current year
  rowCount: number;
}

const LOAN_RANGE_START = 6000;

function isLoanMH(code: string): boolean {
  const n = parseInt(code, 10);
  return n >= LOAN_RANGE_START && n < 8000;
}
function isCapitalMH(code: string): boolean {
  const n = parseInt(code, 10);
  return n >= 4000 && n < 6000;
}

/**
 * Aggregate spending on a topic across ALL ministries.
 * Uses DG_MAJOR_HEADS (major-head-level data).
 */
export function aggregateTopic(topic: Topic, year: YearKey): TopicAggregate {
  const rows = DG_MAJOR_HEADS.filter(r => topic.majorHeadCodes.includes(r.mhCode));

  const byYear: Record<YearKey, number> = {
    actuals2425: 0, be2526: 0, re2526: 0, be2627: 0,
  };
  const ministryMap = new Map<string, number>();
  const bySection = { revenue: 0, capital: 0, loans: 0 };

  for (const r of rows) {
    (["actuals2425","be2526","re2526","be2627"] as YearKey[]).forEach(y => {
      byYear[y] += r[y] ?? 0;
    });
    const v = r[year] ?? 0;
    ministryMap.set(r.ministry, (ministryMap.get(r.ministry) ?? 0) + v);

    if (isLoanMH(r.mhCode)) bySection.loans += v;
    else if (isCapitalMH(r.mhCode)) bySection.capital += v;
    else bySection.revenue += v;
  }

  const byMinistry = Array.from(ministryMap, ([ministry, value]) => ({ ministry, value }))
    .sort((a, b) => b.value - a.value);

  return { topic, byYear, byMinistry, bySection, rowCount: rows.length };
}

/**
 * Aggregate by object head — "Where does the money go?"
 * Uses DDG_LEAVES (only covers demands with ingested DDG).
 */
export interface ObjectHeadAggregate {
  code: string;
  name: string;
  objectClass: string;
  revOrCapital: string;
  value: number;
  share: number; // % of total in this view
  topMinistries: { ministry: string; value: number }[];
}

export function aggregateByObjectHead(
  year: YearKey,
  filter?: { ministry?: string; topicId?: string }
): ObjectHeadAggregate[] {
  let rows: DDGLeaf[] = DDG_LEAVES;
  if (filter?.topicId) {
    const t = getTopicById(filter.topicId);
    if (t) rows = rows.filter(r => t.majorHeadCodes.includes(r.majorHead));
  }
  if (filter?.ministry) {
    const demandsForMin = new Set(
      DG_SUMMARY.filter(d => d.ministry === filter.ministry).map(d => d.demandNo)
    );
    rows = rows.filter(r => demandsForMin.has(r.demandNo));
  }

  const byObj = new Map<string, { value: number; ministries: Map<string, number> }>();
  const demandToMin = new Map<number, string>(DG_SUMMARY.map(d => [d.demandNo, d.ministry]));

  for (const r of rows) {
    const v = r[year];
    if (typeof v !== "number") continue;
    const code = r.objectHead.padStart(2, "0");
    if (!byObj.has(code)) byObj.set(code, { value: 0, ministries: new Map() });
    const bucket = byObj.get(code)!;
    bucket.value += v;
    const min = demandToMin.get(r.demandNo) ?? "Unknown";
    bucket.ministries.set(min, (bucket.ministries.get(min) ?? 0) + v);
  }

  const total = Array.from(byObj.values()).reduce((s, b) => s + b.value, 0);

  return Array.from(byObj, ([code, b]) => {
    const meta = OBJECT_HEAD_BY_CODE[code];
    return {
      code,
      name: meta?.name ?? `Object Head ${code}`,
      objectClass: meta?.objectClass ?? "Uncategorized",
      revOrCapital: meta?.revOrCapital ?? "",
      value: b.value,
      share: total ? (b.value / total) * 100 : 0,
      topMinistries: Array.from(b.ministries, ([ministry, value]) => ({ ministry, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
    };
  }).sort((a, b) => b.value - a.value);
}

/** Ministries that exist in DDG data — useful for the "Where it goes" filter */
export function ddgMinistries(): string[] {
  const dnos = new Set(DDG_LEAVES.map(r => r.demandNo));
  const mins = new Set<string>();
  for (const d of DG_SUMMARY) if (dnos.has(d.demandNo)) mins.add(d.ministry);
  return Array.from(mins).sort();
}

// ─── Currency & formatters ───────────────────────────────────────────────────

export type Currency = "INR" | "USD" | "EUR";

/** Conversion rate FROM ₹ Crore to target unit (default Jan 2026 reference rates).
 *  Adjustable in UI; rates can change. 1 Cr = 10,000,000 INR. */
export const DEFAULT_RATES: Record<Currency, number> = {
  INR: 1,            // ₹ Crore (no conversion)
  USD: 85,           // ₹85 per USD → divide ₹ amount by 85
  EUR: 92,           // ₹92 per EUR
};

export const CURRENCY_SYMBOL: Record<Currency, string> = { INR: "₹", USD: "$", EUR: "€" };
export const CURRENCY_LABEL:  Record<Currency, string> = { INR: "₹ Crore", USD: "USD", EUR: "EUR" };

/**
 * Number scale for display.
 *  - smart:  auto-scales (default — ₹100 Cr → "₹100 Cr", ₹450000 Cr → "₹4.5 L Cr")
 *  - crore:  always crore (no further scaling)
 *  - lakh:   always lakh
 *  - actual: full unit (rupees / cents) with Indian-style commas — what budget PDFs print on schedules
 */
export type Scale = "smart" | "crore" | "lakh" | "actual";

/**
 * Format an amount that's stored in ₹ Crore.
 * For INR: keeps the lakh-crore scale (humans read Indian budgets in lakh crore).
 * For USD/EUR: converts to absolute, scales to bn/mn for readability.
 *
 * Sub-₹1-Cr values get 2-decimal precision (or "≈ 0" if effectively nothing),
 * so a ₹0.0334 Cr token allocation no longer reads as "₹0 Cr".
 */
export function formatAmount(
  crores: number | null | undefined,
  currency: Currency = "INR",
  rate?: number,
  scale: Scale = "smart",
): string {
  if (crores == null || isNaN(crores)) return "—";
  const r = rate ?? DEFAULT_RATES[currency];

  if (currency === "INR") {
    const abs = Math.abs(crores);

    // explicit-scale modes
    if (scale === "actual") {
      const rupees = crores * 10_000_000;
      if (rupees === 0) return "₹0";
      if (Math.abs(rupees) < 1) return "≈ ₹0";
      return `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    }
    if (scale === "lakh") {
      const lakhs = crores * 100;
      if (lakhs === 0) return "₹0 L";
      if (Math.abs(lakhs) < 0.005) return "≈ ₹0 L";
      return `₹${lakhs.toLocaleString("en-IN", { maximumFractionDigits: 2 })} L`;
    }
    if (scale === "crore") {
      if (abs === 0) return "₹0 Cr";
      if (abs < 0.005) return "≈ ₹0 Cr";
      return `₹${crores.toLocaleString("en-IN", { maximumFractionDigits: abs < 100 ? 2 : 0 })} Cr`;
    }

    // smart (default)
    if (abs === 0)        return "₹0 Cr";
    if (abs < 0.005)      return "≈ ₹0 Cr";
    if (abs < 1)          return `₹${crores.toLocaleString("en-IN",{maximumFractionDigits:3,minimumFractionDigits:2})} Cr`;
    if (abs < 100)        return `₹${crores.toLocaleString("en-IN",{maximumFractionDigits:2})} Cr`;
    if (abs >= 100000)    return `₹${(crores/100000).toLocaleString("en-IN",{maximumFractionDigits:2})} L Cr`;
    if (abs >= 1000)      return `₹${(crores/1000).toLocaleString("en-IN",{maximumFractionDigits:2})}k Cr`;
    return `₹${crores.toLocaleString("en-IN",{maximumFractionDigits:0})} Cr`;
  }

  // ─── USD / EUR ────────────────────────────────────────────────────────────
  const value = (crores * 10_000_000) / r;
  const sym = CURRENCY_SYMBOL[currency];
  const abs = Math.abs(value);

  if (scale === "actual") {
    if (value === 0) return `${sym}0`;
    if (abs < 1)     return `≈ ${sym}0`;
    return `${sym}${value.toLocaleString("en", { maximumFractionDigits: 0 })}`;
  }

  if (abs === 0)   return `${sym}0`;
  if (abs < 1)     return `≈ ${sym}0`;
  if (abs >= 1e9)  return `${sym}${(value/1e9).toLocaleString("en",{maximumFractionDigits:2})} B`;
  if (abs >= 1e6)  return `${sym}${(value/1e6).toLocaleString("en",{maximumFractionDigits:2})} M`;
  if (abs >= 1e3)  return `${sym}${(value/1e3).toLocaleString("en",{maximumFractionDigits:1})} K`;
  return `${sym}${value.toLocaleString("en",{maximumFractionDigits:0})}`;
}

/** Backwards-compatible alias. New code should use `formatAmount`. */
export function fmtCr(v: number | null | undefined): string {
  return formatAmount(v, "INR");
}

export function fmtPctChange(v: number | null): string {
  if (v == null || !isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

/** Materiality floor for YoY % calculations (₹ Cr).
 *  Anything below this is treated as "not meaningfully comparable" — a ₹0.0001 Cr
 *  token allocation growing to ₹0.03 Cr is not "+30,000% growth", it's a rounding artifact. */
export const YOY_MATERIALITY_CR = 1;

export function yoy(curr: number | null, prev: number | null): number | null {
  if (curr == null || prev == null) return null;
  // Materiality: if the base is below ₹1 Cr, the % is misleading — suppress it.
  if (Math.abs(prev) < YOY_MATERIALITY_CR) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

export const PREV_YEAR: Partial<Record<YearKey, YearKey>> = {
  be2526: "actuals2425",
  re2526: "be2526",
  be2627: "re2526",
};

// Re-export sector helpers for convenience
export { getFunctionalSector, getSocialSubSector, getEconomicSubSector };
