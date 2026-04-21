// Indian currency formatting in ₹ Cr / Lakh Cr.

export function formatCr(amountCr: number, opts?: { compact?: boolean }): string {
  if (amountCr == null || isNaN(amountCr)) return "—";
  const abs = Math.abs(amountCr);
  if (abs >= 1_00_000) {
    // ≥ 1 Lakh Cr
    return `₹${(amountCr / 1_00_000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Lakh Cr`;
  }
  if (opts?.compact && abs >= 1000) {
    return `₹${(amountCr / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 })}k Cr`;
  }
  return `₹${amountCr.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
}

export function formatPct(num: number, denom: number): string {
  if (!denom) return "—";
  return `${((num / denom) * 100).toFixed(num / denom < 0.01 ? 2 : 1)}%`;
}

export function formatYoY(prev?: number, curr?: number): { text: string; positive: boolean | null } {
  if (prev == null || curr == null || prev === 0) return { text: "—", positive: null };
  const delta = ((curr - prev) / prev) * 100;
  return { text: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`, positive: delta >= 0 };
}
