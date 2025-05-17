// src/components/modals/EditAccountModal.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Account, Merchant } from "@/lib/mockData"; // Assuming these base types
import { selectTransactionSchema } from "@/lib/db/schema"; // For Zod type inference
import { z } from "zod";
import {
  formatCurrency,
  formatDate, 
  renderStatusBadge,
  formatDateTime, 
  tuncateUUID, // Using the typo'd name as per your decision
} from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint, UseReactToPrintOptions } from "react-to-print";
import ConfirmActionModal from "./ConfirmActionModal";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

// Infer the select type from Drizzle Zod schema. This will have paymentId and other DB fields.
type DrizzleTransaction = z.infer<typeof selectTransactionSchema>;

// Interface for what's displayed in the transaction table, including looked-up merchant name
interface DisplayTransaction extends DrizzleTransaction {
  merchantNameDisplay: string; 
}

type AccountActionType = "suspend" | "reactivate";

// --- API Call Helper Functions ---
const suspendAccountAPI = async (accountId: string): Promise<Account> => {
  const response = await fetch(`/api/accounts/${accountId}/suspend`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to suspend account");
  }
  return response.json();
};

const reactivateAccountAPI = async (accountId: string): Promise<Account> => { 
  const response = await fetch(`/api/accounts/${accountId}/reactivate`, { 
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to reactivate account");
  }
  return response.json();
};

const updateAccountDetailsAPI = async (accountId: string, payload: { balance?: number; newPin?: string }): Promise<Account> => {
  const response = await fetch(`/api/accounts/${accountId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update account details");
  }
  return response.json();
};

const regenerateQrAPI = async (accountId: string): Promise<{ qrToken: string }> => {
  const response = await fetch(`/api/accounts/${accountId}/regenerate-qr`, {
    method: "POST",
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to regenerate QR code");
  }
  return response.json(); 
};

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAccount: Account) => void; 
  account: Account | null;
  allTransactions: DrizzleTransaction[]; 
  merchants: Merchant[]; 
  logAdminActivity?: (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: string
  ) => void;
}

// Component definition WITHOUT 'export' here if using default export at the bottom
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

  const suspendMutation = useMutation({
    mutationFn: suspendAccountAPI,
    onSuccess: (updatedAccountData: Account) => { 
      if (account) {
        toast.success("Account suspended successfully");
        logAdminActivity?.("Suspend Account", "Account", account.id, `Changed status to Suspended.`);
        onSave({ ...account, ...updatedAccountData, status: "Suspended" }); 
        handleCloseConfirmModal();
      }
    },
    onError: (error: Error) => toast.error(`Failed to suspend account: ${error.message}`),
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateAccountAPI,
    onSuccess: (updatedAccountData: Account) => {
      if (account) {
        toast.success("Account reactivated successfully");
        logAdminActivity?.("Reactivate Account", "Account", account.id, `Changed status to Active.`);
        onSave({ ...account, ...updatedAccountData, status: "Active" }); 
        handleCloseConfirmModal();
      }
    },
    onError: (error: Error) => toast.error(`Failed to reactivate account: ${error.message}`),
  });

  useEffect(() => {
    if (account && isOpen) {
      setBalanceStr(account.balance?.toString() || "0");
      setNewPin("");
      setCurrentQrToken(account.currentQrToken || null);
      setIsConfirmModalOpen(false);
      setConfirmActionDetails({ actionType: null, account: null });
    }
  }, [account, isOpen]);

  const accountTransactionsForDisplay: DisplayTransaction[] = useMemo(() => {
    if (!account) return [];
    return allTransactions
      .filter((tx) => tx.accountId === account.id)
      .map(tx => {
        const merchant = merchants.find(m => m.id === tx.merchantId);
        return {
          ...tx,
          merchantNameDisplay: merchant?.businessName || (tx.merchantId ? tuncateUUID(tx.merchantId) : "N/A"),
        };
      })
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [allTransactions, account, merchants]);

  const handlePrintQr = useReactToPrint({
    content: () => qrCodePrintRef.current,
    documentTitle: `QR-Code-${account?.displayId || "Account"}`,
    removeAfterPrint: true,
  } as UseReactToPrintOptions);

  const handleSaveChanges = async () => {
    if (!account) return;
    const balance = parseFloat(balanceStr);
    if (isNaN(balance) || balance < 0) {
      toast.error("Please enter a valid non-negative balance.");
      return;
    }
    if (newPin && (newPin.length !== 4 || !/^\d{4}$/.test(newPin))) {
      toast.error("PIN must be exactly 4 digits.");
      return;
    }

    const payload: { balance?: number; newPin?: string } = {};
    let detailsLog = "";
    const currentBalance = typeof account.balance === 'string' ? parseFloat(account.balance) : account.balance ?? 0;

    if (balance !== currentBalance) {
      payload.balance = balance;
      detailsLog += `Balance changed from ${formatCurrency(currentBalance)} to ${formatCurrency(balance)}. `;
    }
    if (newPin) {
      payload.newPin = newPin;
      detailsLog += `PIN update attempted. `;
    }

    if (Object.keys(payload).length === 0) {
      toast.info("No changes to save.");
      return;
    }

    try {
      const updatedAccountFromServer = await updateAccountDetailsAPI(account.id, payload);
      toast.success("Account updated successfully!");
      if(logAdminActivity && detailsLog) {
        logAdminActivity(
          "Edit Account Details", "Account", 
          `${account.displayId} (${tuncateUUID(account.id)})`,
          detailsLog.trim()
        );
      }
      onSave(updatedAccountFromServer); 
      onClose();
    } catch (error) {
      toast.error(`Error updating account: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setTimeout(() => setConfirmActionDetails({ actionType: null, account: null }), 300);
  };

  const handleConfirmStatusAction = () => {
    const { actionType: currentActionType, account: accountToUpdate } = confirmActionDetails;
    if (!currentActionType || !accountToUpdate) return;
    if (currentActionType === "suspend") suspendMutation.mutate(accountToUpdate.id);
    else if (currentActionType === "reactivate") reactivateMutation.mutate(accountToUpdate.id);
  };

  const handleToggleStatus = () => {
    if (!account) return;
    const actionType: AccountActionType | null =
      account.status === "Active" ? "suspend" : account.status === "Suspended" ? "reactivate" : null;
    if (actionType) {
      setConfirmActionDetails({ actionType, account });
      setIsConfirmModalOpen(true);
    } else {
      toast.info(`Account status is currently '${account.status}' and cannot be changed with this button.`);
    }
  };

  const getConfirmModalProps = () => {
    const { actionType, account: accountToUpdate } = confirmActionDetails;
    if (!actionType || !accountToUpdate) return null;
    const confirmBeneficiaryName = accountToUpdate.childName || "N/A";
    const guardianName = accountToUpdate.guardianName || "N/A";
    const isLoading = (actionType === "suspend" && suspendMutation.isPending) || (actionType === "reactivate" && reactivateMutation.isPending);
    const errorObject = actionType === "suspend" ? suspendMutation.error : reactivateMutation.error;
    const errorMessage = errorObject instanceof Error ? errorObject.message : null;

    switch (actionType) {
      case "suspend":
        return {
          title: "Confirm Suspension",
          message: (
            <>
              <p>
                Suspend account {accountToUpdate.displayId} (
                {tuncateUUID(accountToUpdate.id)}) ({guardianName} /{" "}
                {confirmBeneficiaryName})?
              </p>
              {errorMessage && (
                <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
              )}
            </>
          ),
          confirmButtonText: isLoading ? "Suspending..." : "Suspend Account",
          confirmButtonVariant: "danger" as const,
          isLoading,
        };
      case "reactivate":
        return {
          title: "Confirm Reactivation",
          message: (
            <>
              <p>
                Reactivate account {accountToUpdate.displayId} ({tuncateUUID(accountToUpdate.id)}) ({guardianName} /{" "}
                {confirmBeneficiaryName})?
              </p>
              {errorMessage && (
                <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
              )}
            </>
          ),
          confirmButtonText: isLoading ? "Reactivating..." : "Reactivate Account",
          confirmButtonVariant: "success" as const,
          isLoading,
        };
      default:
        return null;
    }
  };
  
  const handleGenerateQrCode = async () => {
    if (!account || isGeneratingQr) return;
    setIsGeneratingQr(true);
    try {
      const { qrToken: newToken } = await regenerateQrAPI(account.id);
      setCurrentQrToken(newToken);
      // Construct an object that fully matches the 'Account' type for onSave
      const updatedAccountForSave: Account = { 
        ...account, 
        currentQrToken: newToken, 
        updatedAt: new Date().toISOString(), // Convert Date to string for Account type
        lastActivity: new Date().toISOString() // Convert Date to string for Account type
      };
      onSave(updatedAccountForSave);
      toast.success("QR Code regenerated successfully!");
      logAdminActivity?.("Regenerate QR Code", "Account", account.id, `Generated new QR token.`);
    } catch (error) {
      toast.error(`Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const confirmModalProps = getConfirmModalProps();

  if (!isOpen || !account) {
    return null;
  }

  const canToggleStatus = account.status === "Active" || account.status === "Suspended";
  const isActive = account.status === "Active";
  const toggleStatusButtonText = isActive ? "Suspend Account" : "Reactivate Account";
  const toggleStatusButtonClass = isActive
    ? "w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
    : "w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50";
  const beneficiaryName = account.childName || "N/A";
  const displayAccountId = `${account.displayId} (${tuncateUUID(account.id)})`;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-start py-10 px-4">
      <div className="relative mx-auto p-6 border w-full max-w-6xl shadow-lg rounded-md bg-white my-auto">
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Account Details - {displayAccountId}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-1 space-y-6">
            <div>
              <h4 className="text-md font-semibold text-gray-700 mb-2">Beneficiary Information</h4>
              <dl className="divide-y divide-gray-100 border border-gray-200 rounded-md p-4 text-sm">
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="font-medium text-gray-500">Account ID</dt><dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2 font-mono">{displayAccountId}</dd></div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="font-medium text-gray-500">Child Name</dt><dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{beneficiaryName}</dd></div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="font-medium text-gray-500">Guardian</dt><dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{account.guardianName || "N/A"}</dd></div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center"><dt className="font-medium text-gray-500">Status</dt><dd className="mt-1 sm:mt-0 sm:col-span-2">{renderStatusBadge(account.status as DrizzleTransaction['status'], "account")}</dd></div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="font-medium text-gray-500">Created</dt><dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(account.createdAt)}</dd></div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="font-medium text-gray-500">Last Activity</dt><dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(account.lastActivity)}</dd></div>
                {account.updatedAt && <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"><dt className="font-medium text-gray-500">Updated</dt><dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(account.updatedAt)}</dd></div>}
              </dl>
            </div>
            <div className="p-4 border rounded-md">
              <h4 className="text-md font-semibold text-gray-700 mb-3">Account Management</h4>
              <div className="space-y-4">
                <div><label htmlFor="edit-balance" className="block text-sm font-medium text-gray-700">Balance</label><div className="mt-1 relative rounded-md shadow-sm"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">฿</span></div><input type="number" id="edit-balance" value={balanceStr} onChange={(e) => setBalanceStr(e.target.value)} className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm" placeholder="0.00" step="0.01" min="0"/><div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">THB</span></div></div></div>
                <div><label htmlFor="reset-pin" className="block text-sm font-medium text-gray-700">Reset PIN<span className="text-xs text-gray-500 ml-1">(Leave blank to keep current)</span></label><input type="password" id="reset-pin" value={newPin} onChange={(e) => setNewPin(e.target.value)} maxLength={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary text-sm" placeholder="Enter new 4-digit PIN" autoComplete="new-password"/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Status Actions</label><button type="button" onClick={handleToggleStatus} className={toggleStatusButtonClass} disabled={!canToggleStatus || suspendMutation.isPending || reactivateMutation.isPending}>{canToggleStatus ? toggleStatusButtonText : `Status: ${account.status}`}</button>{!canToggleStatus && <p className="text-xs text-gray-500 mt-1">Status can only be toggled between Active and Suspended.</p>}</div>
              </div>
            </div>
            <div className="p-4 border rounded-md">
              <h4 className="text-md font-semibold text-gray-700 mb-3">Account QR Code</h4>
              <div ref={qrCodePrintRef} className="bg-white p-2 inline-block"> <div className="flex justify-center items-center bg-gray-100 p-4 rounded mb-3 min-h-[180px] min-w-[180px]">{isGeneratingQr ? <span className="text-gray-500 text-sm">Generating...</span> : currentQrToken ? <QRCodeSVG value={currentQrToken} size={140} bgColor={"#ffffff"} fgColor={"#000000"} level={"H"} includeMargin={false}/> : <span className="text-gray-500 text-sm text-center">{'Click "Generate QR Code" to display the code.'}</span>}</div></div>
              <div className="flex flex-col sm:flex-row justify-center gap-3"><button type="button" onClick={handleGenerateQrCode} disabled={isGeneratingQr} className="py-1 px-3 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">{isGeneratingQr ? "Generating..." : currentQrToken ? "Regenerate QR Code" : "Generate QR Code"}</button><button type="button" onClick={() => handlePrintQr()} disabled={!currentQrToken || isGeneratingQr} className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">Print QR Code</button></div>
              <p className="mt-2 text-xs text-gray-500 text-center">Regenerating creates a new code and invalidates the previous one.</p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-md font-semibold text-gray-700 mb-2">Transaction History</h4>
            {/* MODIFIED: Added w-full, overflow-x-auto to this div, removed overflow-hidden */}
            <div className="transaction-history-table-container w-full border rounded-md shadow-sm overflow-x-auto">
              {accountTransactionsForDisplay.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 text-center">No transaction history found for this account.</p>
              ) : (
                // MODIFIED: Replaced min-w-full with w-full and min-w-[1080px] (or adjust value as needed), added border-collapse
                <table className="transaction-history-actual-table w-full min-w-[1080px] border-collapse divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Date</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Time</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Merchant Name</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Merchant ID</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Txn ID (PaymentID)</th>
                      <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Amount (THB)</th>
                      <th scope="col" className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accountTransactionsForDisplay.map((tx) => {
                      const { date, time } = formatDateTime(tx.timestamp); // tx.timestamp is Date from Drizzle
                      const displayTxnId = tx.paymentId; 
                      const merchantDisplay = tx.merchantNameDisplay; 

                      return (
                        <tr key={tx.id}>
                          <td className="px-3 py-2 whitespace-nowrap">{date}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs">{time}</td>
                          <td className="px-3 py-2 whitespace-nowrap truncate max-w-[150px]" title={merchantDisplay}>{merchantDisplay}</td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{tx.merchantId ? tuncateUUID(tx.merchantId) : "N/A"}</td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono text-xs truncate max-w-[100px]" title={displayTxnId || ""}>{displayTxnId ? tuncateUUID(displayTxnId) : "N/A"}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-right font-medium">
                            {/* Drizzle returns numeric as string, so parseFloat */}
                            {tx.type === "Credit" || (tx.type === "Adjustment" && parseFloat(tx.amount) > 0) ? "+" : "-"}
                            {formatCurrency(Math.abs(parseFloat(tx.amount)))} 
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">{renderStatusBadge(tx.status, "transaction")}</td>
                          <td className="px-3 py-2 whitespace-nowrap truncate max-w-[200px]" title={tx.description || ""}>{tx.description || ""}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300">Cancel</button>
          <button type="button" onClick={handleSaveChanges} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" disabled={suspendMutation.isPending || reactivateMutation.isPending || isGeneratingQr}>Save Changes</button>
        </div>
      </div>

      {confirmModalProps && (
        <ConfirmActionModal
          isOpen={isConfirmModalOpen}
          onClose={handleCloseConfirmModal}
          onConfirm={handleConfirmStatusAction}
          title={confirmModalProps.title!} 
          message={confirmModalProps.message!} 
          confirmButtonText={confirmModalProps.confirmButtonText!} 
          confirmButtonVariant={confirmModalProps.confirmButtonVariant}
          isLoading={confirmModalProps.isLoading || false}
        />
      )}
    </div>
  );
};

export default EditAccountModal;