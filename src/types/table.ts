import type { Row } from "./amortization";

export interface YearSummary {
  balanceEnd: number;
  payment: number;
  principalPaid: number;
  interest: number;
  insurance: number;
  income: number;
  cashflow: number;
  taxes: number;
}

export interface YearGroup {
  year: number;
  summary: YearSummary;
  rows: Row[];
}

export interface Totals {
  payment: number;
  principalPaid: number;
  interest: number;
  insurance: number;
  income: number;
  cashflow: number;
}
