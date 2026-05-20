import type { Metadata } from 'next';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { ImportClient } from '@/components/import/ImportClient';
import { ImportFlowExplanation } from '@/components/import/ImportFlowExplanation';
import { AppShell } from '@/components/layout/AppShell';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { IMPORTED_PRODUCT_ID } from '@/features/emissions/constants';
import { buildDashboardMetrics } from '@/features/emissions/dashboardMetrics';
import { loadDashboardDataByProductId } from '@/features/emissions/services/dashboardDataService';

export const metadata: Metadata = {
  title: '데이터 가져오기 · PCF Insight',
  description:
    'CT-045 모니터의 활동 데이터를 담은 Excel 파일을 업로드해 PCF 대시보드를 갱신합니다.',
};

// 가져오기 직후 `router.refresh()`가 호출되면 서버 컴포넌트가 다시 평가되어야 한다.
// 라우트 캐시가 켜져 있으면 새로 삽입된 ActivityRecord가 보이지 않으므로 명시적으로 끈다.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 데이터 가져오기(Excel 업로드) 페이지.
 *
 * 워크플로우:
 *   1. 운영자가 엑셀 파일을 업로드 → `ImportClient`가 `/api/import/excel`로 전송
 *   2. API가 `IMPORTED_PRODUCT_ID`로 ActivityRecord 행을 SQLite에 적재
 *   3. `ImportClient`가 `router.refresh()` → 이 서버 컴포넌트가 다시 실행되어
 *      가져온 행 기준 메트릭을 다시 계산
 *   4. 업로드 카드 아래에 imported 대시보드(또는 빈 상태)가 그려진다
 *
 * `/`(시드 기반)와 데이터 소스를 분리하기 위해 이 페이지는
 * `IMPORTED_PRODUCT_ID`만 읽는다. 시드 데이터와 섞이지 않는다.
 */
export default async function ImportPage() {
  const { activities, initialRows, activeFactors } =
    await loadDashboardDataByProductId(IMPORTED_PRODUCT_ID);

  const hasImportedData = activities.length > 0;
  // 활동이 비어 있어도 buildDashboardMetrics를 호출해 빈 상태에서도 동일한
  // DashboardMetrics 스키마를 유지한다. 호출 측은 hasImportedData로 분기한다.
  const metrics = buildDashboardMetrics(initialRows);

  return (
    <AppShell>
      <ImportPageHeader />
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:space-y-10 lg:px-8 lg:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <section aria-labelledby="import-upload-title" className="space-y-5">
            <div>
              <h2
                id="import-upload-title"
                className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
              >
                Excel 파일 업로드
              </h2>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                활동 데이터를 담은 엑셀 파일을 선택해 가져오기를 실행하면 아래에
                가져온 데이터 기반 대시보드가 함께 갱신됩니다.
              </p>
            </div>
            <ImportClient
              hasImportedData={hasImportedData}
              importedRowCount={activities.length}
            />
          </section>
        </div>

        <ImportedDashboardSection
          hasImportedData={hasImportedData}
          metrics={metrics}
          activeFactors={activeFactors}
          importedRowCount={activities.length}
        />
      </div>
    </AppShell>
  );
}

/**
 * 가져오기 결과 카드 아래에 그릴 imported 대시보드 영역.
 *
 * 데이터가 없으면 빈 상태 카드만 보여주고, KPI는 그리지 않는다.
 * 0 KPI를 그대로 노출하면 운영자가 "PCF가 0이다"로 오해할 수 있어
 * 빈 상태 메시지로 명확히 구분한다.
 */
interface ImportedDashboardSectionProps {
  hasImportedData: boolean;
  metrics: Parameters<typeof DashboardView>[0]['metrics'];
  activeFactors: Parameters<typeof DashboardView>[0]['activeFactors'];
  importedRowCount: number;
}

function ImportedDashboardSection({
  hasImportedData,
  metrics,
  activeFactors,
  importedRowCount,
}: ImportedDashboardSectionProps) {
  return (
    <section
      aria-labelledby="imported-dashboard-title"
      className="space-y-5 border-t border-neutral-200 pt-8 dark:border-neutral-800"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">가져온 데이터 기반</Badge>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              CT-045 · Excel Import
            </span>
          </div>
          <h2
            id="imported-dashboard-title"
            className="mt-2 text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
          >
            가져온 데이터 기반 PCF 대시보드
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            업로드한 엑셀 활동 데이터에서 계산된 KPI와 Scope 분포입니다. 기본
            대시보드(<code className="font-mono text-xs">/</code>)의 시드
            데이터와 합산되지 않습니다.
          </p>
        </div>

        {hasImportedData ? (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            적재된 활동 레코드:{' '}
            <strong className="text-neutral-700 dark:text-neutral-200">
              {importedRowCount.toLocaleString('ko-KR')}건
            </strong>
          </span>
        ) : null}
      </div>

      {hasImportedData ? (
        <DashboardView metrics={metrics} activeFactors={activeFactors} />
      ) : (
        <ImportedEmptyState />
      )}
    </section>
  );
}

/**
 * 가져온 데이터가 한 건도 없을 때 보여줄 빈 상태 카드.
 *
 * KPI 카드를 0으로 채우는 대신 가이드 문구를 노출해, 운영자가
 * "아직 가져오기 전"이라는 사실을 즉시 인지할 수 있게 한다.
 */
function ImportedEmptyState() {
  return (
    <Card className="border-dashed bg-neutral-50/60 dark:bg-neutral-950/40">
      <div className="flex flex-col items-start gap-3 text-sm text-neutral-600 dark:text-neutral-300">
        <Badge variant="neutral">데이터 없음</Badge>
        <p className="text-base font-medium text-neutral-800 dark:text-neutral-100">
          아직 가져온 활동 데이터가 없습니다.
        </p>
        <p className="leading-6 text-neutral-500 dark:text-neutral-400">
          위에서 Excel 파일을 업로드하면 가져온 데이터 기반 PCF 대시보드가 이
          영역에 표시됩니다. 시드 데이터는 합산되지 않으며, 업로드된 활동만
          KPI·Scope 분포·월별 추이에 반영됩니다.
        </p>
      </div>
    </Card>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-medium tracking-wider text-orange-700 uppercase dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300"
              aria-label="단계 표시"
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-orange-500 dark:bg-orange-400"
              />
              Step 12 · Import + Recalculate
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              데이터 가져오기 워크플로우
            </span>
          </div>

          <ThemeToggle />
        </div>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50">
          데이터 가져오기
        </h1>

        <p className="mt-1 text-sm text-neutral-600 sm:text-base dark:text-neutral-300">
          CT-045 활동 데이터를 담은 Excel 파일 업로드 · 가져온 데이터 기반 PCF
          재계산
        </p>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          업로드된 파일은 파싱되어 SQLite에 적재되고, 동일한 계산 파이프라인을
          거쳐 아래의 KPI · Scope 분포 · 월별 추이 · 활동 테이블로 다시
          렌더링됩니다. 시드 기반 기본 대시보드(
          <code className="font-mono text-xs">/</code>)와는 데이터 소스가
          분리되어 있어 이중 집계가 발생하지 않습니다.
        </p>
      </div>
    </header>
  );
}
