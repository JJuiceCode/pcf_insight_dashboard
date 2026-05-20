'use client';

import { useId, type SVGProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * KRDS 날짜 입력 원칙을 따른 재사용 컴포넌트.
 *
 * 구성 요소:
 *   1) 라벨   - `<label htmlFor>`로 input과 명시 연결
 *   2) 입력 래퍼 - `focus-within` 링과 오류 색을 처리
 *   3) `input[type="date"]` - 키보드 직접 입력과 네이티브 picker를 모두 유지
 *   4) 캘린더 아이콘 - 시각적 단서만 제공(인라인 SVG)
 *   5) 도움말 텍스트 - 기대하는 입력 형식 항상 노출
 *   6) 에러 텍스트 - 유효성 실패 시 `role="alert"`로 안내
 *
 * 동작 규칙:
 *   - `readonly`로 두지 않으며 키보드 입력을 막지 않는다.
 *   - 별도의 캘린더 팝업을 구현하지 않고 네이티브 picker를 그대로 쓴다.
 *   - 우측 캘린더 아이콘은 `pointer-events-none`이고, 그 위치에는
 *     `::-webkit-calendar-picker-indicator`가 투명하게 깔려 클릭하면
 *     브라우저 기본 달력이 열린다. 사용자에게는 한 개의 아이콘만 보인다.
 */
export interface DateInputProps {
  id: string;
  label: string;
  value: string;
  required?: boolean;
  invalid?: boolean;
  /** `invalid`가 true이고 값이 있을 때 래퍼 아래에 표시된다. */
  errorMessage?: string | null;
  /** 항상 노출되는 형식 안내 문구. 기본 안내는 호출 측에서 결정한다. */
  hint?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export function DateInput({
  id,
  label,
  value,
  required = false,
  invalid = false,
  errorMessage,
  hint,
  onChange,
  onBlur,
}: DateInputProps) {
  const reactId = useId();
  const hintId = hint ? `${reactId}-hint` : undefined;
  const hasError = invalid && Boolean(errorMessage);
  const errorId = hasError ? `${reactId}-error` : undefined;

  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-1 text-xs font-medium text-foreground"
      >
        <span>{label}</span>
        {required ? (
          <span aria-hidden title="필수 입력" className="text-accent">
            *
          </span>
        ) : null}
      </label>

      <div
        className={cn(
          'relative flex items-center rounded-xl border bg-surface shadow-sm transition-colors',
          'border-border',
          'focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20',
          // status border: red is intentionally kept for invalid state.
          invalid &&
            'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20 dark:border-red-500/80',
        )}
      >
        <input
          id={id}
          type="date"
          value={value}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          className={cn(
            // 래퍼가 시각적 테두리를 담당하므로 input 자체는 투명·아웃라인 없음.
            'block w-full bg-transparent px-3 py-2 pr-10 text-sm text-foreground outline-none',
            'placeholder:text-muted',
            // 우측에 네이티브 picker indicator를 절대 배치로 깔아두고 투명 처리.
            // 사용자에게는 우리가 그린 아이콘만 보이지만, 클릭 시 브라우저 달력이 열린다.
            '[&::-webkit-calendar-picker-indicator]:absolute',
            '[&::-webkit-calendar-picker-indicator]:inset-y-0',
            '[&::-webkit-calendar-picker-indicator]:right-0',
            '[&::-webkit-calendar-picker-indicator]:w-10',
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
            '[&::-webkit-calendar-picker-indicator]:opacity-0',
            // 일부 브라우저에서 보이는 스피너 영역도 정리.
            '[&::-webkit-inner-spin-button]:appearance-none',
          )}
        />

        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted"
        >
          <CalendarIcon className="h-4 w-4" />
        </span>
      </div>

      {hint ? (
        <p id={hintId} className="mt-1 ml-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}

      {hasError ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1 ml-1 text-xs font-medium text-red-600 dark:text-red-400"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3.25" y="5" width="17.5" height="15.5" rx="2.25" />
      <path d="M3.25 10h17.5" />
      <path d="M8 3.5v3" />
      <path d="M16 3.5v3" />
    </svg>
  );
}
