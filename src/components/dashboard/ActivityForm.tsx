'use client';

import { useId, useMemo, useState, type FormEvent } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DateInput } from '@/components/ui/DateInput';
import { FormError } from '@/components/ui/FormError';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  calculateActivityEmission,
  getDescriptionOptionsByActivityType,
} from '@/features/emissions/calculations';
import {
  formatActivityTypeLabel,
  formatKgCO2e,
  formatNumber,
  formatScopeLabel,
} from '@/features/emissions/formatters';
import type {
  ActivityRecord,
  ActivityType,
  CalculatedEmissionRow,
  EmissionFactor,
} from '@/features/emissions/types';
import { UNIT_BY_ACTIVITY_TYPE } from '@/features/emissions/types';

/**
 * Operator-facing form for capturing a single activity record.
 *
 * Responsibilities:
 *  - Drive controlled form state (no react-hook-form / zod).
 *  - Run lightweight client-side validation derived from the same
 *    domain rules used by the calculation utilities.
 *  - Mirror the live emission calculation using the existing
 *    `calculateActivityEmission()` helper — the form never inlines
 *    new emission math, it just displays what the domain layer
 *    would compute on submission.
 */

const ACTIVITY_TYPE_OPTIONS: ReadonlyArray<{
  value: ActivityType;
  label: string;
}> = [
  { value: 'electricity', label: formatActivityTypeLabel('electricity') },
  { value: 'material', label: formatActivityTypeLabel('material') },
  { value: 'transport', label: formatActivityTypeLabel('transport') },
];

interface FormState {
  date: string;
  activityType: ActivityType | '';
  description: string;
  amount: string;
}

const INITIAL_STATE: FormState = {
  date: '',
  activityType: '',
  description: '',
  amount: '',
};

type FieldName = keyof FormState;
type FormErrors = Partial<Record<FieldName, string>>;

export type NewActivityInput = Omit<ActivityRecord, 'id'>;

export interface ActivityFormProps {
  emissionFactors: readonly EmissionFactor[];
  onSubmit: (input: NewActivityInput) => void;
  onCancel?: () => void;
}

