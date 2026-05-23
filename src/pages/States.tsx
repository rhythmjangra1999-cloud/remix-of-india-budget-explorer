import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import statesData from "@/data/states/states-index.json";

interface StateEntry {
  name: string; slug: string; type: "state" | "ut";
  status: "live" | "placeholder"; live?: string[];
}

const STATES = (statesData.states as StateEntry[]);

function StateCard({ s }: { s: StateEntry }) {
  const live = s.status === "live";
  const inner = (
    <div className={`group border border-border bg-card p-5 h-full flex flex-col justify-between transition-colors ${live ? "hover:border-primary hover:bg-primary/5" : "opacity-70"}`}>
      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {s.type === "ut" ? "Union Territory" : "State"}
        </div>
        <div className="mt-2 font-serif text-lg font-semibold leading-tight">{s.name}</div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {live ? (
          <>
            <span className="inline-flex items-center rounded-sm bg-primary/10 text-primary px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium">Live</span>
            {s.live?.map((k) => (
              <span key={k} className="text-[11px] text-muted-foreground">· {k}</span>
            ))}
          </>
        ) : (
          <span className="inline-flex items-center rounded-sm bg-muted text-muted-foreground px-2 py-0.5 text-[10px] uppercase tracking-wider font-medium">Placeholder</span>
        )}
      </div>
    </div>
  );
  return live ? <Link to={`/states/${s.slug}`}>{inner}</Link> : <div>{inner}</div>;
}

export default function States() {
  const states = STATES.filter((s) => s.type === "state");
  const uts = STATES.filter((s) => s.type === "ut");
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border">
          <div className="container py-10 md:py-14 text-left">
            <div className="text-xs uppercase tracking-[0.16em] text-primary font-medium">States & Union Territories</div>
            <h1 className="mt-3 font-serif text-3xl md:text-5xl font-semibold leading-tight">
              The other half of the rupee.
            </h1>
            <p className="mt-4 max-w-3xl font-serif text-base md:text-xl leading-relaxed text-foreground/85">
              India's fiscal story is written on two desks — the Union, and 36 sub-national governments.
              This is the state-and-UT side of the ledger: 28 states, 8 UTs, hundreds of demands, thousands of
              detailed heads. We're opening these one at a time, starting with <strong>Uttar Pradesh · Agriculture</strong>.
            </p>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="container py-10 text-left">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">28 States</div>
            <h2 className="mt-2 font-serif text-2xl md:text-3xl font-semibold">States</h2>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px bg-border">
              {states.map((s) => <StateCard key={s.slug} s={s} />)}
            </div>
          </div>
        </section>

        <section>
          <div className="container py-10 text-left">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">8 Union Territories</div>
            <h2 className="mt-2 font-serif text-2xl md:text-3xl font-semibold">Union Territories</h2>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px bg-border">
              {uts.map((s) => <StateCard key={s.slug} s={s} />)}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
