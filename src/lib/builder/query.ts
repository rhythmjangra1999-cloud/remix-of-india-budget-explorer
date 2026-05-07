import { DG_SUMMARY, DG_MAJOR_HEADS, type YearKey, type Section, getValue, computeYoY } from "@/lib/dg";
import { MINISTRIES } from "@/lib/budget-data";
import schemesRaw from "@/data/schemes.json";
import recoveriesRaw from "@/data/dg-recoveries.json";

export type Dataset = "ministries" | "demands" | "majorHeads" | "schemes";
export type Measure = YearKey | "yoy" | "share" | "recoveries" | "netProvision" | "capitalShare";
export type ViewKind = "table" | "bar" | "stacked" | "treemap";

export interface BuilderConfig {
  dataset: Dataset;
  groupBy: string; // dimension key (dataset-aware)
  ministries: string[]; // names (DG_SUMMARY ministry strings) OR ids; we use display names from each dataset
  section: "all" | Section;
  voted: "all" | "voted" | "charged";
  mhPrefix: string;
  schemeQ: string;
  year: YearKey;
  compareYear?: YearKey;
  measure: Measure;
  minAmount?: number;
  maxAmount?: number;
  topN: number;
  sortDir: "desc" | "asc";
  view: ViewKind;
}

export const DEFAULT_CONFIG: BuilderConfig = {
  dataset: "demands",
  groupBy: "ministry",
  ministries: [],
  section: "all",
  voted: "all",
  mhPrefix: "",
  schemeQ: "",
  year: "be2627",
  compareYear: "be2526",
  measure: "be2627",
  topN: 15,
  sortDir: "desc",
  view: "bar",
};

export interface Row {
  key: string;
  label: string;
  sub?: string;
  value: number;
  compare?: number;
  yoy?: number | null;
  share?: number;
  raw?: Record<string, unknown>;
}

const RECOV = recoveriesRaw as Record<string, Partial<Record<YearKey, number>>>;
const SCHEMES = schemesRaw as Array<{ ministry: string; grantCode: number; schemeName: string; schemeType: string; outlayCr: number }>;

// dataset → ministries available for filter
export function ministriesFor(dataset: Dataset): string[] {
  if (dataset === "ministries") return MINISTRIES.map(m => m.name).sort();
  if (dataset === "demands" || dataset === "majorHeads") {
    return Array.from(new Set(DG_SUMMARY.map(d => d.ministry))).sort();
  }
  return Array.from(new Set(SCHEMES.map(s => s.ministry))).sort();
}

export function groupByOptions(dataset: Dataset): { key: string; label: string }[] {
  switch (dataset) {
    case "ministries": return [{ key: "ministry", label: "Ministry" }];
    case "demands":    return [{ key: "ministry", label: "Ministry" }, { key: "demand", label: "Demand" }, { key: "section", label: "Section" }];
    case "majorHeads": return [{ key: "mh", label: "Major Head" }, { key: "ministry", label: "Ministry" }, { key: "demand", label: "Demand" }, { key: "section", label: "Section" }];
    case "schemes":    return [{ key: "scheme", label: "Scheme" }, { key: "ministry", label: "Ministry" }, { key: "type", label: "Scheme type" }];
  }
}

export function measureOptions(dataset: Dataset): { key: Measure; label: string }[] {
  const base: { key: Measure; label: string }[] = [
    { key: "be2627", label: "BE 26-27" },
    { key: "re2526", label: "RE 25-26" },
    { key: "be2526", label: "BE 25-26" },
    { key: "actuals2425", label: "Actuals 24-25" },
  ];
  if (dataset === "ministries") {
    return [{ key: "be2627", label: "BE 26-27 (Total)" }, { key: "be2526", label: "BE 25-26 (Total)" }, { key: "yoy", label: "YoY %" }];
  }
  if (dataset === "schemes") {
    return [{ key: "be2627", label: "Outlay 26-27" }];
  }
  if (dataset === "demands") {
    return [...base, { key: "yoy", label: "YoY %" }, { key: "recoveries", label: "Recoveries" }, { key: "netProvision", label: "Net Provision" }, { key: "capitalShare", label: "Capital share %" }];
  }
  return [...base, { key: "yoy", label: "YoY %" }, { key: "share", label: "Share of demand %" }];
}

