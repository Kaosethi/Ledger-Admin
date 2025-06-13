// Example: src/components/tabs/DashboardTab.tsx

import React, { useMemo } from 'react';
import DonutChart from '@/components/DonutChart';
import TimeSeriesChart from '@/components/TimeSeriesChart';
// Ensure Merchant and BackendMerchantStatus are imported correctly
// (likely from @/lib/mockData if you changed it there, or @/lib/types)
import type { Account, Transaction, BackendMerchantStatus } from '@/lib/mockData';

// TEMP: Extend Merchant type locally to include balance for dashboard settlement card
export type MerchantWithBalance = {
  id: string;
  businessName: string;
  status: BackendMerchantStatus;
  balance?: number | string; // <-- Add this property for dashboard use only
  // ...other fields as needed
};

// TEMP: Define Beneficiary type locally since it's not exported from mockData
export type Beneficiary = {
  id: string;
  status: string;
  balance: number | string;
  // Add any other fields as needed
};


// ... other props for DashboardTab ...
interface DashboardTabProps {
  accounts: Account[];
  merchants: MerchantWithBalance[];
  transactions: Transaction[];
  beneficiaries: Beneficiary[];
  accountsLoading?: boolean;
  merchantsLoading?: boolean;
  transactionsLoading?: boolean;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  accounts = [],
  merchants = [],
  transactions = [],
  beneficiaries = [],
  accountsLoading = false,
  merchantsLoading = false,
  transactionsLoading = false,
}) => {
  // --- Beneficiary stats ---
  const totalBeneficiaries = useMemo(() => beneficiaries.length, [beneficiaries]);
  const pendingApprovalBeneficiaries = useMemo(() => beneficiaries.filter(b => b.status === "pending_approval").length, [beneficiaries]);
  const sumBeneficiaryBalances = useMemo(() => beneficiaries.reduce((sum, b) => sum + (typeof b.balance === 'string' ? parseFloat(b.balance) : b.balance || 0), 0), [beneficiaries]);

  // Sum of all balances for merchants (for settlement)
  const sumMerchantBalances = useMemo(() => merchants.reduce((sum, m) => sum + (typeof m.balance === 'string' ? parseFloat(m.balance) : m.balance || 0), 0), [merchants]);
  const suspendedBeneficiaries = useMemo(() => beneficiaries.filter(b => b.status === "suspended").length, [beneficiaries]);

  // --- Merchant stats ---
  const activeMerchantsCount = useMemo(() => merchants.filter((m) => m.status === "active").length, [merchants]);
  const pendingApprovalMerchantsCount = useMemo(() => merchants.filter((m) => m.status === "pending_approval").length, [merchants]);
  const suspendedMerchants = useMemo(() => merchants.filter(m => m.status === "suspended").length, [merchants]);

  // --- Transaction stats ---
  const totalTransactions = useMemo(() => transactions.length, [transactions]);
  const totalTransactionVolume = useMemo(() => transactions.reduce((sum, tx) => {
    const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0), [transactions]);

  // --- Suspended total ---
  const totalSuspended = suspendedBeneficiaries + suspendedMerchants;

  // --- Format currency as THB ---
  const formatTHB = (amount: number) => amount.toLocaleString('th-TH', { style: 'currency', currency: 'THB' });

  // If still loading, you might want to show skeletons for the summary cards
  if (accountsLoading || merchantsLoading || transactionsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Placeholder for 4 summary cards */}
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
      {/* Summary Cards Section */}
      {/* TOP ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6 mb-6">
        {/* 1. Total Beneficiary Accounts */}
        <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 min-w-[180px]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 text-2xl">👥</span>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Beneficiary Accounts</div>
              <div className="text-3xl font-bold text-gray-900 leading-tight">{totalBeneficiaries}</div>
              <div className="text-xs text-gray-400">Total beneficiaries</div>
            </div>
          </div>
        </div>
        {/* 2. Pending Approval for Beneficiary Accounts */}
        <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 min-w-[180px]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 text-2xl">⏳</span>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Pending Beneficiaries</div>
              <div className="text-3xl font-bold text-gray-900 leading-tight">{pendingApprovalBeneficiaries}</div>
              <div className="text-xs text-gray-400">Awaiting approval</div>
            </div>
          </div>
        </div>
        {/* 3. Sum of All Balance for Beneficiaries */}
        <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 min-w-[180px]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 text-2xl">💵</span>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Beneficiary Balance</div>
              <div className="text-3xl font-bold text-gray-900 leading-tight">{formatTHB(sumBeneficiaryBalances)}</div>
              <div className="text-xs text-gray-400">Sum of all balances</div>
            </div>
          </div>
        </div>
        {/* 4. Total Number of Transactions */}
        <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 min-w-[180px]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 text-2xl">🔢</span>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Total Transactions</div>
              <div className="text-3xl font-bold text-gray-900 leading-tight">{totalTransactions}</div>
              <div className="text-xs text-gray-400">All time</div>
            </div>
          </div>
        </div>
        {/* Active Merchants */}
        <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 min-w-[180px]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 text-2xl">🏪</span>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Active Merchants</div>
              <div className="text-3xl font-bold text-gray-900 leading-tight">{activeMerchantsCount}</div>
              <div className="text-xs text-gray-400">Ready to process transactions</div>
            </div>
          </div>
        </div>
        {/* Pending Merchant Approvals */}
        <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 min-w-[180px]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 text-2xl">🛒</span>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Merchant Approvals</div>
              <div className="text-3xl font-bold text-gray-900 leading-tight">{pendingApprovalMerchantsCount}</div>
              <div className="text-xs text-gray-400">Merchants awaiting approval</div>
            </div>
          </div>
        </div>
        {/* Pending Merchant Approvals */}
        <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 min-w-[180px]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 text-2xl">🛒</span>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Merchant Approvals</div>
              <div className="text-3xl font-bold text-gray-900 leading-tight">{pendingApprovalMerchantsCount}</div>
              <div className="text-xs text-gray-400">Merchants awaiting approval</div>
            </div>
          </div>
        </div>
        {/* Total Transaction Value */}
        <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-2 min-w-[180px]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 text-2xl">💰</span>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Transaction Value</div>
              <div className="text-3xl font-bold text-gray-900 leading-tight">{totalTransactionVolume.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</div>
              <div className="text-xs text-gray-400">Sum of all transactions</div>
            </div>
          </div>
        </div>

      </div>

      {/* You can add more sections to the dashboard here, like recent activity, charts, etc. */}
      {/* For example:
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        ... component to display recent activity ...
      </div>
      */}
      {/* Charts Section: Donut + Time Series Side by Side */}
      <div className="mt-8 flex flex-col lg:flex-row gap-8 w-full">
        <div className="flex-shrink-0 flex justify-center lg:justify-start">
          <DonutChart transactions={transactions} />
        </div>
        <div className="flex-1 flex items-center">
          <TimeSeriesChart transactions={transactions} />
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;