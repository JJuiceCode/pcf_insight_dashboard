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

/**
 * 헤더 라벨 매칭 시 정규화에 사용되는 별칭 사전.
 *
 * `normalizeLabel`이 괄호 주석을 잘라내므로 `일자(원본)`, `활동 유형(필수)`처럼
 * 같은 의미에 부가 주석이 붙은 변형은 자동으로 흡수된다.
 */
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

/** 활동 블록 다음에 이어지는 참고용 섹션을 알리는 셀 문구. */
const NON_ACTIVITY_SECTION_MARKERS: readonly string[] = ['배출계수'];

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
      headerMatchesAnyAlias(header, aliases),
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

/**
 * 정규화된 헤더 셀이 별칭 중 하나와 일치하는지 판정한다.
 *
 *  - 정확히 같으면 매칭
 *  - 별칭이 헤더의 접두어이고 그 뒤가 분리 문자(공백·`-`·`_`·`.` 등)면 매칭
 *
 * "일자 원본 데이터", "일자_원본" 처럼 동일 컬럼임에도 부가 설명이
 * 붙은 변형을 흡수하기 위함이다. 단순히 substring 비교를 쓰면
 * `일자단위`처럼 다른 단어와 혼동될 수 있어, 뒤따라오는 문자가
 * 글자/숫자가 아니어야 한다는 조건으로 false positive를 막는다.
 */
function headerMatchesAnyAlias(
  normalizedHeader: string,
  normalizedAliases: readonly string[],
): boolean {
  if (!normalizedHeader) return false;
  for (const alias of normalizedAliases) {
    if (!alias) continue;
    if (normalizedHeader === alias) return true;
    if (normalizedHeader.startsWith(alias)) {
      const next = normalizedHeader.charAt(alias.length);
      if (next === '' || !LETTER_OR_DIGIT.test(next)) {
        return true;
      }
    }
  }
  return false;
}

/** Unicode 글자/숫자 판별. 한글·한자도 letter로 인식돼 `일자단위` 같은 결합어를 끊지 않는다. */
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

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

/**
 * 활동 데이터 헤더 행의 위치를 시트 내에서 동적으로 찾는다.
 *
 * 평가용 엑셀처럼 같은 시트에 "활동 데이터 블록 + 배출계수 참고표"가 함께 있을 수 있다.
 * 헤더가 항상 첫 줄이라고 가정하지 않고, 모든 필수 컬럼을 가진 첫 행을 헤더로 본다.
 *
 * 발견하지 못한 경우 `missing`은 가장 가까웠던 후보(매칭 실패가 가장 적었던 행)의
 * 누락 컬럼이거나 전체 필수 컬럼 목록이다. 호출 측 에러 메시지에서 사용한다.
 */
export type ActivityHeaderLocation =
  | { found: true; rowIndex: number; indexMap: ColumnIndexMap }
  | { found: false; missing: RequiredColumn[] };

export function findActivityHeaderRow(
  aoa: ReadonlyArray<ReadonlyArray<unknown>>,
): ActivityHeaderLocation {
  let bestMissing: RequiredColumn[] = [...REQUIRED_COLUMNS];

  for (let i = 0; i < aoa.length; i += 1) {
    const row = aoa[i];
    if (isEmptyRow(row)) continue;

    const { map, missing } = buildColumnIndexMap(row);
    if (map) {
      return { found: true, rowIndex: i, indexMap: map };
    }
    if (missing.length < bestMissing.length) {
      bestMissing = missing;
    }
  }

  return { found: false, missing: bestMissing };
}

/**
 * 헤더의 활동 컬럼이 차지하는 인덱스 범위(닫힌 구간)를 돌려준다.
 *
 * 평가용 엑셀처럼 활동 데이터 블록과 배출계수 참고표가 **세로가 아니라 가로로 나란히**
 * 놓여 있는 경우에도, 활동 영역만 깔끔히 분리해 처리할 수 있게 한다.
 * 예: 활동 헤더 인덱스가 {0,1,2,3,4}면 컬럼 0~4까지만 활동 영역으로 본다.
 */
