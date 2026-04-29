import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function buildConnectionString(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url);
    // Remove sslmode from URL — ssl is handled via the Pool ssl option below
    // to avoid pg deprecation warning about sslmode=require semantics
    u.searchParams.delete('sslmode');
    if (!u.searchParams.has('connect_timeout')) {
      u.searchParams.set('connect_timeout', '30');
    }
    return u.toString();
  } catch {
    return url;
  }
}

function createPrismaClient() {
  const pool = new Pool({
    connectionString: buildConnectionString(process.env.DATABASE_URL),
    ssl: { rejectUnauthorized: true },
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
