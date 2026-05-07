import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

export interface TourStep {
  target: string; // CSS attribute selector value used as data-tour
  title: string;
  body: string;
  onEnter?: () => void;
}

interface TourCtx {
  start: (steps: TourStep[]) => void;
  stop: () => void;
}

const Ctx = createContext<TourCtx | null>(null);

export function useTour() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTour outside provider");
  return c;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [steps, setSteps] = useState<TourStep[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const start = useCallback((s: TourStep[]) => {
    setSteps(s);
    setIdx(0);
  }, []);
  const stop = useCallback(() => setSteps(null), []);

  const step = steps?.[idx] ?? null;

  // run onEnter side effect (e.g. switch journey step)
  useEffect(() => {
    if (step?.onEnter) step.onEnter();
  }, [step]);

  // measure target
  useEffect(() => {
    if (!step) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // wait a beat for scroll
        setTimeout(() => setRect(el.getBoundingClientRect()), 350);
      } else {
        setRect(null);
      }
    };
    measure();
    const onResize = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [step]);

  // keyboard
  useEffect(() => {
    if (!steps) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop();
      else if (e.key === "ArrowRight" || e.key === " ") setIdx((i) => Math.min(steps.length - 1, i + 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steps, stop]);

  const value = useMemo(() => ({ start, stop }), [start, stop]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {steps && step && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* dim overlay with cutout */}
          {rect ? (
            <>
              <div className="absolute inset-0 bg-black/55 pointer-events-auto" onClick={stop} />
              <div
                className="absolute rounded-md ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] pointer-events-none transition-all"
                style={{
                  top: rect.top - 6,
                  left: rect.left - 6,
                  width: rect.width + 12,
                  height: rect.height + 12,
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 bg-black/55 pointer-events-auto" onClick={stop} />
          )}

          {/* tooltip */}
          <TourTooltip
            rect={rect}
            step={step}
            idx={idx}
            total={steps.length}
            onPrev={() => setIdx((i) => Math.max(0, i - 1))}
            onNext={() => idx === steps.length - 1 ? stop() : setIdx((i) => i + 1)}
            onClose={stop}
          />
        </div>
      )}
    </Ctx.Provider>
  );
}

function TourTooltip({
  rect, step, idx, total, onPrev, onNext, onClose,
}: {
  rect: DOMRect | null;
  step: TourStep;
  idx: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const style = useMemo<React.CSSProperties>(() => {
    if (!rect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const margin = 16;
    const tipW = 360;
    const below = rect.bottom + margin;
    const above = rect.top - margin;
    const useBelow = below + 200 < window.innerHeight || above < 200;
    let left = rect.left + rect.width / 2 - tipW / 2;
    left = Math.max(12, Math.min(window.innerWidth - tipW - 12, left));
    return useBelow
      ? { top: below, left, width: tipW }
      : { top: above, left, width: tipW, transform: "translateY(-100%)" };
  }, [rect]);

  return (
    <div
      className="absolute pointer-events-auto rounded-md border border-border bg-card shadow-xl p-4"
      style={style}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label="Close tour"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
        Step {idx + 1} of {total}
      </div>
      <h4 className="mt-1 font-serif text-base font-semibold">{step.title}</h4>
      <p className="mt-2 text-xs text-foreground/80 leading-relaxed">{step.body}</p>
      <div className="mt-3 flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={idx === 0}
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="rounded-sm bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90"
        >
          {idx === total - 1 ? "Finish" : "Next →"}
        </button>
      </div>
    </div>
  );
}
