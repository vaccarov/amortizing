export interface LoanPaymentColumns {
  payment: number;
  principalPaid: number;
  interest: number;
  insurance: number;
}

export interface PaymentRow extends LoanPaymentColumns {
  balance: number;
}

export interface MonetaryColumns extends LoanPaymentColumns {
  income: number;
  cashflow: number;
}

export interface Row extends MonetaryColumns {
  month: number;
  date: Date;
  year: number;
  balanceStart: number;
  balanceEnd: number;
  isGrace: boolean;
}

export interface AmortizationResult {
  rows: Row[];
  M: number;
}

export interface YearSummary extends MonetaryColumns {
  balanceEnd: number;
  taxes: number;
  netCashflow: number;
}

export interface YearGroup {
  year: number;
  summary: YearSummary;
  rows: Row[];
}

export interface Params {
  loanAmount: number;
  annualRate: number;
  duration: number;
  insuranceRate: number;
  gracePeriod: number;
  startDate: string;
  grossYield: number;
  guaranteeFee: number;
  processingFee: number;
  brokerFee: number;
  taxRate: number;
  annualAppreciation: number;
}
