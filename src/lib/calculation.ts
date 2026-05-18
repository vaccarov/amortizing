import type {
  AmortizationResult,
  MonetaryColumns,
  Params,
  PaymentRow,
  Row,
  TriParams,
  YearGroup,
  YearSummary,
} from "@/types";
import { SOCIAL_CONTRIBUTIONS } from "./constants";
import { addMonths, parseDate, toAnnualRate } from "./format";

function newton(
  f: (x: number) => number,
  fprime: (x: number) => number,
  guess: number,
  tolerance = 1e-12,
): number {
  let x = guess;
  for (let i = 0; i < 200; i++) {
    const fx = f(x);
    if (Math.abs(fx) < tolerance) return x;
    const fpx = fprime(x);
    if (Math.abs(fpx) < 1e-15) break;
    const step = fx / fpx;
    x -= step;
    if (Math.abs(step) < 1e-14 * (1 + Math.abs(x))) return x;
  }
  return Math.abs(f(x)) < 1e-6 ? x : NaN;
}

function findMonthlyRate(payments: number[], netLoan: number): number {
  if (netLoan <= 0 || payments.length === 0 || payments.every((p) => p <= 0)) return 0;

  const f = (r: number) => {
    let sum = 0;
    for (let k = 1; k <= payments.length; k++) sum += payments[k - 1] / (1 + r) ** k;
    return netLoan - sum;
  };

  const fprime = (r: number) => {
    let sum = 0;
    for (let k = 1; k <= payments.length; k++) {
      sum += (k * payments[k - 1]) / (1 + r) ** (k + 1);
    }
    return sum;
  };

  const lo = -0.001;
  const hi = 0.1;
  const fallback = 0.005;
  const flo = f(lo);
  let _lo = lo;
  let _hi = hi;
  let guess = fallback;

  if (flo * f(_hi) < 0) {
    for (let i = 0; i < 50; i++) {
      const mid = (_lo + _hi) / 2;
      if (_hi - _lo < 1e-10) break;
      if (f(mid) * flo <= 0) _hi = mid;
      else _lo = mid;
    }
    guess = (_lo + _hi) / 2;
  }

  const rate = newton(f, fprime, guess);
  return !Number.isNaN(rate) && rate > 0 ? rate : 0;
}

export function computePaymentRows(
  loanAmount: number,
  monthlyRate: number,
  monthlyInsuranceRate: number,
  duration: number,
  gracePeriod: number,
): { rows: PaymentRow[]; M: number } {
  if (monthlyRate <= 0 || loanAmount <= 0 || duration <= 0) return { rows: [], M: 0 };

  const M = (loanAmount * monthlyRate) / (1 - (1 + monthlyRate) ** -duration);
  const rows: PaymentRow[] = [];
  let balance = loanAmount;

  for (let i = 1; i <= duration + gracePeriod; i++) {
    const isGrace = i <= gracePeriod;
    const interest = balance * monthlyRate;
    const insurance = balance * monthlyInsuranceRate;
    let principalPaid = 0;

    if (!isGrace) {
      const amortI = i - gracePeriod;
      principalPaid = amortI === duration ? Math.max(0, balance) : M - interest;
    }

    balance -= principalPaid;
    rows.push({
      interest,
      principalPaid,
      insurance,
      balance,
      payment: interest + principalPaid + insurance,
    });
  }

  return { rows, M };
}

export function calculateAPR(params: {
  loanAmount: number;
  annualRate: number;
  duration: number;
  insuranceRate: number;
  gracePeriod: number;
  fees: number;
  paymentRows: PaymentRow[];
}): { taeg: number; taegHA: number; taea: number } {
  const { loanAmount, annualRate, duration, fees, paymentRows } = params;

  if (paymentRows.length === 0 || annualRate / 100 / 12 <= 0 || loanAmount <= 0 || duration <= 0) {
    return { taeg: 0, taegHA: 0, taea: 0 };
  }

  const netLoan = loanAmount - fees;
  const rHA = findMonthlyRate(
    paymentRows.map((r) => r.interest + r.principalPaid),
    netLoan,
  );
  const rTotal = findMonthlyRate(
    paymentRows.map((r) => r.payment),
    netLoan,
  );

  const taegHA = rHA > 0 ? toAnnualRate(rHA) : 0;
  const taeg = rTotal > 0 ? toAnnualRate(rTotal) : 0;
  const taea = taeg > 0 && taegHA > 0 ? taeg - taegHA : 0;

  return { taeg, taegHA, taea };
}

