/**
 * `clsx`, `tailwind-merge` 등을 사용하지 않고 조건부 class를 합치는 유틸.
 *
 * 예시:
 *   className={cn(
 *     'base-class',
 *     isActive && 'text-orange-500',
 *     disabled && 'opacity-50',
 *   )}
 */
export type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter((value): value is string => Boolean(value)).join(' ');
}

/**
 * 진행률 바 등 UI용 퍼센트 값을 0~100 범위로 제한한다.
 * 유한하지 않은 값은 0으로 처리해 SSR과 브라우저가 같은 폭을 그리도록 한다.
 */
export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}
