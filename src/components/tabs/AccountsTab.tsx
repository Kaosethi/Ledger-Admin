// src/components/tabs/AccountsTab.tsx
import React, { useState, useRef, useMemo, useEffect } from "react";
import type { Account, Transaction, Merchant } from "@/lib/mockData";
import type { BulkUpdatePayload } from "../modals/BulkEditModal";
import { formatCurrency, formatDate, renderStatusBadge } from "@/lib/utils";
import BulkEditModal from "../modals/BulkEditModal";
import EditAccountModal from "../modals/EditAccountModal";
import { useReactToPrint } from "react-to-print";
import BulkQrPrintView from "../print/BulkQrPrintView";

interface AccountsTabProps {
  accounts: Account[];
  onAccountsUpdate?: (updatedAccounts: Account[]) => void;
  logAdminActivity?: (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: string
  ) => void;
  allTransactions: Transaction[];
  merchants: Merchant[];
}

const AccountsTab: React.FC<AccountsTabProps> = ({
  accounts = [],
  onAccountsUpdate,
  logAdminActivity,
  allTransactions,
  merchants,
}) => {
  // --- State (Unchanged) ---
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
  const [selectedAccountsToPrint, setSelectedAccountsToPrint] = useState<Account[]>([]);
  const [selectedAccountsForModal, setSelectedAccountsForModal] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [triggerPrint, setTriggerPrint] = useState(false);

  // --- Refs (Unchanged) ---
  const printComponentRef = useRef<HTMLDivElement>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  // --- Filtered Accounts (Unchanged) ---
  const filteredAccounts = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    if (!lowerCaseSearchTerm) { return accounts; }
    return accounts.filter(account =>
      account.id.toLowerCase().includes(lowerCaseSearchTerm) ||
      (account.guardianName && account.guardianName.toLowerCase().includes(lowerCaseSearchTerm)) ||
      account.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [accounts, searchTerm]);

  // --- Derived State & Memos (Unchanged) ---
  const isAllSelected = useMemo(() => filteredAccounts.length > 0 && selectedAccountIds.size === filteredAccounts.length, [filteredAccounts, selectedAccountIds]);
  const isIndeterminate = useMemo(() => {
    const visibleSelectedCount = filteredAccounts.filter(acc => selectedAccountIds.has(acc.id)).length;
    return visibleSelectedCount > 0 && visibleSelectedCount < filteredAccounts.length;
  }, [filteredAccounts, selectedAccountIds]);

  useEffect(() => {
    if (selectAllCheckboxRef.current) { selectAllCheckboxRef.current.indeterminate = isIndeterminate; }
  }, [isIndeterminate]);

  // --- Print Handler (Unchanged) ---
  const handleActualPrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: "Selected-Account-QR-Codes",
    onAfterPrint: () => { setTriggerPrint(false) },
  });
  useEffect(() => { if (triggerPrint && printComponentRef.current) { handleActualPrint(); } else if (triggerPrint) { console.warn("Print triggered but printComponentRef.current is not attached yet."); } }, [triggerPrint, handleActualPrint]);

  // --- Event Handlers (Unchanged) ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value); };
  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => { const isChecked = e.target.checked; setSelectedAccountIds(prev => { const newSet = new Set(prev); if (isChecked) { filteredAccounts.forEach(acc => newSet.add(acc.id)); } else { filteredAccounts.forEach(acc => newSet.delete(acc.id)); } return newSet; }); };
  const handleRowSelectChange = (accountId: string, isChecked: boolean) => { setSelectedAccountIds(prev => { const newSet = new Set(prev); if (isChecked) newSet.add(accountId); else newSet.delete(accountId); return newSet; }); };
  const handleOpenBulkUpdateModal = () => { if (selectedAccountIds.size === 0) { alert("Please select one or more accounts from the table first."); return; } const selected = accounts.filter(acc => selectedAccountIds.has(acc.id)); setSelectedAccountsForModal(selected); setIsBulkEditModalOpen(true); };
  const handleApplyBulkUpdates = (payload: BulkUpdatePayload) => {
    const { balanceAction, amount, statusAction } = payload; const idsToUpdate = selectedAccountIds; if (idsToUpdate.size === 0) { alert("Internal Error: No accounts selected for update."); return; } if (balanceAction === 'nochange' && statusAction === 'nochange') { alert("No changes specified."); setIsBulkEditModalOpen(false); return; } let logDetails = []; const updatesToApply = new Map<string, Account>();
    idsToUpdate.forEach(accountId => { const originalAccount = accounts.find(acc => acc.id === accountId); if (!originalAccount) { console.warn(`[BulkUpdate PreCalc] Could not find original account for ID: ${accountId}`); return; } let newBalance = originalAccount.balance; let newStatus = originalAccount.status; let needsUpdate = false; if (balanceAction === 'add' && amount !== undefined) { const calculatedBalance = originalAccount.balance + amount; if (calculatedBalance !== originalAccount.balance) { newBalance = calculatedBalance; needsUpdate = true; } } else if (balanceAction === 'set' && amount !== undefined) { if (amount !== originalAccount.balance) { newBalance = amount; needsUpdate = true; } } if (statusAction === 'activate' && originalAccount.status !== 'Active') { newStatus = 'Active'; needsUpdate = true; } else if (statusAction === 'suspend' && originalAccount.status !== 'Suspended') { newStatus = 'Suspended'; needsUpdate = true; } if (needsUpdate) { updatesToApply.set(accountId, { ...originalAccount, balance: newBalance, status: newStatus, updatedAt: new Date().toISOString(), }); } });
    if (updatesToApply.size === 0) { alert("Selected accounts already reflect the requested state."); setIsBulkEditModalOpen(false); return; }
    const finalUpdatedAccounts = accounts.map(acc => updatesToApply.has(acc.id) ? updatesToApply.get(acc.id)! : acc); if (onAccountsUpdate) { onAccountsUpdate(finalUpdatedAccounts); } if (balanceAction !== 'nochange' && amount !== undefined) { logDetails.push(`Balance ${balanceAction === 'add' ? 'adjusted by' : 'set to'} ${formatCurrency(amount)}.`); } if (statusAction !== 'nochange') { logDetails.push(`Status set to ${statusAction}.`); } if (logAdminActivity) { logAdminActivity( "Bulk Update Accounts", "Account", `${updatesToApply.size} accounts changed`, `${logDetails.join(" ")} Applied to IDs: ${Array.from(updatesToApply.keys()).join(", ")}` ); } setIsBulkEditModalOpen(false); alert(`${updatesToApply.size} account(s) updated successfully.`); setSelectedAccountIds(new Set());
  };
  const handleBulkPrintClick = () => { if (selectedAccountIds.size === 0) { alert("Please select one or more accounts from the table to print."); return; } const filteredAccountsForPrint = accounts.filter(acc => selectedAccountIds.has(acc.id)); if (logAdminActivity) { logAdminActivity( "Bulk Print QR", "Account", `${filteredAccountsForPrint.length} accounts`, `Preparing to print QR for ${filteredAccountsForPrint.length} selected accounts.` ); } setSelectedAccountsToPrint(filteredAccountsForPrint); setTimeout(() => { setTriggerPrint(true); }, 50); };
  const handleViewEditClick = (accountToEdit: Account) => { setEditingAccount(accountToEdit); setIsEditAccountModalOpen(true); };
  const handleSaveAccountChanges = (updatedAccount: Account) => { console.log("AccountsTab: handleSaveAccountChanges called with:", updatedAccount); const updatedAccountsList = accounts.map((acc) => acc.id === updatedAccount.id ? updatedAccount : acc); console.log("AccountsTab: Calling onAccountsUpdate from single save:", updatedAccountsList); if (onAccountsUpdate) onAccountsUpdate(updatedAccountsList); if (logAdminActivity) logAdminActivity( "Edit Account", "Account", updatedAccount.id, `Updated details for ${updatedAccount.name}` ); setIsEditAccountModalOpen(false); setEditingAccount(null); };

  // --- Component Render ---
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header Section (Unchanged) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-3 md:space-y-0"> <h2 className="text-xl font-semibold text-gray-800">Manage Accounts</h2> <div className="flex flex-wrap gap-2"> <div className="relative rounded-md shadow-sm"> <input type="text" id="account-search" className="block w-full pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm placeholder-gray-400" placeholder="Search by ID or name" value={searchTerm} onChange={handleSearchChange} /> <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"> <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"> <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /> </svg> </div> </div> <button id="bulk-update-btn" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50" onClick={handleOpenBulkUpdateModal} disabled={selectedAccountIds.size === 0} > Bulk Update ({selectedAccountIds.size}) </button> <button id="bulk-print-qr-btn" className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50" onClick={handleBulkPrintClick} disabled={selectedAccountIds.size === 0} > Bulk Print QR ({selectedAccountIds.size}) </button> </div> </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 w-12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <label htmlFor="select-all-header" className="sr-only">Select all visible accounts</label>
                <input id="select-all-header" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" checked={isAllSelected} ref={selectAllCheckboxRef} onChange={handleSelectAllChange} disabled={filteredAccounts.length === 0} />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account ID</th>
              {/* MODIFIED: Added text-center */}
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Child Name</th>
              {/* MODIFIED: Added text-center */}
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Guardian Name</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Transaction</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead><tbody id="accounts-table-body" className="bg-white divide-y divide-gray-200">
            {filteredAccounts.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{searchTerm ? 'No accounts match your search.' : 'No accounts found.'}</td></tr>
            ) : (
              filteredAccounts.map((account) => (
                <tr key={account.id} className={selectedAccountIds.has(account.id) ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700"><label htmlFor={`select-row-${account.id}`} className="sr-only">Select account {account.id}</label><input id={`select-row-${account.id}`} type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" checked={selectedAccountIds.has(account.id)} onChange={(e) => handleRowSelectChange(account.id, e.target.checked)} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{account.id}</td>
                  {/* MODIFIED: Added text-center */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{account.name}</td>
                  {/* MODIFIED: Added text-center */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{account.guardianName || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{formatCurrency(account.balance)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{renderStatusBadge(account.status, "account")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(account.lastTransactionAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center actions"><button className="text-primary hover:text-secondary focus:outline-none focus:underline" onClick={() => handleViewEditClick(account)}>View/Edit</button></td>
                </tr>
              ))
            )}
          </tbody></table>
      </div>

      {/* Pagination Section (Unchanged) */}
      <div className="flex items-center justify-between mt-4 px-1"> <div className="text-sm text-gray-700"> Showing <span id="pagination-start">{filteredAccounts.length > 0 ? 1 : 0}</span> to{" "} <span id="pagination-end">{Math.min(10, filteredAccounts.length)}</span> of{" "} <span id="pagination-total">{filteredAccounts.length}</span> accounts {searchTerm && ` (filtered from ${accounts.length} total)`} </div> <div className="flex space-x-2"> <button disabled={true} className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"> Previous </button> <button disabled={true} className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"> Next </button> </div> </div>

      {/* Modals (Unchanged) */}
      <BulkEditModal isOpen={isBulkEditModalOpen} onClose={() => setIsBulkEditModalOpen(false)} onApply={handleApplyBulkUpdates} selectedAccounts={selectedAccountsForModal} />
      <EditAccountModal isOpen={isEditAccountModalOpen} onClose={() => { setIsEditAccountModalOpen(false); setEditingAccount(null); }} onSave={handleSaveAccountChanges} account={editingAccount} allTransactions={allTransactions} merchants={merchants} />

      {/* Hidden print view (Unchanged) */}
      <div style={{ display: "none" }}> <BulkQrPrintView ref={printComponentRef} accountsToPrint={selectedAccountsToPrint} /> </div>
    </div>
  );
};

export default AccountsTab;