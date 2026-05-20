import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** true이면 오류 상태 스타일과 `aria-invalid` 속성이 적용된다. */
  hasError?: boolean;
}

const BASE_INPUT =
  'block w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 read-only:cursor-default';

const DEFAULT_BORDER =
  'border-border focus-visible:border-accent focus-visible:ring-accent/30';

// status border: red is intentionally kept so error state stays unambiguous.
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
