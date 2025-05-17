// src/components/modals/TransactionDetailModal.tsx
import React from "react";
// This MUST be the "rich" Transaction type from lib/mockData.ts
// which includes paymentId, and Date objects for timestamps, string for amount.
import type { Transaction, Account, Merchant } from "@/lib/mockData"; 
import {
  formatCurrency,
  formatDateTime, // Using this for Date & Time
  renderStatusBadge,
  tuncateUUID, // Using your specified spelling
} from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  // Optional: Pass looked-up account and merchant if readily available
  // This avoids needing to pass the whole arrays or do lookups inside the modal
  account?: Account | null; 
  merchant?: Merchant | null;
}

// Helper for rendering detail items consistently
const DetailItem: React.FC<{ label: string; value?: string | React.ReactNode; valueClassName?: string; fullWidthValue?: boolean }> = ({
  label,
  value,
  valueClassName = "text-gray-900",
  fullWidthValue = false,
}) => (
  <>
    <dt className="font-medium text-gray-500">{label}</dt>
    <dd className={`mt-1 ${fullWidthValue ? 'sm:col-span-2' : 'sm:col-span-1'} ${valueClassName} break-words`}>
      {value === undefined || value === null || value === "" ? "N/A" : value}
    </dd>
  </>
);


const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  account,  // Consuming optional looked-up account
  merchant, // Consuming optional looked-up merchant
}) => {
  if (!isOpen || !transaction) return null;

  const { date, time } = formatDateTime(transaction.timestamp); // tx.timestamp is Date
  const amountValue = parseFloat(transaction.amount); // tx.amount is string

  const showDeclineReason = 
    (transaction.status === "Failed" || transaction.status === "Declined") && 
    transaction.declineReason;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-white p-0"> {/* Increased max-width slightly */}
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Transaction Details
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 text-sm max-h-[70vh] overflow-y-auto"> {/* Added max-height and scroll */}
          {/* Section 1: Overview */}
          <div className="mb-4">
            <h4 className="text-md font-semibold text-gray-700 mb-2 border-b pb-1">Overview</h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              <DetailItem label="Payment ID:" value={tuncateUUID(transaction.paymentId)} valueClassName="font-mono"/>
              <DetailItem label="Date & Time:" value={`${date} ${time}`} />
              <DetailItem label="Status:" value={renderStatusBadge(transaction.status, "transaction")} />
              <DetailItem label="Type:" value={transaction.type} />
              <DetailItem label="Amount:" value={`THB ${formatCurrency(Math.abs(amountValue))}`} valueClassName="font-semibold"/>
            </dl>
          </div>

          {/* Section 2: Parties */}
          <div className="mb-4">
            <h4 className="text-md font-semibold text-gray-700 mb-2 border-b pb-1">Parties Involved</h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              <DetailItem label="Account Name:" value={account?.childName} />
              <DetailItem label="Account ID:" value={account?.displayId || (transaction.accountId ? tuncateUUID(transaction.accountId) : undefined)} valueClassName="font-mono"/>
              <DetailItem label="Merchant Name:" value={merchant?.businessName} />
              <DetailItem label="Merchant ID:" value={transaction.merchantId ? tuncateUUID(transaction.merchantId) : undefined} valueClassName="font-mono"/>
            </dl>
          </div>
          
          {/* Section 3: Details */}
          <div className="mb-4">
            <h4 className="text-md font-semibold text-gray-700 mb-2 border-b pb-1">Details</h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              {/* Description will now hold the category */}
              <DetailItem label="Category/Purpose:" value={transaction.description} fullWidthValue={true}/> 
              <DetailItem label="System Txn ID:" value={tuncateUUID(transaction.id)} valueClassName="font-mono"/>
            </dl>
          </div>

          {/* Conditional Section: Decline Information */}
          {showDeclineReason && (
            <div className="mb-4">
              <h4 className="text-md font-semibold text-red-700 mb-2 border-b border-red-300 pb-1">Decline Information</h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2"> {/* Single column for decline reason */}
                <DetailItem label="Decline Reason:" value={transaction.declineReason} valueClassName="text-red-600" fullWidthValue={true}/>
              </dl>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-gray-50 sm:justify-end">
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