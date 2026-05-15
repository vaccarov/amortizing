import {
  ChevronsDownUp,
  ChevronsUpDown,
  Download,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
} from "lucide-react";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import Field from "@/components/Field";
import SliderField from "@/components/SliderField";
import { Button } from "@/components/ui/button";
import { computeTRI } from "@/lib/calculation";
import { fmt, fmtInt } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn, downloadCSV } from "@/lib/utils";
import type { AmortizationParams, AmortizationResult } from "@/types/amortization";
import type { Extra } from "@/types/extra";
import type { YearGroup } from "@/types/table";

interface SidebarProps {
  p: AmortizationParams;
  setP: Dispatch<SetStateAction<AmortizationParams>>;
  lang: Lang;
  setLang: (l: Lang) => void;
  result: AmortizationResult | null;
  yearGroups: YearGroup[];
  extra: Extra;
  setExtra: Dispatch<SetStateAction<Extra>>;
  expanded: Set<number>;
  setExpanded: Dispatch<SetStateAction<Set<number>>>;
  apr: number;
  aprExInsurance: number;
  air: number;
}

export default function Sidebar({
  p,
  setP,
  lang,
  setLang,
  result,
  yearGroups,
  extra,
  setExtra,
  expanded,
  setExpanded,
  apr,
  aprExInsurance,
  air,
}: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", stored ? stored === "dark" : prefersDark);
  }, []);

  const toggleTheme = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const setField = (key: keyof AmortizationParams) => (val: number | string) =>
    setP((prev) => ({ ...prev, [key]: val }));

  const setExtraField = (key: keyof Extra) => (val: number) =>
    setExtra((prev) => ({ ...prev, [key]: val }));

  const downPayment = extra.guaranteeFee + extra.processingFee + extra.brokerFee;
  const nbYears = Math.ceil(p.duration / 12);
  const futureValue = p.loanAmount * (1 + extra.annualAppreciation / 100) ** nbYears;
  const monthlyRent = (p.loanAmount * ((p.grossYield * 0.8) / 100)) / 12;
  const hasResult = !!result;
  const monthlyExInsurance = result?.M ?? 0;

  const allExpanded = yearGroups.length > 0 && yearGroups.every((g) => expanded.has(g.year));

  const toggleAll = () => {
    setExpanded(allExpanded ? new Set() : new Set(yearGroups.map((g) => g.year)));
  };

  const totalCost = hasResult
    ? (monthlyExInsurance > 0
        ? monthlyExInsurance * p.duration -
          p.loanAmount +
          ((p.loanAmount * p.insuranceRate) / 100 / 12) * (p.duration + p.gracePeriod)
        : 0) + downPayment
    : 0;

  const tri = hasResult
    ? computeTRI(
        result.rows.map((r) => r.cashflow),
        futureValue,
        downPayment,
      )
    : 0;

  const infoRow = (label: string, value: string) => (
    <div className="flex items-baseline justify-between gap-1 text-[11px]">
      <span className="shrink-0 text-muted-foreground/50">{label}</span>
      <span className="truncate text-foreground/70">{value}</span>
    </div>
  );

  return (
    <div className="relative h-full shrink-0">
      <div
        className={cn(
          "h-full overflow-hidden border-r bg-card transition-[width] duration-300",
          sidebarOpen ? "w-[240px]" : "w-0",
        )}
      >
        <div className="flex h-full w-full flex-col gap-2.5 overflow-y-auto p-4">
          <div className="flex items-center justify-between">
            <h1 className="mr-auto text-sm font-bold tracking-tight">Amortizing</h1>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setLang(lang === "fr" ? "en" : "fr")}
                title={lang === "fr" ? "English" : "Français"}
              >
                {lang === "fr" ? "🇬🇧" : "🇫🇷"}
              </Button>
              {hasResult && (
                <>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={toggleTheme}
                    title={t("toggleTheme", lang)}
                  >
                    <Sun className="size-3.5 dark:hidden" />
                    <Moon className="hidden size-3.5 dark:block" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => {
                      if (result) downloadCSV(result);
                    }}
                    title={t("exportCSV", lang)}
                  >
                    <Download className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={toggleAll}
                    title={allExpanded ? t("collapseAll", lang) : t("expandAll", lang)}
                  >
                    {allExpanded ? (
                      <ChevronsDownUp className="size-3.5" />
                    ) : (
                      <ChevronsUpDown className="size-3.5" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
          <hr className="border-t" />
          <Field
            label={t("startDate", lang)}
            id="date"
            value={p.startDate}
            onChange={setField("startDate")}
            type="date"
          />
          <SliderField
            label={t("loan", lang)}
            value={p.loanAmount}
            onChange={(v) => setField("loanAmount")(v)}
            min={0}
            max={500000}
            step={1000}
            suffix="€"
            format={fmtInt}
          />
          <SliderField
            label={t("annualRate", lang)}
            value={p.annualRate}
            onChange={(v) => setField("annualRate")(v)}
            min={0}
            max={10}
            step={0.01}
            suffix="%"
          />
          <SliderField
            label={t("duration", lang)}
            value={p.duration}
            onChange={(v) => setField("duration")(v)}
            min={1}
            max={300}
            step={1}
            format={fmtInt}
          />
          <SliderField
            label={t("insurance", lang)}
            value={p.insuranceRate}
            onChange={(v) => setField("insuranceRate")(v)}
            min={0}
            max={0.4}
            step={0.01}
            suffix="%"
          />
          <SliderField
            label={t("gracePeriod", lang)}
            value={p.gracePeriod}
            onChange={(v) => setField("gracePeriod")(v)}
            min={0}
            max={10}
            step={1}
            format={fmtInt}
          />
          <SliderField
            label={t("grossYield", lang)}
            value={p.grossYield}
            onChange={(v) => setField("grossYield")(v)}
            min={0}
            max={15}
            step={0.1}
            suffix="%"
          />
          <div className="-mt-1 text-[11px] text-muted-foreground/50">
            {t("net", lang)} : <span>{fmt(p.grossYield * 0.8)}</span> %
          </div>

          {hasResult
            ? infoRow(t("monthlyRent", lang), `${fmt(monthlyRent)} €`)
            : infoRow(t("monthlyRent", lang), "—")}

          <SliderField
            label={t("taxRate", lang)}
            value={extra.taxRate}
            onChange={(v) => setExtraField("taxRate")(v)}
            min={0}
            max={45}
            step={0.1}
            suffix="%"
          />
          <SliderField
            label={t("appreciation", lang)}
            value={extra.annualAppreciation}
            onChange={(v) => setExtraField("annualAppreciation")(v)}
            min={-2}
            max={2}
            step={0.1}
            suffix="%"
            format={(v) => `${v >= 0 ? "+" : ""}${fmt(v)}`}
          />
          {hasResult
            ? infoRow(t("futureValue", lang), `${fmt(futureValue)} €`)
            : infoRow(t("futureValue", lang), "—")}

          <hr className="border-t" />

          <Field
            label={t("guaranteeFee", lang)}
            id="caution"
            value={extra.guaranteeFee}
            onChange={setExtraField("guaranteeFee")}
            suffix="€"
            min={0}
            step={100}
          />
          <Field
            label={t("processingFee", lang)}
            id="dossier"
            value={extra.processingFee}
            onChange={setExtraField("processingFee")}
            suffix="€"
            min={0}
            step={100}
          />
          <Field
            label={t("brokerFee", lang)}
            id="courtage"
            value={extra.brokerFee}
            onChange={setExtraField("brokerFee")}
            suffix="€"
            min={0}
            step={100}
          />
          {infoRow(t("downPayment", lang), `${fmt(downPayment)} €`)}

          <hr className="border-t" />

          {infoRow(t("aprExInsurance", lang), `${fmt(aprExInsurance)} %`)}
          {infoRow(t("apr", lang), `${fmt(apr)} %`)}
          {infoRow(t("air", lang), `${fmt(air)} %`)}

          {hasResult
            ? infoRow(t("monthlyExInsurance", lang), `${fmt(monthlyExInsurance)} €`)
            : infoRow(t("monthlyExInsurance", lang), "—")}

          {hasResult
            ? infoRow(t("totalCost", lang), `${fmt(totalCost)} €`)
            : infoRow(t("totalCost", lang), "—")}

          {hasResult ? infoRow(t("tri", lang), `${fmt(tri)} %`) : infoRow(t("tri", lang), "—")}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed top-2 z-50 flex size-8 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted transition-[left] duration-300"
        style={{ left: sidebarOpen ? 250 : 10 }}
        title={sidebarOpen ? t("collapse", lang) : t("show", lang)}
      >
        {sidebarOpen ? <PanelLeftClose className="size-3" /> : <PanelLeftOpen className="size-3" />}
      </button>
    </div>
  );
}
