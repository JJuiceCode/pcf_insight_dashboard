# PCF Insight Dashboard

HanaLoop 채용 과제 — Computer Monitor `CT-045`의 Product Carbon Footprint(PCF) 대시보드.

활동 데이터(전기 · 원소재 · 운송)에 버전 관리된 배출계수를 곱해 `kgCO2e`로 계산하고, GHG Scope · 활동 유형 · 월별 추이로 시각화한다.

---

# Demo

### Github

https://github.com/JJuiceCode/pcf_insight_dashboard.git

### Deployment

https://pcf-insight-dashboard.vercel.app/

---

## 1.시스템 살펴보기

이 프로젝트는 데모 데이터와 업로드 데이터를 분리하여 관리합니다.

| Route     | Data Source                              | Purpose                           |
| --------- | ---------------------------------------- | --------------------------------- |
| `/`       | Seed Data                                | DB 의존성 없는 기본 PCF Dashboard |
| `/import` | Imported ActivityRecord + EmissionFactor | 업로드된 Excel 기반 PCF Dashboard |

데모 데이터와 업로드 데이터를 분리해서 설계했습니다. `/`는 DB 없이도 바로 실행 가능한 환경이고, `/import`는 실제 업로드된 데이터를 기준으로 계산합니다. 대신 계산 파이프라인 자체는 동일하게 재사용해 데이터 소스만 교체되도록 구성했습니다.

```txt
Activity → EmissionFactor 매칭 → 배출량 계산 → GHG Scope 분류 → 집계 → 렌더링
```

---

## 2. 기술 스택

- **Next.js 16 (App Router)** · **TypeScript** · **React 19**
- **Tailwind CSS v4** (CSS-first config, `@theme inline`, `@custom-variant dark`)
- **next-themes** (라이트/다크 토글)
- **Pretendard** (한글 본문 폰트, dynamic-subset CDN)
- **Prisma 6** + **Supabase PostgreSQL** (배포) · 초기에는 SQLite로 시작했다가 Vercel 배포를 위해 마이그레이션
- **xlsx** (Excel 파싱)
- 외부 차트/컴포넌트 라이브러리 없음 — 막대 그래프도 Tailwind 유틸만으로 구현

---

## 3. 도메인 설계 핵심

### 3.1 Activity Data와 Emission Factor 분리

`ActivityRecord`와 `EmissionFactor`를 분리하여 설계했습니다.

이유:

- 활동 데이터는 "무슨 일이 발생했는지"를 기록
- 배출계수는 "어떻게 계산할지"를 정의
- 실제 탄소 시스템처럼 배출계수 변경 및 버전 관리가 가능하도록 구성

또한 배출계수를 찾지 못한 데이터는 계산에서 조용히 제외하지 않고 **"검토 필요" 상태로 표시**하도록 처리했습니다.

---

### 3.2 GHG Scope 분류

과제 데이터 기준 Scope를 다음과 같이 적용했습니다.

- `Electricity (한국전력)` → **Scope 2**
- `Material (플라스틱 1, 2)` → **Scope 3**
- `Transport (트럭)` → **Scope 3**
- `Scope 1` → 제공된 데이터 없음 → **0으로 처리**

실제 존재하지 않는 데이터를 임의 생성하지 않도록 했습니다.

---

### 3.3 Emission Calculation

모든 배출량 계산은 동일한 규칙을 사용합니다.

```
Emission (kgCO2e) = Activity Amount × Emission Factor
```

---

## 4. 아키텍처

도메인 로직과 UI 책임을 분리해 테스트·확장 가능한 구조로 가져갔다.

```
src
├─ app
│  ├─ /                    → Seed 기반 데모 Dashboard
│  ├─ /import              → Excel Import Dashboard
│  └─ /api                 → Import API
│
├─ features/emissions
│  ├─ types                → 도메인 타입
│  ├─ calculations         → PCF 계산 로직
│  ├─ formatters           → 표시 포맷
│  ├─ repositories         → DB 접근
│  ├─ services             → 비즈니스 로직
│  └─ mappers              → Excel 데이터 변환
│
├─ components
│  ├─ dashboard            → Dashboard 화면
│  ├─ import               → Excel 업로드 화면
│  ├─ layout               → 공통 Layout
│  └─ ui                   → 재사용 UI 컴포넌트
│
└─ lib
```

└ 구조 설계 원칙:

- 계산 로직은 React 컴포넌트 내부에서 처리하지 않음
- DB 접근은 Repository 계층으로 분리
- Service 계층에서 데이터 처리 및 계산 수행
- UI 컴포넌트는 화면 표시와 사용자 상호작용만 담당
- Seed 데이터와 Import 데이터는 분리하여 이중 집계를 방지

---

# Working Time

총 작업 시간: 약 24시간

| 작업                                   | 소요시간 |
| -------------------------------------- | -------: |
| 도메인 분석 및 이해                    |     6 Xh |
| 데이터 모델 설계                       |     2 Xh |
| Dashboard UI 및 사용자 인터페이스 구성 |     3 Xh |
| PCF 계산 로직 및 데이터 처리 구조      |     4 Xh |
| 입력/검증 및 데이터 관리 기능          |     2 Xh |
| Excel Import 및 DB 연동                |     5 Xh |
| 테마/UX 개선 및 안정화                 |     2 Xh |

## 작업 후기

**※ 가장 시간이 많이 소요된 작업 : 도메인 분석 및 이해**

이번 과제의 탄소 배출(PCF) 도메인은 처음 접하는 영역이었습니다.
기존에는 이커머스 중심의 데이터를 주로 다뤄왔기 때문에,
활동 데이터 → 배출계수 → GHG Scope → PCF 집계 흐름을 처음에는 바로 이해하기 어려웠습니다.

구현을 시작하기 전에 충분한 Q&A를 통해 도메인을 먼저 이해하는 과정에 시간을 가장 많이 투자했습니다.
이 과정에서 요구사항과 데이터를 하나씩 정리했고, 이후에는 더 명확한 Prompt와 구조적인 작업 흐름으로 연결할 수 있었습니다.

특히 "이해하지 못한 상태에서 구현하지 않는다"는 개인적인 작업 방식을 다시 한 번 중요하게 느낄 수 있었습니다.

**※ 난생 처음해 본 작업 : Excel Import 및 DB 연동**

Excel 파일을 직접 파싱하고 DB와 연결하여 데이터 흐름을 구성한 경험은 이번이 처음이었습니다.
단순 업로드 기능이 아니라 흐름 전체를 구현해야 했기 때문에 예상보다 많은 고민이 필요했습니다.

AI 도구를 활용했지만 단순 코드 생성에 의존하지 않고,
데이터 구조와 동작 흐름을 먼저 이해한 뒤 Prompt를 작성하고 결과를 검토 및 수정하는 방식으로 진행했습니다.

그 과정에서 AI를 활용하는 것 자체보다,
"무엇을 요청해야 하는지 정의하는 능력"이 더 중요하다는 점을 느꼈습니다.

---

# 포인트 Workflow

## 1.Excel Import

과제 제공 Excel 파일을 별도 수정 없이 그대로 업로드할 수 있도록 구현했습니다.

▶주요 설계 내용:

- 여러 시트 중 활동 데이터가 포함된 시트를 자동 탐색
- 첫 번째 행을 고정 헤더로 가정하지 않고 동적으로 탐색
- 활동 데이터만 가져오고 배출계수 영역은 제외
- 새 Excel 업로드 시 기존 가져오기 데이터를 교체(Replace Import)
- EmissionFactor는 별도 DB에서 관리
- 가져온 데이터 삭제 시 Dashboard도 함께 초기화

가져오기 완료 후에는 업로드된 데이터를 기반으로 **PCF Dashboard가 즉시 재계산되어 표시**됩니다.

---

## 2.UI & Design System

일관된 UI와 라이트/다크 모드 대응을 위해 시맨틱 디자인 토큰 기반 구조를 적용했습니다.

```
bg-background  text-foreground  text-muted
bg-surface     border-border
bg-accent      bg-accent-soft   text-accent
border-accent/20   ring-accent/30
```

▶주요 적용 내용:

- CSS 변수 기반 색상 시스템 구성
- 단일 클래스만으로 라이트/다크 모드 자동 대응
- 공통 UI 컴포넌트(Card, Badge, Button 등) 재사용
- Accent 색상을 활용한 KPI 및 주요 액션 강조
- Pretendard 폰트 적용
- Theme Toggle 지원

### ActivityTable Verification

운영자가 계산 결과를 쉽게 검증할 수 있도록 ActivityTable을 구성했습니다.

▶주요 기능:

\- 기간, 활동 유형, Scope, 설명 기준 필터링
\- PCF, 날짜, 활동량 기준 정렬
\- 모바일 환경 가로 스크롤 지원
\- 현재 적용 중인 배출계수 정보를 함께 표시하여 계산 근거 확인 가능

