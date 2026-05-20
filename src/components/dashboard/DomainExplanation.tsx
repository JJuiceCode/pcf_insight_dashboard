import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

/**
 * 대시보드 해석을 돕는 GHG Scope 안내 콘텐츠.
 *
 * 시드 데이터와 분리된 설명 문구이며,
 * 계산 결과가 어떤 기준으로 분류되는지 사용자에게 전달한다.
 */
interface ScopeExplanation {
  scope: 'Scope 1' | 'Scope 2' | 'Scope 3';
  variant: BadgeVariant;
  title: string;
  description: string;
}

const SCOPES: readonly ScopeExplanation[] = [
  {
    scope: 'Scope 1',
    variant: 'neutral',
    title: '직접 배출',
    description:
      '사업장 내 연료 사용, 자체 시설, 보유 차량 등에서 발생하는 직접 배출입니다. CT-045 데이터에는 해당 활동이 없어 현재는 0으로 표시됩니다.',
  },
  {
    scope: 'Scope 2',
    variant: 'accent',
    title: '구매 전력',
    description:
      '제품 생산 과정에서 사용된 전력으로 인해 발생하는 간접 배출입니다. 현재는 한국전력 배출계수를 적용합니다.',
  },
  {
    scope: 'Scope 3',
    variant: 'neutral',
    title: '원소재 및 물류',
    description:
      '원소재(플라스틱 1, 플라스틱 2)와 운송(트럭 ton-km) 과정에서 발생하는 간접 배출입니다.',
  },
];

export function DomainExplanation() {
  return (
    <section aria-labelledby="domain-explanation-title">
      <Card>
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-wider text-accent uppercase">
              PCF 개요
            </p>
            <h2
              id="domain-explanation-title"
              className="mt-1 text-lg font-semibold tracking-tight text-foreground"
            >
              제품 탄소발자국 이해하기
            </h2>
          </div>
          <Badge variant="accent">CT-045 Monitor</Badge>
        </header>

        <p className="mt-4 text-sm leading-6 text-foreground/80">
          <strong className="font-semibold text-foreground">
            제품 탄소발자국(Product Carbon Footprint, PCF)
          </strong>
          은 제품 생산 과정에서 발생하는 전체 온실가스 배출량을 의미하며, kgCO2e
          단위로 표현합니다. 각 활동 데이터는 버전 관리된 배출계수를 적용해 최종
          배출량으로 변환됩니다.
        </p>

        <p className="mt-3 inline-flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 font-mono text-[13px] text-foreground">
          <span>배출량 (kgCO2e)</span>
          <span aria-hidden className="text-muted">
            =
          </span>
          <span>활동량</span>
          <span aria-hidden className="text-muted">
            ×
          </span>
          <span className="text-accent">배출계수</span>
        </p>

        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {SCOPES.map((entry) => (
            <li
              key={entry.scope}
              className="rounded-lg border border-border bg-background/60 p-3"
            >
              <Badge variant={entry.variant}>{entry.scope}</Badge>
              <p className="mt-2 text-sm font-medium text-foreground">
                {entry.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {entry.description}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
