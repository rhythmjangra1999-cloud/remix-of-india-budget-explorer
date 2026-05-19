import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Info, Download, Link as LinkIcon, Check } from "lucide-react";
import { DG_SUMMARY, type YearKey } from "@/lib/dg";
import { DDG_LEAVES, type DDGLeaf } from "@/lib/ddg";
import {
  TOPICS, getTopicForMajorHead, formatAmount, YEAR_PLAIN,
  type Currency, type Scale, CURRENCY_LABEL, DEFAULT_RATES,
} from "@/lib/report";
import { LMMH_OBJECT_HEADS, MAJOR_HEAD_NAME, canonicalObjectHead, getFunctionalSector } from "@/lib/lmmh";
import FilterMultiSelect, { type FilterOption } from "../build/FilterMultiSelect";
import BreakdownChips, { type Dimension } from "../build/BreakdownChips";
import NestedTable, { type TreeNode } from "../build/NestedTable";

const ALL_YEARS: YearKey[] = ["actuals2425", "be2526", "re2526", "be2627"];

const ALL_DIMS: Dimension[] = [
  { key: "ministry",   label: "Ministry",         emoji: "🏛️" },
  { key: "demand",     label: "Demand",           emoji: "📋" },
  { key: "sector",     label: "Functional Sector", emoji: "🏗️" },
  { key: "topic",      label: "Topic",            emoji: "📚" },
  { key: "section",    label: "Section",          emoji: "🔀" },
  { key: "majorHead",  label: "Major Head",       emoji: "🗂️" },
  { key: "minorHead",  label: "Minor Head",       emoji: "🏷️" },
  { key: "objectHead", label: "Spent on",         emoji: "💰" },
  { key: "scheme",     label: "Scheme",           emoji: "📦" },
];

// ─── Sort modes ──────────────────────────────────────────────────────────────
type SortMode =
  | { kind: "year"; year: YearKey; dir: "desc" | "asc" }
  | { kind: "delta-abs"; from: YearKey; to: YearKey; dir: "desc" | "asc" }
  | { kind: "delta-pct"; from: YearKey; to: YearKey; dir: "desc" | "asc" };

const SORT_PRESETS: { id: string; label: string; mode: SortMode }[] = [
  { id: "highest-26",    label: "Highest in Planned 26-27",      mode: { kind: "year", year: "be2627", dir: "desc" } },
  { id: "lowest-26",     label: "Lowest in Planned 26-27",       mode: { kind: "year", year: "be2627", dir: "asc"  } },
  { id: "gainers-25-26", label: "Top gainers · 25-26 BE → 26-27 BE (₹)", mode: { kind: "delta-abs", from: "be2526", to: "be2627", dir: "desc" } },
  { id: "cuts-25-26",    label: "Largest cuts · 25-26 BE → 26-27 BE (₹)", mode: { kind: "delta-abs", from: "be2526", to: "be2627", dir: "asc"  } },
  { id: "gainers-pct",   label: "Top gainers · % change 25-26 → 26-27",   mode: { kind: "delta-pct", from: "be2526", to: "be2627", dir: "desc" } },
  { id: "cuts-pct",      label: "Largest cuts · % change 25-26 → 26-27",  mode: { kind: "delta-pct", from: "be2526", to: "be2627", dir: "asc"  } },
];

