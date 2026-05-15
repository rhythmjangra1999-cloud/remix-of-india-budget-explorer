import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import data from "@/data/union-4year.json";
import { formatCr } from "@/lib/format";
import { useChartTooltip } from "@/components/explorer/useChartTooltip";

type FY = "FY24" | "FY25" | "FY26" | "FY27";

const YEARS: FY[] = ["FY24", "FY25", "FY26", "FY27"];

interface Ministry {
  name: string;
  totals: Record<FY, number>;
  revenue: Record<FY, number>;
  capital: Record<FY, number>;
  demands: { name: string; totals: Record<FY, number> }[];
}

export function UnionBudget4Year() {
  const [fy, setFy] = useState<FY>("FY27");
  const [focus, setFocus] = useState<{ ministry: string; demand?: string } | null>(null);
  const ministries = data.ministries as Ministry[];
  const totals = data.totals as Record<FY, number>;
  const labels = data.yearLabels as Record<FY, string>;

  const prevIdx = YEARS.indexOf(fy) - 1;
  const prevFy = prevIdx >= 0 ? YEARS[prevIdx] : null;
  const yoy = prevFy ? ((totals[fy] - totals[prevFy]) / totals[prevFy]) * 100 : null;

  const top = useMemo(
    () =>
      [...ministries]
        .filter((m) => m.name.toLowerCase() !== "ministry of finance")
        .sort((a, b) => b.totals[fy] - a.totals[fy])
        .slice(0, 10),
    [ministries, fy]
  );
  const topMax = top[0]?.totals[fy] ?? 1;

  return (
    <section className="border-t border-border">
      <div className="container py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.16em] text-primary font-medium">
              Four years at a glance
            </div>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl font-semibold leading-tight">
              The Union Budget, FY 2023-24 → FY 2026-27
            </h2>
            <p className="mt-3 text-foreground/70 leading-relaxed">
              Every demand for grants across all ministries, rolled up into a single sunburst.
              Inner ring is the Union Budget, middle ring is each ministry, outer ring is each demand.
            </p>
          </div>
          <YearToggle fy={fy} onChange={setFy} labels={labels} />
        </div>

        <div className="grid gap-px bg-border rounded-sm overflow-hidden border border-border md:grid-cols-3 mb-10">
          <Stat label={`Total · ${labels[fy]}`} value={formatCr(totals[fy])} sub="net of receipts & recoveries" />
          <Stat
            label="YoY change"
            value={yoy == null ? "—" : `${yoy >= 0 ? "+" : ""}${yoy.toFixed(2)}%`}
            sub={prevFy ? `vs ${labels[prevFy]}` : "earliest year shown"}
          />
          <Stat label="Ministries" value={String(ministries.length)} sub={`${ministries.reduce((s, m) => s + m.demands.length, 0)} demands`} />
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            <SearchPicker ministries={ministries} fy={fy} focus={focus} onPick={setFocus} />
            <Sunburst ministries={ministries} fy={fy} totalBudget={totals[fy]} focus={focus} />
          </div>
          <TopMinistries top={top} fy={fy} max={topMax} totalBudget={totals[fy]} />
        </div>


        {/* Bottom metrics: YoY per year + 3-yr CAGR + others */}
        <BottomMetrics totals={totals} labels={labels} ministries={ministries} fy={fy} />

        <p className="mt-6 text-[11px] text-muted-foreground">
          Source: Union Budget Demands for Grants, Budget Estimates FY 2023-24 to FY 2026-27. Figures in ₹ Crores, net of receipts & recoveries.
        </p>
      </div>
    </section>
  );
}

