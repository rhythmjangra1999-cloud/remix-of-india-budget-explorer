import { useMemo, useState } from "react";
import { Search, Download, ArrowUp, ArrowDown } from "lucide-react";
import {
  type MajorHeadRow,
  computeYoY,
  getMHStatus,
} from "@/lib/agri";

type SortKey = "mhCode" | "mhName" | "section" | "actuals2425" | "be2526" | "re2526" | "be2627" | "yoy";

function YoYPill({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground tnum text-xs">—</span>;
  const pos = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[11px] tnum font-mono ${
        pos
          ? "bg-green-500/10 text-green-700 dark:text-green-400"
          : "bg-red-500/10 text-red-700 dark:text-red-400"
      }`}
    >
      {pos ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function StatusPill({ status }: { status: ReturnType<typeof getMHStatus> }) {
  if (!status || status === "SMALL_BASE") return null;
  const styles: Record<string, string> = {
    DISCONTINUED: "bg-red-500/15 text-red-700 dark:text-red-400",
    NEW: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${styles[status]}`}>
      {status.replace("_", " ").toLowerCase()}
    </span>
  );
}

const fmt = (v: number | null) =>
  v == null ? "—" : v.toLocaleString("en-IN", { maximumFractionDigits: v < 100 ? 2 : 0 });

export function MajorHeadTable({ rows }: { rows: MajorHeadRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("be2627");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState("");

  const sorted = useMemo(() => {
    let list = rows;
    if (filter.trim()) {
      const lf = filter.toLowerCase();
      list = list.filter((r) => r.mhName.toLowerCase().includes(lf) || r.mhCode.includes(lf));
    }
    return [...list].sort((a, b) => {
      let av: string | number = 0;
      let bv: string | number = 0;
      if (sortKey === "mhCode" || sortKey === "mhName" || sortKey === "section") {
        av = a[sortKey]; bv = b[sortKey];
      } else if (sortKey === "yoy") {
        av = computeYoY(a.be2627, a.be2526) ?? -Infinity;
        bv = computeYoY(b.be2627, b.be2526) ?? -Infinity;
      } else {
        av = a[sortKey] ?? -Infinity;
        bv = b[sortKey] ?? -Infinity;
      }
      if (typeof av === "string") {
        return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [rows, filter, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(k === "mhCode" || k === "mhName" || k === "section" ? "asc" : "desc");
    }
  };

  const exportCsv = () => {
    const hdr = "MH Code,MH Name,Section,Actuals 24-25,BE 25-26,RE 25-26,BE 26-27,YoY%,Status\n";
    const body = sorted
      .map((r) => {
        const yoy = computeYoY(r.be2627, r.be2526);
        const status = getMHStatus(r) ?? "";
        return `"${r.mhCode}","${r.mhName.replace(/"/g, '""')}","${r.section}",${r.actuals2425 ?? ""},${
          r.be2526 ?? ""
        },${r.re2526 ?? ""},${r.be2627 ?? ""},${yoy !== null ? yoy.toFixed(1) + "%" : ""},${status}`;
      })
      .join("\n");
    const blob = new Blob([hdr + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "agri-major-heads.csv";
    a.click();
  };

  const Th = ({ label, k, right }: { label: string; k: SortKey; right?: boolean }) => (
    <th
      onClick={() => toggleSort(k)}
      className={`px-3 py-2 text-[10px] uppercase tracking-wider font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground ${
        right ? "text-right" : "text-left"
      }`}
    >
      <span className={`inline-flex items-center gap-1 ${right ? "justify-end w-full" : ""}`}>
        {label}
        {sortKey === k && (sortDir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
      </span>
    </th>
  );

  return (
    <div className="rounded-sm border border-border bg-card">
      <div className="flex flex-wrap items-center gap-3 p-3 border-b border-border">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter heads…"
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-input bg-background"
          />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{sorted.length} heads · INR Cr</span>
      </div>

      <div className="overflow-auto max-h-[640px]">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 sticky top-0">
            <tr>
              <Th label="Code" k="mhCode" />
              <Th label="Major Head" k="mhName" />
              <Th label="Section" k="section" />
              <Th label="Actuals 24-25" k="actuals2425" right />
              <Th label="BE 25-26" k="be2526" right />
              <Th label="RE 25-26" k="re2526" right />
              <Th label="BE 26-27" k="be2627" right />
              <Th label="YoY %" k="yoy" right />
              <th className="px-3 py-2 text-[10px] uppercase tracking-wider font-medium text-muted-foreground text-left">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((r, i) => {
              const yoy = computeYoY(r.be2627, r.be2526);
              const status = getMHStatus(r);
              return (
                <tr key={`${r.mhCode}-${r.section}-${i}`} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{r.mhCode}</td>
                  <td className="px-3 py-2">{r.mhName}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                        r.section === "Revenue"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {r.section}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs tnum">{fmt(r.actuals2425)}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs tnum">{fmt(r.be2526)}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs tnum">{fmt(r.re2526)}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs tnum font-semibold">{fmt(r.be2627)}</td>
                  <td className="px-3 py-2 text-right">
                    <YoYPill value={yoy} />
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill status={status} />
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-xs text-muted-foreground">
                  No major heads match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
