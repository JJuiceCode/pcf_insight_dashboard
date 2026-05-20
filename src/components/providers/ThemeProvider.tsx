'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * 앱 전역 테마 프로바이더.
 *
 * `next-themes`를 사용해 `<html>` 요소에 `light`/`dark` 클래스를 토글한다.
 * Tailwind v4 globals.css의 `@custom-variant dark`가 같은 selector를 참조하므로
 * 다크 모드 유틸리티(`dark:bg-...`)가 동일하게 동작한다.
 *
 * 설정:
 *  - attribute="class"  : html에 클래스를 붙인다 (`dark` / `light`).
 *  - defaultTheme="system" : 초기 진입은 OS 환경 설정을 따른다.
 *  - enableSystem       : 시스템 다크 모드 변화도 자동 추적한다.
 *  - disableTransitionOnChange : 전환 순간의 깜빡임 방지.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
