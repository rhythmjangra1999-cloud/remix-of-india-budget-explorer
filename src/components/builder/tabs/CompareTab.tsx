import { useMemo, useState } from "react";
import { Plus, Trash2, Info, Download } from "lucide-react";
import { DG_SUMMARY, getMinistries, getMinistryTotal, type YearKey } from "@/lib/dg";
import { TOPICS, aggregateTopic, fmtCr, fmtPctChange, yoy, YEAR_PLAIN, PREV_YEAR } from "@/lib/report";

// ─── A "compare item" is a thing we want to put on the chart ────────────────
type ItemKind = "topic" | "ministry" | "total-budget";

interface CompareItem {
  id: string;
  kind: ItemKind;
  refId: string; // topic id or ministry name
  year: YearKey;
}

function newItem(partial: Partial<CompareItem> = {}): CompareItem {
  return {
    id: Math.random().toString(36).slice(2, 9),
    kind: "topic",
    refId: TOPICS[0].id,
    year: "be2627",
    ...partial,
  };
}

function labelOf(item: CompareItem): string {
  if (item.kind === "topic") {
    const t = TOPICS.find(t => t.id === item.refId);
    return t ? `${t.emoji} ${t.name}` : item.refId;
  }
  if (item.kind === "ministry") return item.refId;
  return "Whole Union Budget";
}

function valueOf(item: CompareItem): number | null {
  if (item.kind === "topic") {
    const t = TOPICS.find(t => t.id === item.refId);
    if (!t) return null;
    return aggregateTopic(t, item.year).byYear[item.year];
  }
  if (item.kind === "ministry") {
    return getMinistryTotal(item.refId, item.year, "total");
  }
  return DG_SUMMARY.reduce((s, d) => s + (d[item.year].total ?? 0), 0);
}

export default function CompareTab() {
  const ministries = useMemo(() => getMinistries(), []);

  const [items, setItems] = useState<CompareItem[]>(() => [
    newItem({ kind: "topic", refId: "education", year: "be2627" }),
    newItem({ kind: "topic", refId: "health",    year: "be2627" }),
    newItem({ kind: "topic", refId: "defence",   year: "be2627" }),
  ]);

  function update(id: string, patch: Partial<CompareItem>) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  }
  function remove(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }
  function add() {
    setItems(prev => [...prev, newItem()]);
  }

  const computed = items.map(i => {
    const v = valueOf(i);
    const prevY = PREV_YEAR[i.year];
    const prevV = prevY ? valueOfWithYear(i, prevY) : null;
    return { item: i, value: v, prevValue: prevV, yoy: yoy(v, prevV), prevY };
  });

  const maxAbs = Math.max(0, ...computed.map(c => Math.abs(c.value ?? 0)));

  function exportCSV() {
    const head = ["#", "What", "Year", "Value (INR Cr)", "Previous year value", "Change %"];
    const lines = [head.join(",")];
    computed.forEach((c, idx) => {
      lines.push([
        idx + 1,
        `"${labelOf(c.item)}"`,
        YEAR_PLAIN[c.item.year].short,
        c.value?.toFixed(2) ?? "",
        c.prevValue?.toFixed(2) ?? "",
        c.yoy?.toFixed(2) ?? "",
      ].join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "budget-compare.csv";
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/20 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Pick anything to compare.</span>{" "}
          Topics like "Education", specific ministries, or the whole union budget. Different years are allowed too — useful for headlines like <em>"Education BE 2026-27 vs Defence Actuals 2024-25"</em>.
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={item.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">{idx + 1}</div>
              </div>
              {items.length > 1 && (
                <button onClick={() => remove(item.id)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="What to compare">
                <select
                  value={item.kind}
                  onChange={e => {
                    const k = e.target.value as ItemKind;
                    update(item.id, {
                      kind: k,
                      refId: k === "topic" ? TOPICS[0].id : k === "ministry" ? ministries[0] : "total",
                    });
                  }}
                  className={inputCls}
                >
                  <option value="topic">A topic (e.g. Education)</option>
                  <option value="ministry">A ministry / department</option>
                  <option value="total-budget">Whole Union Budget</option>
                </select>
              </Field>

              {item.kind !== "total-budget" && (
                <Field label={item.kind === "topic" ? "Which topic" : "Which ministry"}>
                  <select
                    value={item.refId}
                    onChange={e => update(item.id, { refId: e.target.value })}
                    className={inputCls}
                  >
                    {item.kind === "topic"
                      ? TOPICS.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)
                      : ministries.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
              )}

              <Field label="Year">
                <select
                  value={item.year}
                  onChange={e => update(item.id, { year: e.target.value as YearKey })}
                  className={inputCls}
                >
                  <option value="actuals2425">{YEAR_PLAIN.actuals2425.short}</option>
                  <option value="be2526">{YEAR_PLAIN.be2526.short}</option>
                  <option value="re2526">{YEAR_PLAIN.re2526.short}</option>
                  <option value="be2627">{YEAR_PLAIN.be2627.short}</option>
                </select>
              </Field>
            </div>
          </div>
        ))}

        <button
          onClick={add}
          className="w-full rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 px-4 py-3 text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add another item to compare
        </button>
      </div>

      {/* Visual + table */}
      {computed.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <div className="text-sm font-medium">Comparison</div>
            <button onClick={exportCSV} className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" /> Download CSV
            </button>
          </div>

          {/* Bar chart */}
          <div className="px-5 py-4 space-y-2">
            {computed.map(c => {
              const w = c.value != null && maxAbs ? (Math.abs(c.value) / maxAbs) * 100 : 0;
              return (
                <div key={c.item.id} className="flex items-center gap-3 text-sm">
                  <div className="w-56 min-w-0 truncate" title={labelOf(c.item)}>
                    <div className="font-medium truncate">{labelOf(c.item)}</div>
                    <div className="text-[11px] text-muted-foreground">{YEAR_PLAIN[c.item.year].short}</div>
                  </div>
                  <div className="flex-1 h-8 bg-muted/30 rounded relative overflow-hidden">
                    <div className="h-full bg-primary/70 rounded" style={{ width: `${w}%` }} />
                    <div className="absolute inset-0 flex items-center px-2 text-xs font-medium tabular-nums">
                      {fmtCr(c.value)}
                    </div>
                  </div>
                  <div className={`w-20 text-right tabular-nums text-xs ${(c.yoy ?? 0) > 0 ? "text-emerald-600" : (c.yoy ?? 0) < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {fmtPctChange(c.yoy)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pairwise ratios */}
          {computed.length === 2 && computed[0].value && computed[1].value && (
            <div className="px-5 py-3 border-t border-border bg-muted/10">
              <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">Headline-ready ratios</div>
              <div className="text-sm">
                <strong>{labelOf(computed[0].item)}</strong> is{" "}
                <span className="font-semibold tabular-nums">
                  {(computed[0].value! / computed[1].value!).toFixed(2)}×
                </span>{" "}
                of <strong>{labelOf(computed[1].item)}</strong>.
                {" "}Difference: <span className="font-semibold tabular-nums">{fmtCr(computed[0].value! - computed[1].value!)}</span>.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function valueOfWithYear(item: CompareItem, year: YearKey): number | null {
  return valueOf({ ...item, year });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium block mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full text-sm rounded-md border border-input bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring";
