import React, { useState, useRef, useMemo, useEffect } from "react";
import type {
  Account, // This 'Account' type is from mockData. Consider if it should be DrizzleAccount.
  // Transaction, // We will replace this with DrizzleTransaction below
  Merchant,
  PendingRegistration,
} from "@/lib/mockData"; // Ensure path is correct
import type { BulkUpdatePayload } from "../modals/BulkEditModal"; // Ensure path is correct
import {
  formatCurrency,
  formatDate,
  renderStatusBadge,
  formatDdMmYyyyHhMmSs,
  tuncateUUID, // <<<< Added this based on our previous discussion about the typo
} from "@/lib/utils"; // Ensure path is correct
import BulkEditModal from "../modals/BulkEditModal"; // Ensure path is correct
import EditAccountModal from "../modals/EditAccountModal"; // Ensure path is correct
import { useReactToPrint } from "react-to-print";
import BulkQrPrintView from "../print/BulkQrPrintView"; // Ensure path is correct
import ConfirmActionModal from "../modals/ConfirmActionModal"; // Ensure path is correct
import PendingRegistrationDetailModal from "../modals/PendingRegistrationDetailModal"; // Ensure path is correct
import { DateTime } from "luxon";
import { Skeleton } from "@/components/ui/skeleton";

// --- ADD THESE IMPORTS AND TYPE DEFINITIONS ---
import { selectTransactionSchema, selectAccountSchema } from "@/lib/db/schema";
import { z } from "zod";

type DrizzleTransaction = z.infer<typeof selectTransactionSchema>;
type DrizzleAccount = z.infer<typeof selectAccountSchema>;

interface AccountsTabProps {
  accounts: Account[];
  onAccountsUpdate?: (updatedAccounts: Account[]) => void;
  logAdminActivity?: (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: string
  ) => void;
  allTransactions: DrizzleTransaction[];
  merchants: Merchant[];
  pendingRegistrations: PendingRegistration[];
  onPendingRegistrationsUpdate: (updatedList: PendingRegistration[]) => void;
  onAccountAdd: (newAccount: Account) => void;
  isLoading?: boolean; // Initial page loading state
  isRefreshing?: { accounts: boolean; pending: boolean }; // Background refresh state
  isMutating?: boolean; // Mutations in progress
  onAccountSearch?: (searchTerm: string) => void; // Add search callback
  onAccountStatusFilter?: (status: string) => void; // Add status filter callback
  accountsFilter?: { status: string; search: string }; // Add current filter state
  onPendingRegistrationsSearch?: (searchTerm: string) => void; // Add pending registration search callback
  pendingRegistrationsSearch?: string; // Add current pending registration search term
  onBulkApprove?: (selectedIds: Set<string>) => Promise<boolean>; // Add bulk approve callback
  onBulkReject?: (selectedIds: Set<string>) => Promise<boolean>; // Add bulk reject callback
}

// Helper to generate unique account IDs (remains unchanged)
const generateUniqueAccountId = (existingAccounts: Account[]): string => {
  const year = new Date().getFullYear();
  const existingIds = new Set(existingAccounts.map((acc) => acc.id));
  let counter = 1;
  let newId: string;
  do {
    // Example format: STC-YYYY-NNNN
    newId = `STC-${year}-${counter.toString().padStart(4, "0")}`;
    counter++;
  } while (existingIds.has(newId));
  return newId;
};

