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
import { Button } from '@/components/ui/button';
import TransactionDetailModal from './TransactionDetailModal';

export type FullMerchantActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'deactivate';
export type AllowedMerchantActionForModal = Exclude<FullMerchantActionType, "deactivate">;

interface MerchantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestConfirm: (actionType: AllowedMerchantActionForModal, merchant: Merchant, reason?: string) => void;
  merchant: Merchant | null;
  transactions: Transaction[]; // All transactions (rich type with Date objects)
  accounts: Account[];
}

// Helper for rendering detail items consistently
const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode; valueClassName?: string; fullWidth?: boolean }> = ({
  label,
  value,
  valueClassName = "text-gray-800",
  fullWidth = false,
}) => (
  <div className={fullWidth ? "sm:col-span-2" : ""}>
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className={`mt-1 text-sm ${valueClassName} break-words`}>
      {value === undefined || value === null || (typeof value === 'string' && value.trim() === "") ? "N/A" : value}
    </dd>
  </div>
);

// Define a new type for the transactions displayed in the modal's table
type DisplayableMerchantTransaction = Transaction & {
  displayAccountId: string;
  accountChildName: string;
  // The 'description' here will be tailored for the merchant's view.
};


const MerchantDetailModal: React.FC<MerchantDetailModalProps> = ({
  isOpen,
  onClose,
  onRequestConfirm,
  merchant,
  transactions,
  accounts,
}) => {
  const [isIndividualTxModalOpen, setIsIndividualTxModalOpen] = useState(false);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null); // Original Transaction for sub-modal
  const [rejectionReason, setRejectionReason] = useState("");
  const [suspensionReason, setSuspensionReason] = useState("");

  const merchantTransactionsToDisplay = useMemo((): DisplayableMerchantTransaction[] => {
    if (!merchant) return [];

    const allMerchantRelatedLegs = transactions.filter(tx => tx.merchantId === merchant.id);

    const transactionsByPaymentId = allMerchantRelatedLegs.reduce((acc, tx) => {
      const paymentId = tx.paymentId;
      if (!acc[paymentId]) {
        acc[paymentId] = [];
      }
      acc[paymentId].push(tx);
      return acc;
    }, {} as Record<string, Transaction[]>);

    const processedTransactions: DisplayableMerchantTransaction[] = [];

    for (const paymentId in transactionsByPaymentId) {
      const legs = transactionsByPaymentId[paymentId];
      if (!legs || legs.length === 0) continue;

      // Find the credit leg to the merchant (this is what the merchant received)
      // Or a debit leg if it's a refund *from* the merchant.
      // For simplicity, let's prioritize the CREDIT leg TO an account that is NOT a typical child account,
      // OR if it's a DEBIT leg, it implies money OUT from merchant.
      // This logic might need refinement based on how merchant's own "internal" accounts are identified.

      let merchantPerspectiveLeg = legs.find(leg => leg.type === 'Credit'); // Money IN to an account associated with merchantId
      let otherLegForPayerInfo = legs.find(leg => leg.type === 'Debit'); // Money OUT from payer

      if (!merchantPerspectiveLeg) { // If no credit, maybe it's a refund (debit from merchant)
        merchantPerspectiveLeg = legs.find(leg => leg.type === 'Debit');
        otherLegForPayerInfo = legs.find(leg => leg.type === 'Credit'); // Payer received credit
      }
      
      if (!merchantPerspectiveLeg) { // Fallback if logic is unclear
          merchantPerspectiveLeg = legs[0]; 
      }

      let payerAccountIdForDisplay = merchantPerspectiveLeg.accountId; // Default
      if (merchantPerspectiveLeg.type === 'Credit' && otherLegForPayerInfo) {
        // If this is a credit TO the merchant, the payer is on the debit leg
        payerAccountIdForDisplay = otherLegForPayerInfo.accountId;
      } else if (merchantPerspectiveLeg.type === 'Debit' && otherLegForPayerInfo) {
        // If this is a debit FROM the merchant (refund), the recipient is on the credit leg
         payerAccountIdForDisplay = otherLegForPayerInfo.accountId;
      }
      // If there's only one leg, payerAccountIdForDisplay remains merchantPerspectiveLeg.accountId
      // which should be the customer's account in a direct debit scenario for the merchant.

      const account = accounts.find(acc => acc.id === payerAccountIdForDisplay);
      
      processedTransactions.push({
        ...merchantPerspectiveLeg, // Base details from merchant's perspective leg
        displayAccountId: account?.displayId || (payerAccountIdForDisplay ? tuncateUUID(payerAccountIdForDisplay) : "N/A"),
        accountChildName: account?.childName || "N/A",
        // The description on the merchantPerspectiveLeg should be what the merchant sees
        // e.g., "Payment from [Payer]" or "Product Category"
        description: merchantPerspectiveLeg.description || "N/A", 
      });
    }
    
    return processedTransactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [merchant, transactions, accounts]);

  if (!isOpen || !merchant) {
    return null;
  }

  const canApprove = merchant.status === 'pending_approval';
  const canReject = merchant.status === 'pending_approval';
  const canSuspend = merchant.status === 'active';
  const canReactivate = merchant.status === 'suspended' || merchant.status === 'rejected';

  const handleOpenTxDetail = (tx: DisplayableMerchantTransaction) => {
    // Find the original full transaction object to pass to the detail modal
    // This is important if DisplayableMerchantTransaction modified some original fields for display
    const originalTx = transactions.find(original => original.id === tx.id);
    setSelectedTxForDetail(originalTx || tx); // Fallback to tx if original not found (shouldn't happen)
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
    setRejectionReason("");
  }

  const handleSuspendAction = () => {
    onRequestConfirm('suspend', merchant, suspensionReason);
    setSuspensionReason(""); 
  }
  
  return (
    <>
      <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-start py-10 px-4">
        <div 
          className="relative mx-auto p-0 border w-full max-w-6xl shadow-lg rounded-md bg-white my-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="merchant-detail-modal-title"
          onClick={(e) => e.stopPropagation()}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 max-h-[calc(100vh-200px)]">
            <div className="md:col-span-1 p-6 space-y-6 border-r-0 md:border-r border-gray-200 overflow-y-auto">
              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-3">Merchant Information</h4>
                <dl className="space-y-3">
                  <DetailItem label="ID:" value={tuncateUUID(merchant.id)} valueClassName="font-mono text-gray-700"/>
                  <DetailItem label="Contact Email:" value={merchant.contactEmail} />
                  <DetailItem label="Category:" value={merchant.category} />
                  <DetailItem label="Address:" value={merchant.storeAddress} />
                  <DetailItem label="Status:" value={renderStatusBadge(merchant.status, "merchant")} />
                  <DetailItem label="Submitted:" value={formatDate(merchant.submittedAt)} /> 
                  {merchant.updatedAt && <DetailItem label="Last Updated:" value={formatDate(merchant.updatedAt)} />}
                  {merchant.status === 'rejected' && merchant.declineReason && (
                    <DetailItem label="Decline Reason:" value={merchant.declineReason} valueClassName="text-red-700" />
                  )}
                </dl>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Actions</h4>
                <div className="space-y-2">
                  {canApprove && ( <Button onClick={() => onRequestConfirm('approve', merchant)} className="w-full bg-green-600 hover:bg-green-700">Approve</Button> )}
                  {canReject && (
                    <div className="space-y-1">
                      <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Reason for rejection (required)" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" rows={2}/>
                      <Button onClick={handleRejectAction} className="w-full bg-red-600 hover:bg-red-700">Reject</Button>
                    </div>
                  )}
                  {canSuspend && (
                     <div className="space-y-1">
                        <textarea value={suspensionReason} onChange={(e) => setSuspensionReason(e.target.value)} placeholder="Reason for suspension (optional)" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500" rows={2}/>
                        <Button onClick={handleSuspendAction} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">Suspend</Button>
                    </div>
                  )}
                  {canReactivate && ( <Button onClick={() => onRequestConfirm('reactivate', merchant)} className="w-full bg-blue-600 hover:bg-blue-700">Reactivate</Button> )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 p-6 space-y-3 overflow-y-auto">
              <h4 className="text-md font-semibold text-gray-700">Recent Transactions ({merchantTransactionsToDisplay.length})</h4>
              {merchantTransactionsToDisplay.length > 0 ? (
                <div className="border rounded-md shadow-sm overflow-hidden">
                  <div className="overflow-x-auto max-h-[calc(100vh-300px)]"> 
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
                        {merchantTransactionsToDisplay.map(tx => { 
                          const { date, time } = formatDateTime(tx.timestamp); // tx.timestamp is Date
                          const amountValue = parseFloat(tx.amount); // tx.amount is string
                          return (
                            <tr key={tx.id}>
                              <td className="px-3 py-2 whitespace-nowrap">{date} <span className="text-xs text-gray-500">{time}</span></td>
                              <td className="px-3 py-2 whitespace-nowrap" title={tx.accountId}> {/* Original accountId on this leg */}
                                {tx.displayAccountId}
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

          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
            <Button type="button" onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>

      {selectedTxForDetail && merchant && (
        <TransactionDetailModal 
            isOpen={isIndividualTxModalOpen}
            onClose={handleCloseTxDetail}
            transaction={selectedTxForDetail}
            account={accounts.find(acc => acc.id === selectedTxForDetail.accountId)}
            merchant={merchant} 
        />
      )}
    </>
  );
};

export default MerchantDetailModal;