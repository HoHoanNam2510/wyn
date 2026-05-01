import { db } from '@/lib/db';
import type { Prisma } from '@/app/generated/prisma/client';

interface AuditLogParams {
  adminEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonObject;
}

export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  await db.auditLog.create({
    data: {
      adminEmail: params.adminEmail,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      metadata: params.metadata ?? undefined,
    },
  });
}
