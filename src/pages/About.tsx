import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BUDGET_META } from "@/lib/budget-data";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <article className="container py-20">
          <header className="reading mx-auto">
            <div className="text-xs uppercase tracking-[0.16em] text-primary font-medium">About</div>
            <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight">
              A public tool to make the Union Budget legible.
            </h1>
            <p className="mt-6 text-lg text-foreground/75 leading-relaxed">
              Koshtha.AI is a non-commercial, open project. It exists to help
              journalists, researchers, students, and citizens find their way through a
              document that is large, technically formatted, and rarely explored below
              the headline numbers.
            </p>
          </header>

          <div className="reading mx-auto mt-12">
            <h2>What we cover</h2>
            <p>
              All 102 Demands for Grants from the Union Budget — grouped under
              {" "}{BUDGET_META.ministriesCovered} ministries and departments — are parsed
              and live, sourced directly from the official <em>Demands for Grants of
              Central Government 2026-2027</em> document. Detailed Demands for Grants
              (with object-head granularity) are live for three ministries — Ports,
              Shipping &amp; Waterways; Home Affairs; and the Department of Personnel
              and Training — with seven more planned for the next sprint.
            </p>

            <h2>How to cite</h2>
            <p>
              Please cite as: <em>Koshtha.AI, [year]. Source: Union Budget
              Demands for Grants, Ministry of Finance, GoI.</em> Always link to the
              underlying PDF where possible — confidence levels and limitations are
              described in the Tutorial.
            </p>

            <h2>Get in touch</h2>
            <p>
              Found an error, want a particular ministry prioritised, or want to
              contribute? We'd love to hear from you. The project is being built in the
              open and feedback shapes the roadmap.
            </p>
            <p className="mt-4">
              <a className="text-primary underline underline-offset-4" href="mailto:hello@indiabudget.example">
                hello@indiabudget.example
              </a>
            </p>

            <h2>Changelog</h2>
            <ul>
              <li><strong>v0.4</strong> — Real DG data wired in from Demands for Grants of Central Government 2026-27 (Feb 2026): all 102 demands across {BUDGET_META.ministriesCovered} ministries, with BE 2025-26, RE 2025-26 and BE 2026-27 figures.</li>
              <li><strong>v0.3</strong> — Site shell launched: Explorer (treemap, sunburst, sankey, table), Tutorial, Findings.</li>
              <li><strong>v0.2</strong> — DDG parsing complete for MoPSW, MHA, DoPT.</li>
              <li><strong>v0.1</strong> — DGs parsed for all 102 demands.</li>
            </ul>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
};

export default About;
