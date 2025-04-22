import React, { useState, useMemo } from "react";
import type { Merchant, Transaction } from "@/lib/mockData";
import { formatDate, renderStatusBadge } from "@/lib/utils";
import MerchantDetailModal, {
  MerchantActionType,
} from "../modals/MerchantDetailModal";
import ConfirmActionModal from "../modals/ConfirmActionModal";

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
}

// Standard Tailwind classes
const tableHeaderClasses =
  "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
const tableCellClasses = "px-6 py-4 whitespace-nowrap text-sm text-gray-700";
const tableCellCenterClasses = `${tableCellClasses} text-center`;
const tableCellActionsClasses = `${tableCellClasses} text-center`;

const MerchantsTab: React.FC<MerchantsTabProps> = ({
  merchants = [],
  transactions = [],
  onMerchantsUpdate,
  logAdminActivity,
}) => {
  // --- State (Unchanged) ---
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(
    null
  );
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmActionDetails, setConfirmActionDetails] = useState<{
    actionType: MerchantActionType | null;
    merchant: Merchant | null;
  }>({ actionType: null, merchant: null });

  // --- Filtered Merchants (Unchanged) ---
  const pendingMerchants = useMemo(
    () => merchants.filter((m) => m.status === "pending_approval"),
    [merchants]
  );
  const managedMerchants = useMemo(
    () =>
      merchants.filter(
        (m) => !["pending_approval", "rejected"].includes(m.status)
      ),
    [merchants]
  );

  // --- Event Handlers (Unchanged) ---
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
    actionType: MerchantActionType,
    merchant: Merchant
  ) => {
    setConfirmActionDetails({ actionType, merchant });
    setIsConfirmModalOpen(true);
    handleCloseDetailModal();
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
    if (!actionType || !merchant) {
      console.error("Confirmation details are missing.");
      handleCloseConfirmModal();
      return;
    }
    let newStatus: Merchant["status"] | null = null;
    let logActionText: string = "";
    switch (actionType) {
      case "approve":
        newStatus = "active";
        logActionText = "Approve Merchant";
        break;
      case "reject":
        newStatus = "rejected";
        logActionText = "Reject Merchant";
        break;
      case "suspend":
        newStatus = "suspended";
        logActionText = "Suspend Merchant";
        break;
      case "reactivate":
        newStatus = "active";
        logActionText = "Reactivate Merchant";
        break;
      default:
        console.error("Unknown action type:", actionType);
        handleCloseConfirmModal();
        return;
    }
    const updatedMerchants = merchants.map((m) =>
      m.id === merchant.id
        ? { ...m, status: newStatus!, updatedAt: new Date().toISOString() }
        : m
    );
    if (onMerchantsUpdate) {
      onMerchantsUpdate(updatedMerchants);
    }
    if (logAdminActivity) {
      logAdminActivity(
        logActionText,
        "Merchant",
        merchant.id,
        `${logActionText.split(" ")[0]}ed merchant: ${
          merchant.businessName
        } (Status changed to ${newStatus})`
      );
    }
  };

  // --- Confirmation Modal Configuration (Unchanged) ---
  const getConfirmModalProps = () => {
    const { actionType, merchant } = confirmActionDetails;
    if (!actionType || !merchant) return null;
    switch (actionType) {
      case "approve":
        return {
          title: "Confirm Approval",
          message: `Are you sure you want to approve the application for "${merchant.businessName}"?`,
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
                Are you sure you want to reject the application for &ldquo;
                {merchant.businessName}&rdquo;?
              </p>{" "}
              <p className="font-semibold text-red-700">
                This action cannot be undone.
              </p>{" "}
            </>
          ),
          confirmButtonText: "Reject Application",
          confirmButtonVariant: "danger" as const,
        };
      case "suspend":
        return {
          title: "Confirm Suspension",
          message: `Are you sure you want to suspend the merchant "${merchant.businessName}"? They will be unable to process any further transactions until reactivated.`,
          confirmButtonText: "Suspend Merchant",
          confirmButtonVariant: "danger" as const,
        };
      case "reactivate":
        return {
          title: "Confirm Reactivation",
          message: `Are you sure you want to reactivate the merchant "${merchant.businessName}"?`,
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        Merchant Management
      </h2>

      {/* Pending Merchants Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4 text-gray-800">
          Pending Merchant Applications
        </h3>
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table
            id="pending-merchants-table"
            className="min-w-full divide-y divide-gray-200"
          >
            <thead className="bg-gray-50">
              <tr>
                {/* MODIFIED: Added text-center */}
                <th scope="col" className={`${tableHeaderClasses} text-center`}>
                  Store Name
                </th>
                {/* MODIFIED: Added text-center */}
                <th scope="col" className={`${tableHeaderClasses} text-center`}>
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
              {pendingMerchants.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`${tableCellClasses} text-center`}>
                    No pending applications.
                  </td>
                </tr>
              ) : (
                pendingMerchants.map((merchant) => (
                  <tr key={merchant.id}>
                    {/* MODIFIED: Added text-center */}
                    <td
                      className={`${tableCellClasses} font-semibold text-gray-900 text-center`}
                    >
                      {merchant.businessName}
                    </td>
                    {/* MODIFIED: Added text-center */}
                    <td className={`${tableCellClasses} text-center`}>
                      {merchant.contactEmail}
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
      <div>
        <h3 className="text-lg font-medium mb-4 text-gray-800">
          All Managed Merchants
        </h3>
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table
            id="merchants-table"
            className="min-w-full divide-y divide-gray-200"
          >
            <thead className="bg-gray-50">
              <tr>
                {/* MODIFIED: Added text-center */}
                <th scope="col" className={`${tableHeaderClasses} text-center`}>
                  Merchant ID
                </th>
                {/* MODIFIED: Added text-center */}
                <th scope="col" className={`${tableHeaderClasses} text-center`}>
                  Store Name
                </th>
                {/* MODIFIED: Added text-center */}
                <th scope="col" className={`${tableHeaderClasses} text-center`}>
                  Contact Email
                </th>
                <th scope="col" className={`${tableHeaderClasses} text-center`}>
                  Status
                </th>
                {/* MODIFIED: Added text-center */}
                <th scope="col" className={`${tableHeaderClasses} text-center`}>
                  Created/Updated
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
              {managedMerchants.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`${tableCellClasses} text-center`}>
                    No active or suspended merchants found.
                  </td>
                </tr>
              ) : (
                managedMerchants.map((merchant) => {
                  const txCount = transactions.filter(
                    (tx) =>
                      tx.merchantId === merchant.id && tx.status === "Approved"
                  ).length;
                  return (
                    <tr key={merchant.id}>
                      {/* MODIFIED: Added text-center */}
                      <td
                        className={`${tableCellClasses} font-semibold text-gray-900 text-center`}
                      >
                        {merchant.id}
                      </td>
                      {/* MODIFIED: Added text-center */}
                      <td className={`${tableCellClasses} text-center`}>
                        {merchant.businessName}
                      </td>
                      {/* MODIFIED: Added text-center */}
                      <td className={`${tableCellClasses} text-center`}>
                        {merchant.contactEmail}
                      </td>
                      <td className={tableCellCenterClasses}>
                        {renderStatusBadge(merchant.status, "merchant")}
                      </td>
                      {/* MODIFIED: Added text-center */}
                      <td className={`${tableCellClasses} text-center`}>
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

      {/* Modals (Unchanged) */}
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
