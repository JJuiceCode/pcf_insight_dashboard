import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

/**
 * Top-level dashboard chrome.
 *
 * Layout responsibilities only — no domain data is read or rendered
 * here. On `lg` and above the sidebar is pinned to the left as a
 * persistent column; below `lg` it stacks above the main content so
 * the page remains usable on tablet and mobile without JS-driven
 * drawers.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <Sidebar />
      <main className="min-w-0">{children}</main>
    </div>
  );
}