const EXAMPLE_PRESETS: { label: string; emoji: string; objectHead?: string[]; section?: string[]; breakdown: string[]; sortId?: string }[] = [
  { emoji: "💰", label: "Salaries by ministry",       objectHead: ["01"], breakdown: ["ministry"] },
  { emoji: "🏞️", label: "Land — ranked",              objectHead: ["78"], section: ["Capital"], breakdown: ["ministry"] },
  { emoji: "🌾", label: "Subsidies — ministry × year", objectHead: ["33"], breakdown: ["ministry"] },
  { emoji: "🎓", label: "Grants-in-Aid by topic",     objectHead: ["31","35","36"], breakdown: ["topic","ministry"] },
  { emoji: "📈", label: "Top 10 gainers (₹)",          breakdown: ["majorHead"], sortId: "gainers-25-26" },
  { emoji: "📉", label: "Largest cuts (₹)",            breakdown: ["majorHead"], sortId: "cuts-25-26" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function BuildReportTab() {
  const [params, setParams] = useSearchParams();

  // ─── Hydrate state from URL ───────────────────────────────────────────────
  const [ministries, setMinistries]   = useState<string[]>(() => splitList(params.get("m")));
  const [topicIds, setTopicIds]       = useState<string[]>(() => splitList(params.get("t")));
  const [sections, setSections]       = useState<string[]>(() => splitList(params.get("s")));
  const [objectHeads, setObjectHeads] = useState<string[]>(() => splitList(params.get("o")));
  const [minorHeads, setMinorHeads]   = useState<string[]>(() => splitList(params.get("mh")));
  const [breakdown, setBreakdown]     = useState<Dimension[]>(() => {
    const ids = splitList(params.get("b"));
    return ids.length
      ? ids.map(k => ALL_DIMS.find(d => d.key === k)).filter(Boolean) as Dimension[]
      : [ALL_DIMS.find(d => d.key === "ministry")!];
  });
  const [yearsShown, setYearsShown] = useState<YearKey[]>(() => {
    const y = splitList(params.get("y")) as YearKey[];
    return y.length ? y : ["be2526", "re2526", "be2627"];
  });
  const [sortId, setSortId] = useState<string>(() => params.get("sort") ?? "highest-26");
  const [currency, setCurrency] = useState<Currency>(() => (params.get("c") as Currency) ?? "INR");
  const [scale, setScale] = useState<Scale>(() => (params.get("sc") as Scale) ?? "smart");
  const [rates, setRates] = useState<Record<Currency, number>>(DEFAULT_RATES);
  const [copied, setCopied] = useState(false);

  // ─── Persist state to URL ────────────────────────────────────────────────
  useEffect(() => {
    const next = new URLSearchParams();
    if (ministries.length)  next.set("m",  ministries.join(","));
    if (topicIds.length)    next.set("t",  topicIds.join(","));
    if (sections.length)    next.set("s",  sections.join(","));
    if (objectHeads.length) next.set("o",  objectHeads.join(","));
    if (minorHeads.length)  next.set("mh", minorHeads.join(","));
    if (breakdown.length)   next.set("b",  breakdown.map(d => d.key).join(","));
    if (yearsShown.length)  next.set("y",  yearsShown.join(","));
    if (sortId !== "highest-26") next.set("sort", sortId);
    if (currency !== "INR")  next.set("c", currency);
    if (scale !== "smart")   next.set("sc", scale);
    setParams(next, { replace: true });
  }, [ministries, topicIds, sections, objectHeads, minorHeads, breakdown, yearsShown, sortId, currency, scale, setParams]);

  // ─── Derive sort mode + primary year ─────────────────────────────────────
  const sortMode = SORT_PRESETS.find(p => p.id === sortId)?.mode ?? SORT_PRESETS[0].mode;
  const primaryYear: YearKey = sortMode.kind === "year" ? sortMode.year : sortMode.to;

  // ─── Available dimensions for the breakdown pool ─────────────────────────
  const available = ALL_DIMS.filter(d => !breakdown.find(b => b.key === d.key));

  function toggleYear(y: YearKey) {
    setYearsShown(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y].sort((a,b) => ALL_YEARS.indexOf(a) - ALL_YEARS.indexOf(b)));
  }

  // ─── Filter rows ──────────────────────────────────────────────────────────
  const demandToMinistry = useMemo(() => new Map(DG_SUMMARY.map(d => [d.demandNo, d.ministry])), []);
  const demandDesc       = useMemo(() => new Map(DG_SUMMARY.map(d => [d.demandNo, d.demandDesc])), []);

  const filteredRows = useMemo(() => {
    const minSet = ministries.length ? new Set(ministries) : null;
    const topicMHs = topicIds.length
      ? new Set(topicIds.flatMap(id => TOPICS.find(t => t.id === id)?.majorHeadCodes ?? []))
      : null;
    const secSet = sections.length ? new Set(sections.map(s => s.toLowerCase())) : null;
    const ohSet  = objectHeads.length ? new Set(objectHeads.map(c => c.padStart(2, "0"))) : null;
    const mhSet  = minorHeads.length ? new Set(minorHeads) : null;

    return DDG_LEAVES.filter(r => {
      const m = demandToMinistry.get(r.demandNo) ?? r.ministry;
      if (minSet && !minSet.has(m)) return false;
      if (topicMHs && !topicMHs.has(r.majorHead)) return false;
      if (secSet && !secSet.has((r.section || "").toLowerCase())) return false;
      if (ohSet && !ohSet.has(r.objectHead.padStart(2, "0"))) return false;
      if (mhSet && !mhSet.has(r.minorHead)) return false;
      return true;
    });
  }, [ministries, topicIds, sections, objectHeads, minorHeads, demandToMinistry]);

  const opts = useMemo(() => buildFilterOptions(filteredRows, demandToMinistry), [filteredRows, demandToMinistry]);

  const tree = useMemo(() => buildTree(filteredRows, breakdown.map(d => d.key), demandToMinistry, demandDesc), [filteredRows, breakdown, demandToMinistry, demandDesc]);
  const sortedTree = useMemo(() => sortTree(tree, sortMode), [tree, sortMode]);

  const totalLeaves = filteredRows.length;
  const totalAmount = filteredRows.reduce((s, r) => s + (r[primaryYear] ?? 0), 0);
  const coverageDemands = new Set(filteredRows.map(r => r.demandNo)).size;

  function applyPreset(p: typeof EXAMPLE_PRESETS[number]) {
    setObjectHeads(p.objectHead ?? []);
    setSections(p.section ?? []);
    setMinistries([]); setTopicIds([]); setMinorHeads([]);
    setBreakdown(p.breakdown.map(k => ALL_DIMS.find(d => d.key === k)!));
    if (p.sortId) setSortId(p.sortId);
  }

  function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  // ─── v2 CSV export — flat row format with full code metadata ──────────────
  function exportCSV() {
    const today = new Date().toISOString().split("T")[0];
    const filterManifest = [
      ministries.length ? `ministries=${ministries.join("|")}` : null,
      topicIds.length   ? `topics=${topicIds.join("|")}` : null,
      sections.length   ? `sections=${sections.join("|")}` : null,
      objectHeads.length ? `objectHeads=${objectHeads.join("|")}` : null,
      minorHeads.length ? `minorHeads=${minorHeads.join("|")}` : null,
    ].filter(Boolean).join(" ; ") || "(none)";

    const headerBlock = [
      `# India Union Budget — Detailed DG (DDG) export`,
      `# Generated: ${today}`,
      `# Source: DDG_Combined CSV pipeline · LMMHA Correction Slips up to No. 1081 (28-Jan-2026)`,
      `# Currency: ${CURRENCY_LABEL[currency]}${currency !== "INR" ? ` (rate: 1 ${currency} = ₹${rates[currency]} INR)` : ""}`,
      `# Filters: ${filterManifest}`,
      `# Breakdown: ${breakdown.map(d => d.label).join(" → ") || "(none)"}`,
      `# Sort: ${SORT_PRESETS.find(p => p.id === sortId)?.label}`,
      `# Rows: ${filteredRows.length}`,
      `#`,
    ].join("\n");

    const columns = [
      "ministry", "demandNo", "demandDesc", "section",
      "majorHead", "majorHeadName", "subMajorCode",
      "minorHead", "minorHeadName",
      "subHead", "subHeadName", "detailedHead",
      "objectHead", "objectHeadName", "objectClass",
      "fullCode", "gapFlag", "gapReason",
      "actuals_24-25", "BE_25-26", "RE_25-26", "BE_26-27",
      "units",
    ];

    const lines = [headerBlock, columns.join(",")];

    // sort filtered rows by primaryYear for stable output
    const ordered = [...filteredRows].sort((a, b) => (b[primaryYear] ?? 0) - (a[primaryYear] ?? 0));
    for (const r of ordered) {
      const oh = canonicalObjectHead(r.objectHead, r.objectHeadName);
      const ohMeta = LMMH_OBJECT_HEADS.find(o => o.code === oh.code);
      const fullCode = `${r.majorHead}-${(r.subMajor || "00").padStart(2,"0")}-${r.minorHead}-${(r.subHead || "").padStart(2,"0")}-${(r.detailedHead || "").padStart(2,"0")}-${oh.code}`;
      const min = demandToMinistry.get(r.demandNo) ?? r.ministry;
      const desc = demandDesc.get(r.demandNo) ?? "";
      lines.push([
        q(min), r.demandNo, q(desc), q(r.section),
        r.majorHead, q(MAJOR_HEAD_NAME[r.majorHead] ?? r.majorHeadName), r.subMajor,
        r.minorHead, q(r.minorHeadName),
        r.subHead, q(r.subHeadName), r.detailedHead,
        oh.code, q(oh.name), q(ohMeta?.objectClass ?? ""),
        fullCode, r.gapFlag ?? "", q(r.gapReason ?? ""),
        r.actuals2425 ?? "", r.be2526 ?? "", r.re2526 ?? "", r.be2627 ?? "",
        "INR Crore",
      ].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `union-budget-report_${today}.csv`;
    a.click();
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/20 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Filter, then drag dimensions to break it down.</span>{" "}
          Every dropdown shows live totals. Sort by absolute or % change to find biggest gainers and cuts.
          State is URL-encoded — copy the link to share or cite a specific view.
        </div>
      </div>

      {/* Example pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Examples:</span>
        {EXAMPLE_PRESETS.map(p => (
          <button key={p.label} onClick={() => applyPreset(p)}
            className="text-xs px-2.5 py-1 rounded-full border border-border bg-card hover:bg-primary/5 hover:border-primary hover:text-primary transition-colors flex items-center gap-1">
            <span>{p.emoji}</span><span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <FilterMultiSelect label="Ministry"               options={opts.ministries}  selected={ministries}  onChange={setMinistries}  placeholder="All ministries" />
          <FilterMultiSelect label="Topic"                  options={opts.topics}      selected={topicIds}    onChange={setTopicIds}    placeholder="All topics" />
          <FilterMultiSelect label="Section"                options={opts.sections}    selected={sections}    onChange={setSections}    placeholder="Rev + Cap + Loans" />
          <FilterMultiSelect label="Spent on (Object Head)" options={opts.objectHeads} selected={objectHeads} onChange={setObjectHeads} placeholder="All categories" />
          <FilterMultiSelect label="Purpose (Minor Head)"   options={opts.minorHeads}  selected={minorHeads}  onChange={setMinorHeads}  placeholder="All purposes" />
        </div>

        <div className="border-t border-border pt-4">
          <BreakdownChips active={breakdown} available={available} onChange={setBreakdown} />
        </div>

        <div className="border-t border-border pt-4 flex flex-wrap items-end gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1.5">Year columns</div>
            <div className="flex flex-wrap gap-2">
              {ALL_YEARS.map(y => (
                <label key={y} className={`px-3 py-1.5 rounded-md border text-xs cursor-pointer transition-colors
                  ${yearsShown.includes(y) ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted/40"}`}>
                  <input type="checkbox" checked={yearsShown.includes(y)} onChange={() => toggleYear(y)} className="sr-only" />
                  {YEAR_PLAIN[y].short}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium block mb-1">Rank by</label>
            <select value={sortId} onChange={e => setSortId(e.target.value)}
              className="text-sm rounded-md border border-input bg-background px-3 py-1.5 min-w-[280px]">
              {SORT_PRESETS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium block mb-1">Currency</label>
            <div className="flex items-center gap-2">
              <select value={currency} onChange={e => setCurrency(e.target.value as Currency)}
                className="text-sm rounded-md border border-input bg-background px-3 py-1.5">
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </select>
              {currency !== "INR" && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>1 {currency} = ₹</span>
                  <input
                    type="number"
                    value={rates[currency]}
                    onChange={e => setRates(prev => ({ ...prev, [currency]: parseFloat(e.target.value) || prev[currency] }))}
                    className="w-14 px-1.5 py-0.5 rounded border border-input bg-background tabular-nums"
                    step="0.5"
                  />
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium block mb-1">
              Scale {currency === "INR" && <span className="normal-case text-muted-foreground">(units)</span>}
            </label>
            <select value={scale} onChange={e => setScale(e.target.value as Scale)}
              className="text-sm rounded-md border border-input bg-background px-3 py-1.5">
              <option value="smart">Smart (auto-scale)</option>
              {currency === "INR" && <option value="crore">Crore (₹ Cr)</option>}
              {currency === "INR" && <option value="lakh">Lakh (₹ L)</option>}
              <option value="actual">Actual {currency === "INR" ? "(₹ in full)" : `(${CURRENCY_LABEL[currency]} in full)`}</option>
            </select>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">In current view</div>
            <div className="text-sm">
              <span className="font-semibold tabular-nums">{formatAmount(totalAmount, currency, rates[currency], scale)}</span>
              <span className="text-muted-foreground"> · {totalLeaves.toLocaleString()} rows · {coverageDemands} demands</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {sortedTree.length > 0 ? (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 flex-wrap">
            <div>
              <div className="text-sm font-medium">Report</div>
              <div className="text-xs text-muted-foreground">
                {sortedTree.length} top-level rows · grouped by {breakdown.map(d => d.label).join(" → ") || "(everything)"} · {SORT_PRESETS.find(p => p.id === sortId)?.label}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={copyLink} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted flex items-center gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <LinkIcon className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy link"}
              </button>
              <button onClick={exportCSV} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            </div>
          </div>
          <NestedTable
            rows={sortedTree}
            yearsShown={yearsShown}
            primaryYear={primaryYear}
            groupingLabels={breakdown.length ? breakdown.map(d => d.label) : ["(everything)"]}
            currency={currency}
            rate={rates[currency]}
            scale={scale}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No rows match the current filters. Try removing some.
        </div>
      )}
    </div>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function splitList(s: string | null): string[] {
  if (!s) return [];
  return s.split(",").filter(Boolean);
}

function q(s: string): string {
  if (s == null) return "";
  const str = String(s);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

// ─── Filter option builders ──────────────────────────────────────────────────

function buildFilterOptions(rows: typeof DDG_LEAVES, demandToMinistry: Map<number, string>) {
  const m = new Map<string, number>();
  const t = new Map<string, number>();
  const s = new Map<string, number>();
  const oh = new Map<string, number>();
  const mh = new Map<string, { total: number; name: string }>();

  for (const r of rows) {
    const v = r.be2627 ?? 0;
    const min = demandToMinistry.get(r.demandNo) ?? r.ministry;
    m.set(min, (m.get(min) ?? 0) + v);

    const topic = getTopicForMajorHead(r.majorHead);
    if (topic) t.set(topic.id, (t.get(topic.id) ?? 0) + v);

    s.set(r.section, (s.get(r.section) ?? 0) + v);

    const ohCode = r.objectHead.padStart(2, "0");
    oh.set(ohCode, (oh.get(ohCode) ?? 0) + v);

    const mhKey = r.minorHead;
    if (mhKey) {
      const existing = mh.get(mhKey);
      mh.set(mhKey, { total: (existing?.total ?? 0) + v, name: r.minorHeadName || existing?.name || "" });
    }
  }

  return {
    ministries: Array.from(m, ([value, total]) => ({ value, label: value, total }))
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0)) as FilterOption[],

    topics: TOPICS.map(tp => ({
      value: tp.id,
      label: `${tp.emoji} ${tp.name}`,
      total: t.get(tp.id) ?? 0,
    } as FilterOption)).sort((a, b) => (b.total ?? 0) - (a.total ?? 0)),

    sections: Array.from(s, ([value, total]) => ({ value, label: value, total } as FilterOption))
      .sort((a, b) => (b.total ?? 0) - (a.total ?? 0)),

    objectHeads: LMMH_OBJECT_HEADS.map(o => ({
      value: o.code,
      label: o.name,
      sublabel: `Code ${o.code}`,
      group: o.objectClass.replace(/^Class [IVX]+:?\s*/i, ""),
      total: oh.get(o.code) ?? 0,
    } as FilterOption)).sort((a, b) => (b.total ?? 0) - (a.total ?? 0)),

    minorHeads: Array.from(mh, ([code, info]) => ({
      value: code,
      label: info.name || `Minor Head ${code}`,
      sublabel: `Code ${code}`,
      total: info.total,
    } as FilterOption)).sort((a, b) => (b.total ?? 0) - (a.total ?? 0)),
  };
}

