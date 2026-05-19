'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ExcelImportResult } from '@/features/emissions/types';
import { ExcelUploadCard } from './ExcelUploadCard';
import { FilePreview } from './FilePreview';
import { ImportResultCard } from './ImportResultCard';

/**
 * Import 페이지의 클라이언트 셸.
 *
 * 책임:
 *  - 선택된 파일과 클라이언트 측 검증 에러를 보관한다.
 *  - "엑셀 데이터 가져오기" 버튼 클릭 시 `/api/import/excel`로 multipart 요청을 보낸다.
 *  - 서버 응답을 받아 success/error 결과 카드를 렌더링한다.
 *
 * 이 단계(Step 11-B)에서는 결과 요약까지만 표시한다. 대시보드 데이터 소스 교체와
 * 재계산은 다음 단계로 분리되어 있어 여기서 라우터 navigation이나 refresh를 트리거하지 않는다.
 */
type ImportStatus =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; result: ExcelImportResult }
  | { kind: 'error'; message: string };

const IMPORT_ENDPOINT = '/api/import/excel';

/**
 * 서버가 에러일 때 돌려주는 페이로드 형태.
 * 상세 코드는 노출하지 않고 사람이 읽을 수 있는 `message`만 사용한다.
 */
interface ServerErrorPayload {
  code?: string;
  message?: string;
}

export function ImportClient() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [status, setStatus] = useState<ImportStatus>({ kind: 'idle' });

  const isSubmitting = status.kind === 'submitting';
  const canImport = selectedFile !== null && !isSubmitting;

  const handleFileSelected = useCallback((file: File) => {
    setSelectedFile(file);
    setValidationError(null);
    // 새 파일을 골랐으니 직전 결과 카드는 더 이상 의미가 없어 비운다.
    setStatus({ kind: 'idle' });
  }, []);

  const handleInvalidFile = useCallback((reason: string) => {
    setSelectedFile(null);
    setValidationError(reason);
    setStatus({ kind: 'idle' });
  }, []);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setValidationError(null);
    setStatus({ kind: 'idle' });
  }, []);

  const handleImport = useCallback(async () => {
    if (!selectedFile || isSubmitting) return;

    setStatus({ kind: 'submitting' });

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Content-Type 헤더는 명시하지 않는다. multipart boundary를 브라우저가 자동으로 채워준다.
      const response = await fetch(IMPORT_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const message = await extractErrorMessage(response);
        setStatus({ kind: 'error', message });
        return;
      }

      const result = (await response.json()) as ExcelImportResult;
      setStatus({ kind: 'success', result });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? `네트워크 오류로 가져오기에 실패했습니다. (${error.message})`
          : '네트워크 오류로 가져오기에 실패했습니다.';
      setStatus({ kind: 'error', message });
    }
  }, [selectedFile, isSubmitting]);

  return (
    <div className="space-y-5">
      <ExcelUploadCard
        selectedFileName={selectedFile?.name ?? null}
        onFileSelected={handleFileSelected}
        onInvalidFile={handleInvalidFile}
        errorMessage={validationError}
        disabled={isSubmitting}
      />

      <FilePreview
        file={selectedFile}
        onClear={handleClear}
        disabled={isSubmitting}
      />

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          가져오기를 실행하면 선택한 엑셀 파일이 서버로 전송되어 활동 데이터로
          저장됩니다.
        </p>
        <Button
          type="button"
          variant="primary"
          onClick={handleImport}
          disabled={!canImport}
          aria-busy={isSubmitting || undefined}
          className="sm:min-w-[200px]"
        >
          {isSubmitting ? '가져오는 중...' : '엑셀 데이터 가져오기'}
        </Button>
      </div>

      {status.kind === 'success' ? (
        <ImportResultCard state={{ kind: 'success', result: status.result }} />
      ) : null}
      {status.kind === 'error' ? (
        <ImportResultCard state={{ kind: 'error', message: status.message }} />
      ) : null}
    </div>
  );
}

/**
 * 서버 에러 응답에서 사용자에게 보여줄 메시지를 안전하게 꺼낸다.
 *
 * JSON 본문이 깨졌거나 비어 있으면 상태 코드로 폴백한다.
 * 라우트 핸들러는 `ExcelImportError`를 한국어 메시지로 노출하도록 구현되어 있어
 * 정상 경로에서는 `message` 필드가 항상 존재한다.
 */
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ServerErrorPayload;
    if (typeof payload?.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    // JSON 파싱 실패 시 폴백 메시지를 사용한다.
  }
  return `가져오기에 실패했습니다. (HTTP ${response.status})`;
}
