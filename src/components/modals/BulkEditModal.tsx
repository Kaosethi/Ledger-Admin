import React, { useState, useEffect } from "react";
import type { Account } from "@/lib/mockData"; // Ensure path is correct
import { formatCurrency } from "@/lib/utils"; // Ensure path is correct

export interface BulkUpdatePayload {
  balanceAction: "add" | "set" | "nochange";
  amount?: number;
  statusAction: "nochange" | "activate" | "suspend";
}

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (payload: BulkUpdatePayload, updatedAccounts: Account[]) => void;
  selectedAccounts: Account[];
  logAdminActivity?: (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: string
  ) => void;
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  onApply,
  selectedAccounts = [],
  logAdminActivity,
}) => {
  const [balanceAction, setBalanceAction] = useState<
    "add" | "set" | "nochange"
  >("add");
  const [amountStr, setAmountStr] = useState<string>("");
  const [statusAction, setStatusAction] = useState<
    "nochange" | "activate" | "suspend"
  >("nochange");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setBalanceAction("add");
      setAmountStr("");
      setStatusAction("nochange");
      setErrorMessage("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleApplyClick = async () => {
    let amountNum: number | undefined = undefined;
    let effectiveBalanceAction = balanceAction;

    if (amountStr !== "") {
      amountNum = parseFloat(amountStr);
      if (isNaN(amountNum) || amountNum < 0) {
        setErrorMessage(
          "Please enter a valid non-negative amount if you intend to change the balance."
        );
        return;
      }
    } else {
      // If amount is empty, balance action is considered 'nochange'
      effectiveBalanceAction = "nochange";
    }

    if (effectiveBalanceAction === "nochange" && statusAction === "nochange") {
      setErrorMessage(
        "Please enter an amount or select a status change to apply."
      );
      return;
    }

    if (selectedAccounts.length === 0) {
      setErrorMessage("No accounts selected for bulk update.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const payload: BulkUpdatePayload = {
      balanceAction: effectiveBalanceAction,
      amount: amountNum,
      statusAction: statusAction,
    };

    // Extract account IDs for API call
    const accountIds = selectedAccounts.map((account) => account.id);

    try {
      const response = await fetch("/api/accounts/bulk-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountIds,
          balanceAction: effectiveBalanceAction,
          amount: amountNum,
          statusAction,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          `Failed to update accounts: ${errorData.error || response.statusText}`
        );
      }

      const data = await response.json();

      // Log details about the bulk update operation
      const affectedAccountsText =
        `${data.totalUpdated} account(s) updated` +
        (data.totalFailed > 0 ? `, ${data.totalFailed} failed` : "");

      const changes = [];
      if (effectiveBalanceAction !== "nochange" && amountNum !== undefined) {
        changes.push(
          `${
            effectiveBalanceAction === "add" ? "added" : "set"
          } balance to ${amountNum}`
        );
      }
      if (statusAction !== "nochange") {
        changes.push(
          `${statusAction === "activate" ? "activated" : "suspended"} accounts`
        );
      }

      // Log activity for UI feedback (main logging happens server-side)
      logAdminActivity?.(
        "Bulk Update Accounts",
        "Accounts",
        accountIds.join(","),
        `${affectedAccountsText}: ${changes.join(", ")}`
      );

      // Call the onApply callback with the result
      onApply(payload, data.updatedAccounts || []);
      onClose();
    } catch (error) {
      console.error("Error during bulk update:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isAmountEntered = amountStr !== "";
  const isAmountValidIfEntered =
    isAmountEntered &&
    !isNaN(parseFloat(amountStr)) &&
    parseFloat(amountStr) >= 0;
  // Apply button is disabled if:
  // - No status action is selected AND no amount is entered
  // - OR an amount is entered but it's invalid
  // - OR submission is in progress
  const isApplyDisabled =
    isSubmitting ||
    (statusAction === "nochange" && !isAmountEntered) ||
    (isAmountEntered && !isAmountValidIfEntered);

  return (
    // Overlay
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      {/* Modal Content */}
      <div className="relative mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bulk Update Accounts
        </h3>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {errorMessage}
          </div>
        )}

        {/* Balance Action Section */}
        <fieldset className="mb-4 border border-gray-200 p-3 rounded-md">
          <legend className="text-sm font-medium text-gray-700 px-1">
            Balance Change (Optional)
          </legend>
          {/* Action Dropdown */}
          <div className="mb-3">
            <label
              htmlFor="bulk-action"
              className="block text-sm font-medium text-gray-700 mb-1 sr-only"
            >
              Balance Action
            </label>
            <select
              id="bulk-action"
              value={balanceAction}
              onChange={(e) =>
                setBalanceAction(e.target.value as "add" | "set")
              }
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              disabled={isSubmitting}
            >
              <option value="add">Add Amount</option>
              <option value="set">Set Amount To</option>
            </select>
          </div>
          {/* Amount Input */}
          <div>
            <label
              htmlFor="bulk-amount"
              className="block text-sm font-medium text-gray-700 mb-1 sr-only"
            >
              Amount
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              {/* Amount input structure */}
              {/* MODIFIED: Changed $ to ฿ */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">฿</span>
              </div>
              <input
                type="number"
                name="bulk-amount"
                id="bulk-amount"
                className="focus:ring-primary focus:border-primary block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="Leave blank for no change"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                min="0"
                step="0.01"
                disabled={isSubmitting}
              />
              {/* MODIFIED: Changed USD to THB */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">THB</span>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Status Change Section */}
        <fieldset className="mb-4 border border-gray-200 p-3 rounded-md">
          <legend className="text-sm font-medium text-gray-700 px-1">
            Status Change (Optional)
          </legend>
          <div>
            <label
              htmlFor="bulk-status-action"
              className="block text-sm font-medium text-gray-700 mb-1 sr-only"
            >
              New Status
            </label>
            <select
              id="bulk-status-action"
              value={statusAction}
              onChange={(e) =>
                setStatusAction(
                  e.target.value as "nochange" | "activate" | "suspend"
                )
              }
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              disabled={isSubmitting}
            >
              <option value="nochange">-- No Change --</option>
              {/* The values 'activate'/'suspend' map to actions handled in AccountsTab */}
              <option value="activate">Activate Selected</option>
              <option value="suspend">Suspend Selected</option>
            </select>
          </div>
        </fieldset>

        {/* Display Selected Accounts */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Applying to ({selectedAccounts.length}) accounts:
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50 space-y-1">
            {selectedAccounts.length > 0 ? (
              selectedAccounts.map((account) => (
                <p
                  key={account.id}
                  className="text-sm text-gray-800 truncate px-1"
                >
                  {/* MODIFIED: Use account.childName instead of account.name */}
                  {account.displayId} - {account.childName} (
                  {renderStatusBadge(
                    normalizeAccountStatus(account.status), // Normalize status for display
                    "account",
                    true // Use small badge
                  )}{" "}
                  {formatCurrency(account.balance)})
                </p>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-2">
                No accounts selected.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyClick}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 flex items-center justify-center"
            disabled={isApplyDisabled}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : (
              "Apply Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Display helper for status badge within this modal
// (Consider importing the real one from utils if possible and adapting normalize function)
const renderStatusBadge = (
  status: "active" | "suspended" | "inactive" | "pending",
  type: string,
  small: boolean = false
) => {
  const baseClasses = small
    ? "px-1.5 py-0.5 text-xs rounded-full font-medium"
    : "px-2.5 py-0.5 text-sm rounded-md font-medium";
  switch (status) {
    // Using Tailwind CSS color classes for example
    case "active":
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800`}>
          Active
        </span>
      );
    case "suspended":
      return (
        <span className={`${baseClasses} bg-red-100 text-red-800`}>
          Suspended
        </span>
      );
    case "inactive":
      return (
        <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
          Inactive
        </span>
      );
    case "pending":
      return (
        <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
          Pending
        </span>
      ); // Added pending just in case
    default:
      return (
        <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
          Unknown
        </span>
      );
  }
};

// Helper to normalize account status from Account['status'] to values expected by renderStatusBadge
// MODIFIED: Handles 'Active', 'Inactive', 'Suspended'
function normalizeAccountStatus(
  status: Account["status"]
): "active" | "suspended" | "inactive" {
  switch (status) {
    case "Active":
      return "active";
    case "Suspended":
      return "suspended";
    case "Inactive":
      return "inactive"; // Map Inactive directly
    default:
      // Should not happen with correct types, but provide a fallback
      const exhaustiveCheck: never = status;
      return "inactive";
  }
}

export default BulkEditModal;
