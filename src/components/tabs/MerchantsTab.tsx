// src/components/tabs/MerchantsTab.tsx
"use client";

import React, { useState, useMemo } from "react";

import type {
  Merchant,
  Transaction, // Assuming this is the "rich" type with Date objects for timestamps
  Account,
  BackendMerchantStatus,
} from "@/lib/mockData";

import { 
    formatDate, 
    renderStatusBadge, 
    tuncateUUID,
    formatCurrency, // For Gross Sales Volume
    cn // For Shadcn UI utilities
} from "@/lib/utils";
import MerchantDetailModal, {
  AllowedMerchantActionForModal,
} from "../modals/MerchantDetailModal";
import ConfirmActionModal from "../modals/ConfirmActionModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { XIcon, CalendarIcon } from "lucide-react";
import { format as formatDateFns } from "date-fns";

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
  approveMerchant?: (id: string, closeModalCallback?: () => void) => void;
  rejectMerchant?: (id: string, reason?: string, closeModalCallback?: () => void) => void;
  suspendMerchant?: (id: string, reason?: string, closeModalCallback?: () => void) => void;
  reactivateMerchant?: (id: string, closeModalCallback?: () => void) => void;
  approvalLoading?: boolean;
  rejectionLoading?: boolean;
  suspensionLoading?: boolean;
  reactivationLoading?: boolean;
}

const tableHeaderClasses = "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap";
const tableCellClasses = "px-4 py-4 whitespace-nowrap text-sm text-gray-700";
const tableCellCenterClasses = `${tableCellClasses} text-center`;

