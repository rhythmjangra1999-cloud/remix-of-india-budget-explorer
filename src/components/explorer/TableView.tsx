import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download } from "lucide-react";
import type { Ministry, FY } from "@/data/types";
import { formatCr, formatYoY } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  ministries: Ministry[];
  fy: FY;
  onSelect: (id: string) => void;
  totalBudget: number;
}

type SortKey = "name" | "amount" | "share";

export function TableView({ ministries, fy, onSelect, totalBudget }: Props) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("amount");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    const filtered = ministries.filter(
      (m) =>
        !q.trim() ||
        m.name.toLowerCase().includes(q.toLowerCase()) ||
        (m.short ?? "").toLowerCase().includes(q.toLowerCase()),
    );
    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      const av = a.totals[fy] ?? 0;
      const bv = b.totals[fy] ?? 0;
      return bv - av;
    });
    if (dir === "asc" && sortKey !== "name") sorted.reverse();
    if (dir === "desc" && sortKey === "name") sorted.reverse();
    return sorted;
  }, [ministries, q, sortKey, dir, fy]);

  const max = useMemo(
    () => Math.max(...ministries.map((m) => m.totals[fy] ?? 0), 1),
    [ministries, fy],
  );

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setDir(dir === "desc" ? "asc" : "desc");
    else {
      setSortKey(k);
      setDir(k === "name" ? "asc" : "desc");
    }
  };

  const exportCsv = () => {
    const header = "Ministry,FY26 (Cr),FY27 (Cr),Share of Union Budget %\n";
    const body = rows
      .map((m) => {
        const share = (((m.totals[fy] ?? 0) / totalBudget) * 100).toFixed(2);
        return `"${m.name}",${m.totals.FY26 ?? ""},${m.totals.FY27 ?? ""},${share}`;
      })
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `union-budget-${fy}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortBtn = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <button
      onClick={() => toggleSort(k)}
      className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${right ? "ml-auto" : ""}`}
    >
      {label}
      {sortKey === k && (dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Filter ministries…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
        <span className="text-xs text-muted-foreground">{rows.length} ministries</span>
      </div>

      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium"><SortBtn k="name" label="Ministry" /></th>
              <th className="px-4 py-3 text-right font-medium w-32"><SortBtn k="amount" label={fy} right /></th>
              <th className="px-4 py-3 font-medium w-[28%]">Share</th>
              <th className="px-4 py-3 text-right font-medium w-24">YoY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((m) => {
              const v = m.totals[fy] ?? 0;
              const share = (v / totalBudget) * 100;
              const yoy = formatYoY(m.totals.FY26, m.totals.FY27);
              return (
                <tr
                  key={m.id}
                  onClick={() => onSelect(m.id)}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">
                    {m.name}
                    {m.ddgAvailable && (
                      <span className="ml-2 inline-block rounded-sm bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 uppercase tracking-wider font-medium">
                        DDG
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tnum">{formatCr(v, { compact: true })}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-muted rounded-sm overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(v / max) * 100}%` }}
                        />
                      </div>
                      <span className="tnum text-xs text-muted-foreground w-12 text-right">
                        {share.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td
                    className={`px-4 py-3 text-right tnum text-xs ${
                      yoy.positive === true ? "text-conf-validated" : yoy.positive === false ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {yoy.text}
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
