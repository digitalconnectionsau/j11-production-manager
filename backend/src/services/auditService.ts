import { db } from '../db/index.js';
import { auditLogs } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import type { Request } from 'express';

export interface AuditLogData {
  tableName: string;
  recordId: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  fieldName?: string; // For field-specific updates
  oldValue?: any;
  newValue?: any;
  userId?: number;
  userEmail?: string;
  req?: Request; // For extracting IP and user agent
}

/**
 * Log a data change for audit trail
 */
export const logAuditChange = async (data: AuditLogData): Promise<void> => {
  try {
    const {
      tableName,
      recordId,
      action,
      fieldName,
      oldValue,
      newValue,
      userId,
      userEmail,
      req
    } = data;

    // Extract IP address and user agent from request
    const ipAddress = req ? getClientIP(req) : null;
    const userAgent = req ? req.get('User-Agent') : null;

    await db.insert(auditLogs).values({
      tableName,
      recordId,
      action,
      fieldName: fieldName || null,
      oldValue: oldValue !== undefined ? JSON.stringify(oldValue) : null,
      newValue: newValue !== undefined ? JSON.stringify(newValue) : null,
      userId: userId || null,
      userEmail: userEmail || null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    });

    console.log(`Audit log created: ${action} on ${tableName}.${recordId}${fieldName ? `.${fieldName}` : ''} by user ${userId || 'unknown'}`);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main operation
  }
};

/**
 * Log multiple field changes for a single record update
 */
export const logAuditChanges = async (
  tableName: string,
  recordId: number,
  oldRecord: any,
  newRecord: any,
  userId?: number,
  userEmail?: string,
  req?: Request
): Promise<void> => {
  try {
    const changes: AuditLogData[] = [];

    // Compare old and new records to find changed fields
    const oldKeys = Object.keys(oldRecord || {});
    const newKeys = Object.keys(newRecord || {});
    const allKeys = [...new Set([...oldKeys, ...newKeys])];

    for (const key of allKeys) {
      const oldVal = oldRecord?.[key];
      const newVal = newRecord?.[key];

      // Skip timestamps and fields that haven't changed
      if (key === 'updatedAt' || key === 'createdAt') continue;
      if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;

      changes.push({
        tableName,
        recordId,
        action: 'UPDATE',
        fieldName: key,
        oldValue: oldVal,
        newValue: newVal,
        userId,
        userEmail,
        req
      });
    }

    // Log all changes
    for (const change of changes) {
      await logAuditChange(change);
    }
  } catch (error) {
    console.error('Failed to create audit logs for record changes:', error);
  }
};

/**
 * Log a record creation
 */
export const logRecordCreation = async (
  tableName: string,
  recordId: number,
  record: any,
  userId?: number,
  userEmail?: string,
  req?: Request
): Promise<void> => {
  await logAuditChange({
    tableName,
    recordId,
    action: 'INSERT',
    newValue: record,
    userId,
    userEmail,
    req
  });
};

/**
 * Log a record deletion
 */
export const logRecordDeletion = async (
  tableName: string,
  recordId: number,
  record: any,
  userId?: number,
  userEmail?: string,
  req?: Request
): Promise<void> => {
  await logAuditChange({
    tableName,
    recordId,
    action: 'DELETE',
    oldValue: record,
    userId,
    userEmail,
    req
  });
};

/**
 * Get client IP address from request, handling proxies
 */
function getClientIP(req: Request): string | null {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress ||
    req.get('x-forwarded-for')?.split(',')[0] ||
    req.get('x-real-ip') ||
    null
  );
}

/**
 * Get audit logs for a specific record
 */
export const getAuditLogsForRecord = async (
  tableName: string,
  recordId: number,
  limit: number = 50
) => {
  return await db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tableName, tableName),
        eq(auditLogs.recordId, recordId)
      )
    )
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit);
};

/**
 * Get recent audit logs for a user
 */
export const getAuditLogsForUser = async (
  userId: number,
  limit: number = 100
) => {
  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit);
};

/**
 * Get all recent audit logs (admin view)
 */
export const getRecentAuditLogs = async (limit: number = 200) => {
  return await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit);
};