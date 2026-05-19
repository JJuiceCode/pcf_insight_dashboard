/**
 * Excel 행 → 도메인 `ActivityRecord` 매퍼. **server-only**.
 *
 * 매핑 책임:
 *  - 한글/영문 헤더 라벨을 도메인 컬럼 키로 좁힌다.
 *  - 셀 값 타입(문자열·숫자·`Date`)을 도메인 union 타입으로 안전하게 변환한다.
 *  - 잘못된 행은 throw하지 않고 `skip` 결과로 돌려준다.
 *    한 행이 깨졌다고 가져오기 전체가 실패하면 안 되기 때문이다.
 *
 * 매핑 규칙이 한 곳에 모이도록, UI나 route handler에서는 이 모듈을 거치지 않고
 * 직접 컬럼 라벨을 다루지 않는다.
 */
import { ACTIVITY_TYPE_TO_UNIT } from '../validation';
import type { ActivityType, ActivityUnit } from '../types';

const REQUIRED_COLUMNS = [
  'date',
  'activityType',
  'description',
  'amount',
  'unit',
] as const;

export type RequiredColumn = (typeof REQUIRED_COLUMNS)[number];

/** 헤더 라벨 매칭 시 정규화에 사용되는 별칭 사전. */
const COLUMN_ALIASES: Record<RequiredColumn, readonly string[]> = {
  date: ['date', 'activity date', 'activitydate', '일자', '날짜', '활동일'],
  activityType: [
    'activity type',
    'activitytype',
    'type',
    '활동 유형',
    '활동유형',
    '유형',
    '활동',
  ],
  description: ['description', 'name', '설명', '구분', '이름'],
  amount: [
    'amount',
    'quantity',
    'qty',
    'value',
    '량',
    '수량',
    '활동량',
    '값',
  ],
  unit: ['unit', '단위'],
};

/** 한글·영문 라벨을 도메인 활동 유형으로 매핑한다. */
const ACTIVITY_TYPE_ALIASES: Record<ActivityType, readonly string[]> = {
  electricity: ['electricity', '전기', '전력'],
  material: ['material', '원소재', '원자재', '재료'],
  transport: ['transport', '운송', '물류', '수송'],
};

/** 도메인 단위와 흔히 쓰는 표기를 연결한다. 대소문자·공백 무시. */
const ACTIVITY_UNIT_ALIASES: Record<ActivityUnit, readonly string[]> = {
  kWh: ['kwh', 'k wh'],
  kg: ['kg', '킬로그램'],
  'ton-km': ['ton-km', 'tonkm', 'ton km', 'ton·km', '톤-km', '톤·km', '톤km'],
};

export type ColumnIndexMap = Record<RequiredColumn, number>;

/**
 * 헤더 행에서 도메인 컬럼 위치를 찾는다.
 *
 * 누락 컬럼이 있으면 `map: null` + `missing`을 돌려주고, 호출 측에서
 * 가져오기를 전체 실패로 분류한다.
 */
export function buildColumnIndexMap(headerRow: ReadonlyArray<unknown>): {
  map: ColumnIndexMap | null;
  missing: RequiredColumn[];
} {
  const normalizedHeaders = headerRow.map((cell) =>
    typeof cell === 'string' ? normalizeLabel(cell) : '',
  );

  const partial: Partial<ColumnIndexMap> = {};
  const missing: RequiredColumn[] = [];

  for (const column of REQUIRED_COLUMNS) {
    const aliases = COLUMN_ALIASES[column].map(normalizeLabel);
    const index = normalizedHeaders.findIndex((header) =>
      aliases.includes(header),
    );
    if (index === -1) {
      missing.push(column);
    } else {
      partial[column] = index;
    }
  }

  if (missing.length > 0) {
    return { map: null, missing };
  }

  return { map: partial as ColumnIndexMap, missing: [] };
}

export interface ParsedActivityRow {
  productId: string;
  activityType: ActivityType;
  description: string;
  amount: number;
  unit: ActivityUnit;
  /** UTC 자정 기준의 활동일. DB 컬럼이 `DateTime`이라 그대로 저장된다. */
  activityDate: Date;
}

export type ParseRowResult =
  | { kind: 'ok'; row: ParsedActivityRow }
  | { kind: 'skip'; reason: string };

