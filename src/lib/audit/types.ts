export interface AuditLogData {
  adminId?: string;
  adminEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  httpMethod?: string;
  endpoint?: string;
  requestBody?: any;
  responseStatus?: number;
  metadata?: Record<string, any>;
}

export interface AuditContext {
  adminId?: string;
  adminEmail: string;
  ipAddress?: string;
  userAgent?: string;
  httpMethod: string;
  endpoint: string;
}

// Predefined action types for consistency
export const AUDIT_ACTIONS = {
  // Authentication actions
  LOGIN: "login",
  LOGOUT: "logout",
  AUTH_CHECK: "auth_check",

  // Account actions
  ACCOUNT_CREATE: "account_create",
  ACCOUNT_UPDATE: "account_update",
  ACCOUNT_VIEW: "account_view",
  ACCOUNT_LIST: "account_list",
  ACCOUNT_APPROVE: "account_approve",
  ACCOUNT_REJECT: "account_reject",
  ACCOUNT_SUSPEND: "account_suspend",
  ACCOUNT_REACTIVATE: "account_reactivate",
  ACCOUNT_BULK_UPDATE: "account_bulk_update",
  ACCOUNT_REGENERATE_QR: "account_regenerate_qr",
  ACCOUNT_BALANCE_PIN_UPDATE: "account_balance_pin_update",

  // Merchant actions
  MERCHANT_CREATE: "merchant_create",
  MERCHANT_UPDATE: "merchant_update",
  MERCHANT_VIEW: "merchant_view",
  MERCHANT_LIST: "merchant_list",
  MERCHANT_APPROVE: "merchant_approve",
  MERCHANT_REJECT: "merchant_reject",
  MERCHANT_SUSPEND: "merchant_suspend",
  MERCHANT_REACTIVATE: "merchant_reactivate",

  // Administrator actions
  ADMIN_CREATE: "admin_create",
  ADMIN_UPDATE: "admin_update",
  ADMIN_VIEW: "admin_view",
  ADMIN_LIST: "admin_list",
  ADMIN_DELETE: "admin_delete",

  // Transaction actions
  TRANSACTION_CREATE: "transaction_create",
  TRANSACTION_UPDATE: "transaction_update",
  TRANSACTION_VIEW: "transaction_view",
  TRANSACTION_LIST: "transaction_list",

  // Registration actions
  REGISTRATION_VIEW: "registration_view",
  REGISTRATION_LIST: "registration_list",
  REGISTRATION_APPROVE: "registration_approve",
  REGISTRATION_REJECT: "registration_reject",

  // QR Sign actions
  QR_SIGN: "qr_sign",

  // System actions
  SYSTEM_ERROR: "system_error",
  SYSTEM_ACCESS_DENIED: "system_access_denied",
} as const;

// Target types for audit logs
export const AUDIT_TARGET_TYPES = {
  ACCOUNT: "account",
  MERCHANT: "merchant",
  ADMINISTRATOR: "administrator",
  TRANSACTION: "transaction",
  REGISTRATION: "registration",
  SYSTEM: "system",
  QR_CODE: "qr_code",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
export type AuditTargetType =
  (typeof AUDIT_TARGET_TYPES)[keyof typeof AUDIT_TARGET_TYPES];
