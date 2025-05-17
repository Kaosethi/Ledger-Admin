// src/components/modals/MerchantDetailModal.tsx
import React, { useMemo, useState } from 'react';
import type { 
  Merchant, 
  Transaction,
  Account,
} from '@/lib/mockData';
import { 
    formatDate, 
    formatCurrency, 
    renderStatusBadge, 
    formatDateTime, 
    tuncateUUID 
} from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Assuming Shadcn Button
import TransactionDetailModal from './TransactionDetailModal'; // Your existing modal for individual tx details

// Action types defined in your original MerchantDetailModal
export type FullMerchantActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'deactivate';
export type AllowedMerchantActionForModal = Exclude<FullMerchantActionType, "deactivate">;

interface MerchantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Updated signature to include optional reason
  onRequestConfirm: (actionType: AllowedMerchantActionForModal, merchant: Merchant, reason?: string) => void; 
  merchant: Merchant | null;
  transactions: Transaction[]; // Expecting "rich" Transaction objects
  accounts: Account[];       // For looking up account names/display IDs
}

// Helper for rendering detail items consistently
const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode; valueClassName?: string; fullWidth?: boolean }> = ({
  label,
  value,
  valueClassName = "text-gray-800", // Default text color
  fullWidth = false,
}) => (
  <div className={fullWidth ? "sm:col-span-2" : ""}> {/* Allow item to span full width if needed */}
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className={`mt-1 text-sm ${valueClassName} break-words`}>
      {value === undefined || value === null || (typeof value === 'string' && value.trim() === "") ? "N/A" : value}
    </dd>
  </div>
);

