// src/components/modals/BulkEditModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import type { Account } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (action: 'add' | 'set', amount: number, selectedIds: Set<string>) => void;
  allAccounts: Account[];
  // REMOVED: initiallySelectedIds prop is no longer needed
  // initiallySelectedIds: Set<string>;
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  onApply,
  allAccounts = [],
  // initiallySelectedIds // <-- REMOVED
}) => {
  const [action, setAction] = useState<'add' | 'set'>('add');
  const [amountStr, setAmountStr] = useState<string>('');
  // State for accounts selected *within this modal*
  const [modalSelectedIds, setModalSelectedIds] = useState<Set<string>>(new Set());

  // Effect to reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset all fields when modal becomes visible
      setAction('add');
      setAmountStr('');
      // MODIFIED: Always start with an empty selection set in the modal
      setModalSelectedIds(new Set());
    }
    // Only depends on isOpen now
  }, [isOpen]);

  // Handler for individual checkboxes within the modal
  const handleModalSelectChange = (accountId: string, isChecked: boolean) => {
    setModalSelectedIds(prev => {
      const newSet = new Set(prev);
      if (isChecked) newSet.add(accountId);
      else newSet.delete(accountId);
      return newSet;
    });
  };

  // Handler for "Select All / Deselect All"
  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      setModalSelectedIds(new Set(allAccounts.map(acc => acc.id)));
    } else {
      setModalSelectedIds(new Set());
    }
  };

  // Determine if the "Select All" checkbox should be checked
  const isAllSelected = useMemo(() => {
    // Avoid division by zero or unnecessary checks if no accounts
    if (allAccounts.length === 0) return false;
    return modalSelectedIds.size === allAccounts.length;
  }, [allAccounts, modalSelectedIds]);

  // Determine if the "Select All" checkbox should show indeterminate state
  const isIndeterminate = useMemo(() => {
    return modalSelectedIds.size > 0 && modalSelectedIds.size < allAccounts.length;
  }, [allAccounts.length, modalSelectedIds.size]);


  const handleApplyClick = () => {
    const amountNum = parseFloat(amountStr);
    if (isNaN(amountNum) || amountNum < 0) {
      alert('Please enter a valid non-negative amount.');
      return;
    }
    if (modalSelectedIds.size === 0) {
      alert('Please select at least one account to apply changes to.');
      return;
    }
    // Pass the action, amount, and IDs selected *in the modal* back up
    onApply(action, amountNum, modalSelectedIds);
  };

  if (!isOpen) return null; // Don't render if not open

  return (
    // Overlay
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      {/* Modal Content */}
      <div className="relative mx-auto p-6 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Edit Balances</h3>

        {/* Action Dropdown */}
        <div className="mb-4">
          <label htmlFor="bulk-action" className="block text-sm font-medium text-gray-700 mb-1">Action</label>
          <select
            id="bulk-action"
            value={action}
            onChange={(e) => setAction(e.target.value as 'add' | 'set')}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
          >
            <option value="add">Add Amount</option>
            <option value="set">Set Amount To</option>
          </select>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label htmlFor="bulk-amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">$</span></div>
            <input
              type="number"
              name="bulk-amount" id="bulk-amount"
              className="focus:ring-primary focus:border-primary block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
              placeholder="0.00" value={amountStr} onChange={(e) => setAmountStr(e.target.value)}
              min="0" step="0.01"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">USD</span></div>
          </div>
        </div>

        {/* Apply to Accounts Section */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Apply to Accounts</label>
          {/* Select All Checkbox */}
           <div className="flex items-center mb-2 border-b pb-2 border-gray-200">
             <input
               id="select-all-modal" type="checkbox"
               className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
               checked={isAllSelected}
               ref={el => { if (el) el.indeterminate = isIndeterminate; }} // Set indeterminate state
               onChange={handleSelectAllChange}
               disabled={allAccounts.length === 0} // Disable if no accounts to select
             />
             <label htmlFor="select-all-modal" className="ml-2 block text-sm text-gray-900">
               {/* MODIFIED: Update label text dynamically */}
               {isAllSelected ? 'Deselect All' : 'Select All'} ({modalSelectedIds.size} / {allAccounts.length} selected)
             </label>
           </div>
          {/* Accounts List */}
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1">
            {allAccounts.length > 0 ? (
              allAccounts.map((account) => (
                <div key={account.id} className="flex items-center">
                  <input
                    id={`modal-acc-${account.id}`} type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    checked={modalSelectedIds.has(account.id)}
                    onChange={(e) => handleModalSelectChange(account.id, e.target.checked)}
                  />
                  <label htmlFor={`modal-acc-${account.id}`} className="ml-2 block text-sm text-gray-700 truncate">
                    {account.id} - {account.name} ({formatCurrency(account.balance)})
                  </label>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No accounts available.</p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button" onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          >Cancel</button>
          <button
            type="button" onClick={handleApplyClick}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            disabled={modalSelectedIds.size === 0 || amountStr === '' || parseFloat(amountStr) < 0 || isNaN(parseFloat(amountStr))} // Added NaN check
          >Apply Changes</button>
        </div>
      </div>
    </div>
  );
};

export default BulkEditModal;