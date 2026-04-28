import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, PanelLeft, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { TreemapView } from "@/components/explorer/TreemapView";
import { SunburstView } from "@/components/explorer/SunburstView";
import { SankeyView } from "@/components/explorer/SankeyView";
import { TableView } from "@/components/explorer/TableView";
import { MinistryDetailPanel } from "@/components/explorer/MinistryDetailPanel";
import {
  BUDGET_META,
  DDGS,
  DEMANDS,
  MINISTRIES,
  TRANSFERS,
  ministryById,
} from "@/lib/budget-data";
import { formatCr } from "@/lib/format";
import type { FY } from "@/data/types";

const Explorer = () => {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const initView = params.get("view") ?? "treemap";
  const initMinistry = params.get("ministry");

  const [view, setView] = useState(initView);
  const [fy, setFy] = useState<FY>("FY26");
  const [selectedId, setSelectedId] = useState<string | null>(initMinistry);
  const [q, setQ] = useState("");
  const [sortBySize, setSortBySize] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const next = new URLSearchParams(params);
    next.set("view", view);
    if (selectedId) next.set("ministry", selectedId);
    else next.delete("ministry");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedId]);

  const sortedMinistries = useMemo(() => {
    const list = [...MINISTRIES];
    if (sortBySize) list.sort((a, b) => (b.totals[fy] ?? 0) - (a.totals[fy] ?? 0));
    else list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [fy, sortBySize]);

  const filteredList = useMemo(
    () =>
      sortedMinistries.filter(
        (m) =>
          !q.trim() ||
          m.name.toLowerCase().includes(q.toLowerCase()) ||
          (m.short ?? "").toLowerCase().includes(q.toLowerCase()),
      ),
    [sortedMinistries, q],
  );

  const selected = selectedId ? ministryById(selectedId) ?? null : null;

  const pickMinistry = (id: string) => {
    if (id === "magri") {
      navigate("/explorer/ministry/magri");
      return;
    }
    setSelectedId(id);
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Page header */}
        <section className="border-b border-border">
          <div className="container py-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-primary font-medium">Explorer</div>
              <h1 className="mt-2 font-serif text-3xl md:text-4xl font-semibold leading-tight">
                Union Budget — {fy}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {MINISTRIES.length} ministries · Total {formatCr(BUDGET_META.totalUnionBudgetCr)}
              </p>
            </div>
            <div className="inline-flex rounded-sm border border-border overflow-hidden text-sm">
              {(["FY26", "FY27"] as FY[]).map((y) => (
                <button
                  key={y}
                  onClick={() => setFy(y)}
                  className={`px-4 py-2 font-medium transition-colors ${
                    fy === y ? "bg-foreground text-background" : "bg-card hover:bg-muted"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-8">
          {view === "treemap" ? (
            // Treemap-led, full-bleed layout with collapsible drawer + conditional detail panel.
            <div className="relative">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <button
                  onClick={() => setDrawerOpen((s) => !s)}
                  className="inline-flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                  aria-expanded={drawerOpen}
                >
                  <PanelLeft className="h-3.5 w-3.5" />
                  {drawerOpen ? "Hide ministries" : "Browse ministries"}
                </button>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="hidden sm:inline">Other views:</span>
                  <div className="inline-flex rounded-sm border border-border overflow-hidden">
                    {(["sunburst", "sankey", "table"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className="px-2.5 py-1 hover:bg-muted transition-colors capitalize"
                      >
                        {v === "sankey" ? "Sankey" : v}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className={`grid gap-6 transition-[grid-template-columns] duration-200 ${
                  drawerOpen
                    ? "lg:grid-cols-[260px_1fr]"
                    : "lg:grid-cols-[0_1fr]"
                } ${selectedId ? "xl:grid-cols-[var(--rail)_1fr_340px]" : ""}`}
                style={
                  {
                    // @ts-ignore custom prop for tailwind arbitrary
                    "--rail": drawerOpen ? "260px" : "0px",
                  } as React.CSSProperties
                }
              >
                {/* Drawer rail */}
                {drawerOpen && (
                  <aside className="space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        Ministries
                      </div>
                      <button
                        onClick={() => setDrawerOpen(false)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Close ministries drawer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search ministries"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        className="pl-8 h-9"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{filteredList.length} of {MINISTRIES.length}</span>
                      <button
                        onClick={() => setSortBySize(!sortBySize)}
                        className="hover:text-foreground"
                      >
                        Sort: {sortBySize ? "by size" : "A-Z"}
                      </button>
                    </div>
                    <div className="max-h-[520px] overflow-y-auto rounded-sm border border-border bg-card">
                      <ul className="divide-y divide-border">
                        {filteredList.map((m) => {
                          const v = m.totals[fy] ?? 0;
                          const active = selectedId === m.id;
                          return (
                            <li key={m.id}>
                              <button
                                onClick={() => pickMinistry(m.id)}
                                className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors ${
                                  active ? "bg-muted" : ""
                                }`}
                              >
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className={`text-sm leading-tight ${active ? "font-semibold text-primary" : ""}`}>
                                    {m.short ?? m.name}
                                  </span>
                                  <span className="font-mono text-[10px] text-muted-foreground tnum whitespace-nowrap">
                                    {formatCr(v, { compact: true })}
                                  </span>
                                </div>
                                {m.ddgAvailable && (
                                  <span className="mt-1 inline-block rounded-sm bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-medium">
                                    DDG
                                  </span>
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </aside>
                )}

                {/* Center: treemap full-bleed */}
                <div className="min-w-0">
                  <TreemapView
                    ministries={MINISTRIES}
                    demands={DEMANDS}
                    ddgs={DDGS}
                    fy={fy}
                    totalBudget={BUDGET_META.totalUnionBudgetCr}
                    selectedId={selectedId ?? undefined}
                    onMinistryFocus={(id) => setSelectedId(id)}
                  />
                </div>

                {/* Right: detail panel — conditional, only after a ministry is in focus */}
                {selectedId && (
                  <div className="xl:col-start-3 xl:row-start-1">
                    <div className="xl:sticky xl:top-20">
                      <MinistryDetailPanel ministry={selected} fy={fy} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Other views — keep classic 3-column layout for context.
            <div className="grid gap-6 lg:grid-cols-[260px_1fr_340px]">
              {/* Left: ministry rail */}
              <aside className="space-y-3 order-2 lg:order-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search ministries"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="pl-8 h-9"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{filteredList.length} of {MINISTRIES.length}</span>
                  <button
                    onClick={() => setSortBySize(!sortBySize)}
                    className="hover:text-foreground"
                  >
                    Sort: {sortBySize ? "by size" : "A-Z"}
                  </button>
                </div>
                <div className="max-h-[520px] overflow-y-auto rounded-sm border border-border bg-card">
                  <ul className="divide-y divide-border">
                    {filteredList.map((m) => {
                      const v = m.totals[fy] ?? 0;
                      const active = selectedId === m.id;
                      return (
                        <li key={m.id}>
                          <button
                            onClick={() => pickMinistry(m.id)}
                            className={`w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors ${
                              active ? "bg-muted" : ""
                            }`}
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <span className={`text-sm leading-tight ${active ? "font-semibold text-primary" : ""}`}>
                                {m.short ?? m.name}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground tnum whitespace-nowrap">
                                {formatCr(v, { compact: true })}
                              </span>
                            </div>
                            {m.ddgAvailable && (
                              <span className="mt-1 inline-block rounded-sm bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-medium">
                                DDG
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </aside>

              <div className="order-1 lg:order-2 min-w-0">
                <Tabs value={view} onValueChange={setView}>
                  <TabsList className="bg-secondary/60">
                    <TabsTrigger value="treemap">Treemap</TabsTrigger>
                    <TabsTrigger value="sunburst">Sunburst</TabsTrigger>
                    <TabsTrigger value="sankey">Sankey · Centre→State</TabsTrigger>
                    <TabsTrigger value="table">Table</TabsTrigger>
                  </TabsList>
                  <TabsContent value="sunburst" className="mt-4">
                    <SunburstView
                      ministries={MINISTRIES}
                      demands={DEMANDS}
                      ddgs={DDGS}
                      fy={fy}
                      onSelect={setSelectedId}
                      totalBudget={BUDGET_META.totalUnionBudgetCr}
                    />
                    <p className="mt-3 text-xs text-muted-foreground">
                      Inner ring: ministries. Middle: demands. Outer: major heads (where DDG is live).
                    </p>
                  </TabsContent>
                  <TabsContent value="sankey" className="mt-4">
                    <SankeyView ministries={MINISTRIES} transfers={TRANSFERS} />
                  </TabsContent>
                  <TabsContent value="table" className="mt-4">
                    <TableView
                      ministries={MINISTRIES}
                      fy={fy}
                      onSelect={setSelectedId}
                      totalBudget={BUDGET_META.totalUnionBudgetCr}
                    />
                  </TabsContent>
                </Tabs>
              </div>

              <div className="order-3">
                <div className="lg:sticky lg:top-20">
                  <MinistryDetailPanel ministry={selected} fy={fy} />
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Explorer;
