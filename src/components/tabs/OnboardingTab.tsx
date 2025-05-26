// src/components/tabs/OnboardingTab.tsx
// MODIFIED: Changed currency symbols and codes from USD/$ to THB/฿ in relevant places.

import React, { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint } from "react-to-print";
import type { Account } from "@/lib/mockData"; // Ensure path is correct
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Added Card components
import { Input } from "@/components/ui/input"; // Added Input
import { Label } from "@/components/ui/label"; // Added Label
import { Button } from "@/components/ui/button"; // Added Button
import { Textarea } from "@/components/ui/textarea"; // Added Textarea
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert components
import { AlertCircle, CheckCircle2, Terminal } from "lucide-react"; // Icons for Alert
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
// ADDED: Import formatCurrency to potentially use it for consistency if desired later,
// though current changes are direct string replacements.
import { formatCurrency } from "@/lib/utils";

interface OnboardingTabProps {
  accounts: Account[];
  onAccountAdd: (newAccount: Account) => void;
  onAccountError?: (error: string) => void;
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
  onAccountError,
  logAdminActivity,
}) => {
  // --- State ---
  const [guardianName, setGuardianName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianDobYear, setGuardianDobYear] = useState<string>("");
  const [guardianDobMonth, setGuardianDobMonth] = useState<string>("");
  const [guardianDobDay, setGuardianDobDay] = useState<string>("");
  const [guardianContact, setGuardianContact] = useState("");
  const [guardianAddress, setGuardianAddress] = useState("");
  const [childName, setChildName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [initialBalanceStr, setInitialBalanceStr] = useState("");
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [showQrPreview, setShowQrPreview] = useState(false);
  const [formMessage, setFormMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Create a mutation function using React Query
  const createAccountMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create account");
      }

      return await res.json();
    },
    onSuccess: (createdAccount) => {
      // Remove pin from local object for security
      const { pin, ...accountWithoutPin } = createdAccount;

      // Add created account to local state
      onAccountAdd(accountWithoutPin);

      // MODIFIED: Changed $ to ฿ for logging
      logAdminActivity(
        "Onboard Account",
        "Account",
        accountWithoutPin.id,
        `Registered ${accountWithoutPin.childName} (Guardian: ${
          accountWithoutPin.guardianName
        }) with initial balance ฿${
          typeof accountWithoutPin.balance === "number"
            ? accountWithoutPin.balance.toFixed(2)
            : "0.00"
        }`
      );

      setFormMessage({
        type: "success",
        text: `Account ${accountWithoutPin.id} for ${accountWithoutPin.childName} registered successfully!`,
      });

      resetForm();
    },
    onError: (error: Error) => {
      console.error("Error during account registration:", error);

      const errorMsg =
        error.message ||
        "An error occurred during registration. Please check the console.";
      setFormMessage({
        type: "error",
        text: errorMsg,
      });

      // Call the onAccountError prop if it exists
      if (onAccountError) {
        onAccountError(errorMsg);
      }
    },
  });

  // --- Handlers ---

  // Fetch signed QR payload from backend
  async function getSignedQrPayload(payload: object) {
    const res = await fetch("/api/qr-sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to sign QR payload");
    return await res.json();
  }

  const handleGenerateId = () => {
    setFormMessage(null);
    const year = new Date().getFullYear();
    let newId = "";
    let attempts = 0;
    const maxAttempts = 10;
    const generateRandomChars = (length: number) => {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      return result;
    };
    do {
      newId = `STC-${year}-${generateRandomChars(4)}`;
      attempts++;
    } while (
      accounts.some((acc) => acc.id === newId) &&
      attempts < maxAttempts
    );
    if (attempts >= maxAttempts) {
      setFormMessage({
        type: "error",
        text: "Failed to generate unique Account ID. Please try again.",
      });
      setAccountId("");
    } else {
      setAccountId(newId);
      setQrCodeValue("");
      setShowQrPreview(false);
    }
  };

  const handleGenerateQrCode = async () => {
    setFormMessage(null);
    if (!accountId) {
      setFormMessage({
        type: "error",
        text: "Please generate an Account ID first.",
      });
      return;
    }
    try {
      const payload = { type: "pay", account: accountId, ver: 1 };
      const signedPayload = await getSignedQrPayload(payload);
      const qrTokenString = JSON.stringify(signedPayload);
      const base64 = btoa(qrTokenString);
      setQrCodeValue(base64);
      setShowQrPreview(true);
    } catch (e) {
      setFormMessage({ type: "error", text: "Failed to generate QR code." });
    }
  };

  // --- react-to-print hook ---
  const handlePrintQr = useReactToPrint({
    // @ts-expect-error - If TS2353 persists, uncomment this line to suppress the known type issue.
    content: () => qrCodeRef.current,
    documentTitle: `QRCode-${accountId || "NewAccount"}`,
    onAfterPrint: () => {
      if (accountId)
        logAdminActivity(
          "Print QR Code",
          "Account (Onboarding)",
          accountId,
          `Printed QR for ${childName || "N/A"}`
        );
    },
  });
  // --- End react-to-print hook ---

  const resetForm = () => {
    setGuardianName("");
    setGuardianEmail("");
    setGuardianDobYear("");
    setGuardianDobMonth("");
    setGuardianDobDay("");
    setGuardianContact("");
    setGuardianAddress("");
    setChildName("");
    setAccountId("");
    setPin("");
    setConfirmPin("");
    setInitialBalanceStr("");
    setQrCodeValue("");
    setShowQrPreview(false);
    setFormMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage(null);

    // --- Validation ---
    if (!accountId) {
      setFormMessage({ type: "error", text: "Account ID must be generated." });
      return;
    }
    if (!guardianName.trim()) {
      setFormMessage({
        type: "error",
        text: "Guardian's Full Name is required.",
      });
      return;
    }
    if (!childName.trim()) {
      setFormMessage({ type: "error", text: "Child's Full Name is required." });
      return;
    }
    if (guardianEmail && !/^\S+@\S+\.\S+$/.test(guardianEmail)) {
      setFormMessage({ type: "error", text: "Invalid email format." });
      return;
    }
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setFormMessage({ type: "error", text: "PIN must be exactly 4 digits." });
      return;
    }
    if (pin !== confirmPin) {
      setFormMessage({ type: "error", text: "PINs do not match." });
      return;
    }
    if (accounts.some((acc) => acc.id === accountId)) {
      setFormMessage({
        type: "error",
        text: `Account ID ${accountId} already exists. Please generate a new one.`,
      });
      setAccountId("");
      setQrCodeValue("");
      setShowQrPreview(false);
      return;
    }
    const balance =
      initialBalanceStr === "" ? 0 : parseFloat(initialBalanceStr);
    if (isNaN(balance) || balance < 0) {
      setFormMessage({ type: "error", text: "Invalid Initial Balance." });
      return;
    }

    // --- Build payload for API ---
    const payload: any = {
      id: accountId,
      displayId: accountId,
      childName: childName.trim(),
      guardianName: guardianName.trim(),
      status: "Active",
      pin: pin,
      currentQrToken: qrCodeValue,
      email: guardianEmail.trim() || null,
      guardianDob:
        guardianDobYear && guardianDobMonth && guardianDobDay
          ? `${guardianDobYear}-${guardianDobMonth}-${guardianDobDay}`
          : null,
      guardianContact: guardianContact.trim() || null,
      address: guardianAddress.trim() || null,
    };

    // Optionally add balance if your backend supports it
    if (!isNaN(balance)) payload.balance = balance;

    // Submit the mutation
    createAccountMutation.mutate(payload);
  };

  // --- JSX ---
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">New Beneficiary Registration</CardTitle>
        <CardDescription>
          Register a new child beneficiary via their guardian.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Form Message - Replaced with Alert */}
        {formMessage && (
          <Alert
            variant={formMessage.type === "error" ? "destructive" : "default"}
            className="mb-6"
          >
            {formMessage.type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertTitle>
              {formMessage.type === "error" ? "Error" : "Success"}
            </AlertTitle>
            <AlertDescription>{formMessage.text}</AlertDescription>
          </Alert>
        )}
        <form
          id="onboarding-form"
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column (Guardian/Child Info) */}
            <div className="space-y-4">
              {/* Guardian/Child Fields - Replaced with shadcn components */}
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                Guardian&apos;s Information
              </h3>
              <div className="space-y-2">
                <Label htmlFor="guardian-name">Guardian&apos;s Full Name</Label>
                <Input
                  id="guardian-name"
                  required
                  placeholder="Guardian's Full Name"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian-email">Guardian&apos;s Email</Label>
                <Input
                  type="email"
                  id="guardian-email"
                  placeholder="email@example.com"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian-dob">
                  Guardian&apos;s Date of Birth
                </Label>
                <div className="flex gap-2">
                  {/* Year Selector */}
                  <Select
                    value={guardianDobYear}
                    onValueChange={setGuardianDobYear}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {Array.from({ length: 100 }, (_, i) => {
                        const thisYear = new Date().getFullYear();
                        const maxYear = thisYear - 18;
                        const year = maxYear - i;
                        return (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {/* Month Selector */}
                  <Select
                    value={guardianDobMonth}
                    onValueChange={setGuardianDobMonth}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem
                          key={i + 1}
                          value={String(i + 1).padStart(2, "0")}
                        >
                          {new Date(2000, i, 1).toLocaleString("default", {
                            month: "short",
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Day Selector */}
                  <Select
                    value={guardianDobDay}
                    onValueChange={setGuardianDobDay}
                    disabled={!guardianDobYear || !guardianDobMonth}
                  >
                    <SelectTrigger
                      className="w-20"
                      disabled={!guardianDobYear || !guardianDobMonth}
                    >
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {(() => {
                        const daysInMonth =
                          guardianDobYear && guardianDobMonth
                            ? new Date(
                                Number(guardianDobYear),
                                Number(guardianDobMonth),
                                0
                              ).getDate()
                            : 31;
                        return Array.from({ length: daysInMonth }, (_, i) => (
                          <SelectItem
                            key={i + 1}
                            value={String(i + 1).padStart(2, "0")}
                          >
                            {i + 1}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian-contact">
                  Guardian&apos;s Contact Number
                </Label>
                <Input
                  type="tel"
                  id="guardian-contact"
                  placeholder="Contact number"
                  value={guardianContact}
                  onChange={(e) => setGuardianContact(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian-address">Address</Label>
                <Textarea
                  id="guardian-address"
                  rows={3}
                  placeholder="Enter address"
                  value={guardianAddress}
                  onChange={(e) => setGuardianAddress(e.target.value)}
                />
              </div>

              <h3 className="text-lg font-medium text-foreground border-b pb-2 pt-4">
                Child&apos;s Information
              </h3>
              <div className="space-y-2">
                <Label htmlFor="child-name">Child&apos;s Full Name</Label>
                <Input
                  id="child-name"
                  required
                  placeholder="Child's Full Name"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                />
              </div>
            </div>

            {/* Right Column (Account Setup/QR) */}
            <div className="space-y-4">
              {/* Account Setup Fields - Replaced with shadcn components */}
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                Account Setup
              </h3>
              <div className="space-y-2">
                <Label htmlFor="account-id">Account ID</Label>
                {/* Improved Input with Button styling */}
                <div className="flex w-full items-center space-x-2">
                  <Input
                    type="text"
                    id="account-id"
                    readOnly
                    className="bg-muted text-muted-foreground flex-1"
                    placeholder="Click Generate ->"
                    value={accountId}
                  />
                  <Button
                    type="button"
                    id="generate-account-id-btn"
                    variant="outline"
                    onClick={handleGenerateId}
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-generated unique identifier.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">4-Digit PIN</Label>
                <Input
                  type="password"
                  id="pin"
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  inputMode="numeric"
                  placeholder="Enter 4-digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pin">Confirm PIN</Label>
                <Input
                  type="password"
                  id="confirm-pin"
                  required
                  maxLength={4}
                  pattern="\d{4}"
                  inputMode="numeric"
                  placeholder="Confirm 4-digit PIN"
                  value={confirmPin}
                  onChange={(e) =>
                    setConfirmPin(e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initial-balance">
                  Initial Balance (Optional)
                </Label>
                <div className="relative">
                  {/* MODIFIED: Changed $ to ฿ */}
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground sm:text-sm">
                    ฿
                  </span>
                  <Input
                    type="number"
                    id="initial-balance"
                    className="pl-7 pr-12" // Ensure padding accommodates symbol
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={initialBalanceStr}
                    onChange={(e) => setInitialBalanceStr(e.target.value)}
                  />
                  {/* MODIFIED: Changed USD to THB */}
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-muted-foreground sm:text-sm">
                    THB
                  </span>
                </div>
              </div>

              {/* QR Code Section */}
              <Card className="mt-6 bg-muted/30">
                {}
                <CardHeader>
                  <CardTitle className="text-lg">Account QR Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="button"
                    id="generate-qr-btn"
                    variant="secondary"
                    disabled={!accountId || showQrPreview}
                    className="w-full"
                    onClick={handleGenerateQrCode}
                  >
                    {qrCodeValue ? "QR Code Generated" : "Generate QR Code"}
                  </Button>
                  {!accountId && (
                    <p className="text-xs text-muted-foreground text-center">
                      Generate Account ID first.
                    </p>
                  )}

                  <div
                    id="qr-preview"
                    className={`mt-4 ${showQrPreview ? "" : "hidden"}`}
                  >
                    <div className="flex flex-col items-center space-y-4">
                      {/* QR Code display */}
                      <div
                        ref={qrCodeRef}
                        className="bg-white p-2 rounded-md inline-block border"
                      >
                        {qrCodeValue && (
                          <QRCodeSVG
                            value={qrCodeValue}
                            size={128}
                            level={"H"}
                            includeMargin={true}
                          />
                        )}
                      </div>
                      {/* Details */}
                      <div className="space-y-1 text-center text-sm text-muted-foreground">
                        <p>
                          Account ID:{}
                          <span className="font-medium text-foreground break-all">
                            {accountId}
                          </span>
                        </p>
                        <p>
                          Child&apos;s Name:{}
                          <span className="font-medium text-foreground">
                            {childName || "N/A"}
                          </span>
                        </p>
                        <p>
                          Guardian:{}
                          <span className="font-medium text-foreground">
                            {guardianName || "N/A"}
                          </span>
                        </p>
                        <p>
                          Initial Balance:{}
                          {/* MODIFIED: Changed $ to ฿ */}
                          <span className="font-medium text-foreground">
                            ฿
                            {(initialBalanceStr === ""
                              ? 0
                              : parseFloat(initialBalanceStr) || 0
                            ).toFixed(2)}
                          </span>
                        </p>
                      </div>
                      {/* Print Button */}
                      <Button
                        type="button"
                        id="print-onboarding-qr-btn"
                        variant="outline"
                        size="sm"
                        disabled={!qrCodeValue}
                        onClick={() => handlePrintQr && handlePrintQr()}
                      >
                        Print QR Code
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Submit Button moved to CardFooter */}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end pt-4 border-t mt-6">
        <Button
          type="submit"
          form="onboarding-form"
          size="lg"
          disabled={createAccountMutation.isPending}
        >
          {createAccountMutation.isPending ? (
            <span className="flex items-center gap-1">
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
              Registering...
            </span>
          ) : (
            "Register Beneficiary Account"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OnboardingTab;
