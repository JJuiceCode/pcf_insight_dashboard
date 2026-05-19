/**
 * `clsx`, `tailwind-merge` 등을 사용하지 않고 조건부 class 조합을 위한 유틸.
 * ex:
 * className={cn('base-class',
 * isActive && 'text-orange-500',
 * disabled && 'opacity-50')}
 */
export type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter((value): value is string => Boolean(value)).join(' ');
}
