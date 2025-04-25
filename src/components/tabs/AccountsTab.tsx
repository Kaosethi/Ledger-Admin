// src/components/tabs/AccountsTab.tsx
// FIXED: Addressed TS errors using 'childName' instead of 'name' and 'lastActivity' instead of 'lastTransactionAt'.
// FIXED: Added initialization for 'lastActivity' when creating new accounts.

import React, { useState, useRef, useMemo, useEffect } from "react";
import type { Account, Transaction, Merchant, PendingRegistration } from "@/lib/mockData"; // Ensure path is correct
import type { BulkUpdatePayload } from "../modals/BulkEditModal"; // Ensure path is correct
import { formatCurrency, formatDate, renderStatusBadge, formatDdMmYyyyHhMmSs } from "@/lib/utils"; // Ensure path is correct
import BulkEditModal from "../modals/BulkEditModal"; // Ensure path is correct
import EditAccountModal from "../modals/EditAccountModal"; // Ensure path is correct
import { useReactToPrint } from "react-to-print";
import BulkQrPrintView from "../print/BulkQrPrintView"; // Ensure path is correct
import ConfirmActionModal from "../modals/ConfirmActionModal"; // Ensure path is correct
import PendingRegistrationDetailModal from "../modals/PendingRegistrationDetailModal"; // Ensure path is correct


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
  pendingRegistrations: PendingRegistration[];
  onPendingRegistrationsUpdate: (updatedList: PendingRegistration[]) => void;
  onAccountAdd: (newAccount: Account) => void;
}

// Helper to generate unique account IDs (remains unchanged)
const generateUniqueAccountId = (existingAccounts: Account[]): string => {
    const year = new Date().getFullYear();
    const existingIds = new Set(existingAccounts.map(acc => acc.id));
    let counter = 1;
    let newId: string;
    do {
        // Example format: STC-YYYY-NNNN
        newId = `STC-${year}-${counter.toString().padStart(4, '0')}`;
        counter++;
    } while (existingIds.has(newId));
    return newId;
};


