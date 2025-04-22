// src/components/modals/TransactionDetailModal.tsx
import React from "react";
import type { Transaction, Merchant } from "@/lib/mockData";
// MODIFIED: Import specific formatters from utils
import { formatCurrency, formatDdMmYyyy, formatTime } from "@/lib/utils";

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  merchants: Merchant[];
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  if (!isOpen || !transaction) return null;

  // MODIFIED: Display only merchant ID in modal as well to match table
  const merchantDisplay = transaction.merchantId || "N/A";
  // const merchantDisplay = merchant
  //  ? `${merchant.businessName} (${merchant.id})`
  //  : `Unknown/Inactive (${transaction.merchantId})`;

  const statusClass =
    transaction.status === "Approved"
      ? "text-green-600 bg-green-100"
      : transaction.status === "Declined"
      ? "text-red-600 bg-red-100"
      : "text-gray-600 bg-gray-100";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="relative mx-auto p-6 border w-full max-w-lg shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Transaction Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {/* MODIFIED: Reordered Body Content */}
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-3 gap-x-4">
            <dt className="font-medium text-gray-500">Date:</dt>
            {/* Use new formatter */}
            <dd className="col-span-2 text-gray-900">
              {formatDdMmYyyy(transaction.timestamp)}
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-x-4">
            <dt className="font-medium text-gray-500">Time:</dt>
            {/* Use new formatter */}
            <dd className="col-span-2 text-gray-900">
              {formatTime(transaction.timestamp)}
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-x-4">
            <dt className="font-medium text-gray-500">Merchant ID:</dt>
            {/* Display only ID */}
            <dd className="col-span-2 text-gray-900 font-mono">
              {merchantDisplay}
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-x-4">
            <dt className="font-medium text-gray-500">Account ID:</dt>
            <dd className="col-span-2 text-gray-900 font-mono">
              {transaction.accountId}
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-x-4">
            <dt className="font-medium text-gray-500">Transaction ID:</dt>
            <dd className="col-span-2 text-gray-900 font-mono">
              {transaction.id}
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-x-4 items-center">
            <dt className="font-medium text-gray-500">Status:</dt>
            <dd className="col-span-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}
              >
                {transaction.status}
              </span>
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-x-4">
            <dt className="font-medium text-gray-500">Amount:</dt>
            {/* Kept amount here as it's important detail */}
            <dd className="col-span-2 text-gray-900 font-semibold">
              {formatCurrency(transaction.amount)}
            </dd>
          </div>
          {/* Optional: Add other fields */}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
