import { useState } from 'react';
import AmortizationTable from '@/components/AmortizationTable';
import Sidebar from '@/components/Sidebar';
import { DEFAULT_PARAMS } from '@/lib/constants';
import type { Lang } from '@/lib/i18n';
import { t } from '@/lib/i18n';
import { useAmortization } from '@/lib/useAmortization';
import type { Params } from '@/types';

export default function Home() {
  const [params, setParams] = useState<Params>({ ...DEFAULT_PARAMS });
  const [lang, setLang] = useState<Lang>('fr');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { result, aprValues, yearGroups } = useAmortization(params);

  const allExpanded = yearGroups.length > 0 && yearGroups.every((g) => expanded.has(g.year));

  const toggleAll = () => {
    setExpanded(allExpanded ? new Set() : new Set(yearGroups.map((g) => g.year)));
  };

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
        params={params}
        setParams={setParams}
        lang={lang}
        setLang={setLang}
        result={result}
        allExpanded={allExpanded}
        onToggleAll={toggleAll}
        apr={aprValues.taeg}
        aprExInsurance={aprValues.taegHA}
        air={aprValues.taea}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-4">
        {result && yearGroups.length > 0 ? (
          <AmortizationTable
            result={result}
            yearGroups={yearGroups}
            expanded={expanded}
            onToggleYear={toggleYear}
            lang={lang}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {t('noResult', lang)}
          </div>
        )}
      </main>
    </div>
  );
}
