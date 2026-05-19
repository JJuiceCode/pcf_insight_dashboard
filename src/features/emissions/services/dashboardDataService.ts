/**
 * 대시보드 화면 데이터 로딩 서비스. **server-only**.
 *
 * 라우트별로 동일한 흐름을 반복해서 적기 쉽기 때문에, 한 곳에서 묶어 둔다:
 *
 *   1. productId에 해당하는 활동 레코드를 가져온다.
 *   2. 전체 배출계수(버전 히스토리 포함)를 가져온다.
 *   3. 활동 시점에 유효한 활성 계수를 매칭해 `CalculatedEmissionRow[]`를 만든다.
 *   4. KPI/그래프/테이블이 같은 입력에서 파생되도록 메트릭과 활성 계수 스냅샷을 함께 반환한다.
 *
 * 호출 측은 productId만 다르게 넘기면 되므로, `/`의 시드 대시보드와
 * `/import`의 가져오기 대시보드가 같은 계산 파이프라인을 공유한다.
 */

import { findActivitiesByProductId } from '../repositories/activityRepository';
import { findAllEmissionFactors } from '../repositories/emissionFactorRepository';
import type {
  ActivityRecord,
  CalculatedEmissionRow,
  EmissionFactor,
} from '../types';
import { calculateActivitiesWithActiveFactors } from './emissionCalculationService';
import { listActiveFactorsAt } from './emissionFactorService';

export interface DashboardData {
  /** 정렬·필터·중복 제거 없이 DB에서 그대로 읽어온 활동 레코드. */
  activities: readonly ActivityRecord[];
  /** 같은 (activityType, name)에 대해 여러 버전이 들어 있을 수 있는 전체 계수 풀. */
  emissionFactors: readonly EmissionFactor[];
  /** 활동 시점에 유효한 계수가 매칭된 결과. 대시보드 메트릭의 입력이 된다. */
  initialRows: readonly CalculatedEmissionRow[];
  /** 오늘 시점에 카테고리별로 활성인 계수 스냅샷. ActivityTable 헤더 칩 바에서 사용한다. */
  activeFactors: readonly EmissionFactor[];
}

/** 로컬 타임존 기준의 `YYYY-MM-DD`. listActiveFactorsAt 호출용. */
function todayIsoDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * productId 단위로 대시보드 한 화면 분량의 데이터를 한 번에 준비한다.
 *
 * 같은 함수를 두 라우트에서 호출하므로, 데이터 소스(productId)가 달라도
 * KPI 계산 규칙은 일관되게 유지된다.
 *
 * 활동이 0건이면 `initialRows`도 빈 배열을 반환한다. 호출 측에서 길이를 보고
 * 빈 상태 UI를 결정한다.
 */
export async function loadDashboardDataByProductId(
  productId: string,
): Promise<DashboardData> {
  const [activities, factors] = await Promise.all([
    findActivitiesByProductId(productId),
    findAllEmissionFactors(),
  ]);

  const initialRows = calculateActivitiesWithActiveFactors(activities, factors);
  const activeFactors = listActiveFactorsAt(factors, todayIsoDate());

  return {
    activities,
    emissionFactors: factors,
    initialRows,
    activeFactors,
  };
}