export function runQuery(cfg: BuilderConfig): Row[] {
  const sectionMatch = (s: string) => cfg.section === "all" || s.toLowerCase() === cfg.section;
  const accum = new Map<string, { label: string; sub?: string; vals: number[]; cmp: number[] }>();
  const push = (key: string, label: string, sub: string | undefined, val: number, cmp: number) => {
    const e = accum.get(key) ?? { label, sub, vals: [], cmp: [] };
    e.vals.push(val); e.cmp.push(cmp);
    accum.set(key, e);
  };

  if (cfg.dataset === "ministries") {
    for (const m of MINISTRIES) {
      if (cfg.ministries.length && !cfg.ministries.includes(m.name)) continue;
      const v = (m.totals.FY27 ?? 0);
      const c = (m.totals.FY26 ?? 0);
      push(m.id, m.name, undefined, v, c);
    }
  } else if (cfg.dataset === "demands") {
    for (const d of DG_SUMMARY) {
      if (cfg.ministries.length && !cfg.ministries.includes(d.ministry)) continue;
      const v = getValue(d, cfg.year, cfg.section === "all" ? "total" : cfg.section);
      const c = cfg.compareYear ? getValue(d, cfg.compareYear, cfg.section === "all" ? "total" : cfg.section) : 0;
      const key =
        cfg.groupBy === "ministry" ? d.ministry :
        cfg.groupBy === "section"  ? (cfg.section === "all" ? "total" : cfg.section) :
        `D${d.demandNo}`;
      const label =
        cfg.groupBy === "ministry" ? d.ministry :
        cfg.groupBy === "section"  ? (cfg.section === "all" ? "Total" : cfg.section) :
        d.demandDesc;
      const sub = cfg.groupBy === "demand" ? d.ministry : undefined;
      // measure overrides
      let val = v;
      if (cfg.measure === "recoveries") val = Math.abs(RECOV[String(d.demandNo)]?.[cfg.year] ?? 0);
      else if (cfg.measure === "netProvision") val = v - Math.abs(RECOV[String(d.demandNo)]?.[cfg.year] ?? 0);
      else if (cfg.measure === "capitalShare") {
        const tot = getValue(d, cfg.year, "total");
        val = tot ? (getValue(d, cfg.year, "capital") / tot) * 100 : 0;
      }
      push(key, label, sub, val, c);
    }
  } else if (cfg.dataset === "majorHeads") {
    for (const r of DG_MAJOR_HEADS) {
      if (r.mhCode.startsWith("TOTAL")) continue;
      if (cfg.ministries.length && !cfg.ministries.includes(r.ministry)) continue;
      if (!sectionMatch(r.section)) continue;
      if (cfg.mhPrefix && !r.mhCode.startsWith(cfg.mhPrefix.replace(/_/g, ""))) continue;
      const v = (r[cfg.year] ?? 0);
      const c = cfg.compareYear ? (r[cfg.compareYear] ?? 0) : 0;
      const key =
        cfg.groupBy === "mh"       ? r.mhCode :
        cfg.groupBy === "ministry" ? r.ministry :
        cfg.groupBy === "section"  ? r.section :
        `D${r.demandNo}`;
      const label =
        cfg.groupBy === "mh"       ? `${r.mhCode} ${r.mhName}` :
        cfg.groupBy === "ministry" ? r.ministry :
        cfg.groupBy === "section"  ? r.section :
        r.demandDesc;
      push(key, label, undefined, v, c);
    }
  } else {
    const q = cfg.schemeQ.trim().toLowerCase();
    for (const s of SCHEMES) {
      if (cfg.ministries.length && !cfg.ministries.includes(s.ministry)) continue;
      if (q && !s.schemeName.toLowerCase().includes(q)) continue;
      const v = s.outlayCr ?? 0;
      const key =
        cfg.groupBy === "scheme"   ? s.schemeName :
        cfg.groupBy === "ministry" ? s.ministry :
        s.schemeType;
      const label = key;
      const sub = cfg.groupBy === "scheme" ? s.ministry : undefined;
      push(key, label, sub, v, 0);
    }
  }

  let rows: Row[] = Array.from(accum.entries()).map(([k, e]) => {
    const value = e.vals.reduce((a, b) => a + b, 0);
    const compare = e.cmp.reduce((a, b) => a + b, 0);
    const yoy = computeYoY(value, compare);
    return { key: k, label: e.label, sub: e.sub, value, compare, yoy };
  });

  // measure transform when not handled per-row
  if (cfg.measure === "yoy") {
    rows = rows.map(r => ({ ...r, value: r.yoy ?? 0 }));
  }

  // amount filters (skip on yoy/share which are %)
  const isPct = cfg.measure === "yoy" || cfg.measure === "share" || cfg.measure === "capitalShare";
  if (!isPct) {
    if (typeof cfg.minAmount === "number") rows = rows.filter(r => r.value >= cfg.minAmount!);
    if (typeof cfg.maxAmount === "number") rows = rows.filter(r => r.value <= cfg.maxAmount!);
  }

  const total = rows.reduce((s, r) => s + (isPct ? 0 : r.value), 0);
  rows = rows.map(r => ({ ...r, share: total ? (r.value / total) * 100 : 0 }));

  rows.sort((a, b) => cfg.sortDir === "desc" ? b.value - a.value : a.value - b.value);
  if (cfg.topN > 0) rows = rows.slice(0, cfg.topN);
  return rows;
}

export function toCSV(rows: Row[], cfg: BuilderConfig): string {
  const head = ["Key", "Label", "Sub", `Value (${cfg.measure})`, "Compare", "YoY %", "Share %"];
  const lines = [head.join(",")];
  for (const r of rows) {
    const cells = [r.key, r.label, r.sub ?? "", r.value.toFixed(2), (r.compare ?? 0).toFixed(2), r.yoy?.toFixed(2) ?? "", r.share?.toFixed(2) ?? ""];
    lines.push(cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","));
  }
  return lines.join("\n");
}

export function encodeConfig(cfg: BuilderConfig): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(cfg))));
}
export function decodeConfig(s: string): BuilderConfig | null {
  try { return JSON.parse(decodeURIComponent(escape(atob(s)))) as BuilderConfig; } catch { return null; }
}
