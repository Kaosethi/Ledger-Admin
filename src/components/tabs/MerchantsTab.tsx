// src/components/tabs/MerchantsTab.tsx
"use client";

import React, { useState, useMemo } from "react";

// Import types from @/lib/mockData
// ASSUMING Merchant type here has date fields (updatedAt, submittedAt, createdAt) as STRING
import type {
  Merchant,
  Transaction,
  Account, 
  BackendMerchantStatus,
} from "@/lib/mockData";

// formatDate should accept string or Date. renderStatusBadge and tuncateUUID are fine.
import { formatDate, renderStatusBadge, tuncateUUID } from "@/lib/utils"; 
import MerchantDetailModal, {
  AllowedMerchantActionForModal,
} from "../modals/MerchantDetailModal";
import ConfirmActionModal from "../modals/ConfirmActionModal";
import { Skeleton } from "@/components/ui/skeleton";

interface MerchantsTabProps {
  merchants: Merchant[]; // Assumed to have string dates based on your last message
  transactions: Transaction[]; // Assumed to have Date objects for timestamps (rich type)
  accounts: Account[];       // Assumed to have string dates for now
  onMerchantsUpdate?: (updatedMerchants: Merchant[]) => void; // Expects Merchant[] with string dates
  logAdminActivity?: (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: string
  ) => void;
  merchantsLoading?: boolean;
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

const tableHeaderClasses =
  "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
const tableCellClasses = "px-4 py-4 whitespace-nowrap text-sm text-gray-700";
const tableCellCenterClasses = `${tableCellClasses} text-center`;
// const tableCellActionsClasses = `${tableCellClasses} text-center`; // Not used, but kept if needed

const MerchantsTab: React.FC<MerchantsTabProps> = ({
  merchants = [],
  transactions = [],
  accounts = [], 
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
    actionType: AllowedMerchantActionForModal | null;
    merchant: Merchant | null;
    reason?: string; 
  }>({ actionType: null, merchant: null, reason: undefined });

  const pendingMerchants = useMemo(
    () => merchants.filter((m) => m.status === "pending_approval"),
    [merchants]
  );
  const managedMerchants = useMemo(
    () =>
      merchants.filter((m) =>
        ["active", "suspended", "rejected"].includes(m.status as BackendMerchantStatus)
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

  const handleRequestConfirm = (
    actionType: AllowedMerchantActionForModal,
    merchant: Merchant,
    reason?: string 
  ) => {
    setConfirmActionDetails({ actionType, merchant, reason }); 
    setIsConfirmModalOpen(true);
    if (isDetailModalOpen) handleCloseDetailModal(); 
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setTimeout(
      () => setConfirmActionDetails({ actionType: null, merchant: null, reason: undefined }),
      300
    );
  };

  const handleConfirmAction = async () => {
    const { actionType, merchant, reason } = confirmActionDetails; 
    if (!actionType || !merchant || !logAdminActivity) {
      handleCloseConfirmModal();
      return;
    }

    let logActionText: string = "";
    let logDetails = `Status changed for merchant: ${merchant.businessName}`;

    switch (actionType) {
      case "approve":
        if (approveMerchant) approveMerchant(merchant.id, handleCloseConfirmModal);
        else { updateMerchantStatus(merchant, "active"); handleCloseConfirmModal(); }
        logActionText = "Approve Merchant";
        break;
      case "reject":
        if (rejectMerchant) rejectMerchant(merchant.id, reason, handleCloseConfirmModal);
        else { updateMerchantStatus(merchant, "rejected", reason); handleCloseConfirmModal(); }
        logActionText = "Reject Merchant";
        if(reason) logDetails += `. Reason: ${reason}`;
        break;
      case "suspend":
        if (suspendMerchant) suspendMerchant(merchant.id, reason, handleCloseConfirmModal);
        else { updateMerchantStatus(merchant, "suspended", reason); handleCloseConfirmModal(); }
        logActionText = "Suspend Merchant";
        if(reason) logDetails += `. Reason: ${reason}`;
        break;
      case "reactivate":
        if (reactivateMerchant) reactivateMerchant(merchant.id, handleCloseConfirmModal);
        else { 
            const targetStatus: BackendMerchantStatus = merchant.status === 'rejected' ? 'pending_approval' : 'active';
            updateMerchantStatus(merchant, targetStatus); 
            handleCloseConfirmModal();
        }
        logActionText = "Reactivate Merchant";
        break;
      default:
        const exhaustiveCheck: never = actionType;
        console.error("Unknown action type:", exhaustiveCheck);
        handleCloseConfirmModal();
        return;
    }

    if (logActionText) {
      logAdminActivity(logActionText, "Merchant", merchant.id, logDetails);
    }
  };

  // This function is called when NOT using react-query mutations (fallback)
  const updateMerchantStatus = (
    merchantToUpdate: Merchant,
    newStatus: BackendMerchantStatus,
    reason?: string
  ) => {
    if (onMerchantsUpdate) {
      const updatedMerchants = merchants.map((m) =>
        m.id === merchantToUpdate.id
          ? { 
              ...m, 
              status: newStatus, 
              // VVVV MODIFIED HERE VVVV
              updatedAt: new Date().toISOString(), // Ensure updatedAt is a STRING for onMerchantsUpdate
              // VVVV END MODIFICATION VVVV
              declineReason: newStatus === 'rejected' ? (reason || m.declineReason || "Rejected by admin") : (newStatus === 'active' || newStatus === 'pending_approval' ? null : m.declineReason) // Clear reason if not rejected
            }
          : m
      );
      onMerchantsUpdate(updatedMerchants);
    }
  };
  
  const getConfirmModalProps = () => {
    const { actionType, merchant, reason } = confirmActionDetails; 
    if (!actionType || !merchant) return null;
    const merchantName = merchant.businessName;

    let messageContent: React.ReactNode = `Are you sure you want to ${actionType} "${merchantName}"?`;
    if (actionType === 'reject' && reason) {
        messageContent = (<><p>Reject application for "{merchantName}" with reason:</p><p className="mt-1 text-sm italic text-gray-600">"{reason}"</p><p className="mt-2 font-semibold text-red-700">This action cannot be undone easily.</p></>);
    } else if (actionType === 'reject') {
        messageContent = (<><p>Reject application for "{merchantName}"?</p><p className="mt-1 text-sm text-yellow-600">Note: No reason was provided.</p><p className="mt-2 font-semibold text-red-700">This action cannot be undone easily.</p></>);
    }

    switch (actionType) {
      case "approve": return { title: "Confirm Approval", message: messageContent, confirmButtonText: approvalLoading ? "Approving..." : "Approve", confirmButtonVariant: "success" as const, isLoading: approvalLoading };
      case "reject": return { title: "Confirm Rejection", message: messageContent, confirmButtonText: rejectionLoading ? "Rejecting..." : "Confirm Rejection", confirmButtonVariant: "danger" as const, isLoading: rejectionLoading };
      case "suspend": return { title: "Confirm Suspension", message: messageContent, confirmButtonText: suspensionLoading ? "Suspending..." : "Suspend", confirmButtonVariant: "danger" as const, isLoading: suspensionLoading };
      case "reactivate": return { title: "Confirm Reactivation", message: messageContent, confirmButtonText: reactivationLoading ? "Reactivating..." : "Reactivate", confirmButtonVariant: "success" as const, isLoading: reactivationLoading };
      default: return null;
    }
  };
  const confirmModalProps = getConfirmModalProps();

  const renderSkeletonCells = (count: number) => Array.from({ length: count }).map((_, i) => <td key={i} className={tableCellClasses}><Skeleton className="h-5 w-full" /></td>);

  return (
    <div className="space-y-8">
      {/* Pending Merchants Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Pending Merchant Applications ({merchantsLoading && !pendingMerchants.length ? "..." : pendingMerchants.length})
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
              {merchantsLoading && pendingMerchants.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => ( <tr key={`pending-skeleton-${i}`}>{renderSkeletonCells(4)}</tr> ))
              ) : !merchantsLoading && pendingMerchants.length === 0 ? (
                <tr><td colSpan={4} className={`${tableCellClasses} text-center`}>No pending applications.</td></tr>
              ) : (
                pendingMerchants.map((merchant) => (
                  <tr key={merchant.id}>
                    <td className={`${tableCellClasses} font-semibold text-gray-900`}>{merchant.businessName}</td>
                    <td className={tableCellClasses}>{merchant.contactEmail || "N/A"}</td>
                    {/* Assuming merchant.submittedAt is string, formatDate should handle it */}
                    <td className={tableCellClasses}>{formatDate(merchant.submittedAt)}</td> 
                    <td className={`${tableCellClasses} text-center`}> {/* Corrected class application */}
                      <button
                        onClick={() => handleViewDetails(merchant.id)}
                        className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 view-merchant-details-btn"
                      >
                        View Details
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
          Managed Merchants ({merchantsLoading && !managedMerchants.length ? "..." : managedMerchants.length})
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
              {merchantsLoading && managedMerchants.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => ( <tr key={`managed-skeleton-${i}`}>{renderSkeletonCells(7)}</tr> ))
              ) : !merchantsLoading && managedMerchants.length === 0 ? (
                <tr><td colSpan={7} className={`${tableCellClasses} text-center`}>No active, suspended, or rejected merchants found.</td></tr>
              ) : (
                managedMerchants.map((merchant) => {
                  const txCount = transactions.filter(
                    (tx) => tx.merchantId === merchant.id && tx.status === "Completed"
                  ).length;
                  return (
                    <tr key={merchant.id}>
                      <td className={`${tableCellClasses} font-semibold text-gray-900`}>{tuncateUUID(merchant.id)}</td>
                      <td className={tableCellClasses}>{merchant.businessName}</td>
                      <td className={tableCellClasses}>{merchant.contactEmail || "N/A"}</td>
                      <td className={tableCellCenterClasses}>{renderStatusBadge(merchant.status, "merchant")}</td>
                      {/* Assuming merchant.updatedAt and merchant.submittedAt are strings */}
                      <td className={tableCellClasses}>{formatDate(merchant.updatedAt || merchant.submittedAt)}</td> 
                      <td className={tableCellCenterClasses}>{txCount}</td>
                      <td className={`${tableCellClasses} text-center`}> {/* Corrected class application */}
                        <button
                          onClick={() => handleViewDetails(merchant.id)}
                           className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 view-merchant-details-btn"
                        >
                          View Details
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
      {selectedMerchant && (
        <MerchantDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          onRequestConfirm={handleRequestConfirm}
          merchant={selectedMerchant}
          transactions={transactions} // These should be rich transactions for the modal's internal table
          accounts={accounts} 
        />
      )}
      {confirmModalProps && (
        <ConfirmActionModal
          isOpen={isConfirmModalOpen}
          onClose={handleCloseConfirmModal}
          onConfirm={handleConfirmAction}
          title={confirmModalProps.title!} // Added non-null assertion assuming it's always set when modal is open
          message={confirmModalProps.message!} // Added non-null assertion
          confirmButtonText={confirmModalProps.confirmButtonText!} // Added non-null assertion
          confirmButtonVariant={confirmModalProps.confirmButtonVariant}
          isLoading={confirmModalProps.isLoading}
        />
      )}
    </div>
  );
};

export default MerchantsTab;