'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
 *  - "엑셀 데이터 지우기" 버튼 클릭 시 확인 단계를 거쳐 `/api/import/excel`로 DELETE 요청을 보낸다.
 *  - 두 액션 모두 성공 시 `router.refresh()`로 서버 컴포넌트(`/import` 페이지)를 다시 평가시켜
 *    아래의 imported 대시보드가 새 상태(가져온 데이터 또는 빈 상태)를 반영하도록 한다.
 *
 * 대시보드 자체의 계산·렌더링은 페이지 서버 컴포넌트가 담당하므로 이 컴포넌트는
 * 가져오기/지우기 트리거와 결과 표시에만 책임을 갖는다.
 */
type ImportStatus =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; result: ExcelImportResult }
  | { kind: 'error'; message: string };

/**
 * 지우기 액션의 4단계 상태.
 *
 *   idle       : 초기 상태. "엑셀 데이터 지우기" 버튼만 보인다.
 *   confirming : 사용자가 1차 클릭. 경고 메시지와 [취소] [지우기] 두 버튼이 보인다.
 *   deleting   : DELETE 요청 진행 중. 버튼은 비활성화되고 텍스트가 바뀐다.
 *   error      : 실패. 메시지와 함께 다시 시도하거나 취소할 수 있다.
 *
 * 성공 시에는 `idle`로 복귀하면서 상위 import 상태도 함께 초기화한다.
 */
type DeleteStatus =
  | { kind: 'idle' }
  | { kind: 'confirming' }
  | { kind: 'deleting' }
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

export interface ImportClientProps {
  /**
   * 서버가 판단한 "가져온 데이터 존재 여부".
   * true일 때만 "엑셀 데이터 지우기" 섹션이 표시된다.
   * 지우기 성공 후 `router.refresh()`로 서버가 다시 평가되면 자연스럽게 false가 되어 섹션이 숨겨진다.
   */
  hasImportedData: boolean;
  /** 현재 SQLite에 적재된 ActivityRecord 수. 확인 단계에서 운영자에게 보여 준다. */
  importedRowCount: number;
}

export function ImportClient({
  hasImportedData,
  importedRowCount,
}: ImportClientProps) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [status, setStatus] = useState<ImportStatus>({ kind: 'idle' });
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus>({
    kind: 'idle',
  });

  const isSubmitting = status.kind === 'submitting';
  const isDeleting = deleteStatus.kind === 'deleting';
  // 가져오기와 지우기는 서로 race condition을 만들 수 있으니, 한쪽이 진행 중이면 다른 쪽도 막는다.
  const isBusy = isSubmitting || isDeleting;
  const canImport = selectedFile !== null && !isBusy;

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
    if (!selectedFile || isBusy) return;

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
      // 서버 컴포넌트(`/import` page)가 다시 실행되도록 라우터 캐시를 무효화한다.
      // 새로 적재된 ActivityRecord가 즉시 imported 대시보드 섹션에 반영된다.
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? `네트워크 오류로 가져오기에 실패했습니다. (${error.message})`
          : '네트워크 오류로 가져오기에 실패했습니다.';
      setStatus({ kind: 'error', message });
    }
  }, [selectedFile, isBusy, router]);

  const handleStartDelete = useCallback(() => {
    if (isBusy) return;
    setDeleteStatus({ kind: 'confirming' });
  }, [isBusy]);

  const handleCancelDelete = useCallback(() => {
    setDeleteStatus({ kind: 'idle' });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (isBusy) return;
    setDeleteStatus({ kind: 'deleting' });

    try {
      const response = await fetch(IMPORT_ENDPOINT, { method: 'DELETE' });

      if (!response.ok) {
        const message = await extractErrorMessage(response);
        setDeleteStatus({ kind: 'error', message });
        return;
      }

      // 가져오기 상태 일체를 초기화하고 서버 데이터를 다시 가져온다.
      // hasImportedData가 false로 바뀌면서 이 섹션 자체가 자연스럽게 사라진다.
      setSelectedFile(null);
      setValidationError(null);
      setStatus({ kind: 'idle' });
      setDeleteStatus({ kind: 'idle' });
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? `네트워크 오류로 삭제에 실패했습니다. (${error.message})`
          : '네트워크 오류로 삭제에 실패했습니다.';
      setDeleteStatus({ kind: 'error', message });
    }
  }, [isBusy, router]);

  return (
    <div className="space-y-5">
      <ExcelUploadCard
        selectedFileName={selectedFile?.name ?? null}
        onFileSelected={handleFileSelected}
        onInvalidFile={handleInvalidFile}
        errorMessage={validationError}
        disabled={isBusy}
      />

      <FilePreview
        file={selectedFile}
        onClear={handleClear}
        disabled={isBusy}
      />

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          가져오기를 실행하면 같은 제품의 기존 가져오기 데이터가 새 엑셀 파일로
          완전히 교체됩니다.
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

      {hasImportedData ? (
        <ImportClearSection
          importedRowCount={importedRowCount}
          deleteStatus={deleteStatus}
          onStart={handleStartDelete}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          importBusy={isSubmitting}
        />
      ) : null}
    </div>
  );
}