/**
 * 한 데이터 행을 도메인 `ActivityRecord` 입력 형태로 변환한다.
 *
 * 검증 규칙:
 *  - 날짜·활동 유형·설명·수량은 모두 필수.
 *  - 단위는 시트에 명시된 값을 우선하되, 유효하지 않으면 활동 유형에서 도출한다.
 *    유형과 단위의 1:1 매핑(`ACTIVITY_TYPE_TO_UNIT`)을 안전망으로 사용한다.
 *  - 어느 하나라도 인식 실패면 `skip`을 반환하고 호출 측이 건너뛰게 한다.
 */
export function parseActivityRow(
  cells: ReadonlyArray<unknown>,
  indexMap: ColumnIndexMap,
  productId: string,
): ParseRowResult {
  const activityDate = parseExcelDate(cells[indexMap.date]);
  if (!activityDate) {
    return { kind: 'skip', reason: 'invalid-date' };
  }

  const activityType = parseActivityType(cells[indexMap.activityType]);
  if (!activityType) {
    return { kind: 'skip', reason: 'invalid-activity-type' };
  }

  const description = parseDescription(cells[indexMap.description]);
  if (!description) {
    return { kind: 'skip', reason: 'invalid-description' };
  }

  const amount = parseAmount(cells[indexMap.amount]);
  if (amount === null) {
    return { kind: 'skip', reason: 'invalid-amount' };
  }

  const explicitUnit = parseActivityUnit(cells[indexMap.unit]);
  const derivedUnit = ACTIVITY_TYPE_TO_UNIT[activityType];
  // 사용자가 명시한 단위가 도메인 단위와 일치하면 그대로 사용한다.
  // 명시는 했지만 도메인 단위로 변환되지 않거나 누락이면 활동 유형에서 도출한다.
  const unit: ActivityUnit = explicitUnit ?? derivedUnit;

  return {
    kind: 'ok',
    row: {
      productId,
      activityType,
      description,
      amount,
      unit,
      activityDate,
    },
  };
}

/** 시트 끝부분에 자주 따라오는 완전 빈 행 판별. */
export function isEmptyRow(cells: ReadonlyArray<unknown>): boolean {
  return cells.every(
    (value) =>
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === ''),
  );
}

function normalizeLabel(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function parseActivityType(value: unknown): ActivityType | null {
  if (typeof value !== 'string') return null;
  const normalized = normalizeLabel(value);
  if (!normalized) return null;

  for (const activityType of Object.keys(ACTIVITY_TYPE_ALIASES) as ActivityType[]) {
    const aliases = ACTIVITY_TYPE_ALIASES[activityType].map(normalizeLabel);
    if (aliases.includes(normalized)) {
      return activityType;
    }
  }
  return null;
}

function parseActivityUnit(value: unknown): ActivityUnit | null {
  if (typeof value !== 'string') return null;
  const normalized = normalizeLabel(value);
  if (!normalized) return null;

  for (const unit of Object.keys(ACTIVITY_UNIT_ALIASES) as ActivityUnit[]) {
    const aliases = ACTIVITY_UNIT_ALIASES[unit].map(normalizeLabel);
    if (aliases.includes(normalized)) {
      return unit;
    }
  }
  return null;
}

function parseDescription(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function parseAmount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string') {
    // 천 단위 콤마, 공백을 제거한 뒤 숫자로 해석한다.
    const cleaned = value.replace(/[\s,]/g, '');
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

/**
 * Excel 날짜 셀을 UTC 자정 기준의 `Date`로 변환한다.
 *
 * 지원하는 입력:
 *  - `Date` 인스턴스 (xlsx가 `cellDates: true`일 때 반환)
 *  - 숫자 (Excel serial date; 1900 epoch, 25569 = 1970-01-01)
 *  - 문자열 (`YYYY-MM-DD`, `YYYY/MM/DD`, 그 외는 `Date.parse`로 폴백)
 *
 * 모든 경우에 시·분·초를 버려 도메인 컨벤션(월 단위 활동일)과 맞춘다.
 */
function parseExcelDate(value: unknown): Date | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return toUtcMidnight(value);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel serial date의 epoch는 1899-12-30이라 25569를 빼면 1970-01-01 기준이 된다.
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) return null;
    return toUtcMidnight(date);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // `YYYY-MM-DD`, `YYYY/MM/DD`, `YYYY.MM.DD` 형태를 우선 인식한다.
    const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(trimmed);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      if (month < 1 || month > 12 || day < 1 || day > 31) return null;
      return new Date(Date.UTC(year, month - 1, day));
    }

    const ms = Date.parse(trimmed);
    if (!Number.isFinite(ms)) return null;
    const date = new Date(ms);
    return toUtcMidnight(date);
  }

  return null;
}

function toUtcMidnight(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
