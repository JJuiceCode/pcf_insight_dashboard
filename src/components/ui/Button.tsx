import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Three intentional flavors of action:
 *  - primary: the dashboard's accent action (orange). Use sparingly —
 *    typically one per surface (Add Activity, Submit).
 *  - secondary: cancel/dismiss-style neutral action.
 *  - ghost: low-emphasis icon or text-only action (e.g. close button).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60';

const SIZE = 'px-3 py-1.5';

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500/40 dark:bg-orange-500 dark:hover:bg-orange-400',
  secondary:
    'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 focus-visible:ring-neutral-400/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800',
  ghost:
    'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-400/40 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50',
};

export function Button({
  variant = 'secondary',
  className,
  type,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(BASE, SIZE, VARIANT[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
