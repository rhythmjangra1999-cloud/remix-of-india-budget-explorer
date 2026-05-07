import { Check } from "lucide-react";

export type JourneyStepId = "ministry" | "demands" | "majorheads" | "schemes" | "insights" | "tutorial" | "builder";

const STEPS: { id: JourneyStepId; label: string; sub: string }[] = [
  { id: "ministry",   label: "Ministry",     sub: "The big picture" },
  { id: "demands",    label: "Demands",      sub: "DAFW vs DARE" },
  { id: "majorheads", label: "Major Heads",  sub: "Where it goes" },
  { id: "schemes",    label: "Schemes",      sub: "How it reaches" },
  { id: "insights",   label: "Insights",     sub: "What it means" },
  { id: "tutorial",   label: "Tutorial",     sub: "Take the tour" },
  { id: "builder",    label: "Budget Analysis Builder", sub: "Build your own slice" },
];

interface Props {
  current: JourneyStepId;
  onChange: (id: JourneyStepId) => void;
}

export function JourneyStepper({ current, onChange }: Props) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div data-tour="stepper" className="border border-border rounded-md bg-card p-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        {STEPS.map((s, i) => {
          const isActive = i === currentIdx;
          const isDone = i < currentIdx;
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className={`text-left rounded-sm border px-3 py-2 transition-colors ${
                isActive
                  ? "border-primary bg-primary/5"
                  : isDone
                  ? "border-border bg-muted/40 hover:bg-muted"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDone
                      ? "bg-foreground/80 text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className={`text-xs font-medium ${isActive ? "text-primary" : ""}`}>{s.label}</span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground pl-7">{s.sub}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function JourneyNav({ current, onChange }: Props) {
  const idx = STEPS.findIndex((s) => s.id === current);
  const prev = idx > 0 ? STEPS[idx - 1] : null;
  const next = idx < STEPS.length - 1 ? STEPS[idx + 1] : null;
  return (
    <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
      {prev ? (
        <button
          onClick={() => onChange(prev.id)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← {prev.label}
        </button>
      ) : <div />}
      {next ? (
        <button
          onClick={() => onChange(next.id)}
          className="rounded-sm bg-primary text-primary-foreground px-4 py-2 text-xs font-medium hover:bg-primary/90"
        >
          Next: {next.label} →
        </button>
      ) : <div />}
    </div>
  );
}
