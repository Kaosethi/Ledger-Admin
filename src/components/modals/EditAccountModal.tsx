// src/components/modals/EditAccountModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import type { Account } from '@/lib/mockData';
import { formatCurrency, formatDate, renderStatusBadge } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react'; // Import QR Code component
import { useReactToPrint } from 'react-to-print'; // Import print hook

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAccount: Account) => void; // Callback for ALL save actions (balance, pin, status)
  account: Account | null;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({ isOpen, onClose, onSave, account }) => {
  // State for editable fields
  const [balanceStr, setBalanceStr] = useState('');
  const [newPin, setNewPin] = useState(''); // State for the PIN reset input

  // State for QR code data - used for regeneration simulation
  const [qrCodeValue, setQrCodeValue] = useState('');

  // Ref for the QR Code container to print
  const qrCodePrintRef = useRef<HTMLDivElement>(null);

  // Effect to populate form and QR code when modal opens or account changes
  useEffect(() => {
    if (account && isOpen) {
      setBalanceStr(account.balance?.toString() || '0');
      setNewPin(''); // Clear PIN field on open
      // Set initial QR code value (e.g., account ID)
      // Add a timestamp or version for regeneration simulation
      setQrCodeValue(`${account.id}?v=${Date.now()}`);
    }
  }, [account, isOpen]);

  // --- Print QR Handler ---
  const handlePrintQr = useReactToPrint({
    content: () => qrCodePrintRef.current as React.ReactInstance | null,
    documentTitle: `QR-Code-${account?.id || 'Account'}`,
    removeAfterPrint: true,
  });

  // --- Action Handlers ---

  // Handles saving changes made to Balance and potentially PIN
  const handleSaveChanges = () => {
    if (!account) return;

    const balanceNum = parseFloat(balanceStr);
    if (isNaN(balanceNum) || balanceNum < 0) {
      alert('Please enter a valid non-negative balance.');
      return;
    }
    if (newPin && (newPin.length !== 4 || !/^\d{4}$/.test(newPin))) {
        alert('PIN must be exactly 4 digits.');
        return;
    }

    // Construct the updated account object
    const updatedAccount: Account = {
      ...account,
      balance: balanceNum,
      // IMPORTANT: PIN handling is simulated here.
      // In a real app, send the new PIN to the backend for secure hashing & storage.
      // Do NOT store raw PINs or simple hashes client-side long-term.
      // We'll just include it here conceptually. If pinHash exists on type add it here.
      // ...(newPin && { pinHash: `HASH_OF_${newPin}` }), // Example conceptual update
      updatedAt: new Date().toISOString(),
    };

    console.log("Saving Balance/PIN Changes:", updatedAccount); // Log for debugging
    alert(`PIN reset simulated. In a real app, this requires secure backend handling.`);
    onSave(updatedAccount); // Call parent save function
    // Keep modal open after saving these fields? Or close? Let's keep it open for now.
    // onClose(); // Optionally close modal after save
  };

  // Handles Suspend/Reactivate button click
  const handleToggleStatus = () => {
    if (!account) return;

    // Determine the new status
    const newStatus: Account['status'] = account.status === 'Active' ? 'Suspended' : 'Active'; // Toggle between Active and Suspended
    const actionText = newStatus === 'Suspended' ? 'Suspend' : 'Reactivate';

    if (!window.confirm(`Are you sure you want to ${actionText.toLowerCase()} account ${account.id}?`)) {
        return; // User cancelled
    }

    const updatedAccount: Account = {
      ...account,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    console.log(`Toggling Status to ${newStatus} for Account:`, updatedAccount);
    onSave(updatedAccount); // Call parent save function with status update
    // Keep modal open to reflect new status? Or close? Let's keep it open.
  };

  // Simulates regenerating the QR code data
  const handleRegenerateQr = () => {
    if (!account) return;
    console.log("Regenerating QR Code for:", account.id);
    // Simulate regeneration by updating the value with a new timestamp/version
    const newQrValue = `${account.id}?v=${Date.now()}`;
    setQrCodeValue(newQrValue);
    alert('QR Code regenerated (simulated). In a real app, update relevant backend data if needed.');
    // Optionally trigger a save if QR data needs persistence
    // onSave({ ...account, qrDataField: newQrValue, updatedAt: new Date().toISOString() });
  };


  if (!isOpen || !account) {
    return null;
  }

  // Determine text/style for Suspend/Reactivate button
  const isActive = account.status === 'Active';
  const toggleStatusButtonText = isActive ? 'Suspend Account' : 'Reactivate Account';
  const toggleStatusButtonClass = isActive
    ? "w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500" // Suspend button style
    : "w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"; // Reactivate button style

  return (
    // Overlay
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-start py-10">
      {/* Modal Panel - Allow scrolling within the modal */}
      <div className="relative mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white my-auto">
        {/* Modal Header with Close Button */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Account Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Modal Body - Split into sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* Left Column: Beneficiary Info */}
          <div className="space-y-3">
            <h4 className="text-md font-semibold text-gray-700 mb-2">Beneficiary Information</h4>
            <dl className="divide-y divide-gray-100">
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"> <dt className="text-sm font-medium text-gray-500">Account ID</dt> <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{account.id}</dd> </div>
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"> <dt className="text-sm font-medium text-gray-500">Child Name</dt> <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{account.name}</dd> </div>
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"> <dt className="text-sm font-medium text-gray-500">Guardian Name</dt> <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{account.guardianName || 'N/A'}</dd> </div>
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"> <dt className="text-sm font-medium text-gray-500">Status</dt> <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{renderStatusBadge(account.status, 'account')}</dd> </div>
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"> <dt className="text-sm font-medium text-gray-500">Created</dt> <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(account.createdAt)}</dd> </div>
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4"> <dt className="text-sm font-medium text-gray-500">Last Transaction</dt> <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(account.lastTransactionAt)}</dd> </div>
            </dl>
          </div>

          {/* Right Column: Management & QR */}
          <div className="space-y-6">
             {/* Account Management Section */}
             <div className="p-4 border rounded-md">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Account Management</h4>
                <div className="space-y-4">
                   {/* Balance */}
                  <div>
                    <label htmlFor="edit-balance" className="block text-sm font-medium text-gray-700">Balance</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">$</span></div>
                      <input type="number" id="edit-balance" value={balanceStr} onChange={(e) => setBalanceStr(e.target.value)} className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm" placeholder="0.00" step="0.01" min="0" required />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">USD</span></div>
                    </div>
                  </div>
                  {/* Reset PIN */}
                  <div>
                    <label htmlFor="reset-pin" className="block text-sm font-medium text-gray-700">Reset PIN <span className="text-xs text-gray-500">(Leave blank to keep current)</span></label>
                    <input type="password" id="reset-pin" value={newPin} onChange={(e) => setNewPin(e.target.value)} maxLength={4} pattern="[0-9]{4}" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary text-sm" placeholder="Enter new 4-digit PIN" />
                  </div>
                  {/* Status Actions */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Account Status Actions</label>
                     <button
                       type="button"
                       onClick={handleToggleStatus}
                       className={toggleStatusButtonClass}
                     >
                       {toggleStatusButtonText}
                     </button>
                   </div>
                </div>
             </div>

             {/* QR Code Section */}
              <div className="p-4 border rounded-md">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Account QR Code</h4>
                {/* QR Code Display Area (referenced for printing) */}
                <div ref={qrCodePrintRef} className="flex justify-center items-center bg-gray-100 p-4 rounded mb-3 min-h-[180px]">
                  <QRCodeSVG
                      value={qrCodeValue} // Use state variable for potential regeneration
                      size={128}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"L"}
                      includeMargin={true}
                  />
                </div>
                {/* QR Action Buttons */}
                <div className="flex justify-center space-x-3">
                   <button
                     type="button"
                     onClick={handleRegenerateQr}
                     className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                   >
                     Regenerate QR
                   </button>
                   <button
                     type="button"
                     onClick={() => handlePrintQr()} // Use the specific print handler for QR
                     className="py-1 px-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                   >
                     Print QR
                   </button>
                </div>
                <p className="mt-2 text-xs text-gray-500 text-center">Use regenerate if card lost/stolen. Print for replacement.</p>
              </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button" onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          > Cancel </button>
          {/* Save button only handles Balance/PIN now */}
          <button
            type="button" onClick={handleSaveChanges}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          > Save Changes </button>
        </div>
      </div>
    </div>
  );
};

export default EditAccountModal;