// src/components/tabs/MerchantsTab.tsx
"use client";

import React, { useState, useMemo } from "react";

// Import types from @/lib/mockData
// Ensure Merchant, Transaction, and BackendMerchantStatus are correctly defined and exported in mockData.ts
// and that Merchant type uses 'businessName' and 'BackendMerchantStatus' for its 'status'.
import type {
  Merchant,
  Transaction,
  BackendMerchantStatus,
} from "@/lib/mockData";

import { formatDate, renderStatusBadge, tuncateUUID } from "@/lib/utils"; // Adjust path as needed
// Import MerchantDetailModal and its action types
import MerchantDetailModal, {
  FullMerchantActionType, // The full list of actions the modal *could* support
  AllowedMerchantActionForModal, // The subset of actions this modal instance will emit
} from "../modals/MerchantDetailModal"; // Adjust path
import ConfirmActionModal from "../modals/ConfirmActionModal"; // Adjust path
import { Skeleton } from "@/components/ui/skeleton"; // Adjust path

interface MerchantsTabProps {
  merchants: Merchant[];
  transactions: Transaction[];
  onMerchantsUpdate?: (updatedMerchants: Merchant[]) => void;
  logAdminActivity?: (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: string
  ) => void;
  merchantsLoading?: boolean;
  // Updated prop types for React Query mutations
  approveMerchant?: (id: string, closeModal?: () => void) => void;
  rejectMerchant?: (
    id: string,
    reason?: string,
    closeModal?: () => void
  ) => void;
  suspendMerchant?: (
    id: string,
    reason?: string,
    closeModal?: () => void
  ) => void;
  reactivateMerchant?: (id: string, closeModal?: () => void) => void;
  approvalLoading?: boolean;
  rejectionLoading?: boolean;
  suspensionLoading?: boolean;
  reactivationLoading?: boolean;
}

// This type in MerchantsTab will match what MerchantDetailModal's onRequestConfirm expects
type ActionToConfirm = AllowedMerchantActionForModal;

const tableHeaderClasses =
  "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
const tableCellClasses = "px-4 py-4 whitespace-nowrap text-sm text-gray-700";
const tableCellCenterClasses = `${tableCellClasses} text-center`;
const tableCellActionsClasses = `${tableCellClasses} text-center`;