/**
 * "엑셀 데이터 지우기" 섹션.
 *
 * 1차 클릭(`onStart`) → 인라인 확인 패널(`confirming`) → `onConfirm`으로 실제 DELETE 호출.
 * 모달이 아니라 동일 카드 내에서 단계가 바뀌어, 운영자가 같은 컨텍스트 안에서
 * 의사결정을 끝낼 수 있게 한다.
 *
 * 가져오기가 진행 중일 때(`importBusy`)는 충돌을 막기 위해 시작 버튼을 비활성화한다.
 */
interface ImportClearSectionProps {
  importedRowCount: number;
  deleteStatus: DeleteStatus;
  onStart: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  importBusy: boolean;
}

function ImportClearSection({
  importedRowCount,
  deleteStatus,
  onStart,
  onCancel,
  onConfirm,
  importBusy,
}: ImportClearSectionProps) {
  const isConfirming = deleteStatus.kind === 'confirming';
  const isDeleting = deleteStatus.kind === 'deleting';
  const errorMessage =
    deleteStatus.kind === 'error' ? deleteStatus.message : null;

  return (
    <Card
      aria-labelledby="import-clear-title"
      className="border-dashed bg-background/60"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="warning">위험</Badge>
            <span className="text-xs text-muted">
              현재 가져온 데이터: {importedRowCount.toLocaleString('ko-KR')}건
            </span>
          </div>
          <h3
            id="import-clear-title"
            className="mt-2 text-base font-semibold tracking-tight text-foreground"
          >
            엑셀 데이터 지우기
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            가져온 ActivityRecord만 삭제됩니다. 시드 데이터(<code className="font-mono text-xs">/</code>)와
            배출계수 히스토리는 영향을 받지 않습니다.
          </p>
        </div>

        {!isConfirming && !isDeleting ? (
          // Destructive action button: red is intentionally kept so the
          // delete affordance reads as dangerous in both light and dark themes.
          <Button
            type="button"
            variant="secondary"
            onClick={onStart}
            disabled={importBusy}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          >
            엑셀 데이터 지우기
          </Button>
        ) : null}
      </header>

      {isConfirming || isDeleting ? (
        <div
          role="alertdialog"
          aria-labelledby="import-clear-confirm-title"
          aria-describedby="import-clear-confirm-desc"
          className="mt-4 rounded-xl border border-red-200 bg-red-50/70 p-4 dark:border-red-500/40 dark:bg-red-950/30"
        >
          <p
            id="import-clear-confirm-title"
            className="text-sm font-semibold text-red-700 dark:text-red-300"
          >
            정말 가져온 데이터를 지울까요?
          </p>
          <p
            id="import-clear-confirm-desc"
            className="mt-1 text-xs leading-6 text-red-700/80 dark:text-red-300/80"
          >
            {importedRowCount.toLocaleString('ko-KR')}건의 가져온 활동 데이터가
            삭제되고, 아래의 가져온 데이터 기반 대시보드는 빈 상태로 돌아갑니다.
            이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={onConfirm}
              disabled={isDeleting}
              aria-busy={isDeleting || undefined}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500 dark:disabled:hover:bg-red-600"
            >
              {isDeleting ? '지우는 중...' : '지우기'}
            </Button>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <p
          role="alert"
          className="mt-3 text-xs leading-6 text-red-700 dark:text-red-300"
        >
          {errorMessage} 다시 시도해 주세요.
        </p>
      ) : null}
    </Card>
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
  return `요청에 실패했습니다. (HTTP ${response.status})`;
}
