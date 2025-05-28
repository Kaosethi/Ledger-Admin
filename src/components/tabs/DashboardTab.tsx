// File: src/components/tabs/DashboardTab.tsx

"use client";

import React, { useMemo, useState } from 'react';
import type { Account, Merchant, Transaction } from '@/lib/mockData';
import DonutChart from "../DonutChart";
import { format, isSameDay, isSameWeek, isSameMonth } from 'date-fns';

interface DashboardTabProps {
  accounts: Account[];
  merchants: Merchant[];
  transactions: Transaction[];
  accountsLoading?: boolean;
  merchantsLoading?: boolean;
  transactionsLoading?: boolean;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  accounts = [],
  merchants = [],
  transactions = [],
  accountsLoading = false,
  merchantsLoading = false,
  transactionsLoading = false,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const today = new Date();

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.timestamp);
      if (selectedPeriod === 'daily') return isSameDay(txDate, today);
      if (selectedPeriod === 'weekly') return isSameWeek(txDate, today);
      if (selectedPeriod === 'monthly') return isSameMonth(txDate, today);
      return true;
    });
  }, [transactions, selectedPeriod]);

  const totalAccounts = useMemo(() => accounts.length, [accounts]);
  const activeMerchantsCount = useMemo(() => merchants.filter((m) => m.status === "active").length, [merchants]);
  const pendingApprovalMerchantsCount = useMemo(() => merchants.filter((m) => m.status === "pending_approval").length, [merchants]);
  const totalTransactions = useMemo(() => transactions.length, [transactions]);

  const debitAmount = useMemo(() => {
    return filteredTransactions
      .filter((tx) => tx.type === "Debit" && tx.status === "Completed")
      .reduce((sum, tx) => sum + parseFloat(tx.amount || "0"), 0);
  }, [filteredTransactions]);

  const creditAmount = useMemo(() => {
    return filteredTransactions
      .filter((tx) => tx.type === "Credit" && tx.status === "Completed")
      .reduce((sum, tx) => sum + parseFloat(tx.amount || "0"), 0);
  }, [filteredTransactions]);

  const totalFilteredAmount = useMemo(() => debitAmount + creditAmount, [debitAmount, creditAmount]);

  if (accountsLoading || merchantsLoading || transactionsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-10 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Accounts</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{totalAccounts}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Merchants</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{activeMerchantsCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Pending Approvals</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{pendingApprovalMerchantsCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{totalTransactions}</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Select Period:</label>
        <select
          className="border border-gray-300 rounded p-2"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
        >
          <option value="daily">Today</option>
          <option value="weekly">This Week</option>
          <option value="monthly">This Month</option>
        </select>
      </div>

      {/* Donut Chart Section */}
      <DonutChart debitAmount={debitAmount} creditAmount={creditAmount} />

      {/* Total Value Display */}
      <div className="text-center text-sm text-gray-600">
        Total Transaction Value for {selectedPeriod}: <span className="font-medium">{totalFilteredAmount.toLocaleString("en-US", { style: "currency", currency: "THB" })}</span>
      </div>
    </div>
  );
};

export default DashboardTab;
