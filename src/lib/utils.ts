/**
 * 최소한의 className 조합 유틸.
 *
 * 의도적으로 가볍게 둔다. `clsx`, `tailwind-merge`는 쓰지 않는다.
 * 컴포넌트 레이어에는 (a) 클래스 문자열을 이어 붙이고
 * (b) `accent && 'border-orange-200'` 같은 단락 평가로 생긴
 * falsy 값을 건너뛰는 정도만 필요하다.
 */
export type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter((value): value is string => Boolean(value)).join(' ');
}
