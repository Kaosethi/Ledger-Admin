// src/components/modals/EditAccountModal.tsx
// MODIFIED: Changed currency symbol and code in Balance input from USD/$ to THB/฿.

import React, { useState, useEffect, useRef, useMemo } from "react";
import type { Account, Transaction, Merchant } from "@/lib/mockData"; // Ensure this path is correct
import {
  formatCurrency,
  formatDate,
  renderStatusBadge,
  formatDateTime,
} from "@/lib/utils"; // Ensure this path is correct
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint, UseReactToPrintOptions } from "react-to-print";
import ConfirmActionModal from "./ConfirmActionModal"; // Ensure this path is correct

type AccountActionType = "suspend" | "reactivate";

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAccount: Account) => void;
  account: Account | null;
  allTransactions: Transaction[];
  merchants: Merchant[];
  logAdminActivity?: (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: string
  ) => void;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  account,
  allTransactions = [],
  merchants = [],
  logAdminActivity,
}) => {
  const [balanceStr, setBalanceStr] = useState("");
  const [newPin, setNewPin] = useState("");
  const [currentQrToken, setCurrentQrToken] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmActionDetails, setConfirmActionDetails] = useState<{
    actionType: AccountActionType | null;
    account: Account | null;
  }>({ actionType: null, account: null });

  const qrCodePrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (account && isOpen) {
      setBalanceStr(account.balance?.toString() || "0");
      setNewPin("");
      setCurrentQrToken(null);
      setIsConfirmModalOpen(false);
      setConfirmActionDetails({ actionType: null, account: null });
    }
  }, [account, isOpen]);

  const accountTransactions = useMemo(() => {
    if (!account) return [];
    return allTransactions
      .filter((tx) => tx.accountId === account.id)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [allTransactions, account]);

  const handlePrintQr = useReactToPrint({
    content: () => qrCodePrintRef.current,
    documentTitle: `QR-Code-${account?.id || "Account"}`,
    removeAfterPrint: true,
  } as UseReactToPrintOptions);

  const handleSaveChanges = () => {
    if (!account) return;
    const balance = parseFloat(balanceStr);
    if (isNaN(balance) || balance < 0) {
      alert("Please enter a valid non-negative balance.");
      return;
    }
    if (newPin && (newPin.length !== 4 || !/^\d{4}$/.test(newPin))) {
      alert("PIN must be exactly 4 digits.");
      return;
    }
    const updateData: Partial<Account> = {};
    let changed = false;
    if (balance !== account.balance) {
      updateData.balance = balance;
      changed = true;
    }
    if (newPin && newPin !== account.pin) {
      updateData.pin = newPin;
      changed = true;
    }
    if (!changed) {
      onClose(); // Close if nothing changed
      return;
    }
    updateData.updatedAt = new Date().toISOString();
    // Also update lastActivity when balance or PIN changes
    updateData.lastActivity = new Date().toISOString();
    const updatedAccount: Account = { ...account, ...updateData };
    logAdminActivity?.(
      "Edit Account Details",
      "Account",
      account.id,
      `Updated balance or PIN.` // Logging balance change doesn't include symbol, so no change needed here.
    );
    onSave(updatedAccount);
    onClose();
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setTimeout(() => setConfirmActionDetails({ actionType: null, account: null }), 300);
  };

  const handleConfirmStatusAction = () => {
    const { actionType, account: accountToUpdate } = confirmActionDetails;
    if (!actionType || !accountToUpdate) {
      console.error("Confirmation details missing.");
      handleCloseConfirmModal();
      return;
    }
    // Match status type: 'Active' | 'Inactive' | 'Suspended'
    const newStatus: Account["status"] =
      actionType === "suspend" ? "Suspended" : "Active";
    const updatedAccount: Account = {
      ...accountToUpdate,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(), // Update lastActivity on status change too
    };
    logAdminActivity?.(
      actionType === "suspend" ? "Suspend Account" : "Reactivate Account",
      "Account",
      accountToUpdate.id,
      `Changed status to ${newStatus}.`
    );
    onSave(updatedAccount);
    handleCloseConfirmModal();
  };

  const handleToggleStatus = () => {
    if (!account) return;
    // Only allow toggling between Active and Suspended for now
    // If Inactive, maybe a different action is needed?
    const actionType: AccountActionType | null =
      account.status === "Active" ? "suspend" :
      account.status === "Suspended" ? "reactivate" :
      null; // Can't toggle 'Inactive' with this button

    if (actionType) {
        setConfirmActionDetails({ actionType, account });
        setIsConfirmModalOpen(true);
    } else {
        alert(`Account status is currently '${account.status}' and cannot be changed with this button.`);
    }
  };

  const getConfirmModalProps = () => {
    const { actionType, account: accountToUpdate } = confirmActionDetails;
    if (!actionType || !accountToUpdate) return null;
    // Use childName directly from the account object
    const confirmBeneficiaryName = accountToUpdate.childName || "N/A";
    const guardianName = accountToUpdate.guardianName || "N/A";
    switch (actionType) {
      case "suspend":
        return {
          title: "Confirm Suspension",
          message: `Suspend account ${accountToUpdate.id} (${guardianName} / ${confirmBeneficiaryName})?`,
          confirmButtonText: "Suspend Account",
          confirmButtonVariant: "danger" as const,
        };
      case "reactivate":
        return {
          title: "Confirm Reactivation",
          message: `Reactivate account ${accountToUpdate.id} (${guardianName} / ${confirmBeneficiaryName})?`,
          confirmButtonText: "Reactivate Account",
          confirmButtonVariant: "success" as const,
        };
      default:
        return null;
    }
  };

  const handleGenerateQrCode = async () => {
    if (!account || isGeneratingQr) return;
    setIsGeneratingQr(true);
    setCurrentQrToken(null);

    try {
      console.log(`Simulating API call to POST /api/beneficiaries/${account.id}/regenerate-qr`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      const newToken = crypto.randomUUID();
      console.log(`Simulated API response: New token is ${newToken}`);
      setCurrentQrToken(newToken);
      logAdminActivity?.(
        "Generate QR Code",
        "Account",
        account.id,
        `Generated new QR token.`
      );
    } catch (error) {
      console.error("Error generating QR code token:", error);
      alert(`Failed to generate QR code token: ${error instanceof Error ? error.message : String(error)}`);
      setCurrentQrToken(null);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const confirmModalProps = getConfirmModalProps();

  if (!isOpen || !account) {
    return null;
  }

  // Based on the toggle logic, this button now only toggles Active/Suspended
  const canToggleStatus = account.status === "Active" || account.status === "Suspended";
  const isActive = account.status === "Active";
  const toggleStatusButtonText = isActive ? "Suspend Account" : "Reactivate Account";
  const toggleStatusButtonClass = isActive
    ? "w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
    : "w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50";
  const beneficiaryName = account.childName || "N/A"; // Use childName

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-start py-10 px-4">
      <div className="relative mx-auto p-6 border w-full max-w-6xl shadow-lg rounded-md bg-white my-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Account Details - {account.id}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            {/* Close Icon SVG */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Left Col */}
          <div className="md:col-span-1 space-y-6">
            {/* Info */}
            <div>
              <h4 className="text-md font-semibold text-gray-700 mb-2">Beneficiary Information</h4>
              <dl className="divide-y divide-gray-100 border border-gray-200 rounded-md p-4 text-sm">
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-gray-500">Account ID</dt>
                  <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2 font-mono">{account.id}</dd>
                </div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-gray-500">Child Name</dt>
                  <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{beneficiaryName}</dd> {/* Use variable */}
                </div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-gray-500">Guardian</dt>
                  <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{account.guardianName || "N/A"}</dd>
                </div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                  <dt className="font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 sm:mt-0 sm:col-span-2">{renderStatusBadge(account.status, "account")}</dd>
                </div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(account.createdAt)}</dd>
                </div>
                {/* Use lastActivity */}
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-gray-500">Last Activity</dt>
                  <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(account.lastActivity)}</dd>
                </div>
                {/* Display updatedAt if it exists */}
                 {account.updatedAt && (
                     <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                         <dt className="font-medium text-gray-500">Updated</dt>
                         <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(account.updatedAt)}</dd>
                     </div>
                 )}
              </dl>
            </div>

            {/* Management */}
            <div className="p-4 border rounded-md">
              <h4 className="text-md font-semibold text-gray-700 mb-3">Account Management</h4>
              <div className="space-y-4">
                {/* Balance Input */}
                <div>
                  <label htmlFor="edit-balance" className="block text-sm font-medium text-gray-700">Balance</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                      {/* Balance Input Structure */}
                       {/* MODIFIED: Changed $ to ฿ */}
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">฿</span></div>
                       <input type="number" id="edit-balance" value={balanceStr} onChange={(e) => setBalanceStr(e.target.value)} className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm" placeholder="0.00" step="0.01" min="0"/>
                       {/* MODIFIED: Changed USD to THB */}
                       <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">THB</span></div>
                  </div>
                </div>
                {/* PIN Input */}
                <div>
                  <label htmlFor="reset-pin" className="block text-sm font-medium text-gray-700">Reset PIN<span className="text-xs text-gray-500 ml-1">(Leave blank to keep current)</span></label>
                  <input type="password" id="reset-pin" value={newPin} onChange={(e) => setNewPin(e.target.value)} maxLength={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary text-sm" placeholder="Enter new 4-digit PIN" autoComplete="new-password"/>
                </div>
                {/* Status Toggle Button */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Status Actions</label>
                  <button type="button" onClick={handleToggleStatus} className={toggleStatusButtonClass} disabled={!canToggleStatus}>
                    {canToggleStatus ? toggleStatusButtonText : `Status: ${account.status}`}
                  </button>
                  {!canToggleStatus && <p className="text-xs text-gray-500 mt-1">Status can only be toggled between Active and Suspended.</p>}
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="p-4 border rounded-md">
              <h4 className="text-md font-semibold text-gray-700 mb-3">Account QR Code</h4>
              <div ref={qrCodePrintRef}> {/* Ref for printing */}
                <div className="flex justify-center items-center bg-gray-100 p-4 rounded mb-3 min-h-[180px]">
                  {isGeneratingQr ? (
                    <span className="text-gray-500 text-sm">Generating...</span>
                  ) : currentQrToken ? (
                    <QRCodeSVG value={currentQrToken} size={140} bgColor={"#ffffff"} fgColor={"#000000"} level={"H"} includeMargin={true} />
                  ) : (
                    <span className="text-gray-500 text-sm text-center">Click &quot;Generate QR Code&quot; to display the code.</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                 {/* Generate Button */}
                 <button type="button" onClick={handleGenerateQrCode} disabled={isGeneratingQr} className="py-1 px-3 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
                    {isGeneratingQr ? "Generating..." : currentQrToken ? "Regenerate QR Code" : "Generate QR Code"}
                 </button>
                 {/* Print Button */}
                 <button type="button" onClick={() => handlePrintQr()} disabled={!currentQrToken || isGeneratingQr} className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
                    Print QR Code
                 </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">Regenerating creates a new code and invalidates the previous one.</p>
            </div>
          </div>

          {/* Right Col (Transaction History) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-md font-semibold text-gray-700 mb-2">Transaction History</h4>
            <div className="border rounded-md shadow-sm overflow-hidden max-h-[calc(100vh-20rem)] overflow-y-auto">
              {accountTransactions.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 text-center">No transaction history found for this account.</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    {/* Transaction Table Headers */}
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant Name</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant ID</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Txn ID</th>
                      <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Transaction Table Rows */}
                    {accountTransactions.map((tx) => {
                      const merchant = merchants.find((m) => m.id === tx.merchantId);
                      const merchantDisplay = merchant?.businessName || tx.merchantId || "N/A";
                      const { date, time } = formatDateTime(tx.timestamp);
                      return (
                        <tr key={tx.id}>
                          <td className="px-3 py-2 whitespace-nowrap">{date}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs">{time}</td>
                          <td className="px-3 py-2 whitespace-nowrap truncate max-w-[150px]" title={merchantDisplay}>{merchantDisplay}</td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{tx.merchantId || "N/A"}</td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono text-xs truncate max-w-[100px]" title={tx.id}>{tx.id}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-right font-medium">{(tx.type === 'Credit' || (tx.type === 'Adjustment' && tx.amount > 0) ? '+' : '-')}{formatCurrency(Math.abs(tx.amount))}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">{renderStatusBadge(tx.status, 'transaction')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300">Cancel</button>
          <button type="button" onClick={handleSaveChanges} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">Save Changes</button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModalProps && (
        <ConfirmActionModal
          isOpen={isConfirmModalOpen}
          onClose={handleCloseConfirmModal}
          onConfirm={handleConfirmStatusAction}
          title={confirmModalProps.title}
          message={confirmModalProps.message}
          confirmButtonText={confirmModalProps.confirmButtonText}
          confirmButtonVariant={confirmModalProps.confirmButtonVariant}
        />
      )}
    </div>
  );
};

export default EditAccountModal;