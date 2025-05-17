// src/components/modals/MerchantDetailModal.tsx
import React, { useMemo, useState } from 'react'; // Added useState for TransactionDetailModal
import type { 
  Merchant, 
  Transaction,
  Account, // Added Account type
  // BackendMerchantStatus // Not directly used in this component's props anymore
} from '@/lib/mockData';
import { 
    formatDate, 
    formatCurrency, 
    renderStatusBadge, 
    formatDateTime, 
    tuncateUUID 
} from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Using Shadcn Button for consistency
import TransactionDetailModal from './TransactionDetailModal'; // For viewing individual transaction details

// Kept your action types
export type FullMerchantActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'deactivate';
export type AllowedMerchantActionForModal = Exclude<FullMerchantActionType, "deactivate">;

interface MerchantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestConfirm: (actionType: AllowedMerchantActionForModal, merchant: Merchant, reason?: string) => void; // Added optional reason
  merchant: Merchant | null;
  transactions: Transaction[]; // All transactions to be filtered
  accounts: Account[];       // All accounts for looking up names
}

const MerchantDetailModal: React.FC<MerchantDetailModalProps> = ({
  isOpen,
  onClose,
  onRequestConfirm,
  merchant,
  transactions,
  accounts, // Added accounts prop
}) => {
  const [isIndividualTxModalOpen, setIsIndividualTxModalOpen] = useState(false);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState(""); // For reject action

  const merchantTransactions = useMemo(() => {
    if (!merchant) return []; 
    // Enrich transactions with account displayId and childName for the table
    return transactions
      .filter(tx => tx.merchantId === merchant.id)
      .map(tx => {
        const account = accounts.find(acc => acc.id === tx.accountId);
        return {
          ...tx,
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
  const canReactivate = merchant.status === 'suspended' || merchant.status === 'rejected'; // Allow reactivating rejected ones too (maybe to pending)

  const handleOpenTxDetail = (tx: Transaction) => {
    setSelectedTxForDetail(tx);
    setIsIndividualTxModalOpen(true);
  };

  const handleCloseTxDetail = () => {
    setIsIndividualTxModalOpen(false);
    setSelectedTxForDetail(null);
  };

  const handleRejectWithReason = () => {
    if (rejectionReason.trim() === "") {
        alert("Please provide a reason for rejection.");
        return;
    }
    onRequestConfirm('reject', merchant, rejectionReason);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 transition-opacity duration-300 ease-in-out">
        <div className="flex items-start justify-center min-h-screen px-4 pt-10 pb-20 text-center sm:block sm:p-0"> {/* items-start and pt-10 for better positioning */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">​</span>
          <div 
            className="relative inline-block w-full max-w-4xl p-0 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg" // max-w-4xl for wider modal
            role="dialog"
            aria-modal="true"
            aria-labelledby="merchant-detail-modal-title"
          >
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

            {/* Main Content Area - Two Panes */}
            <div className="flex flex-col md:flex-row max-h-[75vh]"> {/* max-h for scrollability */}
              {/* Left Pane: Merchant Info & Actions */}
              <div className="w-full md:w-1/3 p-6 space-y-4 border-r-0 md:border-r md:border-gray-200 overflow-y-auto">
                <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Merchant Information</h4>
                    <dl className="space-y-2 text-sm">
                        <div><dt className="font-medium text-gray-500">ID:</dt><dd className="text-gray-800 font-mono">{tuncateUUID(merchant.id)}</dd></div>
                        <div><dt className="font-medium text-gray-500">Contact Email:</dt><dd className="text-gray-800">{merchant.contactEmail || 'N/A'}</dd></div>
                        <div><dt className="font-medium text-gray-500">Category:</dt><dd className="text-gray-800">{merchant.category || 'N/A'}</dd></div>
                        <div><dt className="font-medium text-gray-500">Address:</dt><dd className="text-gray-800">{merchant.storeAddress || 'N/A'}</dd></div>
                        <div><dt className="font-medium text-gray-500">Status:</dt><dd>{renderStatusBadge(merchant.status, "merchant")}</dd></div>
                        <div><dt className="font-medium text-gray-500">Submitted:</dt><dd className="text-gray-800">{formatDate(merchant.submittedAt)}</dd></div>
                        {merchant.updatedAt && <div><dt className="font-medium text-gray-500">Last Updated:</dt><dd className="text-gray-800">{formatDate(merchant.updatedAt)}</dd></div>}
                        {merchant.status === 'rejected' && merchant.declineReason && (
                             <div><dt className="font-medium text-red-500">Decline Reason:</dt><dd className="text-red-700">{merchant.declineReason}</dd></div>
                        )}
                    </dl>
                </div>
                
                <div>
                    <h4 className="text-md font-semibold mt-6 mb-2">Actions:</h4>
                    <div className="space-y-2">
                        {canApprove && (
                            <Button onClick={() => onRequestConfirm('approve', merchant)} className="w-full bg-green-600 hover:bg-green-700">Approve</Button>
                        )}
                        {canReject && (
                            <div className="space-y-1">
                                <textarea 
                                    value={rejectionReason} 
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Reason for rejection (required)"
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                    rows={2}
                                />
                                <Button onClick={handleRejectWithReason} className="w-full bg-red-600 hover:bg-red-700">Reject</Button>
                            </div>
                        )}
                        {canSuspend && (
                            // Add reason input for suspend if needed, similar to reject
                            <Button onClick={() => onRequestConfirm('suspend', merchant)} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">Suspend</Button>
                        )}
                        {canReactivate && (
                            <Button onClick={() => onRequestConfirm('reactivate', merchant)} className="w-full bg-blue-600 hover:bg-blue-700">Reactivate</Button>
                        )}
                    </div>
                </div>
              </div>

              {/* Right Pane: Recent Transactions */}
              <div className="w-full md:w-2/3 p-6 overflow-y-auto">
                <h4 className="text-md font-semibold mb-2 text-gray-700">Recent Transactions ({merchantTransactions.length}):</h4>
                {merchantTransactions.length > 0 ? (
                  <div className="overflow-x-auto border rounded-md"> {/* Removed max-h here, parent div handles scroll */}
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50 sticky top-0 z-10"> {/* Added z-index for sticky header */}
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Date & Time</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Account</th>
                          {/* <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Account Name</th> */}
                          <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Payment ID</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500 whitespace-nowrap">Amount</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-500 whitespace-nowrap">Status</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Description</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-500 whitespace-nowrap">Details</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {merchantTransactions.slice(0, 20).map(tx => { // Displaying latest 20, add pagination if many
                          const { date, time } = formatDateTime(tx.timestamp);
                          const amountValue = parseFloat(tx.amount); // tx.amount is string
                          return (
                            <tr key={tx.id}>
                              <td className="px-3 py-2 whitespace-nowrap">{date} <span className="text-xs text-gray-500">{time}</span></td>
                              <td className="px-3 py-2 whitespace-nowrap" title={tx.accountId}>{tx.accountDisplayId} <br/><span className="text-xs text-gray-500">{tx.accountChildName}</span></td>
                              {/* <td className="px-3 py-2 whitespace-nowrap">{tx.accountChildName}</td> */}
                              <td className="px-3 py-2 whitespace-nowrap font-mono text-xs" title={tx.paymentId}>{tuncateUUID(tx.paymentId)}</td>
                              <td className="px-3 py-2 text-right whitespace-nowrap">{formatCurrency(Math.abs(amountValue))}</td>
                              <td className="px-3 py-2 text-center whitespace-nowrap">{renderStatusBadge(tx.status, "transaction")}</td>
                              <td className="px-3 py-2 whitespace-nowrap max-w-[150px] truncate" title={tx.description || ""}>{tx.description || 'N/A'}</td>
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                <Button variant="link" size="sm" onClick={() => handleOpenTxDetail(tx)} className="p-0 h-auto text-blue-600 hover:text-blue-800">View</Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 py-4">No transactions found for this merchant.</p>
                )}
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <Button type="button" onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>

      {selectedTxForDetail && (
        <TransactionDetailModal 
            isOpen={isIndividualTxModalOpen}
            onClose={handleCloseTxDetail}
            transaction={selectedTxForDetail}
            account={accounts.find(acc => acc.id === selectedTxForDetail.accountId)}
            merchant={merchant} // Current merchant is the merchant for this transaction
        />
      )}
    </>
  );
};

export default MerchantDetailModal;