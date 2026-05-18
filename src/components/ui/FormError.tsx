import type { ReactNode } from 'react';

export interface FormErrorProps {
  id?: string;
  children?: ReactNode;
}

/**
 * Inline error/helper text under a form field. Renders nothing when
 * `children` is empty so callers can pass conditional error strings
 * without an extra ternary at the call site.
 */
export function FormError({ id, children }: FormErrorProps) {
  if (!children) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 text-xs text-red-600 dark:text-red-400"
    >
      {children}
    </p>
  );
}
