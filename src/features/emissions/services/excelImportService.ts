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
  buildColumnIndexMap,
  isEmptyRow,
  parseActivityRow,
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
 */
export class ExcelImportError extends Error {
  constructor(
    public readonly code: ExcelImportErrorCode,
    message: string,
    public readonly missingColumns?: readonly string[],
  ) {
    super(message);
    this.name = 'ExcelImportError';
  }
}

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

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new ExcelImportError('no-sheet', '워크시트를 찾을 수 없습니다.');
  }
  const sheet = workbook.Sheets[sheetName];

  // header: 1 옵션으로 각 행을 셀 배열로 받는다. 헤더 정규화를 매퍼에서 직접 처리하기 위함이다.
  const aoa = XLSX.utils.sheet_to_json<ReadonlyArray<unknown>>(sheet, {
    header: 1,
    defval: null,
    raw: true,
    blankrows: false,
  });

  if (aoa.length === 0) {
    throw new ExcelImportError('empty-sheet', '시트에 데이터가 없습니다.');
  }

  const [headerRow, ...dataRows] = aoa;
  const { map: indexMap, missing } = buildColumnIndexMap(headerRow);
  if (!indexMap) {
    throw new ExcelImportError(
      'missing-columns',
      `활동 데이터 컬럼이 누락되었습니다: ${missing.join(', ')}`,
      missing,
    );
  }

  // 1) 행 단위 정규화. 잘못된 행은 skip으로 집계만 한다.
  const parsedRows: ParsedActivityRow[] = [];
  let invalidRowCount = 0;
  let nonEmptyRowCount = 0;

  for (const cells of dataRows) {
    if (isEmptyRow(cells)) continue;
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
  const seenKeys = new Set<string>(existingKeys.map(activityCompositeKeyFromDb));

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
