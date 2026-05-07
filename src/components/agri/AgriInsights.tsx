import { useMemo, useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { DG_SUMMARY, getMajorHeads, getValue, computeYoY, formatCrore, type DemandSummary, type YearKey } from "@/lib/dg";
import recoveriesData from "@/data/dg-recoveries.json";
import insightLinks from "@/data/agri-insights-links.json";
import chargedVoted from "@/data/agri-charged-voted.json";
import { Definition } from "./Definition";

const RECOVERIES = recoveriesData as Record<string, Partial<Record<YearKey, number>>>;
const getRec = (no: number, y: YearKey): number => {
  const v = RECOVERIES[String(no)]?.[y];
  return typeof v === "number" ? v : 0;
};

const AGRI_DEMANDS = [1, 2] as const;
function agriDemand(no: number): DemandSummary | undefined {
  return DG_SUMMARY.find((d) => d.demandNo === no);
}

function Card({ title, subtitle, children }: { title: React.ReactNode; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono">Insight</div>
      <h3 className="mt-1 font-serif text-xl font-semibold leading-tight">{title}</h3>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ReadMore({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        {open ? "Hide details" : "Read more"}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && <div className="mt-2 text-xs text-foreground/80 leading-relaxed">{children}</div>}
    </div>
  );
}

function LinksList({ links }: { links: { title: string; outlet: string; url: string }[] }) {
  return (
    <ul className="mt-3 space-y-1.5">
      {links.map((l) => (
        <li key={l.url}>
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-start gap-1.5 text-xs hover:text-primary"
          >
            <ExternalLink className="h-3 w-3 mt-0.5 shrink-0 opacity-60 group-hover:opacity-100" />
            <span>
              <span className="underline decoration-dotted underline-offset-2">{l.title}</span>
              <span className="text-muted-foreground"> · {l.outlet}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

// 1 — Charged vs Voted
function ChargedVotedInsight() {
  const cv = chargedVoted as Record<string, { voted: number; charged: number }>;
  const rows = AGRI_DEMANDS.map((no) => {
    const d = agriDemand(no)!;
    const v = cv[String(no)]?.voted ?? 0;
    const c = cv[String(no)]?.charged ?? 0;
    return { d, voted: v, charged: c, total: v + c };
  });
  return (
    <Card
      title={<><Definition term="charged">Charged</Definition> vs <Definition term="voted">Voted</Definition></>}
      subtitle="What Parliament can vote on, and what it can't."
    >
      <table className="w-full text-xs">
        <thead className="text-muted-foreground text-[10px] uppercase tracking-wider">
          <tr><th className="text-left py-1.5">Demand</th><th className="text-right">Voted</th><th className="text-right">Charged</th><th className="text-right">Charged %</th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(({ d, voted, charged, total }) => (
            <tr key={d.demandNo}>
              <td className="py-2 pr-3">{d.demandDesc}</td>
              <td className="py-2 text-right tnum font-mono">{formatCrore(voted, true)}</td>
              <td className="py-2 text-right tnum font-mono">{formatCrore(charged, true)}</td>
              <td className="py-2 text-right tnum text-muted-foreground">{total ? ((charged / total) * 100).toFixed(2) : "0.00"}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReadMore>
        Both Agriculture demands are <strong>100% Voted</strong> — the entire outlay passes through Lok Sabha approval.
        Charged items typically appear where the demand carries debt-servicing, court decrees, or salaries of constitutional posts.
        Agriculture has none of these structurally, so all spending is debated and voted as Demands for Grants.
      </ReadMore>
    </Card>
  );
}

// 2 — Revenue vs Capital YoY
function RevCapYoYInsight() {
  const rows = AGRI_DEMANDS.map((no) => {
    const d = agriDemand(no)!;
    const revYoy = computeYoY(getValue(d, "be2627", "revenue"), getValue(d, "be2526", "revenue"));
    const capYoy = computeYoY(getValue(d, "be2627", "capital"), getValue(d, "be2526", "capital"));
    const totYoy = computeYoY(getValue(d, "be2627", "total"),   getValue(d, "be2526", "total"));
    return { d, revYoy, capYoy, totYoy };
  });
  return (
    <Card
      title={<>Delta in <Definition term="revenue">Revenue</Definition> & <Definition term="capital">Capital</Definition> — YoY</>}
      subtitle="BE 26-27 vs BE 25-26."
    >
      <table className="w-full text-xs">
        <thead className="text-muted-foreground text-[10px] uppercase tracking-wider">
          <tr><th className="text-left py-1.5">Demand</th><th className="text-right">Revenue</th><th className="text-right">Capital</th><th className="text-right">Total</th></tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(({ d, revYoy, capYoy, totYoy }) => (
            <tr key={d.demandNo}>
              <td className="py-2 pr-3">{d.demandDesc}</td>
              <td className="py-2 text-right tnum font-mono">{revYoy === null ? "—" : `${revYoy >= 0 ? "+" : ""}${revYoy.toFixed(1)}%`}</td>
              <td className="py-2 text-right tnum font-mono">{capYoy === null ? "—" : `${capYoy >= 0 ? "+" : ""}${capYoy.toFixed(1)}%`}</td>
              <td className="py-2 text-right tnum font-mono font-semibold">{totYoy === null ? "—" : `${totYoy >= 0 ? "+" : ""}${totYoy.toFixed(1)}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReadMore>
        DAFW's Capital share is tiny (under 0.1% of the demand) — large Capital % swings are off a small base and don't move the needle.
        DARE shows a Revenue dip (research grants, salaries) which usually reflects ICAR establishment costs being held flat.
        For substantive context on what's driving the Revenue line (fertiliser & PM-KISAN dominate), see the linked coverage.
      </ReadMore>
      <div className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">Related coverage</div>
      <LinksList links={insightLinks.revenueCapital} />
    </Card>
  );
}

// 3 — Recoveries as % of Grand Total
function RecoveriesInsight() {
  const rows = AGRI_DEMANDS.map((no) => {
    const d = agriDemand(no)!;
    const total = getValue(d, "be2627", "total");
    const rec = Math.abs(getRec(no, "be2627"));
    const pct = total ? (rec / total) * 100 : 0;
    return { d, total, rec, pct };
  });
  const band = (pct: number) =>
    pct < 2 ? { label: "Normal",  color: "bg-emerald-100 text-emerald-700" } :
    pct < 10 ? { label: "Watch",  color: "bg-amber-100 text-amber-700" } :
    { label: "High",   color: "bg-rose-100 text-rose-700" };
  return (
    <Card
      title={<><Definition term="recoveries">Recoveries</Definition> as % of <Definition term="grandTotal">Grand Total</Definition></>}
      subtitle="High recoveries with high gross outlay can flag churn — money going out and quickly coming back."
    >
      <div className="grid sm:grid-cols-2 gap-3">
        {rows.map(({ d, total, rec, pct }) => {
          const b = band(pct);
          return (
            <div key={d.demandNo} className="rounded-sm border border-border p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.demandDesc}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold tnum">{pct.toFixed(2)}%</span>
                <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${b.color}`}>{b.label}</span>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground tnum">
                {formatCrore(rec, true)} recovered of {formatCrore(total, true)}
              </div>
              {/* sparkline across 4 years */}
              <div className="mt-3 flex items-end gap-1 h-10">
                {(["actuals2425","be2526","re2526","be2627"] as YearKey[]).map((y) => {
                  const t = getValue(d, y, "total");
                  const r = Math.abs(getRec(d.demandNo, y));
                  const p = t ? (r / t) * 100 : 0;
                  const h = Math.max(2, Math.min(40, p * 4));
                  return (
                    <div key={y} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-sm bg-primary/60" style={{ height: h }} title={`${y}: ${p.toFixed(2)}%`} />
                      <span className="text-[9px] text-muted-foreground">{y.replace(/(\d{4})/, "$1").slice(-4)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <ReadMore>
        For DAFW, recoveries (mostly fertiliser/credit-line repayments and adjustments) are ~44% of the gross outlay — a structural feature of the
        fertiliser subsidy mechanism, not necessarily a red flag. For DARE, recoveries are nearly nil — research grants don't generate receipts.
        Bands used here: <strong>&lt;2% Normal · 2-10% Watch · &gt;10% High</strong>.
      </ReadMore>
      <div className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">Related coverage</div>
      <LinksList links={insightLinks.recoveries} />
    </Card>
  );
}

// 4 — Major Head contribution
function MajorHeadInsight() {
  const [demandNo, setDemandNo] = useState<number>(1);
  const [mode, setMode] = useState<"share" | "delta">("share");
  const data = useMemo(() => {
    const rows = getMajorHeads(demandNo).filter(r => !r.mhCode.startsWith("TOTAL"));
    const total = rows.reduce((s, r) => s + (r.be2627 ?? 0), 0);
    const totalPrev = rows.reduce((s, r) => s + (r.be2526 ?? 0), 0);
    return rows
      .map((r) => {
        const share = total ? ((r.be2627 ?? 0) / total) * 100 : 0;
        const sharePrev = totalPrev ? ((r.be2526 ?? 0) / totalPrev) * 100 : 0;
        return { ...r, share, deltaShare: share - sharePrev };
      })
      .sort((a, b) => mode === "share" ? b.share - a.share : Math.abs(b.deltaShare) - Math.abs(a.deltaShare))
      .slice(0, 8);
  }, [demandNo, mode]);
  const max = Math.max(...data.map(d => mode === "share" ? d.share : Math.abs(d.deltaShare)), 1);
  return (
    <Card
      title={<><Definition term="majorHead">Major Head</Definition> contribution</>}
      subtitle="Which heads dominate the demand, and which are gaining/losing weight YoY."
    >
      <div className="flex flex-wrap gap-2 mb-3">
        {AGRI_DEMANDS.map((no) => (
          <button
            key={no}
            onClick={() => setDemandNo(no)}
            className={`px-2.5 py-1 text-[11px] rounded-sm border ${demandNo === no ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            Demand {no}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-border self-center" />
        <button onClick={() => setMode("share")} className={`px-2.5 py-1 text-[11px] rounded-sm border ${mode === "share" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>Share this year</button>
        <button onClick={() => setMode("delta")} className={`px-2.5 py-1 text-[11px] rounded-sm border ${mode === "delta" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}>Δ Share YoY</button>
      </div>
      <div className="space-y-1.5">
        {data.map((r) => {
          const v = mode === "share" ? r.share : r.deltaShare;
          const w = (Math.abs(v) / max) * 100;
          const pos = v >= 0;
          return (
            <div key={r.mhCode} className="flex items-center gap-2 text-xs">
              <span className="font-mono text-muted-foreground w-12 shrink-0">{r.mhCode}</span>
              <span className="flex-1 truncate">{r.mhName}</span>
              <div className="w-32 h-3 bg-muted rounded-sm overflow-hidden">
                <div className={`h-full ${pos ? "bg-primary" : "bg-rose-400"}`} style={{ width: `${w}%` }} />
              </div>
              <span className="font-mono tnum w-14 text-right">{mode === "share" ? `${v.toFixed(1)}%` : `${pos ? "+" : ""}${v.toFixed(2)}pp`}</span>
            </div>
          );
        })}
      </div>
      <ReadMore>
        For DAFW, Major Head <strong>2401 Crop Husbandry</strong> dwarfs everything (PM-KISAN + interest subvention live here),
        followed by <strong>3601 Grants-in-aid to States</strong> and <strong>2552 NE Areas</strong>. For DARE, <strong>2415 Agricultural Research</strong>
        carries ~93% of the demand — almost the entire ICAR system. The "Δ Share YoY" view exposes structural shifts even when totals look flat.
      </ReadMore>
      <div className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">Related coverage</div>
      <LinksList links={insightLinks.majorHead} />
    </Card>
  );
}

// 5 — Expenditure Provision arithmetic
function ExpProvisionInsight() {
  const rows = AGRI_DEMANDS.map((no) => {
    const d = agriDemand(no)!;
    const total = getValue(d, "be2627", "total");
    const rec = Math.abs(getRec(no, "be2627"));
    return { d, total, rec, prov: total - rec };
  });
  return (
    <Card
      title={<><Definition term="expenditureProvision">Expenditure Provision</Definition> = Grand Total − Recoveries</>}
      subtitle="The actual net outflow from the Consolidated Fund."
    >
      <div className="space-y-3">
        {rows.map(({ d, total, rec, prov }) => (
          <div key={d.demandNo} className="rounded-sm border border-border p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.demandDesc}</div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-sm">
              <span className="tnum">{formatCrore(total, true)}</span>
              <span className="text-muted-foreground">−</span>
              <span className="tnum text-rose-700">{formatCrore(rec, true)}</span>
              <span className="text-muted-foreground">=</span>
              <span className="tnum font-bold text-primary text-base">{formatCrore(prov, true)}</span>
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              Recoveries are {total ? ((rec/total) * 100).toFixed(1) : "0.0"}% of gross — net provision is {total ? ((prov/total) * 100).toFixed(1) : "0.0"}% of headline.
            </div>
          </div>
        ))}
      </div>
      <ReadMore>
        The headline Grand Total in budget speeches is the gross figure. The <em>real</em> demand on the Consolidated Fund is the
        net Expenditure Provision after recoveries — and for DAFW that's roughly ₹1.3 L Cr lower than the headline. Always
        compare ministries on a net basis when judging fiscal weight.
      </ReadMore>
    </Card>
  );
}

export function AgriInsights() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-semibold">Insights · Ministry of Agriculture</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Five readings of the Agri budget — definitions, ratios, structural shifts, and curated coverage.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChargedVotedInsight />
        <RevCapYoYInsight />
        <RecoveriesInsight />
        <ExpProvisionInsight />
      </div>
      <MajorHeadInsight />
    </div>
  );
}
