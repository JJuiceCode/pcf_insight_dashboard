import type { ReactNode } from 'react';

/**
 * 폼 필드 인라인 오류 메시지.
 *
 * `role="alert"`로 노출해 첫 등장 시 보조 기술이 메시지를 알리도록 한다.
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
