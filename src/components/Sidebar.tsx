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
import type { AmortizationResult, Params } from "@/types";

interface SidebarProps {
  params: Params;
  setParams: Dispatch<SetStateAction<Params>>;
  lang: Lang;
  setLang: (l: Lang) => void;
  result: AmortizationResult | null;
  allExpanded: boolean;
  onToggleAll: () => void;
  apr: number;
  aprExInsurance: number;
  air: number;
}

export default function Sidebar({
  params,
  setParams,
  lang,
  setLang,
  result,
  allExpanded,
  onToggleAll,
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

  const downPayment = params.guaranteeFee + params.processingFee + params.brokerFee;
  const nbYears = Math.ceil(params.duration / 12);
  const futureValue = params.loanAmount * (1 + params.annualAppreciation / 100) ** nbYears;
  const monthlyRent = (params.loanAmount * ((params.grossYield * 0.8) / 100)) / 12;
  const hasResult = !!result;
  const monthlyExInsurance = result?.M ?? 0;

  const totalCost = hasResult
    ? (monthlyExInsurance > 0
        ? monthlyExInsurance * params.duration -
          params.loanAmount +
          ((params.loanAmount * params.insuranceRate) / 100 / 12) *
            (params.duration + params.gracePeriod)
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
              <Button
                variant="outline"
                size="icon-xs"
                onClick={toggleTheme}
                title={t("toggleTheme", lang)}
              >
                <Sun className="size-3.5 dark:hidden" />
                <Moon className="hidden size-3.5 dark:block" />
              </Button>
              {hasResult && (
                <>
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
                    onClick={onToggleAll}
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
            value={params.startDate}
            onChange={(v) => setParams((prev) => ({ ...prev, startDate: v as string }))}
            type="date"
          />
          <SliderField
            label={t("loan", lang)}
            value={params.loanAmount}
            onChange={(v) => setParams((prev) => ({ ...prev, loanAmount: v }))}
            min={0}
            max={500000}
            step={1000}
            suffix="€"
            format={fmtInt}
          />
          <SliderField
            label={t("duration", lang)}
            value={params.duration}
            onChange={(v) => setParams((prev) => ({ ...prev, duration: v }))}
            min={1}
            max={300}
            step={1}
            format={fmtInt}
          />
          <SliderField
            label={t("gracePeriod", lang)}
            value={params.gracePeriod}
            onChange={(v) => setParams((prev) => ({ ...prev, gracePeriod: v }))}
            min={0}
            max={10}
            step={1}
            format={fmtInt}
          />
          <SliderField
            label={t("annualRate", lang)}
            value={params.annualRate}
            onChange={(v) => setParams((prev) => ({ ...prev, annualRate: v }))}
            min={0}
            max={10}
            step={0.01}
            suffix="%"
          />
          <SliderField
            label={t("insurance", lang)}
            value={params.insuranceRate}
            onChange={(v) => setParams((prev) => ({ ...prev, insuranceRate: v }))}
            min={0}
            max={0.4}
            step={0.01}
            suffix="%"
          />
          <SliderField
            label={t("grossYield", lang)}
            value={params.grossYield}
            onChange={(v) => setParams((prev) => ({ ...prev, grossYield: v }))}
            min={0}
            max={15}
            step={0.1}
            suffix="%"
          />
          <div className="-mt-1 text-[11px] text-muted-foreground/50">
            {t("net", lang)} : <span>{fmt(params.grossYield * 0.8)}</span> %
          </div>

          {hasResult
            ? infoRow(t("monthlyRent", lang), `${fmt(monthlyRent)} €`)
            : infoRow(t("monthlyRent", lang), "—")}

          <SliderField
            label={t("taxRate", lang)}
            value={params.taxRate}
            onChange={(v) => setParams((prev) => ({ ...prev, taxRate: v }))}
            min={0}
            max={45}
            step={0.1}
            suffix="%"
          />
          <SliderField
            label={t("appreciation", lang)}
            value={params.annualAppreciation}
            onChange={(v) => setParams((prev) => ({ ...prev, annualAppreciation: v }))}
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
            value={params.guaranteeFee}
            onChange={(v) => setParams((prev) => ({ ...prev, guaranteeFee: v as number }))}
            suffix="€"
            min={0}
            step={100}
          />
          <Field
            label={t("processingFee", lang)}
            id="dossier"
            value={params.processingFee}
            onChange={(v) => setParams((prev) => ({ ...prev, processingFee: v as number }))}
            suffix="€"
            min={0}
            step={100}
          />
          <Field
            label={t("brokerFee", lang)}
            id="courtage"
            value={params.brokerFee}
            onChange={(v) => setParams((prev) => ({ ...prev, brokerFee: v as number }))}
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
