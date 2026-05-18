import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Visual flavor of a badge. Mapped to a fixed style preset rather than
 * an arbitrary color prop so the dashboard cannot drift into
 * inconsistent palettes.
 *
 *  - neutral: default labels, units, generic metadata
 *  - accent : PCF emphasis (orange), e.g. active scope, product code
 *  - success: positive states, lower-is-better signals
 *  - warning: data-quality issues (e.g. missing emission factor)
 */
export type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const BASE_BADGE =
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral:
    'border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
  accent:
    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
  warning:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
};

export function Badge({
  variant = 'neutral',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(BASE_BADGE, VARIANT_CLASSES[variant], className)}
      {...rest}
    >
      {children}
    </span>
  );
}
