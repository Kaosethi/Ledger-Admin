// src/components/tabs/MerchantsTab.tsx
// MODIFIED: Updated filter for managedMerchants to exclude 'Inactive'
// MODIFIED: Updated handleConfirmAction logic for reactivate to exclude 'Inactive'

import React, { useState, useMemo } from "react";
// MODIFIED: Import MerchantStatus type
import type { Merchant, Transaction, MerchantStatus } from "@/lib/mockData";
import { formatDate, renderStatusBadge } from "@/lib/utils";
import MerchantDetailModal, {
  MerchantActionType,
} from "../modals/MerchantDetailModal";
import ConfirmActionModal from "../modals/ConfirmActionModal";
import { Skeleton } from "@/components/ui/skeleton";

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
}

// Define allowed actions excluding deactivate
type AllowedMerchantAction = Exclude<MerchantActionType, "deactivate">;

// Standard Tailwind classes
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
}) => {
  // --- State for Modals ---
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(
    null
  );
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmActionDetails, setConfirmActionDetails] = useState<{
    actionType: AllowedMerchantAction | null;
    merchant: Merchant | null;
  }>({ actionType: null, merchant: null });

  // --- Filtered Merchants ---
  const pendingMerchants = useMemo(
    () => merchants.filter((m) => m.status === "Pending"),
    [merchants]
  );
  // MODIFIED: Filter managed merchants to only include Active and Suspended
  const managedMerchants = useMemo(
    () => merchants.filter((m) => ["Active", "Suspended"].includes(m.status)),
    [merchants]
  );

  // --- Event Handlers ---
  const handleViewDetails = (merchantId: string) => {
    const merchantToView = merchants.find((m) => m.id === merchantId);
    if (merchantToView) {
      setSelectedMerchant(merchantToView);
      setIsDetailModalOpen(true);
    } else {
      console.error("Could not find merchant details for ID:", merchantId);
      alert("Error: Could not load merchant details.");
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedMerchant(null);
  };

  const handleRequestConfirm = (
    actionType: AllowedMerchantAction,
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

  const handleConfirmAction = () => {
    const { actionType, merchant } = confirmActionDetails;
    if (!actionType || !merchant || !onMerchantsUpdate || !logAdminActivity) {
      console.error("Confirmation details, merchant, or callback missing.");
      handleCloseConfirmModal();
      return;
    }

    let newStatus: MerchantStatus | null = null;
    let logActionText: string = "";

    switch (actionType) {
      case "approve":
        if (merchant.status === "Pending") {
          newStatus = "Active";
          logActionText = "Approve Merchant Application";
        } else {
          console.warn("Cannot approve non-pending merchant");
        }
        break;
      case "reject":
        if (merchant.status === "Pending") {
          newStatus = "Rejected";
          logActionText = "Reject Merchant Application";
        } else {
          console.warn("Cannot reject non-pending merchant");
        }
        break;
      case "suspend":
        if (merchant.status === "Active") {
          newStatus = "Suspended";
          logActionText = "Suspend Merchant";
        } else {
          console.warn("Can only suspend active merchants");
        }
        break;
      case "reactivate":
        // MODIFIED: Only allow reactivation from 'Suspended'
        if (merchant.status === "Suspended") {
          newStatus = "Active";
          logActionText = "Reactivate Merchant";
        } else {
          console.warn("Can only reactivate suspended merchants");
        }
        break;
      default:
        console.error("Unknown or disallowed action type:", actionType);
        handleCloseConfirmModal();
        return;
    }

    if (newStatus) {
      const updatedMerchants = merchants.map((m) =>
        m.id === merchant.id
          ? { ...m, status: newStatus, updatedAt: new Date().toISOString() }
          : m
      );
      onMerchantsUpdate(updatedMerchants);
      logAdminActivity(
        logActionText,
        "Merchant",
        merchant.id,
        `Status changed to ${newStatus} for merchant: ${merchant.name}`
      );
    } else {
      console.log(
        "No status change for action:",
        actionType,
        "on merchant status:",
        merchant.status
      );
    }

    handleCloseConfirmModal();
  };

  const getConfirmModalProps = () => {
    const { actionType, merchant } = confirmActionDetails;
    if (!actionType || !merchant) return null;

    switch (actionType) {
      case "approve":
        return {
          title: "Confirm Approval",
          message: `Are you sure you want to approve the application for "${merchant.name}"?`,
          confirmButtonText: "Approve",
          confirmButtonVariant: "success" as const,
        };
      case "reject":
        return {
          title: "Confirm Rejection",
          message: (
            <>
              {" "}
              <p className="mb-2">
                {" "}
                Are you sure you want to reject the application for “
                {merchant.name}”?{" "}
              </p>{" "}
              <p className="font-semibold text-red-700">
                {" "}
                This action cannot be undone.{" "}
              </p>{" "}
            </>
          ),
          confirmButtonText: "Reject Application",
          confirmButtonVariant: "danger" as const,
        };
      case "suspend":
        return {
          title: "Confirm Suspension",
          message: `Are you sure you want to suspend the merchant "${merchant.name}"? Transactions may be declined.`,
          confirmButtonText: "Suspend Merchant",
          confirmButtonVariant: "danger" as const,
        };
      case "reactivate":
        return {
          title: "Confirm Reactivation",
          message: `Are you sure you want to reactivate the merchant "${merchant.name}"?`,
          confirmButtonText: "Reactivate",
          confirmButtonVariant: "success" as const,
        };
      default:
        return null;
    }
  };
  const confirmModalProps = getConfirmModalProps();

  // --- Render ---
  return (
    <div className="space-y-8">
      {/* Pending Merchants Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Pending Merchant Applications ({pendingMerchants.length})
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
                  <tr key={i}>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Skeleton className="h-8 w-24 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : pendingMerchants.length === 0 ? (
                <tr>
                  {" "}
                  <td colSpan={4} className={`${tableCellClasses} text-center`}>
                    {" "}
                    No pending applications.{" "}
                  </td>{" "}
                </tr>
              ) : (
                pendingMerchants.map((merchant) => (
                  <tr key={merchant.id}>
                    <td
                      className={`${tableCellClasses} font-semibold text-gray-900`}
                    >
                      {" "}
                      {merchant.name}{" "}
                    </td>
                    <td className={tableCellClasses}>
                      {" "}
                      {merchant.contactEmail || "N/A"}{" "}
                    </td>
                    <td className={tableCellClasses}>
                      {" "}
                      {formatDate(merchant.submittedAt)}{" "}
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
          Managed Merchants ({managedMerchants.length})
        </h3>
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
                  <tr key={i}>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Skeleton className="h-4 w-20 mx-auto" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Skeleton className="h-4 w-16 mx-auto" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Skeleton className="h-8 w-20 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : managedMerchants.length === 0 ? (
                <tr>
                  {" "}
                  <td colSpan={7} className={`${tableCellClasses} text-center`}>
                    {" "}
                    No active or suspended merchants found.{" "}
                  </td>{" "}
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
                        {" "}
                        {merchant.id}{" "}
                      </td>
                      <td className={tableCellClasses}> {merchant.name} </td>
                      <td className={tableCellClasses}>
                        {" "}
                        {merchant.contactEmail || "N/A"}{" "}
                      </td>
                      <td className={tableCellCenterClasses}>
                        {" "}
                        {renderStatusBadge(merchant.status, "merchant")}{" "}
                      </td>
                      <td className={tableCellClasses}>
                        {" "}
                        {formatDate(
                          merchant.updatedAt || merchant.submittedAt
                        )}{" "}
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
        onRequestConfirm={handleRequestConfirm}
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
        />
      )}
    </div>
  );
};

export default MerchantsTab;
