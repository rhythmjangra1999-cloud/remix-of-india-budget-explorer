import { useCallback, useRef, useState } from "react";

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  value: string;
  sub?: string;
}

export function useChartTooltip() {
  const [tip, setTip] = useState<TooltipState>({ visible: false, x: 0, y: 0, title: "", value: "" });
  const containerRef = useRef<HTMLDivElement>(null);

  const show = useCallback((title: string, value: string, sub: string | undefined, event: MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({
      visible: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      title,
      value,
      sub,
    });
  }, []);

  const move = useCallback((event: MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip((t) => ({ ...t, x: event.clientX - rect.left, y: event.clientY - rect.top }));
  }, []);

  const hide = useCallback(() => setTip((t) => ({ ...t, visible: false })), []);

  const Tooltip = () => {
    if (!tip.visible) return null;
    const OFFSET = 14;
    const tipW = 220;
    const rect = containerRef.current?.getBoundingClientRect();
    const containerW = rect?.width ?? 800;
    const left = tip.x + OFFSET + tipW > containerW ? tip.x - tipW - OFFSET : tip.x + OFFSET;
    return (
      <div
        className="pointer-events-none absolute z-50 rounded-md border border-border bg-card shadow-lg px-3 py-2.5 text-sm"
        style={{ left, top: tip.y + OFFSET, width: tipW }}
      >
        <div className="font-medium leading-snug text-foreground">{tip.title}</div>
        <div className="mt-1 font-mono text-xs text-primary">{tip.value}</div>
        {tip.sub && <div className="mt-0.5 text-xs text-muted-foreground">{tip.sub}</div>}
      </div>
    );
  };

  return { containerRef, show, move, hide, Tooltip };
}
