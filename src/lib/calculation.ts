import type { AmortizationParams, AmortizationResult, Row } from "@/types/amortization";
import { addMonths, parseDate } from "./format";

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
  if (Math.abs(f(x)) < 1e-6) return x;
  return NaN;
}

function findMonthlyRate(payments: number[], netLoan: number): number {
  if (netLoan <= 0 || payments.length === 0 || payments.every((p) => p <= 0)) return 0;

  const f = (r: number) => {
    let sum = 0;
    for (let k = 1; k <= payments.length; k++) {
      sum += payments[k - 1] / (1 + r) ** k;
    }
    return netLoan - sum;
  };

  const fprime = (r: number) => {
    let sum = 0;
    for (let k = 1; k <= payments.length; k++) {
      sum += (k * payments[k - 1]) / (1 + r) ** (k + 1);
    }
    return sum;
  };

  let lo = -0.001;
  let hi = 0.1;
  const flo = f(lo);
  let guess = 0.005;

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

export function calculateAPR(params: {
  loanAmount: number;
  annualRate: number;
  duration: number;
  insuranceRate: number;
  gracePeriod: number;
  fees: number;
}): { taeg: number; taegHA: number; taea: number } {
  const { loanAmount, annualRate, duration, insuranceRate, gracePeriod, fees } = params;
  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate <= 0 || loanAmount <= 0 || duration <= 0) {
    return { taeg: 0, taegHA: 0, taea: 0 };
  }

  const result = compute({
    loanAmount,
    annualRate,
    duration,
    insuranceRate,
    gracePeriod,
    startDate: "",
    grossYield: 0,
  });

  if (!result) return { taeg: 0, taegHA: 0, taea: 0 };

  const netLoan = loanAmount - fees;
  const paymentsHA = result.rows.map((r) => r.interest + r.principalPaid);
  const paymentsTotal = result.rows.map((r) => r.payment);

  const monthlyRateHA = findMonthlyRate(paymentsHA, netLoan);
  const monthlyRateTotal = findMonthlyRate(paymentsTotal, netLoan);

  const taegHA = monthlyRateHA > 0 ? ((1 + monthlyRateHA) ** 12 - 1) * 100 : 0;
  const taeg = monthlyRateTotal > 0 ? ((1 + monthlyRateTotal) ** 12 - 1) * 100 : 0;
  const taea = taeg > 0 && taegHA > 0 ? taeg - taegHA : 0;

  return { taeg, taegHA, taea };
}

export function computeTRI(
  cashflows: number[],
  finalValue: number,
  initialInvestment: number,
): number {
  if (cashflows.length === 0 || initialInvestment <= 0) return 0;

  const cf = [...cashflows];
  cf[cf.length - 1] += finalValue;

  const monthlyRate = findMonthlyRate(cf, initialInvestment);
  if (!monthlyRate || monthlyRate <= 0) return 0;
  return ((1 + monthlyRate) ** 12 - 1) * 100;
}

export function compute(params: AmortizationParams): AmortizationResult | null {
  const { loanAmount, annualRate, duration, insuranceRate, gracePeriod, startDate, grossYield } =
    params;
  const monthlyRate = annualRate / 100 / 12;
  const monthlyInsuranceRate = insuranceRate / 100 / 12;
  if (monthlyRate <= 0 || loanAmount <= 0 || duration <= 0) return null;

  const netYield = grossYield * 0.8;
  const monthlyIncome = (loanAmount * (netYield / 100)) / 12;
  const start = parseDate(startDate);

  const M = (loanAmount * monthlyRate) / (1 - (1 + monthlyRate) ** -duration);
  const rows: Row[] = [];
  let balance = loanAmount;

  for (let i = 1; i <= duration + gracePeriod; i++) {
    const isGrace = i <= gracePeriod;
    const amortI = i - gracePeriod;
    const interest = balance * monthlyRate;
    const insurance = balance * monthlyInsuranceRate;
    let principalPaid = 0;

    if (!isGrace) {
      principalPaid = amortI === duration ? Math.max(0, balance) : M - interest;
    }

    balance -= principalPaid;
    const payment = interest + principalPaid + insurance;
    const date = addMonths(start, i);

    rows.push({
      month: i,
      date,
      year: date.getFullYear(),
      balanceStart: balance + principalPaid,
      balanceEnd: balance,
      payment,
      principalPaid,
      interest,
      insurance,
      income: monthlyIncome,
      cashflow: monthlyIncome - payment,
      isGrace,
    });
  }

  return { rows, M };
}
