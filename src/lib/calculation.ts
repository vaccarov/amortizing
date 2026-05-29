import type {
  AmortizationResult,
  MonetaryColumns,
  Params,
  PaymentRow,
  Row,
  TriParams,
  YearGroup,
  YearSummary,
} from '@/types';
import { SOCIAL_CONTRIBUTIONS } from './constants';
import { addMonths, parseDate, toAnnualRate } from './format';

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

  const fallback = 0.005;
  let lo = -0.001;
  let hi = 0.1;
  const flo = f(lo);
  let guess = fallback;

  if (flo * f(hi) < 0) {
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2;
      if (hi - lo < 1e-10) break;
      if (f(mid) * flo <= 0) hi = mid;
      else lo = mid;
    }
    guess = (lo + hi) / 2;
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
  fees: number;
  paymentRows: PaymentRow[];
}): { taeg: number; taegHA: number; taea: number } {
  const { loanAmount, annualRate, duration, fees, paymentRows } = params;

  if (paymentRows.length === 0 || annualRate <= 0 || loanAmount <= 0 || duration <= 0) {
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
  if (M === 0) return null;

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
  taxParams: Pick<Params, 'europeanScpiPercent' | 'tmi' | 'avgTaxRate'>,
): number {
  const netIncome = Math.max(0, income - interest);
  const { euTaxRate, frTaxRate } = getTaxRates(taxParams.tmi, taxParams.avgTaxRate);
  const euRatio = taxParams.europeanScpiPercent / 100;
  const euNetIncome = netIncome * euRatio;
  const frNetIncome = netIncome - euNetIncome;
  return euNetIncome * (euTaxRate / 100) + frNetIncome * (frTaxRate / 100);
}

function sumRows(rows: Row[], key: keyof Row): number {
  return rows.reduce((acc, r) => acc + (r[key] as number), 0);
}

export function buildYearGroups(
  rows: Row[],
  taxParams: Pick<Params, 'tmi' | 'avgTaxRate' | 'europeanScpiPercent'>,
  triParams: TriParams,
): YearGroup[] {
  const map = new Map<number, Row[]>();
  for (const row of rows) {
    const arr = map.get(row.year);
    if (arr) arr.push(row);
    else map.set(row.year, [row]);
  }

  const yearEntries = [...map].sort(([a], [b]) => a - b);
  const cumulative: number[] = [];

  return yearEntries.map(([year, yearRows]) => {
    const cashflows = yearRows.map((r) => r.cashflow);
    cumulative.push(...cashflows);

    const lastRow = yearRows[yearRows.length - 1];
    const yearsElapsed = lastRow.month / 12;
    const propertyValue =
      triParams.loanAmount *
      (1 - triParams.subscriptionFee / 100) *
      (1 + triParams.annualAppreciation / 100) ** yearsElapsed;
    const finalValue = propertyValue - lastRow.balanceEnd;
    const tri = computeTRI(cumulative, finalValue, triParams.initialInvestment);

    const income = sumRows(yearRows, 'income');
    const interest = sumRows(yearRows, 'interest');
    const taxes = computeTaxes(income, interest, taxParams);

    const summary: YearSummary = {
      balanceEnd: lastRow.balanceEnd,
      payment: sumRows(yearRows, 'payment'),
      principalPaid: sumRows(yearRows, 'principalPaid'),
      interest,
      insurance: sumRows(yearRows, 'insurance'),
      income,
      cashflow: sumRows(yearRows, 'cashflow'),
      taxes,
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

export function computeTotals(
  rows: Row[],
  yearGroups: YearGroup[],
): MonetaryColumns & { taxes: number; tri: number | null } {
  return {
    payment: sumRows(rows, 'payment'),
    principalPaid: sumRows(rows, 'principalPaid'),
    interest: sumRows(rows, 'interest'),
    insurance: sumRows(rows, 'insurance'),
    income: sumRows(rows, 'income'),
    cashflow: sumRows(rows, 'cashflow'),
    taxes: yearGroups.reduce((s, g) => s + g.summary.taxes, 0),
    tri: yearGroups.length > 0 ? yearGroups[yearGroups.length - 1].summary.tri : null,
  };
}
