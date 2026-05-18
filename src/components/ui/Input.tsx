import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const BASE =
  'block w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors bg-white text-neutral-900 placeholder:text-neutral-400 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-500 read-only:bg-neutral-50 read-only:text-neutral-500 dark:read-only:bg-neutral-900 dark:read-only:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-60';

const NORMAL =
  'border-neutral-300 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-neutral-700 dark:focus:border-orange-400';

const INVALID =
  'border-red-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:border-red-700 dark:focus:border-red-500';

export function Input({ className, invalid, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(BASE, invalid ? INVALID : NORMAL, className)}
      {...rest}
    />
  );
}
