import { FormError } from './FormError';
import { Select } from './Select';

/**
 * KRDS-inspired date input rendered as three native `<select>`s
 * (year · month · day).
 *
 *  - Year range: 2000 — 2026 (descending, recent first).
 *  - Month range: 1 — 12.
 *  - Day range: always 1 — 31; days that don't exist for the
 *    currently selected year+month are disabled so the user cannot
 *    construct an impossible date like `2025-02-31`. If the year or
 *    month changes and the previously selected day becomes invalid,
 *    the day is auto-clamped to the last valid day of that month.
 *
 * Native `<select>` is used intentionally: the browser/OS provides
 * keyboard navigation, scrolling, and accessible focus rings for free,
 * and there's no custom popup state to manage.
 *
 * The outer API is unchanged on purpose — callers pass a `YYYY-MM-DD`
 * string (or `""`) just like the previous text/date implementation.
 */
export interface DateInputProps {
  id: string;
  label: string;
  /** `YYYY-MM-DD` or empty string while partial. */
  value: string;
  required?: boolean;
  invalid?: boolean;
  errorMessage?: string | null;
  hint?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

const YEAR_START = 2000;
const YEAR_END = 2026;

const YEAR_OPTIONS: ReadonlyArray<{ value: string; label: string }> = (() => {
  const out: Array<{ value: string; label: string }> = [];
  for (let y = YEAR_END; y >= YEAR_START; y -= 1) {
    out.push({ value: String(y), label: String(y) });
  }
  return out;
})();

const MONTH_OPTIONS: ReadonlyArray<{ value: string; label: string }> =
  Array.from({ length: 12 }, (_, i) => {
    const monthNumber = i + 1;
    return {
      value: String(monthNumber).padStart(2, '0'),
      label: String(monthNumber),
    };
  });

const DAY_OPTIONS: ReadonlyArray<{ value: string; label: string }> =
  Array.from({ length: 31 }, (_, i) => {
    const dayNumber = i + 1;
    return {
      value: String(dayNumber).padStart(2, '0'),
      label: String(dayNumber),
    };
  });

/**
 * Number of days in a given calendar month.
 *
 * `Date.UTC(year, month, 0)` returns the last day of the previous
 * month — so `Date.UTC(2025, 2, 0)` is 2025-02-28, `Date.UTC(2024, 2, 0)`
 * is 2024-02-29 (leap year), etc.
 */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

interface DateParts {
  year: string;
  month: string;
  day: string;
}

function parseDateParts(value: string): DateParts {
  if (!value) return { year: '', month: '', day: '' };
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) return { year: match[1], month: match[2], day: match[3] };
  // Partial values (produced by the component itself while only some
  // selects have been touched) are stored as `${year}-${month}-${day}`
  // with empty segments, so a simple split still recovers each part.
  const [y = '', m = '', d = ''] = value.split('-');
  return { year: y, month: m, day: d };
}

function composeDateString(year: string, month: string, day: string): string {
  if (!year && !month && !day) return '';
  return `${year}-${month}-${day}`;
}

export function DateInput({
  id,
  label,
  value,
  required,
  invalid,
  errorMessage,
  hint,
  onChange,
  onBlur,
}: DateInputProps) {
  const labelId = `${id}-label`;
  const yearId = `${id}-year`;
  const monthId = `${id}-month`;
  const dayId = `${id}-day`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = errorMessage ? `${id}-error` : undefined;
  const describedBy =
    [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const { year, month, day } = parseDateParts(value);

  const yearNum = Number(year);
  const monthNum = Number(month);
  const hasFullPrefix =
    year !== '' &&
    month !== '' &&
    Number.isFinite(yearNum) &&
    Number.isFinite(monthNum);
  const maxDay = hasFullPrefix ? daysInMonth(yearNum, monthNum) : 31;

  /**
   * Clamp the currently selected day against the constraints of a
   * (possibly new) year and month, so changing the month/year never
   * leaves the day at a non-existent value like Feb 31.
   */
  const clampDay = (
    nextYear: string,
    nextMonth: string,
    currentDay: string,
  ): string => {
    if (!nextYear || !nextMonth || !currentDay) return currentDay;
    const y = Number(nextYear);
    const m = Number(nextMonth);
    const d = Number(currentDay);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
      return currentDay;
    }
    const max = daysInMonth(y, m);
    return d > max ? String(max).padStart(2, '0') : currentDay;
  };

  const emit = (y: string, m: string, d: string): void => {
    onChange(composeDateString(y, m, d));
  };

  const handleYearChange = (nextYear: string): void => {
    emit(nextYear, month, clampDay(nextYear, month, day));
  };

  const handleMonthChange = (nextMonth: string): void => {
    emit(year, nextMonth, clampDay(year, nextMonth, day));
  };

  const handleDayChange = (nextDay: string): void => {
    emit(year, month, nextDay);
  };

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-required={required || undefined}
    >
      <span
        id={labelId}
        className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300"
      >
        {label}
        {required ? (
          <span aria-hidden className="text-orange-500 dark:text-orange-400">
            *
          </span>
        ) : null}
      </span>

      <div className="mt-1 grid grid-cols-3 gap-2">
        <Select
          id={yearId}
          aria-label="Year"
          value={year}
          required={required}
          invalid={invalid}
          onChange={(event) => handleYearChange(event.target.value)}
          onBlur={onBlur}
        >
          <option value="" disabled>
            Year
          </option>
          {YEAR_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          id={monthId}
          aria-label="Month"
          value={month}
          required={required}
          invalid={invalid}
          onChange={(event) => handleMonthChange(event.target.value)}
          onBlur={onBlur}
        >
          <option value="" disabled>
            Month
          </option>
          {MONTH_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          id={dayId}
          aria-label="Day"
          value={day}
          required={required}
          invalid={invalid}
          onChange={(event) => handleDayChange(event.target.value)}
          onBlur={onBlur}
        >
          <option value="" disabled>
            Day
          </option>
          {DAY_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={Number(option.value) > maxDay}
            >
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {hint ? (
        <p
          id={hintId}
          className="mt-1 text-xs text-neutral-500 dark:text-neutral-400"
        >
          {hint}
        </p>
      ) : null}

      {errorMessage ? (
        <FormError id={errorId}>{errorMessage}</FormError>
      ) : null}
    </div>
  );
}
