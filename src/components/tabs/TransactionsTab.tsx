// src/components/tabs/TransactionsTab.tsx
// MODIFIED: Changed merchant.name to merchant.businessName

import React, { useState, useMemo } from "react";
// Ensure Merchant type imported here is the API-aligned one from mockData.ts
import type { Transaction, Merchant, Account } from "@/lib/mockData"; 
import {
  formatCurrency,
  formatDdMmYyyy,
  formatTime,
  renderStatusBadge,
} from "@/lib/utils";
import { unparse } from "papaparse";
import TransactionDetailModal from "../modals/TransactionDetailModal";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react"; // Loader2 not used, can remove
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionsTabProps {
  transactions: Transaction[];
  merchants: Merchant[]; // This should be API-aligned Merchant[]
  accounts: Account[];
  transactionsLoading?: boolean;
  accountsLoading?: boolean; // Not used directly in this component's rendering logic
  merchantsLoading?: boolean;  // Not used directly in this component's rendering logic
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions = [],
  merchants = [],
  accounts = [], // accounts prop not used in current rendering, consider removing if not needed
  transactionsLoading = false,
  // accountsLoading and merchantsLoading are passed but not used for skeletons here
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [merchantIdSearchTerm, setMerchantIdSearchTerm] = useState("");
  const [accountIdSearchTerm, setAccountIdSearchTerm] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    // ... (filtering logic remains the same) ...
    const lowerCaseAccountIdSearch = accountIdSearchTerm.trim().toLowerCase();
    const lowerCaseMerchantIdSearch = merchantIdSearchTerm.trim().toLowerCase();

    return transactions.filter((tx) => {
      try {
        const txDate = new Date(tx.timestamp);
        txDate.setHours(0, 0, 0, 0);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (txDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(0, 0, 0, 0);
          if (txDate > end) return false;
        }
      } catch (e) {
        console.error("Error parsing transaction date:", tx.timestamp, e);
        return false;
      }
      if (
        lowerCaseMerchantIdSearch &&
        (!tx.merchantId ||
          !tx.merchantId.toLowerCase().includes(lowerCaseMerchantIdSearch))
      )
        return false;
      if (
        lowerCaseAccountIdSearch &&
        (!tx.accountId ||
          !tx.accountId.toLowerCase().includes(lowerCaseAccountIdSearch))
      )
        return false;
      return true;
    });
  }, [
    transactions,
    startDate,
    endDate,
    merchantIdSearchTerm,
    accountIdSearchTerm,
  ]);

  const handleMerchantIdSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setMerchantIdSearchTerm(e.target.value);
  const handleAccountIdSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setAccountIdSearchTerm(e.target.value);
  const handleClearFilters = () => { /* ... */ };
  const handleViewDetailsClick = (transaction: Transaction) => { /* ... */ };
  const handleCloseDetailModal = () => { /* ... */ };

  const handleExport = () => {
    if (filteredTransactions.length === 0) { /* ... */ return; }
    console.log(`Exporting ${filteredTransactions.length} filtered transactions...`);
    const csvData = filteredTransactions.map((tx) => {
      const merchant = merchants.find((m) => m.id === tx.merchantId);
      // MODIFIED: Use merchant.businessName
      const merchantName = merchant
        ? merchant.businessName 
        : tx.merchantId
        ? "Unknown/Inactive Merchant"
        : "N/A";
      return {
        Date: formatDdMmYyyy(tx.timestamp),
        Time: formatTime(tx.timestamp),
        "Merchant Name": merchantName,
        "Merchant ID": tx.merchantId ?? "N/A",
        "Account ID": tx.accountId,
        "Transaction ID": tx.id,
        Amount: tx.amount,
        Status: tx.status,
        "Decline Reason": tx.declineReason ?? "",
      };
    });
    const csvHeaders = [ /* ... */ ];
    try {
      // ... (CSV generation logic) ...
    } catch (error) { /* ... */ }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      {/* ... (Header & Filter Row Section - no changes here for this error) ... */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 flex-shrink-0">Transaction History</h2>
        {/* ... Filter inputs and buttons ... */}
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {/* ... Table Headers ... */}
          </thead>
          <tbody id="transactions-table-body" className="bg-white divide-y divide-gray-200">
            {transactionsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-8 w-16" /></td>
                </tr>
              ))
            ) : filteredTransactions.length === 0 ? (
              <tr><td colSpan={9} /* ... */ >{/* ... No transactions message ... */}</td></tr>
            ) : (
              filteredTransactions.map((transaction: Transaction) => {
                const merchant = merchants.find((m) => m.id === transaction.merchantId);
                // MODIFIED: Use merchant.businessName
                const merchantName = merchant
                  ? merchant.businessName 
                  : transaction.merchantId
                  ? "Unknown/Inactive Merchant"
                  : "N/A";

                return (
                  <tr key={transaction.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formatDdMmYyyy(transaction.timestamp)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{formatTime(transaction.timestamp)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{merchantName}</td>
                    {/* ... other table cells ... */}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ... (Pagination Section and Modals - no changes here for this error) ... */}
      <TransactionDetailModal isOpen={isDetailModalOpen} onClose={handleCloseDetailModal} transaction={selectedTransaction} />
    </div>
  );
};

export default TransactionsTab;