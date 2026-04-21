import { useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal, sankeyLeft } from "d3-sankey";
import type { Ministry, Transfer } from "@/data/types";
import { formatCr } from "@/lib/format";

interface Props {
  ministries: Ministry[];
  transfers: Transfer[];
}

export function SankeyView({ ministries, transfers }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, { name: string; type: string }>();
    const ensure = (name: string, type: string) => {
      if (!nodeMap.has(name)) nodeMap.set(name, { name, type });
    };
    ensure("Centre", "centre");
    const valid = transfers.filter((t) => t.amount > 0);
    valid.forEach((t) => {
      const m = ministries.find((mm) => mm.id === t.ministryId);
      const mName = m?.short ?? m?.name ?? t.ministryId;
      ensure(mName, "ministry");
      const target = t.state ?? "Unallocated";
      ensure(target, t.unknown ? "unknown" : "state");
    });
    const list = Array.from(nodeMap.values());
    const idx = new Map(list.map((n, i) => [n.name, i]));
    const linkArr: { source: number; target: number; value: number; unknown?: boolean }[] = [];
    valid.forEach((t) => {
      const m = ministries.find((mm) => mm.id === t.ministryId);
      const mName = m?.short ?? m?.name ?? t.ministryId;
      const target = t.state ?? "Unallocated";
      linkArr.push({ source: idx.get("Centre")!, target: idx.get(mName)!, value: t.amount });
      linkArr.push({ source: idx.get(mName)!, target: idx.get(target)!, value: t.amount, unknown: t.unknown });
    });
    return { nodes: list, links: linkArr };
  }, [ministries, transfers]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const draw = () => {
      const width = wrapRef.current!.clientWidth;
      const height = Math.max(520, nodes.length * 18);
      const svg = d3.select(ref.current);
      svg.selectAll("*").remove();
      svg.attr("viewBox", `0 0 ${width} ${height}`).attr("width", width).attr("height", height);

      const sankeyGen = sankey<any, any>()
        .nodeWidth(14)
        .nodePadding(10)
        .nodeAlign(sankeyLeft)
        .extent([
          [10, 10],
          [width - 160, height - 10],
        ]);

      const graph = sankeyGen({
        nodes: nodes.map((d) => ({ ...d })),
        links: links.map((d) => ({ ...d })),
      });

      const colorFor = (type: string) => {
        if (type === "centre") return "hsl(220 25% 12%)";
        if (type === "ministry") return "hsl(22 75% 45%)";
        if (type === "unknown") return "hsl(0 55% 50%)";
        return "hsl(195 45% 35%)";
      };

      svg
        .append("g")
        .attr("fill", "none")
        .selectAll("path")
        .data(graph.links)
        .join("path")
        .attr("d", sankeyLinkHorizontal())
        .attr("stroke", (d: any) => (d.unknown ? "hsl(0 55% 50%)" : "hsl(220 25% 12%)"))
        .attr("stroke-opacity", (d: any) => (d.unknown ? 0.18 : 0.12))
        .attr("stroke-width", (d: any) => Math.max(1, d.width))
        .append("title")
        .text((d: any) => `${d.source.name} → ${d.target.name}\n${formatCr(d.value)}${d.unknown ? "  (state-wise undisclosed)" : ""}`);

      const nodeG = svg
        .append("g")
        .selectAll("g")
        .data(graph.nodes)
        .join("g");

      nodeG
        .append("rect")
        .attr("x", (d: any) => d.x0)
        .attr("y", (d: any) => d.y0)
        .attr("height", (d: any) => Math.max(1, d.y1 - d.y0))
        .attr("width", (d: any) => d.x1 - d.x0)
        .attr("fill", (d: any) => colorFor(d.type))
        .append("title")
        .text((d: any) => `${d.name}\n${formatCr(d.value)}`);

      nodeG
        .append("text")
        .attr("x", (d: any) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
        .attr("y", (d: any) => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", (d: any) => (d.x0 < width / 2 ? "start" : "end"))
        .attr("font-family", "Inter, system-ui, sans-serif")
        .attr("font-size", 11)
        .attr("fill", "hsl(var(--foreground))")
        .text((d: any) => d.name);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [nodes, links]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <Legend swatch="hsl(220 25% 12%)" label="Centre" />
        <Legend swatch="hsl(22 75% 45%)" label="Ministry" />
        <Legend swatch="hsl(195 45% 35%)" label="State / UT" />
        <Legend swatch="hsl(0 55% 50%)" label="Unallocated (state-wise undisclosed)" />
      </div>
      <div ref={wrapRef} className="w-full rounded-sm border border-border bg-card overflow-x-auto">
        <svg ref={ref} className="block" />
      </div>
      <p className="text-xs text-muted-foreground italic">
        Note: For many large schemes (MGNREGS, PM-KISAN, PMAY) state-wise allocations
        are not disclosed in budget documents. These flow into a single "Unallocated"
        node and are flagged in red.
      </p>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-3.5 rounded-sm" style={{ background: swatch }} />
      {label}
    </span>
  );
}
