import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AmortizationResult } from '@/types';
import { fmtDate } from './format';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function downloadCSV(result: AmortizationResult) {
  const sep = ';';
  const lines = [
    '\uFEFF' + 'Month;Date;Balance;Payment;Principal;Interest;Insurance;Income;Cashflow;Taxes',
    ...result.rows.map((r) =>
      [
        r.month,
        fmtDate(r.date),
        r.balanceStart.toFixed(2),
        r.payment.toFixed(2),
        r.principalPaid.toFixed(2),
        r.interest.toFixed(2),
        r.insurance.toFixed(2),
        r.income.toFixed(2),
        r.cashflow.toFixed(2),
      ].join(sep),
    ),
  ];
  const blob = new Blob([lines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'amortization_schedule.csv';
  a.click();
  URL.revokeObjectURL(url);
}
