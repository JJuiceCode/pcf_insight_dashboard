'use client';

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * Excel 업로드 카드.
 *
 * 운영자가 드래그&드롭이나 파일 선택 다이얼로그로 `.xlsx` / `.xls` 파일을
 * 1건 선택하도록 한다. 이 단계에서는 실제 파싱·업로드를 수행하지 않고,
 * 선택된 `File` 객체만 상위 컴포넌트에 전달한다.
 *
 * 검증은 확장자 기반의 가벼운 검사만 수행한다. 확장자가 맞지 않으면
 * 인라인 에러 메시지를 보여주고 선택을 무시한다. alert는 사용하지 않는다.
 *
 * 라이브러리 추가 없이 네이티브 input(`<input type="file" />`)과
 * DragEvent API만으로 구현한다.
 */
export interface ExcelUploadCardProps {
  /** 현재 선택된 파일 이름. 카드 본문에 부드러운 상태 메시지를 그리기 위해 사용. */
  selectedFileName?: string | null;
  /** 사용자가 유효한 파일을 선택했을 때 호출된다. */
  onFileSelected: (file: File) => void;
  /** 사용자가 잘못된 확장자를 시도했을 때 호출된다. 상위에서 에러 메시지를 관리한다. */
  onInvalidFile?: (reason: string) => void;
  /** 외부에서 표시할 에러 메시지(없으면 인라인 에러를 숨긴다). */
  errorMessage?: string | null;
}

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls'] as const;
const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',');
const INVALID_EXTENSION_MESSAGE =
  '엑셀 파일(.xlsx 또는 .xls)만 업로드할 수 있습니다.';

export function ExcelUploadCard({
  selectedFileName,
  onFileSelected,
  onInvalidFile,
  errorMessage,
}: ExcelUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      // 다중 선택을 허용하지 않으므로 첫 번째 파일만 사용한다.
      const file = files[0];
      if (!isAcceptedExcelFile(file)) {
        onInvalidFile?.(INVALID_EXTENSION_MESSAGE);
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected, onInvalidFile],
  );

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleFiles(event.target.files);
      // 같은 파일을 다시 선택해도 onChange가 발생하도록 입력값을 초기화한다.
      event.target.value = '';
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  }, []);

  const handleDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // 자식 요소로의 dragleave는 무시한다. relatedTarget이 컨테이너 외부일 때만 종료.
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles],
  );

  const hasError = Boolean(errorMessage);

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed bg-white px-6 py-12 text-center transition-colors sm:py-16 dark:bg-neutral-900',
        isDragging
          ? 'border-orange-500 bg-orange-50/60 dark:border-orange-400 dark:bg-orange-950/30'
          : hasError
            ? 'border-red-300 dark:border-red-500/60'
            : 'border-neutral-300 dark:border-neutral-700',
      )}
    >
      <UploadIcon active={isDragging} />

      <div className="space-y-1">
        <p className="text-base font-medium text-neutral-900 dark:text-neutral-50">
          Excel 파일을 끌어다 놓거나 선택하세요
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          지원 형식: <span className="font-medium">.xlsx</span>,{' '}
          <span className="font-medium">.xls</span>
        </p>
        {selectedFileName ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            현재 선택:{' '}
            <span className="font-medium text-neutral-700 dark:text-neutral-200">
              {selectedFileName}
            </span>
          </p>
        ) : null}
      </div>

      <Button type="button" variant="primary" onClick={openFileDialog}>
        파일 선택
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="sr-only"
        onChange={handleInputChange}
        aria-label="Excel 파일 선택"
      />

      {hasError ? (
        <p
          role="alert"
          className="mt-1 text-sm text-red-600 dark:text-red-400"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

/**
 * 확장자만 보고 엑셀 파일 여부를 판단한다.
 *
 * MIME 타입은 OS·브라우저마다 다르게 보고되므로(예: macOS Safari에서
 * `application/octet-stream`) 신뢰하지 않는다. 실제 파싱은 다음 단계에서
 * 수행되므로 여기서는 빠른 사전 가드 정도만 한다.
 */
function isAcceptedExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function UploadIcon({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex h-12 w-12 items-center justify-center rounded-full transition-colors',
        active
          ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-300'
          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M12 16V4" />
        <path d="m6 10 6-6 6 6" />
        <path d="M4 20h16" />
      </svg>
    </span>
  );
}
