'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * 라이트/다크 모드 토글 버튼.
 *
 * `next-themes`의 `resolvedTheme`을 기준으로 현재 모드를 판단한 뒤,
 * 클릭하면 명시적으로 반대 모드(`'light' | 'dark'`)로 전환한다.
 * `'system'`을 거치지 않고 곧바로 명시 모드로 가는 게 토글의 사용자 멘탈모델에 더 맞다.
 *
 * Hydration 안전:
 *  - SSR 시점에는 OS 다크모드 여부를 알 수 없어 라벨/아이콘 결정이 불가능하다.
 *  - `mounted` 플래그로 클라이언트 마운트 전에는 빈 자리만 차지(같은 크기 placeholder)해
 *    레이아웃 점프를 막고, 깜빡임 없이 정확한 상태로 그려진다.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // next-themes 공식 권장 hydration-safe 패턴. SSR 시점에는 사용자 OS 다크모드를
    // 알 수 없어 라벨/아이콘 결정이 불가능하므로, 클라이언트 마운트 신호로만 그린다.
    // 다른 외부 상태에 동기화하는 effect가 아니라 의도된 1회성 setState다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const nextLabel = isDark ? '라이트 모드로 전환' : '다크 모드로 전환';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={mounted ? nextLabel : '테마 전환'}
      aria-pressed={mounted ? isDark : undefined}
      title={mounted ? nextLabel : undefined}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors',
        'hover:border-accent/40 hover:bg-accent-soft hover:text-accent',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      {/* 마운트 전에는 아이콘을 그리지 않아 SSR/CSR 마크업이 어긋나지 않도록 한다. */}
      {mounted ? (
        isDark ? (
          <SunIcon className="h-4 w-4" />
        ) : (
          <MoonIcon className="h-4 w-4" />
        )
      ) : (
        <span aria-hidden className="h-4 w-4" />
      )}
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m4.93 19.07 1.41-1.41" />
      <path d="m17.66 6.34 1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
