# Audit Logging System

This document describes the comprehensive audit logging system implemented for admin activities in the ledger application.

## Overview

The audit logging system provides:

- Automatic logging of all admin API activities
- Detailed tracking of CRUD operations
- Status change logging with before/after values
- IP address and user agent tracking
- Error and access denied logging
- Compliance-ready audit trails

## Database Schema

The audit logs are stored in the `admin_logs` table with the following fields:

```sql
admin_logs (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_id UUID REFERENCES administrators(id),
  admin_email TEXT NOT NULL REFERENCES administrators(email),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## Usage

### 1. Basic Middleware Usage

Replace existing `withAuth` middleware with `withAuditLogging` for automatic logging:

```typescript
import { withAuditLogging } from "@/lib/audit";

export const GET = withAuditLogging(
  async (
    request: NextRequest,
    context: any,
    payload: JWTPayload,
    auditContext
  ) => {
    // Your handler code here
    // Audit logging happens automatically
  }
);
```

### 2. Backward Compatibility

For minimal changes, you can still use `withAuth` which now includes audit logging:

```typescript
import { withAuth } from "@/lib/audit";

export const GET = withAuth(
  async (request: NextRequest, context: any, payload: JWTPayload) => {
    // Your existing code - audit logging happens automatically
  }
);
```

### 3. Manual Audit Logging

For custom logging within handlers:

```typescript
import { logManualAudit, AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from "@/lib/audit";

export const POST = withAuditLogging(
  async (
    request: NextRequest,
    context: any,
    payload: JWTPayload,
    auditContext
  ) => {
    // Custom business logic

    // Manual audit log
    await logManualAudit(
      auditContext,
      AUDIT_ACTIONS.ACCOUNT_CREATE,
      AUDIT_TARGET_TYPES.ACCOUNT,
      newAccountId,
      "Account created with custom validation"
    );
  }
);
```

### 4. Using Helper Functions

For common operations, use the provided helpers:

```typescript
import { logAccountStatusChange } from "@/lib/audit";

// In your handler
await logAccountStatusChange(
  auditContext,
  accountId,
  "Pending", // from status
  "Active", // to status
  "Approved by admin after verification"
);
```

## Available Helpers

### Status Changes

```typescript
// Account status changes
await logAccountStatusChange(auditContext, accountId, fromStatus, toStatus, reason?);

// Merchant status changes
await logMerchantStatusChange(auditContext, merchantId, fromStatus, toStatus, reason?);
```

### Data Operations

```typescript
// Data exports
await logDataExport(auditContext, "accounts", 150, "CSV", filters);

// Sensitive data access
await logSensitiveDataAccess(
  auditContext,
  "pin",
  recordId,
  "Password reset request"
);

// Search operations
await logSearchOperation(
  auditContext,
  "accounts",
  searchTerms,
  resultCount,
  filters
);
```

### Financial Operations

```typescript
// Financial adjustments
await logFinancialOperation(
  auditContext,
  "balance_adjustment",
  accountId,
  "100.00",
  "Error correction",
  "supervisor@example.com"
);
```

### Bulk Operations

```typescript
// Bulk operations with results
await logBulkOperationWithResults(
  auditContext,
  "approve",
  "accounts",
  100, // total
  95, // success
  5, // failures
  ["ID not found", "Invalid status"] // error details
);
```

## Automatic Action Detection

The middleware automatically detects actions based on HTTP method and endpoint:

| Endpoint Pattern              | Method | Detected Action    |
| ----------------------------- | ------ | ------------------ |
| `/api/accounts`               | GET    | `account_list`     |
| `/api/accounts/[id]`          | GET    | `account_view`     |
| `/api/accounts`               | POST   | `account_create`   |
| `/api/accounts/[id]/approve`  | PATCH  | `account_approve`  |
| `/api/merchants/[id]/suspend` | PATCH  | `merchant_suspend` |
| `/api/auth/login`             | POST   | `login`            |

## Target Type Detection

Target types are automatically determined:

| Endpoint Contains | Target Type     |
| ----------------- | --------------- |
| `/accounts`       | `account`       |
| `/merchants`      | `merchant`      |
| `/administrators` | `administrator` |
| `/transactions`   | `transaction`   |
| `/auth`           | `system`        |

## Logged Endpoints (Excluding merchant-app)

### Authentication

- `/api/auth/login` - User login
- `/api/auth/logout` - User logout
- `/api/auth/check` - Token validation

### Accounts

- `/api/accounts` - List/Create accounts
- `/api/accounts/[id]` - View/Update account
- `/api/accounts/[id]/approve` - Approve account
- `/api/accounts/[id]/reject` - Reject account
- `/api/accounts/[id]/suspend` - Suspend account
- `/api/accounts/[id]/reactivate` - Reactivate account
- `/api/accounts/[id]/regenerate-qr` - Regenerate QR code
- `/api/accounts/[id]/balance-and-pin` - Update balance/PIN
- `/api/accounts/bulk-update` - Bulk account operations

### Merchants

- `/api/merchants` - List/Create merchants
- `/api/merchants/[id]` - View/Update merchant
- `/api/merchants/[id]/approve` - Approve merchant
- `/api/merchants/[id]/reject` - Reject merchant
- `/api/merchants/[id]/suspend` - Suspend merchant
- `/api/merchants/[id]/reactive` - Reactivate merchant

### Administrators

- `/api/administrators` - List/Create administrators
- `/api/administrators/[id]` - View/Update/Delete administrator

### Transactions

- `/api/transactions` - List/Create transactions
- `/api/transactions/[id]` - View/Update transaction

### Registrations

- `/api/registrations/pending` - View pending registrations

### Other

- `/api/qr-sign` - QR code signing operations

## Advanced Configuration

### Custom Action Names

```typescript
export const PATCH = withAuditLogging(
  async (request, context, payload, auditContext) => {
    // Handler code
  },
  {
    customAction: AUDIT_ACTIONS.MERCHANT_APPROVE,
    customTargetType: AUDIT_TARGET_TYPES.MERCHANT,
    logRequestBody: true, // Include request body in audit log
  }
);
```

### Skipping Audit Logs

```typescript
export const GET = withAuditLogging(
  async (request, context, payload, auditContext) => {
    // Handler code - no audit log will be created
  },
  { skipAuditLog: true }
);
```

## Compliance Features

### GDPR Compliance

- Search operations are logged with truncated search terms
- Sensitive data access is specially flagged
- Personal data access is tracked separately

### Financial Compliance

- All financial operations require explicit logging
- Balance adjustments include authorization trails
- Transaction modifications are fully auditable

### Security Features

- Failed authentication attempts are logged
- Access denied events are tracked
- IP addresses and user agents are captured
- All errors are logged for security analysis

## Best Practices

1. **Use helpers when available** - They provide consistent formatting and required metadata
2. **Include reasoning** - Always provide details about why an action was taken
3. **Log sensitive operations explicitly** - Use `logSensitiveDataAccess` for PII/financial data
4. **Bulk operations** - Use bulk logging helpers for better performance and reporting
5. **Custom actions** - Define clear, consistent action names for business-specific operations

## Monitoring and Alerts

The audit logs can be monitored for:

- Unusual activity patterns
- Failed authentication attempts
- Bulk operations
- Sensitive data access
- Administrative changes

## Migration Guide

To migrate existing endpoints:

1. Replace `import { withAuth } from '@/lib/auth/middleware'` with `import { withAuth } from '@/lib/audit'`
2. Add audit context parameter if using `withAuditLogging`
3. Add specific logging for important operations using helpers
4. Test that audit logs are being created correctly

## Examples

See the updated `/api/accounts/[id]/approve/route.ts` for a complete example of the new audit logging system in action.
