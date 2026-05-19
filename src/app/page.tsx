import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { AppShell } from '@/components/layout/AppShell';
import { Header } from '@/components/layout/Header';
import {
  activityRecords,
  emissionFactors,
  products,
} from '@/features/emissions/seed';

/**
 * 대시보드 서버 진입 지점.
 *
 * 초기 데이터를 준비해 클라이언트 컴포넌트에 전달하며,
 * 상태 관리와 사용자 인터랙션은 `DashboardClient`에서 처리한다.
 */
export default function Home() {
  const productId = products[0]?.id ?? 'product-ct-045';

  return (
    <AppShell>
      <Header />
      <DashboardClient
        initialActivityRecords={activityRecords}
        emissionFactors={emissionFactors}
        productId={productId}
      />
    </AppShell>
  );
}
