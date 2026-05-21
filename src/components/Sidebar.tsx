import {
  ChevronsDownUp,
  ChevronsUpDown,
  Download,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
} from 'lucide-react';
import { type Dispatch, type SetStateAction, useState } from 'react';
import Field from '@/components/Field';
import SliderField from '@/components/SliderField';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { computeBlendedTaxRate } from '@/lib/calculation';
import { TMI_BRACKETS } from '@/lib/constants';
import { fmt, fmtInt } from '@/lib/format';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { cn, downloadCSV } from '@/lib/utils';
import type { AmortizationResult, Params } from '@/types';

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
  const { toggleTheme } = useTheme();

  const maxApport = Math.floor(0.4 * params.loanAmount);
  const downPayment = params.apport - params.cashback;
  const futureValue =
    params.loanAmount * (1 + params.annualAppreciation / 100) ** Math.ceil(params.duration / 12);
  const monthlyRent = (params.loanAmount * ((params.grossYield * 0.8) / 100)) / 12;
  const hasResult = !!result;
  const monthlyExInsurance = result?.M ?? 0;

  const totalCost = hasResult
    ? monthlyExInsurance * params.duration -
      params.loanAmount +
      ((params.loanAmount * params.insuranceRate) / 100 / 12) *
        (params.duration + params.gracePeriod) +
      downPayment
    : 0;

  const snapTMI = (v: number) =>
    TMI_BRACKETS.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));

  const infoRow = (label: string, value: string | null) => (
    <div className="flex items-baseline justify-between gap-1 text-[11px]">
      <span className="shrink-0 text-muted-foreground/50">{label}</span>
      <span className="truncate text-foreground/70">{value ?? '—'}</span>
    </div>
  );

  const updateFee =
    (field: 'guaranteeFee' | 'processingFee' | 'brokerFee') => (v: string | number) => {
      const value = v as number;
      setParams((prev) => {
        const others = prev.guaranteeFee + prev.processingFee + prev.brokerFee - prev[field];
        return {
          ...prev,
          [field]: value,
          apport: Math.max(prev.apport, others + value),
        };
      });
    };

  const setNumericParam = (key: keyof Params) => (v: number) =>
    setParams((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="relative h-full shrink-0">
      <div
        className={cn(
          'h-full overflow-hidden border-r bg-card transition-[width] duration-300',
          sidebarOpen ? 'w-[240px]' : 'w-0',
        )}>
        <div className="flex h-full w-full flex-col gap-2.5 overflow-y-auto p-4">
          <div className="flex items-center justify-between">
            <h1 className="mr-auto text-sm font-bold tracking-tight">Amortizing</h1>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                title={lang === 'fr' ? 'English' : 'Français'}>
                {lang === 'fr' ? '🇬🇧' : '🇫🇷'}
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={toggleTheme}
                title={t('toggleTheme', lang)}>
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
                    title={t('exportCSV', lang)}>
                    <Download className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={onToggleAll}
                    title={allExpanded ? t('collapseAll', lang) : t('expandAll', lang)}>
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
            label={t('startDate', lang)}
            id="date"
            value={params.startDate}
            onChange={(v) => setParams((prev) => ({ ...prev, startDate: v as string }))}
            type="date"
          />
          <SliderField
            label={t('loan', lang)}
            value={params.loanAmount}
            onChange={setNumericParam('loanAmount')}
            min={0}
            max={500000}
            step={1000}
            suffix="€"
            format={fmtInt}
          />
          <SliderField
            label={t('duration', lang)}
            value={params.duration}
            onChange={setNumericParam('duration')}
            min={1}
            max={300}
            step={1}
            format={fmtInt}
          />
          <SliderField
            label={t('gracePeriod', lang)}
            value={params.gracePeriod}
            onChange={setNumericParam('gracePeriod')}
            min={0}
            max={10}
            step={1}
            format={fmtInt}
          />
          <SliderField
            label={t('vestingPeriod', lang)}
            value={params.vestingPeriod}
            onChange={setNumericParam('vestingPeriod')}
            min={0}
            max={12}
            step={1}
            format={fmtInt}
          />
          <SliderField
            label={t('annualRate', lang)}
            value={params.annualRate}
            onChange={setNumericParam('annualRate')}
            min={0}
            max={10}
            step={0.01}
            suffix="%"
          />
          <SliderField
            label={t('insurance', lang)}
            value={params.insuranceRate}
            onChange={setNumericParam('insuranceRate')}
            min={0}
            max={0.4}
            step={0.01}
            suffix="%"
          />
          <SliderField
            label={t('grossYield', lang)}
            value={params.grossYield}
            onChange={setNumericParam('grossYield')}
            min={0}
            max={15}
            step={0.1}
            suffix="%"
          />
          {infoRow(t('net', lang), `${fmt(params.grossYield * 0.8)} %`)}

          {infoRow(t('monthlyRent', lang), hasResult ? `${fmt(monthlyRent)} €` : null)}

          <SliderField
            label={t('europeanScpiPercent', lang)}
            value={params.europeanScpiPercent}
            onChange={setNumericParam('europeanScpiPercent')}
            min={0}
            max={100}
            step={1}
            format={(v) => `🇫🇷 ${100 - v}% · ${v}% 🇪🇺`}
          />
          <SliderField
            label={t('avgTaxRate', lang)}
            value={params.avgTaxRate}
            onChange={setNumericParam('avgTaxRate')}
            min={0}
            max={50}
            step={0.1}
            suffix="%"
          />
          <SliderField
            label={t('tmi', lang)}
            value={params.tmi}
            onChange={(v) => setParams((prev) => ({ ...prev, tmi: snapTMI(v) }))}
            min={0}
            max={45}
            step={1}
            suffix="%"
          />
          {infoRow(
            t('blendedRate', lang),
            `${fmt(computeBlendedTaxRate(params.tmi, params.avgTaxRate, params.europeanScpiPercent))} %`,
          )}
          <SliderField
            label={t('appreciation', lang)}
            value={params.annualAppreciation}
            onChange={setNumericParam('annualAppreciation')}
            min={-2}
            max={2}
            step={0.1}
            suffix="%"
            format={(v) => `${v >= 0 ? '+' : ''}${fmt(v)}`}
          />
          {infoRow(t('futureValue', lang), hasResult ? `${fmt(futureValue)} €` : null)}

          <hr className="border-t" />

          <Field
            label={t('guaranteeFee', lang)}
            id="caution"
            value={params.guaranteeFee}
            onChange={updateFee('guaranteeFee')}
            suffix="€"
            min={0}
            step={100}
          />
          <Field
            label={t('processingFee', lang)}
            id="dossier"
            value={params.processingFee}
            onChange={updateFee('processingFee')}
            suffix="€"
            min={0}
            step={100}
          />
          <Field
            label={t('brokerFee', lang)}
            id="courtage"
            value={params.brokerFee}
            onChange={updateFee('brokerFee')}
            suffix="€"
            min={0}
            step={100}
          />
          <SliderField
            label={t('apport', lang)}
            value={params.apport}
            onChange={setNumericParam('apport')}
            min={0}
            max={maxApport}
            step={100}
            suffix="€"
            format={fmtInt}
          />
          <Field
            label={t('cashback', lang)}
            id="cashback"
            value={params.cashback}
            onChange={(v) => setParams((prev) => ({ ...prev, cashback: v as number }))}
            suffix="€"
            min={0}
            step={100}
          />
          {infoRow(t('downPayment', lang), `${fmt(downPayment)} €`)}

          <hr className="border-t" />

          {infoRow(t('aprExInsurance', lang), `${fmt(aprExInsurance)} %`)}
          {infoRow(t('apr', lang), `${fmt(apr)} %`)}
          {infoRow(t('air', lang), `${fmt(air)} %`)}

          {infoRow(
            t('monthlyExInsurance', lang),
            hasResult ? `${fmt(monthlyExInsurance)} €` : null,
          )}

          {infoRow(t('totalCost', lang), hasResult ? `${fmt(totalCost)} €` : null)}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed top-2 z-50 flex size-8 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted transition-[left] duration-300"
        style={{ left: sidebarOpen ? 250 : 10 }}
        title={sidebarOpen ? t('collapse', lang) : t('show', lang)}>
        {sidebarOpen ? <PanelLeftClose className="size-3" /> : <PanelLeftOpen className="size-3" />}
      </button>
    </div>
  );
}
