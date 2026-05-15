import { Link } from "react-router-dom";
import {
  Layers, Building2, Boxes, Package, MapPin, Target,
  Clock, PieChart, BarChart3, AlertTriangle, Users, Scale, ArrowRight, CheckCircle2, Circle,
} from "lucide-react";

type Status = "live" | "partial" | "planned";

interface Layer {
  n: number;
  id: string;
  title: string;
  question: string;
  icon: typeof Layers;
  status: Status;
  bullets: string[];
  surfaces: { label: string; href?: string }[];
  gap?: string;
}

const LAYERS: Layer[] = [
  {
    n: 1, id: "macro", icon: Layers, status: "live",
    title: "Macro Context",
    question: "How big is agri in the Union Budget, and how is it changing?",
    bullets: [
      "Agri share of total Union Budget (BE 26-27 vs 4-yr trend)",
      "Revenue vs Capital split, Voted vs Charged",
      "Net of recoveries — gross vs effective spend",
      "Compare with allied ministries (Fisheries/AHD, Food Processing, Rural Dev, Fertiliser subsidy in Chemicals)",
      "Macro ratios — Agri spend / GVA-Agri, per-farmer outlay",
    ],
    surfaces: [
      { label: "Home · Union Budget 4-Year", href: "/" },
      { label: "Explorer · Treemap", href: "/explorer" },
    ],
  },
  {
    n: 2, id: "ministry", icon: Building2, status: "live",
    title: "Ministry & Demand Structure (DG)",
    question: "Who spends, and on what mandate?",
    bullets: [
      "DAFW (Demand 1) vs DARE (Demand 2) — delivery vs research",
      "4-year series: Actuals 23-24 → BE 26-27, with RE-vs-BE slippage",
      "Charged vs Voted, Revenue vs Capital per demand",
      "Recoveries decomposition",
    ],
    surfaces: [
      { label: "Ministry · Agri Journey", href: "/agri-journey?step=demands" },
      { label: "Demands overview", href: "/explorer/ministry/magri" },
    ],
  },
  {
    n: 3, id: "ddg", icon: Boxes, status: "live",
    title: "DDG — Account Heads",
    question: "Through which accounting pipes does the money flow?",
    bullets: [
      "Top Major Heads (2401 Crop Husbandry, 2415 Research, 2435 Other Agri, 4401 Capital…)",
      "Minor-head concentration — top 10 = X% of envelope",
      "NEW / DISCONTINUED / TOKEN flags — structural change signals",
      "Object-head mix: Grants-in-aid vs Subsidies vs Salaries vs Capital assets",
    ],
    surfaces: [
      { label: "Sunburst + Major heads", href: "/explorer/ministry/magri" },
      { label: "DDG sheets", href: "/agri-journey?step=majorheads" },
    ],
  },
  {
    n: 4, id: "schemes", icon: Package, status: "live",
    title: "Schemes — Programme View",
    question: "Which named programmes drive the envelope?",
    bullets: [
      "CSS vs Central Sector vs Other Central Expenditure split",
      "Top 10 schemes by outlay, % of agri envelope",
      "Reconciliation: scheme outlay vs sum-of-DDG-leaves",
      "Lifecycle: NEW schemes 26-27, sunsetting schemes, merged umbrellas",
    ],
    surfaces: [
      { label: "Schemes · drill-down", href: "/agri-journey?step=schemes" },
    ],
  },
  {
    n: 5, id: "state", icon: MapPin, status: "planned",
    title: "State Distribution",
    question: "Where does the money land geographically?",
    bullets: [
      "For each CSS: state-wise releases (Centre share) + state matching share",
      "Per-capita / per-farmer / per-hectare normalisation",
      "North-East 10% earmark compliance, SC/ST sub-plan compliance",
      "Pendency / unspent balances by state · map + ranked tables",
    ],
    surfaces: [{ label: "Not yet built" }],
    gap: "Need state-wise scheme releases dataset (DBT-Bharat / scheme dashboards / PIB)",
  },
  {
    n: 6, id: "outcome", icon: Target, status: "planned",
    title: "Outcomes & Efficiency",
    question: "What do we get for the money?",
    bullets: [
      "Physical targets vs achievements: hectares insured, soil-health cards, farmers covered, MT procured",
      "Cost per beneficiary / per hectare / per ton",
      "Absorption ratio — RE/BE, Actual/RE",
      "Audit / CAG flags, PAC observations",
    ],
    surfaces: [{ label: "Not yet built" }],
    gap: "Need Outcome Budget extraction + CAG performance audits",
  },
];

