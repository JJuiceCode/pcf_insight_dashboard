/**
 * PCF 대시보드용 표시 포맷터.
 *
 * 입력 숫자는 도메인 기준 단위를 그대로 받는다
 * (배출량은 kgCO2e, 비율은 이미 0~100 범위).
 * 포맷터는 값을 다시 계산하지 않고 화면용 문자열만 만든다.
 */

import type { ActivityType, GhgScope } from './types';

const EMISSION_DECIMALS = 3;
const PERCENTAGE_DECIMALS = 1;

/**
 * 천 단위 구분·소수점 표기에 쓰는 로케일.
 * en-US로 고정해 브라우저·서버 렌더링 결과를 맞춘다 (예: `11,072.724`).
 */
const NUMBER_LOCALE = 'en-US';

/** 월 라벨에 쓰는 로케일(한국어 UI에 맞춰 ko-KR로 고정). */
const MONTH_LOCALE = 'ko-KR';

const PLACEHOLDER = '—';

function formatFixedDecimals(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return PLACEHOLDER;
  return value.toLocaleString(NUMBER_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * 테이블 셀용 숫자 포맷터.
 *
 * 정수 활동량(`110`)과 소수가 긴 배출계수(`0.456`) 모두에 쓴다.
 * 끝자리 0은 억지로 맞추지 않고, 원본 정밀도는 유지한 채 천 단위만 구분한다.
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return PLACEHOLDER;
  return value.toLocaleString(NUMBER_LOCALE, {
    maximumFractionDigits: 6,
  });
}

/** 예: `11,072.724 kgCO2e`. */
export function formatKgCO2e(value: number): string {
  return `${formatFixedDecimals(value, EMISSION_DECIMALS)} kgCO2e`;
}

/**
 * 예: `11.073 tCO2e`.
 *
 * 입력은 kgCO2e. 포맷 전에 1,000으로 나누므로
 * 호출 쪽에서 미리 톤으로 바꿀 필요가 없다.
 */
export function formatTCO2e(valueInKg: number): string {
  if (!Number.isFinite(valueInKg)) return PLACEHOLDER;
  const valueInTonnes = valueInKg / 1000;
  return `${formatFixedDecimals(valueInTonnes, EMISSION_DECIMALS)} tCO2e`;
}

/**
 * 0~100 범위의 퍼센트 값을 포맷한다 (`92.4` 형태, `0.924` 아님).
 * 예: `92.4%`.
 */
export function formatPercentage(value: number): string {
  return `${formatFixedDecimals(value, PERCENTAGE_DECIMALS)}%`;
}

const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  electricity: '전기',
  material: '원소재',
  transport: '운송',
};

export function formatActivityTypeLabel(activityType: ActivityType): string {
  return ACTIVITY_TYPE_LABEL[activityType];
}

const SCOPE_LABEL: Record<GhgScope, string> = {
  scope1: 'Scope 1',
  scope2: 'Scope 2',
  scope3: 'Scope 3',
};

export function formatScopeLabel(scope: GhgScope): string {
  return SCOPE_LABEL[scope];
}

/**
 * 월 키(`YYYY-MM`)를 한국어 UI에 맞는 월 라벨로 변환한다.
 *
 * 예: `2025-05` → `2025년 5월`.
 * UTC 기준으로 포맷해 SSR·브라우저 환경 간 출력 차이를 방지하고,
 * 잘못된 입력은 원본 값을 그대로 반환한다.
 */
export function formatMonth(yyyymm: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(yyyymm);
  if (!match) return yyyymm;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return yyyymm;

  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat(MONTH_LOCALE, {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
}
