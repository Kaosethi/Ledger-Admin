// src/components/tabs/TransactionsTab.tsx
"use client";
import React from "react";
// TEMPORARILY ASSUMING THE SIMPLER TRANSACTION TYPE
// This type is based on the errors you were seeing (e.g., missing paymentId, createdAt, etc.)
// We will switch back to the "rich" type once lib/mockData.ts is confirmed correct.
import type { Transaction, Merchant, Account } from "@/lib/mockData";

// Shadcn/UI Table components - this import needs to work after `bunx shadcn@latest add table`
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import { formatDdMmYyyy, formatTime, formatCurrency, renderStatusBadge } from "@/lib/utils"; // Basic utils

interface TransactionsTabProps {
  transactions: Transaction[]; // Will be typed with the simpler Transaction for now
  merchants: Merchant[];     // Not heavily used in this minimal version
  accounts: Account[];       // Not heavily used in this minimal version
  transactionsLoading?: boolean;
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions = [],
  merchants = [], // Included for prop consistency but not used extensively here
  accounts = [],  // Included for prop consistency but not used extensively here
  transactionsLoading = false,
}) => {
  // No filtering, pagination, or complex state in this minimal version yet

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
      </div>

      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead className="w-[100px]">Time</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right w-[120px]">Amount</TableHead>
              <TableHead className="text-center w-[120px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactionsLoading ? (
              Array.from({ length: 5 }).map((_, i) => ( // Show 5 skeleton rows
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                </TableRow>
              ))
            ) : transactions && transactions.length > 0 ? (
              transactions.map((tx) => {
                // Assuming tx.timestamp is string and tx.amount is number (older type)
                const displayDate = tx.timestamp ? formatDdMmYyyy(tx.timestamp as string) : "N/A";
                const displayTime = tx.timestamp ? formatTime(tx.timestamp as string) : "N/A";
                // Assuming tx.amount is number for now.
                const amountValue = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount as any || "0");


                return (
                  <TableRow key={tx.id}>
                    <TableCell>{displayDate}</TableCell>
                    <TableCell>{displayTime}</TableCell>
                    <TableCell>{tx.description || "N/A"}</TableCell>
                    <TableCell className={`text-right font-medium ${tx.type === "Credit" || (tx.type === "Adjustment" && amountValue > 0) ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "Credit" || (tx.type === "Adjustment" && amountValue > 0) ? "+" : "-"}
                      {formatCurrency(Math.abs(amountValue))}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderStatusBadge(tx.status, "transaction")}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-10">
                  No transactions available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* No pagination or detail modal in this minimal version */}
    </div>
  );
};

export default TransactionsTab;