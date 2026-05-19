/**
 * 배출계수 매칭 도메인 서비스.
 *
 * **클라이언트/서버 공통** 순수 함수만 둔다. 운영자 입력 폼의 미리보기와
 * 서버 계산이 같은 함수를 호출하므로, 미리 보이는 예상 배출량과 저장 후
 * 대시보드에 표시되는 값이 항상 같다.
 *
 * DB 조회가 필요한 비즈니스 흐름은 repository에서 가져온 결과를
 * 이 모듈의 함수에 넘기는 식으로 합성한다.
 */

import type { ActivityType, EmissionFactor, IsoDate } from '../types';

/**
 * 활동 시점에 유효한 후보들 중 가장 최근 `effectiveFrom`을 가진 계수를 고른다.
 *
 * 같은 활동에 대해 버전이 동시에 유효할 수 있으므로, "가장 최근에 효력 발생한 버전"을
 * 활성으로 본다. 정상적인 버전 업데이트 흐름과 자연스럽게 맞물린다.
 *
 * `candidates`는 호출 측에서 (activityType, name) 으로 좁힌 결과를 기대한다.
 */
export function pickActiveEmissionFactor(
  candidates: readonly EmissionFactor[],
  activityDate: IsoDate,
): EmissionFactor | undefined {
  let active: EmissionFactor | undefined;
  for (const candidate of candidates) {
    if (candidate.effectiveFrom > activityDate) continue;
    if (!active || candidate.effectiveFrom > active.effectiveFrom) {
      active = candidate;
    }
  }
  return active;
}

/**
 * 활동 한 건에 대해 (activityType, description)으로 좁힌 뒤,
 * 활동 시점의 활성 계수를 매칭한다. 매칭이 없으면 `undefined`를 반환한다.
 */
export function findActiveFactorForActivity(
  factors: readonly EmissionFactor[],
  params: {
    activityType: ActivityType;
    description: string;
    activityDate: IsoDate;
  },
): EmissionFactor | undefined {
  const candidates = factors.filter(
    (factor) =>
      factor.activityType === params.activityType &&
      factor.name === params.description,
  );
  return pickActiveEmissionFactor(candidates, params.activityDate);
}
