// src/components/modals/EditAccountModal.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import type { Account, Transaction, Merchant } from "@/lib/mockData";
import {
  formatCurrency,
  formatDate,
  renderStatusBadge,
  formatDdMmYyyy,
  formatTime,
} from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint, UseReactToPrintOptions } from "react-to-print";
import ConfirmActionModal from "./ConfirmActionModal";

type AccountActionType = "suspend" | "reactivate";

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAccount: Account) => void;
  onSave: (updatedAccount: Account) => void;
  account: Account | null;
  allTransactions: Transaction[];
  merchants: Merchant[];
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  account,
  allTransactions = [],
  merchants = [],
}) => {
  // State for editable fields
  const [balanceStr, setBalanceStr] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmActionDetails, setConfirmActionDetails] = useState<{
    actionType: AccountActionType | null;
    account: Account | null;
  }>({ actionType: null, account: null });

  const qrCodePrintRef = useRef<HTMLDivElement>(null);

  // Effect to populate form and QR code
  useEffect(() => {
    if (account && isOpen) {
      setBalanceStr(account.balance?.toString() || "0");
      setNewPin("");
      setNewPin("");
      setQrCodeValue(`${account.id}?v=${Date.now()}`);
      setIsConfirmModalOpen(false);
      setConfirmActionDetails({ actionType: null, account: null });
    }
  }, [account, isOpen]);

  // Filter and Sort Transactions for this Account
  const accountTransactions = useMemo(() => {
    if (!account) return [];
    return allTransactions
      .filter((tx) => tx.accountId === account.id)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [allTransactions, account]);

  // Print QR Handler
  const handlePrintQr = useReactToPrint({
    content: () => qrCodePrintRef.current,
    content: () => qrCodePrintRef.current,
    documentTitle: `QR-Code-${account?.id || "Account"}`,
    removeAfterPrint: true,
  } as UseReactToPrintOptions);

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setTimeout(
      () => setConfirmActionDetails({ actionType: null, account: null }),
      300
    );
  };

  const handleConfirmStatusAction = () => {
    const { actionType, account: accountToUpdate } = confirmActionDetails;
    if (!actionType || !accountToUpdate) {
      console.error("Confirmation details are missing.");
      handleCloseConfirmModal();
      return;
    }

    const newStatus: Account["status"] =
      actionType === "suspend" ? "Suspended" : "Active";
    const updatedAccount: Account = {
      ...accountToUpdate,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    onSave(updatedAccount);
    handleCloseConfirmModal();
  };

  const handleToggleStatus = () => {
    if (!account) return;
    const newStatus: Account["status"] =
      account.status === "Active" ? "Suspended" : "Active";
    const actionType: AccountActionType =
      newStatus === "Suspended" ? "suspend" : "reactivate";

    setConfirmActionDetails({ actionType, account });
    setIsConfirmModalOpen(true);
  };

  const getConfirmModalProps = () => {
    const { actionType, account: accountToUpdate } = confirmActionDetails;
    if (!actionType || !accountToUpdate) return null;

    switch (actionType) {
      case "suspend":
        return {
          title: "Confirm Suspension",
          message: `Are you sure you want to suspend account ${accountToUpdate.id}?`,
          confirmButtonText: "Suspend Account",
          confirmButtonVariant: "danger" as const,
        };
      case "reactivate":
        return {
          title: "Confirm Reactivation",
          message: `Are you sure you want to reactivate account ${accountToUpdate.id}?`,
          confirmButtonText: "Reactivate Account",
          confirmButtonVariant: "success" as const,
        };
      default:
        return null;
    }
  };

  const confirmModalProps = getConfirmModalProps();

  if (!isOpen || !account) {
    return null;
  }

  const isActive = account.status === "Active";
  const toggleStatusButtonText = isActive ? "Suspend Account" : "Reactivate Account";
  const toggleStatusButtonClass = isActive
    ? "w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
    : "w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-start py-10 px-4">
      <div className="relative mx-auto p-6 border w-full max-w-6xl shadow-lg rounded-md bg-white my-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {" "}
            Account Details{" "}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            {" "}
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {" "}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>{" "}
            </svg>{" "}
          </button>
        </div>
        {/* MODIFIED: Main Body Grid - 2 Columns (1/3 width + 2/3 width) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* MODIFIED: Left Column (Info, Management, QR) - Takes 1/3 width */}
          <div className="md:col-span-1 space-y-6">
            {/* Beneficiary Info Section */}
            <div>
              <h4 className="text-md font-semibold text-gray-700 mb-2">
                {" "}
                Beneficiary Information{" "}
              </h4>
              <dl className="divide-y divide-gray-100 border border-gray-200 rounded-md p-4">
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">
                    Account ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {account.id}
                  </dd>
                </div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">
                    Child Name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {account.name}
                  </dd>
                </div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">
                    Guardian Name
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {account.guardianName || "N/A"}
                  </dd>
                </div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {renderStatusBadge(account.status, "account")}
                  </dd>
                </div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(account.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>
            {/* Account Management Section (Now under Beneficiary Info) */}
            <div className="p-4 border rounded-md">
              <h4 className="text-md font-semibold text-gray-700 mb-3">
                {" "}
                Account Management{" "}
              </h4>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="edit-balance"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {" "}
                    Balance{" "}
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="edit-balance"
                      value={balanceStr}
                      onChange={(e) => setBalanceStr(e.target.value)}
                      className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">USD</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="reset-pin"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {" "}
                    Reset PIN{" "}
                    <span className="text-xs text-gray-500">
                      (Leave blank to keep current)
                    </span>{" "}
                  </label>
                  <input
                    type="password"
                    id="reset-pin"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    maxLength={4}
                    pattern="[0-9]{4}"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary text-sm"
                    placeholder="Enter new 4-digit PIN"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {" "}
                    Account Status Actions{" "}
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    className={toggleStatusButtonClass}
                  >
                    {" "}
                    {toggleStatusButtonText}{" "}
                  </button>
                </div>
              </div>
            </div>
            {/* QR Code Section (Now under Account Management) */}
            <div className="p-4 border rounded-md">
              <h4 className="text-md font-semibold text-gray-700 mb-3">
                {" "}
                Account QR Code{" "}
              </h4>
              <div
                ref={qrCodePrintRef}
                className="flex justify-center items-center bg-gray-100 p-4 rounded mb-3 min-h-[180px]"
              >
                <QRCodeSVG
                  value={qrCodeValue}
                  size={128}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"L"}
                  includeMargin={true}
                />
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={() => handlePrintQr()}
                  className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {" "}
                  Print QR{" "}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">
                {" "}
                Use regenerate if card lost/stolen. Print for replacement.{" "}
              </p>
            </div>
          </div>

          {/* MODIFIED: Right Column (Transaction History) - Takes 2/3 width */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-md font-semibold text-gray-700 mb-2">
              {" "}
              Transaction History{" "}
            </h4>
            <div className="border rounded-md shadow-sm">
              {accountTransactions.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 text-center">
                  No transaction history found for this account.
                </p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Time
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Merchant Name
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Merchant ID
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Transaction ID
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-center font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accountTransactions.map((tx) => {
                      const merchant = merchants.find(
                        (m) => m.id === tx.merchantId
                      );
                      const merchantName = merchant
                        ? merchant.businessName
                        : tx.merchantId || "N/A";
                      const statusClass =
                        tx.status === "Approved"
                          ? "text-green-700"
                          : "text-red-700";
                      return (
                        <tr key={tx.id}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {formatDdMmYyyy(tx.timestamp)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {formatTime(tx.timestamp)}
                          </td>
                          <td
                            className="px-3 py-2 whitespace-nowrap truncate"
                            title={merchantName}
                          >
                            {merchantName}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono">
                            {tx.merchantId || "N/A"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono">
                            {tx.id}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td
                            className={`px-3 py-2 whitespace-nowrap text-center font-medium ${statusClass}`}
                          >
                            {tx.status}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        {/* Modal Footer (Unchanged) */}
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          >
            {" "}
            Cancel{" "}
          </button>
        </div>
      </div>

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