// Le TRI résout : invest = Σ cf[k] / (1+r)^(k+1)
export function computeTRI(
  cashflows: number[],
  finalValue: number,
  initialInvestment: number,
): number {
  if (cashflows.length === 0) return 0;
  if (initialInvestment <= 0) return 999;

  const cf = [...cashflows];
  cf[cf.length - 1] += finalValue;

  const rate = findMonthlyRate(cf, initialInvestment);
  return rate > 0 ? toAnnualRate(rate) : 0;
}

export function compute(
  params: Params,
  paymentRows: PaymentRow[],
  M: number,
): AmortizationResult | null {
  if (paymentRows.length === 0 || M === 0) return null;

  const { loanAmount, gracePeriod, startDate, grossYield, vestingPeriod } = params;
  const start = parseDate(startDate);
  const monthlyIncome = (loanAmount * ((grossYield * 0.8) / 100)) / 12;

  const rows: Row[] = paymentRows.map((pr, i) => {
    const month = i + 1;
    const date = addMonths(start, month);
    const income = month > vestingPeriod ? monthlyIncome : 0;
    return {
      month,
      date,
      year: date.getFullYear(),
      balanceStart: pr.balance + pr.principalPaid,
      balanceEnd: pr.balance,
      payment: pr.payment,
      principalPaid: pr.principalPaid,
      interest: pr.interest,
      insurance: pr.insurance,
      income,
      cashflow: income - pr.payment,
      isGrace: month <= gracePeriod,
    };
  });

  return { rows, M };
}

function getTaxRates(tmi: number, avgTaxRate: number) {
  return {
    euTaxRate: Math.max(0, tmi - avgTaxRate),
    frTaxRate: tmi + SOCIAL_CONTRIBUTIONS,
  };
}

function computeTaxes(
  income: number,
  interest: number,
  taxParams: Pick<Params, "europeanScpiPercent" | "tmi" | "avgTaxRate">,
): number {
  const netIncome = Math.max(0, income - interest);
  const { euTaxRate, frTaxRate } = getTaxRates(taxParams.tmi, taxParams.avgTaxRate);
  const euRatio = taxParams.europeanScpiPercent / 100;
  const euNetIncome = netIncome * euRatio;
  const frNetIncome = netIncome - euNetIncome;
  return euNetIncome * (euTaxRate / 100) + frNetIncome * (frTaxRate / 100);
}

export function buildYearGroups(
  rows: Row[],
  taxParams: Pick<Params, "tmi" | "avgTaxRate" | "europeanScpiPercent">,
  triParams: TriParams,
): YearGroup[] {
  const map = new Map<number, Row[]>();
  for (const row of rows) {
    if (!map.has(row.year)) map.set(row.year, []);
    map.get(row.year)?.push(row);
  }

  const yearEntries = Array.from(map.entries()).sort(([a], [b]) => a - b);
  const cumulative: number[] = [];

  return yearEntries.map(([year, yearRows]) => {
    const sum = (key: keyof Row) => yearRows.reduce((acc, r) => acc + (r[key] as number), 0);

    const cashflows = yearRows.map((r) => r.cashflow);
    cumulative.push(...cashflows);

    const lastRow = yearRows[yearRows.length - 1];
    const yearsElapsed = lastRow.month / 12;
    const propertyValue =
      triParams.loanAmount * (1 + triParams.annualAppreciation / 100) ** yearsElapsed;
    const finalValue = propertyValue - lastRow.balanceEnd;
    const tri = computeTRI(cumulative, finalValue, triParams.initialInvestment);

    const income = sum("income");
    const interest = sum("interest");
    const taxes = computeTaxes(income, interest, taxParams);

    const summary: YearSummary = {
      balanceEnd: lastRow.balanceEnd,
      payment: sum("payment"),
      principalPaid: sum("principalPaid"),
      interest,
      insurance: sum("insurance"),
      income,
      cashflow: sum("cashflow"),
      taxes,
      netCashflow: sum("cashflow") - taxes,
      tri,
    };

    return { year, rows: yearRows, summary };
  });
}

export function computeBlendedTaxRate(
  tmi: number,
  avgTaxRate: number,
  europeanScpiPercent: number,
): number {
  const { euTaxRate, frTaxRate } = getTaxRates(tmi, avgTaxRate);
  const euRatio = europeanScpiPercent / 100;
  const frRatio = 1 - euRatio;
  return euRatio * euTaxRate + frRatio * frTaxRate;
}

export function computeTotals(rows: Row[]): MonetaryColumns {
  const sum = (key: keyof Row) => rows.reduce((acc, r) => acc + (r[key] as number), 0);

  return {
    payment: sum("payment"),
    principalPaid: sum("principalPaid"),
    interest: sum("interest"),
    insurance: sum("insurance"),
    income: sum("income"),
    cashflow: sum("cashflow"),
  };
}
