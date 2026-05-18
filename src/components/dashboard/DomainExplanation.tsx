import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

/**
 * Concise primer for non-expert dashboard viewers.
 *
 * The copy intentionally lives in this component (not in seed data)
 * because it documents *how the dashboard reads its own data*, not
 * the data itself. Updating the GHG Protocol mapping in
 * `seed.ts` therefore does not require touching this file unless the
 * underlying domain rules change.
 */
interface ScopeExplanation {
  scope: 'Scope 1' | 'Scope 2' | 'Scope 3';
  variant: BadgeVariant;
  title: string;
  description: string;
}

const SCOPES: readonly ScopeExplanation[] = [
  {
    scope: 'Scope 1',
    variant: 'neutral',
    title: 'Direct emissions',
    description:
      'On-site fuel combustion, owned facilities, owned vehicles. Shown as 0 because the CT-045 dataset provides no direct emission activities.',
  },
  {
    scope: 'Scope 2',
    variant: 'accent',
    title: 'Purchased electricity',
    description:
      'Indirect emissions from grid electricity used during manufacturing — applied via the 한국전력 emission factor.',
  },
  {
    scope: 'Scope 3',
    variant: 'neutral',
    title: 'Upstream materials & logistics',
    description:
      'Emissions embedded in raw materials (플라스틱 1, 플라스틱 2) and indirect transport (트럭 ton-km).',
  },
];

export function DomainExplanation() {
  return (
    <section aria-labelledby="domain-explanation-title">
      <Card>
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-orange-600 dark:text-orange-400">
              What you are looking at
            </p>
            <h2
              id="domain-explanation-title"
              className="mt-1 text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
            >
              Understanding this Product Carbon Footprint
            </h2>
          </div>
          <Badge variant="accent">CT-045 Monitor</Badge>
        </header>

        <p className="mt-4 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          A <strong className="font-semibold text-neutral-900 dark:text-neutral-50">Product Carbon Footprint (PCF)</strong>{' '}
          is the total greenhouse gas emissions associated with making the
          CT-045 Computer Monitor, expressed in kgCO2e. Each activity
          record is converted into emissions using a versioned emission
          factor:
        </p>

        <p className="mt-3 inline-flex flex-wrap items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 font-mono text-[13px] text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
          <span>emissions (kgCO2e)</span>
          <span aria-hidden className="text-neutral-400 dark:text-neutral-500">=</span>
          <span>activity amount</span>
          <span aria-hidden className="text-neutral-400 dark:text-neutral-500">×</span>
          <span className="text-orange-600 dark:text-orange-400">emission factor</span>
        </p>

        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {SCOPES.map((entry) => (
            <li
              key={entry.scope}
              className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-800 dark:bg-neutral-950/40"
            >
              <Badge variant={entry.variant}>{entry.scope}</Badge>
              <p className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-50">
                {entry.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-neutral-600 dark:text-neutral-400">
                {entry.description}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
