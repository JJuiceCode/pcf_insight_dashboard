/**
 * 제품 탄소발자국(PCF) 대시보드용 도메인 타입.
 *
 * 모델링 원칙:
 *  - 활동(Activity)은 실제로 일어난 일을 기록한다
 *    (전력 사용 kWh, 원자재 사용 kg, 운송 ton-km 등).
 *  - 배출계수(Emission Factor)는 활동량을 kgCO2e로 바꾸는 값이다.
 *    계수는 버전·적용 시작일을 갖고, 시점마다 다른 값으로
 *    과거 배출량을 다시 계산할 수 있어야 한다.
 *  - 배출량 = 활동량 × 배출계수 (계산 로직은 이 파일에 두지 않는다).
 */

/**
 * GHG Protocol Scope 구분.
 *  - scope1: 직접 배출(현장 연소 등). CT-045 데이터에는 없지만,
 *    타입에 포함해 downstream에서 0으로 명시할 수 있게 한다.
 *  - scope2: 구매 전력·열 등 간접 배출.
 *  - scope3: 가치사슬 기타 간접 배출(원자재, 물류 등).
 */
export type GhgScope = 'scope1' | 'scope2' | 'scope3';

/**
 * CT-045 데이터셋의 활동 대분류.
 * 원본 한글 라벨을 아래 영문 키로 통일한다:
 *  - 전기   -> 'electricity'
 *  - 원소재 -> 'material'
 *  - 운송   -> 'transport'
 */
export type ActivityType = 'electricity' | 'material' | 'transport';

/** 활동량 단위. */
export type ActivityUnit = 'kWh' | 'kg' | 'ton-km';

/**
 * 배출계수 단위. 분자는 항상 kgCO2e이고,
 * 분모는 적용 대상 활동량 단위와 맞아야 한다.
 */
export type FactorUnit = 'kgCO2e/kWh' | 'kgCO2e/kg' | 'kgCO2e/ton-km';

/**
 * 활동량 단위에 대응하는 배출계수 단위.
 * 계산 코드에서 단위 불일치를 타입 수준에서 막을 때 쓴다.
 */
export type FactorUnitFor<U extends ActivityUnit> = U extends 'kWh'
  ? 'kgCO2e/kWh'
  : U extends 'kg'
    ? 'kgCO2e/kg'
    : U extends 'ton-km'
      ? 'kgCO2e/ton-km'
      : never;

/** `YYYY-MM-DD` 형식의 ISO 날짜 문자열. */
export type IsoDate = string;

/** 탄소발자국을 측정하는 제품. */
export interface Product {
  id: string;
  /** 화면에 보이는 제품 코드 (예: "CT-045"). */
  code: string;
  name: string;
}

/**
 * 제품에 연결된 운영 활동 한 건.
 *
 * 활동 레코드에는 배출계수나 Scope를 넣지 않는다.
 * 계수는 별도 카탈로그에서 조회해, 계수가 바뀌어도
 * 과거 활동 데이터를 다시 쓸 필요가 없게 한다.
 */
export interface ActivityRecord {
  id: string;
  productId: string;
  /** 활동이 귀속되는 날짜(월 단위). */
  date: IsoDate;
  activityType: ActivityType;
  /**
   * 원본 데이터의 구분 라벨(예: "한국전력", "플라스틱 1", "트럭").
   * 매칭되는 배출계수를 찾을 때 사용한다.
   */
  description: string;
  amount: number;
  unit: ActivityUnit;
}

/**
 * 활동량을 kgCO2e로 환산하는 버전 관리형 배출계수.
 * 실무 탄소회계에서도 계수 버전과 활동 데이터를
 * 분리해 관리하므로, 여기서도 같은 구조를 따른다.
 */
export interface EmissionFactor {
  id: string;
  activityType: ActivityType;
  /** `ActivityRecord.description`과 매칭해 조회한다. */
  name: string;
  /** `factorUnit` 기준의 계수 숫자 값. */
  factor: number;
  factorUnit: FactorUnit;
  /** 이 계수가 기여하는 GHG Scope. */
  scope: GhgScope;
  /** 사람이 읽기 쉬운 버전 태그 (예: "2025.1"). */
  version: string;
  /** 이 버전 계수가 적용되기 시작하는 날짜. */
  effectiveFrom: IsoDate;
  /** 계수 값의 출처를 짧게 표시하는 라벨. */
  sourceLabel: string;
  /** 선택 메모(도메인 설명, 유의사항 등). */
  note?: string;
}

/**
 * `ActivityRecord` 한 건에 대한 배출 계산 결과.
 *
 * 배출계수를 찾지 못한 경우 `isValid: false`로 명시해,
 * 대시보드가 잘못된 0을 합산하지 않고 데이터 품질 문제를 보여줄 수 있게 한다.
 */
export interface CalculatedEmissionRow {
  activity: ActivityRecord;
  /** 매칭된 배출계수. `isValid`가 true일 때만 존재한다. */
  emissionFactor?: EmissionFactor;
  /** 항상 kgCO2e 단위. 유효하지 않은 행이면 0. */
  emissionKgCO2e: number;
  /** 매칭된 배출계수에서 복사한 Scope(편의용). */
  scope?: GhgScope;
  isValid: boolean;
  /** 행이 유효하지 않을 때의 이유 설명. */
  errorMessage?: string;
}

/**
 * 대시보드가 보고하는 GHG Scope 목록(고정 순서).
 *
 * 현재 데이터에 Scope 1 활동이 없어도 scope1을 포함한다.
 * 이해관계자가 "직접 배출은 검토했으나 0"임을 확인할 수 있게 하기 위함이다.
 */
export const GHG_SCOPES: readonly GhgScope[] = [
  'scope1',
  'scope2',
  'scope3',
] as const;

/** 대시보드가 보고하는 활동 유형 목록(고정 순서). */
export const ACTIVITY_TYPES: readonly ActivityType[] = [
  'electricity',
  'material',
  'transport',
] as const;

/**
 * Excel 활동 데이터 가져오기 결과 요약.
 *
 * 가져오기는 "replace-import" 방식이다. 같은 productId의 기존 ActivityRecord는
 * 삽입 전에 삭제되고, 새 파일의 행으로 완전히 교체된다.
 * EmissionFactor 테이블은 손대지 않는다.
 *
 * - `importedCount`: 실제로 DB에 새로 적재된 행 수.
 * - `skippedCount`: 같은 파일 내 중복 행과 도메인 검증을 통과하지 못한 행 수.
 *   (DB 중복은 더 이상 발생하지 않는다 — 가져오기 전에 기존 행을 삭제하기 때문.)
 * - `replacedCount`: 가져오기 전에 삭제된 기존 행 수.
 *   `replacedCount > 0`이면 이전 가져오기 결과가 새 파일로 교체되었다는 의미.
 * - `totalRows`: 시트에서 인식된 데이터 행 수(헤더·빈 행 제외).
 *   `importedCount + skippedCount`와 일치한다.
 * - `sheetName`: 실제 파싱에 사용한 워크시트 이름. UI에서 운영자가 어떤 시트가
 *   처리됐는지 확인할 수 있게 한다.
 */
export interface ExcelImportResult {
  importedCount: number;
  skippedCount: number;
  replacedCount: number;
  totalRows: number;
  sheetName: string;
}
