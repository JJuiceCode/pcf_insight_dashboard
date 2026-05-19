'use client';

import { useEffect } from 'react';
import { ActivityForm } from '@/components/dashboard/ActivityForm';
import type {
  ActivityRecord,
  EmissionFactor,
} from '@/features/emissions/types';
import { cn } from '@/lib/utils';

/**
 * 활동 데이터 입력을 위한 우측 슬라이드 패널.
 *
 * `isOpen` 상태로 표시 여부를 제어하며,
 * 열림·닫힘 애니메이션이 자연스럽게 동작하도록 항상 마운트 상태를 유지한다.
 *
 * 배경 영역 클릭과 `Esc` 입력으로 패널을 닫을 수 있으며,
 * 모바일에서는 전체 화면, 큰 화면에서는 입력에 적합한 너비를 사용한다.
 */
export interface ActivityInputPanelProps {
  isOpen: boolean;
  /** 패널을 열 때마다 증가시켜 폼을 새로 마운트한다. */
  formKey: number;
  onClose: () => void;
  onSubmit: (record: ActivityRecord) => void;
  emissionFactors: readonly EmissionFactor[];
  productId: string;
}

export function ActivityInputPanel({
  isOpen,
  formKey,
  onClose,
  onSubmit,
  emissionFactors,
  productId,
}: ActivityInputPanelProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 패널이 열려 있는 동안 페이지 스크롤을 막는다.
  // 모바일에서 뒤쪽 대시보드가 함께 움직이지 않도록 한다.
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label="Close activity input"
        tabIndex={-1}
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 cursor-default bg-neutral-900/40 backdrop-blur-sm transition-opacity duration-200 dark:bg-black/60',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-panel-title"
        aria-hidden={!isOpen}
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out sm:max-w-lg dark:bg-neutral-900',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4 sm:px-6 dark:border-neutral-800">
          <div>
            <p className="text-[11px] font-medium tracking-wider text-orange-600 uppercase dark:text-orange-400">
              New record
            </p>
            <h2
              id="activity-panel-title"
              className="mt-1 text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-50"
            >
              활동 데이터 추가
            </h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              매칭된 배출계수와 예상 배출량을 제출 전에 미리 확인할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 inline-flex h-8 w-8 items-center justify-center rounded-md text-lg leading-none text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
          >
            <span aria-hidden>×</span>
          </button>
        </header>

        <ActivityForm
          key={formKey}
          emissionFactors={emissionFactors}
          productId={productId}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </aside>
    </>
  );
}
