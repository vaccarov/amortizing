import { useMemo } from "react";
import type { AmortizationParams, Row } from "@/types/amortization";
import type { Extra } from "@/types/extra";
import type { Totals, YearGroup } from "@/types/table";
import { calculateAPR, compute } from "./calculation";

type RowKey = "payment" | "principalPaid" | "interest" | "insurance" | "income" | "cashflow";
const sumRows = (rows: Row[], k: RowKey) => rows.reduce((a, r) => a + r[k], 0);

function buildYearGroups(rows: Row[], taxRate: number): YearGroup[] {
  const byYear: Record<number, Row[]> = {};
  rows.forEach((r) => {
    if (!byYear[r.year]) byYear[r.year] = [];
    byYear[r.year].push(r);
  });
  return Object.entries(byYear).map(([yearStr, yr]) => {
    const year = Number(yearStr);
    const interest = sumRows(yr, "interest");
    const income = sumRows(yr, "income");
    return {
      year,
      summary: {
        balanceEnd: yr[yr.length - 1].balanceEnd,
        payment: sumRows(yr, "payment"),
        principalPaid: sumRows(yr, "principalPaid"),
        interest,
        insurance: sumRows(yr, "insurance"),
        income,
        cashflow: sumRows(yr, "cashflow"),
        taxes: ((income - interest) * taxRate) / 100,
      },
      rows: yr,
    };
  });
}

function computeTotals(rows: Row[]): Totals {
  return {
    payment: sumRows(rows, "payment"),
    principalPaid: sumRows(rows, "principalPaid"),
    interest: sumRows(rows, "interest"),
    insurance: sumRows(rows, "insurance"),
    income: sumRows(rows, "income"),
    cashflow: sumRows(rows, "cashflow"),
  };
}

export function useAmortization(p: AmortizationParams, extra: Extra) {
  const result = useMemo(() => compute(p), [p]);

  const aprValues = useMemo(
    () =>
      calculateAPR({
        loanAmount: p.loanAmount,
        annualRate: p.annualRate,
        duration: p.duration,
        insuranceRate: p.insuranceRate,
        gracePeriod: p.gracePeriod,
        fees: extra.guaranteeFee + extra.processingFee + extra.brokerFee,
      }),
    [p, extra.guaranteeFee, extra.processingFee, extra.brokerFee],
  );

  const yearGroups = useMemo(
    () => (result ? buildYearGroups(result.rows, extra.taxRate) : []),
    [result, extra.taxRate],
  );

  const totals = useMemo(() => {
    if (!result) return null;
    return computeTotals(result.rows);
  }, [result]);

  const totalRows = result ? result.rows.length : 0;
  const totalTaxes = yearGroups.reduce((s, g) => s + g.summary.taxes, 0);
  const avgTaxes = yearGroups.length > 0 ? totalTaxes / yearGroups.length : 0;

  const averages = useMemo(() => {
    if (!result || !totals) return null;
    const n = result.rows.length;
    return {
      payment: totals.payment / n,
      principalPaid: totals.principalPaid / n,
      interest: totals.interest / n,
      insurance: totals.insurance / n,
      income: totals.income / n,
      cashflow: totals.cashflow / n,
    };
  }, [result, totals]);

  return {
    result,
    aprValues,
    yearGroups,
    totals,
    totalRows,
    totalTaxes,
    avgTaxes,
    averages,
  };
}
