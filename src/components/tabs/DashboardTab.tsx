// src/app/components/tabs/DashboardTab.tsx
import React from "react";
import type { Account, Merchant, Transaction } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils"; // Assuming utils file

interface DashboardTabProps {
  accounts: Account[];
  merchants: Merchant[];
  transactions: Transaction[];
  // Add props for date filter state and handlers
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  accounts = [],
  merchants = [],
  transactions = [],
}) => {
  // --- Calculations (Placeholder - implement filtering based on props/state) ---
  const totalAccounts = accounts.length;
  const activeMerchants = merchants.filter((m) => m.status === "active").length;
  const pendingMerchants = merchants.filter(
    (m) => m.status === "pending_approval"
  ).length;
  const filteredTransactions = transactions; // Needs actual filtering
  const approvedTransactions = filteredTransactions.filter(
    (tx) => tx.status === "Approved"
  );
  const totalTxCount = filteredTransactions.length;
  const totalTxValue = approvedTransactions.reduce(
    (sum, tx) => sum + (tx.amount || 0),
    0
  );
  const avgTxValue =
    approvedTransactions.length > 0
      ? totalTxValue / approvedTransactions.length
      : 0;
  // --- End Calculations ---

  return (
    // Added classes from #dashboard-tab div
    <div className="bg-gray-100 p-6 lg:p-8 rounded-lg">
      {/* Header section - Added layout classes */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="mt-1 text-base text-gray-500">
            Overview of system activity and performance.
          </p>
        </div>
        {/* Added layout classes */}
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
          <div>
            <label
              htmlFor="db-start-date-filter"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Date Range From:
            </label>
            {/* Added common input field classes */}
            <input
              type="date"
              id="db-start-date-filter"
              className="px-3 py-1.5 block w-full sm:w-auto text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label
              htmlFor="db-end-date-filter"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              To:
            </label>
            <input
              type="date"
              id="db-end-date-filter"
              className="px-3 py-1.5 block w-full sm:w-auto text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid - Added layout classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stat Cards - Added classes directly from Admin.txt card divs */}
        {/* Card 1: Beneficiaries */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Beneficiaries
            </span>
            <span className="p-2 bg-blue-100 rounded-full text-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </span>
          </div>
          <div
            id="db-total-accounts"
            className="text-4xl font-bold text-gray-900"
          >
            {totalAccounts}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Total registered accounts
          </p>
        </div>

        {/* Card 2: Active Merchants */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Active Merchants
            </span>
            <span className="p-2 bg-green-100 rounded-full text-green-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                {" "}
                <path
                  fillRule="evenodd"
                  d="M10.496 2.132a1 1 0 00-.992 0l-7 4A1 1 0 003 7v1.132a1 1 0 00.91.996l.884.066A5.002 5.002 0 0110 12a5 5 0 015.207-4.806l.884-.066A1 1 0 0017 8.132V7a1 1 0 00-.496-.868l-7-4z"
                  clipRule="evenodd"
                />
                <path d="M4 13a1 1 0 00-1 1v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-1-1H4z" />
              </svg>
            </span>
          </div>
          <div
            id="db-active-merchants"
            className="text-4xl font-bold text-gray-900"
          >
            {activeMerchants}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Ready to process transactions
          </p>
        </div>

        {/* Card 3: Pending Merchants */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Pending Merchants
            </span>
            <span className="p-2 bg-yellow-100 rounded-full text-yellow-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
          <div
            id="db-pending-merchants"
            className="text-4xl font-bold text-gray-900"
          >
            {pendingMerchants}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Applications awaiting approval
          </p>
        </div>

        {/* Card 4: Transactions */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Transactions
            </span>
            <span className="p-2 bg-indigo-100 rounded-full text-indigo-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </span>
          </div>
          <div
            id="db-total-transactions"
            className="text-4xl font-bold text-gray-900"
          >
            {totalTxCount}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Total (Approved & Declined)
          </p>
          <p className="mt-1 text-xs text-primary">(Selected Date Range)</p>
        </div>

        {/* Card 5: Total Value */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Total Value
            </span>
            <span className="p-2 bg-purple-100 rounded-full text-purple-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
          <div
            id="db-total-tx-value"
            className="text-4xl font-bold text-gray-900"
          >
            {formatCurrency(totalTxValue)}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Sum of approved transactions
          </p>
          <p className="mt-1 text-xs text-primary">(Selected Date Range)</p>
        </div>

        {/* Card 6: Average Value */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition duration-300 ease-in-out hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Average Value
            </span>
            <span className="p-2 bg-pink-100 rounded-full text-pink-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-.567-.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm.002-4.217a1.5 1.5 0 01-.839-2.804 1.5 1.5 0 01.839-2.804.25.25 0 00.161-.452 6.5 6.5 0 100 6.514.25.25 0 00-.161-.452z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>
          <div
            id="db-avg-tx-value"
            className="text-4xl font-bold text-gray-900"
          >
            {formatCurrency(avgTxValue)}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Average approved transaction
          </p>
          <p className="mt-1 text-xs text-primary">(Selected Date Range)</p>
        </div>
      </div>

      {/* Chart Placeholder - Added classes */}
      <div className="mt-8 p-6 bg-white rounded-xl shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Activity Trends
        </h3>
        {/* Use aspect-[16/6] for Tailwind v3+ aspect ratio */}
        <div className="aspect-[16/6] bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
          <div className="text-center px-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-gray-400 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
            <p className="text-sm text-gray-500">
              Chart visualizations will be displayed here.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              (Requires charting library)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
