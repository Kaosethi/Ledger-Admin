// src/components/tabs/MerchantsTab.tsx
"use client";

import React, { useState, useMemo } from "react"; // Removed useEffect as it wasn't used directly here

// MODIFIED: Import types from @/lib/mockData
// Ensure these types are exported from your src/lib/mockData.ts file
// and that MockMerchant (or your equivalent) is aligned with your API response.
import type { Merchant, Transaction, BackendMerchantStatus } from "@/lib/mockData";
import { formatDate, renderStatusBadge } from "@/lib/utils"; // Adjust path as needed
import MerchantDetailModal, { MerchantActionType } from "../modals/MerchantDetailModal"; // Adjust path
import ConfirmActionModal from "../modals/ConfirmActionModal"; // Adjust path
import { Skeleton } from "@/components/ui/skeleton"; // Adjust path

interface MerchantsTabProps {
  // MODIFIED: Use types imported from mockData (which should be API-aligned)
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

// Ensure MerchantActionType aligns with BackendMerchantStatus if it implies status changes
// This might need to be updated based on how MerchantActionType is defined elsewhere.
type AllowedMerchantAction = Exclude<MerchantActionType, "deactivate">;

const tableHeaderClasses = "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  // MODIFIED: Use MockMerchant type
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmActionDetails, setConfirmActionDetails] = useState<{
    actionType: AllowedMerchantAction | null;
    // MODIFIED: Use MockMerchant type
    merchant: Merchant | null;
  }>({ actionType: null, merchant: null });

  const pendingMerchants = useMemo(
    () => merchants.filter((m) => m.status === "pending_approval"),
    [merchants]
  );
  const managedMerchants = useMemo(
    () => merchants.filter((m) => ["active", "suspended"].includes(m.status as BackendMerchantStatus)),
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

  const handleRequestConfirm = (actionType: AllowedMerchantAction, merchant: Merchant) => { // MODIFIED type
    setConfirmActionDetails({ actionType, merchant });
    setIsConfirmModalOpen(true);
    if (isDetailModalOpen) handleCloseDetailModal();
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setTimeout(() => setConfirmActionDetails({ actionType: null, merchant: null }), 300);
  };

  const handleConfirmAction = async () => {
    const { actionType, merchant } = confirmActionDetails;
    if (!actionType || !merchant || !logAdminActivity) {
      console.error("Confirmation details, merchant, or logActivity callback missing.");
      handleCloseConfirmModal();
      return;
    }

    let newStatus: BackendMerchantStatus | null = null;
    let logActionText: string = "";

    switch (actionType) {
      case "approve": if (merchant.status === "pending_approval") newStatus = "active"; logActionText = "Approve Merchant"; break;
      case "reject":  if (merchant.status === "pending_approval") newStatus = "rejected"; logActionText = "Reject Merchant"; break;
      case "suspend": if (merchant.status === "active") newStatus = "suspended"; logActionText = "Suspend Merchant"; break;
      case "reactivate": if (merchant.status === "suspended") newStatus = "active"; logActionText = "Reactivate Merchant"; break;
      default: console.error("Unknown action type:", actionType); handleCloseConfirmModal(); return;
    }

    if (newStatus) {
      // TODO: Implement backend API call here to update status
      // For now, optimistic client-side update:
      if (onMerchantsUpdate) {
        const updatedMerchants = merchants.map((m) =>
          m.id === merchant.id ? { ...m, status: newStatus!, updatedAt: new Date().toISOString() } : m
        );
        onMerchantsUpdate(updatedMerchants);
      }
      // MODIFIED: Use businessName from the merchant object
      logAdminActivity(logActionText, "Merchant", merchant.id, `Status changed to ${newStatus} for merchant: ${merchant.businessName}`);
    } else {
      console.log("No status change for action:", actionType, "on merchant status:", merchant.status);
    }
    handleCloseConfirmModal();
  };

  const getConfirmModalProps = () => {
    const { actionType, merchant } = confirmActionDetails;
    if (!actionType || !merchant) return null;
    // MODIFIED: Use businessName from the merchant object
    const merchantName = merchant.businessName; 

    switch (actionType) {
      case "approve": return { title: "Confirm Approval", message: `Approve application for "${merchantName}"?`, confirmButtonText: "Approve", confirmButtonVariant: "success" as const };
      case "reject": return { title: "Confirm Rejection", message: <><p className="mb-2">Reject application for “{merchantName}”?</p><p className="font-semibold text-red-700">This action cannot be undone.</p></>, confirmButtonText: "Reject Application", confirmButtonVariant: "danger" as const };
      case "suspend": return { title: "Confirm Suspension", message: `Suspend merchant "${merchantName}"?`, confirmButtonText: "Suspend Merchant", confirmButtonVariant: "danger" as const };
      case "reactivate": return { title: "Confirm Reactivation", message: `Reactivate merchant "${merchantName}"?`, confirmButtonText: "Reactivate", confirmButtonVariant: "success" as const };
      default: return null;
    }
  };
  const confirmModalProps = getConfirmModalProps();

  return (
    <div className="space-y-8">
      {/* Pending Merchants Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Pending Merchant Applications ({merchantsLoading ? "..." : pendingMerchants.length})
        </h3>
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table id="pending-merchants-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={tableHeaderClasses}>Store Name</th>
                <th scope="col" className={tableHeaderClasses}>Contact Email</th>
                <th scope="col" className={tableHeaderClasses}>Submitted</th>
                <th scope="col" className={`${tableHeaderClasses} text-center`}>Actions</th>
              </tr>
            </thead>
            <tbody id="pending-merchants-table-body" className="bg-white divide-y divide-gray-200">
              {merchantsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={`pending-skeleton-${i}`}>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-4 text-center"><Skeleton className="h-8 w-24 mx-auto" /></td>
                  </tr>
                ))
              ) : pendingMerchants.length === 0 ? (
                <tr><td colSpan={4} className={`${tableCellClasses} text-center`}>No pending applications.</td></tr>
              ) : (
                pendingMerchants.map((merchant) => ( // merchant here is MockMerchant
                  <tr key={merchant.id}>
                    {/* MODIFIED: Use businessName */}
                    <td className={`${tableCellClasses} font-semibold text-gray-900`}>{merchant.businessName}</td>
                    <td className={tableCellClasses}>{merchant.contactEmail || "N/A"}</td>
                    <td className={tableCellClasses}>{formatDate(merchant.submittedAt)}</td>
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
          Managed Merchants ({merchantsLoading ? "..." : managedMerchants.length})
        </h3>
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table id="merchants-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={tableHeaderClasses}>Merchant ID</th>
                <th scope="col" className={tableHeaderClasses}>Merchant Name</th>
                <th scope="col" className={tableHeaderClasses}>Contact Email</th>
                <th scope="col" className={`${tableHeaderClasses} text-center`}>Status</th>
                <th scope="col" className={tableHeaderClasses}>Last Updated / Submitted</th>
                <th scope="col" className={`${tableHeaderClasses} text-center`}>Transactions</th>
                <th scope="col" className={`${tableHeaderClasses} text-center`}>Actions</th>
              </tr>
            </thead>
            <tbody id="merchants-table-body" className="bg-white divide-y divide-gray-200">
              {merchantsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`managed-skeleton-${i}`}>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-40" /></td>
                    {/* ... other skeleton cells ... */}
                    <td className="px-4 py-4 text-center"><Skeleton className="h-8 w-20 mx-auto" /></td>
                  </tr>
                ))
              ) : managedMerchants.length === 0 ? (
                <tr><td colSpan={7} className={`${tableCellClasses} text-center`}>No active or suspended merchants found.</td></tr>
              ) : (
                managedMerchants.map((merchant) => { // merchant here is MockMerchant
                  const txCount = transactions.filter((tx) => tx.merchantId === merchant.id && tx.status === "Completed").length;
                  return (
                    <tr key={merchant.id}>
                      <td className={`${tableCellClasses} font-semibold text-gray-900`}>{merchant.id}</td>
                      {/* MODIFIED: Use businessName */}
                      <td className={tableCellClasses}>{merchant.businessName}</td>
                      <td className={tableCellClasses}>{merchant.contactEmail || "N/A"}</td>
                      <td className={tableCellCenterClasses}>{renderStatusBadge(merchant.status, "merchant")}</td>
                      <td className={tableCellClasses}>{formatDate(merchant.updatedAt || merchant.submittedAt)}</td>
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
        merchant={selectedMerchant} // selectedMerchant is MockMerchant | null
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