import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import type { Ministry, Demand, DDGRow, FY } from "@/data/types";
import { formatCr } from "@/lib/format";

interface Props {
  ministries: Ministry[];
  demands: Demand[];
  ddgs: DDGRow[];
  fy: FY;
  onSelect: (ministryId: string) => void;
}

export function SunburstView({ ministries, demands, ddgs, fy, onSelect }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const root = useMemo(() => {
    const tree: any = { name: "Union Budget", children: [] };
    for (const m of ministries) {
      const total = m.totals[fy] ?? 0;
      if (!total) continue;
      const mDems = demands.filter((d) => d.ministryId === m.id);
      const node: any = { name: m.short ?? m.name, id: m.id, value: total };
      if (mDems.length) {
        node.children = mDems.map((d) => {
          const dnode: any = { name: `D${d.number}`, value: d.amounts[fy] ?? 0 };
          const rows = ddgs.filter((r) => r.demandId === d.id);
          // group by major head
          const byMajor = d3.group(rows, (r) => r.majorHead);
          if (byMajor.size) {
            dnode.children = Array.from(byMajor, ([k, rs]) => ({
              name: k.length > 30 ? k.slice(0, 27) + "…" : k,
              value: rs.reduce((s, r) => s + (r.amounts[fy] ?? 0), 0),
            }));
          }
          return dnode;
        });
      }
      tree.children.push(node);
    }
    return tree;
  }, [ministries, demands, ddgs, fy]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const draw = () => {
      const w = wrapRef.current!.clientWidth;
      const size = Math.min(w, 520);
      const radius = size / 2;

      const svg = d3.select(ref.current);
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
        .padAngle(0.005)
        .innerRadius((d) => d.y0)
        .outerRadius((d) => d.y1 - 1);

      const max = d3.max(hier.leaves(), (d) => d.value ?? 0) ?? 1;
      const color = (d: any) => {
        const t = Math.sqrt((d.value ?? 0) / max);
        return d3.interpolateLab("hsl(35,55%,92%)", "hsl(15,70%,25%)")(Math.min(1, t * 1.2));
      };

      svg
        .selectAll("path")
        .data(hier.descendants().filter((d) => d.depth > 0))
        .join("path")
        .attr("d", arc as any)
        .attr("fill", color)
        .attr("stroke", "hsl(var(--background))")
        .attr("stroke-width", 1)
        .style("cursor", (d) => (d.depth === 1 ? "pointer" : "default"))
        .on("click", (_, d: any) => {
          if (d.depth === 1) onSelect(d.data.id);
        })
        .append("title")
        .text((d: any) => `${d.ancestors().reverse().map((n: any) => n.data.name).join(" › ")}\n${formatCr(d.value)}`);

      svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", -4)
        .attr("font-family", "Source Serif 4, Georgia, serif")
        .attr("font-size", 14)
        .attr("fill", "hsl(var(--foreground))")
        .text("Union Budget");

      svg
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", 14)
        .attr("font-family", "JetBrains Mono")
        .attr("font-size", 11)
        .attr("fill", "hsl(var(--muted-foreground))")
        .text(formatCr(hier.value ?? 0, { compact: true }));
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [root, onSelect]);

  return (
    <div ref={wrapRef} className="w-full rounded-sm border border-border bg-card p-6 flex justify-center">
      <svg ref={ref} className="block" />
    </div>
  );
}
