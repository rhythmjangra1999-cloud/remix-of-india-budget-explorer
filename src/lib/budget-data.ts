import ministries from "@/data/ministries.json";
import demands from "@/data/demands.json";
import ddgs from "@/data/ddgs.json";
import transfers from "@/data/transfers.json";
import coverage from "@/data/coverage.json";
import findings from "@/data/findings.json";
import meta from "@/data/meta.json";
import type {
  Ministry,
  Demand,
  DDGRow,
  Transfer,
  CoverageRow,
  Finding,
  BudgetMeta,
  FY,
} from "@/data/types";

export const BUDGET_META = meta as BudgetMeta;
export const MINISTRIES = ministries as Ministry[];
export const DEMANDS = demands as Demand[];
export const DDGS = ddgs as DDGRow[];
export const TRANSFERS = transfers as Transfer[];
export const COVERAGE = coverage as CoverageRow[];
export const FINDINGS = findings as Finding[];

export function ministryById(id: string): Ministry | undefined {
  return MINISTRIES.find((m) => m.id === id);
}

export function demandsForMinistry(id: string): Demand[] {
  return DEMANDS.filter((d) => d.ministryId === id);
}

export function ddgsForDemand(demandId: string): DDGRow[] {
  return DDGS.filter((d) => d.demandId === demandId);
}

export function totalForMinistry(m: Ministry, fy: FY): number {
  return m.totals[fy] ?? 0;
}

export function unionTotalFromMinistries(fy: FY): number {
  return MINISTRIES.reduce((s, m) => s + (m.totals[fy] ?? 0), 0);
}
