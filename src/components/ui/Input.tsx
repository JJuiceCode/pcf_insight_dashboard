import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** When true the field is rendered in its error state. */
  hasError?: boolean;
}

const BASE_INPUT =
  'block w-full rounded-md border bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-colors placeholder:text-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 read-only:cursor-default dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500';

const DEFAULT_BORDER =
  'border-neutral-300 focus-visible:border-orange-500 focus-visible:ring-orange-500/40 dark:border-neutral-700';

const ERROR_BORDER =
  'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/40 dark:border-red-500/80';

export function Input({ className, hasError = false, ...rest }: InputProps) {
  return (
    <input
      className={cn(
        BASE_INPUT,
        hasError ? ERROR_BORDER : DEFAULT_BORDER,
        className,
      )}
      aria-invalid={hasError || undefined}
      {...rest}
    />
  );
}
