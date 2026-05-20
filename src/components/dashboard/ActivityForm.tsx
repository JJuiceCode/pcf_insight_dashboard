'use client';

import {
  useId,
  useMemo,
  useState,
  type SubmitEvent,
  type ReactNode,
} from 'react';
import { Button } from '@/components/ui/Button';
import { DateInput } from '@/components/ui/DateInput';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import {
  formatKgCO2e,
  formatNumber,
  formatScopeLabel,
} from '@/features/emissions/formatters';
import type {
  ActivityRecord,
  ActivityType,
  EmissionFactor,
} from '@/features/emissions/types';
import {
  emptyActivityFormDraft,
  validateActivityForm,
  type ActivityFormDraft,
  type ActivityFormField,
} from '@/features/emissions/validation';
import { cn } from '@/lib/utils';

/**
 * 활동 데이터 입력 폼.
 *
 * 폼 상태는 이 컴포넌트 내부에서 관리하고,
 * 입력 검증은 `validateActivityForm`에서 처리한다.
 *
 * 배출계수 매칭과 실시간 배출량 미리보기는
 * 동일한 검증 결과를 기반으로 계산해
 * 화면에 보이는 값과 실제 저장 값이 항상 같도록 유지한다.
 *
 * 폼 리셋은 호스트(`ActivityInputPanel`)가 `key`를 증가시켜
 * 컴포넌트를 다시 마운트하는 방식으로 수행한다.
 */
export interface ActivityFormProps {
  emissionFactors: readonly EmissionFactor[];
  productId: string;
  onSubmit: (record: ActivityRecord) => void;
  onCancel: () => void;
}

const ACTIVITY_TYPE_OPTIONS: ReadonlyArray<{
  value: ActivityType;
  label: string;
}> = [
  { value: 'electricity', label: '전기' },
  { value: 'material', label: '원소재' },
  { value: 'transport', label: '운송' },
];

