import React from 'react';
import type { Account, Merchant, Transaction } from '@/lib/mockData'; // Import types

// Define props expected by this tab
interface DashboardTabProps {
  accounts: Account[];
  merchants: Merchant[];
  transactions: Transaction[];
}

// Use React.FC and the props interface
const DashboardTab: React.FC<DashboardTabProps> = ({ accounts, merchants, transactions }) => {
  return (
    <div>
      <h2>Dashboard Tab Content</h2>
      <p>Showing {accounts.length} accounts, {merchants.length} merchants, {transactions.length} transactions.</p>
      {/* Add actual dashboard widgets/info later */}
    </div>
  );
};

export default DashboardTab;