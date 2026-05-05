import { db } from '@/lib/db';

export async function recordApiUsage(service: string, userId: string) {
  try {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    await db.apiUsageDaily.upsert({
      where: { date_service_userId: { date, service, userId } },
      create: { date, service, userId, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch {
    // fire-and-forget — never break user request
  }
}
