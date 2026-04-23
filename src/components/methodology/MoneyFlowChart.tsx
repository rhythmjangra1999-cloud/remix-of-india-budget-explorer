import { useId } from "react";

/**
 * Horizontal SVG flow diagram of how money moves from sources → pooled → allocated → spent → delivered.
 * Each column is a clickable group that scroll-jumps to the matching anchor section.
 */

interface FlowNode {
  id: string;
  label: string;
  jumpTo?: string;
}

interface FlowColumn {
  id: string;
  title: string;
  nodes: FlowNode[];
  jumpTo?: string;
}

const COLUMNS: FlowColumn[] = [
  {
    id: "sources",
    title: "Sources of money",
    jumpTo: "sec-a",
    nodes: [
      { id: "income", label: "Income Tax" },
      { id: "gst", label: "GST (Centre)" },
      { id: "corp", label: "Corporate Tax" },
      { id: "customs", label: "Customs / Excise" },
      { id: "borrow", label: "Borrowings" },
      { id: "nontax", label: "Non-tax (dividend, spectrum, fees)" },
    ],
  },
  {
    id: "pooled",
    title: "Pooled",
    jumpTo: "sec-b",
    nodes: [
      { id: "cfi", label: "Consolidated Fund of India" },
      { id: "cf", label: "Contingency Fund" },
      { id: "pa", label: "Public Account" },
    ],
  },
  {
    id: "allocated",
    title: "Allocated via Union Budget",
    jumpTo: "sec-c",
    nodes: [
      { id: "min", label: "Ministries (102)" },
      { id: "dept", label: "Departments & autonomous bodies" },
      { id: "fc", label: "Statutory share to States (FC)" },
    ],
  },
  {
    id: "spent",
    title: "Spent by",
    jumpTo: "sec-g",
    nodes: [
      { id: "cs", label: "Central schemes" },
      { id: "css", label: "CSS (shared with States)" },
      { id: "salpen", label: "Salaries / Pensions" },
      { id: "capex", label: "Capital works" },
      { id: "subs", label: "Subsidies" },
    ],
  },
  {
    id: "delivered",
    title: "Delivered to",
    jumpTo: "sec-f",
    nodes: [
      { id: "citizens", label: "Citizens" },
      { id: "states", label: "States / UTs" },
      { id: "districts", label: "Districts" },
      { id: "front", label: "Frontline staff" },
    ],
  },
];

export function MoneyFlowChart() {
  const gradId = useId();

  const handleJump = (anchor?: string) => {
    if (!anchor) return;
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="w-full overflow-x-auto -mx-6 px-6 py-8 paper rounded-sm border border-border bg-card">
      <svg
        viewBox="0 0 1240 460"
        className="w-full min-w-[980px] h-auto"
        role="img"
        aria-labelledby="flow-title"
      >
        <title id="flow-title">How money moves: from sources, through the budget, to delivery.</title>
        <defs>
          <linearGradient id={gradId} x1="0" x2="1">
            <stop offset="0%" stopColor="hsl(var(--ramp-2))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--ramp-4))" stopOpacity="0.9" />
          </linearGradient>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="hsl(var(--muted-foreground))" />
          </marker>
        </defs>

        {/* Connector arrows between columns */}
        {COLUMNS.slice(0, -1).map((_, i) => {
          const x1 = 60 + i * 240 + 180;
          const x2 = 60 + (i + 1) * 240;
          const y = 230;
          return (
            <line
              key={i}
              x1={x1}
              y1={y}
              x2={x2 - 6}
              y2={y}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="1.5"
              opacity="0.5"
              markerEnd="url(#arrow)"
            />
          );
        })}

        {COLUMNS.map((col, ci) => {
          const x = 60 + ci * 240;
          return (
            <g
              key={col.id}
              onClick={() => handleJump(col.jumpTo)}
              className="cursor-pointer group"
            >
              {/* Column title */}
              <text
                x={x + 90}
                y={30}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                {col.title.toUpperCase()}
              </text>
              <line
                x1={x + 10}
                y1={42}
                x2={x + 170}
                y2={42}
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />

              {/* Nodes */}
              {col.nodes.map((node, ni) => {
                const totalH = col.nodes.length * 50;
                const startY = 230 - totalH / 2 + 12;
                const ny = startY + ni * 50;
                return (
                  <g key={node.id}>
                    <rect
                      x={x}
                      y={ny}
                      width={180}
                      height={38}
                      rx={4}
                      fill={ci === 1 || ci === 2 ? `url(#${gradId})` : "hsl(var(--card))"}
                      stroke="hsl(var(--border))"
                      strokeWidth="1"
                      className="group-hover:stroke-primary transition-colors"
                    />
                    <text
                      x={x + 90}
                      y={ny + 22}
                      textAnchor="middle"
                      className="fill-foreground"
                      style={{
                        fontSize: 12,
                        fontFamily: "var(--font-serif)",
                      }}
                    >
                      {node.label.length > 28 ? node.label.slice(0, 26) + "…" : node.label}
                    </text>
                  </g>
                );
              })}

              {/* Click hint */}
              <text
                x={x + 90}
                y={440}
                textAnchor="middle"
                className="fill-primary opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              >
                ↓ jump to section
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
