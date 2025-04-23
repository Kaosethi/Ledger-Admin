// src/components/modals/MerchantDetailModal.tsx
// MODIFIED: Changed onRequestConfirm prop type to AllowedModalAction

import React from 'react';
import type { Merchant, Transaction, MerchantStatus } from '@/lib/mockData';
import { formatDate, renderStatusBadge } from '@/lib/utils';

// Type for all possible actions (even if not all used by this modal)
export type MerchantActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'deactivate';

// MODIFIED: Define allowed actions for this modal's buttons *within this file*
type AllowedModalAction = Exclude<MerchantActionType, 'deactivate'>;


interface MerchantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: Merchant | null;
  transactions: Transaction[];
  // MODIFIED: Changed prop type to use the more specific AllowedModalAction
  onRequestConfirm: (actionType: AllowedModalAction, merchant: Merchant) => void;
}

const MerchantDetailModal: React.FC<MerchantDetailModalProps> = ({
  isOpen,
  onClose,
  merchant,
  transactions,
  onRequestConfirm, // This prop now expects the more specific type
}) => {
  if (!isOpen || !merchant) {
    return null;
  }

  const completedTransactionsCount = transactions.filter(
    tx => tx.merchantId === merchant.id && tx.status === 'Completed'
  ).length;


  // --- Button Rendering Logic ---

  const renderApplicationActionButtons = () => {
    if (merchant.status !== 'Pending') return null;
    // Define actions with the restricted type for clarity inside the function
    const actionApprove: AllowedModalAction = 'approve';
    const actionReject: AllowedModalAction = 'reject';

    return (
        <div className="pt-5 mt-5 border-t border-gray-200">
            <h4 className="text-base font-semibold text-gray-800 mb-3">Application Actions</h4>
            <div className="flex space-x-3">
                 <button
                    // Call prop with the correct type
                    onClick={() => onRequestConfirm(actionApprove, merchant)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                >
                    Approve Application
                </button>
                 <button
                    // Call prop with the correct type
                    onClick={() => onRequestConfirm(actionReject, merchant)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                >
                    Reject Application
                </button>
            </div>
        </div>
    );
  }

  const renderStatusActionButtons = () => {
    let actionButtons: React.ReactNode[] = [];
    // Define actions with the restricted type for clarity inside the function
    const actionSuspend: AllowedModalAction = 'suspend';
    const actionReactivate: AllowedModalAction = 'reactivate';

    if (merchant.status === 'Active') {
      actionButtons.push(
        <button
            key="suspend"
            // Call prop with the correct type
            onClick={() => onRequestConfirm(actionSuspend, merchant)}
            className={`w-full px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400`}
        >
            Suspend Merchant
        </button>
      );
      // Deactivate button is removed
    } else if (merchant.status === 'Suspended' || merchant.status === 'Inactive') {
       actionButtons.push(
        <button
            key="reactivate"
             // Call prop with the correct type
            onClick={() => onRequestConfirm(actionReactivate, merchant)}
            className={`w-full px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`}
        >
            Reactivate Merchant
        </button>
      );
    }

    if (actionButtons.length === 0) return null;

    return (
         <div className="pt-5 mt-5 border-t border-gray-200">
            <h4 className="text-base font-semibold text-gray-800 mb-3">Merchant Status Actions</h4>
             <div className="space-y-2">
                {actionButtons}
             </div>
         </div>
    );
  };


  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-labelledby="merchant-details-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div
          className={`bg-white rounded-lg shadow-xl transform transition-all duration-300 ease-out w-full max-w-lg ${
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900" id="merchant-details-title">
              Merchant Details
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-8 py-6 space-y-5">
            <h4 className="text-base font-semibold text-gray-800 mb-4">Merchant Information</h4>
            <div className="text-sm space-y-3 text-gray-600">
              {/* Fields */}
              <div className="flex justify-between border-b pb-2"> <span className="font-medium text-gray-500 w-1/3">Merchant ID</span> <span className="font-mono text-right w-2/3">{merchant.id}</span> </div>
              <div className="flex justify-between border-b pb-2"> <span className="font-medium text-gray-500 w-1/3">Merchant Name</span> <span className="text-right w-2/3">{merchant.name}</span> </div>
              <div className="flex justify-between border-b pb-2"> <span className="font-medium text-gray-500 w-1/3">Location</span> <span className="text-right w-2/3">{merchant.location || 'N/A'}</span> </div>
              <div className="flex justify-between border-b pb-2"> <span className="font-medium text-gray-500 w-1/3">Category</span> <span className="text-right w-2/3">{merchant.category || 'N/A'}</span> </div>
              <div className="flex justify-between border-b pb-2"> <span className="font-medium text-gray-500 w-1/3">Contact Email</span> {merchant.contactEmail ? (<a href={`mailto:${merchant.contactEmail}`} className="text-primary hover:underline text-right w-2/3 truncate">{merchant.contactEmail}</a>) : (<span className="text-right w-2/3">N/A</span>)} </div>
              <div className="flex justify-between border-b pb-2 items-center"> <span className="font-medium text-gray-500 w-1/3">Status</span> <div className="text-right w-2/3">{renderStatusBadge(merchant.status, 'merchant')}</div> </div>
              <div className="flex justify-between border-b pb-2"> <span className="font-medium text-gray-500 w-1/3">Submitted / Created</span> <span className="text-right w-2/3">{formatDate(merchant.submittedAt) || 'N/A'}</span> </div>
              <div className="flex justify-between border-b pb-2"> <span className="font-medium text-gray-500 w-1/3">Last Updated</span> <span className="text-right w-2/3">{formatDate(merchant.updatedAt) || 'N/A'}</span> </div>
              <div className="flex justify-between pt-1"> <span className="font-medium text-gray-500 w-1/3">Completed Transactions</span> <span className="text-right w-2/3">{completedTransactionsCount}</span> </div>
            </div>

            {/* Render action buttons based on status */}
            {renderApplicationActionButtons()}
            {renderStatusActionButtons()}

          </div>

          {/* Modal Footer */}
          <div className="px-8 py-4 bg-gray-50 flex justify-end border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantDetailModal;