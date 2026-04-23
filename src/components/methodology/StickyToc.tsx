import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  label: string;
}

interface Props {
  items: TocItem[];
}

export function StickyToc({ items }: Props) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
    );
    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      {/* Desktop: sticky right rail */}
      <nav
        aria-label="On this page"
        className="hidden lg:block sticky top-24 self-start w-56 shrink-0"
      >
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium mb-3">
          On this page
        </div>
        <ul className="space-y-1.5 border-l border-border">
          {items.map((it) => (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                className={cn(
                  "block pl-4 -ml-px border-l py-1 text-sm transition-colors",
                  active === it.id
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile: jump-to dropdown */}
      <div className="lg:hidden sticky top-16 z-30 bg-background/95 backdrop-blur border-y border-border -mx-6 px-6 py-2">
        <select
          aria-label="Jump to section"
          value={active}
          onChange={(e) => {
            const id = e.target.value;
            setActive(id);
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="w-full bg-transparent text-sm font-medium border-0 focus:ring-0 outline-none"
        >
          {items.map((it) => (
            <option key={it.id} value={it.id}>
              Jump to: {it.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
