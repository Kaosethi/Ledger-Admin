// Main logging functions
export {
  logAuditEvent,
  logAuditEventWithMetadata,
  logSuccess,
  logFailure,
  logAccessDenied,
  logDataAccess,
  logBulkOperation,
} from "./logger";

// Middleware functions
export { withAuditLogging, withAuth, logManualAudit } from "./middleware";

// Types and constants
export type {
  AuditLogData,
  AuditContext,
  AuditAction,
  AuditTargetType,
} from "./types";

export { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "./types";

// Helper functions
export {
  logAccountStatusChange,
  logMerchantStatusChange,
  logDataExport,
  logSensitiveDataAccess,
  logFinancialOperation,
  logBulkOperationWithResults,
  logConfigurationChange,
  logSearchOperation,
  logReportGeneration,
} from "./helpers";
