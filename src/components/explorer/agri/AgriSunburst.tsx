import { useMemo, useState } from "react";
import * as d3 from "d3";
import { HierNode } from "@/lib/agri";
import { formatCr } from "@/lib/format";

interface Props {
  root: HierNode;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  size?: number;
}

interface Arc {
  node: HierNode;
  depth: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

// A 3-ring sunburst: Major (innermost) → Minor → Sub-Head.
// Click a ring to focus the table; click center to clear.
export function AgriSunburst({ root, selectedKey, onSelect, size = 520 }: Props) {
  const [hover, setHover] = useState<HierNode | null>(null);
  const radius = size / 2;

  const arcs = useMemo<Arc[]>(() => {
    // Build a d3 partition limited to 3 levels (major, minor, sub)
    const h = d3
      .hierarchy<HierNode>(root, (d) =>
        d.level === "sub" ? undefined : d.children
      )
      .sum((d) => (d.children && d.children.length ? 0 : d.value));

    const partition = d3.partition<HierNode>().size([2 * Math.PI, radius]);
    const tree = partition(h);

    const out: Arc[] = [];
    tree.each((n) => {
      if (n.depth === 0 || n.depth > 3) return;
      out.push({
        node: n.data,
        depth: n.depth,
        x0: n.x0,
        x1: n.x1,
        y0: n.y0,
        y1: n.y1,
      });
    });
    return out;
  }, [root, radius]);

  const arcGen = d3
    .arc<Arc>()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .padAngle(0.003)
    .padRadius(radius / 2)
    .innerRadius((d) => d.y0)
    .outerRadius((d) => d.y1 - 1);

  // color by major head, with depth-driven lightness
  const majorColor = useMemo(() => {
    const majors = root.children?.map((c) => c.key) ?? [];
    const palette = [
      "hsl(24 70% 50%)",  // primary-ish
      "hsl(200 60% 45%)",
      "hsl(140 45% 40%)",
      "hsl(280 40% 50%)",
      "hsl(45 75% 50%)",
      "hsl(0 60% 50%)",
      "hsl(180 50% 40%)",
      "hsl(320 45% 50%)",
      "hsl(90 40% 40%)",
      "hsl(240 40% 50%)",
      "hsl(60 60% 45%)",
      "hsl(160 45% 40%)",
    ];
    const m = new Map<string, string>();
    majors.forEach((k, i) => m.set(k, palette[i % palette.length]));
    return m;
  }, [root]);

  function fillFor(arc: Arc): string {
    const majorKey = arc.node.key.split(".")[0];
    const base = majorColor.get(majorKey) ?? "hsl(0 0% 50%)";
    const lightness = arc.depth === 1 ? 0 : arc.depth === 2 ? 12 : 22;
    return `color-mix(in oklab, ${base}, white ${lightness}%)`;
  }

  const focused = hover ?? (selectedKey ? findNode(root, selectedKey) : null);

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`${-radius} ${-radius} ${size} ${size}`}
        className="select-none"
      >
        {arcs.map((arc) => {
          const isSelected = selectedKey && arc.node.key === selectedKey;
          const isAncestor =
            selectedKey && selectedKey.startsWith(arc.node.key + ".");
          const dim = selectedKey && !isSelected && !isAncestor && !selectedKey.startsWith(arc.node.key);
          return (
            <path
              key={arc.node.key}
              d={arcGen(arc) ?? undefined}
              fill={fillFor(arc)}
              opacity={dim ? 0.25 : 1}
              stroke="hsl(var(--background))"
              strokeWidth={isSelected ? 2 : 0.5}
              onMouseEnter={() => setHover(arc.node)}
              onMouseLeave={() => setHover(null)}
              onClick={() =>
                onSelect(arc.node.key === selectedKey ? null : arc.node.key)
              }
              className="cursor-pointer transition-opacity"
            />
          );
        })}
        {/* Center label */}
        <circle r={70} fill="hsl(var(--background))" onClick={() => onSelect(null)} className="cursor-pointer" />
        <text textAnchor="middle" dy="-6" className="fill-muted-foreground text-[9px] uppercase tracking-widest">
          {focused ? labelLevel(focused) : "Total"}
        </text>
        <text textAnchor="middle" dy="12" className="fill-foreground font-serif text-[15px] font-semibold tnum">
          {formatCr(focused ? focused.value : root.value, { compact: true })}
        </text>
        <text textAnchor="middle" dy="28" className="fill-muted-foreground text-[9px]">
          {focused
            ? truncate(focused.name, 28)
            : `${root.children?.length ?? 0} major heads`}
        </text>
      </svg>
      <div className="mt-2 text-[11px] text-muted-foreground text-center max-w-md">
        Click a ring to filter the table. Center clears. Inner = Major Head, middle = Minor Head, outer = Sub-Head.
      </div>
    </div>
  );
}

function labelLevel(n: HierNode): string {
  return n.level === "major" ? "Major Head" : n.level === "minor" ? "Minor Head" : "Sub-Head";
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function findNode(root: HierNode, key: string): HierNode | null {
  if (root.key === key) return root;
  if (!root.children) return null;
  for (const c of root.children) {
    const f = findNode(c, key);
    if (f) return f;
  }
  return null;
}
