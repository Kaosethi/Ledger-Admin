// src/app/components/tabs/TransactionsTab.tsx
import React from "react";
import type { Transaction, Merchant } from "@/lib/mockData";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TransactionsTabProps {
  transactions: Transaction[];
  merchants: Merchant[];
  // Add other props
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions = [],
  merchants = [],
}) => {
  return (
    // Added classes from #transactions-tab div
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header & Filters Section - Added layout classes */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 space-y-3 md:space-y-0">
        <h2 className="text-xl font-semibold text-gray-800">
          Transaction History
        </h2>
        {/* Added layout classes */}
        <div className="flex flex-wrap items-end gap-2">
          {/* Date Filters - Added input field styles */}
          <div>
            <label
              htmlFor="tx-start-date-filter"
              className="text-xs font-medium text-gray-500 mr-1 block mb-1"
            >
              From:
            </label>
            <input
              type="date"
              id="tx-start-date-filter"
              className="block w-auto px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
          <div>
            <label
              htmlFor="tx-end-date-filter"
              className="text-xs font-medium text-gray-500 mr-1 block mb-1"
            >
              To:
            </label>
            <input
              type="date"
              id="tx-end-date-filter"
              className="block w-auto px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
          {/* Merchant Filter - Added select field styles */}
          <div>
            <label
              htmlFor="merchant-filter"
              className="text-xs font-medium text-gray-500 mr-1 block mb-1"
            >
              Merchant:
            </label>
            <select
              id="merchant-filter"
              className="block w-auto pl-3 pr-8 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm text-gray-900 bg-white"
            >
              <option value="">All Merchants</option>
              {merchants
                .filter((m) => m.status === "active")
                .map(
                  (
                    m // Ensure status 'active' matches interface
                  ) => (
                    <option key={m.id} value={m.id}>
                      {m.businessName} ({m.id})
                    </option>
                  )
                )}
            </select>
          </div>
          {/* Account Filter - Added input field styles */}
          <div>
            <label
              htmlFor="account-filter"
              className="text-xs font-medium text-gray-500 mr-1 block mb-1"
            >
              Account ID:
            </label>
            <input
              type="text"
              id="account-filter"
              className="block w-auto px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm text-gray-900 placeholder-gray-400"
              placeholder="Filter by Account ID"
            />
          </div>
          {/* Export Button - Added .btn-primary styles */}
          <button
            id="export-transactions-btn"
            className="py-1 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary self-end mb-[1px]"
          >
            Export
          </button>
        </div>
      </div>

      {/* Table Section - Added overflow */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Added .table-header and .center */}
              <th scope="col" className="table-header">
                Transaction ID
              </th>
              <th scope="col" className="table-header">
                Account ID
              </th>
              <th scope="col" className="table-header">
                Merchant
              </th>
              <th scope="col" className="table-header center">
                Amount
              </th>
              <th scope="col" className="table-header">
                Date/Time
              </th>
              <th scope="col" className="table-header center">
                Status
              </th>
              <th scope="col" className="table-header center">
                Details
              </th>
            </tr>
          </thead>
          <tbody
            id="transactions-table-body"
            className="bg-white divide-y divide-gray-200"
          >
            {transactions.length === 0 ? (
              <tr>
                {/* Added .table-cell and .center */}
                <td colSpan={7} className="table-cell center">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((transaction: Transaction) => {
                // Added type
                const merchant = merchants.find(
                  (m) => m.id === transaction.merchantId
                );
                const merchantName = merchant
                  ? `${merchant.businessName} (${merchant.id})`
                  : `Unknown/Inactive (${transaction.merchantId})`;
                const statusClass =
                  transaction.status === "Approved"
                    ? "text-green-600"
                    : "text-red-600";
                return (
                  <tr key={transaction.id}>
                    {/* Added .table-cell and variants */}
                    <td className="table-cell font-semibold text-gray-900">
                      {transaction.id}
                    </td>
                    <td className="table-cell">{transaction.accountId}</td>
                    <td className="table-cell">{merchantName}</td>
                    <td className="table-cell center">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="table-cell">
                      {formatDate(transaction.timestamp)}
                    </td>
                    <td
                      className={`table-cell center font-medium ${statusClass}`}
                    >
                      {transaction.status}
                    </td>
                    <td className="table-cell actions">
                      {" "}
                      {/* Added .actions */}
                      <button className="text-primary hover:text-secondary view-transaction-btn">
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

      {/* Pagination Section - Added layout and button styles */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700">
          Showing <span id="tx-pagination-start">1</span> to{" "}
          <span id="tx-pagination-end">
            {Math.min(10, transactions.length)}
          </span>{" "}
          of <span id="tx-pagination-total">{transactions.length}</span>{" "}
          transactions
        </div>
        <div className="flex space-x-2">
          <button className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
            Previous
          </button>
          <button className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionsTab;
