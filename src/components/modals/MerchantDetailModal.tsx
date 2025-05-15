// src/components/modals/MerchantDetailModal.tsx
import React, { useMemo } from 'react';
import type { 
  Merchant, 
  Transaction, 
  BackendMerchantStatus 
} from '@/lib/mockData'; // Ensure Merchant type here is API-aligned
import { formatDate, formatCurrency, renderStatusBadge, formatDateTime, tuncateUUID } from '@/lib/utils';

export type FullMerchantActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'deactivate';
export type AllowedMerchantActionForModal = Exclude<FullMerchantActionType, "deactivate">;

interface MerchantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestConfirm: (actionType: AllowedMerchantActionForModal, merchant: Merchant) => void; 
  merchant: Merchant | null;
  transactions: Transaction[];
}

const MerchantDetailModal: React.FC<MerchantDetailModalProps> = ({
  isOpen,
  onClose,
  onRequestConfirm,
  merchant,
  transactions,
}) => {
  const merchantTransactions = useMemo(() => {
    if (!merchant) return []; 
    return transactions.filter(tx => tx.merchantId === merchant.id);
  }, [merchant, transactions]);

  if (!isOpen || !merchant) {
    return null;
  }

  // Define these constants now that 'merchant' is guaranteed to be non-null
  const canApprove = merchant.status === 'pending_approval';
  const canReject = merchant.status === 'pending_approval';
  const canSuspend = merchant.status === 'active';
  const canReactivate = merchant.status === 'suspended';
  // const canDeactivate = merchant.status === 'active' || merchant.status === 'suspended'; // Example

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        <div 
          className="relative w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg"
          role="dialog"
          aria-modal="true"
          aria-labelledby="merchant-detail-modal-title"
        >
          <div className="flex items-start justify-between pb-4 border-b border-gray-200">
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

          <div className="mt-5 space-y-4">
            <p><strong>ID:</strong> {tuncateUUID(merchant.id)}</p>
            <p><strong>Contact Email:</strong> {merchant.contactEmail || 'N/A'}</p>
            <p><strong>Category:</strong> {merchant.category || 'N/A'}</p>
            <p><strong>Location/Address:</strong> {merchant.storeAddress || 'N/A'}</p>
            <p><strong>Status:</strong> {renderStatusBadge(merchant.status, "merchant")}</p>
            <p><strong>Submitted:</strong> {formatDate(merchant.submittedAt)}</p>
            {merchant.updatedAt && <p><strong>Last Updated:</strong> {formatDate(merchant.updatedAt)}</p>}
            
            <h4 className="text-md font-semibold mt-6 mb-2">Actions:</h4>
            <div className="flex flex-wrap gap-2">
              {canApprove && (
                <button onClick={() => onRequestConfirm('approve', merchant)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Approve</button>
              )}
              {canReject && (
                <button onClick={() => onRequestConfirm('reject', merchant)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Reject</button>
              )}
              {canSuspend && (
                <button onClick={() => onRequestConfirm('suspend', merchant)} className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600">Suspend</button>
              )}
              {canReactivate && (
                <button onClick={() => onRequestConfirm('reactivate', merchant)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Reactivate</button>
              )}
            </div>

            <h4 className="text-md font-semibold mt-6 mb-2">Recent Transactions ({merchantTransactions.length}):</h4>
            {merchantTransactions.length > 0 ? (
              <div className="overflow-x-auto max-h-60 border rounded-md">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Date & Time</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {merchantTransactions.map(tx => {
                      const { date, time } = formatDateTime(tx.timestamp);
                      return (
                        <tr key={tx.id}>
                          <td className="px-3 py-2">{date} <span className="text-xs text-gray-500">{time}</span></td>
                          <td className="px-3 py-2">{tx.type}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(tx.amount)}</td>
                          <td className="px-3 py-2">{renderStatusBadge(tx.status, "transaction")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No transactions found for this merchant.</p>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantDetailModal;