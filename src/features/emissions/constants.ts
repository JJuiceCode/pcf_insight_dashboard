/**
 * 도메인 전역에서 재사용하는 식별자 상수.
 *
 * 평가용 dashboard는 단일 제품(CT-045)만 다루지만,
 * Step 12부터 데이터 소스를 두 가지로 분리하기 때문에 productId도 두 개로 나눈다.
 *
 * - `DEMO_PRODUCT_ID`     : 시드/폼 입력 기반 활동 (`/`에서 사용)
 * - `IMPORTED_PRODUCT_ID` : 운영자가 Excel로 업로드한 활동 (`/import`에서 사용)
 *
 * 같은 SQLite 테이블을 공유하지만 productId로 라우트별 데이터를 격리해,
 * `/import`에서 가져온 데이터가 `/`의 시드 데이터와 섞여 이중 집계되지 않게 한다.
 *
 * 배출계수(EmissionFactor)는 productId 개념이 없으므로 두 라우트가 동일한 계수 풀을 공유한다.
 */

export const DEMO_PRODUCT_ID = 'product-ct-045';
export const IMPORTED_PRODUCT_ID = 'product-ct-045-imported';

/** 두 productId 모두 같은 평가용 제품(CT-045)을 가리킨다는 사실을 라벨로 노출한다. */
export const PRODUCT_DISPLAY_CODE = 'CT-045';
