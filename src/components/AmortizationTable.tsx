import { ChevronDown } from "lucide-react";
import { fmt, fmtDate } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AmortizationResult } from "@/types/amortization";
import type { Totals, YearGroup } from "@/types/table";

interface AmortizationTableProps {
  result: AmortizationResult;
  yearGroups: YearGroup[];
  totals: Totals;
  totalRows: number;
  totalTaxes: number;
  avgTaxes: number;
  averages: {
    payment: number;
    principalPaid: number;
    interest: number;
    insurance: number;
    income: number;
    cashflow: number;
  };
  expanded: Set<number>;
  onToggleYear: (year: number) => void;
  lang: Lang;
}

const cell = "text-right text-xs tabular-nums px-2 py-1.5";
const hdr = "text-xs font-medium text-muted-foreground px-2 py-1.5";
const cfColor = (v: number) => (v >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive");

export default function AmortizationTable({
  result,
  yearGroups,
  totals,
  totalRows,
  totalTaxes,
  avgTaxes,
  averages,
  expanded,
  onToggleYear,
  lang,
}: AmortizationTableProps) {
  if (!result || !totals || !averages) return null;

  return (
    <div className="flex-1 overflow-auto rounded-lg border">
      <table className="w-full caption-bottom text-sm">
        <thead className="sticky top-0 z-30">
          <tr className="border-b bg-muted/80 font-bold">
            <td colSpan={3} className="text-right text-xs text-muted-foreground whitespace-nowrap">
              {t("total", lang)} ({totalRows} {t("months", lang)})
            </td>
            <td className={cn(cell, "font-bold")}>{fmt(totals.payment)}</td>
            <td className={cn(cell, "font-bold")}>{fmt(totals.principalPaid)}</td>
            <td className={cn(cell, "font-bold")}>{fmt(totals.interest)}</td>
            <td className={cn(cell, "font-bold")}>{fmt(totals.insurance)}</td>
            <td className={cn(cell, "font-bold")}>{fmt(totals.income)}</td>
            <td className={cn(cell, "font-bold", cfColor(totals.cashflow))}>
              {fmt(totals.cashflow)}
            </td>
            <td className={cn(cell, "font-bold")}>{fmt(totalTaxes)}</td>
          </tr>
          <tr className="border-b bg-muted/80 font-bold">
            <td colSpan={3} className="text-right text-xs text-muted-foreground whitespace-nowrap">
              {t("avgPerMonth", lang)}
            </td>
            <td className={cell}>{fmt(averages.payment)}</td>
            <td className={cell}>{fmt(averages.principalPaid)}</td>
            <td className={cell}>{fmt(averages.interest)}</td>
            <td className={cell}>{fmt(averages.insurance)}</td>
            <td className={cell}>{fmt(averages.income)}</td>
            <td className={cn(cell, cfColor(averages.cashflow))}>{fmt(averages.cashflow)}</td>
            <td className={cell}>{fmt(avgTaxes)}</td>
          </tr>
          <tr className="border-b bg-muted/80 font-bold">
            <th className={hdr}>{t("colMonth", lang)}</th>
            <th className={hdr}>{t("colDate", lang)}</th>
            <th className={hdr}>{t("colBalance", lang)}</th>
            <th className={hdr}>{t("colPayment", lang)}</th>
            <th className={hdr}>{t("colPrincipal", lang)}</th>
            <th className={hdr}>{t("colInterest", lang)}</th>
            <th className={hdr}>{t("colInsurance", lang)}</th>
            <th className={hdr}>{t("colIncome", lang)}</th>
            <th className={hdr}>{t("colCashflow", lang)}</th>
            <th className={hdr}>{t("colTaxes", lang)}</th>
          </tr>
        </thead>

        {yearGroups.map((group) => (
          <tbody key={group.year}>
            <tr
              className="cursor-pointer border-b bg-muted/50 font-bold hover:bg-muted/80"
              onClick={() => onToggleYear(group.year)}
            >
              <td
                colSpan={2}
                className="sticky left-0 z-20 bg-background px-2 py-1.5 text-xs whitespace-nowrap text-muted-foreground"
              >
                <ChevronDown
                  className={cn(
                    "mr-1 inline size-3.5 transition-transform",
                    expanded.has(group.year) && "rotate-180",
                  )}
                />
                {t("year", lang)} {group.year}
              </td>
              <td className={cn(cell, "font-bold")}>{fmt(group.summary.balanceEnd)}</td>
              <td className={cn(cell, "font-bold")}>{fmt(group.summary.payment)}</td>
              <td className={cn(cell, "font-bold")}>{fmt(group.summary.principalPaid)}</td>
              <td className={cn(cell, "font-bold")}>{fmt(group.summary.interest)}</td>
              <td className={cn(cell, "font-bold")}>{fmt(group.summary.insurance)}</td>
              <td className={cn(cell, "font-bold")}>{fmt(group.summary.income)}</td>
              <td className={cn(cell, "font-bold", cfColor(group.summary.cashflow))}>
                {fmt(group.summary.cashflow)}
              </td>
              <td className={cn(cell, "font-bold")}>{fmt(group.summary.taxes)}</td>
            </tr>

            {expanded.has(group.year) &&
              group.rows.map((row) => (
                <tr
                  key={row.month}
                  className={cn("border-b", row.isGrace && "bg-blue-50/50 dark:bg-blue-950/30")}
                >
                  <td className="sticky left-0 z-10 bg-background px-2 py-1.5 text-left text-xs whitespace-nowrap text-muted-foreground">
                    {row.month}
                  </td>
                  <td className="sticky left-[36px] z-[5] bg-background px-2 py-1.5 text-left text-xs whitespace-nowrap text-muted-foreground">
                    {fmtDate(row.date)}
                  </td>
                  <td className={cell}>{fmt(row.balanceStart)}</td>
                  <td className={cell}>{fmt(row.payment)}</td>
                  <td className={cn(cell, row.isGrace && "text-muted-foreground/50")}>
                    {fmt(row.principalPaid)}
                  </td>
                  <td className={cell}>{fmt(row.interest)}</td>
                  <td className={cell}>{fmt(row.insurance)}</td>
                  <td className={cell}>{fmt(row.income)}</td>
                  <td className={cn(cell, cfColor(row.cashflow))}>{fmt(row.cashflow)}</td>
                  <td className={cell}>—</td>
                </tr>
              ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
