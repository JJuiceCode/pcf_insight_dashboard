import { IMPORTED_PRODUCT_ID } from '@/features/emissions/constants';
import {
  ExcelImportError,
  clearImportedActivities,
  importExcelActivities,
} from '@/features/emissions/services/excelImportService';

/**
 * Excel 활동 데이터 가져오기 엔드포인트.
 *
 * 책임 범위:
 *  - multipart 요청에서 파일을 꺼내, 서비스에 buffer만 전달한다.
 *  - 도메인 에러(`ExcelImportError`)는 400 응답으로 매핑한다.
 *  - 파싱·정규화·DB 삽입 로직은 모두 서비스에 위임한다.
 *    route handler가 도메인 로직을 직접 알지 않게 해 책임을 분리한다.
 *
 * 가져온 ActivityRecord는 시드와 격리하기 위해 `IMPORTED_PRODUCT_ID`로 저장한다.
 * 같은 SQLite 테이블을 쓰지만 productId가 다르므로 `/` (시드 대시보드)와
 * `/import` (가져오기 대시보드)가 자연스럽게 분리된다.
 *
 * 다음 단계에서 다중 제품을 지원하면 클라이언트가 `productId`를 함께 보내도록 확장한다.
 */

// Prisma·Node Buffer API를 사용하므로 Node.js 런타임으로 고정한다.
export const runtime = 'nodejs';
// POST는 자동으로 캐싱되지 않지만 명시해 의도를 분명히 한다.
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(
      'invalid-file',
      '업로드 요청을 해석할 수 없습니다.',
      400,
    );
  }

  const fileField = formData.get('file');
  if (!(fileField instanceof File)) {
    return errorResponse(
      'invalid-file',
      '업로드할 엑셀 파일이 비어 있습니다.',
      400,
    );
  }

  const arrayBuffer = await fileField.arrayBuffer();

  try {
    const result = await importExcelActivities({
      buffer: arrayBuffer,
      productId: IMPORTED_PRODUCT_ID,
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof ExcelImportError) {
      return errorResponse(error.code, error.message, 400, {
        missingColumns: error.missingColumns ?? null,
        // 헤더 탐색 실패 시 운영자가 실제 시트가 어떻게 들어왔는지 한눈에 보고
        // 라벨 차이를 빠르게 판단할 수 있도록 상단 행 미리보기를 함께 돌려준다.
        headerSamples: error.headerSamples ?? null,
      });
    }
    // 정의되지 않은 오류는 그대로 위로 던져 Next.js의 표준 500 처리를 따른다.
    throw error;
  }
}

/**
 * 가져온 ActivityRecord를 모두 비우는 엔드포인트.
 *
 * `/import` 페이지의 "엑셀 데이터 지우기" 액션이 이 핸들러를 호출한다.
 * `IMPORTED_PRODUCT_ID` 범위만 비우므로 `/`의 시드 데이터와 EmissionFactor 히스토리는
 * 영향을 받지 않는다. 호출 시점에 가져온 행이 없어도 정상으로 간주하고 0을 반환한다.
 */
export async function DELETE(): Promise<Response> {
  const result = await clearImportedActivities(IMPORTED_PRODUCT_ID);
  return Response.json(result);
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  extra?: Record<string, unknown>,
): Response {
  return Response.json({ code, message, ...extra }, { status });
}
