const ROWS: {
  range: string;
  category: string;
  meaning: string;
  examples: string;
  nature: "Revenue" | "Capital";
}[] = [
  {
    range: "2000–2099",
    category: "General Services (Admin)",
    meaning: "Running the government machinery",
    examples: "2052 Secretariat · 2055 Police · 2059 Public Works",
    nature: "Revenue",
  },
  {
    range: "2200–2299",
    category: "Social Services",
    meaning: "Spending on people — health, education, welfare",
    examples: "2202 Education · 2210 Health · 2235 Welfare",
    nature: "Revenue",
  },
  {
    range: "2400–2499",
    category: "Agriculture & Allied",
    meaning: "Food systems, farming economy",
    examples: "2401 Crop Husbandry · 2403 Animal Husbandry",
    nature: "Revenue",
  },
  {
    range: "2500–2599",
    category: "Rural Development",
    meaning: "Village economy, livelihoods",
    examples: "2501 Rural Programmes · 2515 Rural Development",
    nature: "Revenue",
  },
  {
    range: "2700–2799",
    category: "Irrigation & Water",
    meaning: "Water systems, flood control",
    examples: "2701 Irrigation · 2711 Flood Control",
    nature: "Revenue",
  },
  {
    range: "2800–2899",
    category: "Energy & Industry",
    meaning: "Power, industrial growth",
    examples: "2801 Power · 2852 Industries",
    nature: "Revenue",
  },
  {
    range: "3000–3299",
    category: "Transport & Communication",
    meaning: "Movement infrastructure",
    examples: "3053 Aviation · 3054 Roads · 3225 Telecom",
    nature: "Revenue",
  },
  {
    range: "3400–3499",
    category: "Economic & Scientific Services",
    meaning: "Policy, research, economic admin",
    examples: "3401 Atomic Energy · 3425 Research · 3451 Secretariat (Economic)",
    nature: "Revenue",
  },
  {
    range: "3600–3699",
    category: "Transfers to States / UTs",
    meaning: "Fiscal redistribution",
    examples: "3601 Grants to States · 3602 Grants to UTs",
    nature: "Revenue",
  },
  {
    range: "4000–4999",
    category: "Capital Outlay (Social & Economic)",
    meaning: "Asset creation in sectors",
    examples: "4210 Health Infra · 4401 Agriculture Infra",
    nature: "Capital",
  },
  {
    range: "5000–5999",
    category: "Capital Outlay (Infrastructure)",
    meaning: "Large infrastructure investments",
    examples: "5054 Roads · 5053 Aviation",
    nature: "Capital",
  },
  {
    range: "6000–6999",
    category: "Loans & Debt (Capital)",
    meaning: "Lending & financial support",
    examples: "6801 Power Loans · 6408 Food Loans",
    nature: "Capital",
  },
  {
    range: "7000–7999",
    category: "Advances & Other Loans",
    meaning: "Financial flows, advances",
    examples: "7465 Loans · 7601 State Advances",
    nature: "Capital",
  },
];

export function MajorHeadSeries() {
  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-mono">
          Reference · Major Head series
        </div>
        <div className="font-serif text-lg font-semibold mt-1">
          What the 4-digit Major Head numbers mean
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Every Major Head sits in a numbered series. The first digit tells you whether it is{" "}
          <span className="font-medium text-foreground/80">Revenue</span> (2xxx–3xxx) or{" "}
          <span className="font-medium text-foreground/80">Capital</span> (4xxx–7xxx); the next
          digits group it by sector.
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium font-mono text-xs uppercase tracking-wider">
                Series
              </th>
              <th className="px-4 py-3 font-medium font-mono text-xs uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 font-medium font-mono text-xs uppercase tracking-wider">
                What it really means
              </th>
              <th className="px-4 py-3 font-medium font-mono text-xs uppercase tracking-wider">
                Example heads
              </th>
              <th className="px-4 py-3 font-medium font-mono text-xs uppercase tracking-wider text-right">
                Nature
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ROWS.map((r) => (
              <tr key={r.range} className="hover:bg-muted/30 align-top">
                <td className="px-4 py-3 font-mono tabular-nums text-foreground/90 whitespace-nowrap">
                  {r.range}
                </td>
                <td className="px-4 py-3 font-serif font-medium">{r.category}</td>
                <td className="px-4 py-3 text-foreground/80">{r.meaning}</td>
                <td className="px-4 py-3 text-xs text-foreground/70 font-mono leading-relaxed">
                  {r.examples}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span
                    className={
                      "inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border " +
                      (r.nature === "Revenue"
                        ? "border-primary/30 text-primary bg-primary/5"
                        : "border-accent/40 text-accent-foreground bg-accent/10")
                    }
                  >
                    {r.nature}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
        Revenue heads cover recurring spending (salaries, subsidies, interest); Capital heads
        cover asset creation and lending.
      </div>
    </div>
  );
}
