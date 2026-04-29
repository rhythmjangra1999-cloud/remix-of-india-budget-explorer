import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { Ministry, Demand, DDGRow, FY } from "@/data/types";
import { formatCr } from "@/lib/format";
import { Breadcrumb, type Crumb } from "./Breadcrumb";
import { useChartTooltip } from "./useChartTooltip";

interface Props {
  ministries: Ministry[];
  demands: Demand[];
  ddgs: DDGRow[];
  fy: FY;
  totalBudget: number;
  selectedId?: string;
  /** Notify parent of the deepest selected ministry id (for the right detail panel). */
  onMinistryFocus?: (ministryId: string | null) => void;
}

type DrillNode = {
  id: string;
  name: string;
  /** Full label for breadcrumb / tooltip */
  fullName: string;
  value: number;
  /** Optional FY26 value for YoY tooltip on the same node */
  prevValue?: number;
  /** Children at next drill level */
  children?: DrillNode[];
  /** What level this node sits at (used for breadcrumbs). */
  level: "root" | "ministry" | "demand" | "major";
  /** Ministry id this node belongs to (helps detail panel sync). */
  ministryId?: string;
};

const COACH_KEY = "ibv.treemap.coach.dismissed.v1";

export function TreemapView({
  ministries,
  demands,
  ddgs,
  fy,
  totalBudget,
  onMinistryFocus,
}: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { containerRef, show, move, hide, Tooltip } = useChartTooltip();
  const [path, setPath] = useState<string[]>([]); // node ids from root
  const [coachDismissed, setCoachDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(COACH_KEY) === "1";
  });

  // Build the full hierarchy once per fy / data change.
  const tree = useMemo<DrillNode>(() => {
    const root: DrillNode = {
      id: "root",
      name: "Union Budget",
      fullName: "Union Budget",
      value: 0,
      level: "root",
      children: [],
    };

    for (const m of ministries) {
      const v = m.totals[fy] ?? 0;
      if (v <= 0) continue;
      const mDemands = demands.filter((d) => d.ministryId === m.id);
      const mNode: DrillNode = {
        id: `m:${m.id}`,
        name: m.short ?? m.name,
        fullName: m.name,
        value: v,
        prevValue: m.totals.FY26,
        level: "ministry",
        ministryId: m.id,
        children: [],
      };

      for (const d of mDemands) {
        const dv = d.amounts[fy] ?? 0;
        if (dv <= 0) continue;
        const dRows = ddgs.filter((r) => r.demandId === d.id);
        const dNode: DrillNode = {
          id: `d:${d.id}`,
          name: d.title,
          fullName: `D${d.number} · ${d.title}`,
          value: dv,
          prevValue: d.amounts.FY26,
          level: "demand",
          ministryId: m.id,
          children: [],
        };

        if (dRows.length) {
          const byMajor = d3.group(dRows, (r) => r.majorHead);
          for (const [major, rows] of byMajor) {
            const mv = rows.reduce((s, r) => s + (r.amounts[fy] ?? 0), 0);
            if (mv <= 0) continue;
            dNode.children!.push({
              id: `mh:${d.id}:${major}`,
              name: major,
              fullName: major,
              value: mv,
              prevValue: rows.reduce((s, r) => s + (r.amounts.FY26 ?? 0), 0),
              level: "major",
              ministryId: m.id,
            });
          }
          if (dNode.children!.length === 0) delete dNode.children;
        } else {
          delete dNode.children;
        }

        mNode.children!.push(dNode);
      }
      if (mNode.children!.length === 0) delete mNode.children;
      root.children!.push(mNode);
    }
    root.value = root.children!.reduce((s, c) => s + c.value, 0);
    return root;
  }, [ministries, demands, ddgs, fy]);

  // Resolve current node by walking the path from root.
  const { current, crumbs } = useMemo(() => {
    let node: DrillNode = tree;
    const cs: Crumb[] = [{ id: tree.id, label: "Union Budget", level: "root" }];
    for (const id of path) {
      const next = node.children?.find((c) => c.id === id);
      if (!next) break;
      node = next;
      cs.push({ id: node.id, label: node.fullName, level: node.level });
    }
    return { current: node, crumbs: cs };
  }, [tree, path]);

  // Tell parent which ministry is in focus (deepest crumb that has ministryId).
  useEffect(() => {
    const ministryCrumb = [...crumbs].reverse().find((c) => c.level !== "root");
    const m = ministryCrumb ? current.ministryId ?? null : null;
    onMinistryFocus?.(m);
  }, [current, crumbs, onMinistryFocus]);

  // Draw treemap of `current.children` (or just the current node if leaf).
  useEffect(() => {
    if (!wrapRef.current || !ref.current) return;

    const draw = () => {
      const wrap = wrapRef.current!;
      const width = wrap.clientWidth;
      const height = Math.max(460, wrap.clientHeight || 560);

      const svg = d3.select(ref.current);
      svg.selectAll("*").remove();
      svg.attr("viewBox", `0 0 ${width} ${height}`).attr("width", width).attr("height", height);

      const children = current.children ?? [];
      if (children.length === 0) {
        // Leaf state — show a centered "no further detail" panel.
        svg
          .append("text")
          .attr("x", width / 2)
          .attr("y", height / 2 - 8)
          .attr("text-anchor", "middle")
          .attr("font-family", "Source Serif 4, Georgia, serif")
          .attr("font-size", 18)
          .attr("fill", "hsl(var(--muted-foreground))")
          .text("Object-head detail pending");
        svg
          .append("text")
          .attr("x", width / 2)
          .attr("y", height / 2 + 16)
          .attr("text-anchor", "middle")
          .attr("font-family", "JetBrains Mono, monospace")
          .attr("font-size", 12)
          .attr("fill", "hsl(var(--muted-foreground))")
          .text(`${current.fullName} · ${formatCr(current.value)}`);
        return;
      }

      const root = d3
        .hierarchy<DrillNode>({
          ...current,
          children,
        })
        .sum((d) => (d.children && d.children.length ? 0 : d.value))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

      d3.treemap<DrillNode>().size([width, height]).paddingInner(2).round(true)(root);

      const max = d3.max(root.leaves(), (d) => d.value ?? 0) ?? 1;
      // Calmer warm sequential ramp — more muted than before so labels read first.
      const colorScale = d3
        .scaleSequential((t) =>
          d3.interpolateLab("hsl(38, 45%, 94%)", "hsl(20, 55%, 38%)")(Math.min(1, t)),
        )
        .domain([0, Math.sqrt(max)]);

      const node = svg
        .selectAll("g.cell")
        .data(root.leaves())
        .join("g")
        .attr("class", "cell")
        .attr("transform", (d: any) => `translate(${d.x0},${d.y0})`)
        .style("cursor", (d: any) =>
          d.data.children && d.data.children.length ? "zoom-in" : "pointer",
        )
        .on("click", (_, d: any) => {
          const data = d.data as DrillNode;
          if (data.children && data.children.length) {
            setPath((p) => [...p, data.id]);
          } else {
            // Deepest reachable — still notify parent of ministry focus.
            if (data.ministryId) onMinistryFocus?.(data.ministryId);
          }
        });

      node
        .append("rect")
        .attr("width", (d: any) => d.x1 - d.x0)
        .attr("height", (d: any) => d.y1 - d.y0)
        .attr("fill", (d: any) => colorScale(Math.sqrt(d.value)))
        .attr("stroke", "hsl(var(--background))")
        .attr("stroke-width", 1)
        .attr("rx", 1.5)
        .on("mouseenter", function (event, d: any) {
          d3.select(this).attr("opacity", 0.88);
          const data = d.data as DrillNode;
          const pct = ((data.value / Math.max(totalBudget, 1)) * 100).toFixed(2);
          let sub = `${pct}% of Union Budget`;
          if (data.prevValue && data.prevValue > 0) {
            const delta = ((data.value - data.prevValue) / data.prevValue) * 100;
            sub += ` · YoY ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
          }
          if (data.children?.length) sub += " · click to drill in";
          show(data.fullName, formatCr(data.value), sub, event);
        })
        .on("mousemove", (event) => move(event))
        .on("mouseleave", function () {
          d3.select(this).attr("opacity", 1);
          hide();
        });

      // Label: name (serif), amount (mono), share (small caps mono)
      node.each(function (d: any) {
        const data = d.data as DrillNode;
        const w = d.x1 - d.x0;
        const h = d.y1 - d.y0;
        if (w < 56 || h < 30) return;

        const g = d3.select(this);
        const sqRatio = Math.sqrt(d.value) / Math.sqrt(max);
        const dark = sqRatio > 0.55;
        const fgName = dark ? "hsl(40, 35%, 99%)" : "hsl(220, 25%, 12%)";
        const fgMeta = dark ? "hsl(40, 35%, 99% / 0.82)" : "hsl(220, 12%, 38%)";

        const nameSize = Math.min(18, Math.max(11, w / 12));
        const name = g
          .append("text")
          .attr("x", 8)
          .attr("y", 6 + nameSize)
          .attr("font-family", "Source Serif 4, Georgia, serif")
          .attr("font-size", nameSize)
          .attr("font-weight", 600)
          .attr("fill", fgName);

        const label = data.name ?? "";
        const maxChars = Math.max(3, Math.floor((w - 16) / (nameSize * 0.55)));
        name.text(label.length > maxChars ? label.slice(0, maxChars - 1) + "…" : label);

        // Amount on its own line if there's room.
        if (h > 56 && w > 80) {
          g.append("text")
            .attr("x", 8)
            .attr("y", 6 + nameSize + 18)
            .attr("font-family", "JetBrains Mono, ui-monospace, monospace")
            .attr("font-size", 11)
            .attr("fill", fgMeta)
            .text(formatCr(data.value, { compact: true }));
        }

        // % share — small caps style, bottom-left.
        if (h > 72 && w > 70) {
          const pct = (data.value / Math.max(totalBudget, 1)) * 100;
          g.append("text")
            .attr("x", 8)
            .attr("y", h - 8)
            .attr("font-family", "JetBrains Mono, ui-monospace, monospace")
            .attr("font-size", 10)
            .attr("letter-spacing", "0.08em")
            .attr("fill", fgMeta)
            .text(`${pct < 0.1 ? pct.toFixed(2) : pct.toFixed(1)}% OF UNION BUDGET`);
        }

        // Coachmark on the largest tile, root level only.
        if (
          !coachDismissed &&
          current.level === "root" &&
          d === root.leaves()[0] &&
          w > 160 &&
          h > 90
        ) {
          const tag = g
            .append("g")
            .attr("transform", `translate(${w - 10}, ${h - 28})`)
            .style("cursor", "pointer")
            .on("click", (ev) => {
              ev.stopPropagation();
              window.localStorage.setItem(COACH_KEY, "1");
              setCoachDismissed(true);
            });
          const text = "Click any tile to drill in →";
          const padX = 8;
          const padY = 5;
          const tw = text.length * 6.4;
          tag
            .append("rect")
            .attr("x", -tw - padX * 2)
            .attr("y", -padY * 2 - 8)
            .attr("width", tw + padX * 2)
            .attr("height", 22)
            .attr("rx", 3)
            .attr("fill", "hsl(var(--background))")
            .attr("stroke", "hsl(var(--border))");
          tag
            .append("text")
            .attr("x", -padX)
            .attr("y", -padY - 1)
            .attr("text-anchor", "end")
            .attr("font-family", "JetBrains Mono, monospace")
            .attr("font-size", 10)
            .attr("fill", "hsl(var(--foreground))")
            .text(text);
        }
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [current, totalBudget, coachDismissed, onMinistryFocus]);

  // Reset path if the active node disappears (e.g., FY change with no value).
  useEffect(() => {
    if (path.length === 0) return;
    let node: DrillNode | undefined = tree;
    for (const id of path) {
      node = node?.children?.find((c) => c.id === id);
      if (!node) {
        setPath([]);
        return;
      }
    }
  }, [tree, path]);

  const onJump = (index: number) => setPath(path.slice(0, index));

  const sharePct = (current.value / Math.max(totalBudget, 1)) * 100;

  return (
    <div className="space-y-3">
      {/* Breadcrumb + running total */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <Breadcrumb crumbs={crumbs} onJump={onJump} />
        <div className="text-xs text-muted-foreground tnum">
          You are looking at{" "}
          <span className="font-mono text-foreground">{formatCr(current.value)}</span>
          {current.level !== "root" && (
            <>
              {" "}· <span className="font-mono text-foreground">{sharePct.toFixed(2)}%</span>{" "}
              of the Union Budget
            </>
          )}
        </div>
      </div>

      <div ref={containerRef} className="relative w-full">
        <div
          ref={wrapRef}
          className="w-full h-[560px] rounded-sm border border-border bg-card overflow-hidden"
        >
          <svg ref={ref} className="block" />
        </div>
        <Tooltip />
      </div>

      <p className="text-xs text-muted-foreground">
        Tile area is proportional to {fy} outlay. Click any tile to drill in; use the breadcrumb to step back up.
      </p>
    </div>
  );
}