const MerchantsTab: React.FC<MerchantsTabProps> = ({
  merchants = [],
  transactions = [],
  onMerchantsUpdate,
  logAdminActivity,
  merchantsLoading = false,
  approveMerchant,
  rejectMerchant,
  suspendMerchant,
  reactivateMerchant,
  approvalLoading,
  rejectionLoading,
  suspensionLoading,
  reactivationLoading,
}) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(
    null
  );
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmActionDetails, setConfirmActionDetails] = useState<{
    actionType: ActionToConfirm | null; // Uses the subset of actions
    merchant: Merchant | null;
  }>({ actionType: null, merchant: null });

  const pendingMerchants = useMemo(
    () => merchants.filter((m) => m.status === "pending_approval"),
    [merchants]
  );
  const managedMerchants = useMemo(
    () =>
      merchants.filter((m) =>
        ["active", "suspended"].includes(m.status as BackendMerchantStatus)
      ),
    [merchants]
  );

  const handleViewDetails = (merchantId: string) => {
    const merchantToView = merchants.find((m) => m.id === merchantId);
    if (merchantToView) {
      setSelectedMerchant(merchantToView);
      setIsDetailModalOpen(true);
    } else {
      console.error("Could not find merchant details for ID:", merchantId);
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedMerchant(null);
  };

  // This function receives an actionType that is AllowedMerchantActionForModal from MerchantDetailModal
  const handleRequestConfirm = (
    actionType: ActionToConfirm,
    merchant: Merchant
  ) => {
    setConfirmActionDetails({ actionType, merchant });
    setIsConfirmModalOpen(true);
    if (isDetailModalOpen) handleCloseDetailModal();
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setTimeout(
      () => setConfirmActionDetails({ actionType: null, merchant: null }),
      300
    );
  };

  const handleConfirmAction = async () => {
    const { actionType, merchant } = confirmActionDetails;
    if (!actionType || !merchant || !logAdminActivity) {
      console.error(
        "Confirmation details, merchant, or logActivity callback missing."
      );
      handleCloseConfirmModal();
      return;
    }

    let logActionText: string = "";

    // actionType here is of type ActionToConfirm (which excludes 'deactivate')
    switch (actionType) {
      case "approve":
        if (merchant.status === "pending_approval") {
          if (approveMerchant) {
            approveMerchant(merchant.id, handleCloseConfirmModal);
            logActionText = "Approve Merchant";
            // Don't close modal - it will close when mutation completes or fails
          } else {
            // Fallback to the old approach if the mutation function is not provided
            updateMerchantStatus(merchant, "active");
            logActionText = "Approve Merchant";
            handleCloseConfirmModal();
          }
        }
        break;
      case "reject":
        if (merchant.status === "pending_approval") {
          if (rejectMerchant) {
            // We could get the decline reason from a form here
            rejectMerchant(
              merchant.id,
              "No reason provided",
              handleCloseConfirmModal
            );
            logActionText = "Reject Merchant";
            // Don't close modal - it will close when mutation completes or fails
          } else {
            // Fallback to the old approach if the mutation function is not provided
            updateMerchantStatus(merchant, "rejected");
            logActionText = "Reject Merchant";
            handleCloseConfirmModal();
          }
        }
        break;
      case "suspend":
        if (merchant.status === "active") {
          if (suspendMerchant) {
            suspendMerchant(
              merchant.id,
              "No reason provided",
              handleCloseConfirmModal
            );
            logActionText = "Suspend Merchant";
            // Don't close modal - it will close when mutation completes or fails
          } else {
            // Fallback to the old approach if the mutation function is not provided
            updateMerchantStatus(merchant, "suspended");
            logActionText = "Suspend Merchant";
            handleCloseConfirmModal();
          }
        }
        break;
      case "reactivate":
        if (merchant.status === "suspended") {
          if (reactivateMerchant) {
            reactivateMerchant(merchant.id, handleCloseConfirmModal);
            logActionText = "Reactivate Merchant";
            // Don't close modal - it will close when mutation completes or fails
          } else {
            // Fallback to the old approach if the mutation function is not provided
            updateMerchantStatus(merchant, "active");
            logActionText = "Reactivate Merchant";
            handleCloseConfirmModal();
          }
        }
        break;
      default:
        // This should ideally not be reached if types are correct
        const exhaustiveCheck: never = actionType;
        console.error(
          "Unknown or unhandled action type in MerchantsTab:",
          exhaustiveCheck
        );
        handleCloseConfirmModal();
        return;
    }

    if (logActionText) {
      logAdminActivity(
        logActionText,
        "Merchant",
        merchant.id,
        `Status changed for merchant: ${merchant.businessName}`
      );
    }

    // Only close the modal for non-mutation actions
    // For mutations (approve, reject with provided functions), closing is handled by the parent component
    if (
      !(actionType === "approve" && approveMerchant) &&
      !(actionType === "reject" && rejectMerchant) &&
      !(actionType === "suspend" && suspendMerchant) &&
      !(actionType === "reactivate" && reactivateMerchant)
    ) {
      handleCloseConfirmModal();
    }
  };

  // Helper function to update merchant status with the old approach
  const updateMerchantStatus = (
    merchant: Merchant,
    newStatus: BackendMerchantStatus
  ) => {
    if (onMerchantsUpdate) {
      const updatedMerchants = merchants.map((m) =>
        m.id === merchant.id
          ? { ...m, status: newStatus, updatedAt: new Date().toISOString() }
          : m
      );
      onMerchantsUpdate(updatedMerchants);
    }
  };

  const getConfirmModalProps = () => {
    const { actionType, merchant } = confirmActionDetails;
    if (!actionType || !merchant) return null;
    const merchantName = merchant.businessName;

    switch (actionType) {
      case "approve":
        return {
          title: "Confirm Approval",
          message: `Approve application for "${merchantName}"?`,
          confirmButtonText: approvalLoading ? "Approving..." : "Approve",
          confirmButtonVariant: "success" as const,
          isLoading: approvalLoading,
        };
      case "reject":
        return {
          title: "Confirm Rejection",
          message: (
            <>
              <p className="mb-2">
                Reject application for &quot;{merchantName}&quot;?
              </p>
              <p className="font-semibold text-red-700">
                This action cannot be undone.
              </p>
            </>
          ),
          confirmButtonText: rejectionLoading
            ? "Rejecting..."
            : "Reject Application",
          confirmButtonVariant: "danger" as const,
          isLoading: rejectionLoading,
        };
      case "suspend":
        return {
          title: "Confirm Suspension",
          message: `Suspend merchant "${merchantName}"?`,
          confirmButtonText: suspensionLoading
            ? "Suspending..."
            : "Suspend Merchant",
          confirmButtonVariant: "danger" as const,
          isLoading: suspensionLoading,
        };
      case "reactivate":
        return {
          title: "Confirm Reactivation",
          message: `Reactivate merchant "${merchantName}"?`,
          confirmButtonText: reactivationLoading
            ? "Reactivating..."
            : "Reactivate",
          confirmButtonVariant: "success" as const,
          isLoading: reactivationLoading,
        };
      // No 'deactivate' case
      default:
        return null;
    }
  };
  const confirmModalProps = getConfirmModalProps();

  return (
    <div className="space-y-8">
      {/* Pending Merchants Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Pending Merchant Applications (
          {merchantsLoading ? "..." : pendingMerchants.length})
        </h3>
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table
            id="pending-merchants-table"
            className="min-w-full divide-y divide-gray-200"
          >
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={tableHeaderClasses}>
                  Store Name
                </th>
                <th scope="col" className={tableHeaderClasses}>
                  Contact Email
                </th>
                <th scope="col" className={tableHeaderClasses}>
                  Submitted
                </th>
                <th scope="col" className={`${tableHeaderClasses} text-center`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              id="pending-merchants-table-body"
              className="bg-white divide-y divide-gray-200"
            >
              {merchantsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`pending-skeleton-${i}`}>
                    {}
                    {/* ... skeleton cells ... */}
                    {}
                  </tr>
                ))
              ) : pendingMerchants.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`${tableCellClasses} text-center`}>
                    No pending applications.
                  </td>
                </tr>
              ) : (
                pendingMerchants.map((merchant) => (
                  <tr key={merchant.id}>
                    <td
                      className={`${tableCellClasses} font-semibold text-gray-900`}
                    >
                      {merchant.businessName}
                    </td>
                    <td className={tableCellClasses}>
                      {merchant.contactEmail || "N/A"}
                    </td>
                    <td className={tableCellClasses}>
                      {formatDate(merchant.submittedAt)}
                    </td>
                    <td className={`${tableCellActionsClasses}`}>
                      <button
                        onClick={() => handleViewDetails(merchant.id)}
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 view-merchant-details-btn"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Managed Merchants Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Managed Merchants (
          {merchantsLoading ? "..." : managedMerchants.length})
        </h3>
        {/* ... Table for managed merchants, using merchant.businessName etc. ... */}
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table
            id="merchants-table"
            className="min-w-full divide-y divide-gray-200"
          >
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={tableHeaderClasses}>
                  Merchant ID
                </th>
                <th scope="col" className={tableHeaderClasses}>
                  Merchant Name
                </th>
                <th scope="col" className={tableHeaderClasses}>
                  Contact Email
                </th>
                <th scope="col" className={`${tableHeaderClasses} text-center`}>
                  Status
                </th>
                <th scope="col" className={tableHeaderClasses}>
                  Last Updated / Submitted
                </th>
                <th scope="col" className={`${tableHeaderClasses} text-center`}>
                  Transactions
                </th>
                <th scope="col" className={`${tableHeaderClasses} text-center`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              id="merchants-table-body"
              className="bg-white divide-y divide-gray-200"
            >
              {merchantsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`managed-skeleton-${i}`}>
                    {}
                    {/* ... skeleton cells ... */}
                    {}
                  </tr>
                ))
              ) : managedMerchants.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`${tableCellClasses} text-center`}>
                    No active or suspended merchants found.
                  </td>
                </tr>
              ) : (
                managedMerchants.map((merchant) => {
                  const txCount = transactions.filter(
                    (tx) =>
                      tx.merchantId === merchant.id && tx.status === "Completed"
                  ).length;
                  return (
                    <tr key={merchant.id}>
                      <td
                        className={`${tableCellClasses} font-semibold text-gray-900`}
                      >
                        {tuncateUUID(merchant.id)}
                      </td>
                      <td className={tableCellClasses}>
                        {merchant.businessName}
                      </td>
                      <td className={tableCellClasses}>
                        {merchant.contactEmail || "N/A"}
                      </td>
                      <td className={tableCellCenterClasses}>
                        {renderStatusBadge(merchant.status, "merchant")}
                      </td>
                      <td className={tableCellClasses}>
                        {formatDate(merchant.updatedAt || merchant.submittedAt)}
                      </td>
                      <td className={tableCellCenterClasses}>{txCount}</td>
                      <td className={tableCellActionsClasses}>
                        <button
                          onClick={() => handleViewDetails(merchant.id)}
                          className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 view-merchant-details-btn"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <MerchantDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onRequestConfirm={handleRequestConfirm} // handleRequestConfirm expects ActionToConfirm (AllowedMerchantActionForModal)
        merchant={selectedMerchant}
        transactions={transactions}
      />
      {confirmModalProps && (
        <ConfirmActionModal
          isOpen={isConfirmModalOpen}
          onClose={handleCloseConfirmModal}
          onConfirm={handleConfirmAction}
          title={confirmModalProps.title}
          message={confirmModalProps.message}
          confirmButtonText={confirmModalProps.confirmButtonText}
          confirmButtonVariant={confirmModalProps.confirmButtonVariant}
          isLoading={confirmModalProps.isLoading}
        />
      )}
    </div>
  );
};

export default MerchantsTab;
