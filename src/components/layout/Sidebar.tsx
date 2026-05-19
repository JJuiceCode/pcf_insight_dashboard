'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  /** 사용자에게 보이는 보조 설명. 메뉴가 늘어났을 때 의도를 빠르게 알 수 있게 한다. */
  description?: string;
}

/**
 * 사이드바 네비게이션 메뉴 정의.
 *
 * 활성 여부는 현재 라우트(`usePathname`)에서 동적으로 판단하므로
 * 여기서는 라벨과 경로만 선언한다.
 */
const NAV_ITEMS: readonly NavItem[] = [
  {
    label: '대시보드',
    href: '/',
    description: 'CT-045 시드 기반 PCF 현황',
  },
  {
    label: '데이터 가져오기',
    href: '/import',
    description: 'Excel 파일 업로드 워크플로우',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="border-b border-neutral-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0 dark:border-neutral-800 dark:bg-neutral-950"
      aria-label="주요 네비게이션"
    >
      <div className="flex items-center gap-2 px-4 py-4 lg:px-6 lg:py-6">
        <span
          aria-hidden
          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20 dark:bg-orange-500/15 dark:text-orange-400 dark:ring-orange-500/30"
        >
          <span className="text-sm font-semibold tracking-tight">PCF</span>
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Insight
          </p>
          <p className="text-[11px] tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
            CT-045 Monitor
          </p>
        </div>
      </div>

      <nav
        aria-label="대시보드 메뉴"
        className="px-2 pb-3 lg:flex-1 lg:px-3 lg:pb-6"
      >
        <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <li key={item.href} className="shrink-0 lg:shrink">
              <SidebarLink item={item} isActive={isItemActive(pathname, item)} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="hidden border-t border-neutral-200 px-6 py-4 text-[11px] text-neutral-500 lg:block dark:border-neutral-800 dark:text-neutral-400">
        <p className="font-medium text-neutral-700 dark:text-neutral-300">
          보고 기간
        </p>
        <p className="mt-0.5">2025년 1월 ~ 8월</p>
      </div>
    </aside>
  );
}

/**
 * 라우트 기반 활성 여부 판별.
 * 루트(`/`)는 정확히 일치할 때만, 그 외 경로는 `startsWith`로 하위 라우트도 활성으로 본다.
 * `pathname`이 null인 초기 SSR 케이스에서도 안전하게 false로 폴백한다.
 */
function isItemActive(pathname: string | null, item: NavItem): boolean {
  if (!pathname) return false;
  if (item.href === '/') return pathname === '/';
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function SidebarLink({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const base =
    'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500';

  if (isActive) {
    return (
      <Link
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
      </Link>
    );
  }

  return (
    <Link
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
    </Link>
  );
}