---

# AI 도구 사용 안내

본 프로젝트는 AI 코딩 도구를 적극적으로 활용했습니다. (제 작업 스타일이기도 합니다.)

생성된 코드를 그대로 사용하는 방식이 아닌 **도메인 이해 → 작업 분리 → Prompt 설계 → 코드 검토 및 수정** 과정으로 진행했습니다.

단, 모든 생성된 코드는 직접 읽고 이해한 뒤 검증한 후 commit하는 원칙을 가지고 있습니다.

바로 Agent에게 단순히 '이거이거 만들어줘' 라고 요구하지 않습니다.

1. 🤖가 탄소 배출 도메인을 정확하게 이해할 수 있도록 많은 Q&A를 합니다. (제가 먼저 이해하는게 필수)
2. 구현 전 요구사항 및 데이터 흐름 정리
3. 큰 기능 단위를 작은 Step으로 분리
4. 각 조각들 좋은 prompt를 작성하고 가장 중요한건 각 조각들 사이가 연계되게 만든다. (그래야 code flow가 자연스럽러워진다)
5. prompt 요청 후 🤖response에 대한 결과물을 문제없이 실행되는지 확인 후 각 코드들에 대한 리뷰 및 검증을 한다.
6. 모든 과정들을 세세히 노션에 D/B 형태로 잘 저장해둔다. (나중에 롤백시, 문제가 생길시 대비, 스터디시 필요)