const AccountsTab: React.FC<AccountsTabProps> = ({
  accounts = [],
  onAccountsUpdate,
  logAdminActivity,
  allTransactions,
  merchants,
  pendingRegistrations = [],
  onPendingRegistrationsUpdate,
  onAccountAdd,
}) => {

  // --- State for Managed Accounts ---
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string>>(new Set());
  const [selectedAccountsToPrint, setSelectedAccountsToPrint] = useState<Account[]>([]);
  const [selectedAccountsForModal, setSelectedAccountsForModal] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [triggerPrint, setTriggerPrint] = useState(false);


  // --- State for Pending Registrations ---
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(new Set());
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingPendingRegistration, setViewingPendingRegistration] = useState<PendingRegistration | null>(null);

  // --- Refs ---
  const printComponentRef = useRef<HTMLDivElement>(null);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  const selectAllPendingCheckboxRef = useRef<HTMLInputElement>(null);


  // --- Filtered & Derived State ---
   const filteredAccounts = useMemo(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    if (!lowerCaseSearchTerm) {
      return accounts;
    }
    // MODIFIED: Use childName for filtering
    return accounts.filter(
      (account) =>
        account.id.toLowerCase().includes(lowerCaseSearchTerm) ||
        (account.guardianName &&
          account.guardianName.toLowerCase().includes(lowerCaseSearchTerm)) ||
        account.childName.toLowerCase().includes(lowerCaseSearchTerm) // Use childName
    );
  }, [accounts, searchTerm]);

  // --- Selection State Logic ---
  const isAllSelected = useMemo(() => filteredAccounts.length > 0 && selectedAccountIds.size === filteredAccounts.length, [filteredAccounts, selectedAccountIds]);
  const isIndeterminate = useMemo(() => selectedAccountIds.size > 0 && selectedAccountIds.size < filteredAccounts.length, [filteredAccounts, selectedAccountIds]);
  useEffect(() => { if (selectAllCheckboxRef.current) { selectAllCheckboxRef.current.indeterminate = isIndeterminate; } }, [isIndeterminate]);

   const isAllPendingSelected = useMemo(() => pendingRegistrations.length > 0 && selectedPendingIds.size === pendingRegistrations.length, [pendingRegistrations, selectedPendingIds]);
   const isPendingIndeterminate = useMemo(() => selectedPendingIds.size > 0 && selectedPendingIds.size < pendingRegistrations.length, [pendingRegistrations, selectedPendingIds]);
   useEffect(() => { if (selectAllPendingCheckboxRef.current) { selectAllPendingCheckboxRef.current.indeterminate = isPendingIndeterminate; } }, [isPendingIndeterminate]);


  // --- Print Handler ---
  const handleActualPrint = useReactToPrint({ contentRef: printComponentRef, documentTitle: "Selected-Account-QR-Codes", onAfterPrint: () => { setTriggerPrint(false); },});
  useEffect(() => { if (triggerPrint && printComponentRef.current) { handleActualPrint(); } else if (triggerPrint) { console.warn("Print triggered but printComponentRef.current is not attached yet."); } }, [triggerPrint, handleActualPrint]);


  // --- Event Handlers for Managed Accounts ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value); };
  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => { const isChecked = e.target.checked; setSelectedAccountIds((prev) => { const newSet = new Set(prev); if (isChecked) { filteredAccounts.forEach((acc) => newSet.add(acc.id)); } else { filteredAccounts.forEach((acc) => newSet.delete(acc.id)); } return newSet; }); };
  const handleRowSelectChange = (accountId: string, isChecked: boolean) => { setSelectedAccountIds((prev) => { const newSet = new Set(prev); if (isChecked) newSet.add(accountId); else newSet.delete(accountId); return newSet; }); };
  const handleOpenBulkUpdateModal = () => { if (selectedAccountIds.size === 0) { alert("Please select one or more accounts from the table first."); return; } const selected = accounts.filter((acc) => selectedAccountIds.has(acc.id)); setSelectedAccountsForModal(selected); setIsBulkEditModalOpen(true); };
  const handleApplyBulkUpdates = (payload: BulkUpdatePayload) => {
      const { balanceAction, amount, statusAction } = payload;
    const idsToUpdate = selectedAccountIds;
    if (idsToUpdate.size === 0) return;
    if (balanceAction === "nochange" && statusAction === "nochange") { setIsBulkEditModalOpen(false); return; }

    const updatesToApply = new Map<string, Account>();
    const now = new Date().toISOString(); // For consistent timestamps

    idsToUpdate.forEach(id => {
        const original = accounts.find(acc => acc.id === id);
        if (!original) return;
        let updated = { ...original };
        let changed = false;

        if (balanceAction === "add" && amount !== undefined) { updated.balance += amount; changed = true; }
        else if (balanceAction === "set" && amount !== undefined) { updated.balance = amount; changed = true; }

        // Make sure status values match Account['status'] type: 'Active' | 'Inactive' | 'Suspended'
        if (statusAction === "activate" && updated.status !== "Active") { updated.status = "Active"; changed = true; }
        else if (statusAction === "suspend" && updated.status !== "Suspended") { updated.status = "Suspended"; changed = true; }
        // Note: 'Inactive' is not handled by the bulk modal's 'activate/suspend' actions

        if (changed) {
            updated.updatedAt = now;
            updated.lastActivity = now; // Update lastActivity on any change
            updatesToApply.set(id, updated);
        }
    });

     if (updatesToApply.size === 0) { alert("Selected accounts already reflect the requested state."); setIsBulkEditModalOpen(false); return; }

    const finalUpdatedAccounts = accounts.map(acc => updatesToApply.get(acc.id) || acc);
    onAccountsUpdate?.(finalUpdatedAccounts);

    const logDetails: string[] = [];
    if (balanceAction !== 'nochange' && amount !== undefined) logDetails.push(`Balance ${balanceAction === 'add' ? 'adjusted by' : 'set to'} ${formatCurrency(amount)}.`);
    if (statusAction !== 'nochange') logDetails.push(`Status set to ${statusAction === 'activate' ? 'Active' : 'Suspended'}.`); // Use correct status names
    logAdminActivity?.("Bulk Update Accounts", "Account", `${updatesToApply.size} accounts`, `${logDetails.join(' ')} Applied to IDs: ${Array.from(updatesToApply.keys()).join(', ')}`);

    setIsBulkEditModalOpen(false);
    setSelectedAccountIds(new Set());
    alert(`${updatesToApply.size} account(s) updated successfully.`);
  };
  const handleBulkPrintClick = () => {
       if (selectedAccountIds.size === 0) { alert("Please select one or more accounts from the table to print."); return; }
       const filteredAccountsForPrint = accounts.filter((acc) => selectedAccountIds.has(acc.id));
       logAdminActivity?.("Bulk Print QR", "Account", `${filteredAccountsForPrint.length} accounts`, `Preparing to print QR for ${filteredAccountsForPrint.length} selected accounts.`);
       setSelectedAccountsToPrint(filteredAccountsForPrint);
       setTimeout(() => { setTriggerPrint(true); }, 50);
   };
  const handleViewEditClick = (accountToEdit: Account) => { setEditingAccount(accountToEdit); setIsEditAccountModalOpen(true); };
  const handleSaveAccountChanges = (updatedAccount: Account) => {
      // Ensure lastActivity is updated if it's missing (should be handled in modal now)
      const accountToSave = {
          ...updatedAccount,
          lastActivity: updatedAccount.lastActivity || updatedAccount.updatedAt || new Date().toISOString()
      };
      const updatedAccountsList = accounts.map((acc) => acc.id === accountToSave.id ? accountToSave : acc );
      onAccountsUpdate?.(updatedAccountsList);
      // MODIFIED: Use childName for logging clarity
      logAdminActivity?.("Edit Account", "Account", accountToSave.id, `Updated details for ${accountToSave.childName}`);
      setIsEditAccountModalOpen(false);
      setEditingAccount(null);
   };


  // --- Event Handlers for Pending Registrations ---
  const handleSelectAllPendingChange = (e: React.ChangeEvent<HTMLInputElement>) => { const isChecked = e.target.checked; setSelectedPendingIds(isChecked ? new Set(pendingRegistrations.map(p => p.id)) : new Set()); };
  const handlePendingRowSelectChange = (pendingId: string, isChecked: boolean) => { setSelectedPendingIds((prev) => { const newSet = new Set(prev); if (isChecked) newSet.add(pendingId); else newSet.delete(pendingId); return newSet; }); };
  const performApprove = (pendingId: string) => {
        const pending = pendingRegistrations.find(p => p.id === pendingId);
        if (!pending) return;
        const newAccountId = generateUniqueAccountId(accounts);
        const now = new Date().toISOString();
        // MODIFIED: Use childName and add lastActivity
        const newAccount: Account = {
            id: newAccountId,
            childName: pending.childName, // Use childName
            guardianName: pending.guardianName,
            balance: 0,
            status: 'Active', // Ensure this matches Account status type
            pin: pending.pin,
            createdAt: now,
            updatedAt: now,
            lastActivity: now, // Initialize lastActivity
            // Add optional fields from PendingRegistration
            guardianDob: pending.guardianDob,
            guardianContact: pending.guardianContact,
            address: pending.address,
        };
        onAccountAdd(newAccount);
        const updatedPendingList = pendingRegistrations.filter(p => p.id !== pendingId);
        onPendingRegistrationsUpdate(updatedPendingList);
        logAdminActivity?.("Approve Registration", "Account", newAccountId, `Approved registration for ${pending.childName} (Guardian: ${pending.guardianName})`);
    };
  const performReject = (pendingId: string) => {
        const pending = pendingRegistrations.find(p => p.id === pendingId);
        if (!pending) return;
        const updatedPendingList = pendingRegistrations.filter(p => p.id !== pendingId);
        onPendingRegistrationsUpdate(updatedPendingList);
        logAdminActivity?.("Reject Registration", "PendingRegistration", pendingId, `Rejected registration for ${pending.childName} (Guardian: ${pending.guardianName})`);
    };
  const handleApproveClick = (pendingId: string) => { setConfirmMessage("Are you sure you want to approve this registration? This will create a new active account."); setConfirmAction(() => () => performApprove(pendingId)); setIsConfirmModalOpen(true); };
  const handleRejectClick = (pendingId: string) => { setConfirmMessage("Are you sure you want to reject this registration? This action cannot be undone."); setConfirmAction(() => () => performReject(pendingId)); setIsConfirmModalOpen(true); };
  const handleBulkApprove = () => {
        if (selectedPendingIds.size === 0) return;
        setConfirmMessage(`Are you sure you want to approve ${selectedPendingIds.size} selected registration(s)?`);
        setConfirmAction(() => () => {
            let approvedCount = 0;
            const idsToProcess = Array.from(selectedPendingIds);
            let currentAccounts = [...accounts]; // Base for generating unique IDs
            const now = new Date().toISOString();

            idsToProcess.forEach(pendingId => {
                const pending = pendingRegistrations.find(p => p.id === pendingId);
                if (pending) {
                    const newAccountId = generateUniqueAccountId(currentAccounts);
                     // MODIFIED: Use childName and add lastActivity
                    const newAccount: Account = {
                        id: newAccountId,
                        childName: pending.childName, // Use childName
                        guardianName: pending.guardianName,
                        balance: 0,
                        status: 'Active',
                        pin: pending.pin,
                        createdAt: now,
                        updatedAt: now,
                        lastActivity: now, // Initialize lastActivity
                         // Add optional fields from PendingRegistration
                        guardianDob: pending.guardianDob,
                        guardianContact: pending.guardianContact,
                        address: pending.address,
                    };
                    onAccountAdd(newAccount);
                    currentAccounts.push(newAccount); // Add to list for subsequent ID checks
                    approvedCount++;
                }
            });

            const finalPendingList = pendingRegistrations.filter(p => !selectedPendingIds.has(p.id));
            onPendingRegistrationsUpdate(finalPendingList);
            logAdminActivity?.("Bulk Approve Registrations", "Account", `${approvedCount} accounts`, `Approved ${approvedCount} registration(s).`);
            setSelectedPendingIds(new Set());
        });
        setIsConfirmModalOpen(true);
    };
    const handleBulkReject = () => {
        if (selectedPendingIds.size === 0) return;
         setConfirmMessage(`Are you sure you want to reject ${selectedPendingIds.size} selected registration(s)? This action cannot be undone.`);
        setConfirmAction(() => () => {
            const rejectedCount = selectedPendingIds.size;
            const updatedPendingList = pendingRegistrations.filter(p => !selectedPendingIds.has(p.id));
            onPendingRegistrationsUpdate(updatedPendingList);
            logAdminActivity?.("Bulk Reject Registrations", "PendingRegistration", `${rejectedCount} requests`, `Rejected ${rejectedCount} registration(s).`);
            setSelectedPendingIds(new Set());
        });
        setIsConfirmModalOpen(true);
    };
  const handleViewDetailsClick = (pending: PendingRegistration) => { setViewingPendingRegistration(pending); setIsDetailModalOpen(true); };

  // --- Component Render ---
  return (
    <>
        {/* --- Pending Registrations Section --- */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Registration Requests ({pendingRegistrations.length})</h2>
            {/* Bulk Action Buttons */}
            {pendingRegistrations.length > 0 && (
                 <div className="flex justify-start mb-4 space-x-2">
                    <button onClick={handleBulkApprove} disabled={selectedPendingIds.size === 0} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">Bulk Approve ({selectedPendingIds.size})</button>
                    <button onClick={handleBulkReject} disabled={selectedPendingIds.size === 0} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50">Bulk Reject ({selectedPendingIds.size})</button>
                </div>
            )}
            {/* Pending Table */}
            <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        {/* Pending Table Headers */}
                        <tr>
                            <th scope="col" className="px-4 py-3 w-12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><label htmlFor="select-all-pending" className="sr-only">Select all</label><input id="select-all-pending" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" checked={isAllPendingSelected} ref={selectAllPendingCheckboxRef} onChange={handleSelectAllPendingChange} disabled={pendingRegistrations.length === 0} /></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guardian</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Child</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* Pending Table Body */}
                         {pendingRegistrations.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No pending registrations found.</td></tr>
                        ) : (
                            pendingRegistrations.map((pending) => (
                                <tr key={pending.id} className={selectedPendingIds.has(pending.id) ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm"><label htmlFor={`select-pending-${pending.id}`} className="sr-only">Select</label><input id={`select-pending-${pending.id}`} type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" checked={selectedPendingIds.has(pending.id)} onChange={(e) => handlePendingRowSelectChange(pending.id, e.target.checked)} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pending.guardianName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{pending.childName}</td> {/* Use childName */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDdMmYyyyHhMmSs(pending.submittedAt)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center"><button onClick={() => handleViewDetailsClick(pending)} className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:underline" title="View Details">View</button></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                        {/* Action Buttons */}
                                        <div className="flex items-center justify-center space-x-2">
                                            <button onClick={() => handleApproveClick(pending.id)} className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500" title="Approve Registration"><svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Approve</button>
                                            <button onClick={() => handleRejectClick(pending.id)} className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" title="Reject Registration"><svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>Reject</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div> {/* End Pending Section */}


        {/* --- Managed Accounts Section --- */}
        <div className="bg-white p-6 rounded-lg shadow-md">
            {/* Header Section */}
             <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-3 md:space-y-0">
                <h2 className="text-xl font-semibold text-gray-800">Managed Accounts ({accounts.length})</h2>
                {/* Search and bulk actions */}
                <div className="flex flex-wrap gap-2">
                     {/* Search Input */}
                    <div className="relative rounded-md shadow-sm">
                        <input type="text" id="account-search" className="block w-full pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm placeholder-gray-400" placeholder="Search by ID, Guardian, or Child" value={searchTerm} onChange={handleSearchChange} aria-label="Search managed accounts"/>
                         <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg></div>
                     </div>
                     {/* Bulk Update Button */}
                    <button id="bulk-update-btn" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50" onClick={handleOpenBulkUpdateModal} disabled={selectedAccountIds.size === 0}>Bulk Update ({selectedAccountIds.size})</button>
                    {/* Bulk Print Button */}
                    <button id="bulk-print-qr-btn" className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50" onClick={handleBulkPrintClick} disabled={selectedAccountIds.size === 0}>Bulk Print QR ({selectedAccountIds.size})</button>
                 </div>
             </div>

            {/* Managed Accounts Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                         {/* Managed Accounts Table Headers */}
                         <tr>
                             <th scope="col" className="px-4 py-3 w-12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><label htmlFor="select-all-header" className="sr-only">Select all visible</label><input id="select-all-header" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" checked={isAllSelected} ref={selectAllCheckboxRef} onChange={handleSelectAllChange} disabled={filteredAccounts.length === 0} /></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Child Name</th>{/* MODIFIED */}
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guardian Name</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>{/* MODIFIED */}
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="accounts-table-body" className="bg-white divide-y divide-gray-200">
                        {/* Managed Accounts Table Body */}
                         {filteredAccounts.length === 0 ? (
                            <tr><td colSpan={8} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{searchTerm ? "No accounts match search." : "No accounts found."}</td></tr>
                        ) : (
                            filteredAccounts.map((account) => (
                                <tr key={account.id} className={selectedAccountIds.has(account.id) ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700"><label htmlFor={`select-row-${account.id}`} className="sr-only">Select</label><input id={`select-row-${account.id}`} type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" checked={selectedAccountIds.has(account.id)} onChange={(e) => handleRowSelectChange(account.id, e.target.checked)} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{account.id}</td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{account.childName}</td>{/* MODIFIED */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{account.guardianName || "N/A"}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{formatCurrency(account.balance)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{renderStatusBadge(account.status, "account")}</td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(account.lastActivity)}</td>{/* MODIFIED */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center actions">
                                        <button className="text-primary hover:text-secondary focus:outline-none focus:underline" onClick={() => handleViewEditClick(account)}>View/Edit</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
             {/* Pagination (Placeholder) */}
            <div className="flex items-center justify-between mt-4 px-1">
                 <div className="text-sm text-gray-700">Showing <span id="pagination-start">{filteredAccounts.length > 0 ? 1 : 0}</span> to <span id="pagination-end">{Math.min(10, filteredAccounts.length)}</span> of <span id="pagination-total">{filteredAccounts.length}</span> accounts {searchTerm && ` (filtered from ${accounts.length} total)`}</div>
                <div className="flex space-x-2"><button disabled className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white disabled:opacity-50">Previous</button><button disabled className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white disabled:opacity-50">Next</button></div>
             </div>
        </div> {/* End Managed Accounts Section */}


        {/* --- Render Modals --- */}
        <BulkEditModal isOpen={isBulkEditModalOpen} onClose={() => setIsBulkEditModalOpen(false)} onApply={handleApplyBulkUpdates} selectedAccounts={selectedAccountsForModal}/>
        {/* Pass logAdminActivity down to EditAccountModal */}
        <EditAccountModal isOpen={isEditAccountModalOpen} onClose={() => { setIsEditAccountModalOpen(false); setEditingAccount(null); }} onSave={handleSaveAccountChanges} account={editingAccount} allTransactions={allTransactions} merchants={merchants} logAdminActivity={logAdminActivity}/>
        <ConfirmActionModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={() => { if (confirmAction) { confirmAction(); } setIsConfirmModalOpen(false); } } message={confirmMessage} title={"Confirm Action"} />
        <PendingRegistrationDetailModal isOpen={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setViewingPendingRegistration(null); }} registration={viewingPendingRegistration} />

        {/* Hidden print view */}
        <div style={{ display: "none" }}>
            <BulkQrPrintView ref={printComponentRef} accountsToPrint={selectedAccountsToPrint} />
        </div>
    </>
  );
};

export default AccountsTab;