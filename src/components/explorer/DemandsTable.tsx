import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Search } from "lucide-react";
import type { Demand, Ministry } from "@/data/types";
import { formatCr } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  ministries: Ministry[];
  demands: Demand[];
  onSelect?: (ministryId: string) => void;
}

type Section = "Total" | "Revenue" | "Capital";
type SortKey = "demandNo" | "size" | "yoy";

interface Row {
  id: string;
  ministryId: string;
  ministryName: string;
  demandNo: number;
  demandTitle: string;
  actuals2425: number | null;
  be2526: number | null;
  re2526: number | null;
  be2627: number | null;
  yoyPct: number | null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && !isNaN(v) ? v : null;
}

export function DemandsTable({ ministries, demands, onSelect }: Props) {
  const [section, setSection] = useState<Section>("Total");
  const [sortKey, setSortKey] = useState<SortKey>("demandNo");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [q, setQ] = useState("");

  const ministryName = useMemo(() => {
    const m = new Map<string, string>();
    ministries.forEach((x) => m.set(x.id, x.name));
    return m;
  }, [ministries]);

  const rows = useMemo<Row[]>(() => {
    return demands.map((d) => {
      const a = d.amounts as Record<string, number | undefined>;
      // Section-aware values: when Revenue/Capital, scale BE26/27 totals by FY27 split ratio
      // (FY27_Revenue / FY27_Capital are present; older-year revenue/capital not in source —
      //  fall back to applying the FY27 share to derive a comparable trajectory).
      let actuals = num(a.FY25_Actual);
      let be2526 = num(a.FY26);
      let re2526 = num(a.FY26_RE);
      let be2627 = num(a.FY27);

      if (section !== "Total") {
        const rev = num(a.FY27_Revenue) ?? 0;
        const cap = num(a.FY27_Capital) ?? 0;
        const tot = rev + cap;
        const share = tot > 0 ? (section === "Revenue" ? rev / tot : cap / tot) : 0;
        actuals = actuals != null ? actuals * share : null;
        be2526 = be2526 != null ? be2526 * share : null;
        re2526 = re2526 != null ? re2526 * share : null;
        be2627 = section === "Revenue" ? num(a.FY27_Revenue) : num(a.FY27_Capital);
      }

      const yoyPct =
        be2526 != null && be2526 !== 0 && be2627 != null
          ? ((be2627 - be2526) / be2526) * 100
          : null;

      return {
        id: d.id,
        ministryId: d.ministryId,
        ministryName: ministryName.get(d.ministryId) ?? d.ministryId,
        demandNo: d.number,
        demandTitle: d.title,
        actuals2425: actuals,
        be2526,
        re2526,
        be2627,
        yoyPct,
      };
    });
  }, [demands, section, ministryName]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows;
    if (needle) {
      out = out.filter(
        (r) =>
          r.demandTitle.toLowerCase().includes(needle) ||
          r.ministryName.toLowerCase().includes(needle) ||
          String(r.demandNo).includes(needle),
      );
    }
    const sorted = [...out].sort((a, b) => {
      if (sortKey === "demandNo") return a.demandNo - b.demandNo;
      if (sortKey === "size") return (b.be2627 ?? 0) - (a.be2627 ?? 0);
      // yoy: nulls last
      const av = a.yoyPct ?? -Infinity;
      const bv = b.yoyPct ?? -Infinity;
      return bv - av;
    });
    if (dir === "asc" && sortKey !== "demandNo") sorted.reverse();
    if (dir === "desc" && sortKey === "demandNo") sorted.reverse();
    return sorted;
  }, [rows, q, sortKey, dir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setDir(k === "demandNo" ? "asc" : "desc");
    }
  };

  const exportCsv = () => {
    const header = "No,Ministry,Demand,Actuals 24-25,BE 25-26,RE 25-26,BE 26-27,YoY %\n";
    const body = filtered
      .map((r) =>
        [
          r.demandNo,
          `"${r.ministryName.replace(/"/g, '""')}"`,
          `"${r.demandTitle.replace(/"/g, '""')}"`,
          r.actuals2425 ?? "",
          r.be2526 ?? "",
          r.re2526 ?? "",
          r.be2627 ?? "",
          r.yoyPct != null ? r.yoyPct.toFixed(2) : "",
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demands-${section.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortChip = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm border text-xs transition-colors ${
        sortKey === k
          ? "bg-foreground text-background border-foreground"
          : "bg-card border-border hover:bg-muted"
      }`}
    >
      {label}
      {sortKey === k && (dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
    </button>
  );

  const SectionChip = ({ s, label }: { s: Section; label: string }) => (
    <button
      onClick={() => setSection(s)}
      className={`px-3 py-1.5 text-xs transition-colors ${
        section === s ? "bg-foreground text-background" : "bg-card hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-sm border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Section</span>
          <div className="inline-flex rounded-sm border border-border overflow-hidden">
            <SectionChip s="Revenue" label="Revenue" />
            <SectionChip s="Capital" label="Capital" />
            <SectionChip s="Total" label="Total" />
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Sort</span>
          <SortChip k="demandNo" label="Demand No." />
          <SortChip k="size" label="Size (BE 26-27)" />
          <SortChip k="yoy" label="YoY %" />
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="h-4 w-4" /> CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ministry, demand, no…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filtered.length} demands · BE 26-27 · {section}
        </div>
      </div>

      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-3 text-left font-medium w-12">No.</th>
              <th className="px-3 py-3 text-left font-medium">Ministry · Demand</th>
              <th className="px-3 py-3 text-right font-medium">Actuals 24-25</th>
              <th className="px-3 py-3 text-right font-medium">BE 25-26</th>
              <th className="px-3 py-3 text-right font-medium">RE 25-26</th>
              <th className="px-3 py-3 text-right font-medium">BE 26-27</th>
              <th className="px-3 py-3 text-right font-medium w-20">YoY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => {
              const yoyPositive = r.yoyPct != null ? r.yoyPct >= 0 : null;
              return (
                <tr
                  key={r.id}
                  onClick={() => onSelect?.(r.ministryId)}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-3 text-muted-foreground tnum font-mono text-xs">{r.demandNo}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium leading-tight">{r.demandTitle}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{r.ministryName}</div>
                  </td>
                  <td className="px-3 py-3 text-right tnum font-mono text-xs">
                    {r.actuals2425 != null ? formatCr(r.actuals2425, { compact: true }) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right tnum font-mono text-xs">
                    {r.be2526 != null ? formatCr(r.be2526, { compact: true }) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right tnum font-mono text-xs">
                    {r.re2526 != null ? formatCr(r.re2526, { compact: true }) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right tnum font-mono text-xs font-semibold">
                    {r.be2627 != null ? formatCr(r.be2627, { compact: true }) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {r.yoyPct == null ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[11px] tnum font-mono ${
                          yoyPositive
                            ? "bg-green-500/15 text-green-700 dark:text-green-400"
                            : "bg-red-500/15 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {yoyPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {r.yoyPct >= 0 ? "+" : ""}
                        {r.yoyPct.toFixed(1)}%
                      </span>
                    )}
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
