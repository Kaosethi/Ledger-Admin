import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/middleware";
import { JWTPayload } from "@/lib/auth/jwt";
import { logSuccess, logFailure, logAccessDenied } from "./logger";
import {
  AuditContext,
  AuditAction,
  AuditTargetType,
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from "./types";

/**
 * Extract IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const remoteAddr = request.headers.get("remote-addr");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return realIp || remoteAddr || "unknown";
}

/**
 * Create audit context from request and payload
 */
function createAuditContext(
  request: NextRequest,
  payload: JWTPayload
): AuditContext {
  return {
    adminId: payload.sub,
    adminEmail: payload.email,
    ipAddress: getClientIP(request),
    userAgent: request.headers.get("user-agent") || "unknown",
    httpMethod: request.method,
    endpoint: request.nextUrl.pathname,
  };
}

/**
 * Determine action type based on HTTP method and endpoint
 */
function determineAction(method: string, endpoint: string): AuditAction {
  const path = endpoint.toLowerCase();

  // Authentication endpoints
  if (path.includes("/auth/login")) return AUDIT_ACTIONS.LOGIN;
  if (path.includes("/auth/logout")) return AUDIT_ACTIONS.LOGOUT;
  if (path.includes("/auth/check")) return AUDIT_ACTIONS.AUTH_CHECK;

  // Account endpoints
  if (path.includes("/accounts")) {
    if (path.includes("/approve")) return AUDIT_ACTIONS.ACCOUNT_APPROVE;
    if (path.includes("/reject")) return AUDIT_ACTIONS.ACCOUNT_REJECT;
    if (path.includes("/suspend")) return AUDIT_ACTIONS.ACCOUNT_SUSPEND;
    if (path.includes("/reactivate")) return AUDIT_ACTIONS.ACCOUNT_REACTIVATE;
    if (path.includes("/bulk-update")) return AUDIT_ACTIONS.ACCOUNT_BULK_UPDATE;
    if (path.includes("/regenerate-qr"))
      return AUDIT_ACTIONS.ACCOUNT_REGENERATE_QR;
    if (path.includes("/balance-and-pin"))
      return AUDIT_ACTIONS.ACCOUNT_BALANCE_PIN_UPDATE;

    switch (method) {
      case "GET":
        return path.includes("/[id]")
          ? AUDIT_ACTIONS.ACCOUNT_VIEW
          : AUDIT_ACTIONS.ACCOUNT_LIST;
      case "POST":
        return AUDIT_ACTIONS.ACCOUNT_CREATE;
      case "PUT":
      case "PATCH":
        return AUDIT_ACTIONS.ACCOUNT_UPDATE;
    }
  }

  // Merchant endpoints
  if (path.includes("/merchants")) {
    if (path.includes("/approve")) return AUDIT_ACTIONS.MERCHANT_APPROVE;
    if (path.includes("/reject")) return AUDIT_ACTIONS.MERCHANT_REJECT;
    if (path.includes("/suspend")) return AUDIT_ACTIONS.MERCHANT_SUSPEND;
    if (path.includes("/reactive")) return AUDIT_ACTIONS.MERCHANT_REACTIVATE;

    switch (method) {
      case "GET":
        return path.includes("/[id]")
          ? AUDIT_ACTIONS.MERCHANT_VIEW
          : AUDIT_ACTIONS.MERCHANT_LIST;
      case "POST":
        return AUDIT_ACTIONS.MERCHANT_CREATE;
      case "PUT":
      case "PATCH":
        return AUDIT_ACTIONS.MERCHANT_UPDATE;
    }
  }

  // Administrator endpoints
  if (path.includes("/administrators")) {
    switch (method) {
      case "GET":
        return path.includes("/[id]")
          ? AUDIT_ACTIONS.ADMIN_VIEW
          : AUDIT_ACTIONS.ADMIN_LIST;
      case "POST":
        return AUDIT_ACTIONS.ADMIN_CREATE;
      case "PUT":
      case "PATCH":
        return AUDIT_ACTIONS.ADMIN_UPDATE;
      case "DELETE":
        return AUDIT_ACTIONS.ADMIN_DELETE;
    }
  }

  // Transaction endpoints
  if (path.includes("/transactions")) {
    switch (method) {
      case "GET":
        return path.includes("/[id]")
          ? AUDIT_ACTIONS.TRANSACTION_VIEW
          : AUDIT_ACTIONS.TRANSACTION_LIST;
      case "POST":
        return AUDIT_ACTIONS.TRANSACTION_CREATE;
      case "PUT":
      case "PATCH":
        return AUDIT_ACTIONS.TRANSACTION_UPDATE;
    }
  }

  // Registration endpoints
  if (path.includes("/registrations")) {
    if (path.includes("/approve")) return AUDIT_ACTIONS.REGISTRATION_APPROVE;
    if (path.includes("/reject")) return AUDIT_ACTIONS.REGISTRATION_REJECT;

    switch (method) {
      case "GET":
        return path.includes("/[id]")
          ? AUDIT_ACTIONS.REGISTRATION_VIEW
          : AUDIT_ACTIONS.REGISTRATION_LIST;
    }
  }

  // QR Sign endpoints
  if (path.includes("/qr-sign")) {
    return AUDIT_ACTIONS.QR_SIGN;
  }

  // Default fallback
  return `${method.toLowerCase()}_${path.replace(/\//g, "_")}` as AuditAction;
}

/**
 * Determine target type based on endpoint
 */
function determineTargetType(endpoint: string): AuditTargetType | undefined {
  const path = endpoint.toLowerCase();

  if (path.includes("/accounts")) return AUDIT_TARGET_TYPES.ACCOUNT;
  if (path.includes("/merchants")) return AUDIT_TARGET_TYPES.MERCHANT;
  if (path.includes("/administrators")) return AUDIT_TARGET_TYPES.ADMINISTRATOR;
  if (path.includes("/transactions")) return AUDIT_TARGET_TYPES.TRANSACTION;
  if (path.includes("/registrations")) return AUDIT_TARGET_TYPES.REGISTRATION;
  if (path.includes("/qr-sign")) return AUDIT_TARGET_TYPES.QR_CODE;
  if (path.includes("/auth")) return AUDIT_TARGET_TYPES.SYSTEM;

  return undefined;
}

/**
 * Extract target ID from URL path
 */
function extractTargetId(endpoint: string, context: any): string | undefined {
  // Try to get ID from route params first
  if (context?.params?.id) {
    return context.params.id;
  }

  // Try to extract ID from path
  const idMatch = endpoint.match(/\/([a-f0-9-]{36})\//);
  return idMatch ? idMatch[1] : undefined;
}

/**
 * Enhanced auth middleware with automatic audit logging
 */
export function withAuditLogging(
  handler: (
    request: NextRequest,
    context: any,
    payload: JWTPayload,
    auditContext: AuditContext
  ) => Promise<NextResponse>,
  options?: {
    skipAuditLog?: boolean;
    customAction?: AuditAction;
    customTargetType?: AuditTargetType;
    logRequestBody?: boolean;
  }
) {
  return async (request: NextRequest, context: any) => {
    const auth = await checkAuth(request);

    if (!auth.authenticated) {
      // Log access denied
      const basicContext: AuditContext = {
        adminId: undefined,
        adminEmail: "anonymous",
        ipAddress: getClientIP(request),
        userAgent: request.headers.get("user-agent") || "unknown",
        httpMethod: request.method,
        endpoint: request.nextUrl.pathname,
      };

      if (!options?.skipAuditLog) {
        await logAccessDenied(basicContext, "Authentication required");
      }

      return auth.response;
    }

    const auditContext = createAuditContext(request, auth.payload);

    // Don't log if explicitly skipped
    if (options?.skipAuditLog) {
      return handler(request, context, auth.payload, auditContext);
    }

    const action =
      options?.customAction ||
      determineAction(request.method, request.nextUrl.pathname);
    const targetType =
      options?.customTargetType ||
      determineTargetType(request.nextUrl.pathname);
    const targetId = extractTargetId(request.nextUrl.pathname, context);

    let requestBody: any = undefined;
    if (
      options?.logRequestBody &&
      (request.method === "POST" ||
        request.method === "PUT" ||
        request.method === "PATCH")
    ) {
      try {
        // Clone the request to read the body without consuming it
        const clonedRequest = request.clone();
        requestBody = await clonedRequest.json();
      } catch (error) {
        // Body might not be JSON or might be empty
        requestBody = undefined;
      }
    }

    try {
      const response = await handler(
        request,
        context,
        auth.payload,
        auditContext
      );

      // Log successful action
      const metadata: Record<string, any> = {
        responseStatus: response.status,
      };

      if (requestBody) {
        metadata.requestBody = requestBody;
      }

      await logSuccess(
        auditContext,
        action,
        targetType,
        targetId,
        `${action} completed successfully`,
        metadata
      );

      return response;
    } catch (error) {
      // Log failed action
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      const metadata: Record<string, any> = {
        error: errorMessage,
      };

      if (requestBody) {
        metadata.requestBody = requestBody;
      }

      await logFailure(
        auditContext,
        action,
        errorMessage,
        targetType,
        targetId,
        metadata
      );

      // Re-throw the error
      throw error;
    }
  };
}

/**
 * Backward compatible auth middleware (existing withAuth but with audit logging)
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: any,
    payload: JWTPayload
  ) => Promise<NextResponse>
) {
  return withAuditLogging(async (request, context, payload, auditContext) => {
    return handler(request, context, payload);
  });
}

/**
 * Utility function for manual audit logging within handlers
 */
export async function logManualAudit(
  auditContext: AuditContext,
  action: AuditAction,
  targetType?: AuditTargetType,
  targetId?: string,
  details?: string,
  metadata?: Record<string, any>
) {
  await logSuccess(
    auditContext,
    action,
    targetType,
    targetId,
    details,
    metadata
  );
}
