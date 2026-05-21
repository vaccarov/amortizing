import type { InputHTMLAttributes } from 'react';
import { type ChangeEvent, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FieldProps {
  label: string;
  id: string;
  value: string | number;
  onChange: (val: string | number) => void;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  step?: string | number;
  min?: number;
  max?: number;
  suffix?: string;
}

export default function Field({
  label,
  id,
  value,
  onChange,
  type = 'number',
  step,
  min,
  max,
  suffix,
}: FieldProps) {
  const [raw, setRaw] = useState(String(value));
  const [error, setError] = useState(false);

  useEffect(() => {
    setRaw(String(value));
    setError(false);
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setRaw(v);

    if (type === 'date') {
      onChange(v);
      return;
    }

    if (v === '') {
      setError(true);
      return;
    }
    const parsed = parseFloat(v);
    if (Number.isNaN(parsed)) {
      setError(true);
      return;
    }
    setError(false);
    onChange(parsed);
  };

  return (
    <div>
      <Label htmlFor={id} className="mb-1 text-[11px] tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          value={raw}
          step={step}
          min={min}
          max={max}
          onChange={handleChange}
          aria-invalid={error || undefined}
          className="h-7 text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          style={{
            textAlign: type === 'number' ? 'right' : undefined,
            paddingRight: suffix ? 28 : undefined,
          }}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
