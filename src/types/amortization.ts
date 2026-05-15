export interface Row {
  month: number;
  date: Date;
  year: number;
  balanceStart: number;
  balanceEnd: number;
  payment: number;
  principalPaid: number;
  interest: number;
  insurance: number;
  income: number;
  cashflow: number;
  isGrace: boolean;
}

export interface AmortizationResult {
  rows: Row[];
  M: number;
}

export interface AmortizationParams {
  loanAmount: number;
  annualRate: number;
  duration: number;
  insuranceRate: number;
  gracePeriod: number;
  startDate: string;
  grossYield: number;
}