const LENSES = [
  { icon: Clock,         label: "Time",            sub: "4-yr series, YoY, CAGR" },
  { icon: PieChart,      label: "Composition",     sub: "Rev/Cap, Subsidy/Capex/Salary, Centre/State" },
  { icon: BarChart3,     label: "Concentration",   sub: "Top-N share, Herfindahl on schemes" },
  { icon: AlertTriangle, label: "Variance",        sub: "BE→RE→Actual slippage" },
  { icon: Users,         label: "Equity",          sub: "State, NE, SC/ST, small/marginal farmer" },
  { icon: Scale,         label: "Reconciliation",  sub: "Σ(schemes) = Σ(DDG) = DG total?" },
];

const REPORT_SECTIONS = [
  { n: "01", t: "Executive Summary",         d: "5 headline numbers, 3 charts, 3 findings" },
  { n: "02", t: "Macro Context",             d: "L1 — agri's place in the Union Budget" },
  { n: "03", t: "Ministry Architecture",     d: "L2 — DAFW vs DARE, recoveries, voted/charged" },
  { n: "04", t: "Where the Money Lives",     d: "L3 — DDG heatmap, top heads, structural flags" },
  { n: "05", t: "Programme Deep-Dives",      d: "L4 — top 10 schemes, one page each" },
  { n: "06", t: "Geographic Distribution",   d: "L5 — state maps & tables" },
  { n: "07", t: "Outcomes & Efficiency",     d: "L6 — physical vs financial achievement" },
  { n: "08", t: "Structural Changes 26-27",  d: "New / dropped / merged programmes" },
  { n: "09", t: "Risks & Watch-list",        d: "Slippage, unspent, audit flags" },
  { n: "10", t: "Methodology & Sources",     d: "Coverage, data lineage, caveats" },
];

