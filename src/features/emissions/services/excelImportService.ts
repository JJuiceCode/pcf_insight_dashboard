/**
 * Excel 활동 데이터 가져오기 오케스트레이션. **server-only**.
 *
 * 책임 분리:
 *  - workbook 디코딩 (`xlsx`)
 *  - 행 정규화 위임 (`excelActivityMapper`)
 *  - 중복 행 감지 (DB의 기존 행과 import 내부 중복 모두)
 *  - 일괄 삽입 위임 (`activityRepository.createManyActivities`)
 *
 * 단일 행 오류로 가져오기 전체가 실패하지 않도록, 검증·중복은 `skippedCount`로 집계하고
 * 시트·파일 단위의 치명적 문제만 `ExcelImportError`로 throw 한다.
 *
 * 다음 단계(대시보드 데이터 소스 교체)에서 그대로 재사용할 수 있도록,
 * 호출 측은 `productId`를 명시적으로 전달한다.
 */

import * as XLSX from 'xlsx';

import {
  createManyActivities,
  findActivityKeysByProductId,
  type ActivityCompositeKeyRow,
  type CreateActivityInput,
} from '../repositories/activityRepository';
import {
  findActivityHeaderRow,
  isActivityBlockEnd,
  parseActivityRow,
  type ColumnIndexMap,
  type ParsedActivityRow,
} from '../mappers/excelActivityMapper';
import type { ExcelImportResult } from '../types';

export type ExcelImportErrorCode =
  | 'invalid-file'
  | 'no-sheet'
  | 'empty-sheet'
  | 'missing-columns';

/**
 * 가져오기를 더 이상 진행할 수 없는 치명적 오류.
 *
 * route handler는 이 에러를 잡아 400 응답으로 변환한다.
 * 단일 행 오류는 여기서 throw하지 않는다.
 *
 * `headerSamples`는 헤더 탐색에 실패했을 때 운영자가 실제 시트의 행이
 * 어떻게 생겼는지 한눈에 보고 라벨 차이를 추정할 수 있도록 첨부한다.
 */
export class ExcelImportError extends Error {
  constructor(
    public readonly code: ExcelImportErrorCode,
    message: string,
    public readonly missingColumns?: readonly string[],
    public readonly headerSamples?: readonly string[],
  ) {
    super(message);
    this.name = 'ExcelImportError';
  }
}

const HEADER_SAMPLE_ROWS = 5;
const isDev = process.env.NODE_ENV !== 'production';

export interface ImportExcelActivitiesParams {
  /** 업로드된 파일의 raw 바이트. route handler에서 `await file.arrayBuffer()`로 얻는다. */
  buffer: Buffer | ArrayBuffer | Uint8Array;
  /** 활동을 귀속시킬 제품 ID. 현 시점에서는 CT-045 단일 제품을 가정. */
  productId: string;
}

export async function importExcelActivities(
  params: ImportExcelActivitiesParams,
): Promise<ExcelImportResult> {
  const workbook = readWorkbook(params.buffer);

  if (workbook.SheetNames.length === 0) {
    throw new ExcelImportError('no-sheet', '워크시트를 찾을 수 없습니다.');
  }

  // 평가용 엑셀은 첫 시트가 "과제 개요"(설명 문서)이고, 활동 데이터는
  // 별도 시트에 들어 있다. 워크북의 시트를 순서대로 스캔해 활동 헤더가 발견되는
  // 첫 시트를 채택한다. 시트 순서가 바뀌거나 새 시트가 추가되어도 영향이 없다.
  const located = locateActivitySheet(workbook);
  if (!located) {
    throw new ExcelImportError(
      'missing-columns',
      '엑셀 파일에서 활동 데이터 컬럼이 있는 시트를 찾을 수 없습니다.',
      undefined,
      collectAllSheetsHeaderSamples(workbook),
    );
  }

  const { sheetName, aoa, headerRowIndex, indexMap } = located;
  const dataRows = aoa.slice(headerRowIndex + 1);

  if (isDev) {
    console.log('[excel-import] selected sheet:', sheetName);
    console.log(`[excel-import] header at row ${headerRowIndex} →`, indexMap);
  }

  // 1) 활동 블록 끝(빈 행 / `배출계수` 섹션 / 비활동 행 형태)에서 멈추고
  //    그 전까지의 행만 도메인 형태로 정규화한다. 잘못된 단일 행은 skip으로 집계.
  const parsedRows: ParsedActivityRow[] = [];
  let invalidRowCount = 0;
  let nonEmptyRowCount = 0;

  for (const cells of dataRows) {
    if (isActivityBlockEnd(cells, indexMap)) {
      // 활동 블록이 끝났으므로 이후 행(예: 배출계수 참고표)은 가져오기 대상에서 제외한다.
      break;
    }
    nonEmptyRowCount += 1;

    const result = parseActivityRow(cells, indexMap, params.productId);
    if (result.kind === 'ok') {
      parsedRows.push(result.row);
    } else {
      invalidRowCount += 1;
    }
  }

  // 2) 중복 감지. DB 기존 키 + 같은 import 내 중복을 동시에 차단한다.
  const existingKeys = await findActivityKeysByProductId(params.productId);
  const seenKeys = new Set<string>(
    existingKeys.map(activityCompositeKeyFromDb),
  );

  const toInsert: CreateActivityInput[] = [];
  let duplicateCount = 0;

  for (const row of parsedRows) {
    const key = activityCompositeKey(row);
    if (seenKeys.has(key)) {
      duplicateCount += 1;
      continue;
    }
    seenKeys.add(key);
    toInsert.push(row);
  }

  // 3) 일괄 삽입.
  const importedCount = await createManyActivities(toInsert);

  return {
    importedCount,
    skippedCount: duplicateCount + invalidRowCount,
    totalRows: nonEmptyRowCount,
    sheetName,
  };
}

