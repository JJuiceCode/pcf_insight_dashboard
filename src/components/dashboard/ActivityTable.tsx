import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  formatActivityTypeLabel,
  formatKgCO2e,
  formatNumber,
  formatScopeLabel,
} from '@/features/emissions/formatters';
import type { CalculatedEmissionRow } from '@/features/emissions/types';
import { cn } from '@/lib/utils';

/**
 * 활동별 계산 결과를 검증하는 읽기 전용 테이블.
 *
 * 각 활동 레코드가 어떤 배출계수와 매칭되었고,
 * 최종 배출량·GHG Scope·계수 버전이 어떻게 적용되었는지 확인한다.
 *
 * 이 컴포넌트는 계산이나 데이터 변경을 수행하지 않고,
 * `CalculatedEmissionRow`와 포맷터가 넘겨준 값을 화면에 표시하는 역할만 담당한다.
 */
export interface ActivityTableProps {
  rows: readonly CalculatedEmissionRow[];
  /** Optional action wired to the section header ("Add activity"). */
  onAddClick?: () => void;
}

const PLACEHOLDER = '—';

export function ActivityTable({ rows, onAddClick }: ActivityTableProps) {
  const invalidCount = rows.reduce(
    (count, row) => (row.isValid ? count : count + 1),
    0,
  );

  return (
    <section aria-labelledby="activity-table-title">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <div>
            <p className="text-[11px] font-medium tracking-wider text-orange-600 uppercase dark:text-orange-400">
              계산 검증
            </p>
            <h3
              id="activity-table-title"
              className="mt-1 text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
            >
              활동 데이터 및 배출계수 매칭
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              각 활동의 계산 결과를 검증하는 읽기 전용 뷰.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{rows.length} 건</Badge>
            {invalidCount > 0 ? (
              <Badge variant="warning">{invalidCount} 검토 필요</Badge>
            ) : (
              <Badge variant="success">모두 매칭됨</Badge>
            )}
            {onAddClick ? (
              <Button
                variant="primary"
                onClick={onAddClick}
                className="ml-1"
                aria-label="활동 추가"
              >
                <span aria-hidden className="text-base leading-none">+</span>
                활동 추가
              </Button>
            ) : null}
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-sm">
            <thead className="bg-neutral-50 text-left text-[11px] font-medium tracking-wider text-neutral-500 uppercase dark:bg-neutral-950/60 dark:text-neutral-400">
              <tr>
                <Th>날짜</Th>
                <Th>활동 유형</Th>
                <Th>설명</Th>
                <Th align="right">수량</Th>
                <Th>단위</Th>
                <Th align="right">배출계수</Th>
                <Th>배출계수 단위</Th>
                <Th align="right">배출량</Th>
                <Th>GHG Scope</Th>
                <Th>버전</Th>
                <Th>상태</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <ActivityRow key={row.activity.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ActivityRow({ row }: { row: CalculatedEmissionRow }) {
  const { activity, emissionFactor, scope, isValid } = row;

  return (
    <tr
      className={cn(
        'border-t border-neutral-200 align-middle dark:border-neutral-800',
        isValid
          ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
          : 'bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30',
      )}
    >
      <Td mono>{activity.date}</Td>
      <Td>
        <span className="font-medium text-neutral-900 dark:text-neutral-50">
          {formatActivityTypeLabel(activity.activityType)}
        </span>
      </Td>
      <Td>{activity.description}</Td>
      <Td align="right" mono>
        {formatNumber(activity.amount)}
      </Td>
      <Td muted>{activity.unit}</Td>
      <Td align="right" mono>
        {emissionFactor ? formatNumber(emissionFactor.factor) : PLACEHOLDER}
      </Td>
      <Td muted>{emissionFactor?.factorUnit ?? PLACEHOLDER}</Td>
      <Td align="right" mono>
        {isValid ? (
          <span className="font-medium text-neutral-900 dark:text-neutral-50">
            {formatKgCO2e(row.emissionKgCO2e)}
          </span>
        ) : (
          PLACEHOLDER
        )}
      </Td>
      <Td>
        {scope ? (
          <Badge variant="neutral">{formatScopeLabel(scope)}</Badge>
        ) : (
          PLACEHOLDER
        )}
      </Td>
      <Td muted mono>
        {emissionFactor?.version ?? PLACEHOLDER}
      </Td>
      <Td>
        {isValid ? (
          <Badge variant="neutral">매칭 완료</Badge>
        ) : (
          <Badge
            variant="warning"
            title={row.errorMessage}
            aria-label={row.errorMessage}
          >
            검토 필요
          </Badge>
        )}
      </Td>
    </tr>
  );
}

/** Header cell. */
function Th({
  children,
  align = 'left',
}: {
  children: ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      scope="col"
      className={cn(
        'px-3 py-2.5 whitespace-nowrap',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

/** Body cell. */
function Td({
  children,
  align = 'left',
  muted = false,
  mono = false,
}: {
  children: ReactNode;
  align?: 'left' | 'right';
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <td
      className={cn(
        'px-3 py-2.5 whitespace-nowrap',
        align === 'right' ? 'text-right' : 'text-left',
        mono && 'tabular-nums',
        muted
          ? 'text-neutral-500 dark:text-neutral-400'
          : 'text-neutral-700 dark:text-neutral-200',
      )}
    >
      {children}
    </td>
  );
}
