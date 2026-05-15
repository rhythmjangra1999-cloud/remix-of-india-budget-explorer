import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowLeft, Download, ChevronRight, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SCHEMES_RAW from "@/data/schemes.json";
import { getSchemeMapping, reconColor, type SchemeDDGEntry } from "@/lib/scheme-ddg";
import { SchemeDDGSheet } from "./SchemeDDGSheet";

interface Scheme {
  fy: string;
  ministry: string;
  grantCode: number;
  schemeCode: string;
  schemeName: string;
  schemeType: string;
  outlayCr: number;
  ut?: string;
}

const SCHEMES = SCHEMES_RAW as Scheme[];

const TYPE_ORDER = [
  "Centrally Sponsored Scheme",
  "Central Sector Scheme",
  "Other Central Expenditure",
  "Finance Commission Transfers",
  "Other Transfers",
  "Establishment Expenditure",
  "UT Scheme",
];

const TYPE_COLOR: Record<string, { badge: string; bar: string }> = {
  "Centrally Sponsored Scheme":  { badge: "bg-blue-500/10 text-blue-600",       bar: "bg-blue-500" },
  "Central Sector Scheme":        { badge: "bg-emerald-500/10 text-emerald-600", bar: "bg-emerald-500" },
  "Other Central Expenditure":    { badge: "bg-amber-500/10 text-amber-600",     bar: "bg-amber-500" },
  "Finance Commission Transfers": { badge: "bg-rose-500/10 text-rose-600",       bar: "bg-rose-500" },
  "Other Transfers":              { badge: "bg-purple-500/10 text-purple-600",   bar: "bg-purple-500" },
  "Establishment Expenditure":    { badge: "bg-slate-500/10 text-slate-500",     bar: "bg-slate-400" },
  "UT Scheme":                    { badge: "bg-cyan-500/10 text-cyan-600",       bar: "bg-cyan-500" },
};

type Level = "types" | "ministries" | "schemes";

