import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

/**
 * 업로드된 Excel이 이후 단계에서 어떤 흐름을 거치는지 보여주는 안내 카드.
 *
 * 운영자에게 "지금은 업로드만 받고, 이후 단계에서 자동으로 파싱·계산·반영된다"는
 * 도메인적 흐름을 시각적으로 전달한다. 실제 동작은 이번 단계에서 구현하지 않는다.
 */
interface FlowStep {
  index: number;
  title: string;
  description: string;
}

const FLOW_STEPS: readonly FlowStep[] = [
  {
    index: 1,
    title: 'Excel 파일 업로드',
    description: '운영자가 활동 데이터가 담긴 엑셀 파일을 업로드합니다.',
  },
  {
    index: 2,
    title: '활동 데이터 파싱',
    description:
      '시트의 행을 활동 레코드(전기·원소재·운송)로 정규화해 검증합니다.',
  },
  {
    index: 3,
    title: '데이터베이스 저장',
    description:
      '파싱된 활동 레코드를 저장하고, 기존 시드 데이터는 점진적으로 교체됩니다.',
  },
  {
    index: 4,
    title: '배출량 계산',
    description:
      '활동 시점에 유효한 배출계수와 매칭해 kgCO2e 단위 배출량을 산출합니다.',
  },
  {
    index: 5,
    title: 'PCF 인사이트 갱신',
    description:
      '대시보드의 KPI·Scope·월별 추이가 새 데이터로 자동 갱신됩니다.',
  },
];

export function ImportFlowExplanation() {
  return (
    <Card aria-labelledby="import-flow-title" className="space-y-4">
      <div>
        <p className="text-[11px] font-medium tracking-wider text-orange-600 uppercase dark:text-orange-400">
          가져오기 워크플로우
        </p>
        <h3
          id="import-flow-title"
          className="mt-1 text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
        >
          업로드 이후 처리 과정
        </h3>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          이번 단계에서는 업로드 UI까지만 동작합니다. 아래 단계는 이후 작업에서
          자동으로 이어집니다.
        </p>
      </div>

      <ol className="space-y-3" aria-label="가져오기 단계">
        {FLOW_STEPS.map((step, idx) => (
          <li key={step.index} className="flex items-start gap-3">
            <StepDot index={step.index} />
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  {step.title}
                </p>
                {idx === 0 ? (
                  <Badge variant="accent">현재 단계</Badge>
                ) : (
                  <Badge variant="neutral">예정</Badge>
                )}
              </div>
              <p className="mt-0.5 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/** 단계 번호를 표시하는 원형 마커. 첫 단계는 오렌지 액센트로 강조한다. */
function StepDot({ index }: { index: number }) {
  const isFirst = index === 1;
  return (
    <span
      aria-hidden
      className={
        isFirst
          ? 'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white shadow-sm dark:bg-orange-500'
          : 'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-xs font-semibold text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400'
      }
    >
      {index}
    </span>
  );
}
