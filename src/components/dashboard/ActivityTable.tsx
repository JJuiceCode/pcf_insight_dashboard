'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import {
  formatActivityTypeLabel,
  formatKgCO2e,
  formatMonth,
  formatNumber,
  formatScopeLabel,
} from '@/features/emissions/formatters';
import {
  ACTIVITY_TYPES,
  GHG_SCOPES,
  type ActivityType,
  type CalculatedEmissionRow,
  type EmissionFactor,
  type GhgScope,
} from '@/features/emissions/types';
import { cn } from '@/lib/utils';

/**
 * 활동별 계산 결과를 검증하는 읽기 전용 테이블.
 *
 * 각 활동 레코드가 어떤 배출계수와 매칭되었고,
 * 최종 배출량·GHG Scope·계수 버전이 어떻게 적용되었는지 확인한다.
 *
 * 이 컴포넌트는 계산이나 데이터 변경을 수행하지 않고,
 * `CalculatedEmissionRow`와 포맷터가 넘겨준 값을 화면에 표시하는 역할만 담당한다.
 *
 * 필터는 이미 계산된 행을 좁히는 클라이언트 상태로만 동작한다.
 * 배출량을 재계산하지 않고, 원본 `rows` 배열도 변경하지 않는다.
 */
export interface ActivityTableProps {
  rows: readonly CalculatedEmissionRow[];
  /**
   * 오늘 시점에 카테고리별로 활성인 배출계수 목록.
   * 헤더 하단의 "현재 적용 중인 배출계수" 칩 바를 렌더링하기 위해 사용한다.
   * 비어 있으면 칩 바는 표시되지 않는다.
   */
  activeFactors?: readonly EmissionFactor[];
  /** 헤더의 "활동 추가" 버튼이 눌렸을 때 실행할 콜백. 없으면 버튼이 숨겨진다. */
  onAddClick?: () => void;
}

const PLACEHOLDER = '—';
const TABLE_COLUMN_COUNT = 11;

/**
 * 운영자가 활동 행을 좁혀볼 때 사용하는 필터 상태.
 * 모든 값의 기본은 `'all'`이고, 한 항목도 데이터를 제외하지 않는다.
 */
type ActivityTableFilters = {
  month: string;
  activityType: 'all' | ActivityType;
  scope: 'all' | GhgScope;
  description: string;
};

const DEFAULT_FILTERS: ActivityTableFilters = {
  month: 'all',
  activityType: 'all',
  scope: 'all',
  description: 'all',
};

/**
 * 운영자가 선택할 수 있는 정렬 키.
 *
 * 기본은 "큰 값을 위로" 패턴(`-desc`)이지만, 검토 흐름상
 * 시계열 처음부터 추적해야 할 때가 있어 날짜는 오름차순(`date-asc`)도 노출한다.
 */
type ActivityTableSortKey =
  | 'emission-desc'
  | 'date-desc'
  | 'date-asc'
  | 'amount-desc';

const DEFAULT_SORT_KEY: ActivityTableSortKey = 'date-desc';

const SORT_OPTIONS: readonly { value: ActivityTableSortKey; label: string }[] =
  [
    { value: 'emission-desc', label: 'PCF 높은 순' },
    { value: 'date-desc', label: '날짜 최신순' },
    { value: 'date-asc', label: '날짜 오래된순' },
    { value: 'amount-desc', label: '활동량 높은 순' },
  ];

/**
 * 도메인에 정의된 알려진 설명 라벨.
 *
 * 현재 데이터에 해당 설명이 없어도 운영자가 즉시 검증할 수 있도록
 * 항상 선택 가능한 옵션으로 노출한다.
 */
const KNOWN_DESCRIPTIONS: readonly string[] = [
  '한국전력',
  '플라스틱 1',
  '플라스틱 2',
  '트럭',
];