const MerchantsTab: React.FC<MerchantsTabProps> = ({
  merchants = [],
  transactions = [], // These are "rich" transactions with Date objects for timestamps
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
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmActionDetails, setConfirmActionDetails] = useState<{
    actionType: AllowedMerchantActionForModal | null;
    merchant: Merchant | null;
    reason?: string; 
  }>({ actionType: null, merchant: null, reason: undefined });

  // --- Filters for the Managed Merchants Table Aggregates ---
  const [filterFromDate, setFilterFromDate] = useState<Date | undefined>(undefined);
  const [filterToDate, setFilterToDate] = useState<Date | undefined>(undefined);

  const clearManagedMerchantFilters = () => {
    setFilterFromDate(undefined);
    setFilterToDate(undefined);
  };

  const pendingMerchants = useMemo(
    () => merchants.filter((m) => m.status === "pending_approval"),
    [merchants]
  );
  
  // This list of merchants is for the "Managed Merchants" table display.
  // The filtering for aggregates happens inside getMerchantAggregates.
  const managedMerchantsForDisplay = useMemo(
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
    }
  };

  const handleCloseDetailModal = () => { setSelectedMerchant(null); setIsDetailModalOpen(false); };
  const handleRequestConfirm = (actionType: AllowedMerchantActionForModal, merchant: Merchant, reason?: string ) => { setConfirmActionDetails({ actionType, merchant, reason }); setIsConfirmModalOpen(true); if(isDetailModalOpen) handleCloseDetailModal(); };
  const handleCloseConfirmModal = () => { setIsConfirmModalOpen(false); setTimeout(() => setConfirmActionDetails({ actionType: null, merchant: null, reason: undefined }), 300); };
  
  const handleConfirmAction = async () => { 
    const { actionType, merchant, reason } = confirmActionDetails; 
    if (!actionType || !merchant || !logAdminActivity) { handleCloseConfirmModal(); return; }
    let logActionText = ""; let logDetails = `Status changed for merchant ${merchant.businessName} (${tuncateUUID(merchant.id)}) to ${actionType}`;
    switch (actionType) {
      case "approve": if (approveMerchant) approveMerchant(merchant.id, handleCloseConfirmModal); else { updateMerchantStatus(merchant, "active"); handleCloseConfirmModal(); } logActionText = "Approve Merchant"; logDetails = `Approved merchant: ${merchant.businessName} (${tuncateUUID(merchant.id)})`; break;
      case "reject": if (rejectMerchant) rejectMerchant(merchant.id, reason, handleCloseConfirmModal); else { updateMerchantStatus(merchant, "rejected", reason); handleCloseConfirmModal(); } logActionText = "Reject Merchant"; logDetails = `Rejected merchant: ${merchant.businessName} (${tuncateUUID(merchant.id)})${reason ? `. Reason: ${reason}` : ''}`; break;
      case "suspend": if (suspendMerchant) suspendMerchant(merchant.id, reason, handleCloseConfirmModal); else { updateMerchantStatus(merchant, "suspended", reason); handleCloseConfirmModal(); } logActionText = "Suspend Merchant"; logDetails = `Suspended merchant: ${merchant.businessName} (${tuncateUUID(merchant.id)})${reason ? `. Reason: ${reason}` : ''}`; break;
      case "reactivate": const ts = merchant.status === 'rejected' ? 'pending_approval' : 'active'; if (reactivateMerchant) reactivateMerchant(merchant.id, handleCloseConfirmModal); else { updateMerchantStatus(merchant, ts); handleCloseConfirmModal(); } logActionText = "Reactivate Merchant"; logDetails = `Reactivated merchant: ${merchant.businessName} (${tuncateUUID(merchant.id)}) to ${ts}`; break;
      default: const ec: never = actionType; console.error("Unhandled action type in MerchantsTab:", ec); handleCloseConfirmModal(); return;
    }
    if (logActionText) logAdminActivity(logActionText, "Merchant", merchant.id, logDetails);
  };

  const updateMerchantStatus = (merchantToUpdate: Merchant, newStatus: BackendMerchantStatus, reason?: string) => { 
    if (onMerchantsUpdate) {
      const updatedMs = merchants.map((m) => m.id === merchantToUpdate.id ? { ...m, status: newStatus, updatedAt: new Date().toISOString(), declineReason: newStatus === 'rejected' ? (reason || m.declineReason || "Rejected by admin") : (newStatus === 'active' || newStatus === 'pending_approval' ? null : m.declineReason) } : m );
      onMerchantsUpdate(updatedMs); // Assumes onMerchantsUpdate expects Merchant[] with string dates
    }
  };

  const getConfirmModalProps = () => { 
    const { actionType, merchant, reason } = confirmActionDetails; if (!actionType || !merchant) return null;
    const merchantName = merchant.businessName; let message: React.ReactNode;
    switch (actionType) {
      case "approve": message = <>Approve application for <strong>{merchantName}</strong>?</>; return { title: "Confirm Approval", message, confirmButtonText: approvalLoading ? "Approving..." : "Approve", confirmButtonVariant: "success" as const, isLoading: approvalLoading };
      case "reject": if (reason) { message = (<><p>Reject application for <strong>"{merchantName}"</strong> with reason:</p><p className="mt-1 text-sm italic text-gray-600">"{reason}"</p><p className="mt-2 font-semibold text-red-700">This action may have significant consequences.</p></>); } else { message = (<><p>Reject application for <strong>"{merchantName}"</strong>?</p><p className="mt-1 text-sm text-yellow-600">Note: No specific reason was provided.</p><p className="mt-2 font-semibold text-red-700">This action may have significant consequences.</p></>); } return { title: "Confirm Rejection", message, confirmButtonText: rejectionLoading ? "Rejecting..." : "Confirm Rejection", confirmButtonVariant: "danger" as const, isLoading: rejectionLoading };
      case "suspend": if (reason) { message = (<><p>Suspend merchant <strong>"{merchantName}"</strong> with reason:</p><p className="mt-1 text-sm italic text-gray-600">"{reason}"</p></>); } else { message = <>Suspend merchant <strong>{merchantName}</strong>?</>; } return { title: "Confirm Suspension", message, confirmButtonText: suspensionLoading ? "Suspending..." : "Suspend", confirmButtonVariant: "danger" as const, isLoading: suspensionLoading };
      case "reactivate": message = <>Reactivate merchant <strong>{merchantName}</strong>?</>; return { title: "Confirm Reactivation", message, confirmButtonText: reactivationLoading ? "Reactivating..." : "Reactivate", confirmButtonVariant: "success" as const, isLoading: reactivationLoading };
      default: const _ec: never = actionType; console.warn("Unhandled type in getConfirmModalProps:", _ec); return null;
    }
  };
  const confirmModalProps = getConfirmModalProps();
  const renderSkeletonCells = (count: number) => Array.from({ length: count }).map((_, i) => <td key={i} className={tableCellClasses}><Skeleton className="h-5 w-full" /></td>);

  // --- FUNCTION TO CALCULATE MERCHANT AGGREGATES BASED ON FILTERS ---
  const getMerchantAggregates = (merchantId: string) => {
    const relevantTransactions = transactions.filter(tx => {
      if (tx.merchantId !== merchantId) return false;
      // Only consider completed credits for sales count and volume
      if (tx.status !== 'Completed' || tx.type !== 'Credit') return false; 

      const txDate = tx.timestamp; // This is a Date object from "rich" Transaction type
      if (filterFromDate) {
        const startOfDayFrom = new Date(filterFromDate);
        startOfDayFrom.setHours(0,0,0,0);
        if (txDate < startOfDayFrom) return false;
      }
      if (filterToDate) {
        const endOfDayTo = new Date(filterToDate);
        endOfDayTo.setHours(23,59,59,999);
        if (txDate > endOfDayTo) return false;
      }
      return true;
    });

    const salesCount = new Set(relevantTransactions.map(tx => tx.paymentId)).size;
    const grossSalesVolume = relevantTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    return { salesCount, grossSalesVolume };
  };

  return (
    <div className="space-y-8">
      {/* Pending Merchants Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Pending Merchant Applications ({merchantsLoading && !pendingMerchants.length ? "..." : pendingMerchants.length})
        </h3>
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          {/* ... Pending merchants table JSX (no changes here) ... */}
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
                      <button onClick={() => handleViewDetails(merchant.id)} className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1">
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4"> {/* Removed count from here, calculated per row */}
          Managed Merchants
        </h3>

        {/* --- FILTERS FOR MANAGED MERCHANTS AGGREGATES --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-md bg-gray-50 items-end">
            <div>
                <Label htmlFor="filterFromDateManaged" className="mb-1 block text-sm font-medium">Sales From:</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button id="filterFromDateManaged" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !filterFromDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filterFromDate ? formatDateFns(filterFromDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterFromDate} onSelect={setFilterFromDate} initialFocus /></PopoverContent>
                </Popover>
            </div>
            <div>
                <Label htmlFor="filterToDateManaged" className="mb-1 block text-sm font-medium">Sales To:</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button id="filterToDateManaged" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !filterToDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filterToDate ? formatDateFns(filterToDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterToDate} onSelect={setFilterToDate} disabled={(date) => filterFromDate ? date < filterFromDate : false} initialFocus /></PopoverContent>
                </Popover>
            </div>
            <div className="sm:col-span-2 md:col-span-1 flex items-end"> {/* Adjusted for 3-col layout */}
                <Button onClick={clearManagedMerchantFilters} variant="outline" className="w-full">
                    <XIcon className="mr-2 h-4 w-4" /> Clear Date Filters
                </Button>
            </div>
        </div>
        {/* --- END FILTERS --- */}

        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table id="merchants-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={tableHeaderClasses}>Merchant ID</th>
                <th scope="col" className={tableHeaderClasses}>Merchant Name</th>
                <th scope="col" className={tableHeaderClasses}>Contact Email</th>
                <th scope="col" className={`${tableHeaderClasses} text-center`}>Status</th>
                <th scope="col" className={tableHeaderClasses}>Last Updated / Submitted</th>
                {/* MODIFIED Columns */}
                <th scope="col" className={`${tableHeaderClasses} text-center`}>Sales Count</th>
                <th scope="col" className={`${tableHeaderClasses} text-right`}>Gross Sales Volume</th>
                <th scope="col" className={`${tableHeaderClasses} text-center`}>Actions</th>
              </tr>
            </thead>
            <tbody id="merchants-table-body" className="bg-white divide-y divide-gray-200">
              {merchantsLoading && managedMerchantsForDisplay.length === 0 ? ( // Use managedMerchantsForDisplay for loading check
                Array.from({ length: 6 }).map((_, i) => ( <tr key={`managed-skeleton-${i}`}>{renderSkeletonCells(8)}</tr> ))
              ) : !merchantsLoading && managedMerchantsForDisplay.length === 0 ? (
                <tr><td colSpan={8} className={`${tableCellClasses} text-center`}>No active, suspended, or rejected merchants found.</td></tr>
              ) : (
                managedMerchantsForDisplay.map((merchant) => { // Iterate over managedMerchantsForDisplay
                  const { salesCount, grossSalesVolume } = getMerchantAggregates(merchant.id);
                  return (
                    <tr key={merchant.id}>
                      <td className={`${tableCellClasses} font-semibold text-gray-900`}>{tuncateUUID(merchant.id)}</td>
                      <td className={tableCellClasses}>{merchant.businessName}</td>
                      <td className={tableCellClasses}>{merchant.contactEmail || "N/A"}</td>
                      <td className={tableCellCenterClasses}>{renderStatusBadge(merchant.status, "merchant")}</td>
                      <td className={tableCellClasses}>{formatDate(merchant.updatedAt || merchant.submittedAt)}</td>
                      {/* MODIFIED Cells */}
                      <td className={tableCellCenterClasses}>{salesCount}</td>
                      <td className={`${tableCellClasses} text-right`}>{formatCurrency(grossSalesVolume)}</td>
                      <td className={`${tableCellClasses} text-center`}>
                        <button onClick={() => handleViewDetails(merchant.id)} className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1">
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