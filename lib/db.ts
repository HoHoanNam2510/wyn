import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function withConnectTimeout(url: string | undefined): string | undefined {
  if (!url || url.includes('connect_timeout')) return url;
  return url + (url.includes('?') ? '&' : '?') + 'connect_timeout=30';
}

function createPrismaClient() {
  const pool = new Pool({
    connectionString: withConnectTimeout(process.env.DATABASE_URL),
    max: 3,
    connectionTimeoutMillis: 30_000,
    idleTimeoutMillis: 30_000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
