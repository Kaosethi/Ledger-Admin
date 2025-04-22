// src/components/modals/MerchantDetailModal.tsx
import React from 'react';
import type { Merchant, Transaction } from '@/lib/mockData';
import { formatDate, renderStatusBadge } from '@/lib/utils'; // Removed unused formatDdMmYyyy

// ADDED: Define action types that can be requested
export type MerchantActionType = 'approve' | 'reject' | 'suspend' | 'reactivate';

interface MerchantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: Merchant | null;
  transactions: Transaction[];
  // MODIFIED: Removed onSave and logAdminActivity, added onRequestConfirm
  onRequestConfirm: (actionType: MerchantActionType, merchant: Merchant) => void;
}

const MerchantDetailModal: React.FC<MerchantDetailModalProps> = ({
  isOpen,
  onClose,
  merchant,
  transactions,
  onRequestConfirm, // Destructure new prop
}) => {
  if (!isOpen || !merchant) {
    return null;
  }

  const approvedTransactionsCount = transactions.filter(
    tx => tx.merchantId === merchant.id && tx.status === 'Approved'
  ).length;

  // REMOVED: handleStatusToggle function, as actions are now requested

  // --- Button Rendering Logic ---

  // Renders Approve/Reject buttons for pending merchants
  const renderApplicationActionButtons = () => {
    if (merchant.status !== 'pending_approval') return null;

    return (
        <div className="pt-5 mt-5 border-t border-gray-200">
            <h4 className="text-base font-semibold text-gray-800 mb-3">Application Actions</h4>
            <div className="flex space-x-3">
                 <button
                    onClick={() => onRequestConfirm('approve', merchant)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                >
                    Approve Application
                </button>
                 <button
                    onClick={() => onRequestConfirm('reject', merchant)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                >
                    Reject Application
                </button>
            </div>
        </div>
    );
  }

  // Renders Suspend/Reactivate buttons for active/suspended merchants
  const renderStatusActionButtons = () => {
    let buttonConfig: { text: string; action: MerchantActionType; variant: 'danger' | 'success' } | null = null;

    if (merchant.status === 'active') {
      buttonConfig = { text: 'Suspend Merchant', action: 'suspend', variant: 'danger' };
    } else if (merchant.status === 'suspended') {
      buttonConfig = { text: 'Reactivate Merchant', action: 'reactivate', variant: 'success' };
    }

    if (!buttonConfig) return null; // No button for pending/rejected in this section

    const buttonClass = buttonConfig.variant === 'danger'
        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        : 'bg-green-600 hover:bg-green-700 focus:ring-green-500';

    return (
         <div className="pt-5 mt-5 border-t border-gray-200">
            <h4 className="text-base font-semibold text-gray-800 mb-3">Merchant Status Actions</h4>
            <button
                onClick={() => onRequestConfirm(buttonConfig!.action, merchant)}
                className={`w-full mt-1 mb-2 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out ${buttonClass}`}
            >
                {buttonConfig.text}
            </button>
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
          {/* Modal Header (Unchanged) */}
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
            {/* Merchant Information Section (Unchanged - using previous spacing improvements) */}
            <h4 className="text-base font-semibold text-gray-800 mb-4">Merchant Information</h4>
            <div className="text-sm space-y-3 text-gray-600">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500 w-1/3">Merchant ID</span>
                <span className="font-mono text-right w-2/3">{merchant.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500 w-1/3">Store Name</span>
                <span className="text-right w-2/3">{merchant.businessName}</span>
              </div>
               <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500 w-1/3">Contact Person</span>
                <span className="text-right w-2/3">{merchant.contactPerson || 'N/A'}</span>
              </div>
               <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500 w-1/3">Contact Email</span>
                <a href={`mailto:${merchant.contactEmail}`} className="text-primary hover:underline text-right w-2/3 truncate">{merchant.contactEmail}</a>
              </div>
               <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500 w-1/3">Contact Phone</span>
                <span className="text-right w-2/3">{merchant.contactPhone || 'N/A'}</span>
              </div>
               <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500 w-1/3">Store Address</span>
                <span className="text-right w-2/3">{merchant.storeAddress || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2 items-center">
                 <span className="font-medium text-gray-500 w-1/3">Status</span>
                 <div className="text-right w-2/3">{renderStatusBadge(merchant.status, 'merchant')}</div>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500 w-1/3">Application Submitted</span>
                <span className="text-right w-2/3">{formatDate(merchant.submittedAt) || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500 w-1/3">Last Updated</span>
                 <span className="text-right w-2/3">{formatDate(merchant.updatedAt) || 'N/A'}</span>
              </div>
               <div className="flex justify-between pt-1">
                <span className="font-medium text-gray-500 w-1/3">Approved Transactions</span>
                <span className="text-right w-2/3">{approvedTransactionsCount}</span>
              </div>
            </div>

            {/* MODIFIED: Render action buttons based on status */}
            {renderApplicationActionButtons()}
            {renderStatusActionButtons()}

          </div>

          {/* Modal Footer (Unchanged) */}
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