🔗[이번 과제 진행하면서 AI 관련 내용을 정리한 노션 페이지 바로가기](https://kimjuhwan.notion.site/Process-364a2cfb90c580f6bb64f51bfde7e7db?pvs=73)

> 참조 : 엑셀 업로드 기능 구현 부터는 시간이 없어서 🤖코드 리뷰 및 검증을 진행하지 못한 상태

### 1.사용한 도구

- **Cursor IDE + Claude (Sonnet/Opus 계열)** — 코드 생성, 리팩터링 제안, 디버깅 협업, 문서화
- **GitHub Copilot 보조** — 짧은 자동 완성

> 외부 컴포넌트 라이브러리(MUI · shadcn 등)는 사용하지 않았다. UI 코드는 모두 직접 작성하거나 AI 생성 결과를 검수해 채택한 것이다.

###

### 2.AI 활용 원칙

- 생성된 코드를 그대로 커밋하지 않는다.
- 모든 변경 사항은 직접 검토 및 수정 후 반영한다.
- 도메인 규칙과 아키텍처 규칙은 Prompt에 명시한다.
- 비즈니스 로직과 UI 책임 분리를 유지한다.

# 로컬 개발

```bash
yarn install

# 환경변수 준비
cp .env.example .env
# Windows PowerShell:
# Copy-Item .env.example .env

# .env 파일을 열어 Supabase Postgres 연결 정보를 채운다.
yarn db:generate      # Prisma Client 생성 (postinstall로도 자동 수행)
yarn db:push          # 스키마를 Supabase로 적용
yarn db:seed          # EmissionFactor만 적재 (ActivityRecord는 시드하지 않음)
yarn dev
```

- `http://localhost:3000` — 시드 기반 데모 대시보드 (DB 무관하게 항상 동일하게 동작)
- `http://localhost:3000/import` — Excel 업로드 워크플로우

### 1.useful scripts

| 스크립트           | 설명                                                        |
| ------------------ | ----------------------------------------------------------- |
| `yarn dev`         | Next.js 개발 서버                                           |
| `yarn build`       | 프로덕션 빌드                                               |
| `yarn lint`        | ESLint                                                      |
| `yarn format`      | Prettier 일괄 포맷                                          |
| `yarn db:generate` | Prisma Client 재생성                                        |
| `yarn db:push`     | Prisma 스키마를 DB로 push (migration 폴더를 두지 않는 방식) |
| `yarn db:seed`     | EmissionFactor 시드                                         |
| `yarn db:reset`    | `db push --force-reset` + `db:seed` (DB 초기화)             |

### 2.Vercel 배포 메모

- Vercel 환경 변수에 `DATABASE_URL`만 채워도 동작한다.
- pgBouncer를 함께 쓰려면 `.env.example`의 안내에 따라 `DIRECT_URL`을 별도로 추가하고 `prisma/schema.prisma`의 `directUrl`을 활성화한다.
- `postinstall: prisma generate`가 Vercel 빌드 시 Prisma Client를 자동으로 생성한다.

---

# commit 히스토리 한 눈에 보기

`①~⑮`는 과제의 핵심 마일스톤, `ETC`는 사이에 끼어든 셋업·개선·디버깅 작업이다.

| 커밋 제목                                                                     | 커밋 설명                                                               |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `[Setting] chore(init): setup Next.js project`                                | Next.js · TypeScript · Tailwind 기본 프로젝트 셋업                      |
| `[Setting] chore(config): add AGENTS.md project rules`                        | AGENTS.md · 도메인 규칙 · UI 규칙 정의                                  |
| `① feat(emissions): add domain types and seed data`                           | PCF 도메인 타입과 초기 시드 데이터 구조 구성                            |
| `② feat(emissions): add emission calculation and formatting utilities`        | PCF 배출량 계산 로직, 표시 포맷터, 코드 스타일 설정 추가                |
| `③ feat(layout): add responsive dashboard shell layout`                       | 반응형 대시보드 레이아웃 및 기본 UI 구조 추가                           |
| `ETC chore: add prettier code format & yarn set`                              | Prettier · Tailwind 플러그인 · yarn 표준화                              |
| `④ feat(ui): add shared dashboard UI components`                              | 공통 대시보드 UI 컴포넌트 및 재사용 구조 구성                           |
| `⑤ feat(dashboard): implement core dashboard sections`                        | 배출 데이터 기반 핵심 대시보드 화면 및 집계 구조 구현                   |
| `⑥ feat(dashboard): add activity verification table`                          | 활동 데이터 검증 및 배출 계산 결과 테이블 구현                          |
| `⑦ feat(emissions): add activity input form and validation logic`             | 사용자 활동 입력, 검증, 실시간 배출량 계산 기능 구현                    |
| `⑧ refactor(dashboard): improve dashboard flow and clean up structure`        | 대시보드 계산 흐름 통합 및 구조 개선                                    |
| `ETC feat(forms): add reusable DateInput and replace ActivityForm date field` | 재사용 가능한 날짜 입력 컴포넌트 추가 및 ActivityForm 날짜 입력 개선    |
| `⑨ feat(management): add versioned emission factor database model`            | 버전 관리 기반 배출계수 DB 구조 및 계산 아키텍처 구현                   |
| `ETC feat(ui): display active emission factors in activity dashboard`         | 현재 적용 중인 배출계수 표시 기능 구현                                  |
| `ETC feat(ui): add filtering to ActivityTable`                                | 활동 데이터 테이블 필터 기능 추가                                       |
| `ETC feat(ui): add sorting to ActivityTable`                                  | 활동 데이터 테이블 정렬 기능 추가                                       |
| `⑩ feat(excel): Excel upload interface`                                       | 엑셀 업로드 및 데이터 가져오기 화면 구성                                |
| `⑪-A feat(excel): add Excel parsing and database import flow`                 | 엑셀 데이터 파싱 및 DB 가져오기 기능 구현                               |
| `⑪-B refactor(excel): improve Excel import workflow`                          | 다중 시트 탐색 · 동적 헤더 인식 · 활동 블록 한정 파싱 등 처리 구조 개선 |
| `⑫ feat(excel): connect Excel upload UI to import API`                        | 엑셀 업로드 UI와 데이터 가져오기 API 연동                               |
| `⑬ feat(excel): recalculate dashboard from imported DB data`                  | 가져온 데이터 기반 대시보드 자동 재계산 및 화면 연동                    |
| `⑭ feat(excel): reset existing data on new Excel upload`                      | 새 엑셀 업로드 시 replace-import 전략으로 기존 데이터 교체              |
| `⑮ feat(excel): add Excel data delete action`                                 | 가져온 엑셀 데이터 삭제(DELETE 엔드포인트) 및 상태 관리 기능 추가       |
| `ETC chore(database): migrate from local DB to external database`             | SQLite → Supabase PostgreSQL 마이그레이션 (Vercel 배포 준비)            |
| `ETC fix(dashboard): ensure main dashboard uses seed data independently`      | `/` 페이지 in-memory seed로 통합해 DB 의존성 제거                       |
| `ETC fix(import): delete DB records when clearing Excel data`                 | 엑셀 삭제 시 DB ActivityRecord 동기화 (imported productId만 삭제)       |
| `ETC fix(theme): add light/dark mode and Pretendard font`                     | next-themes 동적 테마 전환 및 Pretendard 폰트 적용                      |
| `ETC refactor(ui): migrate colors to semantic theme tokens`                   | UI 색상 시스템을 시맨틱 테마 토큰 구조로 일괄 전환                      |
