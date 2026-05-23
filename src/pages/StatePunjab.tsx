import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import pbDepts from "@/data/states/punjab/punjab-departments.json";

interface Dept { name: string; slug: string; status: "live" | "placeholder"; grants?: string }
const DEPTS = pbDepts.departments as Dept[];

function DeptCard({ d }: { d: Dept }) {
  const live = d.status === "live";
  const inner = (
    <div className={`group border border-border bg-card p-4 h-full flex flex-col justify-between transition-colors ${live ? "hover:border-primary hover:bg-primary/5" : "opacity-70"}`}>
      <div>
        <div className="font-serif text-[15px] font-semibold leading-tight">{d.name}</div>
        {d.grants && <div className="mt-1 text-[11px] text-muted-foreground">Grants {d.grants}</div>}
      </div>
      <div className="mt-3">
        {live ? (
          <span className="inline-flex items-center rounded-sm bg-primary/10 text-primary px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium">Live</span>
        ) : (
          <span className="inline-flex items-center rounded-sm bg-muted text-muted-foreground px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium">Placeholder</span>
        )}
      </div>
    </div>
  );
  return live ? <Link to={`/states/punjab/${d.slug}`}>{inner}</Link> : <div>{inner}</div>;
}

export default function StatePunjab() {
  const live = DEPTS.filter((d) => d.status === "live").length;
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border">
          <div className="container py-6">
            <Link to="/states" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> All states & UTs
            </Link>
          </div>
        </section>
        <section className="border-b border-border">
          <div className="container py-10 md:py-14 text-left">
            <div className="text-xs uppercase tracking-[0.16em] text-primary font-medium">State Budget · Punjab · 2026-27</div>
            <h1 className="mt-3 font-serif text-3xl md:text-5xl font-semibold leading-tight">
              ਪੰਜਾਬ — the state ledger.
            </h1>
            <p className="mt-4 max-w-3xl font-serif text-base md:text-xl leading-relaxed text-foreground/85">
              Punjab's budget runs through ~{DEPTS.length} departments and several dozen Demands for Grants.
              We're publishing them department-by-department. Today {live} is live — Agriculture &amp; Horticulture (Demands 1 and 34) —
              with the rest as placeholders while their PDFs are normalised.
            </p>
          </div>
        </section>

        <section>
          <div className="container py-10 text-left">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{DEPTS.length} departments · {live} live</div>
            <h2 className="mt-2 font-serif text-2xl md:text-3xl font-semibold">Departments</h2>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px bg-border">
              {DEPTS.map((d) => <DeptCard key={d.slug} d={d} />)}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