export function SchemeTableView({ fy }: { fy: string }) {
  if (fy === "FY26") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <p className="text-lg font-medium">Data not available for FY26</p>
        <p className="text-sm text-muted-foreground">Scheme-level data is only available for FY 2026-27.</p>
      </div>
    );
  }
  const [level, setLevel] = useState<Level>("types");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedMinistry, setSelectedMinistry] = useState<string>("");
  const [q, setQ] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [openEntry, setOpenEntry] = useState<SchemeDDGEntry | null>(null);

  // Level 1: totals by type
  const byType = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    for (const s of SCHEMES) {
      if (!map[s.schemeType]) map[s.schemeType] = { count: 0, total: 0 };
      map[s.schemeType].count++;
      map[s.schemeType].total += s.outlayCr;
    }
    const grandTotal = Object.values(map).reduce((a, b) => a + b.total, 0);
    return TYPE_ORDER.filter((t) => map[t]).map((t) => ({
      type: t,
      count: map[t].count,
      total: map[t].total,
      share: (map[t].total / grandTotal) * 100,
    }));
  }, []);

  const grandTotal = useMemo(() => byType.reduce((a, b) => a + b.total, 0), [byType]);
  const maxTypeTotal = useMemo(() => Math.max(...byType.map((b) => b.total)), [byType]);

  // Level 2: ministries within selected type
  const byMinistry = useMemo(() => {
    if (!selectedType) return [];
    const map: Record<string, { count: number; total: number }> = {};
    for (const s of SCHEMES.filter((s) => s.schemeType === selectedType)) {
      if (!map[s.ministry]) map[s.ministry] = { count: 0, total: 0 };
      map[s.ministry].count++;
      map[s.ministry].total += s.outlayCr;
    }
    return Object.entries(map)
      .map(([ministry, { count, total }]) => ({ ministry, count, total }))
      .sort((a, b) => b.total - a.total);
  }, [selectedType]);

  const maxMinistryTotal = useMemo(() => Math.max(...byMinistry.map((m) => m.total), 1), [byMinistry]);
  const typeTotal = useMemo(() => byMinistry.reduce((a, b) => a + b.total, 0), [byMinistry]);

  // Level 3: schemes within selected type + ministry
  const schemeRows = useMemo(() => {
    if (!selectedType || !selectedMinistry) return [];
    let list = SCHEMES.filter(
      (s) => s.schemeType === selectedType && s.ministry === selectedMinistry,
    );
    if (q.trim()) {
      const lq = q.toLowerCase();
      list = list.filter(
        (s) =>
          s.schemeName.toLowerCase().includes(lq) ||
          s.schemeCode.includes(lq),
      );
    }
    const sorted = [...list].sort((a, b) => b.outlayCr - a.outlayCr);
    if (sortDir === "asc") sorted.reverse();
    return sorted;
  }, [selectedType, selectedMinistry, q, sortDir]);

  const ministryTotal = useMemo(() => schemeRows.reduce((a, b) => a + b.outlayCr, 0), [schemeRows]);

  const exportCsv = (rows: Scheme[], suffix: string) => {
    const header = "Scheme Code,Scheme Name,Scheme Type,Ministry,Outlay (Cr)\n";
    const body = rows
      .map((s) => `"${s.schemeCode}","${s.schemeName}","${s.schemeType}","${s.ministry}",${s.outlayCr}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schemes-2026-27-${suffix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const typeColors = TYPE_COLOR[selectedType] ?? { badge: "bg-muted text-muted-foreground", bar: "bg-muted" };

  // Breadcrumb
  const Breadcrumb = () => (
    <div className="flex flex-wrap items-center gap-1.5 text-sm">
      <button
        onClick={() => { setLevel("types"); setSelectedType(""); setSelectedMinistry(""); setQ(""); }}
        className={`hover:text-foreground transition-colors ${level === "types" ? "text-foreground font-medium" : "text-muted-foreground"}`}
      >
        All types
      </button>
      {selectedType && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <button
            onClick={() => { setLevel("ministries"); setSelectedMinistry(""); setQ(""); }}
            className={`hover:text-foreground transition-colors ${level === "ministries" ? "text-foreground font-medium" : "text-muted-foreground"}`}
          >
            <span className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${typeColors.badge}`}>
              {selectedType}
            </span>
          </button>
        </>
      )}
      {selectedMinistry && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-foreground font-medium text-xs">{selectedMinistry}</span>
        </>
      )}
    </div>
  );

  // ── Level 1: Type summary ──
  if (level === "types") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {SCHEMES.length} schemes · {formatCr(grandTotal)} · click a type to drill down
          </p>
        </div>
        <div className="rounded-sm border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Scheme Type</th>
                <th className="px-4 py-3 text-right font-medium w-20">Schemes</th>
                <th className="px-4 py-3 font-medium w-[30%]">Share of total</th>
                <th className="px-4 py-3 text-right font-medium w-36">Outlay (INR Cr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {byType.map(({ type, count, total, share }) => {
                const colors = TYPE_COLOR[type] ?? { badge: "bg-muted text-muted-foreground", bar: "bg-muted" };
                return (
                  <tr
                    key={type}
                    onClick={() => { setSelectedType(type); setLevel("ministries"); }}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <span className={`inline-block rounded-sm px-2 py-0.5 text-xs font-medium ${colors.badge}`}>
                        {type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right tnum text-muted-foreground">{count}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 bg-muted rounded-sm overflow-hidden">
                          <div className={`h-full ${colors.bar}`} style={{ width: `${(total / maxTypeTotal) * 100}%` }} />
                        </div>
                        <span className="tnum text-xs text-muted-foreground w-12 text-right">{share.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right tnum font-medium">
                      {total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Level 2: Ministry breakdown within a type ──
  if (level === "ministries") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Breadcrumb />
        </div>
        <p className="text-xs text-muted-foreground">
          {byMinistry.length} ministries · {formatCr(typeTotal)} · click a ministry to see its schemes
        </p>
        <div className="rounded-sm border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Ministry / Department</th>
                <th className="px-4 py-3 text-right font-medium w-20">Schemes</th>
                <th className="px-4 py-3 font-medium w-[30%]">Share within type</th>
                <th className="px-4 py-3 text-right font-medium w-36">Outlay (INR Cr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {byMinistry.map(({ ministry, count, total }) => (
                <tr
                  key={ministry}
                  onClick={() => { setSelectedMinistry(ministry); setLevel("schemes"); setQ(""); }}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{ministry}</td>
                  <td className="px-4 py-3 text-right tnum text-muted-foreground">{count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-muted rounded-sm overflow-hidden">
                        <div className={`h-full ${typeColors.bar}`} style={{ width: `${(total / maxMinistryTotal) * 100}%` }} />
                      </div>
                      <span className="tnum text-xs text-muted-foreground w-14 text-right">
                        {typeTotal > 0 ? ((total / typeTotal) * 100).toFixed(1) : "0.0"}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tnum font-medium">
                    {total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Level 3: Schemes within type + ministry ──
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Breadcrumb />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search scheme…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-xs text-muted-foreground">
          {schemeRows.length} schemes · {formatCr(ministryTotal)}
        </span>
        <button
          onClick={() => setSortDir(sortDir === "desc" ? "asc" : "desc")}
          className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Outlay
          {sortDir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
        </button>
      </div>
      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Scheme</th>
              <th className="px-4 py-3 text-right font-medium w-32">DDG match</th>
              <th className="px-4 py-3 text-right font-medium w-36">Outlay (INR Cr)</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {schemeRows.map((s, i) => {
              const mapping = getSchemeMapping(s.schemeCode, s.grantCode);
              const clickable = !!mapping && mapping.matchedLeafIds.length > 0;
              return (
                <tr
                  key={`${s.schemeCode}-${i}`}
                  onClick={() => clickable && setOpenEntry(mapping!)}
                  className={`transition-colors ${clickable ? "cursor-pointer hover:bg-muted/30" : "hover:bg-muted/10"}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium leading-snug">{s.schemeName}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      #{s.schemeCode}
                      {s.ut && <span className="ml-2">{s.ut}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {mapping && mapping.matchedLeafIds.length > 0 ? (
                      <span className={`inline-block rounded-sm border px-1.5 py-0.5 text-[10px] font-medium ${reconColor(mapping.reconStatus)}`}
                        title={`DDG sum: INR ${mapping.sumMatchedBE2627?.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr (${mapping.matchConfidence})`}
                      >
                        {mapping.reconStatus === "match" ? "✓ matches" : mapping.reconStatus === "close" ? "≈ close" : "Δ off"}
                      </span>
                    ) : mapping?.ddgAvailableForDemand ? (
                      <span className="text-[10px] text-muted-foreground italic">no match</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">no DDG</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tnum">
                    {s.outlayCr === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      s.outlayCr.toLocaleString("en-IN", { maximumFractionDigits: 2 })
                    )}
                  </td>
                  <td className="px-2 py-3 text-muted-foreground">
                    {clickable && <ChevronRight className="h-4 w-4" />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <SchemeDDGSheet open={!!openEntry} onClose={() => setOpenEntry(null)} entry={openEntry} />
    </div>
  );
}
