import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import { findAllEmissionFactors } from '@/features/emissions/repositories/emissionFactorRepository';
import { findActivitiesByProductId } from '@/features/emissions/repositories/activityRepository';
import { calculateActivitiesWithActiveFactors } from '@/features/emissions/services/emissionCalculationService';

// 평가용 dashboard는 단일 제품만 표시하므로 상수로 고정한다.
// 향후 다중 제품을 지원하려면 URL 파라미터나 product 테이블로 확장한다.
const PRODUCT_ID = 'product-ct-045';

// 요청마다 최신 DB 값을 반영하기 위해 캐싱을 끈다.
// 계수가 바뀌면 페이지를 새로고침하는 것만으로 새 계수가 적용된 KPI가 보인다.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 대시보드 서버 진입 지점.
 *
 * DB에서 활동 레코드와 배출계수(버전 히스토리 포함)를 로드하고,
 * 활동 시점에 유효한 계수로 미리 계산한 행을 클라이언트로 넘긴다.
 *
 * 계산이 한 곳(서버)에서 끝나기 때문에 페이지가 처음 그려질 때부터
 * KPI·테이블·개요가 같은 입력에서 파생된다.
 */
export default async function Home() {
  const [activities, factors] = await Promise.all([
    findActivitiesByProductId(PRODUCT_ID),
    findAllEmissionFactors(),
  ]);

  const initialRows = calculateActivitiesWithActiveFactors(activities, factors);

  return (
    <AppShell>
      <Header />
      <DashboardClient
        initialRows={initialRows}
        emissionFactors={factors}
        productId={PRODUCT_ID}
      />
    </AppShell>
  );
}