function generateActivityId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `activity-${crypto.randomUUID()}`;
  }
  return `activity-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function todayIsoDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function createInitialDraft(): ActivityFormDraft {
  return { ...emptyActivityFormDraft(), date: todayIsoDate() };
}

export function ActivityForm({
  emissionFactors,
  productId,
  onSubmit,
  onCancel,
}: ActivityFormProps) {
  const [draft, setDraft] = useState<ActivityFormDraft>(createInitialDraft);
  const [touched, setTouched] = useState<
    Partial<Record<ActivityFormField, boolean>>
  >({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  // 사용자가 빠르게 더블 클릭해도 동일한 레코드가 두 번 추가되지 않게 한다.
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validation = useMemo(
    () => validateActivityForm(draft, emissionFactors),
    [draft, emissionFactors],
  );

  const descriptionOptions = useMemo(() => {
    if (!draft.activityType) return [] as readonly EmissionFactor[];
    return emissionFactors.filter(
      (factor) => factor.activityType === draft.activityType,
    );
  }, [draft.activityType, emissionFactors]);

  const shouldShowError = (field: ActivityFormField): boolean =>
    Boolean((touched[field] || hasAttemptedSubmit) && validation.errors[field]);

  const markTouched = (field: ActivityFormField) => (): void =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleActivityTypeChange = (rawValue: string): void => {
    const nextType: ActivityType | '' =
      rawValue === 'electricity' ||
      rawValue === 'material' ||
      rawValue === 'transport'
        ? rawValue
        : '';
    setDraft((prev) => ({
      ...prev,
      activityType: nextType,
      // 활동 유형 변경 시 이전 설명 값을 초기화해 잘못된 매칭을 방지한다.
      description: '',
    }));
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setHasAttemptedSubmit(true);

    if (
      isSubmitting ||
      !validation.isValid ||
      validation.parsedAmount === null ||
      !validation.matchedFactor ||
      !validation.unit ||
      !draft.activityType
    ) {
      return;
    }

    setIsSubmitting(true);
    const record: ActivityRecord = {
      id: generateActivityId(),
      productId,
      date: draft.date,
      activityType: draft.activityType,
      description: draft.description,
      amount: validation.parsedAmount,
      unit: validation.unit,
    };
    onSubmit(record);
    // 부모가 패널을 닫고 다음 오픈 시 새 키로 폼을 다시 마운트하므로
    // 별도 로컬 리셋이 필요 없다. isSubmitting은 마운트 해제와 함께 사라진다.
  };

  const dateId = useId();
  const typeId = useId();
  const descriptionId = useId();
  const amountId = useId();
  const unitId = useId();

  const isSubmitDisabled = !validation.isValid || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col" noValidate>
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
        <DateInput
          id={dateId}
          label="날짜"
          required
          value={draft.date}
          onChange={(nextValue) =>
            setDraft((prev) => ({ ...prev, date: nextValue }))
          }
          onBlur={markTouched('date')}
          invalid={shouldShowError('date')}
          errorMessage={shouldShowError('date') ? validation.errors.date : null}
          hint="활동 날짜를 선택하거나 직접 입력해 주세요. (형식: YYYY-MM-DD)"
        />

        <TextField
          label="활동 유형"
          htmlFor={typeId}
          required
          error={
            shouldShowError('activityType')
              ? validation.errors.activityType
              : undefined
          }
        >
          <Select
            id={typeId}
            value={draft.activityType}
            onChange={(e) => handleActivityTypeChange(e.target.value)}
            onBlur={markTouched('activityType')}
            hasError={shouldShowError('activityType')}
          >
            <option value="" disabled>
              활동 유형을 선택해 주세요.
            </option>
            {ACTIVITY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </TextField>

        <TextField
          label="설명"
          htmlFor={descriptionId}
          required
          hint={
            !draft.activityType
              ? '활동 유형을 선택해 사용 가능한 항목을 확인하세요.'
              : undefined
          }
          error={
            shouldShowError('description')
              ? validation.errors.description
              : undefined
          }
        >
          <Select
            id={descriptionId}
            value={draft.description}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, description: e.target.value }))
            }
            onBlur={markTouched('description')}
            disabled={!draft.activityType}
            hasError={shouldShowError('description')}
          >
            <option value="" disabled>
              {draft.activityType
                ? '설명을 선택해 주세요.'
                : '활동 유형을 먼저 선택해 주세요.'}
            </option>
            {descriptionOptions.map((factor) => (
              <option key={factor.id} value={factor.name}>
                {factor.name}
              </option>
            ))}
          </Select>
        </TextField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
          <TextField
            label="수량"
            htmlFor={amountId}
            required
            error={
              shouldShowError('amount') ? validation.errors.amount : undefined
            }
          >
            <Input
              id={amountId}
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={draft.amount}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, amount: e.target.value }))
              }
              onBlur={markTouched('amount')}
              hasError={shouldShowError('amount')}
              placeholder="0"
            />
          </TextField>

          <TextField label="단위" htmlFor={unitId} hint="자동 설정됩니다.">
            <Input
              id={unitId}
              type="text"
              value={validation.unit ?? ''}
              readOnly
              tabIndex={-1}
              placeholder="—"
              className="bg-background text-foreground/80"
            />
          </TextField>
        </div>

        <FactorPreview
          matchedFactor={validation.matchedFactor}
          previewEmissionKgCO2e={validation.previewEmissionKgCO2e}
          hasSelectionStarted={
            Boolean(draft.activityType) && Boolean(draft.description)
          }
        />
      </div>

      <footer className="flex items-center justify-end gap-2 border-t border-border bg-background/60 px-5 py-4 sm:px-6">
        <Button
          variant="ghost"
          onClick={onCancel}
          type="button"
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button variant="primary" type="submit" disabled={isSubmitDisabled}>
          {isSubmitting ? '저장 중…' : '활동 추가'}
        </Button>
      </footer>
    </form>
  );
}

type PreviewTone = 'neutral' | 'accent' | 'warning';

const PREVIEW_TONE_CLASSES: Record<PreviewTone, string> = {
  neutral: 'border-border bg-background/60',
  accent: 'border-accent/20 bg-accent-soft',
  // amber tones intentionally kept: warning state must remain visually
  // distinct from the accent panel in both themes.
  warning:
    'border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20',
};

function FactorPreview({
  matchedFactor,
  previewEmissionKgCO2e,
  hasSelectionStarted,
}: {
  matchedFactor: EmissionFactor | undefined;
  previewEmissionKgCO2e: number | null;
  hasSelectionStarted: boolean;
}) {
  if (!hasSelectionStarted) {
    return (
      <PreviewShell tone="neutral">
        <p className="text-sm text-muted">
          활동 유형과 설명을 선택하면 매칭된 배출계수와 예상 배출량(kgCO2e)을
          미리 확인할 수 있습니다.
        </p>
      </PreviewShell>
    );
  }

  if (!matchedFactor) {
    return (
      <PreviewShell tone="warning">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
          선택한 활동에 대한 배출계수를 찾을 수 없습니다.
        </p>
        <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/80">
          배출계수 목록을 확인해 주세요.
        </p>
      </PreviewShell>
    );
  }

  return (
    <PreviewShell tone="accent">
      <dl className="space-y-2 text-sm">
        <PreviewRow label="매칭된 배출계수">
          <span className="font-medium text-foreground">
            {matchedFactor.name}
          </span>
          <span className="mx-1.5 text-muted">·</span>
          <span className="tabular-nums">
            {formatNumber(matchedFactor.factor)} {matchedFactor.factorUnit}
          </span>
          <span className="mx-1.5 text-muted">·</span>
          <span>{formatScopeLabel(matchedFactor.scope)}</span>
        </PreviewRow>

        <PreviewRow label="배출계수 버전">
          <span className="text-foreground/80 tabular-nums">
            {matchedFactor.version}
          </span>
        </PreviewRow>

        <PreviewRow label="계산된 배출량">
          {previewEmissionKgCO2e !== null ? (
            <span className="font-semibold text-accent tabular-nums">
              {formatKgCO2e(previewEmissionKgCO2e)}
            </span>
          ) : (
            <span className="text-muted">
              수량을 입력하면 예상 배출량을 미리 확인할 수 있습니다.
            </span>
          )}
        </PreviewRow>
      </dl>
    </PreviewShell>
  );
}

function PreviewShell({
  tone,
  children,
}: {
  tone: PreviewTone;
  children: ReactNode;
}) {
  return (
    <section
      aria-label="배출계수 미리보기"
      className={cn('rounded-lg border p-4', PREVIEW_TONE_CLASSES[tone])}
    >
      <p className="mb-2 text-[11px] font-medium tracking-wider text-muted uppercase">
        배출계수 미리보기
      </p>
      {children}
    </section>
  );
}

function PreviewRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <dt className="text-xs tracking-wider text-muted uppercase">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}
