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
          <Sunburst ministries={ministries} fy={fy} totalBudget={totals[fy]} />
          <TopMinistries top={top} fy={fy} max={topMax} totalBudget={totals[fy]} />
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground">
          Source: Union Budget Demands for Grants, Budget Estimates FY 2023-24 to FY 2026-27. Figures in ₹ Crores, net of receipts & recoveries.
        </p>
      </div>
    </section>
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
}

function Sunburst({ ministries, fy, totalBudget }: SBProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { containerRef, show, move, hide, Tooltip } = useChartTooltip();

  const root = useMemo(() => {
    return {
      name: "Union Budget",
      children: ministries
        .filter((m) => (m.totals[fy] ?? 0) > 0)
        .map((m) => ({
          name: m.name,
          value: m.totals[fy],
          children: m.demands
            .filter((d) => (d.totals[fy] ?? 0) > 0)
            .map((d) => ({ name: d.name, value: d.totals[fy] })),
        })),
    };
  }, [ministries, fy]);

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
        .attr("stroke", "hsl(var(--background))")
        .attr("stroke-width", 0.75)
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