const MerchantDetailModal: React.FC<MerchantDetailModalProps> = ({
  isOpen,
  onClose,
  onRequestConfirm,
  merchant,
  transactions,
  accounts,
}) => {
  const [isIndividualTxModalOpen, setIsIndividualTxModalOpen] = useState(false);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [suspensionReason, setSuspensionReason] = useState(""); // Optional: for suspend reason

  const merchantTransactions = useMemo(() => {
    if (!merchant) return []; 
    return transactions
      .filter(tx => tx.merchantId === merchant.id)
      .map(tx => {
        const account = accounts.find(acc => acc.id === tx.accountId);
        return {
          ...tx, // tx itself is already a "rich" transaction
          accountDisplayId: account?.displayId || (tx.accountId ? tuncateUUID(tx.accountId) : "N/A"),
          accountChildName: account?.childName || "N/A",
        };
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by most recent
  }, [merchant, transactions, accounts]);

  if (!isOpen || !merchant) {
    return null;
  }

  const canApprove = merchant.status === 'pending_approval';
  const canReject = merchant.status === 'pending_approval';
  const canSuspend = merchant.status === 'active';
  // Allow reactivating 'rejected' merchants (perhaps to 'pending_approval' or 'active' depending on flow)
  const canReactivate = merchant.status === 'suspended' || merchant.status === 'rejected';

  const handleOpenTxDetail = (tx: Transaction) => { // Transaction type here is the enriched one
    setSelectedTxForDetail(tx);
    setIsIndividualTxModalOpen(true);
  };

  const handleCloseTxDetail = () => {
    setIsIndividualTxModalOpen(false);
    setSelectedTxForDetail(null);
  };

  const handleRejectAction = () => {
    if (canReject && rejectionReason.trim() === "") {
        alert("Please provide a reason for rejection.");
        return;
    }
    onRequestConfirm('reject', merchant, rejectionReason);
    setRejectionReason(""); // Clear reason after submitting
  }

  const handleSuspendAction = () => {
    // If suspension reason is optional, you might not need this strict check
    // if (canSuspend && suspensionReason.trim() === "") { 
    //     alert("Please provide a reason for suspension.");
    //     return;
    // }
    onRequestConfirm('suspend', merchant, suspensionReason);
    setSuspensionReason(""); // Clear reason
  }
  
  return (
    <>
      <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-start py-10 px-4">
        <div 
          className="relative mx-auto p-0 border w-full max-w-6xl shadow-lg rounded-md bg-white my-auto" // max-w-6xl from EditAccountModal
          role="dialog"
          aria-modal="true"
          aria-labelledby="merchant-detail-modal-title"
          onClick={(e) => e.stopPropagation()} // Prevent closing if clicking inside modal content
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold leading-6 text-gray-900" id="merchant-detail-modal-title">
              Merchant Details: {merchant.businessName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>

          {/* Main Content Grid (similar to EditAccountModal) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 max-h-[calc(100vh-200px)]"> {/* Adjusted max-h */}
            {/* Left Pane: Merchant Info & Actions */}
            <div className="md:col-span-1 p-6 space-y-6 border-r-0 md:border-r border-gray-200 overflow-y-auto">
              {/* Merchant Info Section */}
              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-3">Merchant Information</h4>
                <dl className="space-y-3">
                  <DetailItem label="ID:" value={tuncateUUID(merchant.id)} valueClassName="font-mono text-gray-700"/>
                  <DetailItem label="Contact Email:" value={merchant.contactEmail} />
                  <DetailItem label="Category:" value={merchant.category} />
                  <DetailItem label="Address:" value={merchant.storeAddress} />
                  <DetailItem label="Status:" value={renderStatusBadge(merchant.status, "merchant")} />
                  {/* formatDate handles string inputs for merchant date fields */}
                  <DetailItem label="Submitted:" value={formatDate(merchant.submittedAt)} /> 
                  {merchant.updatedAt && <DetailItem label="Last Updated:" value={formatDate(merchant.updatedAt)} />}
                  {merchant.status === 'rejected' && merchant.declineReason && (
                    <DetailItem label="Decline Reason:" value={merchant.declineReason} valueClassName="text-red-700" />
                  )}
                </dl>
              </div>

              {/* Actions Section */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Actions</h4>
                <div className="space-y-2">
                  {canApprove && (
                    <Button onClick={() => onRequestConfirm('approve', merchant)} className="w-full bg-green-600 hover:bg-green-700">Approve</Button>
                  )}
                  {canReject && (
                    <div className="space-y-1">
                      <textarea 
                        value={rejectionReason} 
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Reason for rejection (required if rejecting)"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                      />
                      <Button onClick={handleRejectAction} className="w-full bg-red-600 hover:bg-red-700">Reject</Button>
                    </div>
                  )}
                  {canSuspend && (
                     <div className="space-y-1">
                        <textarea 
                            value={suspensionReason} 
                            onChange={(e) => setSuspensionReason(e.target.value)}
                            placeholder="Reason for suspension (optional)"
                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            rows={2}
                        />
                        <Button onClick={handleSuspendAction} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">Suspend</Button>
                    </div>
                  )}
                  {canReactivate && (
                    <Button onClick={() => onRequestConfirm('reactivate', merchant)} className="w-full bg-blue-600 hover:bg-blue-700">Reactivate</Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Pane: Recent Transactions */}
            <div className="md:col-span-2 p-6 space-y-3 overflow-y-auto">
              <h4 className="text-md font-semibold text-gray-700">Recent Transactions ({merchantTransactions.length})</h4>
              {merchantTransactions.length > 0 ? (
                <div className="border rounded-md shadow-sm overflow-hidden">
                  <div className="overflow-x-auto max-h-[calc(100vh-300px)]"> {/* Inner scroll for table if needed */}
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Date & Time</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Account</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Payment ID</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500 whitespace-nowrap">Amount</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-500 whitespace-nowrap">Status</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Description</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-500 whitespace-nowrap">Details</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* Displaying all transactions, or implement pagination if too many */}
                        {merchantTransactions.map(tx => { 
                          const { date, time } = formatDateTime(tx.timestamp); // tx.timestamp is Date
                          const amountValue = parseFloat(tx.amount); // tx.amount is string
                          return (
                            <tr key={tx.id}> {/* Use tx.id (DB primary key) as key */}
                              <td className="px-3 py-2 whitespace-nowrap">{date} <span className="text-xs text-gray-500">{time}</span></td>
                              <td className="px-3 py-2 whitespace-nowrap" title={tx.accountId}>
                                {tx.accountDisplayId}
                                {tx.accountChildName && tx.accountChildName !== "N/A" && <div className="text-xs text-gray-500">({tx.accountChildName})</div>}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap font-mono text-xs" title={tx.paymentId}>{tuncateUUID(tx.paymentId)}</td>
                              <td className="px-3 py-2 text-right whitespace-nowrap font-medium">{formatCurrency(Math.abs(amountValue))}</td>
                              <td className="px-3 py-2 text-center whitespace-nowrap">{renderStatusBadge(tx.status, "transaction")}</td>
                              <td className="px-3 py-2 whitespace-nowrap max-w-[150px] truncate" title={tx.description || ""}>{tx.description || 'N/A'}</td>
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                <Button variant="link" size="sm" onClick={() => handleOpenTxDetail(tx)} className="p-0 h-auto text-blue-600 hover:text-blue-800 text-xs">View</Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4">No transactions found for this merchant.</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
            <Button type="button" onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Modal for individual transaction details */}
      {selectedTxForDetail && merchant && ( // Ensure merchant is also available for context if needed by TransactionDetailModal
        <TransactionDetailModal 
            isOpen={isIndividualTxModalOpen}
            onClose={handleCloseTxDetail}
            transaction={selectedTxForDetail}
            // Pass the specific account and current merchant to the individual tx detail modal
            account={accounts.find(acc => acc.id === selectedTxForDetail.accountId)}
            merchant={merchant} 
        />
      )}
    </>
  );
};

export default MerchantDetailModal;