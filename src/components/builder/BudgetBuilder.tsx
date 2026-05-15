import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { Download, Link2, RotateCcw, Save, Trash2 } from "lucide-react";
import {
  DEFAULT_CONFIG, decodeConfig, encodeConfig, groupByOptions, measureOptions,
  ministriesFor, runQuery, toCSV, type BuilderConfig, type Dataset, type Measure, type ViewKind, type Row,
} from "@/lib/builder/query";
import { YEAR_LABELS, formatCrore, type YearKey } from "@/lib/dg";
import presets from "@/data/builder-presets.json";

const DATASETS: { key: Dataset; label: string; hint: string }[] = [
  { key: "ministries", label: "Ministries",  hint: "All 56 union ministries (FY27 totals)" },
  { key: "demands",    label: "Demands",     hint: "DG-level Revenue/Capital figures" },
  { key: "majorHeads", label: "Major Heads", hint: "4-digit functional codes across demands" },
  { key: "schemes",    label: "Schemes",     hint: "Centrally Sponsored / Sector schemes" },
];

const VIEWS: { key: ViewKind; label: string }[] = [
  { key: "table", label: "Table" },
  { key: "bar",   label: "Bar" },
];

interface Props {
  embedded?: boolean;
  defaults?: Partial<BuilderConfig>;
}

const SAVED_KEY = "budget-builder-saved";

export function BudgetBuilder({ embedded, defaults }: Props) {
  const [params, setParams] = useSearchParams();
  const initial = useMemo<BuilderConfig>(() => {
    const enc = params.get("b");
    if (enc) {
      const dec = decodeConfig(enc);
      if (dec) return dec;
    }
    return { ...DEFAULT_CONFIG, ...defaults };
  }, []); // eslint-disable-line
  const [cfg, setCfg] = useState<BuilderConfig>(initial);
  const [saved, setSaved] = useState<{ name: string; config: BuilderConfig }[]>(() => {
    try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
  });

  const update = <K extends keyof BuilderConfig>(k: K, v: BuilderConfig[K]) =>
    setCfg(c => ({ ...c, [k]: v }));

  // when dataset changes, reset groupBy/measure to first valid
  useEffect(() => {
    const groups = groupByOptions(cfg.dataset).map(g => g.key);
    const measures = measureOptions(cfg.dataset).map(m => m.key);
    setCfg(c => ({
      ...c,
      groupBy: groups.includes(c.groupBy) ? c.groupBy : groups[0],
      measure: measures.includes(c.measure) ? c.measure : measures[0],
    }));
  }, [cfg.dataset]);

  const rows = useMemo(() => runQuery(cfg), [cfg]);
  const isPct = cfg.measure === "yoy" || cfg.measure === "share" || cfg.measure === "capitalShare";

  const fmt = (v: number) => isPct ? `${v.toFixed(1)}%` : formatCrore(v, true);

  const ministriesAvail = useMemo(() => ministriesFor(cfg.dataset), [cfg.dataset]);
  const groupOpts = groupByOptions(cfg.dataset);
  const measureOpts = measureOptions(cfg.dataset);

  const reset = () => setCfg({ ...DEFAULT_CONFIG, ...defaults });

  const copyLink = async () => {
    const enc = encodeConfig(cfg);
    const url = `${window.location.origin}${window.location.pathname}?b=${enc}`;
    await navigator.clipboard.writeText(url);
    setParams(p => { const n = new URLSearchParams(p); n.set("b", enc); return n; }, { replace: true });
  };

  const exportCSV = () => {
    const blob = new Blob([toCSV(rows, cfg)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `analysis-${cfg.dataset}-${cfg.measure}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const saveAnalysis = () => {
    const name = prompt("Name this analysis:");
    if (!name) return;
    const next = [...saved, { name, config: cfg }];
    setSaved(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  };
  const removeSaved = (i: number) => {
    const next = saved.filter((_, idx) => idx !== i);
    setSaved(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  };

  const toggleMin = (name: string) => {
    const has = cfg.ministries.includes(name);
    update("ministries", has ? cfg.ministries.filter(n => n !== name) : [...cfg.ministries, name]);
  };

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h2 className="font-serif text-2xl font-semibold">Budget Analysis Builder</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a dataset, slice it by any dimension, and visualise. Inspired by Oracle's Financial Analysis subject-area model.
          </p>
        </div>
      )}

      {/* Presets + saved */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="uppercase tracking-wider text-muted-foreground">Presets:</span>
        {(presets as { name: string; config: BuilderConfig }[]).map(p => (
          <button key={p.name} onClick={() => setCfg(p.config)}
            className="rounded-sm border border-border px-2 py-1 hover:bg-muted">
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* ── Side panel ─────────────────────────────────────────────── */}
        <aside className="space-y-4 rounded-md border border-border bg-card p-4 text-sm">
          <Section title="1. Dataset">
            <div className="grid grid-cols-2 gap-1">
              {DATASETS.map(d => (
                <button key={d.key} onClick={() => update("dataset", d.key)}
                  className={`rounded-sm border px-2 py-1.5 text-left text-xs ${cfg.dataset === d.key ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"}`}>
                  {d.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{DATASETS.find(d => d.key === cfg.dataset)?.hint}</p>
          </Section>

          <Section title="2. Group by">
            <select value={cfg.groupBy} onChange={e => update("groupBy", e.target.value)}
              className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs">
              {groupOpts.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </Section>

          <Section title="3. Measure">
            <select value={cfg.measure} onChange={e => update("measure", e.target.value as Measure)}
              className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs">
              {measureOpts.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </Section>

          <Section title="4. Year">
            <select value={cfg.year} onChange={e => update("year", e.target.value as YearKey)}
              className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs">
              {Object.entries(YEAR_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <label className="mt-2 block text-[11px] text-muted-foreground">Compare to</label>
            <select value={cfg.compareYear ?? ""} onChange={e => update("compareYear", (e.target.value || undefined) as YearKey | undefined)}
              className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs">
              <option value="">— none —</option>
              {Object.entries(YEAR_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Section>

          <Section title="5. Filters">
            {(cfg.dataset === "demands" || cfg.dataset === "majorHeads") && (
              <div className="mb-2">
                <label className="text-[11px] text-muted-foreground">Section</label>
                <div className="mt-1 grid grid-cols-3 gap-1 text-[11px]">
                  {(["all","revenue","capital"] as const).map(s => (
                    <button key={s} onClick={() => update("section", s)}
                      className={`rounded-sm border px-1.5 py-1 ${cfg.section === s ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"}`}>
                      {s[0].toUpperCase()+s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {cfg.dataset === "majorHeads" && (
              <div className="mb-2">
                <label className="text-[11px] text-muted-foreground">MH code prefix (e.g. 2401)</label>
                <input value={cfg.mhPrefix} onChange={e => update("mhPrefix", e.target.value)}
                  className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs font-mono" placeholder="2401" />
              </div>
            )}
            {cfg.dataset === "schemes" && (
              <div className="mb-2">
                <label className="text-[11px] text-muted-foreground">Scheme name search</label>
                <input value={cfg.schemeQ} onChange={e => update("schemeQ", e.target.value)}
                  className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs" placeholder="PM-KISAN" />
              </div>
            )}
            <div className="mb-2 grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-muted-foreground">Min (INR Cr)</label>
                <input type="number" value={cfg.minAmount ?? ""} onChange={e => update("minAmount", e.target.value ? +e.target.value : undefined)}
                  className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs tnum" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">Max (INR Cr)</label>
                <input type="number" value={cfg.maxAmount ?? ""} onChange={e => update("maxAmount", e.target.value ? +e.target.value : undefined)}
                  className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs tnum" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">
                Ministries ({cfg.ministries.length || "all"})
              </label>
              <div className="mt-1 max-h-40 overflow-y-auto rounded-sm border border-border bg-background p-1.5">
                {ministriesAvail.map(name => (
                  <label key={name} className="flex items-center gap-1.5 px-1 py-0.5 text-[11px] hover:bg-muted rounded-sm cursor-pointer">
                    <input type="checkbox" checked={cfg.ministries.includes(name)} onChange={() => toggleMin(name)} />
                    <span className="truncate">{name}</span>
                  </label>
                ))}
              </div>
              {cfg.ministries.length > 0 && (
                <button onClick={() => update("ministries", [])} className="mt-1 text-[10px] text-muted-foreground hover:text-foreground">
                  Clear ministry filter
                </button>
              )}
            </div>
          </Section>

          <Section title="6. View">
            <div className="grid grid-cols-2 gap-1 mb-2">
              {VIEWS.map(v => (
                <button key={v.key} onClick={() => update("view", v.key)}
                  className={`rounded-sm border px-2 py-1.5 text-xs ${cfg.view === v.key ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"}`}>
                  {v.label}
                </button>
              ))}
            </div>
            <label className="text-[11px] text-muted-foreground">Top N</label>
            <input type="number" value={cfg.topN} onChange={e => update("topN", +e.target.value || 0)}
              className="mt-1 w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs tnum" />
          </Section>

          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            <button onClick={reset} className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1.5 text-xs hover:bg-muted">
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
            <button onClick={saveAnalysis} className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1.5 text-xs hover:bg-muted">
              <Save className="h-3 w-3" /> Save
            </button>
            <button onClick={copyLink} className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1.5 text-xs hover:bg-muted">
              <Link2 className="h-3 w-3" /> Copy link
            </button>
            <button onClick={exportCSV} className="inline-flex items-center gap-1 rounded-sm bg-primary text-primary-foreground px-2 py-1.5 text-xs hover:bg-primary/90">
              <Download className="h-3 w-3" /> CSV
            </button>
          </div>

          {saved.length > 0 && (
            <div className="border-t border-border pt-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">My analyses</div>
              <ul className="space-y-1">
                {saved.map((s, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-xs">
                    <button onClick={() => setCfg(s.config)} className="truncate text-left hover:text-primary">{s.name}</button>
                    <button onClick={() => removeSaved(i)} className="text-muted-foreground hover:text-rose-700"><Trash2 className="h-3 w-3" /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* ── Result ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted-foreground">
            <div>
              <span className="font-medium text-foreground">{rows.length}</span> rows ·{" "}
              <span className="font-medium text-foreground">{measureOpts.find(m => m.key === cfg.measure)?.label}</span> ·{" "}
              <span className="font-medium text-foreground">{YEAR_LABELS[cfg.year]}</span>
            </div>
            <button onClick={() => update("sortDir", cfg.sortDir === "desc" ? "asc" : "desc")}
              className="rounded-sm border border-border px-2 py-1 hover:bg-muted">
              Sort: {cfg.sortDir === "desc" ? "High → Low" : "Low → High"}
            </button>
          </div>

          {cfg.view === "bar" ? (
            <ResultBar rows={rows} fmt={fmt} />
          ) : (
            <ResultTable rows={rows} cfg={cfg} fmt={fmt} />
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{title}</div>
      {children}
    </div>
  );
}

function ResultBar({ rows, fmt }: { rows: Row[]; fmt: (v: number) => string }) {
  if (rows.length === 0) return <Empty />;
  const data = rows.map(r => ({ name: r.label.length > 28 ? r.label.slice(0, 28) + "…" : r.label, value: r.value }));
  const height = Math.max(280, rows.length * 28);
  return (
    <div className="rounded-md border border-border bg-card p-3" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} interval={0} />
          <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
          <Bar dataKey="value">
            {data.map((d, i) => (
              <Cell key={i} fill={d.value < 0 ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ResultTable({ rows, cfg, fmt }: { rows: Row[]; cfg: BuilderConfig; fmt: (v: number) => string }) {
  if (rows.length === 0) return <Empty />;
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left px-3 py-2 font-medium">#</th>
            <th className="text-left px-3 py-2 font-medium">Label</th>
            <th className="text-right px-3 py-2 font-medium">Value</th>
            {cfg.compareYear && <th className="text-right px-3 py-2 font-medium">Compare</th>}
            <th className="text-right px-3 py-2 font-medium">YoY</th>
            <th className="text-right px-3 py-2 font-medium">Share</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={r.key} className="hover:bg-muted/30">
              <td className="px-3 py-2 text-xs text-muted-foreground">{i + 1}</td>
              <td className="px-3 py-2">
                <div className="font-medium">{r.label}</div>
                {r.sub && <div className="text-[11px] text-muted-foreground">{r.sub}</div>}
              </td>
              <td className="px-3 py-2 text-right tnum font-semibold">{fmt(r.value)}</td>
              {cfg.compareYear && <td className="px-3 py-2 text-right tnum text-muted-foreground">{formatCrore(r.compare ?? 0, true)}</td>}
              <td className="px-3 py-2 text-right tnum">
                {r.yoy === null || r.yoy === undefined ? <span className="text-muted-foreground">—</span> :
                  <span className={r.yoy >= 0 ? "text-emerald-700" : "text-rose-700"}>{r.yoy >= 0 ? "+" : ""}{r.yoy.toFixed(1)}%</span>}
              </td>
              <td className="px-3 py-2 text-right tnum text-muted-foreground">{r.share?.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty() {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/20 p-12 text-center text-sm text-muted-foreground">
      No rows match these filters. Loosen them or pick a different dataset.
    </div>
  );
}
