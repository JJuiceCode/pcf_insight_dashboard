/**
 * 운영자 활동 입력 폼 검증 유틸.
 *
 * React 밖에서 동작하는 순수 함수로 분리해
 * 테스트와 서버 액션에서도 같은 검증 규칙을 재사용할 수 있게 한다.
 *
 * 검증 결과, 매칭된 배출계수, 파싱된 수량,
 * 예상 배출량을 한 번에 반환해 UI가 같은 기준으로 오류와 미리보기를 표시한다.
 */

import { findEmissionFactorByKey } from './calculations';
import type { ActivityType, ActivityUnit, EmissionFactor } from './types';

/**
 * 활동 유형별로 허용되는 단위.
 *
 * 폼 제출 단계에서 잘못된 유형·단위 조합을 막기 위한 검증 규칙이다.
 */
export const ACTIVITY_TYPE_TO_UNIT: Record<ActivityType, ActivityUnit> = {
  electricity: 'kWh',
  material: 'kg',
  transport: 'ton-km',
};

/**
 * 사용자가 입력 중인 폼 상태.
 *
 * 입력값은 모두 문자열로 관리하며,
 * 빈 문자열은 아직 선택하지 않은 상태를 의미한다.
 */
export interface ActivityFormDraft {
  date: string;
  activityType: ActivityType | '';
  description: string;
  amount: string;
}

export type ActivityFormField = keyof ActivityFormDraft;

export type ActivityFormErrors = Partial<Record<ActivityFormField, string>>;

export interface ActivityFormValidationResult {
  errors: ActivityFormErrors;

  /** 모든 필드가 유효하고 배출계수가 매칭된 경우에만 true. */
  isValid: boolean;
  parsedAmount: number | null;
  matchedFactor: EmissionFactor | undefined;

  /** 활동 유형에서 파생된 단위. 유형을 선택하지 않았으면 null. */
  unit: ActivityUnit | null;

  /** 예상 배출량(kgCO2e). 수량이나 배출계수가 없으면 null. */
  previewEmissionKgCO2e: number | null;
}

export function emptyActivityFormDraft(): ActivityFormDraft {
  return {
    date: '',
    activityType: '',
    description: '',
    amount: '',
  };
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function validateActivityForm(
  draft: ActivityFormDraft,
  emissionFactors: readonly EmissionFactor[],
): ActivityFormValidationResult {
  const errors: ActivityFormErrors = {};

  if (!draft.date) {
    errors.date = '날짜를 선택해 주세요.';
  } else if (!ISO_DATE_PATTERN.test(draft.date)) {
    errors.date = 'YYYY-MM-DD 형식으로 입력해 주세요.';
  }

  if (!draft.activityType) {
    errors.activityType = '활동 유형을 선택해 주세요.';
  }

  if (!draft.description) {
    errors.description = '설명을 선택해 주세요.';
  } else if (draft.activityType) {
    const isAllowedForType = emissionFactors.some(
      (factor) =>
        factor.activityType === draft.activityType &&
        factor.name === draft.description,
    );

    if (!isAllowedForType) {
      errors.description = '선택한 활동 유형과 설명이 일치하지 않습니다.';
    }
  }

  let parsedAmount: number | null = null;

  if (!draft.amount) {
    errors.amount = '수량을 입력해 주세요.';
  } else {
    const numericAmount = Number(draft.amount);

    if (!Number.isFinite(numericAmount)) {
      errors.amount = '수량은 숫자로 입력해 주세요.';
    } else if (numericAmount <= 0) {
      errors.amount = '수량은 0보다 커야 합니다.';
    } else {
      parsedAmount = numericAmount;
    }
  }

  const unit = draft.activityType
    ? ACTIVITY_TYPE_TO_UNIT[draft.activityType]
    : null;

  const matchedFactor =
    draft.activityType && draft.description
      ? findEmissionFactorByKey(
          draft.activityType,
          draft.description,
          emissionFactors,
        )
      : undefined;

  const previewEmissionKgCO2e =
    parsedAmount !== null && matchedFactor
      ? parsedAmount * matchedFactor.factor
      : null;

  const isValid =
    Object.keys(errors).length === 0 &&
    matchedFactor !== undefined &&
    parsedAmount !== null &&
    unit !== null;

  return {
    errors,
    isValid,
    parsedAmount,
    matchedFactor,
    unit,
    previewEmissionKgCO2e,
  };
}
