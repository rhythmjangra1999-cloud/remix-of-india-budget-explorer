import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import type { Ministry } from "@/data/types";
import { formatCr } from "@/lib/format";

interface Props {
  ministries: Ministry[];
  fy: "FY26" | "FY27";
  onSelect: (ministryId: string) => void;
  selectedId?: string;
}

export function TreemapView({ ministries, fy, onSelect, selectedId }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const data = useMemo(
    () => ministries.filter((m) => (m.totals[fy] ?? 0) > 0),
    [ministries, fy],
  );

  useEffect(() => {
    const svg = d3.select(ref.current);
    if (!svg.node() || !wrapRef.current) return;

    const draw = () => {
      const wrap = wrapRef.current!;
      const width = wrap.clientWidth;
      const height = Math.max(420, wrap.clientHeight || 520);

      svg.selectAll("*").remove();
      svg.attr("viewBox", `0 0 ${width} ${height}`).attr("width", width).attr("height", height);

      const root = d3
        .hierarchy<{ name: string; children?: any[]; value?: number; id?: string }>({
          name: "Union Budget",
          children: data.map((m) => ({
            name: m.short ?? m.name,
            value: m.totals[fy] ?? 0,
            id: m.id,
          })),
        })
        .sum((d) => d.value ?? 0)
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

      d3.treemap().size([width, height]).paddingInner(2).round(true)(root as any);

      const max = d3.max(root.leaves(), (d) => d.value ?? 0) ?? 1;
      const colorScale = d3
        .scaleSequential((t) => d3.interpolateLab("hsl(35,55%,92%)", "hsl(15,70%,25%)")(t))
        .domain([0, Math.sqrt(max)]);

      const node = svg
        .selectAll("g.cell")
        .data(root.leaves())
        .join("g")
        .attr("class", "cell")
        .attr("transform", (d: any) => `translate(${d.x0},${d.y0})`)
        .style("cursor", "pointer")
        .on("click", (_, d: any) => onSelect(d.data.id));

      node
        .append("rect")
        .attr("width", (d: any) => d.x1 - d.x0)
        .attr("height", (d: any) => d.y1 - d.y0)
        .attr("fill", (d: any) => colorScale(Math.sqrt(d.value)))
        .attr("stroke", (d: any) => (d.data.id === selectedId ? "hsl(22 75% 45%)" : "hsl(var(--background))"))
        .attr("stroke-width", (d: any) => (d.data.id === selectedId ? 3 : 1))
        .on("mouseenter", function () {
          d3.select(this).attr("opacity", 0.85);
        })
        .on("mouseleave", function () {
          d3.select(this).attr("opacity", 1);
        });

      node.append("title").text((d: any) => `${d.data.name}\n${formatCr(d.value)}`);

      node
        .append("text")
        .attr("x", 8)
        .attr("y", 18)
        .attr("font-family", "Source Serif 4, Georgia, serif")
        .attr("font-size", (d: any) => Math.min(18, Math.max(10, (d.x1 - d.x0) / 10)))
        .attr("font-weight", 600)
        .attr("fill", (d: any) => (Math.sqrt(d.value) / Math.sqrt(max) > 0.55 ? "hsl(40 35% 99%)" : "hsl(220 25% 12%)"))
        .each(function (d: any) {
          const w = d.x1 - d.x0;
          const h = d.y1 - d.y0;
          if (w < 60 || h < 28) {
            d3.select(this).remove();
            return;
          }
          const txt = d3.select(this);
          const name = d.data.name as string;
          txt.text(name.length * 7 > w - 16 ? name.slice(0, Math.max(3, Math.floor((w - 16) / 7))) + "…" : name);
        });

      node
        .append("text")
        .attr("x", 8)
        .attr("y", 36)
        .attr("font-family", "JetBrains Mono, ui-monospace, monospace")
        .attr("font-size", 11)
        .attr("fill", (d: any) =>
          Math.sqrt(d.value) / Math.sqrt(max) > 0.55 ? "hsl(40 35% 99% / 0.85)" : "hsl(220 12% 42%)",
        )
        .text((d: any) => {
          const w = d.x1 - d.x0;
          const h = d.y1 - d.y0;
          if (w < 80 || h < 50) return "";
          return formatCr(d.value, { compact: true });
        });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [data, fy, onSelect, selectedId]);

  return (
    <div ref={wrapRef} className="w-full h-[520px] rounded-sm border border-border bg-card overflow-hidden">
      <svg ref={ref} className="block" />
    </div>
  );
}
