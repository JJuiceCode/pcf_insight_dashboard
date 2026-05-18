import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * badge 스타일 종류.
 *
 * 색을 자유롭게 넘기지 않고 정해진 프리셋만 쓴다.
 * 대시보드 전체 색감이 흩어지지 않게 하기 위함이다.
 *
 *  - neutral: 기본 라벨·단위·일반 메타정보
 *  - accent : PCF 강조(오렌지), 활성 Scope·제품 코드 등
 *  - success: 긍정·개선 신호(낮을수록 좋은 지표 등)
 *  - warning: 데이터 품질 이슈(배출계수 누락 등)
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
