import type { Metadata } from 'next';
import { ImportClient } from '@/components/import/ImportClient';
import { ImportFlowExplanation } from '@/components/import/ImportFlowExplanation';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: '데이터 가져오기 · PCF Insight',
  description:
    'CT-045 모니터의 활동 데이터를 담은 Excel 파일을 업로드해 PCF 대시보드를 갱신합니다.',
};

/**
 * 데이터 가져오기(Excel 업로드) 페이지.
 *
 * 이 단계에서는 UI까지만 구현하므로 서버에서 불러오는 데이터가 없다.
 * 라우트 진입점은 서버 컴포넌트로 두고, 파일 상태와 상호작용은
 * `ImportClient` 클라이언트 컴포넌트가 담당한다.
 */
export default function ImportPage() {
  return (
    <AppShell>
      <ImportPageHeader />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <section
            aria-labelledby="import-upload-title"
            className="space-y-5"
          >
            <div>
              <h2
                id="import-upload-title"
                className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
              >
                Excel 파일 업로드
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                활동 데이터를 담은 엑셀 파일을 선택하면 다음 단계에서 자동으로
                파싱·계산됩니다.
              </p>
            </div>
            <ImportClient />
          </section>

          <aside aria-label="가져오기 안내" className="space-y-5">
            <ImportFlowExplanation />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

/**
 * Import 페이지 전용 헤더.
 *
 * 기존 대시보드 `Header`는 CT-045 KPI 컨텍스트에 맞춰져 있어 그대로 재사용하지 않고,
 * 가져오기 워크플로우에 맞는 짧은 헤더를 인라인으로 두었다.
 * 톤·여백·오렌지 액센트는 대시보드 헤더와 동일하게 맞춘다.
 */
function ImportPageHeader() {
  return (
    <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-medium tracking-wider text-orange-700 uppercase dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300"
            aria-label="단계 표시"
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-orange-500 dark:bg-orange-400"
            />
            Step 11 · Import
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            데이터 가져오기 워크플로우
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50">
          데이터 가져오기
        </h1>

        <p className="mt-1 text-sm text-neutral-600 sm:text-base dark:text-neutral-300">
          CT-045 활동 데이터를 담은 Excel 파일 업로드
        </p>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          업로드된 파일은 이후 단계에서 파싱·저장·재계산되어 대시보드의 KPI와
          Scope 분포에 반영됩니다. 이 단계에서는 파일 선택까지만 동작합니다.
        </p>
      </div>
    </header>
  );
}
