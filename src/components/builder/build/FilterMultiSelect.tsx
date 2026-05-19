import { useMemo, useState } from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fmtCr } from "@/lib/report";

export interface FilterOption {
  value: string;
  label: string;
  group?: string;       // optional collapsible group
  total?: number;       // total value to display next to the label (₹ Cr)
  sublabel?: string;    // small text under the main label (e.g. "Code 31")
}

interface Props {
  label: string;        // shown on the trigger button
  options: FilterOption[];
  selected: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  /** Show totals beside each option for "discovery mode" */
  showTotals?: boolean;
}

export default function FilterMultiSelect({ label, options, selected, onChange, placeholder = "All", showTotals = true }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Group options
  const grouped = useMemo(() => {
    const m = new Map<string, FilterOption[]>();
    const filtered = query
      ? options.filter(o =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          (o.sublabel?.toLowerCase().includes(query.toLowerCase())))
      : options;
    for (const o of filtered) {
      const g = o.group ?? "";
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(o);
    }
    return Array.from(m.entries());
  }, [options, query]);

  // Trigger label
  const triggerText = selected.length === 0
    ? placeholder
    : selected.length === 1
    ? options.find(o => o.value === selected[0])?.label ?? selected[0]
    : `${selected.length} selected`;

  function toggle(value: string) {
    if (selected.includes(value)) onChange(selected.filter(v => v !== value));
    else onChange([...selected, value]);
  }
  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange([]);
  }
  function selectAll() {
    onChange(options.map(o => o.value));
  }

  return (
    <div>
      <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium block mb-1">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted/30 transition-colors"
          >
            <span className={`flex-1 text-left truncate ${selected.length ? "text-foreground" : "text-muted-foreground"}`}>
              {triggerText}
            </span>
            {selected.length > 0 && (
              <button onClick={clear} className="text-muted-foreground hover:text-destructive p-0.5 rounded" title="Clear">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[420px] p-0 max-h-[480px] flex flex-col">
          {/* Search */}
          <div className="px-3 py-2 border-b border-border flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="flex-1 text-sm bg-transparent border-0 focus:outline-none focus:ring-0"
            />
            <button onClick={selectAll} className="text-[11px] text-primary hover:underline">Select all</button>
          </div>

          {/* Options */}
          <div className="overflow-y-auto flex-1 py-1">
            {grouped.map(([g, items]) => (
              <div key={g || "__"}>
                {g && (
                  <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center justify-between">
                    <span>{g}</span>
                    {showTotals && (
                      <span className="text-foreground tabular-nums normal-case">
                        {fmtCr(items.reduce((s, i) => s + (i.total ?? 0), 0))}
                      </span>
                    )}
                  </div>
                )}
                {items.map(opt => {
                  const isSel = selected.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggle(opt.value)}
                      className={`w-full px-3 py-1.5 flex items-center gap-2 text-sm hover:bg-muted/40 text-left ${isSel ? "bg-primary/5" : ""}`}
                    >
                      <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0
                        ${isSel ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}>
                        {isSel && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{opt.label}</div>
                        {opt.sublabel && <div className="text-[10px] text-muted-foreground">{opt.sublabel}</div>}
                      </div>
                      {showTotals && opt.total != null && (
                        <div className="text-[11px] tabular-nums text-muted-foreground shrink-0">{fmtCr(opt.total)}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
            {grouped.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">No matches</div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-border flex items-center justify-between bg-muted/20">
            <span className="text-[11px] text-muted-foreground">
              {selected.length} selected · {options.length} total
            </span>
            <button onClick={() => { onChange([]); setQuery(""); }} className="text-[11px] text-muted-foreground hover:text-destructive">
              Clear
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
