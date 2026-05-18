import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

const BASE =
  "block w-full appearance-none rounded-md border bg-white px-3 py-2 pr-9 text-sm shadow-sm transition-colors text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 bg-no-repeat bg-[length:16px_16px] bg-[position:right_10px_center] bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2020%2020%22%20fill=%22none%22%20stroke=%22%23737373%22%20stroke-width=%221.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22><path%20d=%22M6%208l4%204%204-4%22/></svg>')]";

const NORMAL =
  'border-neutral-300 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-neutral-700 dark:focus:border-orange-400';

const INVALID =
  'border-red-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 dark:border-red-700 dark:focus:border-red-500';

export function Select({
  className,
  invalid,
  children,
  ...rest
}: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(BASE, invalid ? INVALID : NORMAL, className)}
      {...rest}
    >
      {children}
    </select>
  );
}
