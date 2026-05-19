import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import { DEMO_PRODUCT_ID } from '@/features/emissions/constants';
import { loadDashboardDataByProductId } from '@/features/emissions/services/dashboardDataService';

// 요청마다 최신 DB 값을 반영하기 위해 캐싱을 끈다.
// 시드 또는 폼으로 추가된 활동이 바뀌면 새로고침만으로 KPI가 갱신된다.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 시드 기반 CT-045 데모 대시보드 서버 진입 지점.
 *
 * `dashboardDataService`가 활동·계수 로드와 활성 계수 매칭까지 묶어 처리하므로
 * 라우트 파일에는 productId 선택과 화면 조립만 남는다.
 *
 * `/import`와 데이터 소스를 분리하기 위해 이 라우트는 `DEMO_PRODUCT_ID`만 읽는다.
 * Excel로 가져온 행은 `IMPORTED_PRODUCT_ID`에 저장되어 이 화면에는 노출되지 않는다.
 */
export default async function Home() {
  const { initialRows, emissionFactors } =
    await loadDashboardDataByProductId(DEMO_PRODUCT_ID);

  return (
    <AppShell>
      <Header />
      <DashboardClient
        initialRows={initialRows}
        emissionFactors={emissionFactors}
        productId={DEMO_PRODUCT_ID}
      />
    </AppShell>
  );
}
