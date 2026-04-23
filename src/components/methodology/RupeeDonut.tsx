import { useMemo, useState } from "react";
import * as d3 from "d3";
import flow from "@/data/budget-flow.json";

const RAMP = ["ramp-6", "ramp-5", "ramp-4", "ramp-3", "ramp-2", "ramp-1", "accent", "primary", "muted"];

export function RupeeDonut() {
  const data = flow.rupeeSpent;
  const [active, setActive] = useState<string | null>(null);

  const arcs = useMemo(() => {
    const pie = d3.pie<typeof data[number]>().value((d) => d.paise).sort(null);
    const arc = d3
      .arc<d3.PieArcDatum<typeof data[number]>>()
      .innerRadius(95)
      .outerRadius(160)
      .padAngle(0.008)
      .cornerRadius(2);
    return pie(data).map((d, i) => ({
      d,
      path: arc(d) ?? "",
      color: RAMP[i % RAMP.length],
    }));
  }, [data]);

  const activeItem = active ? data.find((d) => d.id === active) : null;

  return (
    <div className="grid md:grid-cols-2 gap-8 items-center">
      <div className="flex justify-center">
        <svg viewBox="-180 -180 360 360" className="w-full max-w-[340px] h-auto">
          {arcs.map(({ d, path, color }) => (
            <path
              key={d.data.id}
              d={path}
              fill={`hsl(var(--${color}))`}
              opacity={!active || active === d.data.id ? 1 : 0.35}
              onMouseEnter={() => setActive(d.data.id)}
              onMouseLeave={() => setActive(null)}
              className="cursor-pointer transition-opacity"
              stroke="hsl(var(--background))"
              strokeWidth={1}
            />
          ))}
          <text
            textAnchor="middle"
            y={-6}
            className="fill-muted-foreground"
            style={{ fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.16em" }}
          >
            EVERY ₹1 SPENT
          </text>
          <text
            textAnchor="middle"
            y={18}
            className="fill-foreground"
            style={{ fontSize: 28, fontFamily: "var(--font-serif)", fontWeight: 600 }}
          >
            {activeItem ? `${activeItem.paise}p` : "₹1"}
          </text>
          <text
            textAnchor="middle"
            y={36}
            className="fill-muted-foreground"
            style={{ fontSize: 10, fontFamily: "var(--font-sans)" }}
          >
            {activeItem ? "of every rupee" : "FY26 budget"}
          </text>
        </svg>
      </div>

      <div>
        <ul className="space-y-2">
          {data.map((d, i) => (
            <li
              key={d.id}
              onMouseEnter={() => setActive(d.id)}
              onMouseLeave={() => setActive(null)}
              className={`flex items-start gap-3 py-2 px-3 rounded-sm cursor-default border transition-colors ${
                active === d.id ? "border-primary/40 bg-muted/40" : "border-transparent"
              }`}
            >
              <span
                className="mt-1.5 w-3 h-3 rounded-sm shrink-0"
                style={{ background: `hsl(var(--${RAMP[i % RAMP.length]}))` }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-sm font-medium">{d.label}</span>
                  <span className="font-mono text-sm tabular-nums text-foreground/80">
                    {d.paise}<span className="text-muted-foreground">p</span>
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{d.takeaway}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
