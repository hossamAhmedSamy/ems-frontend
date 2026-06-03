import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface SelectFieldProps {
  value: string | undefined;
  onValueChange: (v: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
}

export function SelectField({
  value,
  onValueChange,
  placeholder,
  options,
  className,
  disabled,
}: SelectFieldProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand/20 disabled:opacity-50',
          className,
        )}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-slate-200 bg-white shadow-elevated"
        >
          <Select.Viewport className="p-1">
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

const SelectItem = forwardRef<
  HTMLDivElement,
  { value: string; children: ReactNode; className?: string }
>(({ value, children, className }, ref) => (
  <Select.Item
    ref={ref}
    value={value}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm px-7 py-1.5 text-sm text-slate-700 outline-none data-[highlighted]:bg-brand-50 data-[highlighted]:text-brand-700',
      className,
    )}
  >
    <span className="absolute left-2 flex h-3 w-3 items-center justify-center">
      <Select.ItemIndicator>
        <Check className="h-3 w-3" />
      </Select.ItemIndicator>
    </span>
    <Select.ItemText>{children}</Select.ItemText>
  </Select.Item>
));
SelectItem.displayName = 'SelectItem';
