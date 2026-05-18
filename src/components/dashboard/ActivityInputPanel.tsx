'use client';

import { useEffect, useId } from 'react';

import { ActivityForm, type NewActivityInput } from './ActivityForm';
import type { EmissionFactor } from '@/features/emissions/types';
import { cn } from '@/lib/utils';

export interface ActivityInputPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: NewActivityInput) => void;
  emissionFactors: readonly EmissionFactor[];
}

/**
 * Slide-over panel chrome.
 *
 *  - Backdrop dims the dashboard but keeps it visible behind the
 *    panel on desktop. Clicking the backdrop or pressing Escape
 *    closes the panel.
 *  - Body scroll is locked while the panel is open so the underlying
 *    dashboard does not scroll alongside it.
 *  - The panel is always mounted so CSS transitions can animate the
 *    slide on both open and close. Form state is reset by
 *    `ActivityForm` after each successful submission.
 */
export function ActivityInputPanel({
  isOpen,
  onClose,
  onSubmit,
  emissionFactors,
}: ActivityInputPanelProps) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  const handleSubmit = (input: NewActivityInput): void => {
    onSubmit(input);
    onClose();
  };

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm transition-opacity duration-200 dark:bg-neutral-950/60',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-neutral-950',
          'sm:max-w-md',
          isOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full',
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-orange-600 dark:text-orange-400">
              New record
            </p>
            <h2
              id={titleId}
              className="mt-1 text-base font-semibold text-neutral-900 dark:text-neutral-50"
            >
              Add activity record
            </h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              The matched emission factor and resulting kgCO2e are previewed
              live as you type.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M5 5l10 10M15 5l-10 10" />
            </svg>
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <ActivityForm
            emissionFactors={emissionFactors}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </>
  );
}
