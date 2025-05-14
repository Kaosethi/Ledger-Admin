// Example: src/components/tabs/DashboardTab.tsx

import React, { useMemo } from 'react';
// Ensure Merchant and BackendMerchantStatus are imported correctly
// (likely from @/lib/mockData if you changed it there, or @/lib/types)
import type { Account, Merchant, Transaction, BackendMerchantStatus } from '@/lib/mockData'; 

// ... other props for DashboardTab ...
interface DashboardTabProps {
  accounts: Account[];
  merchants: Merchant[]; // This merchants prop is an array of API-aligned Merchant objects
  transactions: Transaction[];
  // Add loading states if this component shows skeletons
  accountsLoading?: boolean;
  merchantsLoading?: boolean;
  transactionsLoading?: boolean;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  accounts = [],
  merchants = [],
  transactions = [],
  accountsLoading = false, // Example default
  merchantsLoading = false,
  transactionsLoading = false,
}) => {

  const totalAccounts = useMemo(() => accounts.length, [accounts]);
  
  // MODIFIED: Use the correct backend status string "active"
  const activeMerchantsCount = useMemo(
    () => merchants.filter((m) => m.status === "active").length, // Use "active" (lowercase)
    [merchants]
  );

  // MODIFIED: Use the correct backend status string "pending_approval"
  const pendingApprovalMerchantsCount = useMemo(
    () => merchants.filter((m) => m.status === "pending_approval").length, // Use "pending_approval"
    [merchants]
  );

  const totalTransactions = useMemo(() => transactions.length, [transactions]);
  
  // Example: Calculate total transaction volume
  const totalTransactionVolume = useMemo(() => {
    return transactions.reduce((sum, tx) => {
      // Ensure tx.amount is a number; parse if it's a string from API
      const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  }, [transactions]);


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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Example Summary Card for Accounts */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Accounts</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{totalAccounts}</p>
        </div>

        {/* Example Summary Card for Active Merchants */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Merchants</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{activeMerchantsCount}</p>
        </div>

        {/* Example Summary Card for Pending Approvals */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Pending Approvals</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{pendingApprovalMerchantsCount}</p>
        </div>

        {/* Example Summary Card for Total Transactions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{totalTransactions}</p>
          {/* Optionally, display total volume */}
          {/* <p className="text-sm text-gray-500">Volume: {formatCurrency(totalTransactionVolume)}</p> */}
        </div>
      </div>

      {/* You can add more sections to the dashboard here, like recent activity, charts, etc. */}
      {/* For example:
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        {/* ... component to display recent activity ... * /
      </div>
      */}
    </div>
  );
};

export default DashboardTab;