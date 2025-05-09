// src/components/tabs/TransactionsTab.tsx
// MODIFIED: Removed whitespace in thead, removed 'Type' column, adjusted colspan, removed Type from export

import React, { useState, useMemo } from "react";
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
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionsTabProps {
  transactions: Transaction[];
  merchants: Merchant[];
  accounts: Account[];
  transactionsLoading?: boolean;
  accountsLoading?: boolean;
  merchantsLoading?: boolean;
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions = [],
  merchants = [],
  accounts = [],
  transactionsLoading = false,
  accountsLoading = false,
  merchantsLoading = false,
}) => {
  // --- State for Filters ---
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [merchantIdSearchTerm, setMerchantIdSearchTerm] = useState("");
  const [accountIdSearchTerm, setAccountIdSearchTerm] = useState("");

  // State for Details Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  // --- Filtered Transactions ---
  const filteredTransactions = useMemo(() => {
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

  // --- Event Handlers ---
  const handleMerchantIdSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setMerchantIdSearchTerm(e.target.value);
  };
  const handleAccountIdSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAccountIdSearchTerm(e.target.value);
  };

  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setMerchantIdSearchTerm("");
    setAccountIdSearchTerm("");
  };

  const handleViewDetailsClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailModalOpen(true);
  };
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleExport = () => {
    if (filteredTransactions.length === 0) {
      alert("No transactions to export based on current filters.");
      return;
    }
    console.log(
      `Exporting ${filteredTransactions.length} filtered transactions...`
    );
    const csvData = filteredTransactions.map((tx) => {
      const merchant = merchants.find((m) => m.id === tx.merchantId);
      const merchantName = merchant
        ? merchant.name
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
        // Type: tx.type, // REMOVED Type from export data object
        Amount: tx.amount,
        Status: tx.status,
        "Decline Reason": tx.declineReason ?? "",
      };
    });
    // MODIFIED: Updated CSV Headers - Removed Type
    const csvHeaders = [
      "Date",
      "Time",
      "Merchant Name",
      "Merchant ID",
      "Account ID",
      "Transaction ID",
      // "Type", // REMOVED
      "Amount",
      "Status",
      "Decline Reason",
    ];
    try {
      const csvString = unparse(csvData, { header: true, columns: csvHeaders });
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      const timestamp = new Date().toISOString().substring(0, 10);
      link.setAttribute("download", `transactions_export_${timestamp}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log("CSV export successful.");
    } catch (error) {
      console.error("Error generating CSV:", error);
      alert("An error occurred while generating the CSV file.");
    }
  };

  // --- Component Render ---
  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      {/* Header & SINGLE Filter Row Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-800 flex-shrink-0">
          Transaction History
        </h2>
        <div className="flex flex-wrap items-end gap-3 flex-grow">
          {/* Start Date Picker */}
          <div className="flex-grow md:flex-grow-0">
            <Label className="text-xs font-medium text-gray-500 block mb-1">
              Start Date:
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={
                    "w-full sm:w-[160px] justify-start text-left font-normal text-sm" +
                    (!startDate ? " text-muted-foreground" : "")
                  }
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border bg-white z-50">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date: Date) =>
                    Boolean((endDate && date > endDate) || date > new Date())
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* End Date Picker */}
          <div className="flex-grow md:flex-grow-0">
            <Label className="text-xs font-medium text-gray-500 block mb-1">
              End Date:
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={
                    "w-full sm:w-[160px] justify-start text-left font-normal text-sm" +
                    (!endDate ? " text-muted-foreground" : "")
                  }
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border bg-white z-50">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date: Date) =>
                    Boolean(
                      date > new Date() || (startDate && date < startDate)
                    )
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* Merchant ID */}
          <div className="flex-grow">
            <Label
              htmlFor="merchant-id-filter"
              className="text-xs font-medium text-gray-500 block mb-1"
            >
              Merchant ID:
            </Label>
            <input
              type="text"
              id="merchant-id-filter"
              className="block w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
              placeholder="Filter by Merchant ID"
              value={merchantIdSearchTerm}
              onChange={handleMerchantIdSearchChange}
            />
          </div>
          {/* Account ID */}
          <div className="flex-grow">
            <Label
              htmlFor="account-filter"
              className="text-xs font-medium text-gray-500 block mb-1"
            >
              Account ID:
            </Label>
            <input
              type="text"
              id="account-filter"
              className="block w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
              placeholder="Filter by Account ID"
              value={accountIdSearchTerm}
              onChange={handleAccountIdSearchChange}
            />
          </div>
          {/* Action Buttons */}
          <div className="flex items-end gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              onClick={handleClearFilters}
            >
              Clear
            </Button>
            <Button
              id="export-transactions-btn"
              type="button"
              className="py-1 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              onClick={handleExport}
              disabled={filteredTransactions.length === 0}
            >
              Export ({filteredTransactions.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* MODIFIED: Removed 'Type' header, cleaned whitespace */}
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Time
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Merchant Name
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Merchant ID
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Account ID
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Transaction ID
              </th>
              {/* <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th> REMOVED */}
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Details
              </th>
            </tr>
          </thead>
          <tbody
            id="transactions-table-body"
            className="bg-white divide-y divide-gray-200"
          >
            {transactionsLoading ? (
              // Skeleton rows for loading state
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Skeleton className="h-8 w-16 mx-auto" />
                  </td>
                </tr>
              ))
            ) : filteredTransactions.length === 0 ? (
              // MODIFIED: Colspan to match new number of columns (9)
              <tr>
                <td
                  colSpan={9} // Adjusted colspan
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                >
                  {transactions.length === 0
                    ? "No transactions found."
                    : "No transactions match your filters."}
                </td>
              </tr>
            ) : (
              filteredTransactions.map((transaction: Transaction) => {
                const merchant = merchants.find(
                  (m) => m.id === transaction.merchantId
                );
                const merchantName = merchant
                  ? merchant.name
                  : transaction.merchantId
                  ? "Unknown/Inactive Merchant"
                  : "N/A";

                return (
                  <tr key={transaction.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDdMmYyyy(transaction.timestamp)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatTime(transaction.timestamp)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                      {merchantName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                      {transaction.merchantId ?? "N/A"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                      {transaction.accountId}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {transaction.id}
                    </td>
                    {/* REMOVED: Transaction Type cell */}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center">
                      {renderStatusBadge(transaction.status, "transaction")}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center actions">
                      <button
                        className="text-primary hover:text-secondary view-transaction-btn focus:outline-none focus:underline"
                        onClick={() => handleViewDetailsClick(transaction)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700">
          Showing{" "}
          <span id="tx-pagination-start">
            {filteredTransactions.length > 0 ? 1 : 0}
          </span>{" "}
          to{" "}
          <span id="tx-pagination-end">
            {Math.min(10, filteredTransactions.length)}{" "}
            {/* TODO: Implement pagination */}
          </span>{" "}
          of <span id="tx-pagination-total">{filteredTransactions.length}</span>{" "}
          transactions{" "}
          {(startDate ||
            endDate ||
            merchantIdSearchTerm ||
            accountIdSearchTerm) &&
            ` (filtered from ${transactions.length} total)`}
        </div>
        <div className="flex space-x-2">
          {/* TODO: Implement pagination */}
          <button
            disabled={true}
            className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled={true}
            className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Render the Transaction Detail Modal */}
      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default TransactionsTab;
