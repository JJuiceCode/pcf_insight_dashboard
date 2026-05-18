/**
 * Minimal className combinator.
 *
 * Intentionally lightweight: no `clsx`, no `tailwind-merge`. The
 * dashboard's component layer only needs to (a) join class strings and
 * (b) skip falsy values produced by short-circuit expressions like
 * `accent && 'border-orange-200'`.
 */
export type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter((value): value is string => Boolean(value)).join(' ');
}
