import { PrismaClient } from '@prisma/client';
import { ENV } from './env.js';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function initPrisma(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || ENV.DATABASE_URL;
  if (!dbUrl) {
    console.warn(
      '⚠️ DATABASE_URL is not set in environment! Please add DATABASE_URL in Vercel Project Settings -> Environment Variables.'
    );
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: dbUrl || 'postgresql://unconfigured:unconfigured@localhost:5432/unconfigured',
      },
    },
    log: ENV.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

function getPrisma(): PrismaClient {
  if (!globalThis.prismaGlobal) {
    globalThis.prismaGlobal = initPrisma();
  }
  return globalThis.prismaGlobal;
}

// Proxy wrapper so Prisma is lazy-loaded on first database query rather than crashing module import
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: keyof PrismaClient) {
    const propName = String(prop);
    const dbUrl = process.env.DATABASE_URL || ENV.DATABASE_URL;
    if (!dbUrl && propName !== 'then' && propName !== 'catch') {
      throw new Error(
        'Database connection not configured: DATABASE_URL is missing in environment variables. Please add DATABASE_URL in Vercel Project Settings -> Environment Variables.'
      );
    }
    const client = getPrisma();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
