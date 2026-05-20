import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import { DEMO_PRODUCT_ID } from '@/features/emissions/constants';
import {
  DEMO_ACTIVITY_RECORDS,
  DEMO_EMISSION_FACTORS,
} from '@/features/emissions/seed';
import { calculateActivitiesWithActiveFactors } from '@/features/emissions/services/emissionCalculationService';

/**
 * 시드 기반 CT-045 데모 대시보드 서버 진입 지점.
 *
 * 이 라우트는 **DB를 읽지 않는다**. `features/emissions/seed.ts`의 in-memory 데이터를
 * 직접 사용하기 때문에 DB가 비어 있거나 새 환경에 시드가 적재되지 않았어도
 * 대시보드는 항상 동일한 데모 화면을 보여준다.
 *
 * 가져온 데이터(`/import`)는 DB에서 별도 productId로 읽으므로, 두 데이터 소스가
 * 코드 수준에서도 완전히 분리되어 있어 이중 집계가 발생하지 않는다.
 *
 * 계산 파이프라인은 `/import`와 동일하게 `calculateActivitiesWithActiveFactors`를
 * 사용한다. 입력 데이터의 출처만 다르고 KPI·Scope·월별 추이를 만드는 규칙은 같다.
 */
export default function Home() {
  const initialRows = calculateActivitiesWithActiveFactors(
    DEMO_ACTIVITY_RECORDS,
    DEMO_EMISSION_FACTORS,
  );

  return (
    <AppShell>
      <Header />
      <DashboardClient
        initialRows={initialRows}
        emissionFactors={DEMO_EMISSION_FACTORS}
        productId={DEMO_PRODUCT_ID}
      />
    </AppShell>
  );
}
