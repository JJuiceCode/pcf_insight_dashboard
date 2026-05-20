import type { ReactNode } from 'react';
import { FormError } from './FormError';

/**
 * 입력 필드 공통 레이아웃 컴포넌트.
 *
 * 라벨, 입력 영역, 안내 문구를 묶어 표시하며,
 * 입력 상태나 데이터 처리에는 관여하지 않는다.
 *
 * 실제 입력 요소(`Input`, `Select`, `textarea` 등)는
 * `children`으로 전달해 구성한다.
 */
export interface TextFieldProps {
  label: string;
  htmlFor: string;

  /** 필수 입력 항목 표시(*)와 접근성 정보를 추가한다. */
  required?: boolean;

  /** 오류가 없을 때 표시할 안내 문구. */
  hint?: string;

  /** 오류 발생 시 안내 문구 대신 표시할 메시지. */
  error?: string;
  children: ReactNode;
}

export function TextField({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  children,
}: TextFieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 flex items-center gap-1 text-xs font-medium text-foreground"
      >
        <span>{label}</span>
        {required ? (
          <span aria-hidden className="text-accent" title="필수 입력">
            *
          </span>
        ) : null}
      </label>

      {children}

      {error ? (
        <FormError>{error}</FormError>
      ) : hint ? (
        <p className="mt-1 ml-1 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
