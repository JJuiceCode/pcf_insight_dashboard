import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

/**
 * 대시보드 최상위 레이아웃 껍데기.
 *
 * 레이아웃만 담당하며 도메인 데이터는 읽거나 그리지 않는다.
 * `lg` 이상에서는 사이드바를 왼쪽 고정 열로 두고,
 * 그보다 작은 화면에서는 메인 위에 쌓아 JS 드로어 없이도
 * 태블릿·모바일에서 사용할 수 있게 한다.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <Sidebar />
      <main className="min-w-0">{children}</main>
    </div>
  );
}
