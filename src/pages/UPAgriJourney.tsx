import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronRight, Search } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Input } from "@/components/ui/input";
import {
  UP_AGRI_ALL, UP_DEMANDS, filterRows, computeKpis, buildHierarchy,
  getMajorHeads, topMovers, getDemandSummaries, formatCr, toCr,
  type DemandFilter, type HierNode, type UPAgriRow,
} from "@/lib/up-agri";

// ── Atoms ────────────────────────────────────────────────────────────────────
function YoY({ curr, prev }: { curr: number; prev: number }) {
  if (!prev) return <span className="text-xs text-muted-foreground">—</span>;
  const v = ((curr - prev) / prev) * 100;
  const pos = v >= 0;
  return (
    <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${pos ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
      {pos ? "+" : ""}{v.toFixed(1)}%
    </span>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card p-4 text-left">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-serif text-xl md:text-2xl font-semibold tnum">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ── Demands overview ────────────────────────────────────────────────────────
function DemandsOverview({ onPick }: { onPick: (id: string) => void }) {
  const rows = getDemandSummaries();
  return (
    <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
      {rows.map((d) => (
        <button key={d.id} onClick={() => onPick(d.id)}
          className="group bg-card p-5 text-left hover:bg-primary/5 transition-colors">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Demand {d.no}</div>
          <div className="mt-1 font-serif text-base font-semibold leading-snug">{d.title}</div>
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <span className="font-serif text-xl font-semibold tnum text-primary">{formatCr(d.be2627)}</span>
            <YoY curr={d.be2627} prev={d.be2526} />
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground tnum">
            Revenue {formatCr(d.revBe2627)} · Capital {formatCr(d.capBe2627)}
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Major Heads table ───────────────────────────────────────────────────────
function MajorHeadsTable({ rows }: { rows: UPAgriRow[] }) {
  const mh = useMemo(() => getMajorHeads(rows), [rows]);
  const total = mh.reduce((s, r) => s + (r.be2627 ?? 0), 0);
  return (
    <div className="border border-border overflow-hidden bg-card">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Code</th>
            <th className="px-3 py-2 font-medium">Major Head</th>
            <th className="px-3 py-2 font-medium">Section</th>
            <th className="px-3 py-2 font-medium text-right">BE 25-26</th>
            <th className="px-3 py-2 font-medium text-right">BE 26-27</th>
            <th className="px-3 py-2 font-medium text-right">Share</th>
            <th className="px-3 py-2 font-medium text-right">YoY</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {mh.map((r) => {
            const share = total ? ((r.be2627 ?? 0) / total) * 100 : 0;
            return (
              <tr key={r.mhCode + r.section} className="hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-xs">{r.mhCode}</td>
                <td className="px-3 py-2">
                  <div>{r.mhName}</div>
                  {r.mhNameHi && <div className="text-[11px] text-muted-foreground">{r.mhNameHi}</div>}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{r.section}</td>
                <td className="px-3 py-2 text-right tnum text-muted-foreground">{formatCr(r.be2526 ?? 0)}</td>
                <td className="px-3 py-2 text-right tnum font-semibold">{formatCr(r.be2627 ?? 0)}</td>
                <td className="px-3 py-2 text-right tnum text-muted-foreground">{share.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right"><YoY curr={r.be2627 ?? 0} prev={r.be2526 ?? 0} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Hierarchy table ─────────────────────────────────────────────────────────
function HierarchyTable({ root }: { root: HierNode }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return root;
    const needle = q.toLowerCase();
    function filter(n: HierNode): HierNode | null {
      const selfMatch = n.name.toLowerCase().includes(needle) || (n.nameHi ?? "").includes(needle);
      if (!n.children) return selfMatch ? n : null;
      const kids = n.children.map(filter).filter((x): x is HierNode => x !== null);
      if (selfMatch || kids.length) return { ...n, children: kids };
      return null;
    }
    return filter(root) ?? root;
  }, [root, q]);

  function toggle(k: string) {
    setExpanded((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  }

  return (
    <div className="flex flex-col">
      <div className="relative mb-3 max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search heads (English or Hindi)…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 h-9" />
      </div>
      <div className="overflow-y-auto border border-border bg-card max-h-[600px]">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-card border-b border-border z-10">
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">Head</th>
              <th className="px-3 py-2 font-medium text-right">BE 26-27</th>
              <th className="px-3 py-2 font-medium text-right">YoY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.children?.map((major) => (
              <Branch key={major.key} node={major} depth={0} expanded={expanded} toggle={toggle} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Branch({ node, depth, expanded, toggle }: { node: HierNode; depth: number; expanded: Set<string>; toggle: (k: string) => void }) {
  const isOpen = expanded.has(node.key);
  const hasKids = !!node.children?.length;
  const yoy = node.prevValue ? ((node.value - node.prevValue) / node.prevValue) * 100 : 0;
  return (
    <>
      <tr className="hover:bg-muted/40 cursor-pointer transition-colors" onClick={() => hasKids && toggle(node.key)}>
        <td className="px-3 py-1.5" style={{ paddingLeft: 12 + depth * 16 }}>
          <div className="flex items-start gap-1.5">
            {hasKids ? (isOpen
              ? <ChevronDown className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />)
              : <span className="w-3.5 shrink-0" />}
            <div className="leading-tight">
              <div className={depth === 0 ? "font-semibold" : depth === 1 ? "font-medium" : ""}>{node.name}</div>
              {node.nameHi && <div className="text-[11px] text-muted-foreground">{node.nameHi}</div>}
            </div>
          </div>
        </td>
        <td className="px-3 py-1.5 text-right tnum font-mono text-xs">{formatCr(node.value)}</td>
        <td className={`px-3 py-1.5 text-right tnum font-mono text-xs ${yoy >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
          {node.prevValue ? `${yoy >= 0 ? "+" : ""}${yoy.toFixed(1)}%` : "—"}
        </td>
      </tr>
      {isOpen && node.children?.map((c) => (
        <Branch key={c.key} node={c} depth={depth + 1} expanded={expanded} toggle={toggle} />
      ))}
      {isOpen && node.level === "sub" && node.rows?.map((r) => (
        <tr key={r.id} className="bg-secondary/20 text-xs">
          <td className="py-1" style={{ paddingLeft: 12 + (depth + 1) * 16 }}>
            <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/40 mr-2 align-middle" />
            {r.objectHead} · {r.objectHeadName}
            {r.objectHeadNameHi && <span className="ml-2 text-muted-foreground">({r.objectHeadNameHi})</span>}
            <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-card border border-border">
              {r.section === "Revenue" ? "Rev" : "Cap"}
            </span>
            {r.gapFlag && (
              <span className={`ml-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                r.gapFlag === "NEW" ? "bg-emerald-500/15 text-emerald-700" :
                r.gapFlag === "DISCONTINUED" ? "bg-rose-500/15 text-rose-700" :
                "bg-muted text-muted-foreground"
              }`}>{r.gapFlag.toLowerCase()}</span>
            )}
          </td>
          <td className="px-3 py-1 text-right tnum font-mono">{r.be2627 != null ? formatCr(r.be2627) : "—"}</td>
          <td className="px-3 py-1 text-right tnum font-mono text-muted-foreground">
            {r.be2526 ? `${(((r.be2627 ?? 0) - r.be2526) / r.be2526 * 100).toFixed(0)}%` : "—"}
          </td>
        </tr>
      ))}
    </>
  );
}

// ── Movers ─────────────────────────────────────────────────────────────────
function Movers({ rows }: { rows: UPAgriRow[] }) {
  const { hikes, cuts } = useMemo(() => topMovers(rows), [rows]);
  const Table = ({ title, list, positive }: { title: string; list: typeof hikes; positive: boolean }) => (
    <div className="border border-border bg-card">
      <div className="px-4 py-2 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">{title}</div>
      <table className="w-full text-sm text-left">
        <tbody className="divide-y divide-border">
          {list.map((m, i) => (
            <tr key={i} className="hover:bg-muted/30">
              <td className="px-4 py-2">
                <div className="font-medium leading-tight">{m.minorHeadName}</div>
                <div className="text-[11px] text-muted-foreground">{m.majorHeadName}</div>
              </td>
              <td className="px-4 py-2 text-right tnum font-mono text-xs whitespace-nowrap">
                {formatCr(m.be2526)} → {formatCr(m.be2627)}
              </td>
              <td className={`px-4 py-2 text-right tnum font-mono text-xs whitespace-nowrap ${positive ? "text-emerald-700" : "text-rose-700"}`}>
                {positive ? "+" : ""}{formatCr(m.delta)}
                <div className="text-[10px] text-muted-foreground">{m.pct >= 0 ? "+" : ""}{m.pct.toFixed(0)}%</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <div className="grid gap-px bg-border md:grid-cols-2">
      <Table title="Top hikes (BE 26-27 vs 25-26)" list={hikes} positive />
      <Table title="Top cuts (BE 26-27 vs 25-26)" list={cuts} positive={false} />
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function UPAgriJourney() {
  const [filter, setFilter] = useState<DemandFilter>("all");
  const rows = useMemo(() => filterRows(filter), [filter]);
  const k = useMemo(() => computeKpis(rows), [rows]);
  const hier = useMemo(() => buildHierarchy(rows), [rows]);

  const pickDemand = (id: string) => {
    setFilter(id);
    document.getElementById("explore")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border">
          <div className="container py-6">
            <Link to="/states/uttar-pradesh" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> All UP departments
            </Link>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="container py-10 md:py-14 text-left">
            <div className="text-xs uppercase tracking-[0.16em] text-primary font-medium">Uttar Pradesh · Agriculture & Allied · 2026-27</div>
            <h1 className="mt-3 font-serif text-3xl md:text-5xl font-semibold leading-tight">
              कृषि एवं सम्बद्ध — nine demands, one rural economy.
            </h1>
            <p className="mt-4 max-w-3xl font-serif text-base md:text-xl leading-relaxed text-foreground/85">
              UP's farm-and-allied envelope runs through nine Demands for Grants (010–018), spanning
              core agriculture, horticulture, animal husbandry, dairy, fisheries, cooperation, rural
              development, panchayati raj and land-and-water resources. Every figure below traces back
              to a state Demands-for-Grants PDF and is shown in ₹ Crore.
            </p>
          </div>
        </section>

        {/* KPIs */}
        <section className="border-b border-border">
          <div className="container py-8 text-left">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border border border-border">
              <Kpi label="BE 2026-27" value={formatCr(k.totalLakh)} sub={`${UP_DEMANDS.length} demands · ${UP_AGRI_ALL.length.toLocaleString()} rows`} />
              <Kpi label="YoY vs BE 25-26" value={`${k.yoyPct >= 0 ? "+" : ""}${k.yoyPct.toFixed(1)}%`} sub={`from ${formatCr(k.prevLakh)}`} />
              <Kpi label="Revenue" value={formatCr(k.revenueLakh)} sub={`${k.revenueShare.toFixed(1)}% of total`} />
              <Kpi label="Capital" value={formatCr(k.capitalLakh)} sub={`${(100 - k.revenueShare).toFixed(1)}% of total`} />
              <Kpi label="Flagged rows" value={k.flaggedCount.toLocaleString()} sub={`${k.newCount} new · ${k.discontinuedCount} discontinued`} />
            </div>
          </div>
        </section>

        {/* Demands overview */}
        <section className="border-b border-border">
          <div className="container py-10 text-left">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Step 1</div>
            <h2 className="mt-2 font-serif text-2xl md:text-3xl font-semibold">Nine demands, side-by-side</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Click any card to filter the explorer below.
            </p>
            <div className="mt-6">
              <DemandsOverview onPick={pickDemand} />
            </div>
          </div>
        </section>

        {/* Filter + Major heads */}
        <section id="explore" className="border-b border-border">
          <div className="container py-10 text-left space-y-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Step 2</div>
              <h2 className="mt-2 font-serif text-2xl md:text-3xl font-semibold">Where the money goes — Major Heads</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 text-xs rounded-sm border ${filter === "all" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
              >
                All demands
              </button>
              {UP_DEMANDS.map((d) => (
                <button key={d.id} onClick={() => setFilter(d.id)}
                  className={`px-3 py-1.5 text-xs rounded-sm border ${filter === d.id ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>
                  {String(d.no).padStart(3, "0")}
                </button>
              ))}
            </div>
            <MajorHeadsTable rows={rows} />
          </div>
        </section>

        {/* Hierarchy */}
        <section className="border-b border-border">
          <div className="container py-10 text-left space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Step 3</div>
              <h2 className="mt-2 font-serif text-2xl md:text-3xl font-semibold">Drill down — Major → Minor → Sub-Head → Object</h2>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Click any row to expand. Hindi names appear under English where the source PDF provides them.
              </p>
            </div>
            <HierarchyTable root={hier} />
          </div>
        </section>

        {/* Movers */}
        <section className="border-b border-border">
          <div className="container py-10 text-left space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Step 4</div>
              <h2 className="mt-2 font-serif text-2xl md:text-3xl font-semibold">Biggest movers</h2>
            </div>
            <Movers rows={rows} />
          </div>
        </section>

        <section>
          <div className="container py-8 text-left text-[11px] text-muted-foreground">
            Source · Uttar Pradesh Demands for Grants 2026-27, Grants 010–018. All figures in ₹ Crore (1 Cr = 100 Lakh).
            Original PDFs are linked in the row-level source column of the raw dataset.
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
