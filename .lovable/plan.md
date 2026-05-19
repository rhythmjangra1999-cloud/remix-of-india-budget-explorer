# Refine the stat + CTA bar

Upgrade the three-cell row on the homepage (Union Budget figure · Read Tutorial · Open Explorer) into a more editorial, newspaper-ledger composition. Layout, routes, palette family, and font families stay the same — only the composition, hierarchy, and micro-details change.

## Scope

File: `src/pages/Index.tsx` only (the grid block on lines ~47–61).

No changes to routes, data, colors in `index.css`, or other sections.

## Changes

1. Wrap the row in a top + bottom double editorial rule (thick-over-thin border, in `border-foreground`) to frame it like a masthead band.
2. Switch from `grid-cols-1 md:grid-cols-3` (equal) to `md:grid-cols-[1.5fr_1fr_1fr]` so the figure cell breathes and the two CTAs stay compact.
3. Cell 1 — figure: keep the existing `Stat` content but increase the figure size (`text-4xl md:text-5xl` serif) with "lakh crore" as a smaller, lighter serif span. Kicker stays sans uppercase tracked.
4. Cell 2 — Read Tutorial (`/methodology`): cream background (current `bg-primary/10`), add a small serif-italic kicker "Getting Started" above the label, label in serif semibold, terracotta arrow that translates up-right on hover. Large faint "01" numeral bottom-right as a watermark (uses `text-foreground/5`).
5. Cell 3 — Open Explorer (`/explorer`): primary terracotta background, sans uppercase tracked kicker "Interactive Suite", bold sans label, white arrow translating right on hover, faint "02" watermark in `text-white/10`.
6. All hover transitions use existing tokens (`hover:bg-primary/90`, etc.) — no new colors added.
7. Equalize cell min-height so the row feels architectural; arrows and watermarks animate with `transition-transform duration-500`.

## Out of scope

- No font additions; reuse `font-serif` / `font-sans` / `font-mono` already defined.
- No changes to the hero copy, history chart, problem statement, or tile grid below.
- No new components — inline the JSX in `Index.tsx`.
