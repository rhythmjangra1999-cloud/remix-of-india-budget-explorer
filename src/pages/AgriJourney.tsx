import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JourneyStepper, JourneyNav, type JourneyStepId } from "@/components/agri/JourneyStepper";
import { AgriInsights } from "@/components/agri/AgriInsights";
import { Definition } from "@/components/agri/Definition";
import { TourProvider, useTour } from "@/components/tour/TourProvider";
import { SchemeTableView } from "@/components/explorer/SchemeTableView";
import { BudgetBuilder } from "@/components/builder/BudgetBuilder";
import {
  DG_SUMMARY, getMajorHeads, getValue, computeYoY, formatCrore,
  type DemandSummary, type YearKey, type Section,
} from "@/lib/dg";
import recoveriesData from "@/data/dg-recoveries.json";

const RECOVERIES = recoveriesData as Record<string, Partial<Record<YearKey, number>>>;
const getRec = (no: number, y: YearKey): number => {
  const v = RECOVERIES[String(no)]?.[y];
  return typeof v === "number" ? v : 0;
};

const AGRI = DG_SUMMARY.filter((d) => d.demandNo === 1 || d.demandNo === 2);

function YoYPill({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">—</span>;
  const pos = value >= 0;
  return (
    <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${pos ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
      {pos ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

// ── Step 1: Ministry overview ───────────────────────────────────────────────
function MinistryStep() {
  const total26 = AGRI.reduce((s, d) => s + getValue(d, "be2627", "total"), 0);
  const total25 = AGRI.reduce((s, d) => s + getValue(d, "be2526", "total"), 0);
  const rev = AGRI.reduce((s, d) => s + getValue(d, "be2627", "revenue"), 0);
  const cap = AGRI.reduce((s, d) => s + getValue(d, "be2627", "capital"), 0);
  const recTotal = AGRI.reduce((s, d) => s + Math.abs(getRec(d.demandNo, "be2627")), 0);
  const yoy = computeYoY(total26, total25);
  return (
    <div className="space-y-6">
      <div data-tour="header">
        <h2 className="font-serif text-2xl font-semibold">The big picture</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The Ministry of Agriculture & Farmers Welfare runs through two Demands for Grants — DAFW (the operational department)
          and DARE (research, anchored by ICAR). Together they make up India's farm-policy budget envelope.
        </p>
      </div>
      <div data-tour="kpis" className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border rounded-md overflow-hidden border border-border">
        <Kpi label="BE 26-27 (Gross)" value={formatCrore(total26, true)} />
        <Kpi label="YoY vs BE 25-26" value={yoy === null ? "—" : `${yoy >= 0 ? "+" : ""}${yoy.toFixed(1)}%`} positive={yoy !== null && yoy >= 0} />
        <Kpi label="Revenue" value={formatCrore(rev, true)} sub={`${total26 ? ((rev/total26)*100).toFixed(1) : "0"}%`} />
        <Kpi label="Capital" value={formatCrore(cap, true)} sub={`${total26 ? ((cap/total26)*100).toFixed(1) : "0"}%`} />
        <Kpi label="Recoveries" value={formatCrore(recTotal, true)} sub={`${total26 ? ((recTotal/total26)*100).toFixed(1) : "0"}% of gross`} />
      </div>
      <div className="rounded-md border border-border bg-card p-4 text-sm leading-relaxed">
        <p>
          Use this journey to walk down the hierarchy: from <Definition term="grandTotal">Grand Total</Definition> at the
          ministry level, into each Demand's <Definition term="revenue">Revenue</Definition> and <Definition term="capital">Capital</Definition> sections,
          to <Definition term="majorHead">Major Heads</Definition> and finally Schemes — closing with insights that pull it together.
        </p>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div className="bg-card p-4">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={`mt-1 font-serif text-xl md:text-2xl font-semibold tnum ${positive === true ? "text-emerald-700" : positive === false ? "text-rose-700" : ""}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ── Step 2: Demands ──────────────────────────────────────────────────────────
function DemandsStep() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold">DAFW vs DARE</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Each Demand has its own Revenue & Capital sections. The headline you see in budget speeches is the
          <em> Grand Total</em>; the figure that actually hits the Consolidated Fund is the
          <em> Expenditure Provision</em> (after recoveries).
        </p>
      </div>
      <div data-tour="demands-grid" className="grid gap-4 lg:grid-cols-2">
        {AGRI.map((d) => <DemandCard key={d.demandNo} demand={d} />)}
      </div>
    </div>
  );
}

function DemandCard({ demand }: { demand: DemandSummary }) {
  const total = getValue(demand, "be2627", "total");
  const rev   = getValue(demand, "be2627", "revenue");
  const cap   = getValue(demand, "be2627", "capital");
  const rec   = Math.abs(getRec(demand.demandNo, "be2627"));
  const prov  = total - rec;
  const yoy   = computeYoY(total, getValue(demand, "be2526", "total"));
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Demand {demand.demandNo}</div>
      <h3 className="mt-1 font-serif text-lg font-semibold">{demand.demandDesc}</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stat label={<><Definition term="grandTotal">Grand Total</Definition></>} value={formatCrore(total, true)} accent yoy={yoy} />
        <div data-tour={demand.demandNo === 1 ? "exp-budget" : undefined}>
          <Stat label={<><Definition term="expenditureProvision">Expenditure Provision</Definition></>} value={formatCrore(prov, true)} accent />
        </div>
        <Stat label="Revenue" value={formatCrore(rev, true)} />
        <Stat label="Capital" value={formatCrore(cap, true)} />
      </div>
      <div className="mt-3 text-[11px] text-muted-foreground border-t border-border pt-2">
        <span className="font-mono tnum">{formatCrore(total, true)}</span>
        {" − "}
        <span className="font-mono tnum text-rose-700">{formatCrore(rec, true)} (recoveries)</span>
        {" = "}
        <span className="font-mono tnum text-primary font-semibold">{formatCrore(prov, true)}</span>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, yoy }: { label: React.ReactNode; value: string; accent?: boolean; yoy?: number | null }) {
  return (
    <div className={`rounded-sm border p-2 ${accent ? "border-primary/40 bg-primary/5" : "border-border"}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span className={`font-serif font-semibold tnum ${accent ? "text-primary text-lg" : "text-base"}`}>{value}</span>
        {yoy !== undefined && <YoYPill value={yoy} />}
      </div>
    </div>
  );
}

// ── Step 3: Major Heads ──────────────────────────────────────────────────────
function MajorHeadsStep() {
  const [demandNo, setDemandNo] = useState(1);
  const rows = useMemo(() => {
    return getMajorHeads(demandNo)
      .filter(r => !r.mhCode.startsWith("TOTAL"))
      .sort((a, b) => (b.be2627 ?? 0) - (a.be2627 ?? 0));
  }, [demandNo]);
  const total = rows.reduce((s, r) => s + (r.be2627 ?? 0), 0);
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-semibold">Where the money goes — <Definition term="majorHead">Major Heads</Definition></h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Each rupee in a Demand is classified under a 4-digit Major Head — the "function" of the spend
          (Crop Husbandry, Research, Grants to States…).
        </p>
      </div>
      <div className="flex gap-2">
        {AGRI.map((d) => (
          <button
            key={d.demandNo}
            onClick={() => setDemandNo(d.demandNo)}
            className={`px-3 py-1.5 text-xs rounded-sm border ${demandNo === d.demandNo ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            {d.demandDesc}
          </button>
        ))}
      </div>
      <div data-tour="mh-table" className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Code</th>
              <th className="text-left px-3 py-2 font-medium">Major Head</th>
              <th className="text-left px-3 py-2 font-medium">Section</th>
              <th className="text-right px-3 py-2 font-medium">BE 25-26</th>
              <th className="text-right px-3 py-2 font-medium">BE 26-27</th>
              <th className="text-right px-3 py-2 font-medium">Share</th>
              <th className="text-right px-3 py-2 font-medium">YoY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => {
              const yoy = computeYoY(r.be2627, r.be2526);
              const share = total ? ((r.be2627 ?? 0) / total) * 100 : 0;
              return (
                <tr key={r.mhCode + r.section} className="hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-xs">{r.mhCode}</td>
                  <td className="px-3 py-2">{r.mhName}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.section}</td>
                  <td className="px-3 py-2 text-right tnum text-muted-foreground">{formatCrore(r.be2526, true)}</td>
                  <td className="px-3 py-2 text-right tnum font-semibold">{formatCrore(r.be2627, true)}</td>
                  <td className="px-3 py-2 text-right tnum text-muted-foreground">{share.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right"><YoYPill value={yoy} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Step 4: Schemes ──────────────────────────────────────────────────────────
function SchemesStep() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-semibold">How money reaches the ground — Schemes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Major Heads classify by function; <strong>Schemes</strong> are the actual programmes that deliver
          (PM-KISAN, PMFBY, RKVY, NMSA…). Filter the table below for "Agri" to see Agriculture's scheme footprint.
        </p>
      </div>
      <div data-tour="schemes" className="rounded-md border border-border bg-card p-3">
        <SchemeTableView fy="FY27" />
      </div>
    </div>
  );
}

// ── Step 5: Insights wrapper for tour anchor ─────────────────────────────────
function InsightsStep() {
  return <div data-tour="insights"><AgriInsights /></div>;
}

// ── Step 6: Tutorial ─────────────────────────────────────────────────────────
function TutorialStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-md border border-border bg-card p-8 text-center space-y-4">
      <h2 className="font-serif text-2xl font-semibold">Take the guided tour</h2>
      <p className="text-sm text-muted-foreground max-w-xl mx-auto">
        An 8-step coach-mark walk-through of the Agriculture journey — from headline KPIs to insights.
        Use it any time you want a refresher on what each section means.
      </p>
      <button onClick={onStart}
        className="inline-flex items-center gap-2 rounded-sm bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
        <PlayCircle className="h-4 w-4" /> Start tour
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
function AgriJourneyInner() {
  const [params, setParams] = useSearchParams();
  const initialStep = (params.get("step") as JourneyStepId) || "ministry";
  const [step, setStep] = useState<JourneyStepId>(initialStep);
  const tour = useTour();

  const setJourneyStep = (id: JourneyStepId) => {
    setStep(id);
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.set("step", id);
      return n;
    }, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startTour = () => {
    tour.start([
      { target: "header",       title: "Ministry view",     body: "You're looking at Agriculture as a whole. The intro frames what we'll explore.",                            onEnter: () => setJourneyStep("ministry") },
      { target: "kpis",         title: "Headline numbers",  body: "BE = Budget Estimate. We compare BE 26-27 vs BE 25-26 for YoY, then split into Revenue, Capital and Recoveries." },
      { target: "stepper",      title: "Five-step journey", body: "Ministry → Demands → Major Heads → Schemes → Insights. Click any step at any time, or use the Next button.", onEnter: () => setJourneyStep("ministry") },
      { target: "demands-grid", title: "DAFW vs DARE",       body: "Each Demand shows Grand Total, Revenue, Capital and the net Expenditure Provision side-by-side.",            onEnter: () => setJourneyStep("demands") },
      { target: "exp-budget",   title: "Expenditure Provision", body: "Grand Total minus Recoveries. For DAFW, recoveries are huge (~₹1 L Cr), so the net spend is far below the headline." },
      { target: "mh-table",     title: "Major Heads",       body: "Functional codes — 2401 Crop Husbandry, 2415 Research, 3601 Grants-to-States. Sorted by size, with YoY.",     onEnter: () => setJourneyStep("majorheads") },
      { target: "schemes",      title: "Schemes",           body: "The actual delivery vehicles. Filter for PM-KISAN, PMFBY, RKVY to see how funds reach farmers.",               onEnter: () => setJourneyStep("schemes") },
      { target: "insights",     title: "Insights",          body: "Five readings — Charged vs Voted, YoY deltas, Recoveries ratio, Major Head shares, and the net provision arithmetic.", onEnter: () => setJourneyStep("insights") },
    ]);
  };

  // First-visit auto-open
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("agri-tour-seen")) {
      localStorage.setItem("agri-tour-seen", "1");
      const t = setTimeout(startTour, 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border">
          <div className="container py-6">
            <Link to="/explorer" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Explorer
            </Link>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-primary font-medium">Guided Journey · Agriculture</div>
                <h1 className="mt-2 font-serif text-3xl md:text-4xl font-semibold leading-tight">
                  Ministry of Agriculture & Farmers Welfare
                </h1>
                <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
                  A walk-through from ministry → demands → major heads → schemes → insights, with definitions inline.
                </p>
              </div>
              <button
                onClick={startTour}
                className="inline-flex items-center gap-1.5 rounded-sm border border-primary text-primary px-3 py-2 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <PlayCircle className="h-4 w-4" /> Take the tour
              </button>
            </div>
          </div>
        </section>

        <section className="container py-6 space-y-6">
          <JourneyStepper current={step} onChange={setJourneyStep} />
          <div>
            {step === "ministry"   && <MinistryStep />}
            {step === "demands"    && <DemandsStep />}
            {step === "majorheads" && <MajorHeadsStep />}
            {step === "schemes"    && <SchemesStep />}
            {step === "insights"   && <InsightsStep />}
            {step === "tutorial"   && <TutorialStep onStart={startTour} />}
            {step === "builder"    && <BudgetBuilder embedded defaults={{ dataset: "majorHeads", ministries: ["Ministry of Agriculture and Farmers Welfare"] }} />}
          </div>
          <JourneyNav current={step} onChange={setJourneyStep} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function AgriJourney() {
  return (
    <TourProvider>
      <AgriJourneyInner />
    </TourProvider>
  );
}