// ─── Tree builder ────────────────────────────────────────────────────────────

function keyForDim(dim: string, r: DDGLeaf, demandToMin: Map<number, string>, demandDesc: Map<number, string>): { key: string; label: string; sublabel?: string } {
  if (dim === "ministry") {
    const m = demandToMin.get(r.demandNo) ?? r.ministry;
    return { key: m, label: m };
  }
  if (dim === "demand") {
    const desc = demandDesc.get(r.demandNo);
    return { key: `D${r.demandNo}`, label: desc ?? `Demand ${r.demandNo}`, sublabel: `Demand ${r.demandNo}` };
  }
  if (dim === "topic") {
    const t = getTopicForMajorHead(r.majorHead);
    return t ? { key: t.id, label: `${t.emoji} ${t.name}` } : { key: "other", label: "Other / Uncategorised" };
  }
  if (dim === "sector") {
    const sec = getFunctionalSector(r.majorHead);
    return { key: sec, label: sec, sublabel: "Functional Sector (LMMH)" };
  }
  if (dim === "section") return { key: r.section, label: r.section };
  if (dim === "majorHead") {
    const name = MAJOR_HEAD_NAME[r.majorHead] ?? r.majorHeadName;
    return { key: r.majorHead, label: name, sublabel: `Code ${r.majorHead}` };
  }
  if (dim === "minorHead") {
    return { key: r.minorHead, label: r.minorHeadName || `Minor Head ${r.minorHead}`, sublabel: `Code ${r.minorHead}` };
  }
  if (dim === "objectHead") {
    const canon = canonicalObjectHead(r.objectHead, r.objectHeadName);
    return { key: canon.code, label: canon.name, sublabel: `Code ${canon.code}` };
  }
  if (dim === "scheme") {
    const label = r.subHeadName || r.detailedHead || r.subHead || "(unnamed scheme)";
    const subkey = `${r.demandNo}-${r.subHead}-${r.detailedHead}-${label}`;
    return { key: subkey, label };
  }
  return { key: "?", label: "?" };
}

