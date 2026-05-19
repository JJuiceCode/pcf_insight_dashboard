/**
 * PCF Insight 대시보드 페이지 헤더.
 *
 * 대시보드 목적만 전달하고 계산된 KPI는 표시하지 않는다.
 */
export function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-medium tracking-wider text-orange-700 uppercase dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300"
            aria-label="제품 코드"
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-orange-500 dark:bg-orange-400"
            />
            CT-045
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            보고 기간 · 2025.01 ~ 2025.08
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50">
          PCF Insight Dashboard
        </h1>

        <p className="mt-1 text-sm text-neutral-600 sm:text-base dark:text-neutral-300">
          CT-045 컴퓨터 모니터 제품 탄소발자국 현황
        </p>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          활동 데이터를 기반으로 배출량(kgCO2e)을 계산하고, GHG Scope 기준에
          따라 배출 구조를 분석합니다.
        </p>
      </div>
    </header>
  );
}
