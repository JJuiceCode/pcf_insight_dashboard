import type { ReactNode } from 'react';

/**
 * Inline form field error. Rendered as `role="alert"` so assistive
 * tech announces the message when it first appears.
 */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
    >
      {children}
    </p>
  );
}
