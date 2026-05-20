import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'h-9 px-3.5 bg-accent text-white hover:bg-accent-dark active:bg-accent-dark disabled:hover:bg-accent',
  secondary:
    'h-9 px-3.5 border border-border bg-surface text-foreground hover:bg-accent-soft active:bg-accent-soft',
  ghost:
    'h-9 px-2 text-muted hover:bg-accent-soft hover:text-accent',
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
