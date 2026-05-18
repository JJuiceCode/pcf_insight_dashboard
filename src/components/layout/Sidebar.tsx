import { cn } from '@/lib/utils';

/**
 * 사이드바에 표시하는 네비게이션 항목.
 *
 * 이 단계에서는 `Dashboard`만 활성으로 연결한다.
 * 나머지 경로는 플레이스홀더로, 라우터·앱 상태 없이도
 * SaaS 셸이 완성된 느낌을 주기 위함이다.
 */
interface NavItem {
  label: string;
  href: string;
  isActive?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', href: '#dashboard', isActive: true },
  { label: 'Activity Data', href: '#activity-data' },
  { label: 'Scope Mapping', href: '#scope-mapping' },
  { label: 'Assumptions', href: '#assumptions' },
];

export function Sidebar() {
  return (
    <aside
      className={cn(
        'border-b border-neutral-200 bg-white',
        'dark:border-neutral-800 dark:bg-neutral-950',
        'lg:h-screen lg:sticky lg:top-0 lg:border-b-0 lg:border-r',
        'lg:flex lg:flex-col',
      )}
      aria-label="Primary"
    >
      <div className="flex items-center gap-2 px-4 py-4 lg:px-6 lg:py-6">
        <span
          aria-hidden
          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20 dark:bg-orange-500/15 dark:text-orange-400 dark:ring-orange-500/30"
        >
          <span className="text-sm font-semibold tracking-tight">
            PCF
          </span>
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Insight
          </p>
          <p className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            CT-045 Monitor
          </p>
        </div>
      </div>

      <nav
        aria-label="Dashboard navigation"
        className="px-2 pb-3 lg:flex-1 lg:px-3 lg:pb-6"
      >
        <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <li key={item.href} className="shrink-0 lg:shrink">
              <SidebarLink item={item} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="hidden border-t border-neutral-200 px-6 py-4 text-[11px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400 lg:block">
        <p className="font-medium text-neutral-700 dark:text-neutral-300">
          Reporting period
        </p>
        <p className="mt-0.5">Jan – Aug 2025</p>
      </div>
    </aside>
  );
}

function SidebarLink({ item }: { item: NavItem }) {
  const base =
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap';

  if (item.isActive) {
    return (
      <a
        href={item.href}
        aria-current="page"
        className={cn(
          base,
          'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
          'dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900/60',
        )}
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full bg-orange-500 dark:bg-orange-400"
        />
        {item.label}
      </a>
    );
  }

  return (
    <a
      href={item.href}
      className={cn(
        base,
        'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
        'dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-50',
      )}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700"
      />
      {item.label}
    </a>
  );
}
