import type { SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  children: ReactNode;
}

const BASE_SELECT =
  'block w-full appearance-none rounded-md border bg-white bg-[length:1rem_1rem] bg-[right_0.65rem_center] bg-no-repeat px-3 py-2 pr-9 text-sm text-neutral-900 shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-neutral-900 dark:text-neutral-50';

const DEFAULT_BORDER =
  'border-neutral-300 focus-visible:border-orange-500 focus-visible:ring-orange-500/40 dark:border-neutral-700';

const ERROR_BORDER =
  'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/40 dark:border-red-500/80';

const CHEVRON_LIGHT =
  "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='%23737373' stroke-width='1.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")]";

export function Select({
  className,
  hasError = false,
  children,
  ...rest
}: SelectProps) {
  return (
    <select
      className={cn(
        BASE_SELECT,
        CHEVRON_LIGHT,
        hasError ? ERROR_BORDER : DEFAULT_BORDER,
        className,
      )}
      aria-invalid={hasError || undefined}
      {...rest}
    >
      {children}
    </select>
  );
}
