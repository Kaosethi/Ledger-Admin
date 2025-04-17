// src/app/components/tabs/AccountsTab.tsx
import React from 'react';
import type { Account } from '@/lib/mockData';
import { formatCurrency, formatDate, renderStatusBadge } from '@/lib/utils';

interface AccountsTabProps {
  accounts: Account[];
  // Add other props as needed
}

const AccountsTab: React.FC<AccountsTabProps> = ({ accounts = [] }) => {
  return (
    // Added classes from #accounts-tab div
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header Section - Added layout classes */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-3 md:space-y-0">
        <h2 className="text-xl font-semibold text-gray-800">Manage Accounts</h2>
        {/* Added layout classes */}
        <div className="flex flex-wrap gap-2">
          {/* Search Input - Added layout classes */}
          <div className="relative rounded-md shadow-sm">
            {/* Added input field styles */}
            <input
              type="text"
              id="account-search"
              className="block w-full pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-base placeholder-gray-400"
              placeholder="Search by ID or name"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
            </div>
          </div>
          {/* Buttons - Added .btn-primary/.btn-secondary styles */}
          <button
            id="bulk-edit-btn"
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            Bulk Edit Balances
          </button>
          <button
            id="bulk-print-qr-btn"
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            Bulk Print QR Codes
          </button>
        </div>
      </div>

      {/* Table Section - Added overflow */}
      <div className="overflow-x-auto">
        {/* Added classes */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Added .table-header and .center */}
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
              <tr>
                {/* Added .table-cell and .center */}
                <td colSpan={7} className="table-cell center">No accounts found.</td>
              </tr>
            ) : (
              accounts.map((account: Account) => (
                <tr key={account.id}>
                   {/* Added .table-cell and variants */}
                  <td className="table-cell font-semibold text-gray-900">{account.id}</td>
                  <td className="table-cell">{account.name}</td>
                  <td className="table-cell">{account.guardianName || 'N/A'}</td>
                  <td className="table-cell center">{formatCurrency(account.balance)}</td>
                  <td className="table-cell center">{renderStatusBadge(account.status, 'account')}</td>
                  <td className="table-cell">{formatDate(account.lastTransactionAt)}</td>
                  <td className="table-cell actions"> {/* Added .actions */}
                    <button className="text-primary hover:text-secondary view-account-btn">
                      View/Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Section - Added layout classes */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-700">
          Showing <span id="pagination-start">1</span> to <span id="pagination-end">{Math.min(10, accounts.length)}</span> of <span id="pagination-total">{accounts.length}</span> accounts
        </div>
         {/* Added layout and button styles */}
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

export default AccountsTab;