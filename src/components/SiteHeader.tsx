import { Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { GlobalSearch } from "@/components/GlobalSearch";

export function SiteHeader() {
  const linkClass =
    "text-sm tracking-wide text-foreground/70 hover:text-foreground transition-colors";
  const activeClass = "text-foreground font-medium";
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between gap-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground font-serif text-lg font-bold leading-none">
            ₹
          </div>
          <div className="leading-tight">
            <div className="font-serif text-base font-semibold">Koshtha</div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Trace the rupee
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-5">
        <nav className="hidden md:flex items-center gap-7">
          <NavLink to="/explorer" className={linkClass} activeClassName={activeClass}>
            Explorer
          </NavLink>
          <NavLink to="/states" className={linkClass} activeClassName={activeClass}>
            States
          </NavLink>
          <NavLink to="/findings" className={linkClass} activeClassName={activeClass}>
            Findings
          </NavLink>
          <NavLink to="/builder" className={linkClass} activeClassName={activeClass}>
            Builder
          </NavLink>
          <NavLink to="/methodology" className={linkClass} activeClassName={activeClass}>
            Tutorial
          </NavLink>
          <NavLink to="/about" className={linkClass} activeClassName={activeClass}>
            About
          </NavLink>
        </nav>
        <GlobalSearch />
        </div>
      </div>
    </header>
  );
}