function buildTree(rows: DDGLeaf[], dims: string[], demandToMin: Map<number, string>, demandDesc: Map<number, string>): TreeNode[] {
  if (dims.length === 0) {
    const vals: Partial<Record<YearKey, number>> = {};
    for (const r of rows) {
      ALL_YEARS.forEach(y => {
        const v = r[y];
        if (typeof v === "number") vals[y] = (vals[y] ?? 0) + v;
      });
    }
    return [{
      key: "all",
      label: "All matching budget lines",
      sublabel: `${rows.length.toLocaleString()} underlying records — expand to see actual codes`,
      values: vals,
      rawRows: rows,
      path: "all",
    }];
  }

  function recurse(subset: DDGLeaf[], depth: number, pathPrefix: string): TreeNode[] {
    if (depth >= dims.length) return [];
    const dim = dims[depth];
    const groups = new Map<string, { node: TreeNode; subset: DDGLeaf[] }>();

    for (const r of subset) {
      const { key, label, sublabel } = keyForDim(dim, r, demandToMin, demandDesc);
      const path = `${pathPrefix}/${key}`;
      if (!groups.has(key)) {
        groups.set(key, {
          node: { key, label, sublabel, values: {}, path, children: undefined },
          subset: [],
        });
      }
      const g = groups.get(key)!;
      g.subset.push(r);
      ALL_YEARS.forEach(y => {
        const v = r[y];
        if (typeof v === "number") g.node.values[y] = (g.node.values[y] ?? 0) + v;
      });
    }

    const out: TreeNode[] = [];
    for (const { node, subset } of groups.values()) {
      if (depth + 1 < dims.length) {
        node.children = recurse(subset, depth + 1, node.path);
      } else {
        node.rawRows = subset;
      }
      out.push(node);
    }
    return out;
  }

  return recurse(rows, 0, "");
}

