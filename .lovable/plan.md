
## Borrowing the best of "Where Does It All Go?" for the Explorer

The reference site (wheredoesitallgo.org) is loved for one thing: a **single, calm, drill-down treemap** where every tile says exactly three things — *what it is*, *how much*, and *what % of the total*. No chartjunk, no rails, no tabs competing for attention. We'll bring that energy into our Explorer while keeping our own multi-view depth tucked behind it.

### What changes

**1. Treemap becomes the headline view (and gets drillable)**
- Each tile shows: ministry name · ₹ amount · **% of Union Budget**, in that order, sized to fit.
- Click a tile → it **zooms in** to show that ministry's *Demands* as the new treemap (same look). Click a demand → if DDG data exists, drill to *major heads* → *object heads*. Otherwise show a friendly "object-head detail pending" card in place.
- A **breadcrumb** at the top: `Union Budget › Ministry of Home Affairs › Police` with click-back at every level.
- Persistent **running total** strip above the chart: `You are looking at ₹ X Lakh Cr · Y% of the Union Budget`.

**2. Calmer, more editorial tile styling**
- Warm sequential color ramp (already in palette) but **muted further** so labels read first, color second.
- Tile typography: serif for the name, mono for the number, small caps for the % — the wheredoesitallgo signature.
- Hover = subtle lift + tooltip with YoY delta vs FY26.

**3. Reorganize the page so the treemap can breathe**
- Move the **ministry search rail** into a slim collapsible drawer (icon button top-left of the chart). On desktop it's hidden by default; the treemap itself is the navigator.
- The **right detail panel** stays but only appears once you've drilled at least one level, or via the "Details" button on a tile. At the top level the chart is full-bleed.
- Tabs (Sunburst / Sankey / Table) move to a smaller secondary switcher under the breadcrumb labelled **"Other views"** — treemap is the default and feels like the product.

**4. "How to read this" inline coachmark**
- First-time visitors see a one-line ghost label on the largest tile: *"Click any tile to drill in →"*. Dismissable, remembered in localStorage.

**5. Tile percent label everywhere**
- The table view, sunburst tooltip, and detail panel all gain the **% of parent** alongside ₹ amount, so the mental model stays consistent across views.

**6. FY toggle gets a delta hint**
- Switching FY26 ↔ FY27 briefly flashes ↑/↓ arrows on tiles whose share changed by more than 0.5pp, then settles. Quick visual story of where money shifted.

### What stays the same
- The four views, the data files, the editorial palette and typography, the methodology/findings/about pages.
- All current functionality is preserved — just rearranged so the treemap leads.

### Files touched
- `src/components/explorer/TreemapView.tsx` — rewrite to support hierarchical drill, breadcrumb, % labels, zoom transitions.
- `src/pages/Explorer.tsx` — restructure layout: full-bleed chart, collapsible search drawer, conditional detail panel, secondary tab switcher.
- `src/components/explorer/MinistryDetailPanel.tsx` — small tweak so it can render at any drill level (ministry / demand / major-head).
- `src/components/explorer/TableView.tsx`, `SunburstView.tsx` — add `% of total` to tooltips/columns for consistency.
- New tiny `src/components/explorer/Breadcrumb.tsx`.

### Out of scope
- No new data, no backend, no new pages. Pure UX layer on the Explorer.
