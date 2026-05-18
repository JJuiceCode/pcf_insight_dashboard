import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Generic surface primitive.
 *
 * Card is intentionally style-only: it has no domain semantics, no
 * heading slot, and no built-in padding variants. Consumers compose
 * their own internal structure (titles, badges, KPI values, ...) so
 * the same primitive can back KPI cards, placeholder panels, table
 * containers, chart frames, and the eventual "assumptions" callout.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const BASE_CARD =
  'rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900';

export function Card({ children, className, ...rest }: CardProps) {
  return (
    <div className={cn(BASE_CARD, className)} {...rest}>
      {children}
    </div>
  );
}
