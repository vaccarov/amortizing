import { useMemo } from 'react';
import { buildYearGroups, calculateAPR, compute, computePaymentRows } from '@/lib/calculation';
import type { Params } from '@/types';

export function useAmortization(params: Params) {
  const fees = params.guaranteeFee + params.processingFee + params.brokerFee;

  const { rows: paymentRows, M } = useMemo(
    () =>
      computePaymentRows(
        params.loanAmount,
        params.annualRate / 100 / 12,
        params.insuranceRate / 100 / 12,
        params.duration,
        params.gracePeriod,
      ),
    [
      params.loanAmount,
      params.annualRate,
      params.duration,
      params.insuranceRate,
      params.gracePeriod,
    ],
  );

  const result = useMemo(() => compute(params, paymentRows, M), [params, paymentRows, M]);

  const aprValues = useMemo(
    () =>
      calculateAPR({
        loanAmount: params.loanAmount,
        annualRate: params.annualRate,
        duration: params.duration,
        insuranceRate: params.insuranceRate,
        gracePeriod: params.gracePeriod,
        fees,
        paymentRows,
      }),
    [
      paymentRows,
      params.loanAmount,
      params.annualRate,
      params.duration,
      params.insuranceRate,
      params.gracePeriod,
      fees,
    ],
  );

  const yearGroups = useMemo(
    () =>
      result
        ? buildYearGroups(
            result.rows,
            {
              tmi: params.tmi,
              avgTaxRate: params.avgTaxRate,
              europeanScpiPercent: params.europeanScpiPercent,
            },
            {
              loanAmount: params.loanAmount,
              annualAppreciation: params.annualAppreciation,
              initialInvestment: params.apport - params.cashback,
            },
          )
        : [],
    [
      result,
      params.tmi,
      params.avgTaxRate,
      params.europeanScpiPercent,
      params.loanAmount,
      params.annualAppreciation,
      params.apport,
      params.cashback,
    ],
  );

  return { result, aprValues, yearGroups };
}
