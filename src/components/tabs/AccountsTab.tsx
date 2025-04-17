// src/app/components/tabs/AccountsTab.tsx
import React, { useState, useRef } from 'react';
import type { Account } from '@/lib/mockData';
import { formatCurrency, formatDate, renderStatusBadge } from '@/lib/utils';
import BulkEditModal from '../modals/BulkEditModal';
import EditAccountModal from '../modals/EditAccountModal'; // <-- CORRECT: Import from its own file
import { useReactToPrint } from 'react-to-print';
import BulkQrPrintView from '../print/BulkQrPrintView';

// Interface defining props passed from AdminDashboard
interface AccountsTabProps {
  accounts: Account[];
  onAccountsUpdate?: (updatedAccounts: Account[]) => void;
  logAdminActivity?: (action: string, targetType?: string, targetId?: string, details?: string) => void;
}

const AccountsTab: React.FC<AccountsTabProps> = ({ accounts = [], onAccountsUpdate, logAdminActivity }) => {

  // --- State ---
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // --- Refs ---
  const printComponentRef = useRef<HTMLDivElement>(null);

  // --- Print Handler ---
  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
    documentTitle: 'Account-QR-Codes',
    removeAfterPrint: true
  });

  // --- Event Handlers ---
  const handleBulkEditClick = () => setIsBulkEditModalOpen(true);

  const handleApplyBulkEdit = (action: 'add' | 'set', amount: number, idsToUpdate: Set<string>) => {
     if (idsToUpdate.size === 0) return alert("No accounts were selected in the modal to apply changes to.");
     const updatedAccounts = accounts.map(acc => idsToUpdate.has(acc.id) ? { ...acc, balance: action === 'add' ? acc.balance + amount : amount } : acc);
     if (onAccountsUpdate) onAccountsUpdate(updatedAccounts);
     if (logAdminActivity) logAdminActivity(`Bulk ${action} balance`, 'Account', `${idsToUpdate.size} accounts`, `Amount: ${formatCurrency(amount)}. Applied to IDs: ${Array.from(idsToUpdate).join(', ')}`);
     alert(`Bulk edit applied. State update triggered.`);
     setIsBulkEditModalOpen(false);
  };

  const handleBulkPrintClick = () => {
    if (accounts.length === 0) return alert('There are no accounts to print.');
    if (logAdminActivity) logAdminActivity('Bulk Print QR', 'Account', `${accounts.length} accounts`, `Printing QR for all ${accounts.length} visible accounts.`);
    handlePrint(); // Trigger print dialog
  };

  const handleViewEditClick = (accountToEdit: Account) => {
    setEditingAccount(accountToEdit);
    setIsEditAccountModalOpen(true);
  };

  const handleSaveAccountChanges = (updatedAccount: Account) => {
    const updatedAccountsList = accounts.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc);
    if (onAccountsUpdate) onAccountsUpdate(updatedAccountsList);
    if (logAdminActivity) logAdminActivity('Edit Account', 'Account', updatedAccount.id, `Updated details for ${updatedAccount.name}`);
    alert(`Account ${updatedAccount.id} updated. State update triggered.`);
    setIsEditAccountModalOpen(false);
    setEditingAccount(null);
  };

  // --- Component Render ---
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-3 md:space-y-0">
        <h2 className="text-xl font-semibold text-gray-800">Manage Accounts</h2>
        <div className="flex flex-wrap gap-2">
          {/* Search Input */}
          <div className="relative rounded-md shadow-sm">
            <input type="text" id="account-search" className="block w-full pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-base placeholder-gray-400" placeholder="Search by ID or name" />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"> <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg> </div>
          </div>
          {/* Bulk Action Buttons */}
          <button id="bulk-edit-btn" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" onClick={handleBulkEditClick} > Bulk Edit Balances </button>
          <button id="bulk-print-qr-btn" className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" onClick={handleBulkPrintClick} > Bulk Print QR Codes </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="table-header">Account ID</th>
              <th scope="col" className="table-header">Child Name</th>
              <th scope="col" className="table-header">Guardian Name</th>
              <th scope="col" className="table-header center">Balance</th>
              <th scope="col" className="table-header center">Status</th>
              <th scope="col" className="table-header">Last Transaction</th>
              <th scope="col" className="table-header center">Actions</th>
            </tr>
          </thead>
          <tbody id="accounts-table-body" className="bg-white divide-y divide-gray-200">
            {accounts.length === 0 ? (
              <tr> <td colSpan={7} className="table-cell center">No accounts found.</td> </tr>
            ) : (
              accounts.map((account) => (
                <tr key={account.id}>
                  <td className="table-cell font-semibold text-gray-900">{account.id}</td>
                  <td className="table-cell">{account.name}</td>
                  <td className="table-cell">{account.guardianName || 'N/A'}</td>
                  <td className="table-cell center">{formatCurrency(account.balance)}</td>
                  <td className="table-cell center">{renderStatusBadge(account.status, 'account')}</td>
                  <td className="table-cell">{formatDate(account.lastTransactionAt)}</td>
                  <td className="table-cell actions">
                    <button className="text-primary hover:text-secondary view-account-btn" onClick={() => handleViewEditClick(account)}> View/Edit </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      <div className="flex items-center justify-between mt-4">
         <div className="text-sm text-gray-700"> Showing <span id="pagination-start">1</span> to <span id="pagination-end">{Math.min(10, accounts.length)}</span> of <span id="pagination-total">{accounts.length}</span> accounts </div>
        <div className="flex space-x-2">
          <button className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">Previous</button>
          <button className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">Next</button>
        </div>
      </div> {/* End Pagination Section */}

      {/* Render the Modals */}
      <BulkEditModal isOpen={isBulkEditModalOpen} onClose={() => setIsBulkEditModalOpen(false)} onApply={handleApplyBulkEdit} allAccounts={accounts} />
      {/* Ensure EditAccountModal is imported correctly */}
      <EditAccountModal isOpen={isEditAccountModalOpen} onClose={() => { setIsEditAccountModalOpen(false); setEditingAccount(null); }} onSave={handleSaveAccountChanges} account={editingAccount} />

      {/* Render the hidden component for printing */}
      <div style={{ display: 'none' }}>
         <BulkQrPrintView ref={printComponentRef} accountsToPrint={accounts} />
      </div>

    </div> // End Main Div for AccountsTab
  );
};

// Make sure this is the ONLY export in this file
export default AccountsTab;