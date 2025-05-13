// src/components/modals/TransactionDetailModal.tsx
// REFINED: UI using shadcn/ui Dialog components and Tailwind CSS for better presentation.
// FIXED: Ensure amount uses formatCurrency with Math.abs() and defaults to THB/฿.
// ADDED: Use renderStatusBadge utility for consistent status display.
// FIXED: Removed incorrect import and type assertion for TransactionStatus.

import React from "react";
import type { Transaction } from "@/lib/mockData";
// REMOVED: Incorrect import for TransactionStatus
import {
  formatCurrency,
  formatDdMmYyyy,
  formatTime,
  renderStatusBadge, // ADDED: Import renderStatusBadge
} from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose, // ADDED: For the close button
} from "@/components/ui/dialog"; // ADDED: Shadcn Dialog components
import { Button } from "@/components/ui/button"; // ADDED: Shadcn Button

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  // Handle modal visibility using the Dialog's 'open' prop controlled by 'isOpen'
  if (!transaction) return null; // Don't render if no transaction

  // Use merchantId directly if available
  const merchantDisplay = transaction.merchantId || "N/A";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Transaction Details
          </DialogTitle>
          {/* Optional: Add DialogDescription here if needed */}
          {/* <DialogDescription>Details for transaction {transaction.id}</DialogDescription> */}
        </DialogHeader>

        {/* Body Content - Use dl for semantic key-value pairs */}
        <div className="p-6 space-y-4 text-sm">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
            {/* Date */}
            <dt className="font-medium text-gray-500">Date</dt>
            <dd className="sm:col-span-2 text-gray-900">
              {formatDdMmYyyy(transaction.timestamp)}
            </dd>

            {/* Time */}
            <dt className="font-medium text-gray-500">Time</dt>
            <dd className="sm:col-span-2 text-gray-900">
              {formatTime(transaction.timestamp)}
            </dd>

            {/* Merchant ID */}
            <dt className="font-medium text-gray-500">Merchant ID</dt>
            <dd className="sm:col-span-2 text-gray-900 font-mono">
              {merchantDisplay}
            </dd>

            {/* Account ID */}
            <dt className="font-medium text-gray-500">Account ID</dt>
            <dd className="sm:col-span-2 text-gray-900 font-mono">
              {transaction.accountId}
            </dd>

            {/* Transaction ID */}
            <dt className="font-medium text-gray-500">Transaction ID</dt>
            <dd className="sm:col-span-2 text-gray-900 font-mono break-all">
              {transaction.id}
            </dd>

            {/* Type */}
            <dt className="font-medium text-gray-500">Type</dt>
            <dd className="sm:col-span-2 text-gray-900">{transaction.type}</dd>

            {/* Description */}
            <dt className="font-medium text-gray-500">Description</dt>
            <dd className="sm:col-span-2 text-gray-900">
              {transaction.description || "N/A"}
            </dd>

            {/* Status */}
            <dt className="font-medium text-gray-500 self-center">Status</dt>
            <dd className="sm:col-span-2">
              {/* Use renderStatusBadge utility */}
              {/* REMOVED: Incorrect type assertion */}
              {renderStatusBadge(transaction.status, "transaction")}
            </dd>

            {/* Amount */}
            <dt className="font-medium text-gray-500">Amount</dt>
            <dd className="sm:col-span-2 text-gray-900 font-semibold text-base">
              {/* MODIFIED: Removed manual +/- sign. Use formatCurrency with absolute value */}
              {/* formatCurrency defaults to THB/฿ from utils.ts */}
              {formatCurrency(Math.abs(transaction.amount))}
            </dd>

            {/* Decline Reason (Optional) */}
            {transaction.declineReason && (
              <>
                <dt className="font-medium text-gray-500">Decline Reason</dt>
                <dd className="sm:col-span-2 text-red-700">
                  {transaction.declineReason}
                </dd>
              </>
            )}
          </dl>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-gray-50 sm:justify-end">
          {/* Use DialogClose for accessibility benefits */}
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailModal;