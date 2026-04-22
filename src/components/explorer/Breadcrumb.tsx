import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  id: string;
  label: string;
  level: "root" | "ministry" | "demand" | "major";
}

interface Props {
  crumbs: Crumb[];
  onJump: (index: number) => void;
}

export function Breadcrumb({ crumbs, onJump }: Props) {
  return (
    <nav
      aria-label="Drill-down breadcrumb"
      className="flex flex-wrap items-center gap-1 text-sm"
    >
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <div key={c.id + i} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            {last ? (
              <span className="font-serif text-foreground truncate max-w-[28ch]">
                {i === 0 && <Home className="inline h-3.5 w-3.5 mr-1 -mt-0.5 text-muted-foreground" />}
                {c.label}
              </span>
            ) : (
              <button
                onClick={() => onJump(i)}
                className="text-muted-foreground hover:text-primary hover:underline underline-offset-4 truncate max-w-[24ch]"
              >
                {i === 0 && <Home className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />}
                {c.label}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
