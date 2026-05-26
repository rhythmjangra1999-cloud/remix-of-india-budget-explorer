import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { formatCr } from "@/lib/format";
import { BUDGET_META } from "@/lib/budget-data";
import {
  ALL_AGRI,
  computeKpis as agriKpis,
  getDemandSummaries,
  getMajorHeads,
} from "@/lib/agri";
import {
  UP_AGRI_ALL,
  computeKpis as upKpis,
} from "@/lib/up-agri";
import {
  PB_AGRI_ALL,
  computeKpis as pbKpis,
} from "@/lib/punjab-agri";
import schemesRaw from "@/data/schemes.json";

type Tab = "demands" | "heads" | "schemes" | "states";

interface SchemeRow {
  ministry: string;
  grantCode: number;
  schemeName: string;
  schemeType: string;
  outlayCr: number;
}
const SCHEMES = schemesRaw as SchemeRow[];

interface BarRow {
  label: string;
  cr: number;
  sub?: string;
}

function BarList({ rows, max, totalForShare }: { rows: BarRow[]; max: number; totalForShare: number }) {
  return (
    <div className="mt-5 space-y-3">
      {rows.map((r, i) => {
        const share = totalForShare ? (r.cr / totalForShare) * 100 : 0;
        return (
          <div key={i} className="block">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-serif text-sm truncate">{r.label}</span>
              </div>
              <div className="font-mono tnum text-foreground/80 shrink-0">
                {formatCr(r.cr, { compact: true })}
                <span className="ml-2 text-muted-foreground">{share.toFixed(1)}%</span>
              </div>
            </div>
            <div className="mt-1.5 h-2 w-full bg-muted/60 overflow-hidden">
              <div className="h-full bg-primary/80" style={{ width: `${(r.cr / max) * 100}%` }} />
            </div>
            {r.sub && <div className="mt-1 text-[11px] text-muted-foreground">{r.sub}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function ProofAgriInfographic() {
  const [tab, setTab] = useState<Tab>("demands");

  // ── Data ───────────────────────────────────────────────
  const demands = useMemo(() => getDemandSummaries(), []);
  const agriTotal = demands.reduce((s, d) => s + d.be2627, 0);
  const agriPrev = demands.reduce((s, d) => s + d.be2526, 0);

  // Top Major Heads in Agriculture
  const majorHeads = useMemo(() => {
    const mh = getMajorHeads(ALL_AGRI);
    const merged = new Map<string, { code: string; name: string; cr: number }>();
    for (const m of mh) {
      const prev = merged.get(m.mhCode);
      const v = m.be2627 ?? 0;
      if (prev) prev.cr += v;
      else merged.set(m.mhCode, { code: m.mhCode, name: m.mhName, cr: v });
    }
    return Array.from(merged.values()).sort((a, b) => b.cr - a.cr).slice(0, 6);
  }, []);
  const mhTotal = majorHeads.reduce((s, r) => s + r.cr, 0);
  const mhTop = majorHeads[0];

  // Agriculture schemes (DAFW=1, DARE=2)
  const agriSchemes = useMemo(() => {
    return SCHEMES
      .filter((s) => s.grantCode === 1 || s.grantCode === 2)
      .sort((a, b) => b.outlayCr - a.outlayCr);
  }, []);
  const topSchemes = agriSchemes.slice(0, 6);
  const allSchemesTotal = agriSchemes.reduce((s, r) => s + r.outlayCr, 0);
  const top3Share = allSchemesTotal
    ? (agriSchemes.slice(0, 3).reduce((s, r) => s + r.outlayCr, 0) / allSchemesTotal) * 100
    : 0;

  // States
  const upK = useMemo(() => upKpis(UP_AGRI_ALL), []);
  const pbK = useMemo(() => pbKpis(PB_AGRI_ALL), []);
  const upCr = upK.totalLakh / 100;
  const pbCr = pbK.totalLakh / 100;

  // ── Tab content ────────────────────────────────────────
  let title = "";
  let subtitle = "";
  let chips: string[] = [];
  let rows: BarRow[] = [];
  let footerLink: { to: string; label: string } = { to: "/ministry/agriculture", label: "Open Agriculture case study" };

  if (tab === "demands") {
    title = "Agriculture envelope · BE 2026-27";
    subtitle = "DAFW + DARE — two demands, one farm policy";
    chips = ["scope: dafw+dare", "measure: be2627"];
    rows = demands.map((d) => ({
      label: `${d.short} · ${d.title}`,
      cr: d.be2627,
      sub: `Revenue ${formatCr(d.revBe2627, { compact: true })} · Capital ${formatCr(d.capBe2627, { compact: true })}`,
    }));
    footerLink = { to: "/ministry/agriculture", label: "Open Agriculture case study" };
  } else if (tab === "heads") {
    title = "Where the money goes · Major Heads";
    subtitle = "Agriculture outlay broken down by accounting head";
    chips = ["groupBy: majorHead", "measure: be2627"];
    rows = majorHeads.map((m) => ({
      label: `${m.code} · ${m.name}`,
      cr: m.cr,
    }));
    footerLink = { to: "/ministry/agriculture", label: "Drill into Major → Object" };
  } else if (tab === "schemes") {
    title = "Top agriculture schemes · BE 2026-27";
    subtitle = `${agriSchemes.length} schemes mapped to DAFW + DARE`;
    chips = ["dataset: schemes", "grants: 1,2"];
    rows = topSchemes.map((s) => ({
      label: s.schemeName,
      cr: s.outlayCr,
      sub: s.schemeType,
    }));
    footerLink = { to: "/builder", label: "Open in Report Builder" };
  } else {
    title = "Two states, two stories · Agriculture BE 26-27";
    subtitle = "Sub-national budgets show what Union aggregates hide";
    chips = ["dataset: states", "scope: agriculture"];
    rows = [
      {
        label: "Uttar Pradesh · 9 agriculture demands",
        cr: upCr,
        sub: `${UP_AGRI_ALL.length.toLocaleString()} line items · YoY ${upK.yoyPct >= 0 ? "+" : ""}${upK.yoyPct.toFixed(1)}%`,
      },
      {
        label: "Punjab · 2 agriculture demands",
        cr: pbCr,
        sub: `${PB_AGRI_ALL.length.toLocaleString()} line items · YoY ${pbK.yoyPct >= 0 ? "+" : ""}${pbK.yoyPct.toFixed(1)}%`,
      },
    ];
    footerLink = { to: "/states", label: "Browse all states & UTs" };
  }

  const max = Math.max(1, ...rows.map((r) => r.cr));
  const totalForShare = rows.reduce((s, r) => s + r.cr, 0);

  // ── Insights ───────────────────────────────────────────
  const unionTotal = BUDGET_META.totalUnionBudgetCr;
  const insights = [
    {
      key: "demands" as Tab,
      tag: "01",
      k: "Agri envelope",
      t: `DAFW + DARE together get ${formatCr(agriTotal, { compact: true })} in BE 26-27`,
      d: `That is ${((agriTotal / unionTotal) * 100).toFixed(2)}% of the Union Budget (${formatCr(unionTotal, { compact: true })}), up ${(((agriTotal - agriPrev) / agriPrev) * 100).toFixed(1)}% over BE 25-26.`,
    },
    {
      key: "heads" as Tab,
      tag: "02",
      k: "Where it concentrates",
      t: mhTop
        ? `MH ${mhTop.code} · ${mhTop.name} alone absorbs ${((mhTop.cr / mhTotal) * 100).toFixed(1)}% of agri outlay`
        : "Crop Husbandry dominates the agri ledger",
      d: `Top 6 Major Heads carry ${formatCr(mhTotal, { compact: true })}. Within them, a handful of Object Heads — Grants-in-Aid and Subsidies — soak up most of the spend.`,
    },
    {
      key: "schemes" as Tab,
      tag: "03",
      k: "Scheme gravity",
      t: `Top 3 schemes account for ${top3Share.toFixed(1)}% of all agri scheme spend`,
      d: `${agriSchemes.length} schemes total. Concentration sits in PM-KISAN, PMFBY and Modified Interest Subvention — the headline programmes most farmers will recognise.`,
    },
    {
      key: "states" as Tab,
      tag: "04",
      k: "State lens",
      t: `UP's agri envelope (${formatCr(upCr, { compact: true })}) is ~${(upCr / Math.max(1, pbCr)).toFixed(1)}× Punjab's (${formatCr(pbCr, { compact: true })})`,
      d: "Two very different farm economies — UP's spread across 9 demands, Punjab's concentrated in 2. Sub-national DDGs show how the same sector is budgeted in different ways.",
    },
    {
      key: null as Tab | null,
      tag: "05",
      k: "Reproducible",
      t: "Every number above traces back to a source document",
      d: "Open the same view in the case study or Report Builder — each cell links to the Demand-for-Grants page it was parsed from. No black box.",
    },
  ];

  const tabs: { id: Tab; label: string }[] = [
    { id: "demands", label: "Demands" },
    { id: "heads", label: "Major → Object" },
    { id: "schemes", label: "Schemes" },
    { id: "states", label: "UP & Punjab" },
  ];

  return (
    <div className="mt-10 grid gap-px bg-border border border-border rounded-sm overflow-hidden lg:grid-cols-[1.4fr_1fr]">
      {/* LEFT — Agriculture infographic */}
      <div className="bg-card p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider border transition-colors ${
                tab === t.id
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Case study · Agriculture
            </div>
            <div className="mt-1 font-serif text-base font-semibold">{title}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</div>
          </div>
          <div className="hidden md:flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
            {chips.map((c) => (
              <span key={c} className="px-1.5 py-0.5 border border-border">{c}</span>
            ))}
          </div>
        </div>

        <BarList rows={rows} max={max} totalForShare={totalForShare} />

        <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
          <span className="font-mono text-muted-foreground">
            Source · Demands for Grants 2026-27
          </span>
          <Link
            to={footerLink.to}
            className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
          >
            {footerLink.label} <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* RIGHT — Synced insights */}
      <div className="bg-card p-6 md:p-8">
        <div className="border-b border-border pb-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Suggested insights
          </div>
          <div className="mt-1 font-serif text-base font-semibold">
            What the chart on the left actually says
          </div>
        </div>

        <div className="mt-5 space-y-1">
          {insights.map((ins) => {
            const active = ins.key === tab;
            return (
              <button
                key={ins.tag}
                onClick={() => ins.key && setTab(ins.key)}
                disabled={!ins.key}
                className={`block w-full text-left border-l-2 pl-3 py-3 transition-colors ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:border-border"
                } ${!ins.key ? "cursor-default" : "cursor-pointer"}`}
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] text-muted-foreground">{ins.tag}</span>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.16em] ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {ins.k}
                  </span>
                </div>
                <h4
                  className={`mt-2 font-serif text-base font-semibold leading-snug ${
                    active ? "" : "text-foreground/80"
                  }`}
                >
                  {ins.t}
                </h4>
                <p className="mt-1.5 font-serif text-xs text-foreground/70 leading-relaxed">{ins.d}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
