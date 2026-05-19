'use client';

import { useCallback, useState } from 'react';
import { ExcelUploadCard } from './ExcelUploadCard';
import { FilePreview } from './FilePreview';

/**
 * Import 페이지의 클라이언트 셸.
 *
 * 선택된 파일 상태와 검증 에러 메시지를 보관해
 * `ExcelUploadCard`와 `FilePreview`가 같은 진실 소스를 바라보게 한다.
 *
 * 이 단계에서는 파일을 메모리에만 들고 있을 뿐, 파싱·업로드·DB 저장은 수행하지 않는다.
 * 다음 단계(Excel 파싱)부터 여기서 핸들러를 확장하면 된다.
 */
export function ImportClient() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = useCallback((file: File) => {
    setErrorMessage(null);
    setSelectedFile(file);
  }, []);

  const handleInvalidFile = useCallback((reason: string) => {
    setSelectedFile(null);
    setErrorMessage(reason);
  }, []);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setErrorMessage(null);
  }, []);

  return (
    <div className="space-y-5">
      <ExcelUploadCard
        selectedFileName={selectedFile?.name ?? null}
        onFileSelected={handleFileSelected}
        onInvalidFile={handleInvalidFile}
        errorMessage={errorMessage}
      />
      <FilePreview file={selectedFile} onClear={handleClear} />
    </div>
  );
}
