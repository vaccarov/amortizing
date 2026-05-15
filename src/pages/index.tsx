import { useState } from "react";
import AmortizationTable from "@/components/AmortizationTable";
import Sidebar from "@/components/Sidebar";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { useAmortization } from "@/lib/useAmortization";
import type { AmortizationParams } from "@/types/amortization";
import type { Extra } from "@/types/extra";

export default function Home() {
  const [p, setP] = useState<AmortizationParams>({
    loanAmount: 150000,
    annualRate: 4.35,
    duration: 240,
    insuranceRate: 0.2,
    gracePeriod: 6,
    startDate: "2026-05-25",
    grossYield: 6,
  });
  const [extra, setExtra] = useState<Extra>({
    guaranteeFee: 2400,
    processingFee: 1200,
    brokerFee: 1500,
    taxRate: 13,
    annualAppreciation: 0.5,
  });
  const [lang, setLang] = useState<Lang>("fr");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { result, aprValues, yearGroups, totals, totalRows, totalTaxes, avgTaxes, averages } =
    useAmortization(p, extra);

  const toggleYear = (year: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar
        p={p}
        setP={setP}
        lang={lang}
        setLang={setLang}
        result={result}
        yearGroups={yearGroups}
        extra={extra}
        setExtra={setExtra}
        expanded={expanded}
        setExpanded={setExpanded}
        apr={aprValues.taeg}
        aprExInsurance={aprValues.taegHA}
        air={aprValues.taea}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-4">
        {result && totals && averages ? (
          <AmortizationTable
            result={result}
            yearGroups={yearGroups}
            totals={totals}
            totalRows={totalRows}
            totalTaxes={totalTaxes}
            avgTaxes={avgTaxes}
            averages={averages}
            expanded={expanded}
            onToggleYear={toggleYear}
            lang={lang}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {t("noResult", lang)}
          </div>
        )}
      </main>
    </div>
  );
}
