import { useMemo, useState } from "react";
import { Info, ChevronDown, ChevronRight } from "lucide-react";
import { aggregateByObjectHead, ddgMinistries, fmtCr, TOPICS, YEAR_PLAIN } from "@/lib/report";
import { LMMH_OBJECT_HEADS } from "@/lib/lmmh";
import { type YearKey } from "@/lib/dg";

export default function WhereItGoesTab() {
  const [year, setYear] = useState<YearKey>("be2627");
  const [ministry, setMinistry] = useState<string>(""); // empty = all
  const [topicId, setTopicId] = useState<string>("");
  const [objectHeadFocus, setObjectHeadFocus] = useState<string>(""); // empty = show all
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  const ministries = useMemo(() => ddgMinistries(), []);

  const rawData = useMemo(() => aggregateByObjectHead(year, {
    ministry: ministry || undefined,
    topicId: topicId || undefined,
  }), [year, ministry, topicId]);

  // Optional: filter down to a single object head
  const data = useMemo(() => {
    if (!objectHeadFocus) return rawData;
    return rawData.filter(r => r.code === objectHeadFocus.padStart(2, "0"));
  }, [rawData, objectHeadFocus]);

  // Group by Object Class
  const byClass = useMemo(() => {
    const map = new Map<string, { items: typeof data; total: number }>();
    for (const row of data) {
      if (!map.has(row.objectClass)) map.set(row.objectClass, { items: [], total: 0 });
      const b = map.get(row.objectClass)!;
      b.items.push(row);
      b.total += row.value;
    }
    return Array.from(map, ([cls, b]) => ({ cls, ...b })).sort((a, b) => b.total - a.total);
  }, [data]);

  const grandTotal = data.reduce((s, r) => s + r.value, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/20 p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Money goes to people, things, or grants.</span>{" "}
          This view groups spending by what it's actually used for: salaries, subsidies, grants, capital works, etc.
          Based on the detailed budget (DDG) data — only covers ministries with detailed breakdowns published so far.
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Field label="Year">
          <select value={year} onChange={e => setYear(e.target.value as YearKey)} className={inputCls}>
            <option value="actuals2425">{YEAR_PLAIN.actuals2425.short}</option>
            <option value="be2526">{YEAR_PLAIN.be2526.short}</option>
            <option value="re2526">{YEAR_PLAIN.re2526.short}</option>
            <option value="be2627">{YEAR_PLAIN.be2627.short}</option>
          </select>
        </Field>
        <Field label="Filter by ministry">
          <select value={ministry} onChange={e => setMinistry(e.target.value)} className={inputCls}>
            <option value="">All ministries (with detailed data)</option>
            {ministries.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Filter by topic">
          <select value={topicId} onChange={e => setTopicId(e.target.value)} className={inputCls}>
            <option value="">All topics</option>
            {TOPICS.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
          </select>
        </Field>
        <Field label="Focus on one category">
          <select value={objectHeadFocus} onChange={e => setObjectHeadFocus(e.target.value)} className={inputCls}>
            <option value="">Show all categories</option>
            {Array.from(groupObjectHeadsByClass().entries()).map(([cls, items]) => (
              <optgroup key={cls} label={cls}>
                {items.map(o => <option key={o.code} value={o.code}>{o.name} ({o.code})</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
      </div>

      {/* Total */}
      <div className="rounded-lg border border-border bg-card px-5 py-4">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
          Total in this view · {YEAR_PLAIN[year].short}
        </div>
        <div className="text-2xl font-semibold tabular-nums mt-1">{fmtCr(grandTotal)}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          Across {data.length} different spending categories
        </div>
      </div>

      {/* Grouped breakdown */}
      <div className="space-y-3">
        {byClass.map(group => {
          const isOpen = expandedClass === group.cls;
          const pct = grandTotal ? (group.total / grandTotal) * 100 : 0;
          return (
            <div key={group.cls} className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedClass(isOpen ? null : group.cls)}
                className="w-full px-5 py-3 flex items-center gap-3 hover:bg-muted/20"
              >
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{group.cls}</div>
                  <div className="text-xs text-muted-foreground">{group.items.length} categories</div>
                </div>
                <div className="flex-1 h-3 bg-muted/40 rounded overflow-hidden">
                  <div className="h-full bg-primary/70" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <div className="w-32 text-right tabular-nums text-sm font-semibold">{fmtCr(group.total)}</div>
                <div className="w-14 text-right text-xs tabular-nums text-muted-foreground">{pct.toFixed(1)}%</div>
              </button>

              {isOpen && (
                <div className="border-t border-border divide-y divide-border">
                  {group.items.map(item => (
                    <div key={item.code} className="px-5 py-3 hover:bg-muted/10">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            Code {item.code} · {item.revOrCapital}
                          </div>
                        </div>
                        <div className="flex-1 h-2 bg-muted/40 rounded overflow-hidden">
                          <div className="h-full bg-primary/50" style={{ width: `${Math.min(100, item.share)}%` }} />
                        </div>
                        <div className="w-28 text-right tabular-nums text-sm font-medium">{fmtCr(item.value)}</div>
                        <div className="w-14 text-right text-xs tabular-nums text-muted-foreground">{item.share.toFixed(2)}%</div>
                      </div>
                      {item.topMinistries.length > 0 && (
                        <div className="mt-2 pl-2 text-xs text-muted-foreground">
                          <span className="font-medium">Top spenders:</span>{" "}
                          {item.topMinistries.slice(0, 3).map((m, i) => (
                            <span key={m.ministry}>
                              {i > 0 && " · "}
                              {m.ministry} ({fmtCr(m.value)})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No detailed (DDG) data available for the selected filter.
        </div>
      )}
    </div>
  );
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

function groupObjectHeadsByClass(): Map<string, typeof LMMH_OBJECT_HEADS> {
  const m = new Map<string, typeof LMMH_OBJECT_HEADS>();
  for (const o of LMMH_OBJECT_HEADS) {
    if (!m.has(o.objectClass)) m.set(o.objectClass, []);
    m.get(o.objectClass)!.push(o);
  }
  return m;
}
