import { db } from "@/lib/db";
import { adminLogs } from "@/lib/db/schema";
import {
  AuditLogData,
  AuditContext,
  AuditAction,
  AuditTargetType,
} from "./types";

/**
 * Core audit logging function that writes to the database
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await db.insert(adminLogs).values({
      adminId: data.adminId || null,
      adminEmail: data.adminEmail,
      action: data.action,
      targetType: data.targetType || null,
      targetId: data.targetId || null,
      details: data.details || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    });
  } catch (error) {
    // Log the error but don't throw to avoid breaking the main functionality
    console.error("Failed to log audit event:", error);
    console.error("Audit data was:", JSON.stringify(data, null, 2));
  }
}

/**
 * Enhanced audit logger with additional metadata
 */
export async function logAuditEventWithMetadata(
  data: AuditLogData,
  metadata?: Record<string, any>
): Promise<void> {
  const details = data.details || "";
  const metadataString = metadata
    ? `\nMetadata: ${JSON.stringify(metadata)}`
    : "";

  await logAuditEvent({
    ...data,
    details: details + metadataString,
  });
}

/**
 * Log successful actions
 */
export async function logSuccess(
  context: AuditContext,
  action: AuditAction,
  targetType?: AuditTargetType,
  targetId?: string,
  details?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEventWithMetadata(
    {
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      action,
      targetType,
      targetId,
      details,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      httpMethod: context.httpMethod,
      endpoint: context.endpoint,
    },
    metadata
  );
}

/**
 * Log failed actions
 */
export async function logFailure(
  context: AuditContext,
  action: AuditAction,
  error: string,
  targetType?: AuditTargetType,
  targetId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEventWithMetadata(
    {
      adminId: context.adminId,
      adminEmail: context.adminEmail,
      action: `${action}_failed`,
      targetType,
      targetId,
      details: `Failed: ${error}`,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      httpMethod: context.httpMethod,
      endpoint: context.endpoint,
    },
    metadata
  );
}

/**
 * Log access denied events
 */
export async function logAccessDenied(
  context: AuditContext,
  reason: string,
  targetType?: AuditTargetType,
  targetId?: string
): Promise<void> {
  await logAuditEvent({
    adminId: context.adminId,
    adminEmail: context.adminEmail,
    action: "access_denied",
    targetType,
    targetId,
    details: `Access denied: ${reason}`,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    httpMethod: context.httpMethod,
    endpoint: context.endpoint,
  });
}

/**
 * Log data access events (for GDPR/compliance)
 */
export async function logDataAccess(
  context: AuditContext,
  dataType: string,
  recordIds: string[],
  accessType: "read" | "write" | "delete" = "read"
): Promise<void> {
  await logAuditEvent({
    adminId: context.adminId,
    adminEmail: context.adminEmail,
    action: `data_${accessType}`,
    targetType: dataType as AuditTargetType,
    targetId: recordIds.join(","),
    details: `${
      accessType.charAt(0).toUpperCase() + accessType.slice(1)
    } access to ${recordIds.length} ${dataType} record(s)`,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    httpMethod: context.httpMethod,
    endpoint: context.endpoint,
  });
}

/**
 * Log bulk operations
 */
export async function logBulkOperation(
  context: AuditContext,
  action: AuditAction,
  targetType: AuditTargetType,
  affectedIds: string[],
  details?: string
): Promise<void> {
  await logAuditEvent({
    adminId: context.adminId,
    adminEmail: context.adminEmail,
    action: `bulk_${action}`,
    targetType,
    targetId: affectedIds.join(","),
    details: `Bulk operation affecting ${affectedIds.length} records. ${
      details || ""
    }`,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    httpMethod: context.httpMethod,
    endpoint: context.endpoint,
  });
}