const AccountsTab: React.FC<AccountsTabProps> = ({
  accounts = [],
  onAccountsUpdate,
  logAdminActivity,
  allTransactions,
  merchants,
  pendingRegistrations = [],
  onPendingRegistrationsUpdate,
  onAccountAdd,
  isLoading = false, // Initial loading state
  isRefreshing = { accounts: false, pending: false }, // Background refresh state
  isMutating = false, // Mutations in progress
  onAccountSearch,
  onAccountStatusFilter,
  accountsFilter = { status: "", search: "" },
  onPendingRegistrationsSearch,
  pendingRegistrationsSearch = "",
  onBulkApprove,
  onBulkReject,
}) => {
  // --- State for Managed Accounts ---
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedAccountsToPrint, setSelectedAccountsToPrint] = useState<
    Account[]
  >([]);
  const [selectedAccountsForModal, setSelectedAccountsForModal] = useState<
    Account[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [triggerPrint, setTriggerPrint] = useState(false);

  // --- State for Pending Registrations ---
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(
    new Set()
  );
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingPendingRegistration, setViewingPendingRegistration] =
    useState<PendingRegistration | null>(null);

  // --- Refs ---
  const printComponentRef = useRef<HTMLDivElement>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const selectAllPendingCheckboxRef = useRef<HTMLInputElement>(null);

  // --- Filtered & Derived State ---
  const filteredAccounts = useMemo(() => {
    // If we're using API filtering, just return all accounts
    if (onAccountSearch || onAccountStatusFilter) {
      return accounts;
    }

    // Otherwise, do client-side filtering
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    if (!lowerCaseSearchTerm) {
      return accounts;
    }
    // MODIFIED: Use childName for filtering
    return accounts.filter(
      (account) =>
        account.id.toLowerCase().includes(lowerCaseSearchTerm) ||
        (account.guardianName &&
          account.guardianName.toLowerCase().includes(lowerCaseSearchTerm)) ||
        account.childName.toLowerCase().includes(lowerCaseSearchTerm) // Use childName
    );
  }, [accounts, searchTerm, onAccountSearch, onAccountStatusFilter]);

  // --- Selection State Logic ---
  const isAllSelected = useMemo(
    () =>
      filteredAccounts.length > 0 &&
      selectedAccountIds.size === filteredAccounts.length,
    [filteredAccounts, selectedAccountIds]
  );
  const isIndeterminate = useMemo(
    () =>
      selectedAccountIds.size > 0 &&
      selectedAccountIds.size < filteredAccounts.length,
    [filteredAccounts, selectedAccountIds]
  );
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const isAllPendingSelected = useMemo(
    () =>
      pendingRegistrations.length > 0 &&
      selectedPendingIds.size === pendingRegistrations.length,
    [pendingRegistrations, selectedPendingIds]
  );
  const isPendingIndeterminate = useMemo(
    () =>
      selectedPendingIds.size > 0 &&
      selectedPendingIds.size < pendingRegistrations.length,
    [pendingRegistrations, selectedPendingIds]
  );
  useEffect(() => {
    if (selectAllPendingCheckboxRef.current) {
      selectAllPendingCheckboxRef.current.indeterminate =
        isPendingIndeterminate;
    }
  }, [isPendingIndeterminate]);

  // --- Print Handler ---
  const handleActualPrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: "Selected-Account-QR-Codes",
    onAfterPrint: () => {
      setTriggerPrint(false);
    },
  });
  useEffect(() => {
    if (triggerPrint && printComponentRef.current) {
      handleActualPrint();
    } else if (triggerPrint) {
      console.warn(
        "Print triggered but printComponentRef.current is not attached yet."
      );
    }
  }, [triggerPrint, handleActualPrint]);

  // --- Event Handlers for Managed Accounts ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);

    // Call the parent component's search handler if provided
    if (onAccountSearch) {
      onAccountSearch(newSearchTerm);
    }
  };

  // Handle status filter change
  const handleStatusFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const status = e.target.value;
    if (onAccountStatusFilter) {
      onAccountStatusFilter(status);
    }
  };
  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setSelectedAccountIds((prev) => {
      const newSet = new Set(prev);
      if (isChecked) {
        filteredAccounts.forEach((acc) => newSet.add(acc.id));
      } else {
        filteredAccounts.forEach((acc) => newSet.delete(acc.id));
      }
      return newSet;
    });
  };
  const handleRowSelectChange = (accountId: string, isChecked: boolean) => {
    setSelectedAccountIds((prev) => {
      const newSet = new Set(prev);
      if (isChecked) newSet.add(accountId);
      else newSet.delete(accountId);
      return newSet;
    });
  };
  const handleOpenBulkUpdateModal = () => {
    if (selectedAccountIds.size === 0) {
      alert("Please select one or more accounts from the table first.");
      return;
    }
    const selected = accounts.filter((acc) => selectedAccountIds.has(acc.id));
    setSelectedAccountsForModal(selected);
    setIsBulkEditModalOpen(true);
  };
  const handleApplyBulkUpdates = (
    payload: BulkUpdatePayload,
    updatedAccounts: Account[] = []
  ) => {
    if (selectedAccountIds.size === 0) {
      setIsBulkEditModalOpen(false);
      return;
    }

    // If we received updated accounts from the API, update the UI
    if (updatedAccounts.length > 0) {
      // Create a map of id -> updatedAccount for easy lookup
      const updatedAccountsMap = new Map(
        updatedAccounts.map((acc) => [acc.id, acc])
      );

      // Update all accounts, replacing those that were updated
      const finalAccountsList = accounts.map((acc) =>
        updatedAccountsMap.has(acc.id) ? updatedAccountsMap.get(acc.id)! : acc
      );

      onAccountsUpdate?.(finalAccountsList);

      // Clear selection after successful update
      setSelectedAccountIds(new Set());
    }

    setIsBulkEditModalOpen(false);
  };
  const handleBulkPrintClick = async () => {
    if (selectedAccountIds.size === 0) {
      alert("Please select one or more accounts from the table to print.");
      return;
    }

    // Filter accounts based on selection
    const filteredAccountsForPrint = accounts.filter((acc) =>
      selectedAccountIds.has(acc.id)
    );

    // Log activity
    logAdminActivity?.(
      "Bulk Print QR",
      "Account",
      `${filteredAccountsForPrint.length} accounts`,
      `Preparing to print QR for ${filteredAccountsForPrint.length} selected accounts.`
    );

    // Create copies of the accounts to avoid modifying the original data
    const accountsWithQrCodes = [...filteredAccountsForPrint];

    // Check and generate QR codes if needed
    for (let i = 0; i < accountsWithQrCodes.length; i++) {
      const account = accountsWithQrCodes[i];

      // If account already has a QR code, continue
      if (account.currentQrToken) {
        continue;
      }

      try {
        // Create QR payload using the qr-sign API
        const response = await fetch("/api/qr-sign", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "pay",
            account: account.displayId,
            ver: "1.0",
          }),
        });

        if (!response.ok) {
          console.warn(
            `Failed to generate QR code for account ${account.displayId}: ${response.statusText}`
          );
          continue;
        }

        const qrPayload = await response.json();
        const jsonString = JSON.stringify(qrPayload);
        const base64Encoded = btoa(jsonString);

        // Update the account with the new QR code
        accountsWithQrCodes[i] = {
          ...account,
          currentQrToken: base64Encoded,
        };
      } catch (error) {
        console.error(
          `Error generating QR code for account ${account.displayId}:`,
          error
        );
      }
    }

    // Calculate pages (8 QR codes per page)
    const itemsPerPage = 8;
    const pageCount = Math.ceil(accountsWithQrCodes.length / itemsPerPage);

    // Build HTML for printing
    let pagesHtml = "";

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      // Get accounts for this page
      const pageAccounts = accountsWithQrCodes.slice(
        pageIndex * itemsPerPage,
        (pageIndex + 1) * itemsPerPage
      );

      // Calculate empty slots needed
      const emptySlots = itemsPerPage - pageAccounts.length;

      // Start page
      pagesHtml += `
        <div class="a4-page" style="page-break-after: always; width: 210mm; height: 297mm; position: relative; margin: 0 auto;">
          <div class="grid-layout" style="display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(4, 1fr); gap: 8mm; padding: 8mm; height: 100%; box-sizing: border-box;">
      `;

      // Add QR codes for this page
      for (const account of pageAccounts) {
        const qrValue = account.currentQrToken || account.id;

        pagesHtml += `
          <div class="qr-card" style="border: 1px dashed #bbb; border-radius: 4px; padding: 3mm; display: flex; flex-direction: column; justify-content: center; align-items: center; background-color: #ffffff; box-sizing: border-box;">
            <div style="font-size: 12px; font-weight: bold; margin-bottom: 1mm; text-align: center; overflow: hidden; text-overflow: ellipsis; width: 100%;">
              ${account.displayId || account.id}
            </div>
            <div style="font-size: 10px; margin-bottom: 2mm; text-align: center; overflow: hidden; text-overflow: ellipsis; width: 100%;">
              ${account.childName || "N/A"} / ${account.guardianName || "N/A"}
            </div>
            <div style="display: flex; justify-content: center; align-items: center; padding: 1mm; background-color: #f9f9f9; border-radius: 4px; margin-bottom: 1mm;">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                qrValue
              )}" width="120" height="120" alt="QR Code" />
            </div>
          </div>
        `;
      }

      // Add empty placeholders if needed
      for (let i = 0; i < emptySlots; i++) {
        pagesHtml += `
          <div style="border: 1px dashed #eee; border-radius: 5px;"></div>
        `;
      }

      // Add page footer and close page
      pagesHtml += `
          </div>
          <div style="position: absolute; bottom: 5mm; left: 0; width: 100%; text-align: center; font-size: 8px; color: #999;">
            Page ${
              pageIndex + 1
            } of ${pageCount} • Generated on ${new Date().toLocaleDateString()} • Ledger Admin
          </div>
        </div>
      `;
    }

    // Open a new window and print the QR codes
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Codes</title>
            <style>
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
              @media print {
                @page { size: A4 portrait; margin: 0; }
                body { background-color: #ffffff; }
                .a4-page { page-break-after: always; }
                /* Fix for Firefox to ensure content fits page */
                .grid-layout { height: auto !important; min-height: 0 !important; }
                /* Ensure scaled appropriately for all browsers */
                img { max-width: 100%; height: auto; }
              }
              /* For preview mode */
              @media screen {
                body { background-color: #f0f0f0; padding: 20px; }
                .a4-page { 
                  margin-bottom: 20px !important; 
                  box-shadow: 0 0 10px rgba(0,0,0,0.1);
                  background-color: white;
                }
              }
            </style>
          </head>
          <body>
            ${pagesHtml}
            <script>
              // Auto print when loaded
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 500);
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };
  const handleViewEditClick = (accountToEdit: Account) => {
    setEditingAccount(accountToEdit);
    setIsEditAccountModalOpen(true);
  };
  const handleSaveAccountChanges = (updatedAccount: Account) => {
    // Ensure lastActivity is updated if it's missing (should be handled in modal now)
    const accountToSave = {
      ...updatedAccount,
      lastActivity:
        updatedAccount.lastActivity ||
        updatedAccount.updatedAt ||
        new Date().toISOString(),
    };
    const updatedAccountsList = accounts.map((acc) =>
      acc.id === accountToSave.id ? accountToSave : acc
    );
    onAccountsUpdate?.(updatedAccountsList);
    // MODIFIED: Use childName for logging clarity
    logAdminActivity?.(
      "Edit Account",
      "Account",
      accountToSave.id,
      `Updated details for ${accountToSave.childName}`
    );
    setIsEditAccountModalOpen(false);
    setEditingAccount(null);
  };

  // --- Event Handlers for Pending Registrations ---
  const handleSelectAllPendingChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isChecked = e.target.checked;
    setSelectedPendingIds(
      isChecked ? new Set(pendingRegistrations.map((p) => p.id)) : new Set()
    );
  };
  const handlePendingRowSelectChange = (
    pendingId: string,
    isChecked: boolean
  ) => {
    setSelectedPendingIds((prev) => {
      const newSet = new Set(prev);
      if (isChecked) newSet.add(pendingId);
      else newSet.delete(pendingId);
      return newSet;
    });
  };
  const performApprove = async (pendingId: string) => {
    const pending = pendingRegistrations.find((p) => p.id === pendingId);
    if (!pending) return;

    try {
      // Call the approve API endpoint
      const response = await fetch(`/api/accounts/${pending.id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to approve account: ${response.statusText}`);
      }

      // Get the updated account from the response
      const updatedAccount = await response.json();

      // Update local state by filtering out the pending registration
      const updatedPendingList = pendingRegistrations.filter(
        (p) => p.id !== pendingId
      );

      onPendingRegistrationsUpdate(updatedPendingList);

      // Log the activity
      logAdminActivity?.(
        "Approve Registration",
        "Account",
        updatedAccount.id,
        `Approved registration for ${pending.childName} (Guardian: ${pending.guardianName})`
      );
    } catch (error) {
      console.error("Error approving registration:", error);
      alert(`Failed to approve registration: ${error}`);
    }
  };

  const performReject = async (pendingId: string) => {
    const pending = pendingRegistrations.find((p) => p.id === pendingId);
    if (!pending) return;

    try {
      // Call the reject API endpoint
      const response = await fetch(`/api/accounts/${pending.id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to reject account: ${response.statusText}`);
      }

      // Update local state by filtering out the pending registration
      const updatedPendingList = pendingRegistrations.filter(
        (p) => p.id !== pendingId
      );

      onPendingRegistrationsUpdate(updatedPendingList);

      // Log the activity
      logAdminActivity?.(
        "Reject Registration",
        "PendingRegistration",
        pendingId,
        `Rejected registration for ${pending.childName} (Guardian: ${pending.guardianName})`
      );
    } catch (error) {
      console.error("Error rejecting registration:", error);
      alert(`Failed to reject registration: ${error}`);
    }
  };
  const handleApproveClick = (pendingId: string) => {
    setConfirmMessage(
      "Are you sure you want to approve this registration? This will create a new active account."
    );
    setConfirmAction(() => () => performApprove(pendingId));
    setIsConfirmModalOpen(true);
  };
  const handleRejectClick = (pendingId: string) => {
    setConfirmMessage(
      "Are you sure you want to reject this registration? This action cannot be undone."
    );
    setConfirmAction(() => () => performReject(pendingId));
    setIsConfirmModalOpen(true);
  };
  const handleBulkApprove = () => {
    if (selectedPendingIds.size === 0) return;

    setConfirmMessage(
      `Are you sure you want to approve ${selectedPendingIds.size} selected registration(s)?`
    );

    setConfirmAction(() => async () => {
      // If we have the modern bulk approve API
      if (onBulkApprove) {
        const success = await onBulkApprove(selectedPendingIds);
        if (success) {
          logAdminActivity?.(
            "Bulk Approve Registrations",
            "Account",
            `${selectedPendingIds.size} accounts`,
            `Approved ${selectedPendingIds.size} registration(s) via API.`
          );
          setSelectedPendingIds(new Set());
        }
      } else {
        // Legacy implementation (fallback)
        let approvedCount = 0;
        const idsToProcess = Array.from(selectedPendingIds);
        const currentAccounts = [...accounts]; // Base for generating unique IDs
        const now = new Date().toISOString();

        idsToProcess.forEach((pendingId) => {
          const pending = pendingRegistrations.find((p) => p.id === pendingId);
          if (pending) {
            const newAccountId = generateUniqueAccountId(currentAccounts);
            // MODIFIED: Use childName and add lastActivity
            const newAccount: Account = {
              id: newAccountId,
              displayId: newAccountId,
              childName: pending.childName,
              guardianName: pending.guardianName,
              balance: 0,
              status: "Active",
              pin: pending.pin,
              createdAt: now,
              updatedAt: now,
              lastActivity: now, // Initialize lastActivity
              // Add optional fields from PendingRegistration
              guardianDob: pending.guardianDob,
              guardianContact: pending.guardianContact,
              address: pending.address,
            };
            onAccountAdd(newAccount);
            currentAccounts.push(newAccount); // Add to list for subsequent ID checks
            approvedCount++;
          }
        });

        const finalPendingList = pendingRegistrations.filter(
          (p) => !selectedPendingIds.has(p.id)
        );
        onPendingRegistrationsUpdate(finalPendingList);
        logAdminActivity?.(
          "Bulk Approve Registrations",
          "Account",
          `${approvedCount} accounts`,
          `Approved ${approvedCount} registration(s).`
        );
        setSelectedPendingIds(new Set());
      }
    });

    setIsConfirmModalOpen(true);
  };

  const handleBulkReject = () => {
    if (selectedPendingIds.size === 0) return;

    setConfirmMessage(
      `Are you sure you want to reject ${selectedPendingIds.size} selected registration(s)? This action cannot be undone.`
    );

    setConfirmAction(() => async () => {
      // If we have the modern bulk reject API
      if (onBulkReject) {
        const success = await onBulkReject(selectedPendingIds);
        if (success) {
          logAdminActivity?.(
            "Bulk Reject Registrations",
            "PendingRegistration",
            `${selectedPendingIds.size} requests`,
            `Rejected ${selectedPendingIds.size} registration(s) via API.`
          );
          setSelectedPendingIds(new Set());
        }
      } else {
        // Legacy implementation (fallback)
        const rejectedCount = selectedPendingIds.size;
        const updatedPendingList = pendingRegistrations.filter(
          (p) => !selectedPendingIds.has(p.id)
        );
        onPendingRegistrationsUpdate(updatedPendingList);
        logAdminActivity?.(
          "Bulk Reject Registrations",
          "PendingRegistration",
          `${rejectedCount} requests`,
          `Rejected ${rejectedCount} registration(s).`
        );
        setSelectedPendingIds(new Set());
      }
    });

    setIsConfirmModalOpen(true);
  };

  const handleViewDetailsClick = (pending: PendingRegistration) => {
    setViewingPendingRegistration(pending);
    setIsDetailModalOpen(true);
  };
  const handlePendingSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const searchValue = e.target.value;
    if (onPendingRegistrationsSearch) {
      onPendingRegistrationsSearch(searchValue);
    }
  };

  // Update search term when external filter changes
  useEffect(() => {
    if (accountsFilter?.search !== undefined) {
      setSearchTerm(accountsFilter.search);
    }
  }, [accountsFilter?.search]);

  // --- Component Render ---
  return (
    <>
      {/* --- Pending Registrations Section --- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          Pending Registration Requests (
          {isLoading ? "..." : pendingRegistrations.length})
          {isRefreshing.pending && (
            <span className="ml-2 inline-block">
              <svg
                className="animate-spin h-4 w-4 text-primary"
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
            </span>
          )}
        </h2>
        {/* Search and Bulk Action Buttons */}
        {!isLoading && (
          <div className="flex justify-between mb-4">
            <div className="flex space-x-2">
              <button
                onClick={handleBulkApprove}
                disabled={selectedPendingIds.size === 0 || isMutating}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center"
              >
                {isMutating ? (
                  <svg
                    className="animate-spin h-4 w-4 mr-1 text-white"
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
                ) : null}
                Bulk Approve ({selectedPendingIds.size})
              </button>
              <button
                onClick={handleBulkReject}
                disabled={selectedPendingIds.size === 0 || isMutating}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
              >
                {isMutating ? (
                  <svg
                    className="animate-spin h-4 w-4 mr-1 text-white"
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
                ) : null}
                Bulk Reject ({selectedPendingIds.size})
              </button>
            </div>

            {/* Pending Registration Search Input */}
            <div className="relative rounded-md shadow-sm max-w-md">
              <input
                type="text"
                id="pending-search"
                className="block w-full pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm placeholder-gray-400"
                placeholder="Search pending registrations..."
                value={pendingRegistrationsSearch}
                onChange={handlePendingSearchChange}
                aria-label="Search pending registrations"
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {isRefreshing.pending ? (
                  <svg
                    className="animate-spin h-4 w-4 text-gray-400"
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
                ) : (
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Pending Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {/* Pending Table Headers */}
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 w-12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <label htmlFor="select-all-pending" className="sr-only">
                    Select all
                  </label>
                  <input
                    id="select-all-pending"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    checked={isAllPendingSelected}
                    ref={selectAllPendingCheckboxRef}
                    onChange={handleSelectAllPendingChange}
                    disabled={isLoading || pendingRegistrations.length === 0}
                  />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Guardian
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Child
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Submitted
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Details
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Loading indicator for pending table */}
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-4 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Skeleton className="h-8 w-24 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : pendingRegistrations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                  >
                    No pending registrations found.
                  </td>
                </tr>
              ) : (
                pendingRegistrations.map((pending) => (
                  <tr
                    key={pending.id}
                    className={
                      selectedPendingIds.has(pending.id)
                        ? "bg-blue-50 hover:bg-blue-100"
                        : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <label
                        htmlFor={`select-pending-${pending.id}`}
                        className="sr-only"
                      >
                        Select
                      </label>
                      <input
                        id={`select-pending-${pending.id}`}
                        type="checkbox"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        checked={selectedPendingIds.has(pending.id)}
                        onChange={(e) =>
                          handlePendingRowSelectChange(
                            pending.id,
                            e.target.checked
                          )
                        }
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pending.guardianName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {pending.childName}
                    </td>
                    {}
                    {/* Use childName */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDdMmYyyyHhMmSs(
                        DateTime.fromISO(pending.createdAt)
                          .setZone("Asia/Bangkok")
                          .toISO()
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <button
                        onClick={() => handleViewDetailsClick(pending)}
                        className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:underline"
                        title="View Details"
                      >
                        View
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      {/* Action Buttons */}
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleApproveClick(pending.id)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          title="Approve Registration"
                        >
                          <svg
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectClick(pending.id)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title="Reject Registration"
                        >
                          <svg
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {}
      {/* End Pending Section */}
      {/* --- Managed Accounts Section --- */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-3 md:space-y-0">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            Managed Accounts ({isLoading ? "..." : accounts.length})
            {isRefreshing.accounts && (
              <span className="ml-2 inline-block">
                <svg
                  className="animate-spin h-4 w-4 text-primary"
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
              </span>
            )}
          </h2>
          {/* Search and bulk actions */}
          <div className="flex flex-wrap gap-2">
            {/* Status Filter Dropdown */}
            <div className="relative rounded-md shadow-sm">
              <select
                id="account-status-filter"
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                value={accountsFilter?.status || ""}
                onChange={handleStatusFilterChange}
                disabled={isLoading}
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            {/* Search Input */}
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                id="account-search"
                className="block w-full pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm placeholder-gray-400"
                placeholder="Search by ID, Guardian, or Child"
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Search managed accounts"
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {isRefreshing.accounts ? (
                  <svg
                    className="animate-spin h-4 w-4 text-gray-400"
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
                ) : (
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
            {/* Bulk Update Button */}
            <button
              id="bulk-update-btn"
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 flex items-center"
              onClick={handleOpenBulkUpdateModal}
              disabled={
                isLoading || selectedAccountIds.size === 0 || isMutating
              }
            >
              {isMutating ? (
                <svg
                  className="animate-spin h-4 w-4 mr-1 text-white"
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
              ) : null}
              Bulk Update ({selectedAccountIds.size})
            </button>
            {/* Bulk Print Button */}
            <button
              id="bulk-print-qr-btn"
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              onClick={handleBulkPrintClick}
              disabled={
                isLoading || selectedAccountIds.size === 0 || isMutating
              }
            >
              Bulk Print QR ({selectedAccountIds.size})
            </button>
          </div>
        </div>

        {/* Managed Accounts Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {/* Managed Accounts Table Headers */}
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 w-12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <label htmlFor="select-all-header" className="sr-only">
                    Select all visible
                  </label>
                  <input
                    id="select-all-header"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    checked={isAllSelected}
                    ref={selectAllCheckboxRef}
                    onChange={handleSelectAllChange}
                    disabled={isLoading || filteredAccounts.length === 0}
                  />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Account ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Child Name
                </th>
                {/* MODIFIED */}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Guardian Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Balance
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Last Activity
                </th>
                {/* MODIFIED */}
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              id="accounts-table-body"
              className="bg-white divide-y divide-gray-200"
            >
              {/* Loading indicator for accounts table */}
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-4 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Skeleton className="h-4 w-20 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Skeleton className="h-8 w-20 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                  >
                    {searchTerm
                      ? "No accounts match search."
                      : "No accounts found."}
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr
                    key={account.id}
                    className={
                      selectedAccountIds.has(account.id)
                        ? "bg-blue-50 hover:bg-blue-100"
                        : "hover:bg-gray-50"
                    }
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                      <label
                        htmlFor={`select-row-${account.id}`}
                        className="sr-only"
                      >
                        Select
                      </label>
                      <input
                        id={`select-row-${account.id}`}
                        type="checkbox"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        checked={selectedAccountIds.has(account.id)}
                        onChange={(e) =>
                          handleRowSelectChange(account.id, e.target.checked)
                        }
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {account.displayId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {account.childName}
                    </td>
                    {/* MODIFIED */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {account.guardianName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                      {formatCurrency(account.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                      {renderStatusBadge(account.status, "account")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(account.lastActivity)}
                    </td>
                    {/* MODIFIED */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center actions">
                      <button
                        className="text-primary hover:text-secondary focus:outline-none focus:underline"
                        onClick={() => handleViewEditClick(account)}
                      >
                        View/Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination (Placeholder) */}
        <div className="flex items-center justify-between mt-4 px-1">
          <div className="text-sm text-gray-700">
            {!isLoading && (
              <>
                Showing{}
                <span id="pagination-start">
                  {filteredAccounts.length > 0 ? 1 : 0}
                </span>
                {}
                to{}
                <span id="pagination-end">
                  {Math.min(10, filteredAccounts.length)}
                </span>
                {}
                of <span id="pagination-total">{filteredAccounts.length}</span>
                {}
                accounts{}
                {searchTerm && ` (filtered from ${accounts.length} total)`}
              </>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              disabled
              className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled
              className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {}
      {/* End Managed Accounts Section */}
      {/* --- Render Modals --- */}
      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        onApply={handleApplyBulkUpdates}
        selectedAccounts={selectedAccountsForModal}
      />
      {/* Pass logAdminActivity down to EditAccountModal */}
      <EditAccountModal
        isOpen={isEditAccountModalOpen}
        onClose={() => {
          setIsEditAccountModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={handleSaveAccountChanges}
        account={editingAccount}
        allTransactions={allTransactions}
        merchants={merchants}
        logAdminActivity={logAdminActivity}
      />
      <ConfirmActionModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => {
          if (confirmAction) {
            confirmAction();
          }
          setIsConfirmModalOpen(false);
        }}
        message={confirmMessage}
        title={"Confirm Action"}
      />
      <PendingRegistrationDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingPendingRegistration(null);
        }}
        registration={viewingPendingRegistration}
      />
      {/* Hidden print view */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none", // Prevents interaction with elements
          zIndex: -1, // Behind everything
          visibility: "hidden", // Hidden visually but still rendered
          opacity: 0, // Transparent
          overflow: "auto", // Allow scrolling for multiple pages
        }}
        className="print-only-container"
      >
        <BulkQrPrintView
          ref={printComponentRef}
          accountsToPrint={selectedAccountsToPrint}
        />
      </div>
    </>
  );
};

export default AccountsTab;
