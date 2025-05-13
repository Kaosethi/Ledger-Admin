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
import QRCode from "qrcode";
import { useReactToPrint, UseReactToPrintOptions } from "react-to-print";
import ConfirmActionModal from "./ConfirmActionModal"; // Ensure this path is correct
import QrCodePrintable from "../print/QrCodePrintable"; // Import the printable QR code component
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type AccountActionType = "suspend" | "reactivate";

interface QRPayload {
  type: string;
  account: string;
  ver: string;
  sig?: string;
}

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
  const [currentQrToken, setCurrentQrToken] = useState<QRPayload | null>(null);
  const [qrCodeString, setQrCodeString] = useState<string>("");
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmActionDetails, setConfirmActionDetails] = useState<{
    actionType: AccountActionType | null;
    account: Account | null;
  }>({ actionType: null, account: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingQr, setIsSavingQr] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const qrCodePrintRef = useRef<HTMLDivElement>(null);
  const qrCodeA4PrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (account && isOpen) {
      setBalanceStr(account.balance?.toString() || "0");
      setNewPin("");

      // Reset QR code state
      setCurrentQrToken(null);
      setQrCodeString("");

      // Check if the account has a QR code and try to display it
      // API returns currentQrToken, but Account interface might use qrCode
      const existingQrCode = account.qrCode || account.currentQrToken;

      if (existingQrCode) {
        try {
          // Set the QR code string directly from the account
          setQrCodeString(existingQrCode);

          // Try to decode the QR code to show the payload details
          const decodedString = atob(existingQrCode);
          const decodedToken = JSON.parse(decodedString);

          // Set the current token if valid
          if (decodedToken.type && decodedToken.account && decodedToken.ver) {
            setCurrentQrToken(decodedToken);
          }
        } catch (error) {
          console.error("Error parsing existing QR code:", error);
          // If there's an error decoding, we'll just leave the currentQrToken as null
        }
      }

      setIsConfirmModalOpen(false);
      setConfirmActionDetails({ actionType: null, account: null });
      setIsSubmitting(false);
    }
  }, [account, isOpen]);

  // Generate QR code string when token changes
  useEffect(() => {
    if (currentQrToken) {
      // Encode JSON payload to base64 for QR code
      const jsonString = JSON.stringify(currentQrToken);
      const base64Encoded = btoa(jsonString);
      setQrCodeString(base64Encoded);
    } else {
      setQrCodeString("");
    }
  }, [currentQrToken]);

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

  // New function to generate and download PDF with multiple QR codes
  const handlePrintA4Qr = async () => {
    if (!account || !qrCodeString) return;

    setIsPrinting(true);

    try {
      // Log the activity
      logAdminActivity?.(
        "Print QR Code",
        "Account",
        account.displayId,
        `Generated printable QR codes for ${account.childName}`
      );

      // Create new PDF document (A4 size)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // A4 dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Reduced margins
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      // Card dimensions (2 columns, 4 rows = 8 cards)
      const cardWidth = contentWidth / 2;
      const cardHeight = contentHeight / 4;

      // QR code size and positions
      const qrSize = 40; // mm - slightly smaller QR code

      // Card positions (2x4 grid)
      const positions = [
        { x: margin, y: margin }, // top-left
        { x: margin + cardWidth, y: margin }, // top-right
        { x: margin, y: margin + cardHeight }, // second row left
        { x: margin + cardWidth, y: margin + cardHeight }, // second row right
        { x: margin, y: margin + cardHeight * 2 }, // third row left
        { x: margin + cardWidth, y: margin + cardHeight * 2 }, // third row right
        { x: margin, y: margin + cardHeight * 3 }, // bottom row left
        { x: margin + cardWidth, y: margin + cardHeight * 3 }, // bottom row right
      ];

      // No header - removed title and date

      // Draw cards with QR codes
      for (let i = 0; i < 8; i++) {
        const pos = positions[i];

        // Draw card border with dashed line
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.5);

        // Create dashed line effect manually by drawing line segments
        const dashLength = 3; // mm
        const dashGap = 2; // mm

        // Draw top dashed line
        for (let x = pos.x; x < pos.x + cardWidth; x += dashLength + dashGap) {
          const lineLength = Math.min(dashLength, pos.x + cardWidth - x);
          pdf.line(x, pos.y, x + lineLength, pos.y);
        }

        // Draw right dashed line
        for (let y = pos.y; y < pos.y + cardHeight; y += dashLength + dashGap) {
          const lineLength = Math.min(dashLength, pos.y + cardHeight - y);
          pdf.line(pos.x + cardWidth, y, pos.x + cardWidth, y + lineLength);
        }

        // Draw bottom dashed line
        for (let x = pos.x; x < pos.x + cardWidth; x += dashLength + dashGap) {
          const lineLength = Math.min(dashLength, pos.x + cardWidth - x);
          pdf.line(x, pos.y + cardHeight, x + lineLength, pos.y + cardHeight);
        }

        // Draw left dashed line
        for (let y = pos.y; y < pos.y + cardHeight; y += dashLength + dashGap) {
          const lineLength = Math.min(dashLength, pos.y + cardHeight - y);
          pdf.line(pos.x, y, pos.x, y + lineLength);
        }

        // Card content - Account ID
        pdf.setFontSize(12);
        pdf.text(
          `Account ID: ${account.displayId}`,
          pos.x + cardWidth / 2,
          pos.y + 10,
          { align: "center" }
        );

        // Child and Guardian on same line
        pdf.setFontSize(10);
        pdf.text(
          `${account.childName || "N/A"} / ${account.guardianName || "N/A"}`,
          pos.x + cardWidth / 2,
          pos.y + 17,
          { align: "center" }
        );

        // Generate QR code as separate canvas
        const qrCanvas = document.createElement("canvas");

        try {
          // Generate QR code on canvas
          await QRCode.toCanvas(qrCanvas, qrCodeString, {
            width: 400,
            margin: 0,
            color: {
              dark: "#000000",
              light: "#ffffff",
            },
            errorCorrectionLevel: "H",
          });

          // Convert canvas to image data
          const qrImageData = qrCanvas.toDataURL("image/jpeg", 1.0);

          // Center the QR code in the card
          const qrX = pos.x + (cardWidth - qrSize) / 2;
          const qrY = pos.y + 22; // Position QR code closer to the top
          pdf.addImage(qrImageData, "JPEG", qrX, qrY, qrSize, qrSize);

          // Removed "Scan to process transaction" message
        } catch (qrError) {
          console.error("Error adding QR code:", qrError);
          pdf.setFontSize(10);
          pdf.text(
            "Error generating QR code",
            pos.x + cardWidth / 2,
            pos.y + 50,
            { align: "center" }
          );
        }
      }

      // Simplified footer
      pdf.setFontSize(6);
      pdf.text(
        `Ledger Admin - ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        pageHeight - 3,
        { align: "center" }
      );

      // Save the PDF
      pdf.save(`QR-Codes-${account.displayId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSaveChanges = async () => {
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

    // Check if anything changed
    let changed = false;
    const payload: { balance?: number; pin?: string; qrCode?: string } = {};

    if (balance !== account.balance) {
      payload.balance = balance;
      changed = true;
    }

    if (newPin && newPin !== account.pin) {
      payload.pin = newPin;
      changed = true;
    }

    // Include QR code if it exists
    if (
      qrCodeString &&
      qrCodeString.length > 0 &&
      qrCodeString !== account.currentQrToken
    ) {
      payload.qrCode = qrCodeString;
      changed = true;
    }

    if (!changed) {
      onClose(); // Close if nothing changed
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the balance-and-pin API endpoint
      const response = await fetch(
        `/api/accounts/${account.id}/balance-and-pin`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          `Failed to update account: ${errorData.error || response.statusText}`
        );
      }

      // Get the updated account from the response
      const updatedAccount = await response.json();

      // Log activity (API already logs activity server-side, but we'll keep this for UI feedback)
      const changes = [
        payload.balance !== undefined ? "balance" : "",
        payload.pin ? "PIN" : "",
        payload.qrCode ? "QR code" : "",
      ]
        .filter(Boolean)
        .join(", ");

      logAdminActivity?.(
        "Edit Account Details",
        "Account",
        account.displayId,
        `Updated ${changes}.`
      );

      // Update the local state with the returned account
      onSave(updatedAccount);
      onClose();
    } catch (error) {
      console.error("Error updating account:", error);
      alert(
        `Failed to update account: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setTimeout(
      () => setConfirmActionDetails({ actionType: null, account: null }),
      300
    );
  };

  const handleConfirmStatusAction = async () => {
    const { actionType, account: accountToUpdate } = confirmActionDetails;
    if (!actionType || !accountToUpdate) {
      console.error("Confirmation details missing.");
      handleCloseConfirmModal();
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the appropriate endpoint based on action type
      const endpoint =
        actionType === "suspend"
          ? `/api/accounts/${accountToUpdate.id}/suspend`
          : `/api/accounts/${accountToUpdate.id}/reactive`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${actionType} account: ${response.statusText}`
        );
      }

      // Get the updated account from the response
      const updatedAccount = await response.json();

      logAdminActivity?.(
        actionType === "suspend" ? "Suspend Account" : "Reactivate Account",
        "Account",
        accountToUpdate.id,
        `Changed status to ${updatedAccount.status}.`
      );

      onSave(updatedAccount);
      handleCloseConfirmModal();
    } catch (error) {
      console.error(`Error ${actionType}ing account:`, error);
      alert(`Failed to ${actionType} account. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = () => {
    if (!account) return;
    // Only allow toggling between Active and Suspended for now
    // If Inactive, maybe a different action is needed?
    const actionType: AccountActionType | null =
      account.status === "Active"
        ? "suspend"
        : account.status === "Suspended"
        ? "reactivate"
        : null; // Can't toggle 'Inactive' with this button

    if (actionType) {
      setConfirmActionDetails({ actionType, account });
      setIsConfirmModalOpen(true);
    } else {
      alert(
        `Account status is currently '${account.status}' and cannot be changed with this button.`
      );
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
          message: `Suspend account ${accountToUpdate.displayId} (${guardianName} / ${confirmBeneficiaryName})?`,
          confirmButtonText: "Suspend Account",
          confirmButtonVariant: "danger" as const,
        };
      case "reactivate":
        return {
          title: "Confirm Reactivation",
          message: `Reactivate account ${accountToUpdate.displayId} (${guardianName} / ${confirmBeneficiaryName})?`,
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
    setQrCodeString("");

    try {
      // Create QR payload using the qr-sign API
      const response = await fetch("/api/qr-sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "pay",
          account: account.displayId,
          ver: "1.0",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate QR code: ${response.statusText}`);
      }

      const qrPayload = await response.json();
      setCurrentQrToken(qrPayload);

      // Optional: Save the QR code immediately when generated
      // Uncomment this section to automatically update the account with the new QR code
      /*
      const saveResponse = await fetch(
        `/api/accounts/${account.id}/balance-and-pin`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            qrCode: btoa(JSON.stringify(qrPayload))
          }),
        }
      );

      if (!saveResponse.ok) {
        console.warn("QR code generated but not saved to account.");
      }
      */

      logAdminActivity?.(
        "Generate QR Code",
        "Account",
        account.id,
        `Generated new QR token for account.`
      );
    } catch (error) {
      console.error("Error generating QR code token:", error);
      alert(
        `Failed to generate QR code token: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      setCurrentQrToken(null);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleSaveQrCode = async () => {
    if (!account || !qrCodeString || isSavingQr) return;

    // Skip if the QR code hasn't changed
    if (qrCodeString === account.currentQrToken) {
      alert("This QR code is already saved to the account.");
      return;
    }

    setIsSavingQr(true);

    try {
      const response = await fetch(
        `/api/accounts/${account.id}/balance-and-pin`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            qrCode: qrCodeString,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save QR code: ${response.statusText}`);
      }

      // Get the updated account from the response
      const updatedAccount = await response.json();

      logAdminActivity?.(
        "Save QR Code",
        "Account",
        account.id,
        `Saved QR code to account.`
      );

      // Update the local state with the returned account
      onSave(updatedAccount);

      alert("QR code successfully saved to account");
    } catch (error) {
      console.error("Error saving QR code:", error);
      alert(
        `Failed to save QR code: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsSavingQr(false);
    }
  };

  const confirmModalProps = getConfirmModalProps();

  if (!isOpen || !account) {
    return null;
  }

  // Based on the toggle logic, this button now only toggles Active/Suspended
  const canToggleStatus =
    account.status === "Active" || account.status === "Suspended";
  const isActive = account.status === "Active";
  const toggleStatusButtonText = isActive
    ? "Suspend Account"
    : "Reactivate Account";
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
            Account Details - {account.displayId}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            {/* Close Icon SVG */}
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {/* Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Left Col */}
          <div className="md:col-span-1 space-y-6">
            {/* Info */}
            <div>
              <h4 className="text-md font-semibold text-gray-700 mb-2">
                Beneficiary Information
              </h4>
              <dl className="divide-y divide-gray-100 border border-gray-200 rounded-md p-4 text-sm">
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-gray-500">Account ID</dt>
                  <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                    {account.displayId}
                  </dd>
                </div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-gray-500">Child Name</dt>
                  <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">
                    {beneficiaryName}
                  </dd>{" "}
                  {/* Use variable */}
                </div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-gray-500">Guardian</dt>
                  <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">
                    {account.guardianName || "N/A"}
                  </dd>
                </div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 items-center">
                  <dt className="font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 sm:mt-0 sm:col-span-2">
                    {renderStatusBadge(account.status, "account")}
                  </dd>
                </div>
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(account.createdAt)}
                  </dd>
                </div>
                {/* Use lastActivity */}
                <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="font-medium text-gray-500">Last Activity</dt>
                  <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(account.lastActivity)}
                  </dd>
                </div>
                {/* Display updatedAt if it exists */}
                {account.updatedAt && (
                  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="font-medium text-gray-500">Updated</dt>
                    <dd className="mt-1 text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatDate(account.updatedAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Management */}
            <div className="p-4 border rounded-md">
              <h4 className="text-md font-semibold text-gray-700 mb-3">
                Account Management
              </h4>
              <div className="space-y-4">
                {/* Balance Input */}
                <div>
                  <label
                    htmlFor="edit-balance"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Balance
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    {/* Balance Input Structure */}
                    {/* MODIFIED: Changed $ to ฿ */}
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">฿</span>
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
                      disabled={isSubmitting}
                    />
                    {/* MODIFIED: Changed USD to THB */}
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">THB</span>
                    </div>
                  </div>
                </div>
                {/* PIN Input */}
                <div>
                  <label
                    htmlFor="reset-pin"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Reset PIN
                    <span className="text-xs text-gray-500 ml-1">
                      (Leave blank to keep current)
                    </span>
                  </label>
                  <input
                    type="password"
                    id="reset-pin"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    maxLength={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary text-sm"
                    placeholder="Enter new 4-digit PIN"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PIN must be exactly 4 digits. This will reset the
                    account&apos;s access PIN.
                  </p>
                </div>
                {/* Status Toggle Button */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Status Actions
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    className={`${toggleStatusButtonClass} flex items-center justify-center`}
                    disabled={!canToggleStatus || isSubmitting}
                  >
                    {isSubmitting && (
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    {canToggleStatus
                      ? toggleStatusButtonText
                      : `Status: ${account.status}`}
                  </button>
                  {!canToggleStatus && (
                    <p className="text-xs text-gray-500 mt-1">
                      Status can only be toggled between Active and Suspended.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="p-4 border rounded-md">
              <h4 className="text-md font-semibold text-gray-700 mb-3">
                Account QR Code
              </h4>
              <div ref={qrCodePrintRef}>
                {" "}
                {/* Ref for printing */}
                <div className="flex justify-center items-center bg-gray-100 p-4 rounded mb-3 min-h-[180px]">
                  {isGeneratingQr ? (
                    <div className="flex flex-col items-center">
                      <svg
                        className="animate-spin h-8 w-8 text-primary mb-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="text-gray-500 text-sm">
                        Generating QR Code...
                      </span>
                    </div>
                  ) : qrCodeString ? (
                    <div className="flex flex-col items-center">
                      <QRCodeSVG
                        value={qrCodeString}
                        size={140}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"H"}
                        includeMargin={true}
                      />
                      <div className="text-xs text-gray-500 mt-2 font-mono max-w-full break-all px-2 text-center">
                        <span className="font-bold">Base64 Encoded:</span>
                        <br />
                        {qrCodeString}
                        {currentQrToken && (
                          <>
                            <br />
                            <span className="font-bold mt-1">
                              Decoded Payload:
                            </span>
                            <br />
                            {JSON.stringify(currentQrToken, null, 2)}
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm text-center">
                      Click &quot;Generate QR Code&quot; to display the code.
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                {/* Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerateQrCode}
                  disabled={isGeneratingQr}
                  className="py-1 px-3 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center"
                >
                  {isGeneratingQr ? (
                    <>
                      <svg
                        className="animate-spin h-3 w-3 mr-1"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating...
                    </>
                  ) : currentQrToken ? (
                    "Regenerate QR Code"
                  ) : (
                    "Generate QR Code"
                  )}
                </button>
                {/* Save QR Button */}
                {qrCodeString && (
                  <button
                    type="button"
                    onClick={handleSaveQrCode}
                    disabled={isSavingQr || isSubmitting}
                    className="py-1 px-3 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center justify-center"
                  >
                    {isSavingQr ? (
                      <>
                        <svg
                          className="animate-spin h-3 w-3 mr-1"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save QR to Account"
                    )}
                  </button>
                )}
                {/* Print Button */}
                <button
                  type="button"
                  onClick={handlePrintA4Qr}
                  disabled={!currentQrToken || isGeneratingQr || isPrinting}
                  className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 flex items-center justify-center"
                >
                  {isPrinting ? (
                    <>
                      <svg
                        className="animate-spin h-3 w-3 mr-1"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Printing...
                    </>
                  ) : (
                    "Print QR Code (PDF)"
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Regenerating creates a new code and invalidates the previous
                one.
              </p>
            </div>
          </div>

          {/* Right Col (Transaction History) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-md font-semibold text-gray-700 mb-2">
              Transaction History
            </h4>
            <div className="border rounded-md shadow-sm overflow-hidden max-h-[calc(100vh-20rem)] overflow-y-auto">
              {accountTransactions.length === 0 ? (
                <p className="text-sm text-gray-500 p-4 text-center">
                  No transaction history found for this account.
                </p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    {/* Transaction Table Headers */}
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Time
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Merchant Name
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Merchant ID
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Txn ID
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Transaction Table Rows */}
                    {accountTransactions.map((tx) => {
                      const merchant = merchants.find(
                        (m) => m.id === tx.merchantId
                      );
                      const merchantDisplay =
                        merchant?.name || tx.merchantId || "N/A";
                      const { date, time } = formatDateTime(tx.timestamp);
                      return (
                        <tr key={tx.id}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {date}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs">
                            {time}
                          </td>
                          <td
                            className="px-3 py-2 whitespace-nowrap truncate max-w-[150px]"
                            title={merchantDisplay}
                          >
                            {merchantDisplay}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">
                            {tx.merchantId || "N/A"}
                          </td>
                          <td
                            className="px-3 py-2 whitespace-nowrap font-mono text-xs truncate max-w-[100px]"
                            title={tx.id}
                          >
                            {tx.id}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right font-medium">
                            {tx.type === "Credit" ||
                            (tx.type === "Adjustment" && tx.amount > 0)
                              ? "+"
                              : "-"}
                            {formatCurrency(Math.abs(tx.amount))}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            {renderStatusBadge(tx.status, "transaction")}
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

        {/* Footer */}
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 flex items-center justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      {/* Hidden print view for A4 paper */}
      <div style={{ display: "none", position: "absolute", left: "-9999px" }}>
        {account && qrCodeString && (
          <QrCodePrintable
            ref={qrCodeA4PrintRef}
            qrCodeString={qrCodeString}
            account={account}
            copies={8}
          />
        )}
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
