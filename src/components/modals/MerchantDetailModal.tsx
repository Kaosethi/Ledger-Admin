// src/components/modals/MerchantDetailModal.tsx
// FIXED: Corrected final closing structure of the component and return statement.

import React, { useMemo } from 'react';
import type { Merchant, Transaction, MerchantStatus } from '@/lib/mockData';
import { formatDate, formatCurrency, renderStatusBadge, formatDateTime } from '@/lib/utils';

// Type for all possible actions
export type MerchantActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'deactivate';

// Define allowed actions for this modal's buttons
type AllowedModalAction = Exclude<MerchantActionType, 'deactivate'>;

interface MerchantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: Merchant | null;
  transactions: Transaction[];
  onRequestConfirm: (actionType: AllowedModalAction, merchant: Merchant) => void;
}

// Table styling constants
const tableHeaderClasses = "px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
const tableCellClasses = "px-2 py-2 whitespace-nowrap text-sm text-gray-700";
const tableContainerClasses = "max-h-72 overflow-y-auto border border-gray-200 rounded-md";

const MerchantDetailModal: React.FC<MerchantDetailModalProps> = ({
  isOpen,
  onClose,
  merchant,
  transactions,
  onRequestConfirm,
}) => {
  const merchantTransactions = useMemo(() => {
    if (!merchant) return [];
    return transactions
      .filter(tx => tx.merchantId === merchant.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [merchant, transactions]);

  // --- Button Rendering Logic ---
  const renderApplicationActionButtons = (currentMerchant: Merchant | null) => {
    if (!currentMerchant || currentMerchant.status !== 'Pending') return null;
    const actionApprove: AllowedModalAction = 'approve';
    const actionReject: AllowedModalAction = 'reject';
    return (
        <div className="pt-5 mt-5 border-t border-gray-200">
            <h4 className="text-base font-semibold text-gray-800 mb-3">Application Actions</h4>
            <div className="flex space-x-3">
                 <button
                    onClick={() => onRequestConfirm(actionApprove, currentMerchant)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                > Approve Application </button>
                 <button
                    onClick={() => onRequestConfirm(actionReject, currentMerchant)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                > Reject Application </button>
            </div>
        </div>
    );
  };

  const renderStatusActionButtons = (currentMerchant: Merchant | null) => {
    if (!currentMerchant) return null;
    const actionSuspend: AllowedModalAction = 'suspend';
    const actionReactivate: AllowedModalAction = 'reactivate';
    const actionButtons: React.ReactNode[] = [];

    if (currentMerchant.status === 'Active') {
      actionButtons.push(
        <button key="suspend" onClick={() => onRequestConfirm(actionSuspend, currentMerchant)} className={`w-full px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500`}>
            Suspend Merchant
        </button>
      );
    } else if (currentMerchant.status === 'Suspended') {
       actionButtons.push(
        <button key="reactivate" onClick={() => onRequestConfirm(actionReactivate, currentMerchant)} className={`w-full px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out bg-green-600 hover:bg-green-700 focus:ring-green-500`}>
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
  // --- End Button Rendering Logic ---

  // Check if modal should be open and if merchant data exists
  if (!isOpen || !merchant) {
    return null;
  }

  // If merchant data exists, render the modal
  return ( // <--- Start of main return statement's JSX
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-start py-10 px-4">
        <div className={`relative mx-auto p-6 border w-full max-w-6xl shadow-lg rounded-md bg-white my-auto`}>
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h3 className="text-lg font-semibold text-gray-900" id="merchant-details-title"> Merchant Details </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Modal Body - Grid Layout (1/3 + 2/3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

             {/* Merchant Information Section (Column 1 - 1/3 width) */}
             <div className="md:col-span-1 space-y-6">
                <div>
                    <h4 className="text-md font-semibold text-gray-700 mb-2">Merchant Information</h4>
                    <dl className="divide-y divide-gray-100 border border-gray-200 rounded-md p-4 text-sm">
                        {/* Merchant details using dl, dt, dd */}
                         <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"> <dt className="font-medium text-gray-500">Merchant ID</dt> <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2 font-mono">{merchant.id}</dd> </div>
                        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"> <dt className="font-medium text-gray-500">Name</dt> <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{merchant.name}</dd> </div>
                        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"> <dt className="font-medium text-gray-500">Location</dt> <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{merchant.location || 'N/A'}</dd> </div>
                        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"> <dt className="font-medium text-gray-500">Category</dt> <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{merchant.category || 'N/A'}</dd> </div>
                        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"> <dt className="font-medium text-gray-500">Contact</dt> <dd className="mt-1 sm:mt-0 sm:col-span-2">{merchant.contactEmail ? (<a href={`mailto:${merchant.contactEmail}`} className="text-primary hover:underline truncate">{merchant.contactEmail}</a>) : (<span>N/A</span>)}</dd> </div>
                        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center"> <dt className="font-medium text-gray-500">Status</dt> <dd className="mt-1 sm:mt-0 sm:col-span-2">{renderStatusBadge(merchant.status, 'merchant')}</dd> </div>
                        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"> <dt className="font-medium text-gray-500">Submitted</dt> <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(merchant.submittedAt) || 'N/A'}</dd> </div>
                        <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"> <dt className="font-medium text-gray-500">Updated</dt> <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(merchant.updatedAt) || 'N/A'}</dd> </div>
                    </dl>
                </div>
                {/* Actions Section */}
                 <div className="p-4 border rounded-md">
                    {renderApplicationActionButtons(merchant)}
                    {renderStatusActionButtons(merchant)}
                 </div>
            </div> {/* End Left Column */}

            {/* Transaction History Section (Column 2 - 2/3 width) */}
            <div className="md:col-span-2 space-y-3">
                 <h4 className="text-md font-semibold text-gray-700 mb-2">Transaction History ({merchantTransactions.length})</h4>
                 <div className={`${tableContainerClasses} shadow-sm`}>
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th scope="col" className={tableHeaderClasses}>Date</th>
                                <th scope="col" className={tableHeaderClasses}>Time</th>
                                <th scope="col" className={tableHeaderClasses}>Account ID</th>
                                <th scope="col" className={tableHeaderClasses}>Txn ID</th>
                                <th scope="col" className={`${tableHeaderClasses} text-right`}>Amount</th>
                                <th scope="col" className={`${tableHeaderClasses} text-center`}>Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {merchantTransactions.length === 0 ? (
                                <tr><td colSpan={6} className={`${tableCellClasses} text-center text-gray-500 py-4`}>No transactions found for this merchant.</td></tr>
                            ) : (
                                merchantTransactions.map((tx) => {
                                    const { date, time } = formatDateTime(tx.timestamp);
                                    return (
                                        <tr key={tx.id}>
                                            <td className={tableCellClasses}>{date}</td>
                                            <td className={`${tableCellClasses} text-xs`}>{time}</td>
                                            <td className={`${tableCellClasses} font-mono text-xs`}>{tx.accountId}</td>
                                            <td className={`${tableCellClasses} font-mono text-xs truncate max-w-[100px]`} title={tx.id}>{tx.id}</td>
                                            <td className={`${tableCellClasses} text-right font-medium`}>{formatCurrency(tx.amount)}</td>
                                            <td className={`${tableCellClasses} text-center`}>{renderStatusBadge(tx.status, 'transaction')}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                 </div>
            </div> {/* End Right Column */}

          </div> {/* End Grid */}

          {/* Modal Footer */}
          <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300">
              Close
            </button>
          </div>
        </div> {/* End Modal Content Box */}
    </div> // <--- End Modal Backdrop div
  ); // <--- *** FIXED: This is the closing parenthesis for the main return JSX block ***
}; // <--- *** FIXED: This is the closing brace for the component function body ***

export default MerchantDetailModal;