export function getActivityColumnRange(indexMap: ColumnIndexMap): {
  start: number;
  end: number;
} {
  const indices = Object.values(indexMap);
  return {
    start: Math.min(...indices),
    end: Math.max(...indices),
  };
}

/**
 * 활동 데이터 블록이 끝났다고 판단되는 행인지 검사한다.
 *
 * 활동 영역(`indexMap`이 가리키는 컬럼 범위) 안에서만 판단한다.
 * 옆에 함께 놓인 배출계수 참고표 컬럼은 절대 보지 않는다.
 *
 * 멈춤 조건:
 *  1) 활동 영역의 모든 셀이 비어 있음 — 보통 블록 구분용 빈 줄
 *  2) 활동 영역의 어떤 셀이 `배출계수` 같은 다음 섹션 표식 문자열을 포함
 *  3) 활동 식별의 핵심 컬럼(날짜·활동 유형) 어느 쪽도 활동 데이터처럼 보이지 않음
 *     → 다음 활동 블록의 새 헤더 행으로 간주
 *
 * 단일 행 검증 실패(예: 날짜 오타)는 여기서 끝으로 보지 않는다.
 * 그런 경우는 `parseActivityRow`가 `skip`을 반환해 `skippedCount`로 집계된다.
 */
export function isActivityBlockEnd(
  cells: ReadonlyArray<unknown>,
  indexMap: ColumnIndexMap,
): boolean {
  const { start, end } = getActivityColumnRange(indexMap);
  const activitySlice = cells.slice(start, end + 1);

  if (isEmptyRow(activitySlice)) return true;

  if (containsSectionMarker(activitySlice)) return true;

  const dateCell = cells[indexMap.date];
  const typeCell = cells[indexMap.activityType];
  if (!hasDateShape(dateCell) && !hasActivityTypeShape(typeCell)) {
    return true;
  }

  return false;
}

function containsSectionMarker(cells: ReadonlyArray<unknown>): boolean {
  for (const cell of cells) {
    if (typeof cell !== 'string') continue;
    const trimmed = cell.trim();
    if (!trimmed) continue;
    if (NON_ACTIVITY_SECTION_MARKERS.some((marker) => trimmed.includes(marker))) {
      return true;
    }
  }
  return false;
}

/**
 * 날짜 셀로 보이는지 가벼운 형태 검사. 정확한 파싱은 `parseExcelDate`에서 수행.
 *
 * 활동 행 여부 판단용이라 false positive보다 false negative가 덜 위험하다.
 * (참고 표의 첫 컬럼이 의외로 날짜 같아 보이는 경우는 거의 없음)
 */
function hasDateShape(value: unknown): boolean {
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return true;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(trimmed)) return true;
    const ms = Date.parse(trimmed);
    return Number.isFinite(ms);
  }
  return false;
}

/** 활동 유형 셀이 도메인 별칭 중 하나로 매칭되는지 확인. */
function hasActivityTypeShape(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const normalized = normalizeLabel(value);
  if (!normalized) return false;

  for (const aliases of Object.values(ACTIVITY_TYPE_ALIASES)) {
    if (aliases.map(normalizeLabel).includes(normalized)) {
      return true;
    }
  }
  return false;
}

/**
 * 헤더·셀 라벨을 비교 가능한 형태로 정규화한다.
 *
 *  - 괄호 안 주석을 제거 (반각·전각 모두):
 *    `일자(원본)` → `일자`, `일자（원본 데이터）` → `일자`, `활동 유형 (필수)` → `활동 유형`
 *  - 보이지 않는 공백(NBSP, 전각 공백, zero-width 시리즈)을 일반 공백으로 변환
 *  - 연속 공백을 1칸으로 압축, 양끝 공백 제거
 *  - 영문은 소문자로 통일 (한글은 대소문자가 없어 무영향)
 *
 * 실제 한국어 엑셀에서 자주 마주치는 변형을 흡수하기 위한 한 곳의 정규화 지점이다.
 * 새로운 변형이 발견되면 이 함수만 손보면 된다.
 */
function normalizeLabel(value: string): string {
  return value
    .replace(/[\(（][^)）]*[\)）]/g, '')
    .replace(/[\u00A0\u3000\u200B\u200C\u200D\uFEFF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
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
