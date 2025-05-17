// src/components/tabs/MerchantsTab.tsx
"use client";

import React, { useState, useMemo } from "react";

import type {
  Merchant,
  Transaction,
  Account, 
  BackendMerchantStatus,
} from "@/lib/mockData";

import { formatDate, renderStatusBadge, tuncateUUID } from "@/lib/utils"; 
import MerchantDetailModal, {
  AllowedMerchantActionForModal,
} from "../modals/MerchantDetailModal";
import ConfirmActionModal from "../modals/ConfirmActionModal";
import { Skeleton } from "@/components/ui/skeleton";

interface MerchantsTabProps {
  merchants: Merchant[];
  transactions: Transaction[];
  accounts: Account[]; 
  onMerchantsUpdate?: (updatedMerchants: Merchant[]) => void;
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
        const exhaustiveCheck: never = actionType; // Should not happen with AllowedMerchantActionForModal
        console.error("Unhandled action type in MerchantsTab:", exhaustiveCheck);
        handleCloseConfirmModal();
        return;
    }

    if (logActionText) {
      logAdminActivity(logActionText, "Merchant", merchant.id, logDetails);
    }
  };

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
              updatedAt: new Date().toISOString(), 
              declineReason: newStatus === 'rejected' ? (reason || m.declineReason || "Rejected by admin") : (newStatus === 'active' || newStatus === 'pending_approval' ? null : m.declineReason) 
            }
          : m
      );
      onMerchantsUpdate(updatedMerchants);
    }
  };
  
// Inside MerchantsTab.tsx

  const getConfirmModalProps = () => {
    const { actionType, merchant, reason } = confirmActionDetails; 
    if (!actionType || !merchant) return null;
    const merchantName = merchant.businessName;

    let message: React.ReactNode; // To hold the constructed message

    switch (actionType) {
      case "approve":
        message = <>Approve application for <strong>{merchantName}</strong>?</>;
        return { 
            title: "Confirm Approval", 
            message: message, // Use the constructed message
            confirmButtonText: approvalLoading ? "Approving..." : "Approve", 
            confirmButtonVariant: "success" as const, 
            isLoading: approvalLoading 
        };
      
      case "reject":
        if (reason) {
            message = (
                <>
                    <p>Reject application for <strong>"{merchantName}"</strong> with reason:</p>
                    <p className="mt-1 text-sm italic text-gray-600">"{reason}"</p>
                    <p className="mt-2 font-semibold text-red-700">This action may have consequences.</p>
                </>
            );
        } else {
            message = (
                <>
                    <p>Reject application for <strong>"{merchantName}"</strong>?</p>
                    <p className="mt-1 text-sm text-yellow-600">Note: No specific reason was provided for this rejection.</p>
                    <p className="mt-2 font-semibold text-red-700">This action may have consequences.</p>
                </>
            );
        }
        return { 
            title: "Confirm Rejection", 
            message: message, 
            confirmButtonText: rejectionLoading ? "Rejecting..." : "Confirm Rejection", 
            confirmButtonVariant: "danger" as const, 
            isLoading: rejectionLoading 
        };
      
      case "suspend":
        if (reason) { // If suspend could also take a reason (passed from detail modal)
             message = (
                <>
                    <p>Suspend merchant <strong>"{merchantName}"</strong> with reason:</p>
                    <p className="mt-1 text-sm italic text-gray-600">"{reason}"</p>
                </>
            );
        } else {
            message = <>Suspend merchant <strong>{merchantName}</strong>?</>;
        }
        return { 
            title: "Confirm Suspension", 
            message: message, 
            confirmButtonText: suspensionLoading ? "Suspending..." : "Suspend", 
            confirmButtonVariant: "danger" as const, 
            isLoading: suspensionLoading 
        };
      
      case "reactivate":
        message = <>Reactivate merchant <strong>{merchantName}</strong>?</>;
        return { 
            title: "Confirm Reactivation", 
            message: message,
            confirmButtonText: reactivationLoading ? "Reactivating..." : "Reactivate", 
            confirmButtonVariant: "success" as const, 
            isLoading: reactivationLoading 
        };
      
      default: 
        // This should ideally not be reached if actionType is correctly typed
        // as AllowedMerchantActionForModal which excludes 'deactivate'
        const _exhaustiveCheck: never = actionType;
        console.warn("Unhandled actionType in getConfirmModalProps:", _exhaustiveCheck);
        return null;
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
                    <td className={tableCellClasses}>{formatDate(merchant.submittedAt)}</td> 
                    <td className={`${tableCellClasses} text-center`}>
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
                      <td className={tableCellClasses}>{formatDate(merchant.updatedAt || merchant.submittedAt)}</td> 
                      <td className={tableCellCenterClasses}>{txCount}</td>
                      <td className={`${tableCellClasses} text-center`}>
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
          transactions={transactions} 
          accounts={accounts} 
        />
      )}
      {confirmModalProps && (
        <ConfirmActionModal
          isOpen={isConfirmModalOpen}
          onClose={handleCloseConfirmModal}
          onConfirm={handleConfirmAction}
          title={confirmModalProps.title!} 
          message={confirmModalProps.message!} 
          confirmButtonText={confirmModalProps.confirmButtonText!} 
          confirmButtonVariant={confirmModalProps.confirmButtonVariant}
          isLoading={confirmModalProps.isLoading}
        />
      )}
    </div>
  );
};

export default MerchantsTab;