export function ActivityTable({
  rows,
  activeFactors,
  onAddClick,
}: ActivityTableProps) {
  const [filters, setFilters] = useState<ActivityTableFilters>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<ActivityTableSortKey>(DEFAULT_SORT_KEY);

  const monthOptions = useMemo(() => collectMonthOptions(rows), [rows]);
  const descriptionOptions = useMemo(
    () => collectDescriptionOptions(rows),
    [rows],
  );

  const filteredRows = useMemo(
    () => filterActivityRows(rows, filters),
    [rows, filters],
  );

  // 정렬은 항상 필터 결과 위에서 수행한다.
  // filter → sort 순서로 흐름을 고정해 운영자에게 보이는 카운트(`filteredRows.length`)와
  // 실제 렌더 행 수가 정확히 일치하도록 한다.
  const visibleRows = useMemo(
    () => sortActivityRows(filteredRows, sortKey),
    [filteredRows, sortKey],
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const invalidCount = rows.reduce(
    (count, row) => (row.isValid ? count : count + 1),
    0,
  );

  return (
    <section aria-labelledby="activity-table-title">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] font-medium tracking-wider text-accent uppercase">
              계산 검증
            </p>
            <h3
              id="activity-table-title"
              className="mt-1 text-base font-semibold tracking-tight text-foreground"
            >
              활동 데이터 및 배출계수 매칭
            </h3>
            <p className="mt-1 text-xs text-muted">
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
                <span aria-hidden className="text-base leading-none">
                  +
                </span>
                활동 추가
              </Button>
            ) : null}
          </div>
        </header>

        {activeFactors && activeFactors.length > 0 ? (
          <ActiveFactorsBar factors={activeFactors} />
        ) : null}

        <ActivityFilterBar
          filters={filters}
          monthOptions={monthOptions}
          descriptionOptions={descriptionOptions}
          totalCount={rows.length}
          visibleCount={filteredRows.length}
          sortKey={sortKey}
          onChange={setFilters}
          onReset={resetFilters}
          onSortChange={setSortKey}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-sm">
            <thead className="bg-background/60 text-left text-[11px] font-medium tracking-wider text-muted uppercase">
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
              {visibleRows.length === 0 ? (
                <EmptyFilteredRow onReset={resetFilters} />
              ) : (
                visibleRows.map((row) => (
                  <ActivityRow key={row.activity.id} row={row} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/**
 * 계산이 끝난 활동 행을 사용자가 선택한 필터 기준으로 좁힌다.
 *
 * - month/activityType/description은 `activity` 필드만 보고 판단해
 *   유효하지 않은 행도 필터 대상이 된다.
 * - scope는 `row.scope`에만 존재하므로, 특정 Scope를 선택했을 때는
 *   계수 매칭이 실패해 scope가 없는 행은 제외된다.
 *   "전체"를 선택하면 그대로 유지된다.
 */
function filterActivityRows(
  rows: readonly CalculatedEmissionRow[],
  filters: ActivityTableFilters,
): CalculatedEmissionRow[] {
  return rows.filter((row) => {
    const { activity, scope } = row;

    if (
      filters.month !== 'all' &&
      toMonthKey(activity.date) !== filters.month
    ) {
      return false;
    }

    if (
      filters.activityType !== 'all' &&
      activity.activityType !== filters.activityType
    ) {
      return false;
    }

    if (filters.scope !== 'all' && scope !== filters.scope) {
      return false;
    }

    if (
      filters.description !== 'all' &&
      activity.description !== filters.description
    ) {
      return false;
    }

    return true;
  });
}

/** `YYYY-MM-DD` ISO 날짜에서 `YYYY-MM` 월 키를 추출한다. */
function toMonthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

/**
 * 필터링이 끝난 행을 운영자가 선택한 키로 정렬한다.
 *
 * - 원본 배열은 변경하지 않고 항상 복사본을 정렬해 반환한다.
 * - 모든 옵션은 내림차순이다(큰 값/최신이 위로).
 * - 값이 같은 행은 `Array.prototype.sort`의 안정 정렬 특성에 따라
 *   필터링 직후의 상대 순서를 유지한다.
 * - 잘못된 날짜 문자열은 0으로 처리해 정렬이 throw하지 않게 한다.
 * - 유효하지 않은 행은 `emissionKgCO2e === 0`이므로 PCF 정렬에서 자연히 아래로 내려간다.
 *   계산을 다시 수행하지 않으며, scope 등 다른 필드를 검사하지도 않는다.
 */
function sortActivityRows(
  rows: readonly CalculatedEmissionRow[],
  sortKey: ActivityTableSortKey,
): CalculatedEmissionRow[] {
  const copy = [...rows];
  switch (sortKey) {
    case 'emission-desc':
      return copy.sort((a, b) => b.emissionKgCO2e - a.emissionKgCO2e);
    case 'amount-desc':
      return copy.sort((a, b) => b.activity.amount - a.activity.amount);
    case 'date-desc':
      return copy.sort(
        (a, b) => parseDateMs(b.activity.date) - parseDateMs(a.activity.date),
      );
    case 'date-asc':
      return copy.sort(
        (a, b) => parseDateMs(a.activity.date) - parseDateMs(b.activity.date),
      );
    default: {
      // 새 정렬 키가 추가되면 컴파일러가 여기서 잡아준다.
      const _exhaustive: never = sortKey;
      return _exhaustive;
    }
  }
}

/** ISO 날짜 문자열을 안전하게 epoch ms로 변환한다. 잘못된 입력은 0. */
function parseDateMs(isoDate: string): number {
  const ms = Date.parse(isoDate);
  return Number.isFinite(ms) ? ms : 0;
}

/** 행에서 발견된 모든 `YYYY-MM` 월 키를 오름차순 정렬해 반환한다. */
function collectMonthOptions(
  rows: readonly CalculatedEmissionRow[],
): readonly string[] {
  const set = new Set<string>();
  for (const row of rows) {
    set.add(toMonthKey(row.activity.date));
  }
  return Array.from(set).sort();
}

/**
 * 알려진 도메인 라벨과 실제 행에 등장한 설명을 합쳐 정렬한 고유 목록.
 * 데이터에 등장하지 않더라도 도메인 라벨은 항상 옵션으로 노출된다.
 */
function collectDescriptionOptions(
  rows: readonly CalculatedEmissionRow[],
): readonly string[] {
  const set = new Set<string>(KNOWN_DESCRIPTIONS);
  for (const row of rows) {
    if (row.activity.description) {
      set.add(row.activity.description);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'));
}

function isFilterActive(filters: ActivityTableFilters): boolean {
  return (
    filters.month !== 'all' ||
    filters.activityType !== 'all' ||
    filters.scope !== 'all' ||
    filters.description !== 'all'
  );
}

interface ActivityFilterBarProps {
  filters: ActivityTableFilters;
  monthOptions: readonly string[];
  descriptionOptions: readonly string[];
  totalCount: number;
  visibleCount: number;
  sortKey: ActivityTableSortKey;
  onChange: (next: ActivityTableFilters) => void;
  onReset: () => void;
  onSortChange: (next: ActivityTableSortKey) => void;
}

/** 테이블 상단 필터·정렬 바. 모든 컨트롤은 로컬 상태에만 영향을 준다. */
function ActivityFilterBar({
  filters,
  monthOptions,
  descriptionOptions,
  totalCount,
  visibleCount,
  sortKey,
  onChange,
  onReset,
  onSortChange,
}: ActivityFilterBarProps) {
  const filterActive = isFilterActive(filters);

  return (
    <div
      aria-label="활동 필터"
      className="border-b border-border bg-surface px-5 py-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterField label="기간" htmlFor="activity-filter-month">
          <Select
            id="activity-filter-month"
            value={filters.month}
            onChange={(event) =>
              onChange({ ...filters, month: event.target.value })
            }
            aria-label="기간 필터"
          >
            <option value="all">전체</option>
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </Select>
        </FilterField>

        <FilterField label="활동 유형" htmlFor="activity-filter-type">
          <Select
            id="activity-filter-type"
            value={filters.activityType}
            onChange={(event) =>
              onChange({
                ...filters,
                activityType: event.target.value as 'all' | ActivityType,
              })
            }
            aria-label="활동 유형 필터"
          >
            <option value="all">전체</option>
            {ACTIVITY_TYPES.map((activityType) => (
              <option key={activityType} value={activityType}>
                {formatActivityTypeLabel(activityType)}
              </option>
            ))}
          </Select>
        </FilterField>

        <FilterField label="GHG Scope" htmlFor="activity-filter-scope">
          <Select
            id="activity-filter-scope"
            value={filters.scope}
            onChange={(event) =>
              onChange({
                ...filters,
                scope: event.target.value as 'all' | GhgScope,
              })
            }
            aria-label="GHG Scope 필터"
          >
            <option value="all">전체</option>
            {GHG_SCOPES.map((scope) => (
              <option key={scope} value={scope}>
                {formatScopeLabel(scope)}
              </option>
            ))}
          </Select>
        </FilterField>

        <FilterField label="설명" htmlFor="activity-filter-description">
          <Select
            id="activity-filter-description"
            value={filters.description}
            onChange={(event) =>
              onChange({ ...filters, description: event.target.value })
            }
            aria-label="설명 필터"
          >
            <option value="all">전체</option>
            {descriptionOptions.map((description) => (
              <option key={description} value={description}>
                {description}
              </option>
            ))}
          </Select>
        </FilterField>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:min-w-[200px]">
          <label
            htmlFor="activity-sort"
            className="text-[11px] font-medium tracking-wider text-muted uppercase"
          >
            정렬
          </label>
          <Select
            id="activity-sort"
            value={sortKey}
            onChange={(event) =>
              onSortChange(event.target.value as ActivityTableSortKey)
            }
            aria-label="정렬 기준"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:justify-end">
          <p aria-live="polite" className="text-muted">
            전체 <span className="tabular-nums">{totalCount}</span>건 중{' '}
            <span className="font-semibold text-foreground tabular-nums">
              {visibleCount}
            </span>
            건 표시
            {filterActive ? (
              <span className="ml-1.5 text-accent">· 필터 적용 중</span>
            ) : null}
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={onReset}
            disabled={!filterActive}
            aria-label="필터 초기화"
            className="h-8 px-3 text-xs"
          >
            필터 초기화
          </Button>
        </div>
      </div>
    </div>
  );
}

/** 필터 라벨 + 컨트롤 래퍼. 라벨 클릭으로도 컨트롤에 포커스가 가도록 `htmlFor` 사용. */
function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-medium tracking-wider text-muted uppercase"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function EmptyFilteredRow({ onReset }: { onReset: () => void }) {
  return (
    <tr>
      <td
        colSpan={TABLE_COLUMN_COUNT}
        className="px-5 py-12 text-center text-sm text-muted"
      >
        <div className="flex flex-col items-center gap-3">
          <p>선택한 필터 조건에 해당하는 활동 데이터가 없습니다.</p>
          <Button
            type="button"
            variant="secondary"
            onClick={onReset}
            className="h-8 px-3 text-xs"
          >
            필터 초기화
          </Button>
        </div>
      </td>
    </tr>
  );
}

function ActivityRow({ row }: { row: CalculatedEmissionRow }) {
  const { activity, emissionFactor, scope, isValid } = row;

  return (
    <tr
      className={cn(
        'border-t border-border align-middle',
        isValid
          ? 'hover:bg-accent-soft/50'
          : // amber tones are intentionally kept: invalid rows must remain
            // visually distinct as a data-quality warning across both themes.
            'bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30',
      )}
    >
      <Td mono>{activity.date}</Td>
      <Td>
        <span className="font-medium text-foreground">
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
          <span className="font-medium text-foreground">
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

/**
 * 헤더 아래에 표시되는 "현재 적용 중인 배출계수" 칩 바.
 *
 * 칩에 노출되는 값은 schema(`EmissionFactor` 테이블) → repository(`findAllEmissionFactors`)
 * → service(`listActiveFactorsAt` / `pickActiveEmissionFactor`)를 거쳐 만들어진다.
 * 새 버전을 등록하면 이 영역이 바로 새 활성 계수로 바뀌므로,
 * DB의 계수 변경이 화면에 어떻게 반영되는지 한눈에 확인할 수 있다.
 */
function ActiveFactorsBar({ factors }: { factors: readonly EmissionFactor[] }) {
  return (
    <div
      aria-label="현재 적용 중인 배출계수"
      className="border-b border-border bg-background/60 px-5 py-3"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-medium tracking-wider text-muted uppercase">
          현재 적용 중인 배출계수
        </p>
        <p className="text-[11px] text-muted">
          DB의 활성 버전이 그대로 표시됩니다.
        </p>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {factors.map((factor) => (
          <li key={factor.id}>
            <FactorChip factor={factor} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FactorChip({ factor }: { factor: EmissionFactor }) {
  return (
    <span
      title={`적용 시작: ${factor.effectiveFrom}`}
      className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-border bg-surface px-3 py-1 text-xs shadow-sm"
    >
      <span className="font-medium text-foreground">
        {formatActivityTypeLabel(factor.activityType)} · {factor.name}
      </span>
      <span className="font-semibold text-foreground tabular-nums">
        {formatNumber(factor.factor)}
      </span>
      <span className="text-muted">{factor.factorUnit}</span>
      <Badge variant="neutral">{formatScopeLabel(factor.scope)}</Badge>
      <span className="text-[11px] text-muted tabular-nums">
        v{factor.version}
      </span>
    </span>
  );
}

/** 테이블 헤더 셀. */
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

/** 테이블 바디 셀. */
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
        muted ? 'text-muted' : 'text-foreground/90',
      )}
    >
      {children}
    </td>
  );
}
