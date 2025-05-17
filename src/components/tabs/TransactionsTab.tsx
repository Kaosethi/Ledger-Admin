// src/components/tabs/TransactionsTab.tsx
"use client";
import React, { useState } from "react"; // CORRECT
import type { Transaction, Merchant, Account } from "@/lib/mockData";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
    formatCurrency, 
    formatDateTime,
    renderStatusBadge,
    tuncateUUID 
} from "@/lib/utils";
import TransactionDetailModal from "../modals/TransactionDetailModal";

interface TransactionsTabProps {
  transactions: Transaction[];    // EXPECTING RICH TRANSACTION TYPE HERE
  merchants: Merchant[];
  accounts: Account[];
  transactionsLoading?: boolean;
  accountsLoading?: boolean;     // ADDED to accept from page.tsx
  merchantsLoading?: boolean;    // ADDED to accept from page.tsx
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions = [],
  merchants = [],
  accounts = [],
  transactionsLoading = false,
  accountsLoading = false,     // Initialize, though not used for skeletons yet
  merchantsLoading = false,    // Initialize, though not used for skeletons yet
}) => {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTransactionForDetail, setSelectedTransactionForDetail] = useState<Transaction | null>(null);

  const handleViewDetailsClick = (transaction: Transaction) => {
    setSelectedTransactionForDetail(transaction);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setTimeout(() => setSelectedTransactionForDetail(null), 300); 
  };

  // For simplicity, we'll still primarily use transactionsLoading for the main table skeleton.
  // accountsLoading and merchantsLoading are now available if you want to add more specific
  // loading indicators later (e.g., a spinner in a cell if merchant name is still loading).
  const showOverallSkeletons = transactionsLoading; // Could be: transactionsLoading || accountsLoading || merchantsLoading;

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        {/* Filters and other controls will be re-added here based on the more complete version */}
      </div>

      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead className="w-[80px]">Time</TableHead>
              <TableHead className="w-[150px]">Account ID</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead className="w-[150px]">Merchant ID</TableHead>
              <TableHead>Merchant Name</TableHead>
              <TableHead className="text-right w-[120px]">Amount</TableHead>
              <TableHead className="text-center w-[120px]">Status</TableHead>
              <TableHead className="w-[180px]">Payment ID</TableHead>
              <TableHead className="text-center w-[100px]">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showOverallSkeletons ? ( // Using the combined or primary loading state
              Array.from({ length: 5 }).map((_, i) => ( // Number of skeleton rows
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))
            ) : transactions && transactions.length > 0 ? (
              transactions.map((tx) => {
                // Assuming tx.timestamp is a Date object from the rich Transaction type
                const { date, time } = formatDateTime(tx.timestamp);
                const account = accounts.find(acc => acc.id === tx.accountId);
                const merchant = merchants.find(m => m.id === tx.merchantId);
                // Assuming tx.amount is a string from the rich Transaction type
                const amountValue = parseFloat(tx.amount);

                return (
                  <TableRow key={tx.id}>
                    <TableCell>{date}</TableCell>
                    <TableCell>{time}</TableCell>
                    <TableCell title={account?.id || ""}>
                      {account?.displayId || (tx.accountId ? tuncateUUID(tx.accountId) : "N/A")}
                    </TableCell>
                    <TableCell>{account?.childName || "N/A"}</TableCell>
                    <TableCell title={merchant?.id || ""}>
                      {tx.merchantId ? tuncateUUID(tx.merchantId) : "N/A"}
                    </TableCell>
                    <TableCell>{merchant?.businessName || (tx.merchantId ? "Unknown" : "N/A")}</TableCell>
                    <TableCell className={`text-right font-medium ${tx.type === "Credit" || (tx.type === "Adjustment" && amountValue > 0) ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "Credit" || (tx.type === "Adjustment" && amountValue > 0) ? "+" : "-"}
                      {formatCurrency(Math.abs(amountValue))}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderStatusBadge(tx.status, "transaction")}
                    </TableCell>
                    {/* This should be tx.paymentId from the rich Transaction type */}
                    <TableCell className="font-mono text-xs" title={tx.paymentId}> 
                      {tuncateUUID(tx.paymentId)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetailsClick(tx)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-gray-500 py-10">
                  No transactions available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination will go here later */}

      {selectedTransactionForDetail && (
        <TransactionDetailModal
            isOpen={isDetailModalOpen}
            onClose={handleCloseDetailModal}
            transaction={selectedTransactionForDetail}
        />
      )}
    </div>
  );
};

export default TransactionsTab;