/**
 * `xlsx`가 throw할 수 있는 케이스(잘못된 OLE 시그니처 등)를 도메인 에러로 감싼다.
 *
 * 라이브러리 메시지는 사용자에게 의미가 없으므로, route handler가 한국어 응답을 줄 수 있도록 일관된 코드로 좁힌다.
 */
function readWorkbook(
  buffer: Buffer | ArrayBuffer | Uint8Array,
): XLSX.WorkBook {
  try {
    return XLSX.read(buffer, { type: 'buffer', cellDates: true });
  } catch {
    throw new ExcelImportError(
      'invalid-file',
      '유효한 엑셀 파일(.xlsx, .xls)을 업로드해 주세요.',
    );
  }
}

/**
 * 활동 행 식별 키 (productId 제외).
 *
 * DB 조회를 productId로 한 번 좁힌 뒤 비교하므로,
 * 키에 productId를 넣지 않아도 동일 제품 내 중복을 충분히 식별할 수 있다.
 * 수량은 동일 자리수로 직렬화해 부동소수점 표기 차이를 흡수한다(`0.10` vs `0.1`).
 */
function activityCompositeKey(row: {
  activityDate: Date;
  activityType: string;
  description: string;
  amount: number;
}): string {
  return [
    row.activityDate.toISOString().slice(0, 10),
    row.activityType.trim(),
    row.description.trim(),
    canonicalizeAmount(row.amount),
  ].join('|');
}

function activityCompositeKeyFromDb(row: ActivityCompositeKeyRow): string {
  return activityCompositeKey(row);
}

function canonicalizeAmount(amount: number): string {
  // 부동소수점 표시 차이를 줄이기 위해 정해진 자리수로 직렬화한다.
  // 활동량은 일반적으로 정수~소수점 2~3자리 수준이라 6자리면 충분히 안전하다.
  return Number.isFinite(amount) ? amount.toFixed(6) : 'NaN';
}

/**
 * 워크북의 모든 시트를 순서대로 스캔해 활동 데이터 헤더가 있는 첫 시트를 찾는다.
 *
 * 평가용 엑셀처럼 첫 시트가 안내 문서이고 데이터 시트가 뒤에 있어도,
 * `과제용 데이터` 같은 이름을 하드코딩하지 않고 헤더 매칭만으로 자동 선택한다.
 *
 * 발견 실패 시 `null`을 돌려주고, 호출 측에서 진단 정보를 모아 에러로 변환한다.
 */
function locateActivitySheet(workbook: XLSX.WorkBook): {
  sheetName: string;
  aoa: ReadonlyArray<ReadonlyArray<unknown>>;
  headerRowIndex: number;
  indexMap: ColumnIndexMap;
} | null {
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const aoa = readSheetAsAoa(sheet);
    if (aoa.length === 0) continue;

    const headerLocation = findActivityHeaderRow(aoa);

    if (isDev) {
      console.log(`[excel-import] scanning sheet "${sheetName}"...`);
      for (let i = 0; i < Math.min(HEADER_SAMPLE_ROWS, aoa.length); i += 1) {
        console.log(`[excel-import]   row[${i}]:`, formatRowForLog(aoa[i]));
      }
      if (headerLocation.found) {
        console.log(
          `[excel-import]   ✓ header at row ${headerLocation.rowIndex}`,
        );
      } else {
        console.log(
          '[excel-import]   ✗ header missing:',
          headerLocation.missing,
        );
      }
    }

    if (headerLocation.found) {
      return {
        sheetName,
        aoa,
        headerRowIndex: headerLocation.rowIndex,
        indexMap: headerLocation.indexMap,
      };
    }
  }
  return null;
}

/** 단일 시트를 활동 영역 파싱용 array-of-arrays로 변환한다. */
function readSheetAsAoa(
  sheet: XLSX.WorkSheet,
): ReadonlyArray<ReadonlyArray<unknown>> {
  return XLSX.utils.sheet_to_json<ReadonlyArray<unknown>>(sheet, {
    header: 1,
    defval: null,
    raw: true,
    blankrows: true,
  });
}

/**
 * 헤더 탐색이 실패했을 때 운영자에게 함께 돌려줄 시트 미리보기.
 *
 * 모든 시트의 상단 몇 행을 보여줘, 어느 시트에 활동 데이터가 있는지
 * 또는 헤더 라벨이 어떻게 다른지를 한눈에 진단할 수 있다.
 * 너무 길어지지 않도록 시트당 행 수와 셀 길이를 모두 잘라낸다.
 */
function collectAllSheetsHeaderSamples(workbook: XLSX.WorkBook): string[] {
  const samples: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const aoa = readSheetAsAoa(sheet);
    samples.push(`[sheet] ${sheetName}`);
    for (let i = 0; i < Math.min(HEADER_SAMPLE_ROWS, aoa.length); i += 1) {
      samples.push(`  row[${i}]: ${formatRowForLog(aoa[i])}`);
    }
  }
  return samples;
}

function formatRowForLog(cells: ReadonlyArray<unknown>): string {
  return cells
    .map((cell) => {
      if (cell === null || cell === undefined) return '∅';
      if (cell instanceof Date) return cell.toISOString().slice(0, 10);
      if (typeof cell === 'string') {
        const trimmed = cell.length > 40 ? `${cell.slice(0, 40)}…` : cell;
        return JSON.stringify(trimmed);
      }
      return String(cell);
    })
    .join(' | ');
}