export function ActivityForm({
  emissionFactors,
  onSubmit,
  onCancel,
}: ActivityFormProps) {
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    date: false,
    activityType: false,
    description: false,
    amount: false,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const dateId = useId();
  const typeId = useId();
  const descId = useId();
  const amountId = useId();

  // Description options derive from the emission factor catalog so
  // the form can only offer factor names that will actually match.
  // New factors automatically show up here.
  const descriptionOptionsByType = useMemo(
    () => getDescriptionOptionsByActivityType(emissionFactors),
    [emissionFactors],
  );

  const descriptionOptions = state.activityType
    ? descriptionOptionsByType[state.activityType]
    : [];

  const amountNumber = parseFloat(state.amount);
  const hasValidAmount =
    state.amount !== '' && Number.isFinite(amountNumber) && amountNumber > 0;

  const errors = useMemo<FormErrors>(() => {
    const next: FormErrors = {};

    if (!state.date) {
      next.date = 'Please select a date.';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(state.date)) {
      next.date = 'Date must be a valid calendar date.';
    }

    if (!state.activityType) {
      next.activityType = 'Please select an activity type.';
    }

    if (!state.description) {
      next.description = 'Please select a description.';
    } else if (
      state.activityType &&
      !descriptionOptionsByType[state.activityType].includes(state.description)
    ) {
      next.description = 'Description does not match an emission factor.';
    }

    if (state.amount === '') {
      next.amount = 'Please enter an amount.';
    } else if (!Number.isFinite(amountNumber)) {
      next.amount = 'Amount must be a number.';
    } else if (amountNumber <= 0) {
      next.amount = 'Amount must be greater than 0.';
    }

    return next;
  }, [state, amountNumber, descriptionOptionsByType]);

  const hasErrors = Object.keys(errors).length > 0;

  // Build a preview ActivityRecord and reuse the domain calculator so
  // operators see exactly the same number the dashboard will compute
  // on submission.
  const preview = useMemo<CalculatedEmissionRow | null>(() => {
    if (!state.activityType || !state.description || !hasValidAmount) {
      return null;
    }
    return calculateActivityEmission(
      {
        id: 'preview',
        productId: 'product-ct-045',
        date: state.date || '0000-00-00',
        activityType: state.activityType,
        description: state.description,
        amount: amountNumber,
        unit: UNIT_BY_ACTIVITY_TYPE[state.activityType],
      },
      emissionFactors,
    );
  }, [state, hasValidAmount, amountNumber, emissionFactors]);

  const showError = (field: FieldName): boolean =>
    (touched[field] || submitAttempted) && Boolean(errors[field]);

  const handleBlur = (field: FieldName) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleActivityTypeChange = (next: ActivityType | '') => {
    setState((prev) => ({
      ...prev,
      activityType: next,
      // Description options depend on activity type, so reset to avoid
      // a stale "material" description sticking after switching to
      // "transport".
      description: '',
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setTouched({
      date: true,
      activityType: true,
      description: true,
      amount: true,
    });
    if (hasErrors || !state.activityType) return;

    onSubmit({
      productId: 'product-ct-045',
      date: state.date,
      activityType: state.activityType,
      description: state.description,
      amount: amountNumber,
      unit: UNIT_BY_ACTIVITY_TYPE[state.activityType],
    });

    setState(INITIAL_STATE);
    setTouched({
      date: false,
      activityType: false,
      description: false,
      amount: false,
    });
    setSubmitAttempted(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex h-full min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <DateInput
          id={dateId}
          label="Date"
          required
          value={state.date}
          invalid={showError('date')}
          errorMessage={showError('date') ? errors.date : null}
          hint="Select year, month, and day."
          onChange={(value) =>
            setState((prev) => ({ ...prev, date: value }))
          }
          onBlur={handleBlur('date')}
        />

        <div>
          <FieldLabel htmlFor={typeId} required>
            Activity type
          </FieldLabel>
          <Select
            id={typeId}
            value={state.activityType}
            onChange={(e) =>
              handleActivityTypeChange(e.target.value as ActivityType | '')
            }
            onBlur={handleBlur('activityType')}
            invalid={showError('activityType')}
          >
            <option value="" disabled>
              Select an activity type…
            </option>
            {ACTIVITY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <FormError>
            {showError('activityType') ? errors.activityType : null}
          </FormError>
        </div>

        <div>
          <FieldLabel htmlFor={descId} required>
            Description
          </FieldLabel>
          <Select
            id={descId}
            value={state.description}
            disabled={!state.activityType}
            onChange={(e) =>
              setState((prev) => ({ ...prev, description: e.target.value }))
            }
            onBlur={handleBlur('description')}
            invalid={showError('description')}
          >
            <option value="" disabled>
              {state.activityType
                ? 'Select a description…'
                : 'Select an activity type first'}
            </option>
            {descriptionOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
          <FormError>
            {showError('description') ? errors.description : null}
          </FormError>
          {!showError('description') && state.activityType ? (
            <HelperText>
              Constrained by available emission factors.
            </HelperText>
          ) : null}
        </div>

        <div className="grid grid-cols-[1fr_120px] gap-3">
          <div>
            <FieldLabel htmlFor={amountId} required>
              Amount
            </FieldLabel>
            <Input
              id={amountId}
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              placeholder="0"
              value={state.amount}
              onChange={(e) =>
                setState((prev) => ({ ...prev, amount: e.target.value }))
              }
              onBlur={handleBlur('amount')}
              invalid={showError('amount')}
            />
            <FormError>{showError('amount') ? errors.amount : null}</FormError>
          </div>
          <div>
            <FieldLabel>Unit</FieldLabel>
            <Input
              readOnly
              tabIndex={-1}
              value={
                state.activityType
                  ? UNIT_BY_ACTIVITY_TYPE[state.activityType]
                  : ''
              }
              placeholder="—"
            />
            <HelperText>Derived from type.</HelperText>
          </div>
        </div>

        <FactorPreview preview={preview} />
      </div>

      <footer className="flex items-center justify-end gap-2 border-t border-neutral-200 bg-white px-5 py-3 dark:border-neutral-800 dark:bg-neutral-950">
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          disabled={submitAttempted && hasErrors}
          aria-disabled={hasErrors || undefined}
        >
          Add activity
        </Button>
      </footer>
    </form>
  );
}

function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300"
    >
      {children}
      {required ? (
        <span aria-hidden className="text-orange-500 dark:text-orange-400">
          *
        </span>
      ) : null}
    </label>
  );
}

function HelperText({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
      {children}
    </p>
  );
}

function FactorPreview({
  preview,
}: {
  preview: CalculatedEmissionRow | null;
}) {
  if (!preview) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/60 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
        <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Calculation preview
        </p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Fill in activity type, description, and amount to preview the matched
          emission factor and calculated kgCO2e.
        </p>
      </div>
    );
  }

  if (!preview.isValid || !preview.emissionFactor || !preview.scope) {
    return (
      <div
        role="status"
        className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30"
      >
        <p className="text-[11px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-300">
          No emission factor found
        </p>
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
          {preview.errorMessage ??
            'This activity could not be matched to any emission factor.'}
        </p>
      </div>
    );
  }

  const { emissionFactor, scope, emissionKgCO2e } = preview;

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-900/60 dark:bg-orange-950/30">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-orange-700 dark:text-orange-300">
          Calculation preview
        </p>
        <Badge variant="accent">{formatScopeLabel(scope)}</Badge>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <PreviewRow label="Matched factor">
          <span className="font-medium text-neutral-900 dark:text-neutral-50">
            {emissionFactor.name}
          </span>
        </PreviewRow>
        <PreviewRow label="Factor value">
          <span className="tabular-nums text-neutral-900 dark:text-neutral-50">
            {formatNumber(emissionFactor.factor)}{' '}
            <span className="text-neutral-500 dark:text-neutral-400">
              {emissionFactor.factorUnit}
            </span>
          </span>
        </PreviewRow>
        <PreviewRow label="Version">
          <span className="font-mono text-xs text-neutral-700 dark:text-neutral-200">
            {emissionFactor.version}
          </span>
        </PreviewRow>
        <PreviewRow label="Effective from">
          <span className="font-mono text-xs text-neutral-700 dark:text-neutral-200">
            {emissionFactor.effectiveFrom}
          </span>
        </PreviewRow>
      </dl>

      <div className="mt-4 flex items-baseline justify-between gap-3 rounded-md border border-orange-200 bg-white px-3 py-2 dark:border-orange-900/60 dark:bg-neutral-950">
        <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Calculated emission
        </span>
        <span className="text-base font-semibold tabular-nums text-orange-700 dark:text-orange-300">
          {formatKgCO2e(emissionKgCO2e)}
        </span>
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
        {label}
      </dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
