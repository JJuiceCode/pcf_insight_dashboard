import {
  ExcelImportError,
  importExcelActivities,
} from '@/features/emissions/services/excelImportService';

/**
 * Excel 활동 데이터 가져오기 엔드포인트.
 *
 * 책임 범위(Step 12-A):
 *  - multipart 요청에서 파일을 꺼내, 서비스에 buffer만 전달한다.
 *  - 도메인 에러(`ExcelImportError`)는 400 응답으로 매핑한다.
 *  - 파싱·정규화·DB 삽입 로직은 모두 서비스에 위임한다.
 *    route handler가 도메인 로직을 직접 알지 않게 해 책임을 분리한다.
 *
 * 다음 단계에서 다중 제품을 지원하면 클라이언트가 `productId`를 함께 보내도록 확장한다.
 */

// 단일 제품 데모이므로 productId는 시드와 동일하게 고정한다.
// 다음 단계에서 productId 선택 UI가 추가되면 form 필드로 받도록 바꾼다.
const DEFAULT_PRODUCT_ID = 'product-ct-045';

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
      productId: DEFAULT_PRODUCT_ID,
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof ExcelImportError) {
      return errorResponse(error.code, error.message, 400, {
        missingColumns: error.missingColumns ?? null,
      });
    }
    // 정의되지 않은 오류는 그대로 위로 던져 Next.js의 표준 500 처리를 따른다.
    throw error;
  }
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  extra?: Record<string, unknown>,
): Response {
  return Response.json({ code, message, ...extra }, { status });
}
