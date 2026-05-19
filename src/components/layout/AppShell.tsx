import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

/**
 * 대시보드 전체 레이아웃을 담당하는 App Shell.
 *
 * 레이아웃 구조만 관리하며,
 * 비즈니스 데이터나 상태에는 관여하지 않는다.
 *
 * `lg(viewport:1024px)` 이상에서는 사이드바를 고정된 좌측 영역으로 배치하고,
 * 작은 화면에서는 상단 영역으로 자연스럽게 쌓이도록 구성
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] dark:bg-neutral-950 dark:text-neutral-100">
      <Sidebar />
      <main className="min-w-0">{children}</main>
    </div>
  );
}
