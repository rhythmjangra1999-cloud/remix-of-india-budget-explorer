import flow from "@/data/budget-flow.json";

export function BudgetCycleTimeline() {
  const phases = flow.calendar;
  return (
    <div className="w-full overflow-x-auto -mx-6 px-6">
      <div className="min-w-[860px] grid grid-cols-6 gap-0 relative">
        {/* Connecting line */}
        <div className="absolute top-[34px] left-[8%] right-[8%] h-px bg-border" />

        {phases.map((p, i) => (
          <div key={p.phase} className="relative px-3">
            {/* Dot */}
            <div className="flex justify-center">
              <div
                className={`relative z-10 w-4 h-4 rounded-full border-2 ${
                  i === 2
                    ? "bg-primary border-primary"
                    : "bg-card border-muted-foreground/40"
                }`}
              />
            </div>
            {/* Phase label */}
            <div className="mt-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono text-center">
              {p.phase}
            </div>
            <div className="mt-1 font-serif text-base font-semibold text-center leading-tight">
              {p.title}
            </div>
            <p className="mt-2 text-xs text-foreground/70 leading-relaxed text-center">
              {p.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
