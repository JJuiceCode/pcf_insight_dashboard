import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { ExcelImportResult } from '@/features/emissions/types';

/**
 * 가져오기 호출 결과를 표시하는 카드.
 *
 * 한 컴포넌트에서 성공과 실패를 모두 렌더링한다.
 * - 성공: 시트 이름, 전체/저장/스킵 카운트
 * - 실패: 서버가 돌려준 메시지 또는 네트워크 오류 사유
 *
 * 이 단계에서는 결과 요약만 보여주고, 대시보드 데이터 소스에는 영향을 주지 않는다.
 */
export type ImportResultCardState =
  | { kind: 'success'; result: ExcelImportResult }
  | { kind: 'error'; message: string };

export interface ImportResultCardProps {
  state: ImportResultCardState;
}

export function ImportResultCard({ state }: ImportResultCardProps) {
  if (state.kind === 'success') {
    return <ImportSuccessCard result={state.result} />;
  }
  return <ImportErrorCard message={state.message} />;
}

function ImportSuccessCard({ result }: { result: ExcelImportResult }) {
  const wasReplaced = result.replacedCount > 0;
  return (
    <Card aria-labelledby="import-result-title" className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-wider text-accent uppercase">
            가져오기 결과
          </p>
          <h3
            id="import-result-title"
            className="mt-1 text-base font-semibold tracking-tight text-foreground"
          >
            {wasReplaced
              ? '기존 데이터를 새 파일로 교체했습니다'
              : '가져오기가 완료되었습니다'}
          </h3>
          <p className="mt-1 text-xs text-muted">
            가져온 행이 아래 대시보드에 즉시 반영되었습니다.
          </p>
        </div>
        <Badge variant="success">성공</Badge>
      </header>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ResultRow label="시트" value={result.sheetName} mono={false} />
        <ResultRow
          label="전체 데이터 행"
          value={formatCount(result.totalRows)}
        />
        <ResultRow
          label="가져온 행"
          value={formatCount(result.importedCount)}
          accent
        />
        <ResultRow
          label="교체된 기존 행"
          value={formatCount(result.replacedCount)}
          muted
        />
        <ResultRow
          label="건너뛴 행"
          value={formatCount(result.skippedCount)}
          muted
        />
      </dl>

      <p className="text-xs text-muted">
        가져오기는 교체 방식으로 동작합니다. 같은 제품의 기존 활동 데이터는
        새 엑셀의 행으로 완전히 대체되며, 배출계수 히스토리는 그대로 유지됩니다.
        {result.skippedCount > 0
          ? ' 건너뛴 행에는 같은 파일 안의 중복 행과 도메인 검증을 통과하지 못한 행이 포함됩니다.'
          : ''}
      </p>
    </Card>
  );
}

function ImportErrorCard({ message }: { message: string }) {
  // status colors (red) are intentionally kept here: a failed import must
  // remain visually distinct from the accent-themed success card.
  return (
    <Card
      aria-labelledby="import-error-title"
      className="space-y-2 border-red-200 dark:border-red-500/40"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-wider text-red-600 uppercase dark:text-red-400">
            가져오기 결과
          </p>
          <h3
            id="import-error-title"
            className="mt-1 text-base font-semibold tracking-tight text-foreground"
          >
            가져오기에 실패했습니다
          </h3>
        </div>
        <Badge variant="warning">실패</Badge>
      </header>

      <p
        role="alert"
        className="text-sm leading-6 text-red-700 dark:text-red-300"
      >
        {message}
      </p>
      <p className="text-xs text-muted">
        파일을 다시 확인한 뒤 가져오기를 재시도해 주세요. 선택한 파일은 그대로
        유지됩니다.
      </p>
    </Card>
  );
}

function ResultRow({
  label,
  value,
  accent = false,
  muted = false,
  mono = true,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-xl border border-border bg-background/60 px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd
        className={[
          'text-sm font-semibold',
          mono ? 'tabular-nums' : '',
          accent ? 'text-accent' : muted ? 'text-muted' : 'text-foreground',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
      </dd>
    </div>
  );
}

function formatCount(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${value.toLocaleString('en-US')}건`;
}
