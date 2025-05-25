import { AuditContext, AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "./types";
import { logSuccess, logDataAccess, logBulkOperation } from "./logger";

/**
 * Helper for logging account status changes
 */
export async function logAccountStatusChange(
  auditContext: AuditContext,
  accountId: string,
  fromStatus: string,
  toStatus: string,
  reason?: string
) {
  const action =
    toStatus === "Active"
      ? AUDIT_ACTIONS.ACCOUNT_APPROVE
      : toStatus === "Suspended"
      ? AUDIT_ACTIONS.ACCOUNT_SUSPEND
      : toStatus === "Inactive"
      ? AUDIT_ACTIONS.ACCOUNT_REJECT
      : AUDIT_ACTIONS.ACCOUNT_UPDATE;

  await logSuccess(
    auditContext,
    action,
    AUDIT_TARGET_TYPES.ACCOUNT,
    accountId,
    `Account status changed from ${fromStatus} to ${toStatus}${
      reason ? `. Reason: ${reason}` : ""
    }`,
    { fromStatus, toStatus, reason }
  );
}

/**
 * Helper for logging merchant status changes
 */
export async function logMerchantStatusChange(
  auditContext: AuditContext,
  merchantId: string,
  fromStatus: string,
  toStatus: string,
  reason?: string
) {
  const action =
    toStatus === "active"
      ? AUDIT_ACTIONS.MERCHANT_APPROVE
      : toStatus === "suspended"
      ? AUDIT_ACTIONS.MERCHANT_SUSPEND
      : toStatus === "rejected"
      ? AUDIT_ACTIONS.MERCHANT_REJECT
      : AUDIT_ACTIONS.MERCHANT_UPDATE;

  await logSuccess(
    auditContext,
    action,
    AUDIT_TARGET_TYPES.MERCHANT,
    merchantId,
    `Merchant status changed from ${fromStatus} to ${toStatus}${
      reason ? `. Reason: ${reason}` : ""
    }`,
    { fromStatus, toStatus, reason }
  );
}

/**
 * Helper for logging data exports
 */
export async function logDataExport(
  auditContext: AuditContext,
  dataType: string,
  recordCount: number,
  exportFormat: string,
  filters?: Record<string, any>
) {
  await logSuccess(
    auditContext,
    `export_${dataType}` as any,
    dataType as any,
    undefined,
    `Exported ${recordCount} ${dataType} records in ${exportFormat} format`,
    { recordCount, exportFormat, filters }
  );
}

/**
 * Helper for logging sensitive data access
 */
export async function logSensitiveDataAccess(
  auditContext: AuditContext,
  dataType: "pin" | "password" | "financial" | "pii",
  recordId: string,
  accessReason: string
) {
  await logDataAccess(
    auditContext,
    `sensitive_${dataType}`,
    [recordId],
    "read"
  );

  await logSuccess(
    auditContext,
    "sensitive_data_access" as any,
    "system" as any,
    recordId,
    `Accessed sensitive ${dataType} data. Reason: ${accessReason}`,
    { dataType, accessReason }
  );
}

/**
 * Helper for logging financial operations
 */
export async function logFinancialOperation(
  auditContext: AuditContext,
  operation: "balance_adjustment" | "transaction_reversal" | "fee_waiver",
  accountId: string,
  amount: string,
  reason: string,
  authorizer?: string
) {
  await logSuccess(
    auditContext,
    `financial_${operation}` as any,
    AUDIT_TARGET_TYPES.ACCOUNT,
    accountId,
    `${operation.replace("_", " ")} of ${amount} performed. Reason: ${reason}${
      authorizer ? `. Authorized by: ${authorizer}` : ""
    }`,
    { operation, amount, reason, authorizer }
  );
}

/**
 * Helper for logging bulk operations with detailed results
 */
export async function logBulkOperationWithResults(
  auditContext: AuditContext,
  operation: string,
  targetType: string,
  totalRecords: number,
  successCount: number,
  failureCount: number,
  errors?: string[]
) {
  await logBulkOperation(
    auditContext,
    operation as any,
    targetType as any,
    [], // We don't have specific IDs for bulk operations
    `Bulk ${operation}: ${successCount}/${totalRecords} successful, ${failureCount} failed`
  );

  if (errors && errors.length > 0) {
    await logSuccess(
      auditContext,
      `bulk_${operation}_errors` as any,
      targetType as any,
      undefined,
      `Bulk operation errors: ${errors.join("; ")}`,
      { totalRecords, successCount, failureCount, errors: errors.slice(0, 10) } // Limit errors in metadata
    );
  }
}

/**
 * Helper for logging configuration changes
 */
export async function logConfigurationChange(
  auditContext: AuditContext,
  configKey: string,
  oldValue: any,
  newValue: any,
  reason?: string
) {
  await logSuccess(
    auditContext,
    "configuration_change" as any,
    AUDIT_TARGET_TYPES.SYSTEM,
    configKey,
    `Configuration '${configKey}' changed${
      reason ? `. Reason: ${reason}` : ""
    }`,
    { configKey, oldValue, newValue, reason }
  );
}

/**
 * Helper for logging search operations (for privacy compliance)
 */
export async function logSearchOperation(
  auditContext: AuditContext,
  searchType: string,
  searchTerms: string,
  resultCount: number,
  filters?: Record<string, any>
) {
  // Hash or truncate sensitive search terms for privacy
  const safeSearchTerms =
    searchTerms.length > 50
      ? searchTerms.substring(0, 47) + "..."
      : searchTerms;

  await logSuccess(
    auditContext,
    `search_${searchType}` as any,
    searchType as any,
    undefined,
    `Searched ${searchType} with terms: "${safeSearchTerms}", found ${resultCount} results`,
    { searchType, resultCount, filters, searchTermsLength: searchTerms.length }
  );
}

/**
 * Helper for logging report generation
 */
export async function logReportGeneration(
  auditContext: AuditContext,
  reportType: string,
  parameters: Record<string, any>,
  recordCount: number,
  format: string = "PDF"
) {
  await logSuccess(
    auditContext,
    `generate_report` as any,
    "system" as any,
    reportType,
    `Generated ${reportType} report with ${recordCount} records in ${format} format`,
    { reportType, parameters, recordCount, format }
  );
}