function StatusChip({ status }: { status: Status }) {
  const map = {
    live:    { label: "Live on site",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    partial: { label: "Partial",       cls: "bg-amber-50 text-amber-700 border-amber-200" },
    planned: { label: "Planned",       cls: "bg-muted text-muted-foreground border-border" },
  } as const;
  const m = map[status];
  return <span className={`inline-block rounded-sm border px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-medium ${m.cls}`}>{m.label}</span>;
}

export function AgriReportFramework() {
  return (
    <div className="space-y-10">
      {/* Intro */}
      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-primary font-medium">Report Framework</div>
        <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight">A 6-layer pyramid for the Agriculture Budget</h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Every layer of this framework answers one analytical question and feeds the next — Macro → Ministry → DDG → Schemes →
          State → Outcomes. The first four are already live on this site; State and Outcomes are the planned next drill-downs.
        </p>
      </div>

      {/* Pyramid visual */}
      <div className="rounded-md border border-border bg-card p-6">
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono mb-4">The Pyramid</div>
        <div className="space-y-1.5">
          {LAYERS.map((l) => {
            // widths get narrower as layer number increases
            const widths = ["100%", "92%", "82%", "70%", "56%", "40%"];
            const Icon = l.icon;
            return (
              <div key={l.id} className="flex justify-center">
                <div
                  style={{ width: widths[l.n - 1] }}
                  className={`flex items-center gap-3 rounded-sm border px-4 py-2.5 ${
                    l.status === "live" ? "border-primary/40 bg-primary/5"
                    : l.status === "partial" ? "border-amber-300 bg-amber-50/40"
                    : "border-dashed border-border bg-muted/30"
                  }`}
                >
                  <span className="font-mono text-[10px] text-muted-foreground w-6 shrink-0">L{l.n}</span>
                  <Icon className="h-4 w-4 shrink-0 text-foreground/70" />
                  <span className="text-sm font-medium flex-1 truncate">{l.title}</span>
                  <StatusChip status={l.status} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Layer cards */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl font-semibold">Layer-by-layer</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {LAYERS.map((l) => {
            const Icon = l.icon;
            return (
              <div key={l.id} className="rounded-md border border-border bg-card p-5 flex flex-col">
                <div className="flex items-start gap-3">
                  <div className="rounded-sm bg-foreground/5 p-2"><Icon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">L{l.n}</span>
                      <StatusChip status={l.status} />
                    </div>
                    <h4 className="mt-1 font-serif text-lg font-semibold leading-tight">{l.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground italic">"{l.question}"</p>
                  </div>
                </div>

                <ul className="mt-4 space-y-1.5">
                  {l.bullets.map((b, i) => (
                    <li key={i} className="text-xs text-foreground/85 flex gap-2 leading-relaxed">
                      <span className="text-muted-foreground">·</span><span>{b}</span>
                    </li>
                  ))}
                </ul>

                {l.gap && (
                  <div className="mt-4 rounded-sm border border-amber-200 bg-amber-50/60 p-2 text-[11px] text-amber-900">
                    <span className="font-medium">Gap:</span> {l.gap}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2">
                  {l.surfaces.map((s, i) =>
                    s.href ? (
                      <Link key={i} to={s.href}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">
                        {s.label} <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span key={i} className="text-[11px] text-muted-foreground">{s.label}</span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cross-cutting lenses */}
      <div>
        <h3 className="font-serif text-xl font-semibold">Cross-cutting lenses</h3>
        <p className="mt-1 text-sm text-muted-foreground">Apply each at every layer.</p>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {LENSES.map((x) => {
            const Icon = x.icon;
            return (
              <div key={x.label} className="rounded-md border border-border bg-card p-4">
                <Icon className="h-4 w-4 text-primary" />
                <div className="mt-2 text-sm font-medium">{x.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{x.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested report TOC */}
      <div>
        <h3 className="font-serif text-xl font-semibold">Suggested report structure</h3>
        <p className="mt-1 text-sm text-muted-foreground">Ten sections — assembled from the layers above.</p>
        <div className="mt-4 rounded-md border border-border bg-card divide-y divide-border">
          {REPORT_SECTIONS.map((s) => (
            <div key={s.n} className="flex items-start gap-4 px-4 py-3">
              <span className="font-mono text-xs text-muted-foreground w-8 shrink-0 pt-0.5">{s.n}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{s.t}</div>
                <div className="text-xs text-muted-foreground">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decisions to lock */}
      <div className="rounded-md border border-primary/30 bg-primary/5 p-5">
        <div className="text-[10px] uppercase tracking-[0.14em] text-primary font-medium font-mono">Decisions to lock before building</div>
        <ul className="mt-3 space-y-2 text-sm">
          {[
            "Output format — interactive web report page, downloadable PDF, or both?",
            "Scope — DAFW + DARE only, or include Fisheries/AHD + Fertiliser subsidy as agri-adjacent?",
            "State data source — DBT-Bharat releases, scheme dashboards (PM-KISAN, PMFBY portals), or PIB state-wise PRs?",
            "Outcome data — limit to Outcome Budget doc, or also pull CAG performance audits?",
          ].map((q, i) => (
            <li key={i} className="flex gap-2"><Circle className="h-3.5 w-3.5 mt-1 shrink-0 text-primary/60" /><span>{q}</span></li>
          ))}
        </ul>
      </div>

      {/* Coverage matrix */}
      <div>
        <h3 className="font-serif text-xl font-semibold">What's already on the site vs gaps</h3>
        <div className="mt-3 rounded-md border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Layer</th>
                <th className="text-left px-3 py-2 font-medium">Existing surface</th>
                <th className="text-left px-3 py-2 font-medium">Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {LAYERS.map((l) => (
                <tr key={l.id}>
                  <td className="px-3 py-2 align-top">
                    <div className="text-xs font-mono text-muted-foreground">L{l.n}</div>
                    <div className="text-sm font-medium">{l.title}</div>
                  </td>
                  <td className="px-3 py-2 align-top text-xs">
                    {l.status === "planned" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex items-center gap-1.5 text-foreground/80">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        {l.surfaces.map((s) => s.label).join(" · ")}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                    {l.gap || (l.status === "live" ? "—" : "Build planned")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
