import { ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { computeTotals } from "@/lib/calculation";
import { fmt, fmtDate } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { AmortizationResult, YearGroup } from "@/types";

interface AmortizationTableProps {
  result: AmortizationResult;
  yearGroups: YearGroup[];
  expanded: Set<number>;
  onToggleYear: (year: number) => void;
  lang: Lang;
}

const cell = "text-right text-xs tabular-nums p-1.5";
const hdr = "text-xs font-medium text-muted-foreground px-2 py-1.5";
const cfColor = (v: number) => (v >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive");
const cellBold = cn(cell, "font-bold");
const totalColumns = [
  "payment",
  "principalPaid",
  "interest",
  "insurance",
  "income",
  "cashflow",
  "taxes",
] as const;
const detailColumns = ["balanceStart", ...totalColumns.filter((k) => k !== "taxes")] as const;
const yearColumns = ["balanceEnd", ...totalColumns, "tri"] as const;

export default function AmortizationTable({
  result,
  yearGroups,
  expanded,
  onToggleYear,
  lang,
}: AmortizationTableProps) {
  const totals = useMemo(() => computeTotals(result.rows, yearGroups), [result, yearGroups]);
  const totalRows = result.rows.length;

  return (
    <div className="flex-1 overflow-auto rounded-lg border">
      <table className="w-full caption-bottom text-sm">
        <thead className="sticky top-0 z-30">
          <tr className="border-b bg-muted/80 font-bold">
            <td colSpan={3} className="text-right text-xs text-muted-foreground whitespace-nowrap">
              {t("total", lang)} ({totalRows} {t("months", lang)})
            </td>
            {totalColumns.map((key) => (
              <td key={key} className={cn(cellBold, key === "cashflow" && cfColor(totals[key]))}>
                {fmt(totals[key])} €
              </td>
            ))}
            <td className={cellBold}>{totals.tri !== null ? `${fmt(totals.tri)} %` : "—"}</td>
          </tr>
          <tr className="border-b bg-muted/80 font-bold">
            <td colSpan={3} className="text-right text-xs text-muted-foreground whitespace-nowrap">
              {t("avgPerMonth", lang)}
            </td>
            {totalColumns.map((key) => (
              <td
                key={key}
                className={cn(cell, key === "cashflow" && cfColor(totals[key] / totalRows))}>
                {fmt(totals[key] / totalRows)} €
              </td>
            ))}
            <td className={cell}>—</td>
          </tr>
          <tr className="border-b bg-muted/80 font-bold">
            <th className={hdr}>{t("colMonth", lang)}</th>
            <th className={hdr}>{t("colDate", lang)}</th>
            <th className={hdr}>{t("colBalance", lang)} (€)</th>
            <th className={hdr}>{t("colPayment", lang)} (€)</th>
            <th className={hdr}>{t("colPrincipal", lang)} (€)</th>
            <th className={hdr}>{t("colInterest", lang)} (€)</th>
            <th className={hdr}>{t("colInsurance", lang)} (€)</th>
            <th className={hdr}>{t("colIncome", lang)} (€)</th>
            <th className={hdr}>{t("colCashflow", lang)} (€)</th>
            <th className={hdr}>{t("colTaxes", lang)} (€)</th>
            <th className={hdr}>{t("colTri", lang)} (%)</th>
          </tr>
        </thead>

        {yearGroups.map((group) => (
          <tbody key={group.year}>
            <tr
              className="cursor-pointer border-b bg-muted/50 font-bold hover:bg-muted/80"
              onClick={() => onToggleYear(group.year)}>
              <td
                colSpan={2}
                className="sticky left-0 z-20 bg-background px-2 py-1.5 text-xs whitespace-nowrap text-muted-foreground">
                <ChevronDown
                  className={cn(
                    "mr-1 inline size-3.5 transition-transform",
                    expanded.has(group.year) && "rotate-180",
                  )}
                />
                {t("year", lang)} {group.year}
              </td>
              {yearColumns.map((key) => (
                <td
                  key={key}
                  className={cn(cellBold, key === "cashflow" && cfColor(group.summary[key]))}>
                  {fmt(group.summary[key])}
                </td>
              ))}
            </tr>

            {expanded.has(group.year) &&
              group.rows.map((row) => (
                <tr
                  key={row.month}
                  className={cn("border-b", row.isGrace && "bg-blue-50/50 dark:bg-blue-950/30")}>
                  <td className="sticky left-0 z-10 bg-background px-2 py-1.5 text-left text-xs whitespace-nowrap text-muted-foreground">
                    {row.month}
                  </td>
                  <td className="sticky left-[36px] z-[5] bg-background px-2 py-1.5 text-left text-xs whitespace-nowrap text-muted-foreground">
                    {fmtDate(row.date)}
                  </td>
                  {detailColumns.map((key) => (
                    <td
                      key={key}
                      className={cn(
                        cell,
                        key === "principalPaid" && row.isGrace && "text-muted-foreground/50",
                        key === "cashflow" && cfColor(row[key]),
                      )}>
                      {fmt(row[key])}
                    </td>
                  ))}
                  <td className={cell}>—</td>
                  <td className={cell}>—</td>
                </tr>
              ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
