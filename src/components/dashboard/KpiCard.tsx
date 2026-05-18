import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

/**
 * Presentation-only KPI tile.
 *
 * KpiCard never calculates, formats, or fetches anything. All numeric
 * values arrive as already-formatted strings from the
 * `features/emissions/formatters.ts` layer so this component remains
 * fully decoupled from the domain.
 *
 *  - `accent`    : highlights the card with the dashboard's orange
 *                  accent (used for the headline KPI, e.g. Total PCF).
 *  - `badge`     : small contextual label rendered top-right
 *                  (e.g. "CT-045", "Scope 2").
 *  - `value`     : primary, large metric line.
 *  - `supportingValue`: secondary unit/conversion line under the
 *                  primary value (e.g. kgCO2e under tCO2e).
 *  - `description`: small explanatory caption at the bottom.
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
