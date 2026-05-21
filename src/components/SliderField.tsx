import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { fmt } from '@/lib/format';

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  format?: (v: number) => string;
}

export default function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  format: fmtFn,
}: SliderFieldProps) {
  const display = fmtFn ? fmtFn(value) : fmt(value);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <Label className="text-[11px] font-medium tracking-wider text-muted-foreground">
          {label}
        </Label>
        <span className="text-xs tabular-nums text-foreground/80">
          {display}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}
