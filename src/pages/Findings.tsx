import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FINDINGS, ministryById } from "@/lib/budget-data";
import { formatCr } from "@/lib/format";

const Findings = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="container py-20">
          <header className="reading mx-auto">
            <div className="text-xs uppercase tracking-[0.16em] text-primary font-medium">Findings</div>
            <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight">
              Stories from the object-head data.
            </h1>
            <p className="mt-6 text-lg text-foreground/75 leading-relaxed">
              Short editorial notes surfacing patterns that are visible only when you go
              below the headline DG numbers — drawn from the three live ministries:
              MoPSW, MHA, and DoPT.
            </p>
          </header>

          <div className="mt-16 max-w-4xl mx-auto space-y-20">
            {FINDINGS.map((f) => {
              const m = ministryById(f.ministryId);
              return (
                <article key={f.id} id={f.id} className="scroll-mt-24">
                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    <span>{m?.name}</span>
                    <span>·</span>
                    <time>{new Date(f.date).toLocaleDateString("en-IN", { dateStyle: "long" })}</time>
                  </div>
                  <h2 className="mt-3 font-serif text-3xl md:text-4xl font-semibold leading-tight">
                    {f.title}
                  </h2>
                  <p className="mt-4 text-lg text-foreground/75 italic leading-relaxed">{f.dek}</p>
                  <div className="mt-6 reading">
                    <p>{f.body}</p>
                  </div>
                  {m && (
                    <div className="mt-8 flex flex-wrap items-center gap-4 rounded-sm border border-border bg-card p-5">
                      <div>
                        <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                          {m.name} · FY26 outlay
                        </div>
                        <div className="mt-1 font-serif text-2xl font-semibold tnum">
                          {formatCr(m.totals.FY26 ?? 0)}
                        </div>
                      </div>
                      <Link
                        to={`/explorer?ministry=${m.id}`}
                        className="ml-auto inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Explore {m.short ?? m.name} →
                      </Link>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Findings;
