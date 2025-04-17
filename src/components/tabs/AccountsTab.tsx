// src/app/components/tabs/AccountsTab.tsx
import React from 'react';
import type { Account } from '@/lib/mockData';

interface AccountsTabProps {
  accounts: Account[];
  onAccountsUpdate: (updatedAccounts: Account[]) => void;
  logAdminActivity: (action: string, targetType: string, targetId: string, details: string) => void;
}

const AccountsTab: React.FC<AccountsTabProps> = ({ accounts, onAccountsUpdate, logAdminActivity }) => {
   const handleUpdateStatus = (accountId: string) => {
    const updated = accounts.map(acc => {
      if (acc.id === accountId) {
        // Determine the new status
        const newStatus = acc.status === 'Active' ? 'Inactive' : 'Active';
        // Create the new object, explicitly casting the status
        return {
            ...acc,
            status: newStatus as Account['status'] // <<< FIX: Explicitly cast status
        };
      }
      return acc; // Return unchanged account if ID doesn't match
    });

    onAccountsUpdate(updated); // Pass the correctly typed array

    const changedAccount = updated.find(acc => acc.id === accountId);
    if (changedAccount) {
        logAdminActivity("Update Account Status", "Account", accountId, `Status changed to ${changedAccount.status}`);
    }
   };

  return (
    <div>
      <h2>Accounts Tab Content</h2>
      {/* ... rest of the component ... */}
       <ul>
        {accounts.map(acc => (
          <li key={acc.id}>{acc.name} ({acc.status}) <button onClick={() => handleUpdateStatus(acc.id)} className="text-xs text-blue-500 ml-2">(Toggle Status)</button></li>
        ))}
      </ul>
    </div>
  );
};

export default AccountsTab;