function BottomMetrics({
  totals,
  labels,
  ministries,
  fy,
}: {
  totals: Record<FY, number>;
  labels: Record<FY, string>;
  ministries: Ministry[];
  fy: FY;
}) {
  // YoY for each transition
  const yoy = YEARS.slice(1).map((y, i) => {
    const prev = YEARS[i];
    const v = ((totals[y] - totals[prev]) / totals[prev]) * 100;
    return { from: prev, to: y, v };
  });
  // 3-yr CAGR FY24 → FY27
  const cagr = (Math.pow(totals.FY27 / totals.FY24, 1 / 3) - 1) * 100;
  const absGrowth = totals.FY27 - totals.FY24;
  const absGrowthPct = (absGrowth / totals.FY24) * 100;

  // Fastest-growing & largest-shrinking ministry by CAGR (FY24→FY27), filter small base
  const minBase = 1000; // ₹1000 Cr to avoid noise
  const movers = ministries
    .filter((m) => m.totals.FY24 >= minBase && m.totals.FY27 > 0)
    .map((m) => ({
      name: m.name.replace(/^Ministry of /, "").replace(/^Department of /, "Dept. of "),
      cagr: (Math.pow(m.totals.FY27 / m.totals.FY24, 1 / 3) - 1) * 100,
      delta: m.totals.FY27 - m.totals.FY24,
    }));
  const fastest = [...movers].sort((a, b) => b.cagr - a.cagr).slice(0, 1)[0];
  const slowest = [...movers].sort((a, b) => a.cagr - b.cagr).slice(0, 1)[0];

  // Selected-year share of top 5 ministries
  const sortedFy = [...ministries].sort((a, b) => b.totals[fy] - a.totals[fy]);
  const top5Share = (sortedFy.slice(0, 5).reduce((s, m) => s + m.totals[fy], 0) / totals[fy]) * 100;

  return (
    <div className="mt-10 space-y-4">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Growth metrics</div>

      {/* YoY strip */}
      <div className="grid gap-px bg-border rounded-sm overflow-hidden border border-border grid-cols-2 md:grid-cols-3">
        {yoy.map((r) => (
          <Metric
            key={r.to}
            label={`YoY · ${r.to.replace("FY", "FY ")}`}
            value={`${r.v >= 0 ? "+" : ""}${r.v.toFixed(2)}%`}
            tone={r.v >= 0 ? "pos" : "neg"}
            sub={`${labels[r.from]} → ${labels[r.to]}`}
          />
        ))}
      </div>

      {/* CAGR + share strip */}
      <div className="grid gap-px bg-border rounded-sm overflow-hidden border border-border grid-cols-2 md:grid-cols-4">
        <Metric
          label="3-yr CAGR"
          value={`${cagr >= 0 ? "+" : ""}${cagr.toFixed(2)}%`}
          tone={cagr >= 0 ? "pos" : "neg"}
          sub="FY24 → FY27 compounded"
        />
        <Metric
          label="Absolute growth"
          value={`${absGrowth >= 0 ? "+" : ""}${formatCr(absGrowth, { compact: true })}`}
          sub={`${absGrowthPct >= 0 ? "+" : ""}${absGrowthPct.toFixed(1)}% over 3 yrs`}
        />
        <Metric
          label={`Top 5 share · ${fy.replace("FY", "FY ")}`}
          value={`${top5Share.toFixed(1)}%`}
          sub="of Union Budget"
        />
        <Metric
          label="Concentration"
          value={`${sortedFy.length} ministries`}
          sub={`largest: ${sortedFy[0].name.replace(/^Ministry of /, "")}`}
        />
      </div>

      {/* Fastest / slowest movers */}
      <div className="grid gap-px bg-border rounded-sm overflow-hidden border border-border grid-cols-1 md:grid-cols-2">
        {fastest && (
          <Metric
            label="Fastest-growing ministry"
            value={`${fastest.cagr >= 0 ? "+" : ""}${fastest.cagr.toFixed(1)}% CAGR`}
            tone="pos"
            sub={`${fastest.name} · +${formatCr(fastest.delta, { compact: true })} since FY24`}
          />
        )}
        {slowest && (
          <Metric
            label={slowest.cagr < 0 ? "Largest contraction" : "Slowest-growing ministry"}
            value={`${slowest.cagr >= 0 ? "+" : ""}${slowest.cagr.toFixed(1)}% CAGR`}
            tone={slowest.cagr < 0 ? "neg" : undefined}
            sub={`${slowest.name} · ${slowest.delta >= 0 ? "+" : ""}${formatCr(slowest.delta, { compact: true })} since FY24`}
          />
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">
        CAGR computed on Budget Estimates FY24 → FY27 (3 years). Movers exclude ministries with FY24 base under ₹1,000 Cr.
      </p>
    </div>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "pos" | "neg" }) {
  const toneCls = tone === "pos" ? "text-emerald-700" : tone === "neg" ? "text-rose-700" : "text-foreground";
  return (
    <div className="bg-card p-4">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={`mt-1.5 font-serif text-xl font-semibold tnum ${toneCls}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{sub}</div>}
    </div>
  );
}


function YearToggle({ fy, onChange, labels }: { fy: FY; onChange: (fy: FY) => void; labels: Record<FY, string> }) {
  return (
    <div className="inline-flex rounded-sm border border-border bg-card p-1">
      {YEARS.map((y) => {
        const active = y === fy;
        return (
          <button
            key={y}
            onClick={() => onChange(y)}
            className={`px-3 py-1.5 text-xs font-mono rounded-sm transition-colors ${
              active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
            title={labels[y]}
          >
            {y.replace("FY", "FY ")}
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card p-5">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-serif text-2xl md:text-3xl font-semibold tnum">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

interface SBProps {
  ministries: Ministry[];
  fy: FY;
  totalBudget: number;
  focus?: { ministry: string; demand?: string } | null;
}

function Sunburst({ ministries, fy, totalBudget, focus }: SBProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { containerRef, show, move, hide, Tooltip } = useChartTooltip();

  const root = useMemo(() => {
    const filtered = focus
      ? ministries.filter((m) => m.name === focus.ministry)
      : ministries;
    return {
      name: focus ? focus.ministry : "Union Budget",
      children: filtered
        .filter((m) => (m.totals[fy] ?? 0) > 0)
        .map((m) => ({
          name: m.name,
          value: m.totals[fy],
          children: m.demands
            .filter((d) => (d.totals[fy] ?? 0) > 0)
            .map((d) => ({
              name: d.name,
              value: d.totals[fy],
              isFocus: focus?.demand === d.name,
            })),
        })),
    };
  }, [ministries, fy, focus]);


  useEffect(() => {
    if (!wrapRef.current) return;
    const draw = () => {
      const w = wrapRef.current!.clientWidth;
      const size = Math.min(w, 560);
      const radius = size / 2;
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg.attr("viewBox", `${-radius} ${-radius} ${size} ${size}`).attr("width", size).attr("height", size);

      const hier = d3
        .hierarchy(root)
        .sum((d: any) => (d.children ? 0 : d.value ?? 0))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

      d3.partition().size([2 * Math.PI, radius])(hier as any);

      const arc = d3
        .arc<any>()
        .startAngle((d) => d.x0)
        .endAngle((d) => d.x1)
        .padAngle(0.004)
        .innerRadius((d) => d.y0)
        .outerRadius((d) => d.y1 - 1);

      const max = d3.max(hier.descendants().filter((d) => d.depth === 1), (d) => d.value ?? 0) ?? 1;
      const color = (d: any) => {
        if (d.depth === 0) return "transparent";
        const root = d.ancestors().find((n: any) => n.depth === 1);
        const t = Math.sqrt((root?.value ?? 0) / max);
        const lighten = d.depth === 1 ? 0 : d.depth === 2 ? 18 : 32;
        const base = d3.interpolateLab("hsl(35,55%,90%)", "hsl(15,70%,28%)")(Math.min(1, t * 1.15));
        return `color-mix(in oklab, ${base}, white ${lighten}%)`;
      };

      svg
        .selectAll("path")
        .data(hier.descendants().filter((d) => d.depth > 0))
        .join("path")
        .attr("d", arc as any)
        .attr("fill", color)
        .attr("stroke", (d: any) => d.data?.isFocus ? "hsl(var(--foreground))" : "hsl(var(--background))")
        .attr("stroke-width", (d: any) => d.data?.isFocus ? 2 : 0.75)
        .style("cursor", "default")
        .on("mouseenter", (event, d: any) => {
          const trail = d.ancestors().reverse().slice(1).map((n: any) => n.data.name).join(" › ");
          const pct = totalBudget > 0 ? ((d.value / totalBudget) * 100).toFixed(2) : "—";
          show(trail || d.data.name, formatCr(d.value), `${pct}% of Union Budget`, event);
        })
        .on("mousemove", (event) => move(event))
        .on("mouseleave", () => hide());

      svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", -6)
        .attr("font-family", "Source Serif 4, Georgia, serif")
        .attr("font-size", 13)
        .attr("fill", "hsl(var(--foreground))")
        .text("Union Budget");
      svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", 12)
        .attr("font-family", "JetBrains Mono")
        .attr("font-size", 11)
        .attr("fill", "hsl(var(--muted-foreground))")
        .text(formatCr(totalBudget, { compact: true }));
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [root, totalBudget]);

  return (
    <div ref={containerRef} className="relative w-full">
      <div ref={wrapRef} className="w-full rounded-sm border border-border bg-card p-6 flex justify-center">
        <svg ref={svgRef} className="block" />
      </div>
      <Tooltip />
    </div>
  );
}

function TopMinistries({
  top,
  fy,
  max,
  totalBudget,
}: {
  top: Ministry[];
  fy: FY;
  max: number;
  totalBudget: number;
}) {
  return (
    <div className="rounded-sm border border-border bg-card p-5">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        Top 10 ministries · {fy.replace("FY", "FY ")}
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">Excludes Ministry of Finance</div>
      <ul className="mt-4 space-y-3">
        {top.map((m, i) => {
          const total = m.totals[fy];
          const rev = m.revenue[fy];
          const cap = m.capital[fy];
          const wTotal = (total / max) * 100;
          const wRev = total > 0 ? (rev / total) * wTotal : 0;
          const pct = totalBudget > 0 ? (total / totalBudget) * 100 : 0;
          return (
            <li key={m.name}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="font-mono text-[10px] text-muted-foreground tnum">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate font-medium">{m.name.replace(/^Ministry of /, "")}</span>
                </div>
                <span className="font-mono tnum text-[11px] shrink-0">
                  {formatCr(total, { compact: true })}
                </span>
              </div>
              <div className="mt-1 flex h-1.5 w-full overflow-hidden rounded-sm bg-muted">
                <div className="h-full bg-primary/80" style={{ width: `${wRev}%` }} title={`Revenue ${formatCr(rev)}`} />
                <div className="h-full bg-primary/30" style={{ width: `${wTotal - wRev}%` }} title={`Capital ${formatCr(cap)}`} />
              </div>
              <div className="mt-0.5 text-[10px] text-muted-foreground tnum">
                {pct.toFixed(2)}% of Union Budget
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-sm bg-primary/80" /> Revenue</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-sm bg-primary/30" /> Capital</span>
      </div>
    </div>
  );
}

// ── Search picker ────────────────────────────────────────────────────────────
type PickResult = { ministry: string; demand?: string };

function SearchPicker({
  ministries,
  fy,
  focus,
  onPick,
}: {
  ministries: Ministry[];
  fy: FY;
  focus: PickResult | null;
  onPick: (p: PickResult | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const matches = useMemo(() => {
    const lq = q.trim().toLowerCase();
    type Row = { kind: "ministry" | "demand"; ministry: string; demand?: string; value: number };
    const rows: Row[] = [];
    for (const m of ministries) {
      const mHit = !lq || m.name.toLowerCase().includes(lq);
      if (mHit) rows.push({ kind: "ministry", ministry: m.name, value: m.totals[fy] });
      for (const d of m.demands) {
        if (!lq || d.name.toLowerCase().includes(lq) || m.name.toLowerCase().includes(lq)) {
          rows.push({ kind: "demand", ministry: m.name, demand: d.name, value: d.totals[fy] });
        }
      }
    }
    return rows.sort((a, b) => b.value - a.value).slice(0, 40);
  }, [ministries, q, fy]);

  const label = focus
    ? focus.demand
      ? `${focus.ministry.replace(/^Ministry of /, "")} · ${focus.demand}`
      : focus.ministry
    : "Search ministries or demands…";

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2">
        <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground shrink-0">Focus</span>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex-1 text-left text-xs truncate ${focus ? "text-foreground font-medium" : "text-muted-foreground"}`}
        >
          {label}
        </button>
        {focus && (
          <button
            onClick={() => {
              onPick(null);
              setQ("");
            }}
            className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded-sm hover:bg-muted"
            title="Clear focus"
          >
            Clear
          </button>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-muted-foreground hover:text-foreground text-xs"
          aria-label="Toggle"
        >
          ▾
        </button>
      </div>
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-sm border border-border bg-card shadow-lg">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type to filter ministries or demands…"
              className="w-full px-2 py-1.5 text-xs rounded-sm border border-input bg-background"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {matches.length === 0 && (
              <li className="px-3 py-2 text-xs text-muted-foreground">No matches.</li>
            )}
            {matches.map((r, i) => (
              <li key={i}>
                <button
                  onClick={() => {
                    onPick({ ministry: r.ministry, demand: r.demand });
                    setOpen(false);
                  }}
                  className="w-full flex items-baseline justify-between gap-3 px-3 py-1.5 text-left hover:bg-muted/60 transition-colors"
                >
                  <span className="flex items-baseline gap-2 min-w-0">
                    <span
                      className={`text-[9px] uppercase tracking-wider font-mono shrink-0 ${
                        r.kind === "ministry" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {r.kind === "ministry" ? "MIN" : "DEM"}
                    </span>
                    <span className="text-xs truncate">
                      {r.kind === "ministry"
                        ? r.ministry
                        : `${r.ministry.replace(/^Ministry of /, "")} · ${r.demand}`}
                    </span>
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0 tnum">
                    {formatCr(r.value, { compact: true })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
