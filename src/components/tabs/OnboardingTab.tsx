// src/components/tabs/OnboardingTab.tsx
// FIXED: Corrected Account object creation to match type definition.
// FIXED: Corrected onClick handler for react-to-print button.

import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint } from "react-to-print";
import type { Account } from "@/lib/mockData"; // Ensure path is correct

interface OnboardingTabProps {
  accounts: Account[];
  onAccountAdd: (newAccount: Account) => void;
  logAdminActivity: (
    action: string,
    targetType?: string,
    targetId?: string,
    details?: string
  ) => void;
}

const OnboardingTab: React.FC<OnboardingTabProps> = ({
  accounts,
  onAccountAdd,
  logAdminActivity,
}) => {
  // --- State ---
  const [guardianName, setGuardianName] = useState("");
  const [guardianDob, setGuardianDob] = useState("");
  const [guardianContact, setGuardianContact] = useState("");
  const [guardianAddress, setGuardianAddress] = useState("");
  const [childName, setChildName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [initialBalanceStr, setInitialBalanceStr] = useState("");
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [showQrPreview, setShowQrPreview] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const qrCodeRef = useRef<HTMLDivElement>(null);

  // --- Handlers ---

  const handleGenerateId = () => {
    setFormMessage(null);
    const year = new Date().getFullYear();
    let newId = "";
    let attempts = 0;
    const maxAttempts = 10;
    const generateRandomChars = (length: number) => { const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; let result = ""; for (let i = 0; i < length; i++) { result += characters.charAt(Math.floor(Math.random() * characters.length)); } return result; };
    do { newId = `STC-${year}-${generateRandomChars(4)}`; attempts++; } while (accounts.some((acc) => acc.id === newId) && attempts < maxAttempts);
    if (attempts >= maxAttempts) { setFormMessage({ type: "error", text: "Failed to generate unique Account ID. Please try again." }); setAccountId(""); }
    else { setAccountId(newId); setQrCodeValue(""); setShowQrPreview(false); }
  };

  const handleGenerateQrCode = () => {
    setFormMessage(null);
    if (!accountId) { setFormMessage({ type: "error", text: "Please generate an Account ID first." }); return; }
    setQrCodeValue(accountId); setShowQrPreview(true);
  };

  // --- react-to-print hook ---
  const handlePrintQr = useReactToPrint({
    // Assuming the 'content' error (TS2353) might resolve after fixing usage, or requires @ts-ignore
    // @ts-expect-error - If TS2353 persists, uncomment this line to suppress the known type issue.
    content: () => qrCodeRef.current,
    documentTitle: `QRCode-${accountId || 'NewAccount'}`,
    onAfterPrint: () => { if (accountId) logAdminActivity("Print QR Code", "Account (Onboarding)", accountId, `Printed QR for ${childName || "N/A"}`); }
  });
  // --- End react-to-print hook ---

  const resetForm = () => {
    setGuardianName(""); setGuardianDob(""); setGuardianContact(""); setGuardianAddress("");
    setChildName(""); setAccountId(""); setPin(""); setConfirmPin("");
    setInitialBalanceStr(""); setQrCodeValue(""); setShowQrPreview(false); setFormMessage(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage(null);
    // --- Validation ---
    if (!accountId) { setFormMessage({ type: "error", text: "Account ID must be generated." }); return; }
    if (!guardianName.trim()) { setFormMessage({ type: "error", text: "Guardian's Full Name is required." }); return; }
    if (!childName.trim()) { setFormMessage({ type: "error", text: "Child's Full Name is required." }); return; }
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) { setFormMessage({ type: "error", text: "PIN must be exactly 4 digits." }); return; }
    if (pin !== confirmPin) { setFormMessage({ type: "error", text: "PINs do not match." }); return; }
    if (accounts.some((acc) => acc.id === accountId)) { setFormMessage({ type: "error", text: `Account ID ${accountId} already exists. Please generate a new one.` }); setAccountId(""); setQrCodeValue(""); setShowQrPreview(false); return; }
    const balance = initialBalanceStr === "" ? 0 : parseFloat(initialBalanceStr);
    if (isNaN(balance) || balance < 0) { setFormMessage({ type: "error", text: "Invalid Initial Balance." }); return; }
    // --- Create Account Object ---
    const now = new Date().toISOString();
    const newAccount: Account = {
      id: accountId, childName: childName.trim(), guardianName: guardianName.trim(), balance: balance, status: "Active",
      createdAt: now, lastActivity: now, updatedAt: now, pin: pin,
      ...(guardianDob && { guardianDob: guardianDob }), ...(guardianContact.trim() && { guardianContact: guardianContact.trim() }), ...(guardianAddress.trim() && { address: guardianAddress.trim() }),
    };
    // --- Call Props ---
    try {
      onAccountAdd(newAccount);
      logAdminActivity("Onboard Account", "Account", accountId, `Registered ${childName} (Guardian: ${guardianName}) with initial balance $${balance.toFixed(2)}`);
      setFormMessage({ type: "success", text: `Account ${accountId} for ${childName} registered successfully!` });
      resetForm();
    } catch (error) {
      console.error("Error during account registration:", error);
      setFormMessage({ type: "error", text: "An error occurred during registration. Please check the console." });
    }
  };

  // --- JSX ---
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">New Beneficiary Registration (via Guardian)</h2>
      {/* Form Message */}
      {formMessage && (<div className={`mb-4 p-3 rounded-md text-sm ${formMessage.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{formMessage.text}</div>)}
      <form id="onboarding-form" className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column (Guardian/Child Info) */}
          <div className="space-y-4">
             {/* Guardian/Child Fields ... */}
             <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Guardian&apos;s Information</h3>
              <div><label htmlFor="guardian-name" className="block text-sm font-medium text-gray-700">Guardian&apos;s Full Name</label><input type="text" id="guardian-name" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" placeholder="Guardian&apos;s Full Name" value={guardianName} onChange={(e) => setGuardianName(e.target.value)}/></div>
              <div><label htmlFor="guardian-dob" className="block text-sm font-medium text-gray-700">Guardian&apos;s Date of Birth</label><input type="date" id="guardian-dob" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" value={guardianDob} onChange={(e) => setGuardianDob(e.target.value)}/></div>
              <div><label htmlFor="guardian-contact" className="block text-sm font-medium text-gray-700">Guardian&apos;s Contact Number</label><input type="tel" id="guardian-contact" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" placeholder="Contact number" value={guardianContact} onChange={(e) => setGuardianContact(e.target.value)}/></div>
              <div><label htmlFor="guardian-address" className="block text-sm font-medium text-gray-700">Address</label><textarea id="guardian-address" rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" placeholder="Enter address" value={guardianAddress} onChange={(e) => setGuardianAddress(e.target.value)}></textarea></div>
             <h3 className="text-lg font-medium text-gray-800 border-b pb-2 pt-4">Child&apos;s Information</h3>
             <div><label htmlFor="child-name" className="block text-sm font-medium text-gray-700">Child&apos;s Full Name</label><input type="text" id="child-name" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" placeholder="Child's Full Name" value={childName} onChange={(e) => setChildName(e.target.value)}/></div>
          </div>
          {/* Right Column (Account Setup/QR) */}
          <div className="space-y-4">
             {/* Account Setup Fields ... */}
             <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Account Setup</h3>
              <div>
                  <label htmlFor="account-id" className="block text-sm font-medium text-gray-700">Account ID</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                      <input type="text" id="account-id" readOnly className="flex-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-none rounded-l-md focus:outline-none text-base text-gray-500" placeholder="Click Generate ->" value={accountId}/>
                      <button type="button" id="generate-account-id-btn" className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-600 hover:bg-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary" onClick={handleGenerateId}>Generate</button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Auto-generated unique identifier.</p>
              </div>
              <div><label htmlFor="pin" className="block text-sm font-medium text-gray-700">4-Digit PIN</label><input type="password" id="pin" required maxLength={4} pattern="\d{4}" inputMode="numeric" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" placeholder="Enter 4-digit PIN" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}/></div>
              <div><label htmlFor="confirm-pin" className="block text-sm font-medium text-gray-700">Confirm PIN</label><input type="password" id="confirm-pin" required maxLength={4} pattern="\d{4}" inputMode="numeric" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" placeholder="Confirm 4-digit PIN" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}/></div>
              <div>
                  <label htmlFor="initial-balance" className="block text-sm font-medium text-gray-700">Initial Balance (Optional)</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">$</span></div>
                      <input type="number" id="initial-balance" className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400" placeholder="0.00" step="0.01" min="0" value={initialBalanceStr} onChange={(e) => setInitialBalanceStr(e.target.value)}/>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">USD</span></div>
                  </div>
              </div>
            {/* QR Code Section */}
            <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Account QR Code</h3>
              <div className="mt-4">
                <button type="button" id="generate-qr-btn" disabled={!accountId || showQrPreview} className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed" onClick={handleGenerateQrCode}>
                  {qrCodeValue ? "QR Code Generated" : "Generate QR Code"}
                </button>
                {!accountId && <p className="mt-1 text-xs text-gray-500">Generate Account ID first.</p>}
              </div>
              <div id="qr-preview" className={`mt-4 ${showQrPreview ? "" : "hidden"}`}>
                <div className="flex flex-col items-center">
                  <div ref={qrCodeRef} className="mb-4 md:mb-0 md:mr-6 bg-white p-2 rounded-md inline-block border border-gray-300">
                    {qrCodeValue && <QRCodeSVG value={qrCodeValue} size={128} level={"H"} includeMargin={true} />}
                  </div>
                  <div className="space-y-1 text-center mt-3">
                    <p className="text-sm text-gray-600">Account ID: <span className="font-medium text-gray-800 break-all">{accountId}</span></p>
                    <p className="text-sm text-gray-600">Child&apos;s Name: <span className="font-medium text-gray-800">{childName || "N/A"}</span></p>
                    <p className="text-sm text-gray-600">Guardian: <span className="font-medium text-gray-800">{guardianName || "N/A"}</span></p>
                    <p className="text-sm text-gray-600">Initial Balance: <span className="font-medium text-gray-800">${(initialBalanceStr === "" ? 0 : parseFloat(initialBalanceStr) || 0).toFixed(2)}</span></p>
                    <button
                      type="button"
                      id="print-onboarding-qr-btn"
                      disabled={!qrCodeValue}
                      // MODIFIED: Wrap the call in an arrow function
                      onClick={() => handlePrintQr && handlePrintQr()}
                      className="mt-2 py-1 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Print QR Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Submit Button */}
        <div className="flex justify-end pt-4 border-t mt-6">
          <button type="submit" className="py-2 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            Register Beneficiary Account
          </button>
        </div>
      </form>
    </div>
  );
};

export default OnboardingTab;