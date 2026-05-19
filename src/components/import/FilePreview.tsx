import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

/**
 * 업로드 카드에서 선택된 파일의 메타데이터·상태를 보여주는 패널.
 *
 * 이 단계에서는 파일을 파싱하거나 업로드하지 않는다.
 * "업로드 준비됨" 배지는 사용자가 다음 단계로 넘어가도 안전한 상태라는 시각 신호일 뿐이다.
 */
export interface FilePreviewProps {
  file: File | null;
  /**
   * 선택 해제 콜백. 누르면 부모가 `selectedFile`을 null로 비운다.
   * 운영자가 잘못 선택한 파일을 빠르게 취소할 수 있게 하기 위함이다.
   */
  onClear?: () => void;
  /**
   * 가져오기 진행 중에는 "선택 해제" 버튼을 잠가 중복 조작을 차단한다.
   * 카드 자체는 계속 표시해 사용자에게 어떤 파일이 처리 중인지 알려준다.
   */
  disabled?: boolean;
}

export function FilePreview({ file, onClear, disabled = false }: FilePreviewProps) {
  return (
    <Card aria-labelledby="file-preview-title" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-wider text-orange-600 uppercase dark:text-orange-400">
            업로드 상태
          </p>
          <h3
            id="file-preview-title"
            className="mt-1 text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
          >
            선택된 파일
          </h3>
        </div>
        {file ? (
          <Badge variant="success">업로드 준비됨</Badge>
        ) : (
          <Badge variant="neutral">대기 중</Badge>
        )}
      </div>

      {file ? (
        <SelectedFileSummary
          file={file}
          onClear={onClear}
          clearDisabled={disabled}
        />
      ) : (
        <EmptyState />
      )}
    </Card>
  );
}

function SelectedFileSummary({
  file,
  onClear,
  clearDisabled,
}: {
  file: File;
  onClear?: () => void;
  clearDisabled?: boolean;
}) {
  const extension = getFileExtension(file.name);

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-50/60 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/40">
      <div className="flex min-w-0 items-center gap-3">
        <FileIcon />
        <div className="min-w-0">
          <p
            className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50"
            title={file.name}
          >
            {file.name}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="tabular-nums">{formatFileSize(file.size)}</span>
            {extension ? (
              <>
                <span className="mx-1.5 text-neutral-300 dark:text-neutral-600">
                  ·
                </span>
                <span className="font-medium uppercase">{extension}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>
      {onClear ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onClear}
          disabled={clearDisabled}
          className="h-8 px-2 text-xs"
          aria-label="선택한 파일 해제"
        >
          선택 해제
        </Button>
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/40 px-4 py-5 text-center dark:border-neutral-800 dark:bg-neutral-950/30">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        선택된 파일이 없습니다.
      </p>
      <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
        위 업로드 카드에서 Excel 파일을 선택하세요.
      </p>
    </div>
  );
}

/**
 * 파일 크기를 사람이 읽기 좋은 문자열로 변환한다 (`125 KB`, `1.20 MB`).
 *
 * 표시 전용이라 정확도는 1024 단위로 충분하다.
 * 1024 byte 미만은 단위를 그대로 노출해 작은 파일도 알아볼 수 있게 한다.
 */
function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** 파일명에서 확장자를 추출한다. 점이 없으면 빈 문자열을 반환한다. */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot < 0 || lastDot === fileName.length - 1) return '';
  return fileName.slice(lastDot + 1);
}

function FileIcon() {
  return (
    <span
      aria-hidden
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-300"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </svg>
    </span>
  );
}
