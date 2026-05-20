import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * 대시보드 공통 카드 UI 컴포넌트.
 *
 * 카드의 기본 스타일만 제공하며,
 * 내부 콘텐츠(제목, KPI, 차트, 테이블 등)는 외부에서 구성한다.
 *
 * KPI 카드, 차트 영역, 테이블, 안내 섹션 등
 * 다양한 대시보드 블록에서 재사용한다.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const BASE_CARD =
  'rounded-2xl border border-border bg-surface p-5 shadow-sm';

export function Card({ children, className, ...rest }: CardProps) {
  return (
    <div className={cn(BASE_CARD, className)} {...rest}>
      {children}
    </div>
  );
}
