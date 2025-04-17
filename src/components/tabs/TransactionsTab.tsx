import React from 'react';
import type { Transaction, Merchant } from '@/lib/mockData'; // Import types

// Define props expected by this tab
interface TransactionsTabProps {
  transactions: Transaction[];
  merchants: Merchant[]; // Added based on AdminDashboard usage
}

// Use React.FC and the props interface
const TransactionsTab: React.FC<TransactionsTabProps> = ({ transactions, merchants }) => {
  return (
    <div>
      <h2>Transactions Tab Content</h2>
      <p>Content for viewing transactions goes here.</p>
       <ul>
        {transactions.map(t => (
          <li key={t.id}>{t.type} - ${t.amount} ({t.timestamp})</li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionsTab;