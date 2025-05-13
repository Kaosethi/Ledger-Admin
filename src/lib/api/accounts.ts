// src/lib/api/accounts.ts
// API utilities for account operations

// Define return types for API responses
export interface ApproveResponse {
  id: string;
  status: string;
  [key: string]: any; // Allow other fields
}

export interface RejectResponse {
  id: string;
  status: string;
  [key: string]: any; // Allow other fields
}

export interface BulkApproveResult {
  approved: ApproveResponse[];
  failed: { id: string; error: string }[];
}

export interface BulkRejectResult {
  rejected: RejectResponse[];
  failed: { id: string; error: string }[];
}

/**
 * Approves a pending registration by calling the approve endpoint
 */
export const approveAccount = async (
  accountId: string
): Promise<ApproveResponse> => {
  const response = await fetch(`/api/accounts/${accountId}/approve`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to approve account: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Rejects a pending registration by calling the reject endpoint
 */
export const rejectAccount = async (
  accountId: string
): Promise<RejectResponse> => {
  const response = await fetch(`/api/accounts/${accountId}/reject`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to reject account: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Bulk approves multiple pending registrations
 */
export const bulkApproveAccounts = async (
  accountIds: string[]
): Promise<BulkApproveResult> => {
  if (!accountIds.length) return { approved: [], failed: [] };

  // Process approvals in parallel for better performance
  const results = await Promise.allSettled(
    accountIds.map((id) => approveAccount(id))
  );

  // Extract successful approvals and error information
  const approved = results
    .filter(
      (result): result is PromiseFulfilledResult<ApproveResponse> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);

  const failed = results
    .filter(
      (result): result is PromiseRejectedResult => result.status === "rejected"
    )
    .map((result, index) => ({
      id: accountIds[index],
      error:
        (result as PromiseRejectedResult).reason.message || "Unknown error",
    }));

  return { approved, failed };
};

/**
 * Bulk rejects multiple pending registrations
 */
export const bulkRejectAccounts = async (
  accountIds: string[]
): Promise<BulkRejectResult> => {
  if (!accountIds.length) return { rejected: [], failed: [] };

  // Process rejections in parallel for better performance
  const results = await Promise.allSettled(
    accountIds.map((id) => rejectAccount(id))
  );

  // Extract successful rejections and error information
  const rejected = results
    .filter(
      (result): result is PromiseFulfilledResult<RejectResponse> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);

  const failed = results
    .filter(
      (result): result is PromiseRejectedResult => result.status === "rejected"
    )
    .map((result, index) => ({
      id: accountIds[index],
      error:
        (result as PromiseRejectedResult).reason.message || "Unknown error",
    }));

  return { rejected, failed };
};
