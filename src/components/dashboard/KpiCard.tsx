import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

/**
 * KPI 숫자만 보여 주는 카드.
 *
 * 계산·포맷·데이터 조회는 하지 않는다.
 * 숫자는 `features/emissions/formatters.ts`에서 이미 문자열로 만들어 넘기고,
 * 이 컴포넌트는 도메인 로직과 분리해 둔다.
 *
 *  - `accent`         : 오렌지 강조(대표 KPI용, 예: 총 PCF).
 *  - `badge`          : 우측 상단 작은 라벨(예: "CT-045", "Scope 2").
 *  - `value`          : 크게 보이는 주요 수치.
 *  - `supportingValue`: 주요 수치 아래 보조 단위·환산(예: tCO2e 아래 kgCO2e).
 *  - `description`    : 하단 짧은 설명 문구.
 */
export interface KpiCardProps {
  label: string;
  value: string;
  description?: string;
  supportingValue?: string;
  badge?: string;
  accent?: boolean;
  className?: string;
}

export function KpiCard({
  label,
  value,
  description,
  supportingValue,
  badge,
  accent = false,
  className,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        accent &&
          'border-orange-200 ring-1 ring-orange-200/60 dark:border-orange-900/60 dark:ring-orange-900/40',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {label}
        </p>
        {badge ? (
          <Badge variant={accent ? 'accent' : 'neutral'}>{badge}</Badge>
        ) : null}
      </div>

      <p
        className={cn(
          'mt-3 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl',
          accent
            ? 'text-orange-700 dark:text-orange-300'
            : 'text-neutral-900 dark:text-neutral-50',
        )}
      >
        {value}
      </p>

      {supportingValue ? (
        <p className="mt-1 text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
          {supportingValue}
        </p>
      ) : null}

      {description ? (
        <p className="mt-3 text-sm leading-5 text-neutral-600 dark:text-neutral-300">
          {description}
        </p>
      ) : null}
    </Card>
  );
}
