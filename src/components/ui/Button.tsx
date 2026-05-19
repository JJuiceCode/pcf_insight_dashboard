import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900 disabled:cursor-not-allowed disabled:opacity-60';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'h-9 px-3.5 bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700 disabled:hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-400 dark:disabled:hover:bg-orange-500',
  secondary:
    'h-9 px-3.5 border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800',
  ghost:
    'h-9 px-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50',
};

export function Button({
  variant = 'primary',
  className,
  type,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(BASE, VARIANT_CLASSES[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
