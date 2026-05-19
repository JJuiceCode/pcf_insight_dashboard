import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client 싱글턴.
 *
 * Next.js 개발 서버의 HMR이 모듈을 다시 불러올 때마다 새 인스턴스가
 * 만들어지지 않도록 `globalThis`에 캐시한다. 프로덕션에서는 항상 새 인스턴스를
 * 만든다(서버 인스턴스 단위로만 살아 있음).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
