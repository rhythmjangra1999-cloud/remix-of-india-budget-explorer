import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import ministries from "@/data/ministries.json";
import demands from "@/data/demands.json";
import schemes from "@/data/schemes.json";
import majorHeads from "@/data/dg-major-heads.json";

type Item = {
  key: string;
  label: string;
  sub?: string;
  type: "Ministry" | "Demand" | "Scheme" | "Major Head";
  url: string;
  haystack: string;
};

function highlight(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-foreground rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    for (const m of ministries as any[]) {
      const label = m.name as string;
      const short = (m.short as string | undefined) ?? "";
      out.push({
        key: `m:${m.id}`,
        label,
        sub: short || undefined,
        type: "Ministry",
        url: `/explorer?ministry=${encodeURIComponent(label)}`,
        haystack: `${label} ${short}`.toLowerCase(),
      });
    }
    for (const d of demands as any[]) {
      out.push({
        key: `d:${d.id}`,
        label: d.title,
        sub: `Demand ${d.number} · ${d.title}`,
        type: "Demand",
        url: `/explorer?demand=${d.number}`,
        haystack: `${String(d.title)} demand ${d.number}`.toLowerCase(),
      });
    }
    const seenScheme = new Set<string>();
    for (const s of schemes as any[]) {
      const name = s.schemeName as string;
      if (!name) continue;
      const k = `${s.schemeCode}:${name}`;
      if (seenScheme.has(k)) continue;
      seenScheme.add(k);
      out.push({
        key: `s:${k}`,
        label: name,
        sub: s.ministry,
        type: "Scheme",
        url: `/explorer?view=schemes`,
        haystack: name.toLowerCase(),
      });
    }
    const seenMH = new Set<string>();
    for (const r of majorHeads as any[]) {
      const k = `${r.mhCode}:${r.mhName}`;
      if (seenMH.has(k)) continue;
      seenMH.add(k);
      out.push({
        key: `mh:${k}`,
        label: r.mhName,
        sub: `Major Head ${r.mhCode}`,
        type: "Major Head",
        url: `/explorer`,
        haystack: `${r.mhName} ${r.mhCode}`.toLowerCase(),
      });
    }
    return out;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 0);
    const matches = items.filter((i) => i.haystack.includes(q));
    return matches.slice(0, 50);
  }, [items, query]);

  const grouped = useMemo(() => {
    const g: Record<Item["type"], Item[]> = {
      Ministry: [],
      Demand: [],
      Scheme: [],
      "Major Head": [],
    };
    for (const i of filtered) g[i.type].push(i);
    return g;
  }, [filtered]);

  const go = (url: string) => {
    setOpen(false);
    setQuery("");
    navigate(url);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open search"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background/50 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="hidden sm:inline pointer-events-none ml-2 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search ministries, demands, schemes, major heads…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim() === "" ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Start typing to search
            </div>
          ) : (
            <CommandEmpty>No results found.</CommandEmpty>
          )}
          {(["Ministry", "Demand", "Scheme", "Major Head"] as const).map(
            (type, idx) =>
              grouped[type].length > 0 && (
                <div key={type}>
                  {idx > 0 && <CommandSeparator />}
                  <CommandGroup heading={type}>
                    {grouped[type].map((item) => (
                      <CommandItem
                        key={item.key}
                        value={`${item.label} ${item.sub ?? ""} ${item.key}`}
                        onSelect={() => go(item.url)}
                        className="flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm">
                            {highlight(item.label, query.trim())}
                          </div>
                          {item.sub && (
                            <div className="truncate text-xs text-muted-foreground">
                              {highlight(item.sub, query.trim())}
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {item.type}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              ),
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
