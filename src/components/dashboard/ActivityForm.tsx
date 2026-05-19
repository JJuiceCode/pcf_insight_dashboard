'use client';

import {
  useId,
  useMemo,
  useState,
  type ReactNode,
  type SubmitEvent,
} from 'react';
import { Button } from '@/components/ui/Button';
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
      !validation.isValid ||
      validation.parsedAmount === null ||
      !validation.matchedFactor ||
      !validation.unit ||
      !draft.activityType
    ) {
      return;
    }
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
  };

  const dateId = useId();
  const typeId = useId();
  const descriptionId = useId();
  const amountId = useId();
  const unitId = useId();

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
        <TextField
          label="날짜"
          htmlFor={dateId}
          required
          error={shouldShowError('date') ? validation.errors.date : undefined}
        >
          <Input
            id={dateId}
            type="date"
            value={draft.date}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, date: e.target.value }))
            }
            onBlur={markTouched('date')}
            hasError={shouldShowError('date')}
          />
        </TextField>

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
              활동 유형을 선택해주세요.
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
                ? '설명을 선택해주세요.'
                : '활동 유형을 선택해주세요.'}
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
              className="bg-neutral-50 text-neutral-700 dark:bg-neutral-950 dark:text-neutral-300"
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

      <footer className="flex items-center justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-5 py-4 sm:px-6 dark:border-neutral-800 dark:bg-neutral-950/40">
        <Button variant="ghost" onClick={onCancel} type="button">
          취소
        </Button>
        <Button variant="primary" type="submit">
          활동 추가
        </Button>
      </footer>
    </form>
  );
}

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
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
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
          배출계수 목록을 확인해 주세요
        </p>
      </PreviewShell>
    );
  }

  return (
    <PreviewShell tone="accent">
      <dl className="space-y-2 text-sm">
        <PreviewRow label="매칭된 배출계수">
          <span className="font-medium text-neutral-900 dark:text-neutral-50">
            {matchedFactor.name}
          </span>
          <span className="mx-1.5 text-neutral-400 dark:text-neutral-500">
            ·
          </span>
          <span className="tabular-nums">
            {formatNumber(matchedFactor.factor)} {matchedFactor.factorUnit}
          </span>
          <span className="mx-1.5 text-neutral-400 dark:text-neutral-500">
            ·
          </span>
          <span>{formatScopeLabel(matchedFactor.scope)}</span>
        </PreviewRow>

        <PreviewRow label="배출계수 버전">
          <span className="text-neutral-600 tabular-nums dark:text-neutral-300">
            {matchedFactor.version}
          </span>
        </PreviewRow>

        <PreviewRow label="계산된 배출량">
          {previewEmissionKgCO2e !== null ? (
            <span className="font-semibold text-orange-700 tabular-nums dark:text-orange-300">
              {formatKgCO2e(previewEmissionKgCO2e)}
            </span>
          ) : (
            <span className="text-neutral-500 dark:text-neutral-400">
              수량을 입력하면 예상 배출량을 미리 확인할 수 있습니다.
            </span>
          )}
        </PreviewRow>
      </dl>
    </PreviewShell>
  );
}

type PreviewTone = 'neutral' | 'accent' | 'warning';
interface PreviewShellProps {
  tone: PreviewTone;
  children: ReactNode;
}

function PreviewShell({ tone, children }: PreviewShellProps) {
  const TONE_CLASSES: Record<typeof tone, string> = {
    neutral:
      'border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950/40',
    accent:
      'border-orange-200 bg-orange-50/70 dark:border-orange-900/60 dark:bg-orange-950/20',
    warning:
      'border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20',
  };

  return (
    <section
      aria-label="Factor preview"
      className={cn('rounded-lg border p-4', TONE_CLASSES[tone])}
    >
      <p className="mb-2 text-[11px] font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
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
      <dt className="text-xs tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}