// ─── Sort modes ──────────────────────────────────────────────────────────────

function nodeSortValue(n: TreeNode, mode: SortMode): number {
  if (mode.kind === "year") {
    return n.values[mode.year] ?? 0;
  }
  if (mode.kind === "delta-abs") {
    return (n.values[mode.to] ?? 0) - (n.values[mode.from] ?? 0);
  }
  // delta-pct
  const from = n.values[mode.from] ?? 0;
  const to   = n.values[mode.to] ?? 0;
  if (from === 0) return to === 0 ? 0 : Infinity * (to > 0 ? 1 : -1);
  return ((to - from) / Math.abs(from)) * 100;
}

function sortTree(nodes: TreeNode[], mode: SortMode): TreeNode[] {
  const dir = mode.dir === "desc" ? -1 : 1;
  const sorted = [...nodes].sort((a, b) => {
    const va = nodeSortValue(a, mode);
    const vb = nodeSortValue(b, mode);
    if (!isFinite(va) || !isFinite(vb)) {
      // push non-finite (∞ from zero baseline) to the end of the desired direction
      if (!isFinite(va) && !isFinite(vb)) return 0;
      return !isFinite(va) ? dir : -dir;
    }
    return (vb - va) * (dir === -1 ? 1 : -1);
  });
  return sorted.map(n => n.children ? { ...n, children: sortTree(n.children, mode) } : n);
}
