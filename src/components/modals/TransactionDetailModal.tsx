// src/components/modals/TransactionDetailModal.tsx
// FIXED: Corrected status comparison to match Transaction type definition.

import React from "react";
import type { Transaction, Merchant } from "@/lib/mockData"; // Ensure path is correct
import { formatCurrency, formatDdMmYyyy, formatTime } from "@/lib/utils"; // Ensure path is correct

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  // MODIFIED: Removed merchants prop as it wasn't used after changes
  // merchants: Merchant[];
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  // merchants = [], // Removed from destructuring
}) => {
  if (!isOpen || !transaction) return null;

  // Display only merchant ID if it exists
  const merchantDisplay = transaction.merchantId || "N/A";

  // MODIFIED: Status class calculation to use correct status values
  const statusClass =
    transaction.status === "Completed" // Use 'Completed' instead of 'Approved'
      ? "text-green-600 bg-green-100"
      : transaction.status === "Failed" || transaction.status === "Declined" // Group Failed/Declined as red
      ? "text-red-600 bg-red-100"
      : transaction.status === "Pending" // Handle Pending specifically
      ? "text-yellow-600 bg-yellow-100"
      : "text-gray-600 bg-gray-100"; // Default/fallback

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="relative mx-auto p-6 border w-full max-w-lg shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Transaction Details
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
             {/* Close Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body Content */}
        <div className="space-y-3 text-sm">
          {/* Date */}
          <div className="grid grid-cols-3 gap-x-4">
            <dt className="font-medium text-gray-500">Date:</dt>
            <dd className="col-span-2 text-gray-900">{formatDdMmYyyy(transaction.timestamp)}</dd>
          </div>
          {/* Time */}
          <div className="grid grid-cols-3 gap-x-4">
            <dt className="font-medium text-gray-500">Time:</dt>
            <dd className="col-span-2 text-gray-900">{formatTime(transaction.timestamp)}</dd>
          </div>
          {/* Merchant ID */}
          <div className="grid grid-cols-3 gap-x-4">
            <dt className="font-medium text-gray-500">Merchant ID:</dt>
            <dd className="col-span-2 text-gray-900 font-mono">{merchantDisplay}</dd>
          </div>
          {/* Account ID */}
          <div className="grid grid-cols-3 gap-x-4">
            <dt className="font-medium text-gray-500">Account ID:</dt>
            <dd className="col-span-2 text-gray-900 font-mono">{transaction.accountId}</dd>
          </div>
          {/* Transaction ID */}
          <div className="grid grid-cols-3 gap-x-4">
            <dt className="font-medium text-gray-500">Transaction ID:</dt>
            <dd className="col-span-2 text-gray-900 font-mono">{transaction.id}</dd>
          </div>
           {/* Type */}
          <div className="grid grid-cols-3 gap-x-4">
            <dt className="font-medium text-gray-500">Type:</dt>
            <dd className="col-span-2 text-gray-900">{transaction.type}</dd>
          </div>
           {/* Description */}
          <div className="grid grid-cols-3 gap-x-4">
            <dt className="font-medium text-gray-500">Description:</dt>
            <dd className="col-span-2 text-gray-900">{transaction.description || 'N/A'}</dd>
          </div>
           {/* Status */}
          <div className="grid grid-cols-3 gap-x-4 items-center">
            <dt className="font-medium text-gray-500">Status:</dt>
            <dd className="col-span-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                {transaction.status}
              </span>
            </dd>
          </div>
           {/* Amount */}
          <div className="grid grid-cols-3 gap-x-4">
            <dt className="font-medium text-gray-500">Amount:</dt>
            <dd className="col-span-2 text-gray-900 font-semibold">
              {/* Show sign based on type */}
              {(transaction.type === 'Credit' || (transaction.type === 'Adjustment' && transaction.amount > 0)) ? '+' : '-'}
              {formatCurrency(Math.abs(transaction.amount))}
            </dd>
          </div>
           {/* Decline Reason (Optional) */}
           {transaction.declineReason && (
             <div className="grid grid-cols-3 gap-x-4">
                <dt className="font-medium text-gray-500">Decline Reason:</dt>
                <dd className="col-span-2 text-red-700">{transaction.declineReason}</dd>
              </div>
           )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end pt-4 border-t">
          <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;