/**
 * PCF 대시보드 페이지 헤더.
 *
 * 대시보드 목적만 전달하고 계산된 KPI는 표시하지 않는다.
 * 카드·차트·테이블 등 데이터 영역은 이후 단계에서 추가한다.
 */
export function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300"
            aria-label="Product code"
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-orange-500 dark:bg-orange-400"
            />
            CT-045
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Reporting period · Jan – Aug 2025
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-3xl">
          PCF Insight Dashboard
        </h1>

        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300 sm:text-base">
          Product Carbon Footprint overview for CT-045 Computer Monitor
        </p>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          Activity data is matched with versioned emission factors to
          calculate kgCO2e and classify emissions by GHG Scope.
        </p>
      </div>
    </header>
  );
}
