import { Link } from "react-router-dom";
import { BUDGET_META } from "@/lib/budget-data";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/30">
      <div className="container py-12 grid gap-10 md:grid-cols-4 text-sm">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-primary-foreground font-serif font-bold leading-none">
              ₹
            </div>
            <span className="font-serif text-base font-semibold">Koshtha.AI</span>
          </div>
          <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
            A public, non-commercial tool for journalists, researchers, and citizens to
            explore the Union Budget of India. Source figures are drawn from the Demands
            for Grants and Detailed DGs published by the Ministry of Finance.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Explore</div>
          <ul className="mt-3 space-y-2">
            <li><Link className="hover:text-primary" to="/explorer">Explorer</Link></li>
            <li><Link className="hover:text-primary" to="/findings">Findings</Link></li>
            <li><Link className="hover:text-primary" to="/methodology">Tutorial</Link></li>
            <li><Link className="hover:text-primary" to="/about">About</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Data</div>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>Latest: <span className="text-foreground">{BUDGET_META.fy}</span></li>
            <li>Updated: <span className="text-foreground">{BUDGET_META.lastUpdated}</span></li>
            <li>
              <a className="hover:text-primary" href={BUDGET_META.sourceUrl} target="_blank" rel="noreferrer">
                indiabudget.gov.in ↗
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container py-5 flex flex-col md:flex-row gap-2 justify-between text-xs text-muted-foreground">
          <p>
            Figures are derived from public budget documents. Errors are possible — see
            Tutorial for confidence levels and known gaps.
          </p>
          <p>© {new Date().getFullYear()} Koshtha.AI · Open project</p>
        </div>
      </div>
    </footer>
  );
}
