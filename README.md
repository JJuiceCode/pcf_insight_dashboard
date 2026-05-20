# PCF Insight Dashboard

HanaLoop 채용 과제 — Computer Monitor `CT-045`의 Product Carbon Footprint(PCF) 대시보드.

## Tech stack

- Next.js 16 (App Router) · TypeScript · Tailwind CSS v4
- Prisma 6 · PostgreSQL (배포) / SQLite (legacy local)
- xlsx (Excel 가져오기 파싱)

## Getting started (local dev)

```bash
yarn install
cp .env.example .env
# .env 파일을 열어 Supabase Postgres 연결 정보로 채운다.
yarn db:generate
yarn db:push           # 스키마를 Supabase로 적용
yarn db:seed           # EmissionFactor + 시드 ActivityRecord 적재
yarn dev
```

브라우저에서 `http://localhost:3000`에 접속하면 시드 기반 대시보드, `/import`에서 Excel 업로드 워크플로우를 사용할 수 있다.

## Deployment (Vercel + Supabase Postgres)

이 프로젝트는 이전에 로컬 SQLite(`file:./dev.db`)를 사용했지만, Vercel 배포 환경에서는 Supabase의 PostgreSQL 인스턴스에 연결한다.

Vercel 배포 절차:

1. Supabase 프로젝트의 connection string을 확인한다(대시보드 → **Project → Connect → Connection string**, URI 형식 권장).
2. Vercel 프로젝트의 **Settings → Environment Variables**에 다음을 등록한다.
   - `DATABASE_URL` — Supabase 5432 직결 URL(`postgresql://USER:PASSWORD@HOST:5432/postgres`). 단일 변수로 런타임 쿼리와 DDL을 모두 처리한다.
3. 스키마 적용과 시드는 **로컬에서 Supabase URL을 사용해 한 번 실행**한다(현재 셋업에는 Vercel build-step migration이 없다).

   ```bash
   DATABASE_URL="postgresql://..." yarn db:push
   DATABASE_URL="postgresql://..." yarn db:seed
   ```

4. Vercel에서 배포한다. `postinstall` 훅이 `prisma generate`를 자동으로 실행해 Prisma Client가 빌드된다.

### 환경변수 설정 시 주의

- `.env`는 gitignored이므로 실제 자격증명이 커밋되지 않도록 한다. 형식은 `.env.example`을 참고한다.
- 가장 단순한 설정은 `DATABASE_URL` 하나만 두는 것이다. 실제 트래픽이 많아 pgBouncer pooler를 분리하고 싶다면 `.env.example` 하단의 가이드대로 `DIRECT_URL`을 추가하고 `schema.prisma`의 `datasource` 블록에 `directUrl = env("DIRECT_URL")`을 다시 활성화한다.

## Useful scripts

| Script | 용도 |
| --- | --- |
| `yarn db:generate` | Prisma Client 생성 (Vercel `postinstall`이 자동 실행) |
| `yarn db:push` | schema.prisma → DB 반영 (migrations 폴더 없이 단방향 push) |
| `yarn db:seed` | EmissionFactor 4건 + 시드 ActivityRecord 30건 적재 |
| `yarn db:reset` | DB 비우고 시드까지 다시 적재 (로컬 전용) |
| `yarn dev` | 개발 서버 |
| `yarn build` / `yarn start` | 프로덕션 빌드 |
| `yarn lint` / `yarn format` | 정적 분석 / 포매팅 |
