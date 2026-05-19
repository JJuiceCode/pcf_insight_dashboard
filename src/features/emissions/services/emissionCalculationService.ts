/**
 * 배출량 계산 서비스.
 *
 * Repository에서 로드한 활동·계수 데이터를 받아 각 활동에 활성 계수를 매칭하고
 * 도메인 순수 함수(`calculations.ts`)로 배출량을 계산해 대시보드가 그대로 쓰는
 * `CalculatedEmissionRow[]`를 만든다.
 *
 * 활성 계수 선택 로직은 `emissionFactorService.pickActiveEmissionFactor`에서
 * 가져와, 사용자가 추가한 활동의 클라이언트 미리보기와 서버 계산이 같은
 * 결과를 내도록 보장한다.
 */

import type {
  ActivityRecord,
  CalculatedEmissionRow,
  EmissionFactor,
} from '../types';
import { pickActiveEmissionFactor } from './emissionFactorService';

/**
 * 활동 한 건에 대해 활성 계수를 골라 배출량을 계산한다.
 *
 * 활성 계수가 없으면 `isValid: false`로 표시해 합계에서 제외되도록 한다.
 * 잘못된 0을 합계에 섞지 않는 것이 도메인의 핵심 규칙이다.
 */
export function calculateActivityWithActiveFactor(
  activity: ActivityRecord,
  factors: readonly EmissionFactor[],
): CalculatedEmissionRow {
  const candidates = factors.filter(
    (factor) =>
      factor.activityType === activity.activityType &&
      factor.name === activity.description,
  );
  const activeFactor = pickActiveEmissionFactor(candidates, activity.date);

  if (!activeFactor) {
    return {
      activity,
      emissionKgCO2e: 0,
      isValid: false,
      errorMessage: `활동일 ${activity.date} 시점에 유효한 배출계수가 없습니다 (활동유형 "${activity.activityType}", 설명 "${activity.description}").`,
    };
  }

  return {
    activity,
    emissionFactor: activeFactor,
    emissionKgCO2e: activity.amount * activeFactor.factor,
    scope: activeFactor.scope,
    isValid: true,
  };
}

/**
 * 활동 배열을 활성 계수와 매칭해 `CalculatedEmissionRow[]`로 변환한다.
 *
 * 활동 순서를 보존해 테이블이 별도 정렬 없이 표시할 수 있다.
 */
export function calculateActivitiesWithActiveFactors(
  activities: readonly ActivityRecord[],
  factors: readonly EmissionFactor[],
): CalculatedEmissionRow[] {
  return activities.map((activity) =>
    calculateActivityWithActiveFactor(activity, factors),
  );
}
